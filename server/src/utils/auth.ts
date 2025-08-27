/**
 * Authentication utilities
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash SMASH pattern with salt
 */
export function hashSmashPattern(pattern: string, salt?: string): { hash: string; salt: string } {
  const patternSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pattern, patternSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: patternSalt };
}

/**
 * Verify SMASH pattern against hash
 */
export function verifySmashPattern(pattern: string, hash: string, salt: string): boolean {
  const { hash: newHash } = hashSmashPattern(pattern, salt);
  return newHash === hash;
}

/**
 * Calculate typing dynamics similarity
 */
export function calculateTypingDynamicsSimilarity(
  stored: { averageSpeed: number; speedVariance: number; keyTimingProfile: number[] },
  current: { averageSpeed: number; speedVariance: number; keyTimingProfile: number[] }
): number {
  // Speed similarity (normalized)
  const speedDiff = Math.abs(stored.averageSpeed - current.averageSpeed);
  const speedSimilarity = Math.max(0, 1 - (speedDiff / Math.max(stored.averageSpeed, current.averageSpeed)));
  
  // Variance similarity
  const varianceDiff = Math.abs(stored.speedVariance - current.speedVariance);
  const varianceSimilarity = Math.max(0, 1 - (varianceDiff / Math.max(stored.speedVariance, current.speedVariance)));
  
  // Key timing similarity (cosine similarity)
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  const minLength = Math.min(stored.keyTimingProfile.length, current.keyTimingProfile.length);
  
  for (let i = 0; i < minLength; i++) {
    dotProduct += stored.keyTimingProfile[i] * current.keyTimingProfile[i];
    normA += stored.keyTimingProfile[i] * stored.keyTimingProfile[i];
    normB += current.keyTimingProfile[i] * current.keyTimingProfile[i];
  }
  
  const timingSimilarity = normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
  
  // Weighted average
  return (speedSimilarity * 0.3 + varianceSimilarity * 0.3 + timingSimilarity * 0.4);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
}

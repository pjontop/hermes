"use strict";
/**
 * Authentication utilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateToken = generateToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyToken = verifyToken;
exports.generateEmailVerificationToken = generateEmailVerificationToken;
exports.generatePasswordResetToken = generatePasswordResetToken;
exports.hashSmashPattern = hashSmashPattern;
exports.verifySmashPattern = verifySmashPattern;
exports.calculateTypingDynamicsSimilarity = calculateTypingDynamicsSimilarity;
exports.isValidEmail = isValidEmail;
exports.isValidPassword = isValidPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const SALT_ROUNDS = 12;
/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, SALT_ROUNDS);
}
/**
 * Verify a password against its hash
 */
async function verifyPassword(password, hash) {
    return bcrypt_1.default.compare(password, hash);
}
/**
 * Generate a JWT token
 */
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
/**
 * Generate a refresh token
 */
function generateRefreshToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
/**
 * Generate email verification token
 */
function generateEmailVerificationToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Generate password reset token
 */
function generatePasswordResetToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Hash SMASH pattern with salt
 */
function hashSmashPattern(pattern, salt) {
    const patternSalt = salt || crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.pbkdf2Sync(pattern, patternSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: patternSalt };
}
/**
 * Verify SMASH pattern against hash
 */
function verifySmashPattern(pattern, hash, salt) {
    const { hash: newHash } = hashSmashPattern(pattern, salt);
    return newHash === hash;
}
/**
 * Calculate typing dynamics similarity
 */
function calculateTypingDynamicsSimilarity(stored, current) {
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
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Validate password strength
 */
function isValidPassword(password) {
    const errors = [];
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
//# sourceMappingURL=auth.js.map
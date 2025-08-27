/**
 * Encryption utilities for Hermes Chat
 * Handles RSA key generation and other cryptographic operations
 */

import crypto from 'crypto';

/**
 * Generate RSA key pair for E2E encryption
 */
export async function generateRSAKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      },
      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({ publicKey, privateKey });
        }
      }
    );
  });
}

/**
 * Generate a random AES key
 */
export function generateAESKey(): string {
  return crypto.randomBytes(32).toString('base64'); // 256-bit key
}

/**
 * Generate a random initialization vector
 */
export function generateIV(): string {
  return crypto.randomBytes(16).toString('base64'); // 128-bit IV
}

/**
 * Encrypt data with AES-256-GCM
 */
export function encryptAES(data: string, key: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const keyBuffer = Buffer.from(key, 'base64');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher('aes-256-gcm', keyBuffer);
  cipher.setAAD(iv);
  
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
export function decryptAES(
  encrypted: string,
  key: string,
  iv: string,
  tag: string
): string {
  const keyBuffer = Buffer.from(key, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const tagBuffer = Buffer.from(tag, 'base64');
  
  const decipher = crypto.createDecipher('aes-256-gcm', keyBuffer);
  decipher.setAAD(ivBuffer);
  decipher.setAuthTag(tagBuffer);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash data with SHA-256
 */
export function sha256Hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

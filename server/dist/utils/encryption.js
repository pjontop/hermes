"use strict";
/**
 * Encryption utilities for Hermes Chat
 * Handles RSA key generation and other cryptographic operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRSAKeyPair = generateRSAKeyPair;
exports.generateAESKey = generateAESKey;
exports.generateIV = generateIV;
exports.encryptAES = encryptAES;
exports.decryptAES = decryptAES;
exports.sha256Hash = sha256Hash;
exports.generateSecureToken = generateSecureToken;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate RSA key pair for E2E encryption
 */
async function generateRSAKeyPair() {
    return new Promise((resolve, reject) => {
        crypto_1.default.generateKeyPair('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        }, (err, publicKey, privateKey) => {
            if (err) {
                reject(err);
            }
            else {
                resolve({ publicKey, privateKey });
            }
        });
    });
}
/**
 * Generate a random AES key
 */
function generateAESKey() {
    return crypto_1.default.randomBytes(32).toString('base64'); // 256-bit key
}
/**
 * Generate a random initialization vector
 */
function generateIV() {
    return crypto_1.default.randomBytes(16).toString('base64'); // 128-bit IV
}
/**
 * Encrypt data with AES-256-GCM
 */
function encryptAES(data, key) {
    const keyBuffer = Buffer.from(key, 'base64');
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipher('aes-256-gcm', keyBuffer);
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
function decryptAES(encrypted, key, iv, tag) {
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const tagBuffer = Buffer.from(tag, 'base64');
    const decipher = crypto_1.default.createDecipher('aes-256-gcm', keyBuffer);
    decipher.setAAD(ivBuffer);
    decipher.setAuthTag(tagBuffer);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Hash data with SHA-256
 */
function sha256Hash(data) {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
/**
 * Generate a secure random token
 */
function generateSecureToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
//# sourceMappingURL=encryption.js.map
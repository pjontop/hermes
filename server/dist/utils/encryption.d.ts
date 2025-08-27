/**
 * Encryption utilities for Hermes Chat
 * Handles RSA key generation and other cryptographic operations
 */
/**
 * Generate RSA key pair for E2E encryption
 */
export declare function generateRSAKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
}>;
/**
 * Generate a random AES key
 */
export declare function generateAESKey(): string;
/**
 * Generate a random initialization vector
 */
export declare function generateIV(): string;
/**
 * Encrypt data with AES-256-GCM
 */
export declare function encryptAES(data: string, key: string): {
    encrypted: string;
    iv: string;
    tag: string;
};
/**
 * Decrypt data with AES-256-GCM
 */
export declare function decryptAES(encrypted: string, key: string, iv: string, tag: string): string;
/**
 * Hash data with SHA-256
 */
export declare function sha256Hash(data: string): string;
/**
 * Generate a secure random token
 */
export declare function generateSecureToken(length?: number): string;
//# sourceMappingURL=encryption.d.ts.map
/**
 * End-to-End Encryption Utilities for Hermes Chat
 * 
 * This module provides client-side encryption using Web Crypto API:
 * - RSA-OAEP for key exchange
 * - AES-GCM for message encryption
 * - PBKDF2 for key derivation
 */

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface SerializedKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  encryptedData: string;
  iv: string;
}

export class E2EEncryption {
  private static readonly RSA_KEY_LENGTH = 2048;
  private static readonly AES_KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM

  /**
   * Generate RSA key pair for user
   */
  static async generateKeyPair(): Promise<KeyPair> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: this.RSA_KEY_LENGTH,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      return keyPair;
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw new Error('Failed to generate encryption keys');
    }
  }

  /**
   * Export key pair to strings for storage
   */
  static async exportKeyPair(keyPair: KeyPair): Promise<SerializedKeyPair> {
    try {
      const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      return {
        publicKey: this.arrayBufferToBase64(publicKeyBuffer),
        privateKey: this.arrayBufferToBase64(privateKeyBuffer),
      };
    } catch (error) {
      console.error('Error exporting key pair:', error);
      throw new Error('Failed to export encryption keys');
    }
  }

  /**
   * Import key pair from strings
   */
  static async importKeyPair(serializedKeys: SerializedKeyPair): Promise<KeyPair> {
    try {
      const publicKeyBuffer = this.base64ToArrayBuffer(serializedKeys.publicKey);
      const privateKeyBuffer = this.base64ToArrayBuffer(serializedKeys.privateKey);

      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['encrypt']
      );

      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['decrypt']
      );

      return { publicKey, privateKey };
    } catch (error) {
      console.error('Error importing key pair:', error);
      throw new Error('Failed to import encryption keys');
    }
  }

  /**
   * Import public key from string
   */
  static async importPublicKey(publicKeyString: string): Promise<CryptoKey> {
    try {
      const keyBuffer = this.base64ToArrayBuffer(publicKeyString);
      
      return await window.crypto.subtle.importKey(
        'spki',
        keyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      console.error('Error importing public key:', error);
      throw new Error('Failed to import public key');
    }
  }

  /**
   * Generate AES key for chat encryption
   */
  static async generateAESKey(): Promise<CryptoKey> {
    try {
      return await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: this.AES_KEY_LENGTH,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Error generating AES key:', error);
      throw new Error('Failed to generate AES key');
    }
  }

  /**
   * Export AES key to raw format
   */
  static async exportAESKey(key: CryptoKey): Promise<ArrayBuffer> {
    try {
      return await window.crypto.subtle.exportKey('raw', key);
    } catch (error) {
      console.error('Error exporting AES key:', error);
      throw new Error('Failed to export AES key');
    }
  }

  /**
   * Import AES key from raw format
   */
  static async importAESKey(keyBuffer: ArrayBuffer): Promise<CryptoKey> {
    try {
      return await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        {
          name: 'AES-GCM',
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Error importing AES key:', error);
      throw new Error('Failed to import AES key');
    }
  }

  /**
   * Encrypt AES key with RSA public key
   */
  static async encryptAESKey(aesKey: CryptoKey, publicKey: CryptoKey): Promise<string> {
    try {
      const aesKeyBuffer = await this.exportAESKey(aesKey);
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        aesKeyBuffer
      );

      return this.arrayBufferToBase64(encryptedBuffer);
    } catch (error) {
      console.error('Error encrypting AES key:', error);
      throw new Error('Failed to encrypt AES key');
    }
  }

  /**
   * Decrypt AES key with RSA private key
   */
  static async decryptAESKey(encryptedKey: string, privateKey: CryptoKey): Promise<CryptoKey> {
    try {
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedKey);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
        encryptedBuffer
      );

      return this.importAESKey(decryptedBuffer);
    } catch (error) {
      console.error('Error decrypting AES key:', error);
      throw new Error('Failed to decrypt AES key');
    }
  }

  /**
   * Encrypt message with AES key
   */
  static async encryptMessage(message: string, aesKey: CryptoKey): Promise<EncryptedMessage> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        data
      );

      return {
        encryptedData: this.arrayBufferToBase64(encryptedBuffer),
        iv: this.arrayBufferToBase64(iv.buffer),
      };
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message with AES key
   */
  static async decryptMessage(
    encryptedMessage: EncryptedMessage,
    aesKey: CryptoKey
  ): Promise<string> {
    try {
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedMessage.encryptedData);
      const iv = this.base64ToArrayBuffer(encryptedMessage.iv);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Derive key from password using PBKDF2 (for additional security)
   */
  static async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    iterations: number = 100000
  ): Promise<CryptoKey> {
    try {
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);

      const baseKey = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
      );

      return await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iterations,
          hash: 'SHA-256',
        },
        baseKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Error deriving key from password:', error);
      throw new Error('Failed to derive key from password');
    }
  }

  /**
   * Generate random salt
   */
  static generateSalt(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate a secure random string for chat room keys
   */
  static generateSecureRandomString(length: number = 32): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array.buffer).substring(0, length);
  }

  /**
   * Hash data using SHA-256
   */
  static async hashData(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      return this.arrayBufferToBase64(hashBuffer);
    } catch (error) {
      console.error('Error hashing data:', error);
      throw new Error('Failed to hash data');
    }
  }
}

/**
 * Storage utilities for encryption keys
 */
export class KeyStorage {
  private static readonly KEYS_STORAGE_KEY = 'hermes_encryption_keys';
  private static readonly AES_KEYS_STORAGE_KEY = 'hermes_aes_keys';

  /**
   * Store user's key pair in localStorage (encrypted)
   */
  static async storeKeyPair(keyPair: SerializedKeyPair, password: string): Promise<void> {
    try {
      const salt = E2EEncryption.generateSalt();
      const derivedKey = await E2EEncryption.deriveKeyFromPassword(password, salt);
      
      const keysJson = JSON.stringify(keyPair);
      const encryptedKeys = await E2EEncryption.encryptMessage(keysJson, derivedKey);
      
      const storageData = {
        encryptedKeys,
        salt: E2EEncryption['arrayBufferToBase64'](salt.buffer as ArrayBuffer),
      };
      
      localStorage.setItem(this.KEYS_STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Error storing key pair:', error);
      throw new Error('Failed to store encryption keys');
    }
  }

  /**
   * Retrieve user's key pair from localStorage
   */
  static async retrieveKeyPair(password: string): Promise<SerializedKeyPair | null> {
    try {
      const storageData = localStorage.getItem(this.KEYS_STORAGE_KEY);
      if (!storageData) return null;

      const { encryptedKeys, salt } = JSON.parse(storageData);
      const saltBuffer = E2EEncryption['base64ToArrayBuffer'](salt);
      
      const derivedKey = await E2EEncryption.deriveKeyFromPassword(password, new Uint8Array(saltBuffer));
      const keysJson = await E2EEncryption.decryptMessage(encryptedKeys, derivedKey);
      
      return JSON.parse(keysJson);
    } catch (error) {
      console.error('Error retrieving key pair:', error);
      return null;
    }
  }

  /**
   * Store AES keys for chats
   */
  static storeAESKey(chatId: string, encryptedKey: string): void {
    try {
      const stored = localStorage.getItem(this.AES_KEYS_STORAGE_KEY);
      const keys = stored ? JSON.parse(stored) : {};
      keys[chatId] = encryptedKey;
      localStorage.setItem(this.AES_KEYS_STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Error storing AES key:', error);
    }
  }

  /**
   * Retrieve AES key for chat
   */
  static retrieveAESKey(chatId: string): string | null {
    try {
      const stored = localStorage.getItem(this.AES_KEYS_STORAGE_KEY);
      if (!stored) return null;
      
      const keys = JSON.parse(stored);
      return keys[chatId] || null;
    } catch (error) {
      console.error('Error retrieving AES key:', error);
      return null;
    }
  }

  /**
   * Clear all stored keys
   */
  static clearKeys(): void {
    localStorage.removeItem(this.KEYS_STORAGE_KEY);
    localStorage.removeItem(this.AES_KEYS_STORAGE_KEY);
  }
}

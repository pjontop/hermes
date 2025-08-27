/**
 * Socket.IO Client for Hermes Chat
 * Handles real-time communication with E2E encryption
 */

import { io, Socket } from 'socket.io-client';
import { E2EEncryption, KeyStorage } from './encryption';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  encryptedContent: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  replyToId?: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  replyTo?: {
    id: string;
    encryptedContent: string;
    sender: {
      name: string;
    };
  };
}

export interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: {
    id: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  }[];
  messages: Message[];
}

export interface TypingUser {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ChatSocketEvents {
  // Incoming events
  new_message: (message: Message) => void;
  user_typing: (user: TypingUser) => void;
  message_read: (data: { messageId: string; userId: string; userName: string }) => void;
  key_set_success: () => void;
  error: (error: { message: string }) => void;
  
  // Outgoing events
  join_chat: (chatId: string) => void;
  leave_chat: (chatId: string) => void;
  send_message: (data: {
    chatId: string;
    encryptedContent: string;
    messageType?: string;
    replyToId?: string;
  }) => void;
  typing_start: (chatId: string) => void;
  typing_stop: (chatId: string) => void;
  mark_read: (data: { chatId: string; messageId: string }) => void;
  set_public_key: (publicKey: string) => void;
}

export class ChatSocket {
  private socket: Socket | null = null;
  private token: string | null = null;
  private currentChatId: string | null = null;
  private chatAESKeys: Map<string, CryptoKey> = new Map();
  private userKeyPair: { publicKey: CryptoKey; privateKey: CryptoKey } | null = null;

  // Event callbacks
  private onNewMessage: ((message: Message) => void) | null = null;
  private onUserTyping: ((user: TypingUser) => void) | null = null;
  private onMessageRead: ((data: { messageId: string; userId: string; userName: string }) => void) | null = null;
  private onError: ((error: { message: string }) => void) | null = null;

  constructor(serverUrl: string = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000') {
    this.setupSocket(serverUrl);
  }

  private setupSocket(serverUrl: string) {
    this.socket = io(serverUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from chat server');
    });

    this.socket.on('new_message', async (message: Message) => {
      try {
        // Decrypt the message if we have the AES key
        const decryptedMessage = await this.decryptMessage(message);
        if (this.onNewMessage) {
          this.onNewMessage(decryptedMessage);
        }
      } catch (error) {
        console.error('Error handling new message:', error);
        if (this.onError) {
          this.onError({ message: 'Failed to decrypt message' });
        }
      }
    });

    this.socket.on('user_typing', (user: TypingUser) => {
      if (this.onUserTyping) {
        this.onUserTyping(user);
      }
    });

    this.socket.on('message_read', (data) => {
      if (this.onMessageRead) {
        this.onMessageRead(data);
      }
    });

    this.socket.on('key_set_success', () => {
      console.log('🔑 Public key set successfully');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (this.onError) {
        this.onError(error);
      }
    });
  }

  /**
   * Connect to the chat server
   */
  connect(token: string): void {
    this.token = token;
    if (this.socket) {
      this.socket.auth = { token };
      this.socket.connect();
    }
  }

  /**
   * Disconnect from the chat server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.currentChatId = null;
    this.chatAESKeys.clear();
  }

  /**
   * Set up user's encryption keys
   */
  async setupEncryption(password: string): Promise<boolean> {
    try {
      // Try to retrieve existing keys
      let serializedKeys = await KeyStorage.retrieveKeyPair(password);
      
      if (!serializedKeys) {
        // Generate new keys
        const keyPair = await E2EEncryption.generateKeyPair();
        serializedKeys = await E2EEncryption.exportKeyPair(keyPair);
        await KeyStorage.storeKeyPair(serializedKeys, password);
      }

      // Import keys
      this.userKeyPair = await E2EEncryption.importKeyPair(serializedKeys);

      // Send public key to server
      if (this.socket && this.socket.connected) {
        this.socket.emit('set_public_key', serializedKeys.publicKey);
      }

      return true;
    } catch (error) {
      console.error('Error setting up encryption:', error);
      return false;
    }
  }

  /**
   * Set up AES key for a chat
   */
  async setupChatEncryption(chatId: string): Promise<void> {
    try {
      // Check if we already have the key
      if (this.chatAESKeys.has(chatId)) {
        return;
      }

      // Try to get stored encrypted key
      const storedEncryptedKey = KeyStorage.retrieveAESKey(chatId);
      
      if (storedEncryptedKey && this.userKeyPair) {
        // Decrypt and import the AES key
        const aesKey = await E2EEncryption.decryptAESKey(storedEncryptedKey, this.userKeyPair.privateKey);
        this.chatAESKeys.set(chatId, aesKey);
      } else {
        // Generate new AES key for this chat
        const aesKey = await E2EEncryption.generateAESKey();
        this.chatAESKeys.set(chatId, aesKey);

        // Encrypt and store the key
        if (this.userKeyPair) {
          const encryptedKey = await E2EEncryption.encryptAESKey(aesKey, this.userKeyPair.publicKey);
          KeyStorage.storeAESKey(chatId, encryptedKey);

          // TODO: Send encrypted key to server for other chat members
          // This would involve encrypting the AES key with each member's public key
        }
      }
    } catch (error) {
      console.error('Error setting up chat encryption:', error);
      throw error;
    }
  }

  /**
   * Join a chat room
   */
  async joinChat(chatId: string): Promise<void> {
    if (!this.socket) return;

    this.currentChatId = chatId;
    
    // Set up encryption for this chat
    await this.setupChatEncryption(chatId);
    
    this.socket.emit('join_chat', chatId);
  }

  /**
   * Leave a chat room
   */
  leaveChat(): void {
    if (!this.socket || !this.currentChatId) return;

    this.socket.emit('leave_chat', this.currentChatId);
    this.currentChatId = null;
  }

  /**
   * Send a message
   */
  async sendMessage(chatId: string, content: string, replyToId?: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    try {
      // Get AES key for this chat
      await this.setupChatEncryption(chatId);
      const aesKey = this.chatAESKeys.get(chatId);
      
      if (!aesKey) {
        throw new Error('No encryption key for this chat');
      }

      // Encrypt the message
      const encryptedMessage = await E2EEncryption.encryptMessage(content, aesKey);
      const encryptedContent = JSON.stringify(encryptedMessage);

      this.socket.emit('send_message', {
        chatId,
        encryptedContent,
        messageType: 'TEXT',
        replyToId,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Decrypt a received message
   */
  private async decryptMessage(message: Message): Promise<Message> {
    try {
      const aesKey = this.chatAESKeys.get(message.chatId);
      
      if (!aesKey) {
        // Try to set up encryption for this chat
        await this.setupChatEncryption(message.chatId);
        const newAesKey = this.chatAESKeys.get(message.chatId);
        
        if (!newAesKey) {
          console.warn('No encryption key available for chat', message.chatId);
          return message; // Return encrypted message as-is
        }
      }

      const encryptedMessage = JSON.parse(message.encryptedContent);
      const decryptedContent = await E2EEncryption.decryptMessage(encryptedMessage, aesKey!);

      return {
        ...message,
        encryptedContent: decryptedContent, // Replace with decrypted content
      };
    } catch (error) {
      console.error('Error decrypting message:', error);
      return message; // Return encrypted message as-is if decryption fails
    }
  }

  /**
   * Start typing indicator
   */
  startTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('typing_start', chatId);
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('typing_stop', chatId);
    }
  }

  /**
   * Mark message as read
   */
  markAsRead(chatId: string, messageId: string): void {
    if (this.socket) {
      this.socket.emit('mark_read', { chatId, messageId });
    }
  }

  /**
   * Event listeners
   */
  onMessage(callback: (message: Message) => void): void {
    this.onNewMessage = callback;
  }

  onTyping(callback: (user: TypingUser) => void): void {
    this.onUserTyping = callback;
  }

  onRead(callback: (data: { messageId: string; userId: string; userName: string }) => void): void {
    this.onMessageRead = callback;
  }

  onSocketError(callback: (error: { message: string }) => void): void {
    this.onError = callback;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current chat ID
   */
  getCurrentChatId(): string | null {
    return this.currentChatId;
  }
}

// Singleton instance
let chatSocketInstance: ChatSocket | null = null;

/**
 * Get the global chat socket instance
 */
export const getChatSocket = (): ChatSocket => {
  if (!chatSocketInstance) {
    chatSocketInstance = new ChatSocket();
  }
  return chatSocketInstance;
};

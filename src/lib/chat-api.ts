/**
 * API Client for Hermes Chat
 * Handles HTTP requests to the chat server
 */

import { Chat, Message } from './socket';

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

export class ChatAPI {
  private static token: string | null = null;

  static setToken(token: string): void {
    this.token = token;
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('hermes_auth_token', token);
    }
  }

  static getToken(): string | null {
    if (this.token) return this.token;
    
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('hermes_auth_token');
    }
    
    return this.token;
  }

  static clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hermes_auth_token');
      localStorage.removeItem('hermes_refresh_token');
      localStorage.removeItem('hermes_private_key');
    }
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============= AUTHENTICATION METHODS =============

  /**
   * Register a new user account
   */
  static async signup(data: {
    email: string;
    name: string;
    password: string;
  }): Promise<{
    message: string;
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
      signupStep: number;
      isEmailVerified: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      privateKey: string;
    };
  }> {
    const result = await this.request<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store tokens automatically
    this.setToken(result.tokens.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hermes_refresh_token', result.tokens.refreshToken);
      localStorage.setItem('hermes_private_key', result.tokens.privateKey);
    }

    return result;
  }

  /**
   * Login with email/password or SMASH pattern
   */
  static async login(data: {
    email: string;
    password?: string;
    smashPattern?: number[];
  }): Promise<{
    message: string;
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
      signupStep: number;
      isEmailVerified: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    const result = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store tokens automatically
    this.setToken(result.tokens.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hermes_refresh_token', result.tokens.refreshToken);
    }

    return result;
  }

  /**
   * Set up SMASH pattern for a user
   */
  static async setupSmashPattern(pattern: number[]): Promise<{
    message: string;
  }> {
    return this.request<{ message: string }>('/auth/smash/setup', {
      method: 'POST',
      body: JSON.stringify({ pattern }),
    });
  }

  /**
   * Verify SMASH pattern
   */
  static async verifySmashPattern(pattern: number[]): Promise<{
    message: string;
    valid: boolean;
    attemptsRemaining?: number;
    locked?: boolean;
  }> {
    return this.request<any>('/auth/smash/verify', {
      method: 'POST',
      body: JSON.stringify({ pattern }),
    });
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<{
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('hermes_refresh_token') 
      : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const result = await this.request<any>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Update stored tokens
    this.setToken(result.tokens.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hermes_refresh_token', result.tokens.refreshToken);
    }

    return result;
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<{ message: string }> {
    try {
      const result = await this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
      
      // Clear stored tokens
      this.clearToken();
      
      return result;
    } catch (error) {
      // Clear tokens even if logout request fails
      this.clearToken();
      throw error;
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(): Promise<{
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
      publicKey: string;
      isEmailVerified: boolean;
      signupStep: number;
      lastLoginAt?: string;
      createdAt: string;
    };
  }> {
    return this.request<any>('/auth/me');
  }

  // ============= CHAT METHODS =============

  /**
   * Get user's chats
   */
  static async getChats(): Promise<{ chats: Chat[] }> {
    return this.request<{ chats: Chat[] }>('/chat/chats');
  }

  /**
   * Get messages for a chat
   */
  static async getChatMessages(
    chatId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: Message[] }> {
    return this.request<{ messages: Message[] }>(
      `/chat/chats/${chatId}/messages?page=${page}&limit=${limit}`
    );
  }

  /**
   * Create a new chat
   */
  static async createChat(data: {
    type: 'DIRECT' | 'GROUP';
    name?: string;
    memberEmails: string[];
  }): Promise<{ chat: Chat }> {
    return this.request<{ chat: Chat }>('/chat/chats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get chat encryption keys
   */
  static async getChatKeys(chatId: string): Promise<{
    userKey?: string;
    memberKeys: {
      userId: string;
      name: string;
      publicKey: string;
    }[];
  }> {
    return this.request<{
      userKey?: string;
      memberKeys: {
        userId: string;
        name: string;
        publicKey: string;
      }[];
    }>(`/chat/chats/${chatId}/keys`);
  }

  /**
   * Store encrypted AES key for user
   */
  static async storeChatKey(
    chatId: string,
    encryptedAESKey: string
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/chat/chats/${chatId}/keys`, {
      method: 'POST',
      body: JSON.stringify({ encryptedAESKey }),
    });
  }

  /**
   * Search for users by email
   */
  static async searchUsers(email: string): Promise<{
    users: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    }[];
  }> {
    return this.request<{
      users: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
      }[];
    }>(`/chat/users/search?email=${encodeURIComponent(email)}`);
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }
}

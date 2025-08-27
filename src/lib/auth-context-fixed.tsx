'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChatAPI } from './chat-api';
import { TypingData } from './smashAnalyzer';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  publicKey?: string;
  isEmailVerified: boolean;
  signupStep: number;
  lastLoginAt?: string;
  createdAt?: string;
}

interface TempUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  tempUser: TempUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; needsPattern?: boolean; tempUser?: TempUser; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; user?: User; token?: string; privateKey?: string }>;
  logout: () => Promise<void>;
  setSmashPattern: (pattern: string, typingData?: TypingData) => Promise<{ success: boolean; error?: string }>;
  verifySmashPattern: (pattern: string, tempUser: TempUser, typingData?: TypingData) => Promise<{ success: boolean; error?: string }>;
  checkHasPattern: (userId: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempUser, setTempUser] = useState<TempUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Set token in localStorage and API client
  const updateToken = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
      ChatAPI.setToken(newToken);
    } else {
      localStorage.removeItem('auth_token');
      ChatAPI.clearToken();
    }
  };

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        ChatAPI.setToken(storedToken);
        
        // Try to get current user
        const response = await ChatAPI.getCurrentUser();
        setUser(response.user);
      }
    } catch (error) {
      // Token might be expired, clear it
      updateToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; needsPattern?: boolean; tempUser?: TempUser; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.needsPattern) {
          setTempUser(data.tempUser);
          return { success: true, needsPattern: true, tempUser: data.tempUser };
        } else {
          setUser(data.user);
          updateToken(data.token);
          return { success: true };
        }
      }
      
      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: User; token?: string; privateKey?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        updateToken(data.token);
        
        // Store private key for E2E encryption
        if (data.privateKey) {
          localStorage.setItem('private_key', data.privateKey);
        }
        
        return { 
          success: true, 
          user: data.user, 
          token: data.token,
          privateKey: data.privateKey
        };
      }
      
      return { success: false, error: data.error || 'Signup failed' };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setTempUser(null);
      updateToken(null);
      localStorage.removeItem('private_key');
    }
  };

  const setSmashPattern = async (pattern: string, typingData?: TypingData): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/setup-smash`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pattern, typingData }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update user's signup step
        await refreshUser();
        return { success: true };
      }
      
      return { success: false, error: data.error || 'Failed to set pattern' };
    } catch (error) {
      console.error('Set pattern failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const verifySmashPattern = async (pattern: string, tempUser: TempUser, typingData?: TypingData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-smash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pattern, 
          tempUserId: tempUser.id,
          typingData 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setTempUser(null);
        updateToken(data.token);
        return { success: true };
      }
      
      return { success: false, error: data.error || 'Pattern verification failed' };
    } catch (error) {
      console.error('Pattern verification failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const checkHasPattern = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/has-pattern/${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.hasPattern;
      }
      return false;
    } catch (error) {
      console.error('Check pattern failed:', error);
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) return;

      const response = await ChatAPI.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        tempUser,
        token,
        login,
        signup,
        logout,
        setSmashPattern,
        verifySmashPattern,
        checkHasPattern,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

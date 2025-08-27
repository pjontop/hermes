/**
 * Authentication Context for Hermes Chat
 * Replaces Appwrite with our custom authentication system
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChatAPI } from './chat-api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  publicKey: string;
  isEmailVerified: boolean;
  signupStep: number;
  lastLoginAt?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string, smashPattern?: number[]) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setupSmashPattern: (pattern: number[]) => Promise<void>;
  verifySmashPattern: (pattern: number[]) => Promise<{ valid: boolean; attemptsRemaining?: number; locked?: boolean }>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = ChatAPI.getToken();
      if (token) {
        // Try to get current user
        const response = await ChatAPI.getCurrentUser();
        setUser(response.user);
      }
    } catch (error) {
      // Token might be expired, try to refresh
      try {
        await ChatAPI.refreshToken();
        const response = await ChatAPI.getCurrentUser();
        setUser(response.user);
      } catch (refreshError) {
        // Refresh failed, clear tokens
        ChatAPI.clearToken();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string, smashPattern?: number[]) => {
    try {
      setLoading(true);
      const response = await ChatAPI.login({ email, password, smashPattern });
      setUser(response.user as User);
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, name: string, password: string) => {
    try {
      setLoading(true);
      const response = await ChatAPI.signup({ email, name, password });
      setUser(response.user as User);
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await ChatAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      setUser(null);
      ChatAPI.clearToken();
    }
  };

  const setupSmashPattern = async (pattern: number[]) => {
    await ChatAPI.setupSmashPattern(pattern);
    // Refresh user data to get updated signup step
    await refreshAuth();
  };

  const verifySmashPattern = async (pattern: number[]) => {
    const response = await ChatAPI.verifySmashPattern(pattern);
    return response;
  };

  const refreshAuth = async () => {
    try {
      const response = await ChatAPI.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      // Don't clear user here, might be temporary network issue
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    setupSmashPattern,
    verifySmashPattern,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
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

// Helper hook to check if user is authenticated
export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login';
    }
  }, [user, loading]);

  return { user, loading };
}

// Helper function to check if user needs to complete signup steps
export function useSignupFlow() {
  const { user } = useAuth();
  
  const needsSmashSetup = user && user.signupStep < 2;
  const needsEmailVerification = user && !user.isEmailVerified;
  
  return {
    needsSmashSetup,
    needsEmailVerification,
    isSignupComplete: user && user.signupStep >= 2 && user.isEmailVerified,
  };
}

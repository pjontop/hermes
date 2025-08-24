'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  signupStep?: number;
}

interface TempUser {
  id: string;
  email: string;
  name: string;
}

interface TypingData {
  averageSpeed: number;
  speedVariance: number;
  keyTimingProfile: number[];
  sampleCount: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  tempUser: TempUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; needsPattern?: boolean; tempUser?: TempUser }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  setSmashPattern: (pattern: string, user: User, typingData?: TypingData) => Promise<boolean>;
  verifySmashPattern: (pattern: string, tempUser: TempUser, typingData?: TypingData) => Promise<boolean>;
  checkHasPattern: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempUser, setTempUser] = useState<TempUser | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; needsPattern?: boolean; tempUser?: TempUser }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if user has smash pattern
        const patternCheck = await checkHasPattern(data.user.id);
        
        if (patternCheck) {
          // User has pattern, need verification
          setTempUser(data.user);
          return { success: true, needsPattern: true, tempUser: data.user };
        } else {
          // No pattern required, complete login
          setUser(data.user);
          window.location.href = '/dashboard';
          return { success: true, needsPattern: false };
        }
      }
      return { success: false };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false };
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (response.ok) {
        const data = await response.json();
        // Set user in context so SignupStepHandler can work
        setUser(data.user);
        return { success: true, user: data.user };
      }
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Signup failed' };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setTempUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const setSmashPattern = async (pattern: string, user: User, typingData?: TypingData): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/set-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pattern,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          typingData
        }),
      });
      
      if (response.ok) {
        setUser(user);
        window.location.href = '/dashboard';
        return true;
      }
      return false;
    } catch (error) {
      console.error('Set pattern failed:', error);
      return false;
    }
  };

  const verifySmashPattern = async (pattern: string, tempUser: TempUser, typingData?: TypingData): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pattern, 
          tempUserId: tempUser.id,
          tempUserEmail: tempUser.email,
          tempUserName: tempUser.name,
          typingData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setTempUser(null);
        window.location.href = '/dashboard';
        return true;
      }
      return false;
    } catch (error) {
      console.error('Verify pattern failed:', error);
      return false;
    }
  };

  const checkHasPattern = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

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

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      tempUser,
      login, 
      signup, 
      logout,
      setSmashPattern,
      verifySmashPattern,
      checkHasPattern
    }}>
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

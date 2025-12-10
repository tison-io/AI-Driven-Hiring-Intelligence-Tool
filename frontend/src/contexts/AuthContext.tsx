'use client';

import { createContext, ReactNode, useState, useEffect, useContext, useRef } from 'react';
import { tokenStorage } from '../lib/auth';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    
    const token = tokenStorage.get();
    if (token && tokenStorage.isValid(token)) {
      // Fetch full profile on mount
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setUser(data);
          else {
            const userData = tokenStorage.parseUser(token);
            if (userData) setUser(userData);
          }
        })
        .catch(() => {
          const userData = tokenStorage.parseUser(token);
          if (userData) setUser(userData);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    isInitialized.current = true;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const { access_token } = await response.json();
      tokenStorage.set(access_token);
      
      // Fetch full profile data
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUser(profileData);
        return profileData;
      }
      
      const userData = tokenStorage.parseUser(access_token);
      if (userData) {
        setUser(userData);
        return userData;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Registration failed');
      
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = tokenStorage.get();
    
    // Call backend logout endpoint if user is authenticated
    if (token && tokenStorage.isValid(token)) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }
    
    // Clear local state regardless of API call result
    tokenStorage.remove();
    setUser(null);
    setError(null);
  };

  const refreshUser = async () => {
    const token = tokenStorage.get();
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isInitialized: isInitialized.current, error, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
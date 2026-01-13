'use client';

import { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../lib/api';
import { User, AuthContextType, AuthProviderProps } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    
    // Check authentication on mount
    const checkAuth = async () => {
      try {
        // Cookie is sent automatically - just fetch profile
        const response = await api.get('/auth/profile');
        if (response.data) {
          setUser(response.data);
        }
      } catch (error) {
        // Not authenticated or cookie expired
        setUser(null);
      } finally {
        setLoading(false);
        isInitialized.current = true;
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Backend sets JWT cookie automatically
      const response = await api.post('/auth/login', { email, password });
      
      // Fetch full profile (cookie is already set)
      const profileResponse = await api.get('/auth/profile');
      setUser(profileResponse.data);
      return profileResponse.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await api.post('/auth/register', { email, password });
      
      // Auto-login after registration
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Backend clears cookie
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state
      setUser(null);
      setError(null);
    }
  };

  const refreshUser = async () => {
    try {
      // Cookie is sent automatically
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
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
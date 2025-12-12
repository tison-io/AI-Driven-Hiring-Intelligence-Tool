'use client';

import { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../lib/api';
import { tokenStorage } from '../lib/auth';
import { User, AuthContextType, AuthProviderProps } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      api.get('/auth/profile')
        .then(response => {
          if (response.data) setUser(response.data);
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
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;
      tokenStorage.set(access_token);
      
      // Fetch full profile data
      try {
        const profileResponse = await api.get('/auth/profile');
        setUser(profileResponse.data);
        return profileResponse.data;
      } catch (profileError) {
        // Fallback to token parsing if profile fetch fails
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
      await api.post('/auth/register', { email, password });
      
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
        await api.post('/auth/logout');
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
      const response = await api.get('/auth/profile');
      setUser(response.data);
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
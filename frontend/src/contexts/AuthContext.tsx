'use client';

import { createContext, ReactNode } from 'react';

interface User {
  _id: string;
  email: string;
  role: 'hr' | 'recruiter';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'hr' | 'recruiter') => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Provider implementation will be added in Task 4
  return (
    <AuthContext.Provider value={undefined}>
      {children}
    </AuthContext.Provider>
  );
}
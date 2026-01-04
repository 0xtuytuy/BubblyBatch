import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import * as authService from './auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  confirmSignIn: (email: string, code: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithEmail = async (email: string) => {
    return await authService.signInWithEmail(email);
  };

  const handleConfirmSignIn = async (email: string, code: string) => {
    const result = await authService.confirmSignIn(email, code);
    
    if (result.success && result.user) {
      setUser(result.user);
    }
    
    return result;
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithEmail: handleSignInWithEmail,
    confirmSignIn: handleConfirmSignIn,
    signOut: handleSignOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;


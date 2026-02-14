/**
 * Auth Context - Global authentication state management
 * 
 * Provides:
 * - Session validation on app initialization
 * - Auto-login when valid session exists
 * - Sync between server session and client identity store
 * - Auth state available to all components
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getCurrentUser, loginWithGoogle, logout as apiLogout, type User } from './auth-api';
import { useIdentityStore } from './stores';

interface AuthContextValue {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  
  // Actions
  login: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get identity store actions
  const setIdentity = useIdentityStore((state) => state.setIdentity);
  const clearIdentity = useIdentityStore((state) => state.clear);
  const unlock = useIdentityStore((state) => state.unlock);

  // Validate session with server
  const validateSession = useCallback(async (): Promise<User | null> => {
    try {
      const validatedUser = await getCurrentUser();
      return validatedUser;
    } catch (err) {
      console.error('Session validation failed:', err);
      return null;
    }
  }, []);

  // Refresh session - called periodically or on reconnection
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const validatedUser = await validateSession();
    if (validatedUser) {
      setUser(validatedUser);
      // Sync with identity store
      setIdentity(validatedUser.did, validatedUser.did, 1);
      unlock();
      setError(null);
      return true;
    } else {
      setUser(null);
      clearIdentity();
      return false;
    }
  }, [validateSession, setIdentity, clearIdentity, unlock]);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const validatedUser = await validateSession();
        
        if (validatedUser) {
          console.log('[Auth] Valid session found, auto-login:', validatedUser.email);
          setUser(validatedUser);
          // Sync with identity store
          setIdentity(validatedUser.did, validatedUser.did, 1);
          unlock();
        } else {
          console.log('[Auth] No valid session');
          setUser(null);
          clearIdentity();
        }
      } catch (err) {
        console.error('[Auth] Init failed:', err);
        setError('Failed to validate session');
        setUser(null);
        clearIdentity();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [validateSession, setIdentity, clearIdentity, unlock]);

  // Login handler
  const login = useCallback(() => {
    loginWithGoogle();
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      setUser(null);
      clearIdentity();
      // Reload to clear any cached state
      window.location.reload();
    }
  }, [clearIdentity]);

  const value: AuthContextValue = {
    isAuthenticated: !!user,
    isLoading,
    user,
    error,
    login,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to get current user (convenience wrapper)
export function useCurrentUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return { user, isAuthenticated, isLoading };
}

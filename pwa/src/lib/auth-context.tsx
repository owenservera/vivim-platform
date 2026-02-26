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
import { dataSyncService } from './data-sync-service';

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

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const validatedUser = await validateSession();

        if (!mounted) return;

        if (validatedUser) {
          console.log('[Auth] Valid session found, auto-login:', validatedUser.email);
          setUser(validatedUser);
          setIdentity(validatedUser.did, validatedUser.did, 1, validatedUser.id);
          unlock();

          try {
            // Add timeout to sync operations to prevent hanging
            const needsSync = await Promise.race([
              dataSyncService.needsFullSync(),
              new Promise<boolean>((_, reject) =>
                setTimeout(() => reject(new Error('needsFullSync timed out')), 30000)
              )
            ]);

            if (needsSync) {
              console.log('[Auth] Starting full database sync...');

              // Add timeout to syncFullDatabase
              const syncResult = await Promise.race([
                dataSyncService.syncFullDatabase((progress) => {
                  console.log(`[Sync] ${progress.phase}: ${progress.message}`);
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('syncFullDatabase timed out after 180 seconds')), 180000)
                )
              ]);

              if (syncResult.success) {
                console.log(`[Auth] Full database sync completed: ${syncResult.syncedConversations} conversations synced`);
              } else {
                console.error('[Auth] Full database sync failed:', syncResult.errors);
              }
            } else {
              console.log('[Auth] No full sync needed, data already present');
            }
          } catch (syncErr) {
            if (syncErr instanceof Error && syncErr.message.includes('timed out')) {
              console.warn('[Auth] Sync operation timed out - continuing anyway');
            } else {
              console.error('[Auth] Error during full database sync:', syncErr);
            }
            // Continue even if sync fails - user is authenticated
          }
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
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Safety timeout - force loading to false if init takes too long
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('[Auth] Init timeout - forcing loading to false');
        setIsLoading(false);
        setError('Initialization timed out. Please refresh the page.');
      }
    }, 200000); // 200 seconds - slightly longer than sync timeout (180s)

    initAuth();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
    };
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
      window.location.reload();
    }
  }, [clearIdentity]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const validatedUser = await validateSession();
    if (validatedUser) {
      setUser(validatedUser);
      setIdentity(validatedUser.did, validatedUser.did, 1, validatedUser.id);
      unlock();
      setError(null);
      return true;
    } else {
      setUser(null);
      clearIdentity();
      return false;
    }
  }, [validateSession, setIdentity, clearIdentity, unlock]);

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

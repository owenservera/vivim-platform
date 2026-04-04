/**
 * Auth API - Client-side authentication using Supabase
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { user } } = await supabase!.auth.getUser();

    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.display_name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
    };
  } catch {
    return null;
  }
}

export async function loginWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
  }

  const { error } = await supabase!.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
}

export async function logout(): Promise<void> {
  if (!isSupabaseConfigured()) {
    window.location.reload();
    return;
  }

  try {
    await supabase!.auth.signOut();
  } finally {
    window.location.reload();
  }
}

export async function checkAuth(): Promise<User | null> {
  return getCurrentUser();
}

export interface AccountInfo {
  id: string;
  did: string;
  email: string;
  displayName: string | null;
  status: string;
  verificationLevel: number;
  trustScore: number;
  createdAt: string;
  lastSeenAt: string;
  pendingDeletion: boolean;
  deletionDate: string | null;
}

export async function getAccountInfo(): Promise<AccountInfo | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/account/me`, {
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function requestAccountDeletion(options?: { immediate?: boolean; exportData?: boolean }): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/account/me`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(options || {}),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Failed to request deletion' };
  }
}

export async function cancelAccountDeletion(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/account/me/undelete`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await response.json();
    return data;
  } catch {
    return { success: false, error: 'Failed to cancel deletion' };
  }
}

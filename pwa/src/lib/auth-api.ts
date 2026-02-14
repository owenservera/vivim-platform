/**
 * Auth API - Client-side authentication
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface User {
  id: string;
  did: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  verificationLevel: number;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.user : null;
  } catch {
    return null;
  }
}

export async function loginWithGoogle(): Promise<void> {
  window.location.href = `${API_BASE}/api/v1/auth/google`;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
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

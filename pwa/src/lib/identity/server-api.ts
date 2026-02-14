/**
 * Server Identity API Client
 * 
 * Connects PWA identity service to server endpoints
 */

import { identityService, type MasterIdentity, type DeviceRegistration } from './identity-service';
import { useSettingsStore } from '../stores';
import { logger } from '../logger';

const API_BASE = '/api/v2/identity';

/**
 * Register user on server
 */
export async function registerUserOnServer(
  identity: MasterIdentity,
  options: {
    handle?: string;
    displayName?: string;
    email?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        did: identity.did,
        publicKey: identity.publicKey,
        handle: options.handle,
        displayName: options.displayName,
        email: options.email
      })
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Server registration failed', data);
      return { success: false, error: data.error };
    }

    logger.info('User registered on server', { did: identity.did });
    return { success: true };
  } catch (error) {
    logger.error('Server registration error', error as Error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Register device on server
 */
export async function registerDeviceOnServer(
  device: DeviceRegistration
): Promise<{ success: boolean; error?: string }> {
  try {
    const identity = identityService.getIdentity();
    if (!identity) {
      return { success: false, error: 'No identity' };
    }

    const response = await fetch(`${API_BASE}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Device registration failed', data);
      return { success: false, error: data.error };
    }

    logger.info('Device registered on server', { deviceId: device.deviceId });
    return { success: true };
  } catch (error) {
    logger.error('Device registration error', error as Error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get user profile from server
 */
export async function getUserProfile(did: string): Promise<any | null> {
  try {
    const headers: Record<string, string> = {};
    
    // Add auth if available
    const currentDID = identityService.getDID();
    if (currentDID) {
      headers['X-DID'] = currentDID;
    }

    const response = await fetch(`${API_BASE}/users/${did}`, { headers });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    logger.error('Get user profile error', error as Error);
    return null;
  }
}

/**
 * Initiate email verification
 */
export async function initiateEmailVerification(email: string): Promise<{ 
  success: boolean; 
  code?: string;
  error?: string 
}> {
  try {
    const identity = identityService.getIdentity();
    if (!identity) {
      return { success: false, error: 'No identity' };
    }

    const signature = identityService.sign(`verify-email:${email}:${Date.now()}`);

    const response = await fetch(`${API_BASE}/verify/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DID': identity.did,
        'X-Signature': signature,
        'X-Timestamp': Date.now().toString()
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true, code: data.code };
  } catch (error) {
    logger.error('Email verification initiation error', error as Error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Complete email verification
 */
export async function completeEmailVerification(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const identity = identityService.getIdentity();
    if (!identity) {
      return { success: false, error: 'No identity' };
    }

    const signature = identityService.sign(`complete-verify:${email}:${code}`);

    const response = await fetch(`${API_BASE}/verify/email/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DID': identity.did,
        'X-Signature': signature,
        'X-Timestamp': Date.now().toString()
      },
      body: JSON.stringify({ email, code })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    logger.error('Email verification completion error', error as Error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get access audit log
 */
export async function getAccessLog(
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<any[]> {
  try {
    const identity = identityService.getIdentity();
    if (!identity) return [];

    const signature = identityService.sign(`access-log:${Date.now()}`);
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const response = await fetch(`${API_BASE}/transparency/access-log?${params}`, {
      headers: {
        'X-DID': identity.did,
        'X-Signature': signature,
        'X-Timestamp': Date.now().toString()
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    logger.error('Get access log error', error as Error);
    return [];
  }
}

/**
 * Record consent
 */
export async function recordConsent(
  purpose: string,
  allowed: boolean,
  options: {
    dataTypes?: string[];
    expiresAt?: Date;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const identity = identityService.getIdentity();
    if (!identity) {
      return { success: false, error: 'No identity' };
    }

    const signature = identityService.sign(`consent:${purpose}:${allowed}:${Date.now()}`);

    const response = await fetch(`${API_BASE}/consents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DID': identity.did,
        'X-Signature': signature,
        'X-Timestamp': Date.now().toString()
      },
      body: JSON.stringify({
        purpose,
        allowed,
        dataTypes: options.dataTypes,
        expiresAt: options.expiresAt?.toISOString()
      })
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    logger.error('Record consent error', error as Error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Sync identity with server
 */
export async function syncIdentityWithServer(): Promise<{ 
  success: boolean; 
  isRegistered?: boolean;
  error?: string 
}> {
  try {
    const identity = identityService.getIdentity();
    if (!identity) {
      return { success: false, error: 'No identity' };
    }

    // Check if user exists on server
    const profile = await getUserProfile(identity.did);

    if (!profile) {
      // Register user
      const result = await registerUserOnServer(identity);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true, isRegistered: false };
    }

    // Register current device if not already
    const currentDevice = identityService.getDevices().find(d => d.status === 'active');
    if (currentDevice) {
      await registerDeviceOnServer(currentDevice as DeviceRegistration);
    }

    return { success: true, isRegistered: true };
  } catch (error) {
    logger.error('Sync identity error', error as Error);
    return { success: false, error: 'Sync failed' };
  }
}

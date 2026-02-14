/**
 * BYOK API Key Manager
 * 
 * Handles secure storage, encryption, and retrieval of API keys using Web Crypto API
 */

import type { BYOKProvider, StoredKey, KeyValidationResult, BYOKError } from './types';
import { PROVIDER_CONFIGS, getProviderConfig } from './provider-config';
import { BYOK_ERROR_CODES } from './types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'vivim_byok_keys';
const MASTER_KEY_ID = 'vivim_byok_master';

// ============================================================================
// Encryption Utilities (Web Crypto API)
// ============================================================================

/**
 * Generate a key derivation from password using PBKDF2
 */
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate encryption key from user identity
 */
async function getOrCreateMasterKey(): Promise<CryptoKey> {
  // Check if we have a stored key
  const storedKeyData = localStorage.getItem(MASTER_KEY_ID);
  
  if (storedKeyData) {
    try {
      const { salt, encryptedKey } = JSON.parse(storedKeyData);
      // The key is derived from identity service password or device key
      const identityKey = await getIdentityDerivedKey();
      
      const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
      return deriveKeyFromPassword(identityKey, saltBytes);
    } catch {
      // Key invalid, create new one
    }
  }

  // Create new master key
  const identityKey = await getIdentityDerivedKey();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyFromPassword(identityKey, salt);

  // Store salt for later
  const saltBase64 = btoa(String.fromCharCode(...salt));
  localStorage.setItem(MASTER_KEY_ID, JSON.stringify({ salt: saltBase64 }));

  return key;
}

/**
 * Get a key derived from user identity (uses identity service if available)
 */
async function getIdentityDerivedKey(): Promise<string> {
  try {
    // Try to get from identity service
    const { identityService } = await import('../identity/identity-service');
    if (identityService.isUnlocked()) {
      const identity = identityService.getIdentity();
      if (identity) {
        return identity.did;
      }
    }
  } catch {
    // Identity service not available
  }

  // Fallback to device ID
  const deviceId = localStorage.getItem('vivim_device_id') || crypto.randomUUID();
  if (!localStorage.getItem('vivim_device_id')) {
    localStorage.setItem('vivim_device_id', deviceId);
  }
  
  return deviceId;
}

/**
 * Encrypt a value using AES-256-GCM
 */
export async function encryptValue(value: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await getOrCreateMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(value)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypt a value using AES-256-GCM
 */
export async function decryptValue(ciphertext: string, iv: string): Promise<string> {
  const key = await getOrCreateMasterKey();
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    ciphertextBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ============================================================================
// Key Management
// ============================================================================

/**
 * Get all stored API keys
 */
export async function getStoredKeys(): Promise<StoredKey[]> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const data = JSON.parse(stored);
    return data.keys || [];
  } catch {
    return [];
  }
}

/**
 * Get a specific provider's key
 */
export async function getKey(provider: BYOKProvider): Promise<StoredKey | null> {
  const keys = await getStoredKeys();
  return keys.find(k => k.provider === provider) || null;
}

/**
 * Decrypt and return the API key for a provider
 */
export async function getDecryptedKey(provider: BYOKProvider): Promise<string | null> {
  const stored = await getKey(provider);
  if (!stored || !stored.isValid) return null;

  try {
    const { ciphertext, iv } = JSON.parse(stored.encryptedKey);
    return await decryptValue(ciphertext, iv);
  } catch {
    return null;
  }
}

/**
 * Validate and store an API key
 */
export async function addKey(
  provider: BYOKProvider,
  apiKey: string
): Promise<KeyValidationResult> {
  const config = getProviderConfig(provider);
  if (!config) {
    return { valid: false, provider, error: 'Unknown provider' };
  }

  // Validate key format
  if (!config.keyFormat.pattern.test(apiKey)) {
    return {
      valid: false,
      provider,
      error: `Invalid key format. Expected: ${config.keyFormat.placeholder}`,
    };
  }

  // Encrypt and store the key
  try {
    const { ciphertext, iv } = await encryptValue(apiKey);
    
    const keys = await getStoredKeys();
    const existingIndex = keys.findIndex(k => k.provider === provider);
    
    const storedKey: StoredKey = {
      provider,
      encryptedKey: JSON.stringify({ ciphertext, iv }),
      keyPrefix: apiKey.slice(0, 4),
      createdAt: new Date(),
      lastUsed: null,
      isValid: true,
    };

    if (existingIndex >= 0) {
      keys[existingIndex] = storedKey;
    } else {
      keys.push(storedKey);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ keys }));

    // Update last used
    await markKeyUsed(provider);

    return { valid: true, provider };
  } catch (error) {
    return {
      valid: false,
      provider,
      error: 'Failed to encrypt key',
    };
  }
}

/**
 * Remove an API key
 */
export async function removeKey(provider: BYOKProvider): Promise<boolean> {
  const keys = await getStoredKeys();
  const filtered = keys.filter(k => k.provider !== provider);
  
  if (filtered.length === keys.length) {
    return false; // Key didn't exist
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ keys: filtered }));
  return true;
}

/**
 * Mark a key as used (updates timestamp)
 */
export async function markKeyUsed(provider: BYOKProvider): Promise<void> {
  const keys = await getStoredKeys();
  const index = keys.findIndex(k => k.provider === provider);
  
  if (index >= 0) {
    keys[index].lastUsed = new Date();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ keys }));
  }
}

/**
 * Validate a key by making a test API call
 */
export async function validateKey(provider: BYOKProvider, apiKey: string): Promise<KeyValidationResult> {
  const config = getProviderConfig(provider);
  if (!config) {
    return { valid: false, provider, error: 'Unknown provider' };
  }

  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return { valid: false, provider, error: 'Invalid API key' };
      }
      if (response.status === 429) {
        return { valid: false, provider, error: 'Rate limit exceeded' };
      }
      return { valid: false, provider, error: errorData.error?.message || 'Validation failed' };
    }

    const data = await response.json();
    const models = data.data?.map((m: any) => m.id) || [];

    return { valid: true, provider, models };
  } catch (error) {
    return {
      valid: false,
      provider,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Check if a provider has a valid key
 */
export async function hasValidKey(provider: BYOKProvider): Promise<boolean> {
  const key = await getKey(provider);
  return key?.isValid ?? false;
}

/**
 * Get all providers that have stored keys
 */
export async function getProvidersWithKeys(): Promise<BYOKProvider[]> {
  const keys = await getStoredKeys();
  return keys.filter(k => k.isValid).map(k => k.provider);
}

/**
 * Clear all stored keys
 */
export async function clearAllKeys(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get usage statistics for a provider
 */
export async function getProviderUsage(provider: BYOKProvider): Promise<{
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  lastUsed: Date | null;
}> {
  const storageKey = `vivim_byok_usage_${provider}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    return { totalTokens: 0, totalCost: 0, requestCount: 0, lastUsed: null };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { totalTokens: 0, totalCost: 0, requestCount: 0, lastUsed: null };
  }
}

/**
 * Record usage for a provider
 */
export async function recordUsage(
  provider: BYOKProvider,
  promptTokens: number,
  completionTokens: number,
  cost: number
): Promise<void> {
  const usage = await getProviderUsage(provider);
  
  const newUsage = {
    totalTokens: usage.totalTokens + promptTokens + completionTokens,
    totalCost: usage.totalCost + cost,
    requestCount: usage.requestCount + 1,
    lastUsed: new Date().toISOString(),
  };

  const storageKey = `vivim_byok_usage_${provider}`;
  localStorage.setItem(storageKey, JSON.stringify(newUsage));
}

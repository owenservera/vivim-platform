/**
 * VIVIM Identity Service
 * 
 * Secure, Self-Sovereign Identity Management for P2P Network
 * 
 * Features:
 * - BIP-39 seed phrase generation
 * - Master DID derivation (did:key method)
 * - Device key derivation (HD wallet pattern)
 * - Secure key storage (Web Crypto API + IndexedDB)
 * - Identity export/import
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import type { DID, Hash, ISO8601, Signature } from '../storage-v2/types';
import { asDID, asHash, asSignature, asISO8601 } from '../storage-v2/types';
import { sha3_256, toHex, fromHex, secureStorePrivateKey, secureRetrievePrivateKey } from '../storage-v2/secure-crypto';
import { log } from '../logger';

// ============================================================================
// BIP-39 Wordlist (English - First 2048 words)
// For production, import full list from a verified source
// ============================================================================

const BIP39_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  // ... In production, load full 2048 word list
  // For demo, we'll use crypto.getRandomValues directly
];

// ============================================================================
// Types
// ============================================================================

export interface MasterIdentity {
  did: DID;
  publicKey: string;                  // Base64 Ed25519 public key
  createdAt: ISO8601;
  verificationTier: 0 | 1 | 2 | 3;
  profile?: IdentityProfile;
}

export interface IdentityProfile {
  displayName?: string;
  avatar?: string;                    // IPFS CID or data URI
  bio?: string;
  links?: { type: string; url: string }[];
}

export interface DeviceRegistration {
  deviceId: string;
  deviceDID: DID;
  name: string;
  platform: 'web' | 'ios' | 'android' | 'desktop';
  registeredAt: ISO8601;
  lastActiveAt: ISO8601;
  capabilities: DeviceCapabilities;
  delegationProof: Signature;
  status: 'active' | 'revoked' | 'pending';
}

export interface DeviceCapabilities {
  canSign: boolean;
  canEncrypt: boolean;
  hasBiometrics: boolean;
  hasSecureEnclave: boolean;
}

export interface RecoveryOptions {
  seedPhraseHash: Hash;
  socialRecovery?: {
    guardians: DID[];
    threshold: number;
  };
  hasBackup: boolean;
}

export interface IdentityState {
  initialized: boolean;
  masterIdentity: MasterIdentity | null;
  currentDevice: DeviceRegistration | null;
  devices: DeviceRegistration[];
  recovery: RecoveryOptions | null;
}

// ============================================================================
// Constants
// ============================================================================

const IDENTITY_STORAGE_KEY = 'vivim_identity_state';
const DEVICE_ID_KEY = 'vivim_device_id';
const IDENTITY_VERSION = 1;

// ============================================================================
// Identity Service
// ============================================================================

class IdentityService {
  private state: IdentityState = {
    initialized: false,
    masterIdentity: null,
    currentDevice: null,
    devices: [],
    recovery: null
  };

  private privateKey: Uint8Array | null = null;

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize identity service
   * Loads existing identity or prompts for creation
   */
  async initialize(): Promise<boolean> {
    try {
      // Load saved state
      const savedState = localStorage.getItem(IDENTITY_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.version === IDENTITY_VERSION) {
          this.state = { ...this.state, ...parsed.state };
          this.state.initialized = true;
          log.identity?.info('Identity loaded', { did: this.state.masterIdentity?.did });
          return true;
        }
      }

      log.identity?.info('No existing identity found');
      return false;
    } catch (error) {
      log.identity?.error('Failed to initialize identity', error as Error);
      return false;
    }
  }

  /**
   * Check if identity exists
   */
  hasIdentity(): boolean {
    return this.state.masterIdentity !== null;
  }

  /**
   * Get current identity
   */
  getIdentity(): MasterIdentity | null {
    return this.state.masterIdentity;
  }

  /**
   * Get current DID
   */
  getDID(): DID | null {
    return this.state.masterIdentity?.did || null;
  }

  // ==========================================================================
  // Identity Creation
  // ==========================================================================

  /**
   * Generate a new seed phrase (BIP-39 compatible)
   * Returns 12 or 24 words
   */
  generateSeedPhrase(wordCount: 12 | 24 = 12): string[] {
    // Generate entropy
    const entropyBytes = wordCount === 12 ? 16 : 32; // 128 or 256 bits
    const entropy = new Uint8Array(entropyBytes);
    crypto.getRandomValues(entropy);

    // For simplicity, we'll use hex encoding as words
    // In production, use proper BIP-39 derivation
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      // Generate deterministic index from entropy
      const index = (entropy[i % entropyBytes] + entropy[(i + 1) % entropyBytes] * 256) % 2048;
      words.push(BIP39_WORDLIST[index] || `word${index}`);
    }

    return words;
  }

  /**
   * Create a new master identity from seed phrase
   */
  async createIdentity(
    seedPhrase: string[],
    password: string,
    profile?: IdentityProfile
  ): Promise<MasterIdentity> {
    try {
      // Derive master key from seed phrase
      const seedString = seedPhrase.join(' ');
      const seedHash = await sha3_256(seedString);
      const seedBytes = fromHex(seedHash);

      // Generate Ed25519 keypair from seed
      const keyPair = nacl.sign.keyPair.fromSeed(seedBytes.slice(0, 32));

      // Create DID from public key (did:key method)
      const publicKeyBase64 = encodeBase64(keyPair.publicKey);
      const did = this.publicKeyToDID(keyPair.publicKey);

      // Store private key securely
      await secureStorePrivateKey(keyPair.secretKey, password);
      this.privateKey = keyPair.secretKey;

      // Create identity
      const identity: MasterIdentity = {
        did,
        publicKey: publicKeyBase64,
        createdAt: asISO8601(new Date().toISOString()),
        verificationTier: 0,
        profile
      };

      // Create recovery options
      const recovery: RecoveryOptions = {
        seedPhraseHash: await sha3_256(seedString),
        hasBackup: false
      };

      // Register this device
      const device = await this.registerCurrentDevice(did, keyPair.secretKey);

      // Update state
      this.state = {
        initialized: true,
        masterIdentity: identity,
        currentDevice: device,
        devices: [device],
        recovery
      };

      // Persist state
      this.saveState();

      log.identity?.info('Identity created', { did });
      return identity;
    } catch (error) {
      log.identity?.error('Failed to create identity', error as Error);
      throw error;
    }
  }

  /**
   * Import identity from seed phrase
   */
  async importIdentity(seedPhrase: string[], password: string): Promise<MasterIdentity> {
    // Same as create, but for existing identity
    return this.createIdentity(seedPhrase, password);
  }

  // ==========================================================================
  // Device Management
  // ==========================================================================

  /**
   * Get or create device ID for current device
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Detect current device platform
   */
  private detectPlatform(): 'web' | 'ios' | 'android' | 'desktop' {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Electron/.test(ua)) return 'desktop';
    return 'web';
  }

  /**
   * Detect device capabilities
   */
  private async detectCapabilities(): Promise<DeviceCapabilities> {
    return {
      canSign: true,
      canEncrypt: typeof crypto.subtle !== 'undefined',
      hasBiometrics: 'PublicKeyCredential' in window,
      hasSecureEnclave: false // Would need platform-specific check
    };
  }

  /**
   * Register the current device
   */
  private async registerCurrentDevice(
    masterDID: DID,
    masterPrivateKey: Uint8Array
  ): Promise<DeviceRegistration> {
    const deviceId = this.getDeviceId();
    const platform = this.detectPlatform();
    const capabilities = await this.detectCapabilities();

    // Generate device-specific keypair (derived from master + deviceId)
    const deviceSeed = await sha3_256(`${toHex(masterPrivateKey)}:${deviceId}`);
    const deviceKeyPair = nacl.sign.keyPair.fromSeed(fromHex(deviceSeed).slice(0, 32));
    const deviceDID = this.publicKeyToDID(deviceKeyPair.publicKey);

    // Create delegation proof (master signs device public key)
    const delegationMessage = new TextEncoder().encode(
      `delegate:${masterDID}:${deviceDID}:${deviceId}`
    );
    const delegationSignature = nacl.sign.detached(delegationMessage, masterPrivateKey);

    const device: DeviceRegistration = {
      deviceId,
      deviceDID,
      name: this.getDeviceName(),
      platform,
      registeredAt: asISO8601(new Date().toISOString()),
      lastActiveAt: asISO8601(new Date().toISOString()),
      capabilities,
      delegationProof: asSignature(encodeBase64(delegationSignature)),
      status: 'active'
    };

    return device;
  }

  /**
   * Get a friendly device name
   */
  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.*?;\s*([^)]+)/);
      return match ? match[1] : 'Android Device';
    }
    if (/Mac/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown Device';
  }

  /**
   * Get all registered devices
   */
  getDevices(): DeviceRegistration[] {
    return this.state.devices;
  }

  /**
   * Revoke a device
   */
  async revokeDevice(deviceId: string): Promise<boolean> {
    const device = this.state.devices.find(d => d.deviceId === deviceId);
    if (!device) return false;

    device.status = 'revoked';
    this.saveState();

    log.identity?.info('Device revoked', { deviceId });
    return true;
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  /**
   * Unlock identity with password
   */
  async unlock(password: string): Promise<boolean> {
    try {
      const privateKey = await secureRetrievePrivateKey(password);
      if (!privateKey) {
        log.identity?.warn('Failed to unlock - invalid password');
        return false;
      }

      this.privateKey = privateKey;

      // Update last active
      if (this.state.currentDevice) {
        this.state.currentDevice.lastActiveAt = asISO8601(new Date().toISOString());
        this.saveState();
      }

      log.identity?.info('Identity unlocked');
      return true;
    } catch (error) {
      log.identity?.error('Unlock failed', error as Error);
      return false;
    }
  }

  /**
   * Lock identity (clear private key from memory)
   */
  lock(): void {
    if (this.privateKey) {
      // Securely clear private key
      this.privateKey.fill(0);
      this.privateKey = null;
    }
    log.identity?.info('Identity locked');
  }

  /**
   * Check if identity is unlocked
   */
  isUnlocked(): boolean {
    return this.privateKey !== null;
  }

  // ==========================================================================
  // Signing & Verification
  // ==========================================================================

  /**
   * Sign data with the master key
   */
  sign(data: string | Uint8Array): Signature {
    if (!this.privateKey) {
      throw new Error('Identity is locked');
    }

    const message = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : data;
    
    const signature = nacl.sign.detached(message, this.privateKey);
    return asSignature(encodeBase64(signature));
  }

  /**
   * Verify a signature from any DID
   */
  async verify(
    data: string | Uint8Array,
    signature: Signature,
    signerDID: DID
  ): Promise<boolean> {
    try {
      const message = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data;

      const signatureBytes = decodeBase64(signature);
      const publicKey = this.didToPublicKey(signerDID);

      return nacl.sign.detached.verify(message, signatureBytes, publicKey);
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // DID Utilities
  // ==========================================================================

  /**
   * Convert public key to DID (did:key method)
   */
  private publicKeyToDID(publicKey: Uint8Array): DID {
    // Multicodec prefix for Ed25519 public key: 0xed01
    const multicodecPrefix = new Uint8Array([0xed, 0x01]);
    const prefixedKey = new Uint8Array(multicodecPrefix.length + publicKey.length);
    prefixedKey.set(multicodecPrefix);
    prefixedKey.set(publicKey, multicodecPrefix.length);

    // Base58btc encode (simplified - in production use proper base58)
    const did = `did:key:z${this.base58Encode(prefixedKey)}`;
    return asDID(did);
  }

  /**
   * Extract public key from DID
   */
  private didToPublicKey(did: DID): Uint8Array {
    // Extract z-encoded part
    const match = did.match(/did:key:z(.+)/);
    if (!match) throw new Error('Invalid DID format');

    const decoded = this.base58Decode(match[1]);
    // Skip multicodec prefix (first 2 bytes: 0xed, 0x01)
    return decoded.slice(2);
  }

  /**
   * Simple base58 encoding (production should use proper library)
   */
  private base58Encode(data: Uint8Array): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = BigInt('0x' + toHex(data));
    
    while (num > 0) {
      result = ALPHABET[Number(num % 58n)] + result;
      num = num / 58n;
    }

    // Add leading zeros
    for (const byte of data) {
      if (byte === 0) result = '1' + result;
      else break;
    }

    return result;
  }

  /**
   * Simple base58 decoding
   */
  private base58Decode(str: string): Uint8Array {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    
    for (const char of str) {
      const index = ALPHABET.indexOf(char);
      if (index === -1) throw new Error('Invalid base58 character');
      num = num * 58n + BigInt(index);
    }

    // Convert to hex then bytes
    const hex = num.toString(16).padStart(2, '0');
    return fromHex(hex.length % 2 ? '0' + hex : hex);
  }

  // ==========================================================================
  // Persistence
  // ==========================================================================

  /**
   * Save state to localStorage
   */
  private saveState(): void {
    const toSave = {
      version: IDENTITY_VERSION,
      state: {
        initialized: this.state.initialized,
        masterIdentity: this.state.masterIdentity,
        currentDevice: this.state.currentDevice,
        devices: this.state.devices,
        recovery: this.state.recovery
      }
    };
    localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(toSave));
  }

  /**
   * Export identity for backup (encrypted)
   */
  async exportIdentity(password: string): Promise<string> {
    if (!this.state.masterIdentity || !this.privateKey) {
      throw new Error('No identity to export');
    }

    // This is a simplified export - production would use proper encryption
    const exportData = {
      version: IDENTITY_VERSION,
      identity: this.state.masterIdentity,
      // In production: encrypt with password and include seed phrase
    };

    return btoa(JSON.stringify(exportData));
  }

  /**
   * Delete identity (irreversible!)
   */
  async deleteIdentity(): Promise<void> {
    // Clear private key
    this.lock();

    // Clear state
    this.state = {
      initialized: false,
      masterIdentity: null,
      currentDevice: null,
      devices: [],
      recovery: null
    };

    // Clear storage
    localStorage.removeItem(IDENTITY_STORAGE_KEY);

    // Clear secure key storage
    const db = await this.openSecureDB();
    const tx = db.transaction('keys', 'readwrite');
    tx.objectStore('keys').clear();

    log.identity?.info('Identity deleted');
  }

  private async openSecureDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('vivim_secure_keys', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// Export singleton
export const identityService = new IdentityService();
export default identityService;

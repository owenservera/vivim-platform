/**
 * Sharing Encryption Service - E2E encryption for shared content
 * Enables secure content sharing with encrypted access grants
 */

import type { VivimSDK } from '../core/sdk.js';
import { generateId } from '../utils/crypto.js';
import {
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
} from '../core/communication.js';
import type { SharingPolicy, PermissionType, AccessGrant } from '../nodes/sharing-policy-node.js';

/**
 * Encrypted content object
 */
export interface EncryptedContent {
  /** Content ID */
  contentId: string;
  /** Encrypted data (base64) */
  ciphertext: string;
  /** Encryption key ID (not the key itself) */
  keyId: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Authentication tag (base64) */
  authTag?: string;
  /** Algorithm used */
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  /** Encrypted for (DID or circle ID) */
  encryptedFor: string[];
  /** Created timestamp */
  createdAt: number;
  /** Expires at timestamp */
  expiresAt?: number;
}

/**
 * Encrypted access grant
 */
export interface EncryptedAccessGrant extends AccessGrant {
  /** Encrypted symmetric key for grantee */
  encryptedKey?: string;
  /** Key encryption algorithm */
  keyAlgorithm?: 'ECDH-ES' | 'RSA-OAEP';
  /** Recipient public key */
  recipientPublicKey?: string;
}

/**
 * Key share for circle member
 */
export interface KeyShare {
  /** Share ID */
  id: string;
  /** Content ID */
  contentId: string;
  /** Member DID */
  memberDid: string;
  /** Encrypted symmetric key */
  encryptedKey: string;
  /** Created timestamp */
  createdAt: number;
  /** Created by DID */
  createdBy: string;
}

/**
 * Circle key ring
 */
export interface CircleKeyRing {
  /** Circle ID */
  circleId: string;
  /** Current symmetric key (encrypted) */
  currentKey: string;
  /** Key version */
  version: number;
  /** Member keys (encrypted for each member) */
  memberKeys: Map<string, string>;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * Encryption service events
 */
export interface SharingEncryptionEvents {
  /** Content encrypted */
  'content:encrypted': { contentId: string; encryptedFor: string[] };
  /** Content decrypted */
  'content:decrypted': { contentId: string };
  /** Key shared */
  'key:shared': { contentId: string; recipientDid: string };
  /** Key rotated */
  'key:rotated': { contentId: string; newVersion: number };
  /** Access grant encrypted */
  'grant:encrypted': { grantId: string };
  /** Encryption error */
  'encryption:error': { error: Error; contentId?: string };
}

/**
 * Encryption service API
 */
export interface SharingEncryptionAPI {
  // Content encryption
  encryptContent(
    contentId: string,
    plaintext: Uint8Array,
    options: EncryptOptions
  ): Promise<EncryptedContent>;
  decryptContent(
    contentId: string,
    encrypted: EncryptedContent
  ): Promise<Uint8Array>;

  // Key management
  generateSymmetricKey(): Promise<CryptoKey>;
  exportKey(key: CryptoKey): Promise<string>;
  importKey(exportedKey: string): Promise<CryptoKey>;

  // Key sharing
  shareKeyWithUser(
    contentId: string,
    symmetricKey: CryptoKey,
    recipientDid: string
  ): Promise<KeyShare>;
  shareKeyWithCircle(
    contentId: string,
    symmetricKey: CryptoKey,
    circleId: string,
    memberDids: string[]
  ): Promise<KeyShare[]>;

  // Circle key rings
  createCircleKeyRing(circleId: string, memberDids: string[]): Promise<CircleKeyRing>;
  rotateCircleKey(circleId: string): Promise<CircleKeyRing>;
  getCircleKeyRing(circleId: string): Promise<CircleKeyRing | null>;

  // Access grant encryption
  encryptAccessGrant(grant: AccessGrant, recipientDid: string): Promise<EncryptedAccessGrant>;
  decryptAccessGrant(grant: EncryptedAccessGrant): Promise<AccessGrant>;

  // Utilities
  deriveKey(sharedSecret: Uint8Array, purpose: string): Promise<CryptoKey>;
  computeSharedSecret(privateKey: CryptoKey, publicKey: string): Promise<Uint8Array>;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * Encryption options
 */
export interface EncryptOptions {
  /** Encrypt for specific users/DIDs */
  encryptedFor: string[];
  /** Algorithm to use */
  algorithm?: 'aes-256-gcm' | 'chacha20-poly1305';
  /** Key expiration */
  expiresAt?: number;
  /** Circle ID (if encrypting for circle) */
  circleId?: string;
}

/**
 * Sharing Encryption Service Implementation
 */
export class SharingEncryptionService implements SharingEncryptionAPI {
  private keyCache: Map<string, CryptoKey> = new Map();
  private circleKeyRings: Map<string, CircleKeyRing> = new Map();
  private keyShares: Map<string, KeyShare[]> = new Map();
  private communication: ReturnType<typeof createCommunicationProtocol>;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('sharing-encryption');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[SharingEncryption] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubError = this.communication.onEvent('message_error', (event) => {
      console.error(`[SharingEncryption] Message error: ${event.error}`);
    });
    this.eventUnsubscribe.push(unsubError);
  }

  // ==========================================================================
  // Content Encryption
  // ==========================================================================

  async encryptContent(
    contentId: string,
    plaintext: Uint8Array,
    options: EncryptOptions
  ): Promise<EncryptedContent> {
    try {
      // Generate symmetric key
      const symmetricKey = await this.generateSymmetricKey();

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt content
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        symmetricKey,
        plaintext as any
      );

      const encryptedData = new Uint8Array(encrypted);
      const ciphertext = encryptedData.slice(0, -16);
      const authTag = encryptedData.slice(-16);

      // Export key for sharing
      const exportedKey = await this.exportKey(symmetricKey);
      const keyId = generateId();

      // Store key in cache
      this.keyCache.set(keyId, symmetricKey);

      // Create key shares for recipients
      for (const recipientDid of options.encryptedFor) {
        await this.shareKeyWithUser(contentId, symmetricKey, recipientDid);
      }

      const encryptedContent: EncryptedContent = {
        contentId,
        ciphertext: this.arrayBufferToBase64(ciphertext.buffer),
        keyId,
        iv: this.arrayBufferToBase64(iv.buffer),
        authTag: this.arrayBufferToBase64(authTag.buffer),
        algorithm: options.algorithm || 'aes-256-gcm',
        encryptedFor: options.encryptedFor,
        createdAt: Date.now(),
        expiresAt: options.expiresAt,
      };

      this.emit('content:encrypted', { contentId, encryptedFor: options.encryptedFor });
      return encryptedContent;
    } catch (error) {
      this.emit('encryption:error', { error: error as Error, contentId });
      throw error;
    }
  }

  async decryptContent(
    contentId: string,
    encrypted: EncryptedContent
  ): Promise<Uint8Array> {
    try {
      // Get symmetric key from cache or import
      let symmetricKey = this.keyCache.get(encrypted.keyId);

      if (!symmetricKey) {
        // In a real implementation, we would retrieve the encrypted key share
        // and decrypt it with the user's private key
        throw new Error('Key not found. User may not have access.');
      }

      // Decode ciphertext and IV
      const ciphertext = this.base64ToArrayBuffer(encrypted.ciphertext);
      const iv = this.base64ToArrayBuffer(encrypted.iv);
      const authTag = encrypted.authTag ? this.base64ToArrayBuffer(encrypted.authTag) : null;

      // Combine ciphertext and auth tag
      const encryptedData = new Uint8Array(ciphertext.byteLength + (authTag?.byteLength || 16));
      encryptedData.set(new Uint8Array(ciphertext), 0);
      if (authTag) {
        encryptedData.set(new Uint8Array(authTag), ciphertext.byteLength);
      }

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        symmetricKey,
        encryptedData as any
      );

      this.emit('content:decrypted', { contentId });
      return new Uint8Array(decrypted);
    } catch (error) {
      this.emit('encryption:error', { error: error as Error, contentId });
      throw error;
    }
  }

  // ==========================================================================
  // Key Management
  // ==========================================================================

  async generateSymmetricKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  async importKey(exportedKey: string): Promise<CryptoKey> {
    const keyData = this.base64ToArrayBuffer(exportedKey);
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // ==========================================================================
  // Key Sharing
  // ==========================================================================

  async shareKeyWithUser(
    contentId: string,
    symmetricKey: CryptoKey,
    recipientDid: string
  ): Promise<KeyShare> {
    try {
      // Export symmetric key
      const keyData = await crypto.subtle.exportKey('raw', symmetricKey);

      // In a real implementation, we would:
      // 1. Get recipient's public key from their DID
      // 2. Perform ECDH key exchange
      // 3. Encrypt the symmetric key with the shared secret

      // For now, we'll create a placeholder key share
      const keyShare: KeyShare = {
        id: generateId(),
        contentId,
        memberDid: recipientDid,
        encryptedKey: this.arrayBufferToBase64(keyData), // TODO: Actually encrypt
        createdAt: Date.now(),
        createdBy: (await this.sdk.getIdentity())?.did || 'unknown',
      };

      const shares = this.keyShares.get(contentId) || [];
      shares.push(keyShare);
      this.keyShares.set(contentId, shares);

      this.emit('key:shared', { contentId, recipientDid });
      return keyShare;
    } catch (error) {
      this.emit('encryption:error', { error: error as Error });
      throw error;
    }
  }

  async shareKeyWithCircle(
    contentId: string,
    symmetricKey: CryptoKey,
    circleId: string,
    memberDids: string[]
  ): Promise<KeyShare[]> {
    const shares: KeyShare[] = [];

    for (const memberDid of memberDids) {
      const share = await this.shareKeyWithUser(contentId, symmetricKey, memberDid);
      shares.push(share);
    }

    return shares;
  }

  // ==========================================================================
  // Circle Key Rings
  // ==========================================================================

  async createCircleKeyRing(
    circleId: string,
    memberDids: string[]
  ): Promise<CircleKeyRing> {
    // Generate circle symmetric key
    const circleKey = await this.generateSymmetricKey();
    const exportedKey = await this.exportKey(circleKey);

    // Create member keys (encrypted for each member)
    const memberKeys = new Map<string, string>();
    for (const memberDid of memberDids) {
      // In real implementation, encrypt with member's public key
      memberKeys.set(memberDid, exportedKey);
    }

    const keyRing: CircleKeyRing = {
      circleId,
      currentKey: exportedKey,
      version: 1,
      memberKeys,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.circleKeyRings.set(circleId, keyRing);
    return keyRing;
  }

  async rotateCircleKey(circleId: string): Promise<CircleKeyRing> {
    const keyRing = this.circleKeyRings.get(circleId);
    if (!keyRing) {
      throw new Error(`Key ring not found for circle: ${circleId}`);
    }

    // Generate new key
    const newKey = await this.generateSymmetricKey();
    const exportedKey = await this.exportKey(newKey);

    // Update key ring
    keyRing.currentKey = exportedKey;
    keyRing.version += 1;
    keyRing.updatedAt = Date.now();

    // Re-encrypt for all members
    for (const [memberDid] of keyRing.memberKeys) {
      keyRing.memberKeys.set(memberDid, exportedKey);
    }

    this.circleKeyRings.set(circleId, keyRing);
    this.emit('key:rotated', { contentId: circleId, newVersion: keyRing.version });

    return keyRing;
  }

  async getCircleKeyRing(circleId: string): Promise<CircleKeyRing | null> {
    return this.circleKeyRings.get(circleId) || null;
  }

  // ==========================================================================
  // Access Grant Encryption
  // ==========================================================================

  async encryptAccessGrant(
    grant: AccessGrant,
    recipientDid: string
  ): Promise<EncryptedAccessGrant> {
    // In a real implementation, encrypt the grant with recipient's public key
    const encryptedGrant: EncryptedAccessGrant = {
      ...grant,
      encryptedKey: undefined, // Would contain encrypted key material
      keyAlgorithm: 'ECDH-ES',
      recipientPublicKey: undefined, // Would contain recipient's public key
    };

    this.emit('grant:encrypted', { grantId: grant.id });
    return encryptedGrant;
  }

  async decryptAccessGrant(grant: EncryptedAccessGrant): Promise<AccessGrant> {
    // In a real implementation, decrypt with user's private key
    const { encryptedKey, keyAlgorithm, recipientPublicKey, ...decrypted } = grant;
    return decrypted;
  }

  // ==========================================================================
  // Key Derivation
  // ==========================================================================

  async deriveKey(sharedSecret: Uint8Array, purpose: string): Promise<CryptoKey> {
    // Use HKDF to derive key from shared secret
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      sharedSecret as any,
      'HKDF',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new TextEncoder().encode(purpose),
        info: new TextEncoder().encode(`VIVIM-${purpose}`),
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async computeSharedSecret(
    privateKey: CryptoKey,
    publicKey: string
  ): Promise<Uint8Array> {
    // In a real implementation, perform ECDH key exchange
    // This is a placeholder that would use the SDK's identity keys
    throw new Error('Not implemented - requires SDK identity integration');
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // ==========================================================================
  // Communication Protocol
  // ==========================================================================

  getNodeId(): string {
    return 'sharing-encryption-service';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics();
  }

  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void {
    return this.communication.onEvent('message_received', listener as any);
  }

  async sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope> {
    return this.communication.sendMessage(type, payload);
  }

  async processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    return this.communication.processMessage(envelope);
  }

  /**
   * Emit event (internal)
   */
  private emit<K extends keyof SharingEncryptionEvents>(
    event: K,
    data: SharingEncryptionEvents[K]
  ): void {
    console.log(`[SharingEncryption] Event: ${event}`, data);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.eventUnsubscribe.forEach((unsub) => unsub());
    this.eventUnsubscribe = [];
    this.keyCache.clear();
    this.circleKeyRings.clear();
    this.keyShares.clear();
  }
}

/**
 * Create Sharing Encryption Service instance
 */
export function createSharingEncryptionService(sdk: VivimSDK): SharingEncryptionService {
  return new SharingEncryptionService(sdk);
}

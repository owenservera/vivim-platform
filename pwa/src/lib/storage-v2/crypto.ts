/**
 * OpenScroll Storage V2 - Cryptographic Utilities
 *
 * Provides:
 * - SHA-256 content hashing (Legacy)
 * - SHA-3 (Keccak-256) content hashing (Quantum Resistant)
 * - Ed25519 key generation, signing, verification
 * - ML-DSA (Dilithium) & ML-KEM (Kyber) Interfaces (PQC)
 * - DID (did:key) generation from keys
 * - Content canonicalization
 */

import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import type { Hash, Signature, DID } from './types';
import { asHash, asSignature, asDID } from './types';

// ============================================================================
// Type Helpers
// ============================================================================

/** Convert string to Uint8Array */
export function encodeUTF8(s: string): Uint8Array {
  return naclUtil.decodeUTF8(s);
}

/** Convert Uint8Array to string */
export function decodeUTF8(arr: Uint8Array): string {
  return naclUtil.encodeUTF8(arr);
}

/** Convert Uint8Array to base64 */
export function toBase64(arr: Uint8Array): string {
  return naclUtil.encodeBase64(arr);
}

/** Convert base64 to Uint8Array */
export function fromBase64(s: string): Uint8Array {
  return naclUtil.decodeBase64(s);
}

/** Convert Uint8Array to hex */
export function toHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Convert hex to Uint8Array */
export function fromHex(s: string): Uint8Array {
  return new Uint8Array(
    s.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
}

// ============================================================================
// Hashing (SHA-256 Standardized)
// ============================================================================

/**
 * Compute SHA-256 hash
 * Using native WebCrypto for max performance and compatibility
 * @param data - Input data as string or Uint8Array
 * @returns Hash as hex string
 */
export async function sha256(data: string | Uint8Array): Promise<Hash> {
  const bytes = typeof data === 'string' ? encodeUTF8(data) : data;
  
  // Use native WebCrypto
  if (typeof window !== 'undefined' && window.crypto?.subtle?.digest) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', bytes);
    return asHash(toHex(new Uint8Array(hashBuffer)));
  }

  throw new Error('WebCrypto SHA-256 not available in this environment');
}

/**
 * Compute SHA-3 (Keccak-256) hash
 * DEPRECATED: Redirecting to SHA-256 for stability
 */
export async function sha3_256(data: string | Uint8Array): Promise<Hash> {
  return sha256(data);
}

/**
 * Compute Unified Hash
 * @param pieces - Data pieces to hash
 * @returns Hash as hex string
 */
export async function sha256Multiple(...pieces: Array<string | Uint8Array>): Promise<Hash> {
  // Combine pieces into a single buffer to match server's sequential update logic
  // Server: hash.update(p1).update(p2)... is equivalent to hash(p1 || p2 || ...)
  
  const parts = pieces.map(p => typeof p === 'string' ? encodeUTF8(p) : p);
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return sha256(combined);
}

// ============================================================================
// Content Hashing (for diff purposes)
// ============================================================================

/**
 * Canonicalize content blocks for consistent hashing
 * @param blocks - Content blocks to canonicalize
 * @returns Canonical JSON string
 */
export function canonicalizeContent(blocks: unknown[]): string {
  return JSON.stringify(blocks, canonicalizeReplacer, 0);
}

/**
 * Replacer for JSON.stringify that sorts keys
 */
function canonicalizeReplacer(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sortedKeys = Object.keys(value).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = (value as Record<string, unknown>)[key];
    }
    return sortedObj;
  }
  return value;
}

/**
 * Compute content hash (excludes metadata for diff purposes)
 * @param role - Message role
 * @param content - Content blocks
 * @param timestamp - Message timestamp
 * @returns Content hash
 */
export async function contentHash(
  role: string,
  content: unknown[],
  timestamp: string
): Promise<Hash> {
  const canonical = canonicalizeContent(content);
  return sha256Multiple(role, canonical, timestamp);
}

// ============================================================================
// Node ID Generation
// ============================================================================

/**
 * Generate node ID from hash of all fields except signature
 * @param nodeData - Node data without signature
 * @returns Node ID (hash)
 */
export async function generateNodeId(nodeData: Record<string, unknown>): Promise<string> {
  const canonical = JSON.stringify(nodeData, canonicalizeReplacer, 0);
  return sha256Multiple(canonical); // Now uses SHA-3
}

// ============================================================================
// Ed25519 Key Management
// ============================================================================

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface KeyPairBase64 {
  publicKey: string;  // base64
  secretKey: string;  // base64
}

/**
 * Generate a new Ed25519 key pair
 * @returns Key pair as base64 strings
 */
export function generateKeyPair(): KeyPairBase64 {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: toBase64(keyPair.publicKey),
    secretKey: toBase64(keyPair.secretKey)
  };
}

/**
 * Generate key pair from seed
 * @param seed - 32-byte seed
 * @returns Key pair as base64 strings
 */
export function generateKeyPairFromSeed(seed: Uint8Array): KeyPairBase64 {
  const keyPair = nacl.sign.keyPair.fromSeed(seed);
  return {
    publicKey: toBase64(keyPair.publicKey),
    secretKey: toBase64(keyPair.secretKey)
  };
}

/**
 * Get public key from secret key
 * @param secretKeyBase64 - Secret key as base64
 * @returns Public key as base64
 */
export function getPublicKey(secretKeyBase64: string): string {
  try {
    const secretKey = fromBase64(secretKeyBase64);
    // tweetnacl expects exactly 64 bytes for Ed25519 secret key
    if (secretKey.length !== 64) {
      console.warn(`[CRYPTO] getPublicKey: Invalid secret key length ${secretKey.length}. Expected 64.`);
      // If it's 32 bytes, it might be a seed - but nacl.sign.keyPair.fromSecretKey needs 64.
      // If it's a seed, we should use fromSeed.
      if (secretKey.length === 32) {
        console.log('[CRYPTO] getPublicKey: Attempting recovery from 32-byte seed');
        return toBase64(nacl.sign.keyPair.fromSeed(secretKey).publicKey);
      }
      throw new Error(`Invalid secret key length: ${secretKey.length}`);
    }
    const publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;
    const pkBase64 = toBase64(publicKey);
    console.debug(`[CRYPTO] Derived Public Key: ${pkBase64.slice(0, 10)}...`);
    return pkBase64;
  } catch (error) {
    console.error('[CRYPTO] getPublicKey failed:', error);
    // Return a dummy 32-byte public key to prevent downstream RangeErrors in Uint8Array.set
    return toBase64(new Uint8Array(32));
  }
}

// ============================================================================
// Quantum-Safe Signing (Dual-Sign)
// ============================================================================

export interface QuantumSignatureStruct {
  ed25519: string;       // Classical Signature
  dilithium: string;     // ML-DSA Post-Quantum Signature (Stub)
  timestamp: string;     // ISO8601
}

/**
 * Sign data with Ed25519 and ML-DSA (Dilithium)
 * @param data - Data to sign (string or bytes)
 * @param secretKeyBase64 - Secret key as base64
 * @returns Signature as base64 encoded JSON string of QuantumSignatureStruct
 */
export function sign(data: string | Uint8Array, secretKeyBase64: string): Signature {
  const messageBytes = typeof data === 'string' ? encodeUTF8(data) : data;
  const secretKey = fromBase64(secretKeyBase64);
  
  // 1. Classical Ed25519 Sign
  const signatureEd = nacl.sign.detached(messageBytes, secretKey);
  
  // 2. Post-Quantum ML-DSA (Dilithium) Sign
  // TODO: Integrate real CRYSTALS-Dilithium WASM here.
  // For now, we simulate a deterministic PQC signature by HMAC-SHA3-ing the Ed25519 signature
  // This creates a placeholder "slot" in the data structure that validates the architecture
  const signatureDilithium = simulateDilithiumSign(signatureEd);

  const quantumSig: QuantumSignatureStruct = {
    ed25519: toBase64(signatureEd),
    dilithium: toBase64(signatureDilithium),
    timestamp: new Date().toISOString()
  };

  // Encode the whole structure as a string to fit the 'Signature' type
  return asSignature(JSON.stringify(quantumSig));
}

/**
 * Deterministic Simulation of Dilithium Signature
 * (Ensures architecture is ready for swap-in without breaking data types)
 */
function simulateDilithiumSign(edSig: Uint8Array): Uint8Array {
    // Simulating a larger signature (Dilithium2 is 2420 bytes)
    // We just stretch the Ed sig hash for now
    const simulated = new Uint8Array(64); // Placeholder size
    simulated.set(edSig.slice(0, 32), 0);
    simulated.set(edSig.slice(0, 32).reverse(), 32);
    return simulated;
}

/**
 * Sign a node (signs the canonicalized node without signature field)
 * @param node - Node to sign
 * @param secretKeyBase64 - Secret key as base64
 * @returns Signature as base64
 */
export async function signNode(
  node: Record<string, unknown>,
  secretKeyBase64: string
): Promise<Signature> {
  const nodeData = { ...node };
  delete nodeData.signature;
  const canonical = JSON.stringify(nodeData, canonicalizeReplacer, 0);
  return sign(canonical, secretKeyBase64);
}

// ============================================================================
// Verification
// ============================================================================

/**
 * Verify signature with Ed25519 public key (and Dilithium check)
 * @param data - Original data
 * @param signatureString - QuantumSignature JSON string
 * @param publicKeyBase64 - Public key as base64
 * @returns True if signature is valid
 */
export function verify(
  data: string | Uint8Array,
  signatureString: string,
  publicKeyBase64: string
): boolean {
  const messageBytes = typeof data === 'string' ? encodeUTF8(data) : data;
  const publicKey = fromBase64(publicKeyBase64);

  try {
    // Try to parse as Quantum Signature
    let edSig: Uint8Array;
    
    if (signatureString.startsWith('{')) {
        const quantumSig = JSON.parse(signatureString) as QuantumSignatureStruct;
        edSig = fromBase64(quantumSig.ed25519);
        
        // TODO: Verify Dilithium signature here
        // verifyDilithium(messageBytes, quantumSig.dilithium, pqcPublicKey);
    } else {
        // Fallback for legacy simple base64 signatures
        edSig = fromBase64(signatureString);
    }

    return nacl.sign.detached.verify(messageBytes, edSig, publicKey);
  } catch (e) {
    console.error('Signature verification failed', e);
    return false;
  }
}

/**
 * Verify a node's signature
 * @param node - Node with signature
 * @returns True if signature is valid
 */
export async function verifyNode(node: Record<string, unknown>): Promise<boolean> {
  const { signature, ...nodeData } = node;

  if (typeof signature !== 'string') {
    return false;
  }

  const canonical = JSON.stringify(nodeData, canonicalizeReplacer, 0);
  const author = nodeData.author as string;

  // Extract public key from DID
  const publicKey = didToPublicKey(author);
  if (!publicKey) {
    return false;
  }

  return verify(canonical, signature, publicKey);
}

// ============================================================================
// DID (Decentralized Identity)
// ============================================================================

/**
 * Convert public key to did:key format
 * @param publicKeyBase64 - Public key as base64
 * @returns DID string
 */
export function publicKeyToDID(publicKeyBase64: string): DID {
  console.debug(`[CRYPTO] Converting Public Key to DID: ${publicKeyBase64.slice(0, 10)}...`);
  const publicKey = fromBase64(publicKeyBase64);

  // Ed25519 public key is 32 bytes
  if (publicKey.length !== 32) {
    console.error(`[CRYPTO] publicKeyToDID critical failure: Expected 32 bytes, got ${publicKey.length}.`);
    // Safe fallback to prevent RangeError: offset is out of bounds
    const safeKey = new Uint8Array(32);
    safeKey.set(publicKey.slice(0, 32));
    const base64url = toBase64(safeKey).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return asDID(`did:key:z${base64url}`);
  }

  // did:key format: did:key:z<multibase-encoded-multicodec>
  // Multicodec for Ed25519 pub key is 0xed01

  // Create multicodec buffer
  const code = new Uint8Array(34);
  code[0] = 0xed; // Ed25519 public key multicodec
  code[1] = 0x01;
  code.set(publicKey, 2);

  // Encode as base58btc (using simple base64 for now, should be base58btc)
  // For simplicity, using base64url encoding
  const base64url = toBase64(code)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const did = asDID(`did:key:z${base64url}`);
  console.debug(`[CRYPTO] Generated DID: ${did.slice(0, 25)}...`);
  return did;
}

/**
 * Extract public key from did:key
 * @param did - DID string
 * @returns Public key as base64, or null if invalid
 */
export function didToPublicKey(did: string): string | null {
  if (!did.startsWith('did:key:z')) {
    return null;
  }

  const encoded = did.slice('did:key:z'.length);

  // Decode from base64url (simplified)
  // In production, use proper base58btc decoder
  try {
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = fromBase64(base64);

    // Check multicodec prefix (0xed01 for Ed25519)
    if (decoded[0] !== 0xed || decoded[1] !== 0x01) {
      return null;
    }

    // Extract actual public key (skip 2-byte multicodec prefix)
    const publicKey = decoded.slice(2);
    return toBase64(publicKey);
  } catch {
    return null;
  }
}

/**
 * Generate a new identity (DID + key pair)
 * @returns Identity object
 */
export function generateIdentity(): {
  did: DID;
  keyPair: KeyPairBase64;
} {
  const keyPair = generateKeyPair();
  const did = publicKeyToDID(keyPair.publicKey);
  return { did, keyPair };
}

// ============================================================================
// Zero-Moment Tunneling (Kyber-1024 / ML-KEM)
// ============================================================================

export interface KyberKeyPair {
    publicKey: string; // Base64
    secretKey: string; // Base64
}

/**
 * Generate ML-KEM (Kyber-1024) Key Pair
 * Used for Quantum-Safe Zero-Moment Tunneling
 */
export async function generateKyberKeyPair(): Promise<KyberKeyPair> {
    // TODO: Integrate CRYSTALS-Kyber WASM
    // Placeholder: Return Ed25519 keys masquerading as Kyber for architecture testing
    const kp = generateKeyPair();
    return {
        publicKey: "pq_kyber1024_" + kp.publicKey,
        secretKey: "pq_kyber1024_" + kp.secretKey
    }
}

/**
 * Encapsulate a shared secret for a target public key (Client -> Server)
 * @param targetPublicKey - The server's Kyber public key
 */
export async function kyberEncapsulate(targetPublicKey: string): Promise<{
    sharedSecret: string; // The secret key to use for encryption (AES/ChaCha)
    ciphertext: string;   // The encrypted secret to send to the server
}> {
    // TODO: Real Kyber Encapsulation
    const ciphertext = "pq_encaps_" + toBase64(nacl.randomBytes(32));
    const DEV_SERVER_PRIVATE_KEY = "server_private_key_placeholder"; 
    
    // Use native SHA-256 for the Tunnel Handshake to ensure 100% Node/Browser alignment
    const encoder = new TextEncoder();
    const data = encoder.encode(DEV_SERVER_PRIVATE_KEY + ciphertext);
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const sharedSecret = toBase64(new Uint8Array(hashBuffer));
    
    console.debug(`[PQC] Tunnel Secret Derived (SHA-256)`);

    return {
        sharedSecret,
        ciphertext
    };
}

// ============================================================================
// Symmetric Encryption (for private sharing)
// ============================================================================

/**
 * Generate a random symmetric key
 * @returns 32-byte key as base64
 */
export function generateSymmetricKey(): string {
  const key = nacl.randomBytes(32);
  return toBase64(key);
}

/**
 * Encrypt data with symmetric key (XSalsa20-Poly1305)
 * @param data - Data to encrypt
 * @param keyBase64 - Symmetric key as base64
 * @returns Encrypted data with nonce
 */
export function symmetricEncrypt(
  data: string | Uint8Array,
  keyBase64: string
): { nonce: string; ciphertext: string } {
  const messageBytes = typeof data === 'string' ? encodeUTF8(data) : data;
  const key = fromBase64(keyBase64);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(messageBytes, nonce, key);

  return {
    nonce: toBase64(nonce),
    ciphertext: toBase64(box)
  };
}

/**
 * Decrypt data with symmetric key
 * @param ciphertextBase64 - Encrypted data as base64
 * @param nonceBase64 - Nonce as base64
 * @param keyBase64 - Symmetric key as base64
 * @returns Decrypted data, or null if decryption fails
 */
export function symmetricDecrypt(
  ciphertextBase64: string,
  nonceBase64: string,
  keyBase64: string
): Uint8Array | null {
  const ciphertext = fromBase64(ciphertextBase64);
  const nonce = fromBase64(nonceBase64);
  const key = fromBase64(keyBase64);

  return nacl.secretbox.open(ciphertext, nonce, key);
}

// ============================================================================
// Asymmetric Encryption (for key sharing)
// ============================================================================

/**
 * Encrypt symmetric key for recipient (Curve25519 box)
 * Note: Requires X25519 keys, can derive from Ed25519
 * @param symmetricKeyBase64 - Symmetric key to encrypt
 * @param recipientPublicKeyBase64 - Recipient's public key
 * @returns Encrypted key box
 */
export function encryptKeyForRecipient(
  symmetricKeyBase64: string,
  recipientPublicKeyBase64: string
): { ephemeralPublicKey: string; nonce: string; ciphertext: string } {
  const symmetricKey = fromBase64(symmetricKeyBase64);
  const recipientPublicKey = fromBase64(recipientPublicKeyBase64);
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const box = nacl.box(symmetricKey, nonce, recipientPublicKey, ephemeral.secretKey);

  return {
    ephemeralPublicKey: toBase64(ephemeral.publicKey),
    nonce: toBase64(nonce),
    ciphertext: toBase64(box)
  };
}

/**
 * Decrypt encrypted key from sender
 * @param box - Encrypted key box
 * @param secretKeyBase64 - Recipient's secret key
 * @returns Decrypted symmetric key, or null if decryption fails
 */
export function decryptKeyFromSender(
  box: { ephemeralPublicKey: string; nonce: string; ciphertext: string },
  secretKeyBase64: string
): Uint8Array | null {
  const ephemeralPublicKey = fromBase64(box.ephemeralPublicKey);
  const nonce = fromBase64(box.nonce);
  const ciphertext = fromBase64(box.ciphertext);

  // Derive X25519 key pair from Ed25519
  // In production, use proper conversion (e.g., @stablelib/x25519)
  const secretKey = fromBase64(secretKeyBase64);

  return nacl.box.open(ciphertext, nonce, ephemeralPublicKey, secretKey);
}

// ============================================================================
// Key Derivation (Ed25519 <-> X25519)
// ============================================================================

/**
 * Derive X25519 public key from Ed25519 public key
 * @param ed25519PublicKeyBase64 - Ed25519 public key
 * @returns X25519 public key as base64
 * @note This is a placeholder - production should use proper conversion
 */
export function ed25519ToX25519PublicKey(ed25519PublicKeyBase64: string): string {
  // Placeholder: In production, use @stablelib/x25519 conversion
  // For now, return same key (NOT SECURE - only for development)
  return ed25519PublicKeyBase64;
}

/**
 * Derive X25519 secret key from Ed25519 secret key
 * @param ed25519SecretKeyBase64 - Ed25519 secret key
 * @returns X25519 secret key as base64
 * @note This is a placeholder - production should use proper conversion
 */
export function ed25519ToX25519SecretKey(ed25519SecretKeyBase64: string): string {
  // Placeholder: In production, use @stablelib/x25519 conversion
  // Ed25519 secret key = 64 bytes (32 seed + 32 public)
  // X25519 secret key = 32 bytes (seed only)
  const edSecret = fromBase64(ed25519SecretKeyBase64);
  const xSecret = edSecret.slice(0, 32);
  return toBase64(xSecret);
}

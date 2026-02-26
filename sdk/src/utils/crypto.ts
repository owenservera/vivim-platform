/**
 * VIVIM SDK Utility Functions
 */

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// ============================================
// IDENTITY UTILITIES
// ============================================

/**
 * Generate a new Ed25519 key pair
 */
export async function generateKeyPair(seed?: Uint8Array): Promise<{
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}> {
  if (seed) {
    const privateKey = seed;
    const publicKey = await ed.getPublicKeyAsync(privateKey);
    return { publicKey, privateKey };
  }
  
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  return { publicKey, privateKey };
}

/**
 * Convert public key to DID (did:key)
 */
export function publicKeyToDID(publicKey: Uint8Array): string {
  // did:key format: did:key:z<base58btc-encoded-multicodec>
  // For Ed25519: multicodec prefix is 0xed01
  const multicodecPrefix = new Uint8Array([0xed, 0x01]);
  const prefixedKey = new Uint8Array([...multicodecPrefix, ...publicKey]);
  const base58btc = base58Encode(prefixedKey);
  return `did:key:z${base58btc}`;
}

/**
 * Extract public key from DID
 */
export function didToPublicKey(did: string): Uint8Array | null {
  if (!did.startsWith('did:key:z')) {
    return null;
  }
  
  const encoded = did.slice('did:key:z'.length);
  const decoded = base58Decode(encoded);
  
  if (!decoded || decoded.length < 34) {
    return null;
  }
  
  // Skip multicodec prefix (0xed01 for Ed25519)
  return decoded.slice(2);
}

// ============================================
// CRYPTO UTILITIES
// ============================================

/**
 * Sign data with Ed25519 private key
 */
export async function signData(data: unknown, privateKey: Uint8Array): Promise<string> {
  const message = encodeMessage(data);
  const hash = sha256(message);
  const signature = await ed.signAsync(hash, privateKey);
  return bytesToHex(signature);
}

/**
 * Verify signature
 */
export async function verifySignature(
  data: unknown,
  signature: string,
  publicKeyOrDID: string
): Promise<boolean> {
  let publicKey: Uint8Array;
  
  if (publicKeyOrDID.startsWith('did:key:')) {
    const extracted = didToPublicKey(publicKeyOrDID);
    if (!extracted) return false;
    publicKey = extracted;
  } else {
    publicKey = hexToBytes(publicKeyOrDID);
  }
  
  const message = encodeMessage(data);
  const hash = sha256(message);
  
  try {
    return await ed.verifyAsync(hexToBytes(signature), hash, publicKey);
  } catch {
    return false;
  }
}

/**
 * Calculate CID (simplified - uses sha256)
 */
export async function calculateCID(data: unknown): Promise<string> {
  const message = encodeMessage(data);
  const hash = sha256(message);
  return `bafy${base32Encode(hash).toLowerCase()}`;
}

// ============================================
// ENCODING UTILITIES
// ============================================

/**
 * Encode message for signing/hashing
 */
function encodeMessage(data: unknown): Uint8Array {
  // Sort keys for deterministic encoding
  const replacer = typeof data === 'object' && data !== null ? Object.keys(data).sort() : undefined;
  const json = JSON.stringify(data, replacer);
  return new TextEncoder().encode(json);
}

/**
 * Base58 BTC encoding (simplified)
 */
function base58Encode(data: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  
  // Convert to big integer
  let num = BigInt('0x' + bytesToHex(data));
  
  while (num > 0n) {
    const remainder = num % 58n;
    num = num / 58n;
    result = alphabet.charAt(Number(remainder)) + result;
  }
  
  // Add leading 1s for leading zeros
  for (const byte of data) {
    if (byte === 0) {
      result = '1' + result;
    } else {
      break;
    }
  }
  
  return result;
}

/**
 * Base58 BTC decoding (simplified)
 */
function base58Decode(str: string): Uint8Array | null {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const lookup: Record<string, number> = {};
  
  for (let i = 0; i < alphabet.length; i++) {
    const char = alphabet.charAt(i);
    lookup[char] = i;
  }
  
  let num = 0n;
  for (const char of str) {
    const value = lookup[char];
    if (value === undefined) return null;
    num = num * 58n + BigInt(value);
  }
  
  // Convert back to bytes
  const hex = num.toString(16);
  const padded = hex.length % 2 === 0 ? hex : '0' + hex;
  
  // Count leading 1s (leading zeros)
  let leadingZeros = 0;
  for (const char of str) {
    if (char === '1') {
      leadingZeros++;
    } else {
      break;
    }
  }
  
  const bytes = hexToBytes(padded);
  return new Uint8Array([...new Uint8Array(leadingZeros), ...bytes]);
}

/**
 * Base32 encoding (RFC 4648)
 */
function base32Encode(data: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  
  return result;
}

// ============================================
// MISC UTILITIES
// ============================================

/**
 * Generate a random UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Check if running in Node.js
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' && process.versions?.node !== undefined;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

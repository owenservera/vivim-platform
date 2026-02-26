import { CID } from 'multiformats/cid';
import * as sha256 from 'multiformats/hashes/sha2';
import * as json from 'multiformats/codecs/json';
import { base58btc } from 'multiformats/bases/base58';
import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';

// Configure ed25519 to use sha512 from @noble/hashes
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));
ed25519.etc.sha512Async = (...m) => Promise.resolve(sha512(ed25519.etc.concatBytes(...m)));

/**
 * Calculate the CID (Content Identifier) for a given object.
 * Uses JSON codec and SHA-256 hash.
 */
export async function calculateCID(data: any): Promise<string> {
  const bytes = json.encode(data);
  const hash = await sha256.sha256.digest(bytes);
  const cid = CID.create(1, json.code, hash);
  return cid.toString();
}

/**
 * Generate a did:key from an Ed25519 public key.
 */
export function publicKeyToDID(publicKey: Uint8Array): string {
  // did:key:z + base58btc(0xed + public_key)
  const prefix = new Uint8Array([0xed, 0x01]); // 0xed is Ed25519 multicodec
  const bytes = new Uint8Array(prefix.length + publicKey.length);
  bytes.set(prefix);
  bytes.set(publicKey, prefix.length);
  
  const encoded = base58btc.encode(bytes);
  return `did:key:${encoded}`;
}

/**
 * Canonical JSON serialization (sorted keys).
 */
export function canonicalStringify(data: any): string {
  if (data === null || typeof data !== 'object') {
    return JSON.stringify(data);
  }
  
  if (Array.isArray(data)) {
    return '[' + data.map(item => canonicalStringify(item)).join(',') + ']';
  }
  
  const keys = Object.keys(data).sort();
  return '{' + keys
    .filter(key => data[key] !== undefined)
    .map(key => `"${key}":${canonicalStringify(data[key])}`)
    .join(',') + '}';
}

/**
 * Resolve a DID to its public key.
 * Currently supports did:key with Ed25519.
 */
export function resolveDID(did: string): Uint8Array {
  if (!did.startsWith('did:key:')) {
    throw new Error('Unsupported DID method');
  }
  
  const encoded = did.split(':')[2];
  const bytes = base58btc.decode(encoded);
  
  // Check prefix (0xed, 0x01) for Ed25519
  if (bytes[0] !== 0xed || bytes[1] !== 0x01) {
    throw new Error('Unsupported key type in DID');
  }
  
  return bytes.slice(2);
}

/**
 * Verify a signature for a given piece of data.
 */
export async function verifySignature(
  data: any,
  signature: string,
  did: string
): Promise<boolean> {
  try {
    const publicKey = resolveDID(did);
    
    // Use canonical serialization
    const dataStr = typeof data === 'string' ? data : canonicalStringify(data);
    const dataBytes = uint8ArrayFromString(dataStr);
    const sigBytes = uint8ArrayFromString(signature, 'base64');
    
    return await ed25519.verify(sigBytes, dataBytes, publicKey);
  } catch (error) {
    return false;
  }
}
    /**
     * Sign data using a private key.
     */
    export async function signData(
      data: any,
      privateKey: Uint8Array
    ): Promise<string> {
      // Use canonical serialization
      const dataStr = typeof data === 'string' ? data : canonicalStringify(data);
      const dataBytes = uint8ArrayFromString(dataStr);
      const signature = await ed25519.sign(dataBytes, privateKey);
      return uint8ArrayToString(signature, 'base64');
    }
    

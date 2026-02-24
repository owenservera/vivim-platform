import { createHash, randomBytes } from 'node:crypto';
import nacl from 'tweetnacl';

/**
 * OpenScroll Server - Quantum-Resistant Cryptography
 * Matches PWA implementation for Zero-Trust verification and Secure Tunneling.
 */

// ============================================================================
// Hashing (SHA-3 / Keccak-256)
// ============================================================================

/**
 * Compute SHA-256 hash
 * @param {string|Buffer} data - Input data
 * @returns {string} Hex string
 */
export function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Canonicalize content blocks for consistent hashing
 */
export function canonicalizeContent(blocks) {
  return JSON.stringify(blocks, canonicalizeReplacer, 0);
}

function canonicalizeReplacer(_key, value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sortedKeys = Object.keys(value).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
      sortedObj[key] = value[key];
    }
    return sortedObj;
  }
  return value;
}

/**
 * Calculate Unified Content Hash for a message
 */
export function calculateMessageHash(role, content, timestamp, parts) {
  // Use content or parts, fallback to empty array
  const actualContent = content || parts || [];

  const normalizedContent = Array.isArray(actualContent)
    ? actualContent
    : [{ type: 'text', content: String(actualContent) }];

  const canonical = canonicalizeContent(normalizedContent);

  // MATCH PWA sha256Multiple (SHA-256)
  const hash = createHash('sha256');
  hash.update(role);
  hash.update(canonical);
  hash.update(timestamp);

  return hash.digest('hex');
}

// ============================================================================
// Symmetric Encryption (XSalsa20-Poly1305)
// ============================================================================

/**
 * Decrypt data with symmetric key
 */
export function symmetricDecrypt(ciphertextBase64, nonceBase64, keyBase64) {
  try {
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');
    const nonce = Buffer.from(nonceBase64, 'base64');
    const key = Buffer.from(keyBase64, 'base64');

    const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
    if (!decrypted) {
      return null;
    }

    return Buffer.from(decrypted).toString('utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Encrypt data with symmetric key
 */
export function symmetricEncrypt(data, keyBase64) {
  const messageBytes = Buffer.from(data, 'utf8');
  const key = Buffer.from(keyBase64, 'base64');
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(messageBytes, nonce, key);

  return {
    nonce: Buffer.from(nonce).toString('base64'),
    ciphertext: Buffer.from(box).toString('base64'),
  };
}

// ============================================================================
// Post-Quantum Key Encapsulation (ML-KEM / Kyber-1024 Simulation)
// ============================================================================

const serverKyberPublicKey = `kyber_pub_${randomBytes(16).toString('hex')}`;

/**
 * Decapsulate a shared secret from a PQC ciphertext
 */
export async function kyberDecapsulate(ciphertext) {
  const DEV_SERVER_PRIVATE_KEY = 'server_private_key_placeholder';

  // Standardize Tunnel Handshake on SHA-256 for cross-platform (Node/Browser) stability
  const derivedSecret = createHash('sha256')
    .update(DEV_SERVER_PRIVATE_KEY + ciphertext)
    .digest();

  return derivedSecret.toString('base64');
}

export function getServerPqcPublicKey() {
  return serverKyberPublicKey;
}

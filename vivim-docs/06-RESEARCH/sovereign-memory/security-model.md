# Security Model

## Overview

Sovereign Memory implements a Zero-Trust Security Architecture where cryptographic signatures are the source of truth, and storage location is irrelevant.

**Core Principles:**

| Principle | Description |
|-----------|-------------|
| **Zero-Trust** | Never trust, always verify - cryptographic proof required |
| **User Sovereignty** | Users control their keys, users control their data |
| **End-to-End Encryption** | Data encrypted at rest, in transit, and in use |
| **Minimal Trust Surface** | Servers never see plaintext data |
| **Verifiable Everything** | All operations produce cryptographic proofs |

---

## 1. Cryptographic Foundations

### Algorithm Suite

Sovereign Memory uses a modern, post-quantum-ready cryptographic suite:

```typescript
interface CryptoSuite {
  // Digital Signatures (Authorship verification)
  signatures: {
    algorithm: 'Ed25519' | 'Dilithium2';  // Ed25519 now, Dilithium2 for PQ
    keySize: 256;                          // bits
    signatureSize: 512;                    // bits (Ed25519)
  };
  
  // Key Exchange (Secure communication)
  keyExchange: {
    algorithm: 'X25519' | 'Kyber1024';    // X25519 now, Kyber for PQ
    keySize: 256;                          // bits
  };
  
  // Symmetric Encryption (Content encryption)
  encryption: {
    algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
    keySize: 256;                          // bits
    ivSize: 96;                            // bits
    tagSize: 128;                          // bits
  };
  
  // Hashing (Content addressing, integrity)
  hashing: {
    algorithm: 'SHA3-256' | 'BLAKE3';
    outputSize: 256;                       // bits
  };
  
  // Key Derivation (Password-based)
  keyDerivation: {
    algorithm: 'PBKDF2-HMAC-SHA256' | 'Argon2id';
    iterations: 100000;                    // PBKDF2 iterations
    saltSize: 128;                         // bits
  };
}
```

### Key Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      Key Hierarchy                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Master Key (derived from password + salt)                      │
│  (PBKDF2, 100,000 iterations)                                   │
│                                                                  │
│       │                                                          │
│       ├──────────────────────────────────────────┐              │
│       │                                           │              │
│       ▼                                           ▼              │
│  Device Keys (X25519)                      Recovery Key          │
│  (One per device)                         (BIP-39 phrase)        │
│                                                                  │
│       │                                                          │
│       ├──────────────────────────────────────────┐              │
│       │                                           │              │
│       ▼                                           ▼              │
│  Session Keys                              Sharing Keys          │
│  (Per-session AES)                         (X25519 for sharing)  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Derivation:**

```typescript
interface KeyDerivationResult {
  masterKey: CryptoKey;
  salt: Uint8Array;
  keyId: string;
}

async function deriveMasterKey(
  password: string,
  salt?: Uint8Array
): Promise<KeyDerivationResult> {
  // Generate salt if not provided
  const keySalt = salt || crypto.getRandomValues(new Uint8Array(16));
  
  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive master key
  const masterKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: keySalt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,  // Not extractable
    ['encrypt', 'decrypt']
  );
  
  // Generate key ID
  const keyId = await sha256(keySalt);
  
  return {
    masterKey,
    salt: keySalt,
    keyId: base32Encode(keyId),
  };
}

async function deriveDeviceKey(
  masterKey: CryptoKey,
  deviceId: string
): Promise<CryptoKeyPair> {
  // Derive device-specific key
  const deviceKeyMaterial = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      salt: new TextEncoder().encode(deviceId),
      info: new TextEncoder().encode('device-key'),
      hash: 'SHA-256',
    },
    masterKey,
    { name: 'X25519' },
    true,  // Extractable (to wrap)
    ['deriveKey']
  );
  
  // Generate device key pair
  return await crypto.subtle.generateKey(
    { name: 'X25519' },
    true,
    ['deriveKey']
  );
}
```

---

## 2. Zero-Trust Verification

### Verification Principle

**You don't need to trust:**
- The server
- The storage provider
- The messenger
- The blockchain
- The IPFS gateway
- **Anyone**

**You only need to verify:**
1. The signature matches the DID
2. The DID belongs to the claimed author
3. The content hash matches the signature

### Verification Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Receive   │────►│   Extract   │────►│   Verify    │
│   Message   │     │   DID &     │     │  Signature  │
│             │     │   Signature │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │   Verification      │
                                    │   Result            │
                                    │                     │
                                    │  ✅ Valid           │
                                    │  ❌ Invalid         │
                                    └─────────────────────┘
```

**Verification Code:**

```typescript
interface VerificationResult {
  valid: boolean;
  author: string;
  contentHash: string;
  canTrust: boolean;
  error?: string;
}

async function zeroTrustVerify(message: MemoryNode): Promise<VerificationResult> {
  try {
    // Step 1: Extract public key from DID
    const publicKey = didToPublicKey(message.author);
    if (!publicKey) {
      return {
        valid: false,
        author: message.author,
        contentHash: '',
        canTrust: false,
        error: 'Failed to extract public key from DID',
      };
    }
    
    // Step 2: Recreate signed payload
    const payload = canonicalize({
      content: message.content,
      timestamp: message.timestamp,
      type: message.type,
      parents: message.parents,
    });
    
    // Step 3: Verify signature
    const valid = await verifySignature(
      payload,
      message.signature,
      publicKey
    );
    
    // Step 4: Calculate content hash
    const contentHash = await sha256(message.content);
    
    return {
      valid,
      author: message.author,
      contentHash,
      canTrust: valid,
    };
  } catch (error) {
    return {
      valid: false,
      author: message.author,
      contentHash: '',
      canTrust: false,
      error: (error as Error).message,
    };
  }
}
```

### Universal Verification

Verification works everywhere, regardless of source:

```typescript
// On my device (local storage)
const localResult = await zeroTrustVerify(localMessage);
console.assert(localResult.valid === true);

// On friend's device (received via P2P)
const sharedResult = await zeroTrustVerify(sharedMessage);
console.assert(sharedResult.valid === true);

// From IPFS gateway (public content)
const publicResult = await zeroTrustVerify(publicMessage);
console.assert(publicResult.valid === true);

// From on-chain anchor (blockchain record)
const anchoredResult = await zeroTrustVerify(anchoredMessage);
console.assert(anchoredResult.valid === true);

// From USB drive found in attic (cold backup)
const oldResult = await zeroTrustVerify(oldMessage);
console.assert(oldResult.valid === true);

// Same result. Every time. Anywhere.
```

---

## 3. Encryption Architecture

### Content Encryption Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User's   │────►│   Device   │────►│  Content   │
│   Master   │     │   Key      │     │   Key      │
│   Key      │     │  (X25519)  │     │ (AES-256)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │    Memory Content   │
                                    │    (Encrypted)      │
                                    └─────────────────────┘
```

**Encryption Process:**

```typescript
interface EncryptedContent {
  ciphertext: string;      // Base64-encoded ciphertext
  iv: string;              // Base64-encoded initialization vector
  authTag: string;         // Base64-encoded authentication tag
  keyId: string;           // Reference to key used
}

async function encryptContent(
  content: string,
  key: CryptoKey
): Promise<EncryptedContent> {
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt content
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    new TextEncoder().encode(content)
  );
  
  // Extract ciphertext and auth tag
  const ciphertext = encrypted.slice(0, encrypted.byteLength - 16);
  const authTag = encrypted.slice(encrypted.byteLength - 16);
  
  return {
    ciphertext: base64Encode(ciphertext),
    iv: base64Encode(iv),
    authTag: base64Encode(authTag),
    keyId: await getKeyId(key),
  };
}

async function decryptContent(
  encrypted: EncryptedContent,
  key: CryptoKey
): Promise<string> {
  // Decode components
  const ciphertext = base64Decode(encrypted.ciphertext);
  const iv = base64Decode(encrypted.iv);
  const authTag = base64Decode(encrypted.authTag);
  
  // Combine ciphertext and auth tag
  const encryptedData = new Uint8Array(
    ciphertext.byteLength + authTag.byteLength
  );
  encryptedData.set(ciphertext, 0);
  encryptedData.set(authTag, ciphertext.byteLength);
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );
  
  return new TextDecoder().decode(decrypted);
}
```

### Key Wrapping

Device keys are wrapped with the master key:

```typescript
async function wrapKey(
  keyToWrap: CryptoKey,
  wrappingKey: CryptoKey
): Promise<string> {
  const wrapped = await crypto.subtle.wrapKey(
    'raw',
    keyToWrap,
    wrappingKey,
    { name: 'AES-GCM', length: 256 }
  );
  
  return base64Encode(wrapped);
}

async function unwrapKey(
  wrappedKey: string,
  unwrappingKey: CryptoKey,
  algorithm: KeyAlgorithm
): Promise<CryptoKey> {
  const keyData = base64Decode(wrappedKey);
  
  return await crypto.subtle.unwrapKey(
    'raw',
    keyData,
    unwrappingKey,
    { name: 'AES-GCM', length: 256 },
    algorithm,
    true,  // Extractable
    ['deriveKey', 'encrypt', 'decrypt']
  );
}
```

---

## 4. Privacy Spectrum

### Privacy States

Sovereign Memory operates on a privacy spectrum:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Privacy Spectrum                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOCAL                    SHARED                   PUBLIC       │
│  (Private)              (Selective)              (Permanent)      │
│                                                                  │
│  ┌──────────┐          ┌──────────┐           ┌──────────┐     │
│  │  My      │────────►│ Circle   │──────────►│On-Chain │     │
│  │ Device   │ Encrypt  │ Members  │  Plain    │ Public   │     │
│  └──────────┘          └──────────┘           └──────────┘     │
│       │                     │                      │            │
│   Only I can read    Recipients only       Anyone can verify   │
│   Signed by me        Signed by me           Signed by me       │
│                                                                  │
│  ◄─────────────── REVERSIBLE ─────────────►  ◄─PERMANENT──►   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### LOCAL (Private)

Content exists only on user's device(s):

```typescript
interface LocalMemory {
  id: string;
  content: ContentBlock[];      // Encrypted with device key
  signature: string;            // Verifies authorship
  visibility: 'local';
  encryption: {
    algorithm: 'AES-256-GCM';
    keyId: string;
  };
}

// Operations allowed:
// ✅ View, edit, fork
// ✅ Share to specific recipients
// ✅ Publish publicly
// ❌ Others cannot verify (they don't have it)
// ❌ No on-chain record
```

### SHARED (Selective)

Content encrypted for specific recipients:

```typescript
interface SharedMemory {
  id: string;
  contentHash: string;          // Public (for verification)
  recipients: {
    [did: string]: string;      // Encrypted key per recipient
  };
  ciphertext: string;           // Encrypted content
  nonce: string;
  signature: string;            // Verifies authorship
  
  // Sharing options
  options?: {
    allowReshare?: boolean;
    reshareRecipients?: string[];
    expireAt?: string;
    allowDerivatives?: boolean;
    requireAttribution?: boolean;
  };
}

// Operations allowed:
// ✅ Recipients can decrypt and verify
// ✅ Recipients can verify signature
// ❌ Recipients CANNOT reshare (unless explicitly enabled)
```

### PUBLIC (Permanent)

Content published openly, verifiable by anyone:

```typescript
interface PublicMemory {
  id: string;
  merkleRoot: string;           // On-chain
  timestamp: number;            // Block time
  
  // Full content on IPFS
  ipfsCID: string;
  ipfsBytes: number;
  
  // On-chain anchor
  chainId: string;
  blockNumber: number;
  transactionHash: string;
  
  // Authorship
  authorDID: string;
  signature: string;
}

// Operations allowed:
// ✅ Anyone can fetch and verify
// ✅ Anyone can prove they have the genuine version
// ✅ Creates immutable record
// ❌ Content CANNOT be "unpublished"
// ❌ IPFS content may replicate indefinitely
// ❌ On-chain record is permanent
```

---

## 5. Identity & Access Control

### Decentralized Identifiers (DIDs)

**Format:** `did:key:z<base58-encoded-public-key>`

**Example:** `did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu`

**Properties:**
- **Self-sovereign**: User controls the private key
- **Globally unique**: No central authority needed
- **Portable**: Export to any deployment
- **Verifiable**: Cryptographic proof of identity

**DID Operations:**

```typescript
interface DIDDocument {
  '@context': ['https://www.w3.org/ns/did/v1'];
  id: string;
  verificationMethod: {
    id: string;
    type: 'Ed25519VerificationKey2018';
    controller: string;
    publicKeyMultibase: string;
  }[];
  authentication: string[];
  assertionMethod: string[];
}

function generateDID(): { did: string; document: DIDDocument } {
  const keyPair = crypto.generateKeyPairSync('ed25519');
  const publicKeyMultibase = 'z' + base58Encode(keyPair.publicKey);
  
  const did = `did:key:${publicKeyMultibase}`;
  
  const document: DIDDocument = {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: did,
    verificationMethod: [{
      id: `${did}#${publicKeyMultibase}`,
      type: 'Ed25519VerificationKey2018',
      controller: did,
      publicKeyMultibase,
    }],
    authentication: [`${did}#${publicKeyMultibase}`],
    assertionMethod: [`${did}#${publicKeyMultibase}`],
  };
  
  return { did, document };
}
```

### Circle-Based Access Control

```typescript
interface SharingCircle {
  id: string;
  name: string;
  description?: string;
  
  // Members
  members: {
    did: string;
    role: 'admin' | 'member';
    joinedAt: ISO8601;
  }[];
  
  // Shared memories
  sharedMemories: string[];
  
  // Permissions
  permissions: {
    view: 'all' | 'admins-only';
    edit: 'all' | 'admins-only';
    share: 'all' | 'admins-only';
  };
}

async function shareWithCircle(
  memoryId: string,
  circle: SharingCircle
): Promise<void> {
  // Generate content encryption key
  const contentKey = await generateKey('AES-GCM', 256);
  
  // Encrypt content for each member
  const encryptedKeys: { [did: string]: string } = {};
  
  for (const member of circle.members) {
    const memberPublicKey = await getPublicKeyFromDID(member.did);
    const sharedSecret = await deriveSharedSecret(
      myDeviceKey,
      memberPublicKey
    );
    
    const wrappedKey = await wrapKey(contentKey, sharedSecret);
    encryptedKeys[member.did] = wrappedKey;
  }
  
  // Update memory with sharing info
  await memoryService.updateSharing(memoryId, {
    visibility: 'shared',
    recipients: encryptedKeys,
    circleId: circle.id,
  });
}
```

---

## 6. Content Addressing

### Hash Format

```
sovereign:<hash-algorithm>:<base32-encoded-hash>
```

### Supported Algorithms

| Algorithm | Output Size | Quantum Resistance | Status |
|-----------|-------------|-------------------|--------|
| **SHA3-256** | 256 bits | Yes | ✅ Default |
| **BLAKE3** | 256 bits | Partial | ✅ Alternative |
| **SHA2-256** | 256 bits | No | 📋 Legacy |

### Examples

```
sovereign:sha3-256:1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
sovereign:blake3:xyz123abc456def789ghi012jkl345mno678pqrs90
sovereign:sha2-256:abc123def456ghi789jkl012mno345pqr678stu901
```

**Hash Calculation:**

```typescript
async function calculateContentAddress(
  content: Uint8Array,
  algorithm: HashAlgorithm = 'sha3-256'
): Promise<string> {
  const hash = await crypto.subtle.digest(algorithm, content);
  const base32 = base32Encode(hash);
  return `sovereign:${algorithm}:${base32}`;
}

// Verify content matches address
async function verifyContentAddress(
  address: string,
  content: Uint8Array
): Promise<boolean> {
  const [prefix, algorithm, expectedHash] = address.split(':');
  
  if (prefix !== 'sovereign') {
    throw new Error('Invalid content address prefix');
  }
  
  const actualHash = await calculateContentAddress(content, algorithm as HashAlgorithm);
  return actualHash === address;
}
```

---

## 7. Post-Quantum Readiness

### Migration Path

Sovereign Memory is designed for post-quantum cryptography migration:

```typescript
interface PostQuantumConfig {
  // Current classical algorithms
  classical: {
    signatures: 'Ed25519';
    keyExchange: 'X25519';
    encryption: 'AES-256-GCM';
  };
  
  // Post-quantum algorithms (NIST standard)
  postQuantum: {
    signatures: 'Dilithium2';
    keyExchange: 'Kyber1024';
    encryption: 'AES-256-GCM';  // Symmetric is PQ-safe
  };
  
  // Hybrid mode (classical + PQ)
  hybrid: {
    enabled: boolean;
    preference: 'classical-first' | 'pq-first';
  };
}
```

**Hybrid Signatures:**

```typescript
interface HybridSignature {
  // Classical signature
  classical: {
    algorithm: 'Ed25519';
    signature: string;
    publicKey: string;
  };
  
  // Post-quantum signature
  postQuantum: {
    algorithm: 'Dilithium2';
    signature: string;
    publicKey: string;
  };
}

async function signHybrid(
  message: Uint8Array,
  keys: {
    classicalKeyPair: CryptoKeyPair;
    pqKeyPair: CryptoKeyPair;
  }
): Promise<HybridSignature> {
  const classicalSig = await sign(message, keys.classicalKeyPair.privateKey);
  const pqSig = await signPQ(message, keys.pqKeyPair.privateKey);
  
  return {
    classical: {
      algorithm: 'Ed25519',
      signature: base64Encode(classicalSig),
      publicKey: await exportPublicKey(keys.classicalKeyPair.publicKey),
    },
    postQuantum: {
      algorithm: 'Dilithium2',
      signature: base64Encode(pqSig),
      publicKey: await exportPublicKeyPQ(keys.pqKeyPair.publicKey),
    },
  };
}
```

---

## 8. Audit & Compliance

### Access Logging

All access to sensitive data is logged with cryptographic proof:

```typescript
interface AccessLog {
  // What was accessed
  resourceId: string;
  resourceType: 'memory' | 'context' | 'key';
  
  // Who accessed it
  accessorDID: string;
  
  // When
  timestamp: ISO8601;
  
  // How
  action: 'read' | 'write' | 'share' | 'export';
  
  // Proof
  accessProof: string;  // Signed by accessor
}

async function logAccess(
  log: AccessLog
): Promise<void> {
  // Sign the access log
  const proof = await sign(
    canonicalize(log),
    myDevicePrivateKey
  );
  
  // Store log
  await accessLogService.create({
    ...log,
    accessProof: base64Encode(proof),
  });
}
```

### Compliance Features

| Feature | Personal | Enterprise |
|---------|----------|------------|
| E2E Encryption | ✅ | ✅ |
| Access Logs | Local only | ✅ Cloud |
| Data Export | ✅ | ✅ |
| Data Deletion | ✅ | ✅ |
| Audit Reports | - | ✅ |
| SSO Integration | - | ✅ |
| Retention Policies | - | ✅ |

---

## 9. Security Best Practices

### For Users

1. **Secure Your Master Key**: Use a strong, unique password
2. **Backup Recovery Phrase**: Store BIP-39 phrase securely offline
3. **Enable Device Encryption**: Use device-level encryption
4. **Review Sharing Settings**: Regularly audit shared memories
5. **Think Before Publishing**: Public = permanent

### For Developers

1. **Never Log Plaintext**: Only log encrypted content or hashes
2. **Validate Signatures**: Always verify before trusting data
3. **Key Rotation**: Implement key rotation for long-lived data
4. **Zero-Knowledge Design**: Server should never see plaintext
5. **Fail Securely**: Handle decryption failures gracefully
6. **Constant-Time Operations**: Prevent timing attacks
7. **Secure Random**: Use cryptographically secure RNG

### Key Security Code Review Checklist

```typescript
// ✅ GOOD: Constant-time comparison
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// ❌ BAD: Early exit (timing attack vulnerable)
function insecureEqual(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;  // Early exit!
  }
  return true;
}

// ✅ GOOD: Secure key generation
const secureKey = crypto.getRandomValues(new Uint8Array(32));

// ❌ BAD: Insecure random
const insecureKey = new Array(32).fill(0).map(() => Math.floor(Math.random() * 256));
```

---

## Implementation Reference

For implementation details, see the source code:

- **Crypto Engine**: `server/src/lib/crypto.ts`
- **Key Management**: `pwa/src/lib/crypto/key-management.ts`
- **DID Utilities**: `sdk/src/identity/did.ts`
- **Access Control**: `server/src/lib/access-control.ts`

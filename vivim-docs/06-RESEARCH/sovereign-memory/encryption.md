# Encryption

## Overview

Sovereign Memory uses end-to-end encryption (E2EE) to ensure that only you and your intended recipients can read your data. This document explains the encryption concepts and how they protect your information.

---

## Core Principles

### 1. Zero-Knowledge Architecture

**The servers never see your plaintext data.**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Zero-Knowledge Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Your Device                    Server                          │
│  ┌─────────────┐                                              │
│  │  Plaintext  │                                              │
│  │  "Meeting   │                                              │
│  │   notes..." │                                              │
│  └──────┬──────┘                                              │
│         │                                                       │
│         │ ENCRYPT (on device)                                  │
│         ▼                                                       │
│  ┌─────────────┐         ┌─────────────┐                      │
│  │ Ciphertext  │────────►│   Store     │                      │
│  │ 0xabc123... │         │  (encrypted)│                      │
│  └─────────────┘         └─────────────┘                      │
│                                                                  │
│  Server sees: 0xabc123... (meaningless bytes)                   │
│  You see: "Meeting notes..." (decrypted on your device)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Encryption at Every Layer

| Layer | What's Encrypted | Algorithm |
|-------|------------------|-----------|
| **Content** | Memory content, notes | AES-256-GCM |
| **Metadata** | Tags, categories (optional) | AES-256-GCM |
| **Transit** | Data in motion | TLS 1.3 |
| **Keys** | Device keys, sharing keys | AES-256-KW |
| **Backup** | Encrypted exports | AES-256-GCM + PBKDF2 |

### 3. Key Ownership

**You control the keys. Always.**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Key Ownership                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Master Key                                                      │
│  (Derived from YOUR password)                                   │
│       │                                                          │
│       ▼                                                          │
│  Device Keys                                                     │
│  (Generated on YOUR devices)                                    │
│       │                                                          │
│       ▼                                                          │
│  Content Keys                                                    │
│  (Used to encrypt YOUR data)                                    │
│                                                                  │
│  🔐 Only YOU have access to these keys                          │
│  🔐 Servers NEVER receive your master password                  │
│  🔐 Keys never leave your device unencrypted                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Encryption Algorithms

### Symmetric Encryption (Content)

**AES-256-GCM** (Advanced Encryption Standard)

- **Key Size**: 256 bits
- **Mode**: GCM (Galois/Counter Mode)
- **Provides**: Confidentiality + Integrity
- **Use Case**: Encrypting memory content

```typescript
// Example: Encrypting content
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  new TextEncoder().encode("Your secret message")
);
```

**ChaCha20-Poly1305** (Mobile-optimized)

- **Key Size**: 256 bits
- **Faster on mobile**: No hardware AES acceleration needed
- **Use Case**: Mobile devices, low-power environments

### Asymmetric Encryption (Key Exchange)

**X25519** (Elliptic Curve Diffie-Hellman)

- **Key Size**: 256 bits
- **Purpose**: Secure key exchange
- **Use Case**: Establishing shared secrets for sharing

```typescript
// Example: Key exchange for sharing
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: 'X25519' },
  true,
  ['deriveKey']
);

// Share publicKey with recipient
// Keep privateKey secret

// Derive shared secret
const sharedSecret = await crypto.subtle.deriveKey(
  { name: 'X25519', public: recipientPublicKey },
  privateKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

### Digital Signatures (Authorship)

**Ed25519** (Edwards-curve Digital Signature Algorithm)

- **Key Size**: 256 bits
- **Signature Size**: 512 bits
- **Purpose**: Prove authorship, verify integrity
- **Use Case**: Signing memories to prove you created them

```typescript
// Example: Signing a memory
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: 'Ed25519' },
  true,
  ['sign', 'verify']
);

const signature = await crypto.subtle.sign(
  'Ed25519',
  privateKey,
  new TextEncoder().encode("Memory content")
);

// Anyone can verify with your public key
const valid = await crypto.subtle.verify(
  'Ed25519',
  publicKey,
  signature,
  new TextEncoder().encode("Memory content")
);
```

### Hashing (Content Addressing)

**SHA-3 (Keccak-256)**

- **Output Size**: 256 bits
- **Quantum Resistant**: Yes
- **Use Case**: Content addressing, integrity verification

```typescript
// Example: Calculate content hash
const hash = await crypto.subtle.digest(
  'SHA-3',
  new TextEncoder().encode("Content")
);

// Result: 1a2b3c4d... (64 hex characters)
// This hash uniquely identifies the content
```

---

## Key Hierarchy

### Master Key

**Derived from your password using PBKDF2**

```
Password + Salt → PBKDF2 (100,000 iterations) → Master Key
```

**Properties:**
- Never leaves your device
- Used to derive all other keys
- Cannot be recovered if forgotten (without recovery phrase)

### Device Keys

**One per device, derived from master key**

```
Master Key + Device ID → HKDF → Device Key
```

**Properties:**
- Unique to each device
- Used for daily encryption operations
- Can be revoked independently

### Session Keys

**Per-session keys for temporary operations**

```
Device Key → Key Derivation → Session Key (expires after use)
```

**Properties:**
- Short-lived
- Forward secrecy (compromised session key doesn't expose past data)
- Used for individual operations

---

## Encryption in Practice

### Creating a Memory

```typescript
// 1. User creates memory
const memory = {
  content: "Sensitive meeting notes",
  type: "episodic",
  category: "work"
};

// 2. Encrypt content
const contentKey = await generateContentKey();
const encrypted = await encrypt(memory.content, contentKey);

// 3. Wrap content key with device key
const wrappedKey = await wrapKey(contentKey, deviceKey);

// 4. Sign the memory
const signature = await sign(memory, signingKey);

// 5. Store encrypted memory
await storage.save({
  id: generateId(memory),
  ciphertext: encrypted.ciphertext,
  iv: encrypted.iv,
  wrappedKey: wrappedKey,
  signature: signature,
  // Content is now encrypted!
});
```

### Reading a Memory

```typescript
// 1. Fetch encrypted memory
const encrypted = await storage.get(memoryId);

// 2. Unwrap content key
const contentKey = await unwrapKey(encrypted.wrappedKey, deviceKey);

// 3. Decrypt content
const plaintext = await decrypt(
  encrypted.ciphertext,
  encrypted.iv,
  contentKey
);

// 4. Verify signature
const valid = await verify(plaintext, encrypted.signature, publicKey);

if (valid) {
  console.log("Verified memory:", plaintext);
} else {
  throw new Error("Memory verification failed!");
}
```

### Sharing with Someone

```typescript
// 1. Get recipient's public key
const recipientPublicKey = await getPublicKeyFromDID(recipientDID);

// 2. Derive shared secret
const sharedSecret = await deriveSharedSecret(
  myDevicePrivateKey,
  recipientPublicKey
);

// 3. Wrap content key with shared secret
const wrappedForRecipient = await wrapKey(contentKey, sharedSecret);

// 4. Store wrapped key for recipient
await storage.saveWrappedKey(memoryId, recipientDID, wrappedForRecipient);

// Recipient can now:
// 1. Derive same shared secret with their private key
// 2. Unwrap content key
// 3. Decrypt the memory
```

---

## Privacy States & Encryption

### Local (Private)

**Encrypted with your device key only**

```typescript
{
  visibility: 'local',
  encryptedWith: 'device-key',
  recipients: []  // No additional recipients
}
```

**Access:**
- ✅ You (on any of your devices)
- ❌ No one else

### Shared (Selective)

**Encrypted with content key, content key encrypted per recipient**

```typescript
{
  visibility: 'shared',
  encryptedWith: 'content-key',
  recipients: {
    'did:key:alice...': 'encrypted-key-for-alice',
    'did:key:bob...': 'encrypted-key-for-bob'
  }
}
```

**Access:**
- ✅ You
- ✅ Alice (can decrypt with her key)
- ✅ Bob (can decrypt with his key)
- ❌ Everyone else

### Public (Permanent)

**Content published in plaintext, signature proves authorship**

```typescript
{
  visibility: 'public',
  encryptedWith: null,  // Not encrypted
  content: "Public knowledge",
  signature: "0xabc..."  // Proves you authored it
}
```

**Access:**
- ✅ Anyone (can read and verify)
- ❌ Cannot be made private again

---

## Recovery & Backup

### Recovery Phrase

**12 or 24-word BIP-39 mnemonic**

```
abandon ability able about above absent
absorb abstract absurd abuse access accident
```

**Purpose:**
- Recover your master key if you forget your password
- Restore access on new devices
- **Must be stored securely offline**

### Encrypted Backup

```typescript
// Create encrypted backup
async function createBackup(password: string) {
  // 1. Export all data
  const data = await storage.exportAll();
  
  // 2. Derive backup key from password
  const backupKey = await deriveKey(password, salt);
  
  // 3. Encrypt backup
  const encrypted = await encrypt(data, backupKey);
  
  // 4. Save to backup location
  await fs.writeFile('backup.enc', encrypted);
}

// Restore from backup
async function restoreBackup(encrypted: Uint8Array, password: string) {
  // 1. Derive backup key from password
  const backupKey = await deriveKey(password, salt);
  
  // 2. Decrypt backup
  const data = await decrypt(encrypted, backupKey);
  
  // 3. Import data
  await storage.importAll(data);
}
```

---

## Security Guarantees

### What Encryption Protects Against

| Threat | Protection |
|--------|------------|
| **Server Breach** | ✅ Servers only store ciphertext |
| **Network Eavesdropping** | ✅ TLS + content encryption |
| **Unauthorized Access** | ✅ Key-based access control |
| **Data Tampering** | ✅ Signatures verify integrity |
| **Impersonation** | ✅ Signatures prove authorship |

### What Encryption Does NOT Protect Against

| Threat | Mitigation |
|--------|------------|
| **Weak Password** | Use strong, unique password |
| **Lost Recovery Phrase** | Store recovery phrase securely |
| **Compromised Device** | Use device encryption, secure boot |
| **Social Engineering** | User education, verification |
| **Public Sharing** | Think before publishing |

---

## Best Practices

### For Users

1. **Use a Strong Password**: 12+ characters, mix of types
2. **Backup Recovery Phrase**: Write it down, store offline
3. **Enable Device Encryption**: Use BitLocker, FileVault, etc.
4. **Review Sharing Settings**: Regularly audit who has access
5. **Update Devices**: Keep software up to date

### For Developers

1. **Never Log Plaintext**: Only log hashes or encrypted data
2. **Use Web Crypto API**: Don't implement crypto yourself
3. **Constant-Time Operations**: Prevent timing attacks
4. **Secure Key Storage**: Use secure enclaves when available
5. **Key Rotation**: Implement for long-lived data

---

## Implementation Reference

For implementation details, see the source code:

- **Crypto Engine**: `server/src/lib/crypto.ts`
- **Key Management**: `pwa/src/lib/crypto/key-management.ts`
- **Encryption Utilities**: `sdk/src/crypto/encryption.ts`

# Privacy Model

## Core Philosophy

**"Cryptographic signatures are the source of truth. Storage location is irrelevant."**

Sovereign Memory operates on a Zero-Trust Architecture where:
- Every message is signed by its author (Ed25519)
- Signatures are embedded in the content, not added by storage
- Verification works on any device, any network, any storage provider

---

## The Privacy Spectrum

```
┌─────────────────────────────────────────────────────────────────┐
│                      Privacy Spectrum                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOCAL (Private)          SHARED (Selective)       PUBLIC        │
│                                                                  │
│  ┌─────────────┐          ┌──────────────┐        ┌───────────┐│
│  │ My Device  │─────────►│ Recipients   │───────►│ Blockchain││
│  │            │  Encrypt  │ (specific)   │  Plain  │           ││
│  └─────────────┘          └──────────────┘        └───────────┘│
│        │                        │                      │          │
│   Only me can read      Only recipients       Anyone can verify   │
│   Signed by me           Signed by me          Signed by me       │
│                                                                  │
│  ◄─────────── REVERSIBLE ─────────────►  ◄──────PERMANENT──►  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Privacy States

### 1. LOCAL (Private)

**Definition**: Content exists only on user's device(s).

**Properties**:
- Encrypted at rest (device keychain)
- No network transmission
- Synced only across user's own devices (optional)
- **Reversible**: Can be promoted to Shared or Public

**What can be done**:
- View, edit, fork
- Share to specific recipients
- Publish publicly

**What CANNOT be done**:
- Others cannot verify (they don't have it)
- No on-chain record

**Data Structure**:

```typescript
interface LocalMemory {
  id: "0xabc...",
  content: [...],           // Encrypted with device key
  signature: "0xdef...",   // Verifies authorship
  visibility: "local"
  encryption: {
    algorithm: "AES-256-GCM",
    keyId: "device-key-1"
  }
}
```

---

### 2. SHARED (Selective)

**Definition**: Content encrypted for specific recipients.

**Properties**:
- Content encrypted with symmetric key
- Symmetric key encrypted per recipient (X25519)
- Content hash public (proves existence without revealing)
- **Reversible**: Recipients cannot share further (unless authorized)

**What can be done**:
- Recipients can decrypt and verify
- Recipients can verify signature
- Recipients CANNOT reshare (unless explicitly enabled)

**Re-sharing Control**:

```typescript
interface SharedOptions {
  allowReshare?: boolean;           // Enable resharing
  reshareRecipients?: string[];     // DID whitelist
  expireAt?: ISO8601;               // Auto-delete
  allowDerivatives?: boolean;        // Allow forks/derivatives
  requireAttribution?: boolean;      // Must credit author
}
```

**Data Structure**:

```typescript
interface SharedMemory {
  id: "0xabc...",
  contentHash: "0x123...",           // Public (for verification)
  recipients: {
    "did:key:abc...": "encrypted_key_1",  // Per-recipient key
    "did:key:def...": "encrypted_key_2"
  },
  ciphertext: "base64...",           // Encrypted content
  nonce: "base64...",
  signature: "0x456..."              // Verifies authorship
}
```

---

### 3. PUBLIC (Permanent)

**Definition**: Content published openly, verifiable by anyone.

**Properties**:
- Content on IPFS (public gateway)
- Merkle root on-chain (proof of existence)
- **PERMANENT**: Cannot be deleted or privatized

**What can be done**:
- Anyone can fetch and verify
- Anyone can prove they have the genuine version
- Creates immutable record

**What CANNOT be undone**:
- Content cannot be "unpublished"
- IPFS content may replicate indefinitely
- On-chain record is permanent

**Data Structure**:

```typescript
interface PublicMemory {
  id: "0xabc...",
  merkleRoot: "0xdef...",           // On-chain
  timestamp: 1706055600,            // Block time
  
  // Full content on IPFS
  ipfsCID: "QmABC123...",
  ipfsBytes: 125000,
  
  // On-chain anchor
  chainId: "optimism",
  blockNumber: 12345678,
  transactionHash: "0x789...",
  
  // Authorship
  authorDID: "did:key:xyz...",
  signature: "0x111..."              // Verifies authorship
}
```

---

## Zero-Trust Verification

### The Verification Principle

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

### Verification Code

```typescript
async function zeroTrustVerify(message: MemoryNode): Promise<VerificationResult> {
  // Step 1: Extract public key from DID
  const publicKey = didToPublicKey(message.author);

  // Step 2: Recreate signed payload
  const payload = canonicalize({
    content: message.content,
    timestamp: message.timestamp,
    type: message.type,
    parents: message.parents
  });

  // Step 3: Verify signature
  const valid = verify(payload, message.signature, publicKey);

  return {
    valid,
    author: message.author,
    contentHash: await sha256(message.content),
    canTrust: valid && publicKey !== null
  };
}
```

### Verification Works Everywhere

```typescript
// On my device
await zeroTrustVerify(localMessage);  // ✅ Valid

// On friend's device (received via P2P)
await zeroTrustVerify(sharedMessage); // ✅ Valid

// From IPFS gateway
await zeroTrustVerify(publicMessage); // ✅ Valid

// From on-chain anchor
await zeroTrustVerify(anchoredMessage); // ✅ Valid

// From USB drive found in attic
await zeroTrustVerify(oldMessage); // ✅ Valid
```

**Same result. Every time. Anywhere.**

---

## Encryption Architecture

### Key Hierarchy

```
Master Key (User Password + PBKDF2, 100,000 iterations)
    │
    ├─► Device Key 1 (Derived, encrypted with Master)
    │    └─► Session Key 1a (Per-session)
    │    └─► Session Key 1b (Per-session)
    │
    ├─► Device Key 2 (Derived, encrypted with Master)
    │    └─► Session Key 2a (Per-session)
    │
    ├─► Device Key N (Derived, encrypted with Master)
    │
    └─► Recovery Key (Derived, encrypted with Master)
             │
             ├─► Recovery Phrase (BIP-39, 12/24 words)
             └─► Social Recovery (Shamir's Secret Sharing, M-of-N)
```

### Encryption Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User's   │────►│   Device   │────►│  Content   │
│   Master   │     │   Key      │     │   Key      │
│   Key      │     │  (X25519)  │     │ (AES-256)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │    Memory Content   │
                                    │    (Encrypted)      │
                                    └─────────────────────┘
```

### Cryptographic Algorithms

| Algorithm | Purpose | Key Size | Status |
|-----------|---------|----------|--------|
| **Ed25519** | Digital signatures | 256 bits | ✅ Production |
| **X25519** | Key exchange | 256 bits | ✅ Production |
| **AES-256-GCM** | Content encryption | 256 bits | ✅ Production |
| **SHA-3 (Keccak-256)** | Content hashing | 256 bits | ✅ Production |
| **PBKDF2** | Key derivation | Variable | ✅ Production |
| **Kyber-1024** | Post-quantum KEM | 1024 bits | 📋 Planned |
| **Dilithium2** | Post-quantum signatures | 256 bits | 📋 Planned |

---

## Sharing Granularity

### Share Options

Users choose EXACTLY what to share:

```
┌─────────────────────────────────────────────────────────────┐
│  MEMORY: "Project Meeting Notes - March 2024"               │
│                                                             │
│  ☑ Core content (main points)                            │
│  ☐ Full conversation (all messages)                       │
│  ☑ Attachments (files, links)                             │
│  ☐ Metadata (timestamps, device info)                      │
│                                                             │
│  Visibility: ○ Local  ● Shared  ○ Public                   │
│                                                             │
│  Share with: [________________] (DIDs or circles)         │
│                                                             │
│  Options:                                                  │
│  ☑ Allow recipients to verify signature                    │
│  ☐ Allow recipients to share with others                   │
│  ☐ Allow derivatives/forks                                │
│  ☐ Set expiration date                                    │
│                                                             │
│  [Cancel]              [Preview]  [Share]                  │
└─────────────────────────────────────────────────────────────┘
```

### Publish Scope

| Scope | Description | On-Chain Data |
|-------|-------------|---------------|
| **Minimal** | Proof of existence only | `merkleRoot`, `timestamp` |
| **Metadata** | + title, author, tags | `merkleRoot`, `metadataHash` |
| **Content** | + full content on IPFS | `merkleRoot`, `ipfsCID` |
| **Everything** | + all forks, edits, history | `merkleRoot`, `ipfsCID`, `forks[]` |

---

## Privacy by Default, Promoted by Choice

### Default State: Local

```
new Memory("My thoughts on AI")
  ├── Stored: Local device only
  ├── Encrypted: Yes (device key)
  ├── Sharing: None
  └── Reversible: Yes (can promote later)
```

### Explicit Promotion

```typescript
// Share with specific people
shareWith("memory-id", ["did:key:alice...", "did:key:bob..."], {
  allowReshare: false,
  expireAt: "2024-12-31"
});

// Publish publicly
publishPublicly("memory-id", {
  includeHistory: true,
  includeForks: true,
  destination: "optimism"  // or "ethereum", "base", etc.
});
```

---

## Identity & Access Control

### Decentralized Identifiers (DIDs)

**Format**: `did:key:z<base58-encoded-public-key>`

**Example**: `did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu`

**Properties**:
- **Self-sovereign**: User controls the private key
- **Globally unique**: No central authority needed
- **Portable**: Export to any deployment
- **Verifiable**: Cryptographic proof of identity

### Circle-Based Sharing

```
┌─────────────────────────────────────────────┐
│              Circle: "Engineering Team"       │
│                                             │
│  Members:                                    │
│  ├── alice@did.key... (Admin)               │
│  ├── bob@did.key...                         │
│  └── charlie@did.key...                     │
│                                             │
│  Shared Memories:                            │
│  ├── API Design Guidelines                   │
│  ├── Code Review Standards                   │
│  └── Deployment Runbooks                     │
│                                             │
│  Permissions:                                │
│  ├── View: All members                       │
│  ├── Edit: alice, bob                        │
│  └── Share: alice only                      │
└─────────────────────────────────────────────┘
```

---

## Content Addressing

### Format

`sovereign:<hash-algo>:<base32-hash>`

### Supported Algorithms

- `sha3-256` - Default (quantum-resistant)
- `blake3-256` - Alternative (faster)
- `sha2-256` - Legacy (compatibility)

### Examples

```
sovereign:sha3-256:1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
sovereign:blake3:xyz123abc456def789ghi012jkl345mno678pqrs90
```

---

## Audit & Compliance

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
```

### Compliance Features

| Feature | Personal | Enterprise |
|--------|----------|------------|
| E2E Encryption | ✅ | ✅ |
| Access Logs | Local only | ✅ Cloud |
| Data Export | ✅ | ✅ |
| Data Deletion | ✅ | ✅ |
| Audit Reports | - | ✅ |
| SSO Integration | - | ✅ |
| Retention Policies | - | ✅ |

---

## Best Practices

### For Users

1. **Start Local**: Keep memories private until you need to share
2. **Use Circles**: Group recipients for easier sharing
3. **Think Before Public**: Once public, always public
4. **Regular Backups**: Export your data periodically
5. **Secure Recovery**: Set up recovery options

### For Developers

1. **Never Log Plaintext**: Only log encrypted content or hashes
2. **Validate Signatures**: Always verify before trusting data
3. **Key Rotation**: Implement key rotation for long-lived data
4. **Zero-Knowledge**: Design for server to never see plaintext
5. **Fail Securely**: Handle decryption failures gracefully

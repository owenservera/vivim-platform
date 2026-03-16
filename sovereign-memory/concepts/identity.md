# Identity & DID Management

## Overview

Sovereign Memory uses Decentralized Identifiers (DIDs) to give you self-sovereign identity - you control your identity without relying on any central authority.

---

## What is a DID?

**Decentralized Identifier (DID)**: A globally unique identifier that you control.

```
Format: did:key:z<base58-encoded-public-key>

Example: did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu
         │      │
         │      └─ Public key (Ed25519)
         │
         └─ Method: key (cryptographic key-based)
```

### Properties

| Property | Description |
|----------|-------------|
| **Self-Sovereign** | You control the private key |
| **Globally Unique** | No central registry needed |
| **Portable** | Export to any system |
| **Verifiable** | Cryptographic proof of identity |
| **Persistent** | Doesn't expire |

### DID vs Traditional Identity

```
┌─────────────────────────────────────────────────────────────────┐
│              Traditional Identity vs DID                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRADITIONAL (Google, Facebook, etc.)                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Company Issues ID → You Login → Company Verifies     │    │
│  │         │                              │               │    │
│  │         └───────────┬──────────────────┘               │    │
│  │                     ▼                                   │    │
│  │            Company Can:                                 │    │
│  │            • Revoke your ID                            │    │
│  │            • Track your activity                       │    │
│  │            • Deny access                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  DID (Self-Sovereign)                                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  You Generate Key Pair → You Control ID               │    │
│  │         │                                               │    │
│  │         ▼                                               │    │
│  │  You Can:                                               │    │
│  │  • Use anywhere (no permission needed)                 │    │
│  │  • Prove identity cryptographically                    │    │
│  │  • Cannot be revoked by third party                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Generating Your Identity

### Create a DID

```typescript
import { generateKeyPair } from '@noble/curves/ed25519';
import { base58 } from '@scure/base';

function generateDID(): {
  did: string;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
} {
  // Generate Ed25519 key pair
  const privateKey = generateKeyPair().privateKey;
  const publicKey = generateKeyPair().publicKey;
  
  // Encode public key as base58
  const publicKeyBase58 = base58.encode(publicKey);
  
  // Create DID
  const did = `did:key:z${publicKeyBase58}`;
  
  return { did, publicKey, privateKey };
}

// Usage
const { did, publicKey, privateKey } = generateDID();
console.log(did);
// "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu"
```

### DID Document

A DID Document contains the public key and verification methods:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu",
  "verificationMethod": [
    {
      "id": "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu#z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu",
      "publicKeyMultibase": "z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu"
    }
  ],
  "authentication": [
    "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu#z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu"
  ],
  "assertionMethod": [
    "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu#z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu"
  ]
}
```

---

## Key Operations

### Signing with Your DID

Prove that you authored a memory:

```typescript
import { sign } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';

async function signMemory(
  memory: MemoryContent,
  privateKey: Uint8Array
): Promise<Signature> {
  // 1. Canonicalize the memory content
  const canonical = JSON.stringify(memory, Object.keys(memory).sort());
  
  // 2. Hash the content
  const hash = sha256(canonical);
  
  // 3. Sign the hash
  const signature = sign(hash, privateKey);
  
  return {
    algorithm: 'Ed25519',
    signature: Buffer.from(signature).toString('base64'),
    signedAt: new Date().toISOString()
  };
}
```

### Verifying a Signature

Verify that a memory was signed by a specific DID:

```typescript
import { verify } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';

async function verifyMemorySignature(
  memory: MemoryContent,
  signature: Signature,
  did: string
): Promise<boolean> {
  // 1. Extract public key from DID
  const publicKey = extractPublicKeyFromDID(did);
  
  // 2. Canonicalize the memory content
  const canonical = JSON.stringify(memory, Object.keys(memory).sort());
  
  // 3. Hash the content
  const hash = sha256(canonical);
  
  // 4. Verify the signature
  const isValid = verify(
    Buffer.from(signature.signature, 'base64'),
    hash,
    publicKey
  );
  
  return isValid;
}
```

---

## Identity in Sovereign Memory

### Memory Authorship

Every memory is signed by its author:

```typescript
interface Memory {
  id: string;
  content: string;
  
  // Authorship
  author: string;           // DID of the author
  signature: Signature;     // Cryptographic signature
  
  // Metadata
  type: MemoryType;
  category: string;
  createdAt: ISO8601;
}

interface Signature {
  algorithm: 'Ed25519';
  signature: string;        // Base64-encoded signature
  signedAt: ISO8601;
}
```

### Identity Memories

Special memories that define who you are:

```typescript
interface IdentityMemory {
  type: 'IDENTITY';
  category: 'role' | 'identity' | 'bio' | 'personality' | 'values' | 'belief';
  content: string;
  importance: number;       // Always high (0.8+)
  isPinned: boolean;        // Usually pinned
}

// Examples:
const identityMemories: IdentityMemory[] = [
  {
    type: 'IDENTITY',
    category: 'role',
    content: 'Software engineer with 10 years of experience',
    importance: 0.9,
    isPinned: true
  },
  {
    type: 'IDENTITY',
    category: 'values',
    content: 'Values transparency and open communication',
    importance: 0.85,
    isPinned: true
  },
  {
    type: 'IDENTITY',
    category: 'bio',
    content: 'Based in San Francisco, works in fintech',
    importance: 0.8,
    isPinned: false
  }
];
```

---

## Multi-Device Identity

### Device Registration

Each device has its own key pair, derived from your master key:

```typescript
interface DeviceIdentity {
  deviceId: string;
  deviceName: string;
  publicKey: string;        // X25519 public key
  registeredAt: ISO8601;
  lastSeenAt?: ISO8601;
}

async function registerDevice(
  masterKey: CryptoKey,
  deviceName: string
): Promise<DeviceIdentity> {
  // Generate device ID
  const deviceId = generateDeviceId();
  
  // Derive device key from master key
  const deviceKey = await deriveDeviceKey(masterKey, deviceId);
  
  // Create device identity
  const device: DeviceIdentity = {
    deviceId,
    deviceName,
    publicKey: await exportPublicKey(deviceKey.publicKey),
    registeredAt: new Date().toISOString()
  };
  
  return device;
}
```

### Device Management

```typescript
interface DeviceManager {
  // List all registered devices
  listDevices(): Promise<DeviceIdentity[]>;
  
  // Register a new device
  registerDevice(deviceName: string): Promise<DeviceIdentity>;
  
  // Revoke a device
  revokeDevice(deviceId: string): Promise<void>;
  
  // Update device last seen
  updateLastSeen(deviceId: string): Promise<void>;
}

// Usage
const devices = await deviceManager.listDevices();
console.log('My devices:', devices);

// Revoke a lost device
await deviceManager.revokeDevice('device-abc123');
```

---

## Identity Verification

### Verifying Someone's Identity

```typescript
async function verifyIdentity(claim: IdentityClaim): Promise<VerificationResult> {
  // 1. Extract DID from claim
  const { did, signature, payload } = claim;
  
  // 2. Get public key from DID
  const publicKey = extractPublicKeyFromDID(did);
  
  // 3. Verify signature
  const isValid = await verifySignature(payload, signature, publicKey);
  
  return {
    valid: isValid,
    did,
    verifiedAt: new Date().toISOString()
  };
}
```

### Challenge-Response Authentication

Prove you control a DID without revealing your private key:

```typescript
// Challenger generates a random challenge
const challenge = crypto.getRandomValues(new Uint8Array(32));

// Prover signs the challenge
const signature = await signChallenge(challenge, privateKey);

// Challenger verifies the signature
const valid = await verifySignature(challenge, signature, publicKey);

if (valid) {
  console.log('Identity verified! Prover controls the DID.');
}
```

---

## Sharing & Identity

### Share with Specific DIDs

```typescript
interface ShareOptions {
  recipients: string[];     // Array of DIDs
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canShare: boolean;
  };
  expireAt?: ISO8601;
}

async function shareMemory(
  memoryId: string,
  options: ShareOptions
): Promise<void> {
  for (const recipientDID of options.recipients) {
    // 1. Get recipient's public key
    const recipientPublicKey = await getPublicKeyFromDID(recipientDID);
    
    // 2. Derive shared secret
    const sharedSecret = await deriveSharedSecret(
      myDevicePrivateKey,
      recipientPublicKey
    );
    
    // 3. Wrap content key with shared secret
    const wrappedKey = await wrapKey(contentKey, sharedSecret);
    
    // 4. Store wrapped key for recipient
    await storage.saveWrappedKey(memoryId, recipientDID, {
      wrappedKey,
      permissions: options.permissions,
      expireAt: options.expireAt
    });
  }
}
```

### Circles (Group Identity)

```typescript
interface SharingCircle {
  id: string;
  name: string;
  creator: string;          // DID of creator
  members: CircleMember[];
  createdAt: ISO8601;
}

interface CircleMember {
  did: string;
  role: 'admin' | 'member';
  joinedAt: ISO8601;
}

// Create a circle
async function createCircle(
  name: string,
  initialMembers: string[]    // DIDs
): Promise<SharingCircle> {
  const circle: SharingCircle = {
    id: generateCircleId(),
    name,
    creator: myDID,
    members: [
      { did: myDID, role: 'admin', joinedAt: new Date().toISOString() },
      ...initialMembers.map(did => ({
        did,
        role: 'member' as const,
        joinedAt: new Date().toISOString()
      }))
    ],
    createdAt: new Date().toISOString()
  };
  
  // Sign and store the circle
  circle.signature = await signCircle(circle, myPrivateKey);
  await circlesStore.save(circle);
  
  return circle;
}
```

---

## Identity Recovery

### Recovery Phrase (BIP-39)

```typescript
// Generate recovery phrase
import { mnemonicToSeedSync, generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

function generateRecoveryPhrase(): string {
  return generateMnemonic(wordlist, 128);  // 12 words
}

// Derive master key from recovery phrase
function recoverMasterKey(recoveryPhrase: string): CryptoKey {
  const seed = mnemonicToSeedSync(recoveryPhrase);
  return importKey(seed);
}

// Usage
const recoveryPhrase = generateRecoveryPhrase();
console.log('Save this phrase securely:');
console.log(recoveryPhrase);
// "abandon ability able about above absent absorb abstract absurd abuse access accident"

// Later, to recover:
const masterKey = recoverMasterKey(recoveryPhrase);
```

### Social Recovery (Shamir's Secret Sharing)

Split your recovery key into multiple shares:

```typescript
interface SocialRecoveryConfig {
  totalShares: number;      // N total shares
  threshold: number;        // M shares needed (M-of-N)
  shares: Share[];
}

async function setupSocialRecovery(
  masterKey: CryptoKey,
  trustedContacts: string[],  // DIDs of trusted contacts
  threshold: number
): Promise<SocialRecoveryConfig> {
  // Export master key
  const keyData = await exportKey(masterKey);
  
  // Split into shares
  const shares = await shamirSplit(keyData, {
    total: trustedContacts.length + 1,  // +1 for self
    threshold: threshold
  });
  
  // Distribute shares to contacts
  for (let i = 0; i < trustedContacts.length; i++) {
    await shareWithContact(trustedContacts[i], shares[i]);
  }
  
  // Keep one share for yourself
  const selfShare = shares[shares.length - 1];
  
  return {
    totalShares: shares.length,
    threshold,
    shares
  };
}

// Recover master key from shares
async function recoverFromSocialRecovery(
  collectedShares: Share[],
  threshold: number
): Promise<CryptoKey> {
  if (collectedShares.length < threshold) {
    throw new Error('Not enough shares to recover');
  }
  
  // Reconstruct master key
  const keyData = await shamirCombine(collectedShares);
  return importKey(keyData);
}
```

---

## Best Practices

### For Users

1. **Backup Your Recovery Phrase**: Write it down, store offline
2. **Never Share Your Private Key**: Your DID = Your private key
3. **Verify Before Trusting**: Always verify signatures
4. **Use Strong Device Security**: Enable device encryption
5. **Review Device List**: Regularly check registered devices

### For Developers

1. **Use Standard DID Methods**: Stick to `did:key` for simplicity
2. **Canonicalize Before Signing**: Ensure consistent serialization
3. **Store DIDs Securely**: Use secure storage for private keys
4. **Implement Key Rotation**: Allow users to rotate keys
5. **Support Multiple Devices**: Design for multi-device scenarios

---

## Implementation Reference

For implementation details, see the source code:

- **DID Utilities**: `sdk/src/identity/did.ts`
- **Key Management**: `pwa/src/lib/crypto/key-management.ts`
- **Identity Service**: `server/src/services/identity-service.ts`

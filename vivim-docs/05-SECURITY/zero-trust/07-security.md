# VIVIM Security & Privacy Architecture

## Overview

VIVIM's privacy-first approach is a major differentiator. The platform is built on zero-knowledge architecture with end-to-end encryption, ensuring users maintain complete sovereignty over their data.

---

## Core Security Principles

| Principle | Description | Status |
|-----------|-------------|--------|
| **User Sovereignty** | Users own their data, keys, and identity | ✅ Active |
| **Zero-Knowledge** | VIVIM cannot read user data | ✅ Active |
| **End-to-End Encryption** | Data encrypted at rest and in transit | ✅ Active |
| **Self-Sovereign Identity** | DID-based authentication | ✅ Active |
| **No Vendor Lock-in** | Full data export anytime | ✅ Active |
| **Decentralization** | No central authority | 🚧 In Progress |

---

## Encryption Architecture

### Encryption Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIVIM Security Layers                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 1: Transport Encryption                            │   │
│  │ TLS 1.3 for all HTTP/WebSocket communication            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 2: Storage Encryption                              │   │
│  │ AES-256-GCM for data at rest                            │   │
│  │ Database-level transparent encryption                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 3: Zero-Knowledge Encryption                      │   │
│  │ User-controlled keys, VIVIM cannot decrypt              │   │
│  │ Client-side encryption before upload                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 4: ACU Signing                                    │   │
│  │ Ed25519 signatures for data integrity                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Zero-Knowledge Architecture

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                   Zero-Knowledge Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USER'S BROWSER                                                │
│  ┌─────────────────┐                                           │
│  │ Generate Key    │ ──┐                                        │
│  │ (Never sent)   │   │                                        │
│  └────────┬────────┘   │  Key NEVER leaves device              │
│           │            │                                        │
│           ▼            │                                        │
│  ┌─────────────────┐   │                                        │
│  │ Encrypt Data    │   │  VIVIM Server                         │
│  │ (Client-side)  │ ──┼── receives ENCRYPTED data            │
│  └────────┬────────┘   │   (cannot decrypt)                   │
│           │            │                                        │
│           │    Network │                                        │
│           ▼            ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Encrypted Storage                           │   │
│  │         (VIVIM cannot read)                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Points

1. **Key Generation**: Happens in user's browser/device
2. **Key Storage**: User's browser (or optional: hardware key)
3. **Key Sharing**: Encrypted key can be shared with trusted parties
4. **Server Blindness**: Server stores encrypted blobs, cannot decrypt

---

## Self-Sovereign Identity (SSI)

### DID-Based Authentication

```typescript
// Decentralized Identifier
interface DIDDocument {
  '@context': 'https://www.w3.org/ns/did/v1';
  id: 'did:vivim:user123';           // Unique identifier
  verificationMethod: [{
    id: 'did:vivim:user123#keys-1',
    type: 'Ed25519VerificationKey2020',
    controller: 'did:vivim:user123',
    publicKeyMultibase: 'zH3C2AVvLMv6gmMNam3uVA9Z5r6iHQt' // Public key
  }];
  authentication: ['did:vivim:user123#keys-1'];
  service: [{
    id: 'did:vivim:user123#service-1',
    type: 'EncryptedDataVault',
    serviceEndpoint: 'https://vault.vivim.app/user123'
  }];
}
```

### Authentication Flow

```
1. User creates account → Generates DID + keypair
2. Public DID → Stored on VIVIM (public)
3. Private key → Stored in user's browser (encrypted)
4. Login → Sign challenge with private key
5. Verify → VIVIM checks signature against public DID
```

---

## Data Sovereignty

### User Control Features

| Feature | Description |
|---------|-------------|
| **Full Export** | Download all data in standard format |
| **Key Rotation** | Rotate encryption keys anytime |
| **Data Deletion** | Permanent deletion with key destruction |
| **Portable Identity** | Move DID to another platform |
| **Sharing Control** | Granular permission system |

### Export Formats

```typescript
// Full data export includes:
// - Conversations (JSON)
// - ACUs (JSON)
// - Embeddings (Vector format)
// - Media files (Original format)
// - Identity documents (JSON)
// - Keys (Encrypted backup)
```

---

## Privacy Features

### Access Control

```typescript
// Granular sharing permissions
interface SharePermission {
  recipient: DID;
  resource: 'conversation' | 'acu' | 'topic' | 'circle';
  resourceId: string;
  level: 'view' | 'comment' | 'edit' | 'admin';
  expiresAt?: Date;
  canShare: boolean;
}
```

### Privacy Modes

| Mode | Description |
|------|-------------|
| **Private** | Only user can access |
| **Circle** | Shared with circle members |
| **Public** | Discoverable but not readable |
| **Link Share** | Anyone with link can view |

---

## Security Implementation

### Server Security

```typescript
// server/src/security/
interface SecurityConfig {
  // Encryption
  encryptionAlgorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  
  // Authentication
  authMethod: 'DID' | 'JWT';
  tokenExpiry: 3600;  // seconds
  
  // Network
  corsOrigins: string[];
  rateLimit: {
    windowMs: 60000;
    maxRequests: 100;
  };
}
```

### Client-Side Encryption

```typescript
// Encryption happens before data leaves device
async function encryptForStorage(data: any, userKey: CryptoKey): Promise<EncryptedData> {
  // 1. Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // 2. Encode data
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  
  // 3. Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    userKey,
    encoded
  );
  
  // 4. Return encrypted blob + IV
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}
```

---

## Compliance

### Data Handling

| Requirement | Implementation |
|--------------|-----------------|
| **GDPR** | Full export, deletion, portability |
| **CCPA** | Data disclosure, opt-out |
| **HIPAA** | Encryption, access logs (BETA) |
| **SOC 2** | Audit logging, security controls (ROADMAP) |

---

## Trust-Building Elements for Landing Page

### Visual Elements

1. **Encryption Badge**: "End-to-end encrypted"
2. **Zero-Knowledge Icon**: Visual explanation diagram
3. **Key Icon**: "Your keys, your data"
4. **Export Button**: Prominent "Download your data"
5. **Open Source**: GitHub links, security audit reports

### Messaging

- "Your data. Your keys. Your AI."
- "We can't read your conversations - even if we wanted to."
- "Full data export. Anytime."
- "Zero-knowledge architecture."

---

## Security vs Usability Tradeoffs

| Security Feature | Usability Impact |
|------------------|------------------|
| Client-side encryption | Slower initial load |
| Key management | User responsibility for keys |
| DID authentication | Learning curve vs password |
| No password reset | Account recovery complexity |

**Solution**: Offer optional recovery mechanisms (social recovery, encrypted backup)

---

## Threat Model

### Protected Against

- ✅ Server breach (data encrypted)
- ✅ Employee access (zero-knowledge)
- ✅ Government subpoena (can't decrypt)
- ✅ Provider data sale (never sent plaintext)
- ✅ Man-in-middle (TLS + E2E)

### User Responsibilities

- 🔐 Key backup (lost key = lost data)
- 🔐 Device security (key in browser)
- 🔐 Sharing discipline (don't share keys)

---

## Documentation References

- `VIVIM.docs/SECURITY/zero-trust-chat.md`
- `VIVIM.docs/SECURITY/zero-rtust-chat-thinking.md`
- `server/src/security/`

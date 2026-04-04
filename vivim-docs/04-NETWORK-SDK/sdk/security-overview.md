# Security Model Overview

## Executive Summary

Sovereign Memory/Context System is built on a security-by-design architecture with end-to-end encryption, cryptographic sovereignty, and verifiable data integrity at its core. Users maintain complete control over their data through decentralized identity, cryptographic proofs, and fine-grained access controls.

## Security Principles

### 1. Cryptographic Sovereignty
- **User-owned keys**: All cryptographic keys are generated and controlled by the user
- **Self-sovereign identity**: Decentralized Identifiers (DIDs) that you control
- **Verifiable ownership**: Every operation signed with Ed25519 cryptographic signatures
- **No vendor lock-in**: Export identity and data at any time with cryptographic proof

### 2. End-to-End Encryption
- **Zero-knowledge architecture**: Servers never see plaintext data
- **User-controlled keys**: Only you hold the keys to decrypt your data
- **Forward secrecy**: Compromised keys don't reveal past communications
- **Post-quantum ready**: Migration path to post-quantum cryptography

### 3. Data Integrity
- **Content addressing**: All data hashed with SHA-3 (Keccak-256)
- **Merkle proofs**: Cryptographic proof of data inclusion
- **Immutable audit trail**: Tamper-evident operation logging
- **Verifiable exports**: Exported data includes cryptographic proofs

### 4. Privacy by Design
- **Local-first**: Data stored locally by default
- **Selective disclosure**: Choose what to share and with whom
- **Privacy states**: LOCAL, SHARED, PUBLIC with clear transitions
- **Audit logging**: All access logged and verifiable

## Cryptographic Foundations

### Encryption Algorithms

| Algorithm | Purpose | Key Size | Status |
|-----------|---------|----------|--------|
| **Ed25519** | Digital signatures | 256 bits | ✅ Production |
| **X25519** | Key exchange (encryption) | 256 bits | ✅ Production |
| **AES-256-GCM** | Content encryption | 256 bits | ✅ Production |
| **SHA-3 (Keccak-256)** | Content hashing | 256 bits | ✅ Production |
| **PBKDF2** | Key derivation | Variable | ✅ Production |
| **Kyber-1024** | Post-quantum KEM | 1024 bits | 📋 Planned |
| **Dilithium2** | Post-quantum signatures | 256 bits | 📋 Planned |

### Key Hierarchy

```
Master Key (User Password, PBKDF2, 100k iterations)
    │
    ├─► Device Key 1 (Derived, encrypted with Master)
    ├─► Device Key 2 (Derived, encrypted with Master)
    ├─► Device Key N (Derived, encrypted with Master)
    │
    └─► Recovery Key (Derived, encrypted with Master)
           │
           ├─► Recovery Phrase (BIP-39)
           └─► Social Recovery (Shamir's Secret Sharing)
```

### Content Addressing

**Format**: `sovereign:<hash-algo>:<base32-hash>`

**Supported Algorithms**:
- `sha3-256` - Default (quantum-resistant)
- `blake3-256` - Alternative (faster)
- `sha2-256` - Legacy (compatibility)

**Examples**:
```
sovereign:sha3-256:1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
sovereign:blake3:xyz123abc456def789ghi012jkl345mno678pqrs90
```

## Identity Model

### Decentralized Identifiers (DIDs)

**Format**: `did:key:z<base58-encoded-public-key>`

**Example**: `did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu`

**Properties**:
- **Self-sovereign**: User controls the private key
- **Globally unique**: No central authority needed
- **Portable**: Export to any deployment
- **Verifiable**: Cryptographic proof of identity

### Identity Recovery

**Methods**:
1. **Recovery Phrase**: BIP-39 compatible 12/24 word phrase
2. **Social Recovery**: Shamir's Secret Sharing with trusted contacts
3. **Threshold Shards**: Require M of N shares to recover

**Recovery Process**:
```
User forgets password
    │
    ├─► Attempt recovery phrase
    │      └─► Derive Master Key from phrase
    │
    └─► Or attempt social recovery
           ├─► Collect M of N shares from trusted contacts
           ├─► Reconstruct secret
           └─► Derive Master Key from reconstructed secret
```

## Encryption Model

### Storage Encryption

**Process**:
1. User content → Content Block
2. Content Block → SHA-3 hash → CID
3. Content Block → AES-256-GCM encryption (with Device Key)
4. Encrypted Content → IndexedDB storage
5. CID + Signature → Merkle tree

**Properties**:
- **Content-addressed**: Same content always produces same CID
- **Deduplicated**: Duplicate content not stored twice
- **Encrypted at rest**: Data never stored in plaintext
- **Verifiable**: Merkle proof proves content integrity

### Transport Encryption

**Layers**:
1. **TLS 1.3**: All network traffic encrypted
2. **X25519 Ephemeral Keys**: Per-session key exchange
3. **Forward Secrecy**: Compromised keys don't reveal past sessions
4. **Post-Quantum KEM**: Planned (Kyber-1024)

**Handshake**:
```
Device A                              Device B
    │                                      │
    ├─► Generate ephemeral key pair            │
    │                                      ├─► Generate ephemeral key pair
    ├─► Send public key ───────────────────►│
    │                                      ├─► Send public key ──►
    │◄───────────────────── Send public key │
    │                                      │
    ├─► Compute shared secret (X25519)       │
    │                                      ├─► Compute shared secret (X25519)
    ├─► Derive session key                   │
    │                                      ├─► Derive session key
    │                                      │
    ├─► Encrypted communication ─────────────►│
    │◄──────────────────── Encrypted communication
```

### Sharing Encryption

**Process**:
1. User selects recipient by DID
2. System retrieves recipient's public key (X25519)
3. Content encrypted with ephemeral session key
4. Session key encrypted with recipient's public key
5. Encrypted content + encrypted session key sent to recipient

**Properties**:
- **End-to-end**: Only recipient can decrypt
- **Recipient-verifiable**: Recipient verifies sender's signature
- **Forward secrecy**: Compromise doesn't affect past shares
- **Non-repudiation**: Sender cannot deny sending

## Access Control

### Permission Model

**Resources**:
- Memory nodes
- Context bundles
- Export jobs
- Team data

**Permissions**:
- `read`: View resource
- `write`: Modify resource
- `share`: Share with others
- `admin`: Full control including deletion

**Access Policies**:

```typescript
interface AccessPolicy {
  id: string;
  resourceType: 'memory' | 'context' | 'export';
  resourceId: string;

  read: Permission[];
  write: Permission[];
  share: Permission[];

  conditions?: AccessCondition[];
}

type Permission =
  | { type: 'self' }
  | { type: 'any-with-key' }
  | { type: 'specific-dids'; dids: string[] }
  | { type: 'granted-by'; issuerDID: string };
```

### Privacy States

**LOCAL**:
- Only accessible by owner
- No sharing possible
- Default for all new memories

**SHARED**:
- Accessible by specified recipients
- Recipients must have key
- Shareable by recipients (if allowed)

**PUBLIC**:
- Accessible by anyone
- Read-only
- Cannot be downgraded to LOCAL

**State Transitions**:
```
LOCAL ──► SHARED ──► PUBLIC
  │            │           │
  └────────────┘           │
               └───────────┘ (Cannot downgrade)
```

### Audit Logging

**Entry Structure**:
```typescript
interface AuditEntry {
  id: string;
  timestamp: ISO8601;
  actor: DID;

  action: AuditAction;
  resource: string;

  signature: string;      // Actor's signature
  merkleProof?: MerkleProof;
}
```

**Actions Logged**:
- `memory.create`, `memory.update`, `memory.delete`
- `context.compile`, `context.invalidate`
- `export.request`, `export.complete`
- `share.grant`, `share.revoke`
- `access.denied`, `access.granted`

**Query**:
```
GET /api/v1/audit
  ?userId=:did
  &from=:timestamp
  &to=:timestamp
  &action=:actionType
  &resource=:resourceId
```

## Threat Model

### Threats Addressed

| Threat | Mitigation | Effectiveness |
|---------|-------------|---------------|
| **Data breach** | End-to-end encryption | High |
| **Key compromise** | Social recovery, key rotation | Medium |
| **Data tampering** | Merkle proofs, signatures | High |
| **Unauthorized access** | Access controls, audit logs | High |
| **Platform lock-in** | Exportable identity & data | High |
| **Quantum computing** | Post-quantum migration path | Future |
| **Insider threat** | Zero-knowledge, audit logs | High |

### Threats Not Addressed

| Threat | Reason | Mitigation |
|---------|---------|------------|
| **Physical device compromise** | Out of scope | User responsibility |
| **Social engineering** | Human factor | User education |
| **Nation-state attack** | Resource asymmetry | Defense in depth |

## Compliance

### GDPR (General Data Protection Regulation)

**Requirements**:
- ✅ Right to export (Portability service)
- ✅ Right to be forgotten (Data deletion)
- ✅ Data portability (Export formats)
- ✅ Consent management (Privacy states)
- ✅ Access control (User permissions)
- ✅ Data minimization (Local-first)

**Status**: Compliant

### CCPA (California Consumer Privacy Act)

**Requirements**:
- ✅ Right to know (Audit logs)
- ✅ Right to delete (Data deletion)
- ✅ Right to opt-out (Privacy controls)
- ✅ Data portability (Export service)

**Status**: Compliant

### SOC 2 (System and Organization Controls)

**Requirements**:
- ✅ Access controls (Role-based permissions)
- ✅ Encryption (AES-256-GCM)
- ✅ Audit logging (Immutable audit trail)
- ✅ Change management (Signed operations)
- ✅ Monitoring (Audit dashboard)

**Status**: Ready (Enterprise tier)

### HIPAA (Health Insurance Portability and Accountability Act)

**Requirements**:
- ✅ Data encryption (AES-256-GCM)
- ✅ Access controls (Fine-grained permissions)
- ✅ Audit logging (HIPAA-specific fields)
- ✅ Business associate agreements (Available)

**Status**: Ready (Enterprise tier)

## Security Audits

### Planned Audits

| Audit Type | Frequency | Status |
|------------|------------|--------|
| **Penetration Testing** | Quarterly | 📋 Planned |
| **Code Review** | Continuous | 🔄 In Progress |
| **Third-party Audit** | Annually | 📋 Planned |
| **Bug Bounty** | Ongoing | 📋 Planned |

### Vulnerability Reporting

**Process**:
1. Report vulnerability to security@sovereign-memory.io
2. Security team triages within 48 hours
3. Patch developed within 7 days (critical), 14 days (high)
4. Bounty paid if qualified
5. Public disclosure after patch release

**Bounty Tiers**:
- Critical: $10,000+
- High: $5,000-$10,000
- Medium: $1,000-$5,000
- Low: $500-$1,000

## Best Practices

### For Users

1. **Protect your recovery phrase**
   - Store offline, never share digitally
   - Use a metal backup if possible
   - Test recovery before relying on it

2. **Enable 2FA where available**
   - Use hardware security keys (U2F/FIDO2)
   - Backup 2FA recovery codes

3. **Review access logs regularly**
   - Monitor for unauthorized access
   - Revoke unused permissions
   - Report suspicious activity

4. **Keep software updated**
   - Enable automatic updates
   - Verify update signatures
   - Review changelog for security fixes

### For Developers

1. **Never hardcode keys**
   - Use environment variables
   - Rotate keys regularly
   - Use key management services

2. **Follow security guidelines**
   - Use provided cryptographic libraries
   - Never implement custom crypto
   - Validate all inputs

3. **Implement proper error handling**
   - Don't leak sensitive info in errors
   - Log security events
   - Implement rate limiting

### For Operators

1. **Secure your infrastructure**
   - Use firewalls and network segmentation
   - Implement intrusion detection
   - Regular security scans

2. **Monitor access logs**
   - Set up alerts for suspicious activity
   - Review logs regularly
   - Implement SIEM integration

3. **Have incident response plan**
   - Document response procedures
   - Train team regularly
   - Test the plan

## Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Device                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                │
│  │  Application │─────►│  Crypto API  │                │
│  └──────────────┘      └──────────────┘                │
│                                   │                      │
│                                   ├─► Ed25519 Signatures  │
│                                   ├─► AES-256-GCM        │
│                                   └─► SHA-3 Hashing    │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                │
│  │  IndexedDB   │◄─────│  Key Storage  │                │
│  │  (Encrypted) │      │  (Secure)    │                │
│  └──────────────┘      └──────────────┘                │
│                                   │                      │
│                                   ├─► Device Keys       │
│                                   ├─► Recovery Key      │
│                                   └─► Master Key       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Encrypted (TLS 1.3)
                         │ X25519 Ephemeral
                         │
┌─────────────────────────────────────────────────────────────┐
│                     Network                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────┐                │
│  │  DNS over    │      │  CDN /       │                │
│  │  HTTPS       │      │  Edge        │                │
│  └──────────────┘      └──────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Encrypted (TLS 1.3)
                         │
┌─────────────────────────────────────────────────────────────┐
│                     Server (Optional)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────┐                │
│  │  PostgreSQL  │      │  Redis       │                │
│  │  (Encrypted) │      │  (Encrypted) │                │
│  └──────────────┘      └──────────────┘                │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                │
│  │  Audit Logs  │      │  Monitoring  │                │
│  │  (Immutable) │      │  (Alerts)    │                │
│  └──────────────┘      └──────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Post-Quantum Preparation

### Timeline

| Phase | Status | Timeline |
|-------|--------|----------|
| **PQC Assessment** | ✅ Complete | 2025 |
| **Library Selection** | 🔄 In Progress | 2025-2026 |
| **PQC Integration** | 📋 Planned | 2026 |
| **Migration Path** | 📋 Planned | 2027 |
| **Full PQC Support** | 📋 Planned | 2028+ |

### Migration Strategy

1. **Dual-signature period**: Classical + Post-quantum
2. **Gradual migration**: New data with PQC only
3. **Legacy support**: Classical signatures still accepted
4. **Full transition**: Classical signatures deprecated

---

**Document Version**: 1.0.0
**Last Updated**: 2026-03-09
**Related Documents**:
- [Privacy Model](../../pwa/src/lib/storage-v2/PRIVACY_MODEL.md)
- [Cryptographic Primitives](../technical/crypto/overview.md)
- [Compliance Documentation](../compliance/overview.md)
- [Security Best Practices](../security/best-practices.md)

# OpenScroll Privacy & Sharing Model

**Version:** 1.0.0
**Date:** January 23, 2026
**Philosophy:** Zero-Trust Authorship, User-Controlled Privacy

---

## 1. Core Principles

### 1.1 The Zero-Trust Authorship Axiom

**"Cryptographic signatures are the source of truth. Storage location is irrelevant."**

- Every message is signed by its author (Ed25519)
- Signatures are embedded in the content, not added by storage
- Verification works on:
  - Local device
  - Friend's device
  - Public IPFS gateway
  - On-chain anchor
  - USB drive in a safe

**The signature IS the proof of authorship. Nothing else is required.**

### 1.2 The Privacy Spectrum

```
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL (Private)          SHARED (Selective)       PUBLIC        │
│  ┌─────────────┐          ┌──────────────┐        ┌───────────┐ │
│  │ My Device  │─────────>│ Recipients   │───────>│ Blockchain│ │
│  │            │  Encrypt  │ (specific)   │  Plain  │           │ │
│  └─────────────┘          └──────────────┘        └───────────┘ │
│        │                        │                      │         │
│   Only me can read      Only recipients       Anyone can verify │
│   Signed by me           Signed by me          Signed by me    │
│                                                                 │
│  ←─────────── REVERSIBLE ──────────────→  ←──────PERMANENT──→ │
└─────────────────────────────────────────────────────────────────┘
```

**Once PUBLIC, never PRIVATE again.**

---

## 2. Privacy States

### 2.1 Local (Private)

**Definition:** Content exists only on user's device(s).

```
MessageNode {
  id: "0xabc...",
  content: [...],
  signature: "0xdef...",  // Verifies authorship
  visibility: "local"
}
```

**Properties:**
- Encrypted at rest (device keychain)
- No network transmission
- Synced only across user's own devices (optional)
- **Reversible:** Can be promoted to Shared or Public

**What can be done:**
- View, edit, fork
- Share to specific recipients
- Publish publicly

**What CANNOT be done:**
- Others cannot verify (they don't have it)
- No on-chain record

---

### 2.2 Shared (Selective)

**Definition:** Content encrypted for specific recipients.

```
EncryptedEnvelope {
  contentHash: "0x123...",           // Public (for verification)
  recipients: {
    "did:key:abc...": "encrypted_key_1",
    "did:key:def...": "encrypted_key_2"
  },
  ciphertext: "base64...",
  nonce: "base64...",
  signature: "0x456..."              // Verifies authorship
}
```

**Properties:**
- Content encrypted with symmetric key
- Symmetric key encrypted per recipient (X25519)
- Content hash public (proves existence without revealing)
- **Reversible:** Recipients cannot share further (unless authorized)

**What can be done:**
- Recipients can decrypt and verify
- Recipients can verify signature
- Recipients CANNOT reshare (unless explicitly enabled)

**Re-sharing Control:**

```typescript
interface SharedOptions {
  allowReshare?: boolean;
  reshareRecipients?: string[];      // DID whitelist
  expireAt?: ISO8601;                 // Auto-delete
}
```

---

### 2.3 Public (Permanent)

**Definition:** Content published openly, verifiable by anyone.

```
PublicConversation {
  conversationId: "0xabc...",
  merkleRoot: "0xdef...",              // On-chain
  messageCount: 42,
  timestamp: 1706055600,

  // Full content on IPFS
  ipfsCID: "QmABC123...",
  ipfsBytes: 125000,

  // On-chain anchor
  chainId: "optimism",
  blockNumber: 12345678,
  transactionHash: "0x789...",

  // Authorship
  authorDID: "did:key:xyz...",
  signature: "0x111..."               // Verifies authorship
}
```

**Properties:**
- Content on IPFS (public gateway)
- Merkle root on-chain (proof of existence)
- **PERMANENT:** Cannot be deleted or privatized
- Anyone can verify:
  - Authorship (via signature)
  - Integrity (via Merkle proof)
  - Timestamp (via block time)

**What can be done:**
- Anyone can fetch and verify
- Anyone can prove they have the genuine version
- Creates immutable record

**What CANNOT be undone:**
- Content cannot be "unpublished"
- IPFS content may replicate indefinitely
- On-chain record is permanent

---

## 3. Sharing Granularity

Users choose EXACTLY what to share:

### 3.1 Share Options

```
┌─────────────────────────────────────────────────────────────┐
│  CONVERSATION: "React Hooks Explained"                      │
│                                                             │
│  ☑ Main branch (15 messages)                               │
│  ☑ Fork: "TypeScript version" (8 messages)                 │
│  ☑ Fork: "Advanced examples" (12 messages)                 │
│  ☐ Edit history (show all changes)                         │
│  ☐ Author metadata (model, tokens, etc.)                   │
│                                                             │
│  Visibility: ○ Local  ○ Shared  ● Public                    │
│                                                             │
│  ⚠️  Once published publicly, this cannot be undone.       │
│                                                             │
│  [Cancel]  [Preview]  [Publish]                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Publish Scope

| Scope | Description | On-Chain Data |
|-------|-------------|---------------|
| **Minimal** | Proof of existence only | `merkleRoot`, `messageCount` |
| **Metadata** | + title, author, tags | `merkleRoot`, `metadataHash` |
| **Content** | + full content on IPFS | `merkleRoot`, `ipfsCID` |
| **Everything** | + all forks, edits, history | `merkleRoot`, `ipfsCID`, `forks[]` |

---

## 4. Zero-Trust Verification

### 4.1 Verification Without Trust

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

```typescript
async function zeroTrustVerify(message: MessageNode): Promise<VerificationResult> {
  // Step 1: Extract public key from DID
  const publicKey = didToPublicKey(message.author);

  // Step 2: Recreate signed payload
  const payload = canonicalize({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
    parents: message.parents
  });

  // Step 3: Verify signature
  const valid = verify(payload, message.signature, publicKey);

  return {
    valid,
    author: message.author,
    contentHash: await sha256(payload),
    canTrust: valid && publicKey !== null
  };
}
```

### 4.2 Verification Works Everywhere

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

## 5. Publishing Flow

### 5.1 User Initiates Publish

```
User selects "Make Public"
        │
        ▼
┌───────────────────────────────────┐
│  WARNING: This action is PERMANENT│
│                                   │
│  Once published, anyone can:      │
│  • View your conversation         │
│  • Verify your authorship         │
│  • Download and redistribute       │
│  • Archive indefinitely           │
│                                   │
│  This CANNOT be undone.           │
│                                   │
│  [Cancel]  [I Understand, Publish]│
└───────────────────────────────────┘
```

### 5.2 Publication Steps

```
1. User selects what to include
   └─> Build selected content tree

2. Compute Merkle root
   └─> Tree of all included messages

3. Upload to IPFS (optional)
   └─> Returns CID

4. Prepare on-chain transaction
   └─> {
         conversationId,
         merkleRoot,
         ipfsCID (optional),
         metadata
       }

5. User signs transaction
   └─> Proves they authorized publication

6. Submit to blockchain
   └─> Mined into block

7. Confirmation
   └─> {
         blockNumber,
         transactionHash,
         timestamp
       }
```

---

## 6. Immutable Record

### 6.1 What Gets Anchored

```solidity
struct PublicConversation {
    bytes32 conversationId;     // Stable identifier
    bytes32 merkleRoot;         // Root of content tree
    uint256 messageCount;       // Number of messages
    bytes32 contentHash;        // Hash of full content
    string ipfsCID;            // IPFS location (optional)
    address author;            // Ethereum address (for convenience)
    bytes32 authorDID;         // Actual authorship (did:key)
    uint256 timestamp;         // Block timestamp
    uint256 blockNumber;       // Permanence
}
```

### 6.2 Verification Against Chain

```typescript
async function verifyFromChain(conversationId: string): Promise<boolean> {
  // 1. Fetch anchor from blockchain
  const anchor = await contract.getAnchor(conversationId);

  // 2. Fetch content from IPFS
  const content = await ipfs.fetch(anchor.ipfsCID);

  // 3. Compute Merkle root from content
  const computedRoot = computeMerkleRoot(content.messages);

  // 4. Verify matches anchor
  if (computedRoot !== anchor.merkleRoot) {
    return false;  // Content tampered!
  }

  // 5. Verify each message signature
  for (const msg of content.messages) {
    const valid = await verifyNode(msg);
    if (!valid) return false;
  }

  return true;  // ✅ Genuine, untampered, authored by claimed author
}
```

---

## 7. Privacy by Default, Public by Choice

### 7.1 Default State: Local

```
new Conversation("My thoughts on AI")
  ├── Stored: Local device only
  ├── Encrypted: Yes (device key)
  ├── Sharing: None
  └── Reversible: Yes (can promote later)
```

### 7.2 Explicit Promotion

```
// User chooses to share with Alice
shareWith("conversation-id", "did:key:alice...")
  ├── Content: Encrypted for Alice
  ├── Hash: Public (Alice can verify)
  └── Reversible: Yes (Alice cannot reshare)

// User chooses to publish publicly
publishPublicly("conversation-id", {
  includeForks: true,
  includeEdits: true
})
  ├── Content: Public IPFS
  ├── Root: On-chain anchor
  └── Reversible: NO (permanent)
```

---

## 8. Forks, Edits, and Derivatives

### 8.1 Fork Authorship

```
Original: by Alice (did:key:alice...)
    │
    ├─ Message: "How do closures work?"
    │
    └─ Bob's Fork: "Closures in Python"
        └─ All messages signed by Bob
        └─ References Alice's original
        └─ Bob proves: "I forked from Alice"
```

### 8.2 Edit History

When publishing with edit history:

```
Original Message (0xabc...)
  │
  ├── Content: "React is great"
  ├── Signature: Alice
  │
  └─ Edit (0xdef...)
      ├── Content: "React is awesome"
      ├── Signature: Alice
      └─ Edits: 0xabc

└─── When published, BOTH versions included
    └─── Everyone can see evolution
    └─── All signatures verify
```

### 8.3 Merkle Proofs for Subsets

Publish proof without content:

```typescript
// Prove I sent a message without revealing what it said
const proof = await generateMerkleProof(messageId);

// Publish only proof
await publishProof({
  conversationId,
  messageHash: proof.leaf,
  merkleRoot: proof.root,
  path: proof.path
});

// Anyone can verify:
// - This message is in this conversation
// - At this position
// - Without seeing the content
```

---

## 9. The Social Contract

### 9.1 For Publishers

**"When I publish publicly, I accept that:"**
- My content may be downloaded, saved, and redistributed
- My content may be archived indefinitely
- My authorship is permanently tied to my DID
- I cannot "delete" or "hide" this content later

### 9.2 For Verifiers

**"When I verify content, I trust:"**
- Cryptography, not people
- Signatures, not claims
- My own verification code, not a third party

### 9.3 For Derivative Works

```
Original Author: Alice
Fork Author: Bob

Bob's conversation:
  ├─ Messages: All signed by Bob
  ├─ References: "Forked from Alice's conversation 0xabc..."
  └─ License: Alice may specify terms

When Bob publishes publicly:
  ├─ Alice's authorship is preserved
  ├─ Bob's authorship is proven
  └─ Relationship is cryptographically verifiable
```

---

## 10. Implementation Checklist

- [ ] Privacy state tracking (local/shared/public)
- [ ] Encryption for shared content
- [ ] Granular publish options (main + forks + edits)
- [ ] Warning UI for permanent publication
- [ ] On-chain anchor integration
- [ ] IPFS upload integration
- [ ] Merkle proof generation for subsets
- [ ] Zero-trust verification UI
- [ ] Fork attribution display
- [ ] Edit history visualization
- [ ] Public search/discovery (optional)

---

## 11. UI Mockups

### 11.1 Privacy Selector

```
┌────────────────────────────────────────────────────────────┐
│  🔒 Privacy: Private (Local only)                          │
│                                                            │
│  Only you can see this conversation.                       │
│  Not synced. Not shared. Not published.                    │
│                                                            │
│  [Make Shared]  [Make Public]                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  👥 Privacy: Shared (Selective)                            │
│                                                            │
│  Shared with 3 people:                                     │
│  • alice@did.key...                                       │
│  • bob@did.key...                                         │
│  • carol@did.key...                                       │
│                                                            │
│  [Manage Recipients]  [Make Public]                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  🌐 Privacy: Public (On-Chain)                             │
│                                                            │
│  Published on Optimism block #12345678                     │
│  IPFS: QmABC123...                                        │
│                                                            │
│  Anyone can verify and download.                           │
│  This cannot be undone.                                    │
│                                                            │
│  [View on Explorer]                                        │
└────────────────────────────────────────────────────────────┘
```

### 11.2 Publish Dialog

```
┌────────────────────────────────────────────────────────────┐
│  🚀 Publish Conversation Publicly                          │
│                                                            │
│  "React Hooks Explained"                                   │
│                                                            │
│  Include in publication:                                   │
│                                                            │
│  ☑ Main conversation (15 messages)                         │
│  ☑ "TypeScript version" fork (8 messages)                  │
│  ☐ "Advanced examples" fork (12 messages)                  │
│  ☐ Edit history                                           │
│                                                            │
│  Destination:                                             │
│  ● Optimism ($0.02 estimated)                              │
│  ○ Ethereum Mainnet ($5.00 estimated)                      │
│  ○ Base ($0.01 estimated)                                 │
│                                                            │
│  ⚠️  This action is permanent. Your content will be       │
│     publicly verifiable and cannot be removed.            │
│                                                            │
│  Type PUBLISH to confirm: [________________]               │
│                                                            │
│  [Cancel]  [Preview]  [Publish]                            │
└────────────────────────────────────────────────────────────┘
```

---

## 12. References

- "Permanent Web" philosophy (IPFS, Arweave)
- Cryptographic provenance (Sigstore, Git signing)
- Privacy by design (GDPR, privacy-first architectures)
- Zero-knowledge proofs (for future private-public hybrids)

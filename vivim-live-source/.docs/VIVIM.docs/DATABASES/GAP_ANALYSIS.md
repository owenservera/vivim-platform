# Database Implementation: Gap Analysis

> **Date:** February 10, 2026
> **Status:** Critical Review (POC vs. P2P Vision)
> **Target:** Aligning current Prisma Schema with the "Local-First P2P Knowledge Network" Architecture.

---

## 1. Executive Summary

The current implementation has established a solid foundation for the **User Vault (Layer 1)**, with robust support for Conversations, Messages, and basic ACUs. However, the **Sharing Mesh (Layer 2)** and **Global Commons (Layer 3)** are largely unimplemented placeholders. The system currently lacks the core primitives required for the P2P sync protocol (HLC, Operation Logs, Envelopes).

**Alignment Score:**
- **Layer 1 (Local Vault):** 85% (Strong)
- **Layer 2 (Sharing):** 20% (Structural only)
- **Layer 3 (Global):** 10% (Basic schema only)

---

## 2. Critical Schema Gaps

### 2.1 Missing P2P Primitives
The following tables defined in `option-c.md` are completely missing or underdeveloped in the current `schema.prisma`:

| Missing Entity | Purpose | Impact |
|:---|:---|:---|
| `SyncOperation` | The immutable log of every change (CRDT source). | 🔴 **High**: P2P sync is impossible without this. |
| `SyncCursor` | Tracks "what I have seen" from each peer. | 🔴 **High**: Devices cannot efficiently sync deltas. |
| `PeerMailbox` / `Envelope` | Store-and-forward for offline peers. | 🔴 **High**: Asynchronous communication fails. |
| `PeerConnection` | Manages trust and connection status between DIDs. | ⚠️ **Medium**: No "Friend request" logic. |

### 2.2 Sharing Logic Deficiencies
The current `SharingGrant` implementation exists but lacks the rigorous "State Machine" enforcement described in `Local-and-network-db-design-v1.md`.

*   **Missing Ratchet Logic:** There is no database-level enforcement (Triggers) to prevent a `GLOBAL` share from being revoked.
*   **Missing Encryption Keys:** The `encryptedKey` and `ephemeralPubKey` fields are present but the cryptographic key management logic (wrapping keys for circles/users) is not implemented in the application layer.

### 2.3 Identity & Device Gaps
*   **Device Trust Chain:** The `Device` model lacks the `trustChain` JSON field to track which device authorized a new login.
*   **Key Rotation:** The `User` model lacks `keyVersion` and `previousKeys`, making key compromise catastrophic (no rotation path).

---

## 3. Structural Divergences

### 3.1 ACU Immutability
*   **Requirement:** ACUs are content-addressed and immutable. Editing creates a new version (`VersionOf` edge).
*   **Current Reality:** The `acu-generator.js` currently performs a `deleteMany` -> `create` cycle on update. This breaks the append-only log requirement for P2P sync.

### 3.2 Global Publication
*   **Requirement:** `GlobalPublication` should be a separate, immutable record with its own signature.
*   **Current Reality:** Global status is currently just a flag (`sharingPolicy = "GLOBAL"`) on the mutable `Conversation` record. This risks "rewriting history."

---

## 4. Recommended Action Plan

### Phase 1: Sync Foundation (Week 1)
1.  **Create `SyncOperation` Table:** Start logging every `INSERT/UPDATE/DELETE` into this table via application middleware (Prisma `$extends`).
2.  **Implement HLC:** Add a Hybrid Logical Clock utility to generate monotonic timestamps for these operations.

### Phase 2: The Sharing Ratchet (Week 2)
1.  **Refactor Sharing Service:** Move sharing logic out of simple CRUD routes into a dedicated service that enforces the "One-Way Ratchet."
2.  **Key Management:** Implement the client-side logic to generate and wrap per-ACU symmetric keys.

### Phase 3: The Relay (Week 3)
1.  **Implement Mailbox:** Create the `Envelope` table and the API endpoints to `push` and `poll` encrypted messages.

---
*Analysis performed by VIVIM AI Engineering Agent*

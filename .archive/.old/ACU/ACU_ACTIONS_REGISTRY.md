# ACU Actions & Behavioral Registry
**Formal Definition of Interactions Over Time**

**Date:** January 29, 2026
**Status:** Architecture Specification

---

## 1. Overview: The ACU as an "Actor"

An Atomic Chat Unit (ACU) is not static data; it is an object that **experiences events** over its lifetime. This document creates a registry of all possible **Actions** a User (or the Network) can perform on an ACU.

These actions drive the **State Machine** of the ACU and generate the **Graph Edges** that track its history.

---

## 2. Creation Actions (Genesis)

These actions bring an ACU into existence.

| Action ID | Name | Description | Resulting State |
| :--- | :--- | :--- | :--- |
| `ACT_CAPTURE` | **Capture** | Extracted raw from an external provider (ChatGPT/Claude). | `DORMANT` |
| `ACT_DECOMPOSE` | **Decompose** | System breaks a parent ACU (Message) into children (Propositions). | `ACTIVE` |
| `ACT_CREATE` | **Author** | User manually types a new note or fact. | `ACTIVE` |
| `ACT_IMPORT` | **Import** | Ingested from a file (Markdown, JSON, PDF). | `ACTIVE` |

---

## 3. Mutation Actions (Evolution)

Since ACUs are immutable, "Mutation" actually means "Creating a new Version."

| Action ID | Name | Description | Graph Effect |
| :--- | :--- | :--- | :--- |
| `ACT_EDIT` | **Edit/Refine** | Modifying the text content (e.g., fixing a typo, clarifying). | Creates `ACU_V2`. Adds edge: `V2 --(REFINES)--> V1`. |
| `ACT_FORK` | **Fork** | Taking an ACU to a new context to diverge its purpose. | Creates `ACU_B`. Adds edge: `B --(FORK_OF)--> A`. |
| `ACT_MERGE` | **Merge** | Combining two distinct ACUs into one summary or solution. | Creates `ACU_C`. Adds edges: `C --(MERGES)--> A`, `C --(MERGES)--> B`. |
| `ACT_ANNOTATE` | **Annotate** | Adding a marginal note or comment to an ACU without changing it. | Creates `Note_ACU`. Adds edge: `Note --(ANNOTATES)--> Target`. |
| `ACT_REDACT` | **Redact** | Hiding sensitive parts of an ACU for a specific audience. | Creates `Redacted_ACU`. Adds edge: `Redacted --(REDACTION_OF)--> Original`. |

---

## 4. Organization Actions (Curation)

These actions change the ACU's position or relationships in the graph.

| Action ID | Name | Description | Graph Effect |
| :--- | :--- | :--- | :--- |
| `ACT_TAG` | **Tag** | Attaching a semantic label (e.g., "#rust"). | Adds edge: `ACU --(TAGGED)--> Tag_Node`. |
| `ACT_LINK` | **Link** | Manually connecting two ACUs (e.g., "See also"). | Adds edge: `ACU_A --(RELATED)--> ACU_B`. |
| `ACT_GROUP` | **Bundle** | Collecting multiple ACUs into a "Collection" or "Folder". | Adds edges: `Collection --(CONTAINS)--> ACU`. |
| `ACT_PIN` | **Pin/Favorite** | Marking an ACU for quick access. | Updates User Preference Graph. |
| `ACT_DISCARD` | **Archive** | Hiding an ACU from default views without deleting. | Sets State: `ARCHIVED`. |

---

## 5. Network Actions (Sharing & P2P)

These actions involve moving the ACU across the network boundary.

| Action ID | Name | Description | Security Implication |
| :--- | :--- | :--- | :--- |
| `ACT_SHARE_P2P` | **Share (Private)** | Sending to a specific Peer ID via encrypted channel. | Re-encrypts with session key. |
| `ACT_PUBLISH` | **Publish (Public)** | pushing to the DHT/IPFS for global discovery. | Signs with Author DID. content becomes public. |
| `ACT_REVOKE` | **Revoke** | Sending a "Tombstone" to peers to request deletion/hiding. | Cannot force deletion, but signals intent. |
| `ACT_SYNC` | **Sync** | Updating local state to match a remote peer's version. | Merges CRDT operations. |
| `ACT_ATTEST` | **Attest/Verify** | Cryptographically signing someone else's ACU ("I agree"). | Adds `Attestation_ACU` linked to target. |

---

## 6. Consumption Actions (Usage)

Tracking how the ACU is used helps calculating its "Quality Score."

| Action ID | Name | Description | Scoring Effect |
| :--- | :--- | :--- | :--- |
| `ACT_VIEW` | **Read** | User opened/focused on the ACU. | `+ Rediscovery Score` |
| `ACT_COPY` | **Copy** | User copied text to clipboard. | `++ Quality Score` |
| `ACT_EXPORT` | **Export** | User saved as file/PDF. | `++ Quality Score` |
| `ACT_QUOTE` | **Quote** | User used this ACU as context for a new AI prompt. | `+++ Relevance Score` |

---

## 7. The Action Log (Implementation)

Every ACU has an associated **Action Log** (Audit Trail).

```rust
struct ActionEvent {
    id: Uuid,
    acu_hash: String,       // The target ACU
    actor_did: String,      // Who did it?
    action_type: ActionID,  // What did they do?
    timestamp: u64,         // When?
    metadata: Json,         // Details (e.g., "New Text" for EDIT)
    signature: Vec<u8>      // Non-repudiation
}
```

This log allows us to replay the history of any thought:
> *"This Code Snippet (ACU #5) was **Captured** from ChatGPT by User A, **Forked** by User B to fix a bug, **Annotated** with a warning by User C, and then **Published** to the team library."*

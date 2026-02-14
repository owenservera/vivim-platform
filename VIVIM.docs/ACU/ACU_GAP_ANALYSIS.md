# ACU Implementation: Gap Analysis

> **Date:** February 10, 2026
> **Status:** Critical Review (POC vs. Master Specification)
> **Target:** Aligning current Prisma/Postgres implementation with the Rust Core Blueprint.

---

## 1. Executive Summary

The current implementation (Phase 1: Prisma Fallback) has successfully established the **schema shell** and **basic pipeline** for Atomic Chat Units. However, there is a significant gap between the "Message-centric" logic currently in place and the "Semantic-centric" logic required by the Master Specification. 

**Current Alignment Score: 45%**

---

## 2. Structural & Data Gaps

| Feature | Master Specification (Target) | Current Implementation (POC) | Gap Status |
|:---|:---|:---|:---|
| **ID Generation** | SHA-256 of `Content + Parent Hash` | SHA-256 of `ConvoID + MsgID + Content` | ⚠️ **Medium**: Current IDs are tied to provenance, not purely to content. |
| **Cryptography** | Ed25519 Signatures per ACU | Placeholder Buffer (`prisma-generated`) | 🔴 **High**: Content is not yet "Verifiable" across the network. |
| **Identity** | Native DID integration (`did:key`) | String field in DB; no active signing | ⚠️ **Medium**: Database handles the field, but logic is dormant. |
| **Embeddings** | 384-dim Vector (Phi-3/MiniLM) | Field exists; generation is mocked/null | 🔴 **High**: Semantic search and "Similarity" links are inactive. |
| **Storage Engine** | Rust Redb / LanceDB / Tantivy | PostgreSQL / Prisma | ⚠️ **Strategic**: Deliberate POC fallback. |

---

## 3. Decomposition Logic Gaps (The Chunker)

The Master Specification defines a "Lossless, Expanding Transformation" using TreeSitter.

*   **Current Logic:** Simple paragraph splitting (`split(/

+/)`) and basic regex for code blocks.
*   **Missing Capabilities:**
    1.  **TreeSitter Integration**: Structural awareness of Markdown AST.
    2.  **Context preservation**: Ensuring a `CodeSnippet` ACU "knows" it was preceded by an `Explanation` ACU beyond simple sequential IDs.
    3.  **Entity Extraction**: Automatic identification of `User.Birthday` or `API_Key` (Level 5 granularity).

---

## 4. Graph Semantics Gaps

The spec requires a Directed Acyclic Graph (DAG) with rich edge relations.

*   **Target Relations:** `NEXT`, `CHILD_OF`, `RELATES_TO`, `CONTRADICTS`, `SUPPORTS`, `VERSION_OF`.
*   **Current Relations:** Mostly sequential `NEXT` links and `conversationId` parent links.
*   **Gap:** The "Knowledge Graph" is currently just a "Linked List." We lack the logic to detect when ACU A from Conversation 1 supports ACU B from Conversation 2.

---

## 5. Lifecycle & Action State Gaps

| State/Action | Spec Requirement | Current Status |
|:---|:---|:---|
| **DORMANT** | Raw data storage | ✅ **Complete** (CaptureAttempt) |
| **ACTIVE** | Parsed & Indexed | ✅ **Complete** (ACU Generator) |
| **FORKED** | Version tracking via `VERSION_OF` | ❌ **Missing**: Edits currently delete/replace. |
| **REDACT** | Automatic PII hiding | ❌ **Missing** |
| **ATTEST** | Multi-user verification | ❌ **Missing** |

---

## 6. Critical Technical Debt

1.  **Immutability Violation**: The Master Spec states ACUs are immutable. The current `acu-generator.js` uses `deleteMany` then `create` on update to save space. This breaks Merkle integrity for P2P.
2.  **Provenance Hardcoding**: ACUs are too tightly coupled to their `messageId`. In a pure DAG, the ACU should be able to migrate between conversations without losing its identity.
3.  **Normalization**: The PWA and Server use slightly different canonicalization logic for content hashing, leading to potential "Byzantine Detection" false positives.

---

## 7. Recommended Action Plan

1.  **Immediate (Week 1)**: Replace placeholder signatures with actual Ed25519 signing in `acu-generator.js` using the User's device key.
2.  **Intermediate (Week 2)**: Implement a lightweight local embedding worker (Transformers.js or similar) to populate the `embedding` field.
3.  **Architectural (Week 3+)**: Re-enable the Rust Core bridge specifically for the **TreeSitter Chunker** to improve decomposition quality.

---
*Analysis performed by VIVIM AI Engineering Agent*

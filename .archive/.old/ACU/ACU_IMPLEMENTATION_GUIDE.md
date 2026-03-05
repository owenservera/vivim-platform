# ACU Implementation Guide: Rust & Data Structures
**Technical Specification for Atomic Chat Units**

**Date:** January 29, 2026
**Target System:** Pure Rust Mobile Node

---

## 1. The Schema (Rust Implementation)

The ACU is designed to be serialized efficiently (CBOR/Bincode) for P2P transport and mapped to SQL/LanceDB for querying.

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// The Immutable Identifier of an ACU (Content Hash)
pub type AcuHash = String; // SHA-256 Hex

/// The Semantic Type of the Unit
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AcuType {
    /// Pure informational statement or fact
    Statement,
    /// An explicit question asked by the user
    Question,
    /// A direct answer or solution provided by the AI
    Answer,
    /// A block of code (function, script, config)
    CodeSnippet { language: String },
    /// Logical derivation or explanation of "Why"
    Reasoning,
    /// A concrete choice made during the conversation
    Decision,
    /// A reference to external url or internal file
    Reference { url: String },
    /// Catch-all
    Unknown,
}

/// The Core Atomic Chat Unit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AtomicChatUnit {
    /// Content-Addressed ID (Immutable)
    pub id: AcuHash,
    
    /// Cryptographic Signature of the content + author
    pub signature: Vec<u8>,
    
    /// The Author (DID)
    pub author_did: String,
    
    /// The actual content payload
    pub content: String,
    
    /// Semantic Classification
    pub kind: AcuType,
    
    /// Vector Embedding (384-1536 dim floats) - Optional for transport
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embedding: Option<Vec<f32>>,
    
    /// Provenance Metadata
    pub provenance: Provenance,
    
    /// Graph Edges (Adjacency List)
    pub links: Vec<AcuEdge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Provenance {
    pub conversation_id: Uuid,
    pub message_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub source_provider: String, // e.g., "chatgpt", "claude"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcuEdge {
    pub target_id: AcuHash,
    pub relation: EdgeRelation,
    pub weight: f32, // 0.0 - 1.0 confidence
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EdgeRelation {
    Next,           // Sequential flow
    ChildOf,        // Structural hierarchy
    RelatesTo,      // Semantic similarity
    Contradicts,    // Logical conflict
    Supports,       // Logical support
    VersionOf,      // Edit history (P2P fork)
}
```

---

## 2. Storage Strategy

We use a **Hybrid Storage Model** to balance performance and query capability.

| Data Type | Storage Engine | Reason |
| :--- | :--- | :--- |
| **ACU Blob (Immutable)** | `redb` (Key-Value) | Fast random access by Hash ID. |
| **Graph Structure** | `oxigraph` (RDF) or `redb` | Traversal queries ("Find all children of X"). |
| **Embeddings** | `lancedb` (Vector) | Semantic Search ("Find ACUs about 'Rust'"). |
| **Search Index** | `tantivy` (FTS) | Keyword Search ("Find ACU containing 'unwrap'"). |

### 2.1 The "Fact Table" (SQLite/Redb Schema)

While the Rust struct is the in-memory representation, on disk we normalize it:

```sql
-- The Master Table
CREATE TABLE acus (
    hash_id TEXT PRIMARY KEY,
    author_did TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    content_text TEXT NOT NULL,
    acu_type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    payload_blob BLOB -- Compressed full struct for reconstruction
);

-- The Edge Table (Graph)
CREATE TABLE acu_edges (
    source_id TEXT,
    target_id TEXT,
    relation TEXT,
    weight REAL,
    PRIMARY KEY (source_id, target_id, relation)
);
```

---

## 3. P2P Sharing Logic (CRDT & Mutability)

ACUs are **immutable**. You cannot edit an ACU. You can only create a **new version** of it.

### The "Edit" Workflow (Forking)

1.  **User A** creates `ACU_1` ("Hello Worl").
2.  **User B** receives `ACU_1`.
3.  **User B** fixes typo -> Creates `ACU_2` ("Hello World").
    *   `ACU_2` contains an edge: `target: ACU_1, relation: VersionOf`.
4.  **The Network** sees both. The UI chooses which to display based on:
    *   Timestamp (Latest)
    *   Trust Score (User B is trusted)
    *   Explicit User Selection

### CRDT Integration (Automerge)

For shared *lists* of ACUs (e.g., a collaborative document), we use **Automerge**.
The Automerge document essentially contains a list of `AcuHash` references.

```rust
// Automerge Document Structure
{
    "title": "Shared Notes",
    "blocks": [
        "hash_acu_1",
        "hash_acu_2", // Replaced ACU_1 in the view
        "hash_acu_3"
    ]
}
```

This keeps the heavy content in the Content-Addressed Store (CAS) and keeps the sync protocol lightweight.

---

## 4. Verification & Security

Every ACU is a **Verifiable Credential** of a thought.

*   **Signature:** `Ed25519(hash_id)` signed by `author_private_key`.
*   **Tamper Evidence:** If you change one character in the content, the `hash_id` changes. If the ID changes, it's a *new* ACU, breaking the chain unless explicitly linked.
*   **Access Control:** To share privately, we wrap the ACU in an **Encrypted Envelope** (using NaCl / ChaCha20) where the key is shared only with specific DIDs.

---

## 5. Next Steps for Implementation

1.  **Define the Rust Structs** in `crates/core/src/types/acu.rs`.
2.  **Implement the Hashing Logic** (Canonical serialization -> SHA256).
3.  **Implement the TreeSitter Chunker** to output this format.
4.  **Map to LanceDB** for the semantic layer.

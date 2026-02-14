# Atomic Chat Units (ACU): The Nervous System of OpenScroll
**Conceptual Framework & Formal Definition**

**Date:** January 29, 2026
**Status:** Foundational Research

---

## 1. The Core Concept: Breaking the "Message Monolith"

Traditionally, chat logs are stored as **Messages** inside **Threads**.
*   *Problem:* A single message from an AI often contains multiple distinct concepts: a code snippet, an explanation of that code, a warning about edge cases, and a suggested alternative library.
*   *Consequence:* Retrieval is blunt. Searching for "Rust error handling" gives you the whole 500-line message, not just the specific explanation. Sharing is coarse. You share the whole thread or copy-paste text (losing context).

**The Solution: The Atomic Chat Unit (ACU)**
An ACU is the smallest **semantically complete** unit of information within a conversation. It is a "proposition" or "thought" that can stand on its own while maintaining links to its origin.

> **Analogy:**
> *   **Messages** are like pages in a book.
> *   **ACUs** are the individual paragraphs, diagrams, and footnotes.
> *   **OpenScroll** is the index that lets you remix these paragraphs into new books.

---

## 2. Formal Definition

An ACU is a **content-addressed, cryptographically signed, typed data structure**.

### The ACU Schema (Pseudo-Rust)

```rust
struct ACU {
    // Identity & Integrity
    id: Hash,                   // SHA-256(content + parent_hash) - Content Addressable
    signature: Signature,       // Ed25519 signature of the creator/miner
    
    // Provenance (The "Golden Thread")
    author_did: DID,            // Decentralized ID of creator (User or AI Agent)
    origin_message_id: Uuid,    // Link to raw log
    origin_conversation_id: Uuid,
    timestamp: u64,
    
    // The Payload (Immutable Core)
    content: ContentType,       // The actual text/code
    language: Option<String>,   // For code/markdown
    
    // Semantic Layer (Mutable Overlay)
    type: AcuType,              // Code, Fact, Reasoning, etc.
    embedding: Vector<f32>,     // 384-dim semantic vector (e.g. Phi-3/MiniLM)
    
    // Graph Connectivity
    links: Vec<Edge>,           // Outgoing links to other ACUs
}

enum ContentType {
    Text(String),
    CodeBlock { code: String, lang: String },
    Image { url: String, alt: String },
    StructuredData(Json),
}

enum AcuType {
    Statement,      // General prose
    Question,       // User intent
    Answer,         // Direct response
    CodeSnippet,    // Executable block
    Reasoning,      // "Because X, therefore Y"
    Decision,       // "We chose A over B"
    Reference,      // Citation or Link
}
```

---

## 3. The ACU Lifecycle

### A. Birth (The "Miner")
The ACU is born when the **Parser Engine** processes a raw message.
1.  **Normalization**: Markdown is stripped of artifacts.
2.  **Chunking**: TreeSitter heuristics break the message into logical blocks (e.g., separating a code block from its description).
3.  **Hashing**: The content is hashed to generate its immutable ID.

### B. Enrichment (The "Brain")
Once born, the ACU is processed by the on-device AI:
1.  **Vectorization**: An embedding is generated (e.g., `[0.12, -0.98, ...]`) representing *meaning*.
2.  **Classification**: The system tags it (e.g., "This is a **Python Code Snippet** related to **AsyncIO**").

### C. Networking (The "Nervous System")
When shared via P2P:
1.  **Verification**: The recipient checks the Signature against the Author's DID.
2.  **Merging**: If User B edits the ACU, they create a *new* ACU (a child node) or a CRDT operation on the mutable layer, linking back to the original.

---

## 4. Graph Semantics: How ACUs Connect

ACUs don't float in void; they form a **Directed Acyclic Graph (DAG)**.

*   **Sequential Edges (`NEXT`)**: ACU[1] -> ACU[2]. Preserves the linear reading order of the original chat.
*   **Hierarchical Edges (`CHILD_OF`)**: A code snippet is a child of the explanation block introducing it.
*   **Semantic Edges (`RELATES_TO`)**: Created by vector similarity. "This React hook ACU is similar to this Vue composable ACU."
*   **Citation Edges (`CITES`)**: ACU A explicitly references ACU B.

---

## 5. Why This Matters for the "Living Ledger"

By treating ACUs as the atomic unit, we enable:

1.  **Granular Access Control**: You can share *just* the "Solution" ACUs from a project discussion without sharing the "Sensitive Data" ACUs.
2.  **Collaborative Refinement**: User A shares a "Draft Code" ACU. User B forks it into a "Optimized Code" ACU. The graph records both, linking them as `OPTIMIZES`.
3.  **Deduplication**: If you ask ChatGPT the same question twice, the answer ACUs might be identical. The system detects this via content hashing and links them, building a stronger weight for that fact.

---

## 6. Learning Path for Developers

To work with ACUs, one must master:
1.  **Content Addressing**: Understanding why we use Hashes, not Auto-Increment IDs.
2.  **CRDTs (Conflict-free Replicated Data Types)**: How to handle two people editing the metadata of an ACU simultaneously.
3.  **Vector Embeddings**: How to find ACUs by "meaning" rather than keyword.

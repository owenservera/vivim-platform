# Atomic Chat Units (ACU) Schema Definition
**Formal Database Specification for P2P-Ready Knowledge Graph**

**Date:** January 29, 2026
**Status:** Schema Specification
**Target Database:** `redb` (Key-Value) + `LanceDB` (Vector) + `SQLite` (Relational/Graph)

---

## 1. Schema Philosophy: "Decompose to Compost"

We are moving from a **Monolithic Document Store** (Prisma `Conversation` + `Message`) to a **Granular Graph Store** (`ACU` + `Edge`).

*   **Old World (Prisma):** Hierarchical, Document-Oriented. Good for archiving. Bad for remixing.
*   **New World (ACU):** Content-Addressed, Flat, Interconnected. Good for "thought Lego."

---

## 2. The Core Tables (SQLite/Redb)

### 2.1 `acus` (The Immutable Fact Table)
This table stores the **Canonical Content**. It is append-only (mostly).

```sql
CREATE TABLE acus (
    -- IDENTITY (Content Addressing)
    hash_id TEXT PRIMARY KEY,       -- SHA-256(content + type + author)
    
    -- AUTHORSHIP (Verifiable Credential)
    author_did TEXT NOT NULL,       -- Decentralized ID (e.g. did:key:z6Mk...)
    signature BLOB NOT NULL,        -- Ed25519 signature of the payload
    
    -- PAYLOAD (The "Atom")
    content_text TEXT NOT NULL,     -- The raw text/code/latex
    content_blob BLOB,              -- Optional binary data (images, compressed large text)
    language TEXT,                  -- "rust", "en", "latex"
    
    -- SEMANTICS (The "Type")
    acu_type TEXT NOT NULL,         -- "statement", "code", "question", "answer", "reasoning"
    
    -- PROVENANCE (The "Golden Thread")
    source_conversation_id TEXT NOT NULL, -- UUID of L0 Conversation
    source_message_id TEXT NOT NULL,      -- UUID of L0 Message
    source_provider TEXT NOT NULL,        -- "chatgpt", "claude"
    created_at INTEGER NOT NULL,          -- Unix Timestamp (ms)
    
    -- P2P STATE
    is_public BOOLEAN DEFAULT 0,    -- Is this shared on the public DHT?
    encryption_key_id TEXT          -- If encrypted, which key decrypts it?
);

-- Indexes for fast lookup
CREATE INDEX idx_acus_conversation ON acus(source_conversation_id);
CREATE INDEX idx_acus_type ON acus(acu_type);
CREATE INDEX idx_acus_created ON acus(created_at);
```

### 2.2 `acu_edges` (The Knowledge Graph)
This table defines the **relationships** between atoms. It turns the pile of facts into a web of knowledge.

```sql
CREATE TABLE acu_edges (
    source_id TEXT NOT NULL,        -- ACU Hash ID
    target_id TEXT NOT NULL,        -- ACU Hash ID
    
    relation TEXT NOT NULL,         -- The "Verb" of the edge
    weight REAL DEFAULT 1.0,        -- Confidence or Relevance (0.0 - 1.0)
    
    -- PROVENANCE
    created_at INTEGER NOT NULL,
    generator TEXT NOT NULL,        -- "parser", "user_manual", "vector_sim"
    
    PRIMARY KEY (source_id, target_id, relation),
    FOREIGN KEY (source_id) REFERENCES acus(hash_id),
    FOREIGN KEY (target_id) REFERENCES acus(hash_id)
);

-- Indexes for traversal
CREATE INDEX idx_edges_source ON acu_edges(source_id);
CREATE INDEX idx_edges_target ON acu_edges(target_id);
```

**Standard Relations Registry:**
*   `NEXT`: Sequential flow (ACU 1 -> ACU 2).
*   `CHILD_OF`: Structural hierarchy (Code Block -> Message).
*   `ANSWERS`: Assistant Response -> User Question.
*   `EXPLAINS`: Reasoning Block -> Code Snippet.
*   `SIMILAR_TO`: Vector similarity (auto-generated).
*   `VERSION_OF`: P2P Fork (My Edit -> Your Original).

---

## 3. The Vector Store (LanceDB Schema)

While SQLite holds the "Truth," LanceDB holds the "Meaning."

```rust
// LanceDB Schema (Pseudo-code)
struct AcuVector {
    id: u64,                        // Internal Row ID
    acu_hash: String,               // Foreign Key to SQLite
    
    // The Semantic Embedding
    vector: Vector<f32, 384>,       // 384-dim (MiniLM) or 1536 (OpenAI)
    
    // Metadata for Filtering (Duplicated from SQLite for speed)
    acu_type: String,
    conversation_id: String,
    quality_score: f32,             // Computed importance score
}
```

---

## 4. The Mapping Strategy (Prisma -> ACU)

We must migrate existing data into this new structure.

### 4.1 The `Message.parts` JSONB
In the old Prisma schema, we stored content in a JSON array:
```json
"parts": [
  { "type": "text", "content": "Here is the code:" },
  { "type": "code", "content": "console.log('hi')", "language": "js" }
]
```

This maps **directly** to ACUs:
1.  **Part 1 (Text):** Becomes `ACU { type: "statement", content: "Here is the code:" }`
2.  **Part 2 (Code):** Becomes `ACU { type: "code", content: "console.log...", language: "js" }`
3.  **Edge:** `ACU_1 --(NEXT)--> ACU_2` AND `ACU_1 --(INTRODUCES)--> ACU_2`

### 4.2 Handling L0 Metadata
The `Conversation` table in Prisma remains useful as the **L0 Archive**. The ACU store is an **L1 Derived Store**.
*   We **keep** the `Conversation` table for "Full Chat View" (linear reading).
*   We **generate** the `ACU` graph for "Knowledge View" (search/remix).

---

## 5. Security & Verification (P2P Layer)

When `User A` edits `User B`'s ACU, they do not update the row. They:
1.  Create a new row in `acus` with a new `hash_id`.
2.  The `content` reflects the edit.
3.  They add an edge: `New_ACU --(VERSION_OF)--> Old_ACU`.
4.  They sign `New_ACU` with their private key.

This creates an **append-only, tamper-evident Merkle DAG** of conversation history.

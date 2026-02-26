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

# L0 to L1: Mapping Conversations to Atomic Chat Units
**Formal Definition & Decomposition Logic**

**Date:** January 29, 2026
**Status:** Architecture Specification

---

## 1. The L0 Primitive: The `CONVERSATION`

The `CONVERSATION` is the raw, immutable artifact captured from the external provider (ChatGPT, Claude, etc.). It is the "Ground Truth." It represents a specific interaction session between a User and an AI.

### 1.1 Formal Definition

A `CONVERSATION` is a **chronologically ordered, linear sequence of Messages**, bounded by a specific context and provider session.

```rust
struct Conversation {
    // Identity
    id: Uuid,                   // Internal unique ID
    source_url: String,         // The origin (e.g., chatgpt.com/c/...)
    provider: ProviderType,     // ChatGPT, Claude, etc.
    
    // Metadata
    title: String,
    created_at: DateTime<Utc>,
    captured_at: DateTime<Utc>,
    model_version: Option<String>,
    
    // The Linear Log (L0 Content)
    messages: Vec<Message>,
    
    // Integrity
    content_hash: String,       // SHA-256 of the raw JSON payload
}

struct Message {
    id: Uuid,
    role: Role,                 // User, Assistant, System
    index: usize,               // 0, 1, 2... (Sequence)
    content: String,            // Raw Markdown/Text
    attachments: Vec<Attachment>,
}
```

### 1.2 Characteristics
1.  **Immutable:** Once captured, the `CONVERSATION` L0 state never changes. Edits happen at the ACU level (L1), not L0.
2.  **Linear:** It strictly follows time (`t0 -> t1 -> t2`).
3.  **Monolithic:** It is often retrieved as a single JSON blob.

---

## 2. The Decomposition Engine (L0 -> L1)

The process of converting a `CONVERSATION` into `ACUs` is called **Decomposition**. This is a **lossless, expanding transformation**. We do not delete the original; we explode it into granular, graph-ready nodes.

### 2.1 The Rules-Based Approach

We use **TreeSitter** (structural) and **Heuristics** (semantic) to map L0 components to L1 ACUs.

#### **Rule #1: The Turn Boundary (Root Split)**
*   **Logic:** Every change in `Role` (User -> Assistant) initiates a new sequence of ACUs.
*   **Result:** A `Message` is the parent container for a batch of ACUs.
*   **Graph Edge:** `ACU[i] --(CHILD_OF)--> Message[j]`

#### **Rule #2: The Code Fence (Atomic Separation)**
*   **Detection:** Markdown fencing (```...```) or indented blocks.
*   **Logic:** Code is functionally distinct from prose. It is often the "Answer" or "Asset."
*   **Action:** Extract the code block into a distinct `ACU` of type `CodeSnippet`.
*   **Context:** The text immediately *preceding* the block is often the "Explanation" and is linked via `EXPLAINS` edge.

#### **Rule #3: The Header Break (Topic Shift)**
*   **Detection:** Markdown Headers (`#`, `##`, `###`).
*   **Logic:** A header explicitly signals a change in sub-topic or a new step in a tutorial.
*   **Action:** Create a new ACU sequence. The Header itself becomes a "Statement" ACU that acts as a parent/grouping node for the section.

#### **Rule #4: The List Item (Proposition Extraction)**
*   **Detection:** Bullet points (`-`, `*`) or Numbered lists (`1.`).
*   **Logic:** Lists are often condensed reasoning or distinct facts.
*   **Action:**
    *   *Short Items (< 1 sentence):* Keep grouped in one "List" ACU.
    *   *Long Items (> 2 sentences):* Split each item into its own `Statement` or `Reasoning` ACU.

#### **Rule #5: The Q&A Pair (Logical Link)**
*   **Detection:** User Message followed immediately by Assistant Message.
*   **Logic:** The User Message ACU(s) form the `Question`. The Assistant Message ACU(s) form the `Answer`.
*   **Graph Edge:** `Assistant_ACU --(ANSWERS)--> User_ACU`.

---

## 3. Mapping Example

**Input (L0 Message Fragment):**
> **User:** How do I read a file in Rust?
>
> **Assistant:** You can use `std::fs`. Here is an example:
> ```rust
> use std::fs;
> fn main() {
>     let data = fs::read_to_string("foo.txt").unwrap();
> }
> ```
> This reads the entire file into a string.

**Output (L1 ACUs):**

| ID | Type | Content | Links |
| :--- | :--- | :--- | :--- |
| **ACU_1** | `Question` | "How do I read a file in Rust?" | `Origin: Msg_0` |
| **ACU_2** | `Statement` | "You can use `std::fs`. Here is an example:" | `Origin: Msg_1`, `ANSWERS: ACU_1` |
| **ACU_3** | `CodeSnippet` | `use std::fs; ...` | `Origin: Msg_1`, `NEXT: ACU_2` |
| **ACU_4** | `Explanation` | "This reads the entire file into a string." | `Origin: Msg_1`, `EXPLAINS: ACU_3` |

---

## 4. Implementation Logic (Pseudo-Code)

This logic resides in the `Rust Parser Engine`.

```rust
fn decompose_conversation(convo: Conversation) -> Vec<ACU> {
    let mut acus = Vec::new();
    
    for message in convo.messages {
        // 1. Create a "Root" ACU for the message (optional, usually virtual)
        
        // 2. Parse Markdown AST (TreeSitter)
        let ast = parser.parse(&message.content);
        
        // 3. Walk the AST
        let mut cursor = ast.walk();
        for node in cursor {
            match node.kind {
                "fenced_code_block" => {
                    let code = extract_text(node);
                    let lang = extract_lang(node);
                    acus.push(ACU::new_code(code, lang, message.id));
                },
                "paragraph" => {
                    let text = extract_text(node);
                    // Check heuristics: Is this a question?
                    let kind = if text.ends_with('?') { AcuType::Question } else { AcuType::Statement };
                    acus.push(ACU::new(text, kind, message.id));
                },
                "list" => {
                    // Recursive breakdown of list items
                    let items = decompose_list(node);
                    acus.extend(items);
                }
                _ => { /* Handle formatting, images, etc. */ }
            }
        }
    }
    
    // 4. Second Pass: Linkage
    // Connect sequential ACUs and establish Q&A links between turns
    link_acus(&mut acus);
    
    return acus;
}
```

---

## 5. Persistence Strategy

While the `CONVERSATION` is stored as a "Cold Archive" (Blob), the `ACUs` are stored in the "Hot Graph" (Nodes & Edges).

*   **Reversibility:** We must be able to reconstruct the approximate view of the L0 Conversation from the L1 ACUs.
*   **Provenance:** Every ACU *must* store the `conversation_id` and `message_index`.

This mapping ensures that as the user captures more conversations, they aren't just piling up logs—they are building a granular, interconnected database of knowledge.

# ACU Hierarchy & Action State Model
**Formal Definition of Granularity and Behavioral States**

**Date:** January 29, 2026
**Status:** Advanced Concept Definition

---

## 1. The Granularity Hierarchy (Zoom Levels)

The ACU system treats information not as a flat list, but as a "Zoomable Map." An ACU can represent a single fact, or an entire conversation, depending on the **Zoom Level**.

### Level 0: The Universe (Graph Root)
*   **Unit:** `Identity_ACU`
*   **Definition:** The User Node. "Everything I know."
*   **Children:** All Conversation Roots.

### Level 1: The Context (Conversation Root)
*   **Unit:** `Conversation_ACU`
*   **Definition:** A specific session (e.g., "React Native Debugging - Jan 29").
*   **Role:** Container for the full linear log.
*   **Relations:** `HAS_PART` (points to Message Clusters).

### Level 2: The Topic Cluster (Logical Grouping)
*   **Unit:** `Topic_ACU` (Virtual Node)
*   **Definition:** A sequence of messages related to a specific sub-goal (e.g., "Fixing the SSL Error").
*   **Detection:** Heuristic break (Header change) or Vector Cluster boundary.
*   **Children:** Individual Messages.

### Level 3: The Turn (Message Root)
*   **Unit:** `Message_ACU`
*   **Definition:** A single "User Send" or "Assistant Reply."
*   **Role:** Provenance anchor.
*   **Children:** Paragraphs, Code Blocks.

### Level 4: The Atomic Proposition (The Working Unit)
*   **Unit:** `Proposition_ACU`
*   **Definition:** A single standalone thought.
    *   *Example:* "Use `useEffect` to handle side effects."
    *   *Example:* A specific Code Block.
*   **Role:** This is the primary unit for **Search** and **Remixing**.

### Level 5: The Entity / Fact (The Micro-Unit)
*   **Unit:** `Fact_ACU`
*   **Definition:** A specific extracted data point.
    *   *Example:* `User.Birthday = "Jan 29"`
    *   *Example:* `API_Key = "sk-..."`
*   **Special Handling:** These are often **Personal Identifiable Information (PII)** and require higher security (Encryption Level 3).

---

## 2. Action States (The ACU Lifecycle)

An ACU is not static; it has a "Life" defined by its state in the P2P network.

| State | Definition | Access Rights | Persistence |
| :--- | :--- | :--- | :--- |
| **DORMANT** | Raw captured data. Not yet parsed or enriched. | Private (Owner Only) | Disk (SQLite) |
| **ACTIVE** | Parsed, indexed, and vector-embedded. Searchable locally. | Private (Owner Only) | Disk + RAM Index |
| **SHARED_PRIVATE** | Encrypted and synced to specific peers (P2P). | ACL Group (e.g., "Co-Workers") | P2P Swarm |
| **SHARED_PUBLIC** | Published to the DHT. Immutable. | Public (World Readable) | IPFS/DHT |
| **FORKED** | A copy taken by another user for editing. Links back to original. | Fork Owner | Fork Owner's Store |
| **ARCHIVED** | Deprecated or superseded by a newer version. | Read-Only | Cold Storage |

---

## 3. The "Personal" ACU (Level 5 Security)

One of the most critical ACU types is the **Personal Fact**.

### Definition
An ACU that contains sensitive, user-specific truth.
*   *Content:* "My name is Owen." / "My server IP is 10.0.0.1."
*   *Type:* `ACU_PERSONAL_FACT`.

### Special Behaviors
1.  **Auto-Redaction:** When sharing a parent Conversation (Level 1) or Topic (Level 2), any child Level 5 ACUs tagged as `PERSONAL` are **automatically redacted** or encrypted unless explicitly authorized.
2.  **The "Profile" Graph:** All Personal ACUs link back to the Level 0 Identity Node via `DEFINES_IDENTITY` edges. This creates a "User Profile" graph that the AI can query to "Remember" things about you.

---

## 4. Traversing the Graph (Examples)

### Scenario A: "Who is the user?"
*   **Query:** `MATCH (u:Identity)-[:DEFINES_IDENTITY]->(f:Fact)`
*   **Result:** A list of all birthday, name, preference ACUs.

### Scenario B: "How did we solve the bug?"
*   **Query:** `MATCH (topic:Topic {title: "SSL Error"})-[:HAS_PART]->(p:Proposition)`
*   **Result:** A distilled summary of the *solution steps* (Level 4), ignoring the "Hello" and "Thank you" messages (Level 3 fluff).

### Scenario C: "Show history of this code block"
*   **Query:** `MATCH (c:CodeSnippet)<-[:VERSION_OF*]-(original)`
*   **Result:** A lineage showing how User A wrote it, User B fixed a typo, and User A merged the fix.

---

## 5. Formal Rules for P2P Sharing

1.  **The Containment Rule:** Sharing a Level 1 ACU (Conversation) implies sharing all Level 3 and Level 4 children, *unless* they are explicitly excluded (e.g., Personal Facts).
2.  **The Integrity Rule:** You cannot modify a Level 4 ACU inside a Level 1 container without creating a *new version* of the Level 1 container (Merkle Root update).
3.  **The Tombstone Rule:** If a Personal ACU is deleted, it leaves a "Tombstone" ACU in the graph to prevent P2P sync from re-introducing the deleted fact.

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

# OpenScroll Text Types Registry
**Formal Definition of Content Primitives**

**Date:** January 29, 2026
**Context:** Atomic Chat Unit (ACU) Parsing & Rendering

---

## 1. Overview
This document formally defines the **Text Types** encountered in AI conversations. A "Type" defines the **semantic structure** and **data format** of a content block. It dictates how the parser detects the unit and how the UI renders it.

Unlike **Styles** (which modify appearance), **Types** fundamentally change the nature of the data.

---

## 2. Core Text Types

### 2.1 Prose (The Default)
*   **Definition:** Standard natural language text.
*   **Detection:** Any text content not matching other specific type patterns.
*   **Properties:** `language` (en, es, etc. - inferred).
*   **Example:** "The quick brown fox jumps over the lazy dog."

### 2.2 Code (Executable/Technical)
*   **Definition:** Source code, shell commands, or technical syntax intended for execution or precise display.
*   **Sub-Types:**
    *   **Inline Code:** Short snippets within prose. (e.g., `let x = 1;`)
    *   **Code Block:** Multi-line, fenced content.
*   **Properties:**
    *   `language`: Programming language identifier (rust, python, bash).
    *   `filename`: Optional file label (e.g., `main.rs`).
    *   `execution_result`: Optional output if the code was run by the provider.

### 2.3 Mathematics (LaTeX)
*   **Definition:** Mathematical notation rendered via KaTeX or MathJax.
*   **Sub-Types:**
    *   **Inline Math:** Embedded in line (e.g., $E = mc^2$).
    *   **Display Math:** Standalone block (e.g., $$ \sum_{i=0}^n i^2 $$).
*   **Format:** LaTeX syntax.

### 2.4 Structured Tables
*   **Definition:** Data arranged in rows and columns.
*   **Format:** Markdown Tables (pipes `|` and dashes `-`).
*   **Properties:** `headers` (list), `alignment` (left/center/right), `rows` (2D array).

### 2.5 Diagrams (Mermaid/Graphviz)
*   **Definition:** Text-based definitions rendered as visual graphs.
*   **Format:** Mermaid syntax (usually inside a code block tagged `mermaid`).
*   **Types:** Flowchart, Sequence, Gantt, Class, State, ER, Pie, Mindmap.

### 2.6 Emojis & Unicode
*   **Definition:** Pictographic symbols treated as semantic markers.
*   **Detection:** Unicode ranges (e.g., U+1F600).
*   **Usage:** Often used by AIs as structural bullets (e.g., "🚀 **Performance**").

### 2.7 Tool Calls / Functions
*   **Definition:** Structured blocks representing the AI invoking an external tool.
*   **Format:** Typically JSON or Python-like syntax specific to the provider.
*   **Properties:** `tool_name`, `arguments`, `status` (running/complete).

### 2.8 Tool Outputs / Results
*   **Definition:** The machine-readable response from a tool call.
*   **Format:** JSON, CSV, or raw logs.
*   **Context:** Linked to a specific Tool Call parent.

### 2.9 Citations / References
*   **Definition:** Markers indicating the source of information.
*   **Formats:**
    *   Standard: `[1]`, `[2]`.
    *   Provider Specific: `【4:0†source】` (ChatGPT search).
*   **Properties:** `source_id`, `url`, `title`.

### 2.10 URIs / Links
*   **Definition:** References to external resources.
*   **Sub-Types:**
    *   **Raw URL:** `https://example.com`
    *   **Hyperlink:** `[Label](URL)`
    *   **Auto-linked:** Email addresses, phone numbers.

### 2.11 Blockquotes / Callouts
*   **Definition:** Text referenced from another source or highlighted for attention.
*   **Sub-Types:**
    *   **Standard Quote:** `> Text`
    *   **Admonition/Callout:** `> [!WARNING] Text` (GitHub Flavored Markdown extension).
*   **Properties:** `type` (note, warning, tip, danger).

### 2.12 Lists (Structured Itemization)
*   **Definition:** Sequenced or non-sequenced collection of items.
*   **Sub-Types:**
    *   **Ordered:** `1.`, `a.`, `i.`
    *   **Unordered:** `-`, `*`, `+`
    *   **Task List:** `- [ ]`, `- [x]`

---

## 3. Parsing Strategy
The TreeSitter parser must be configured to identify these types as distinct nodes in the Abstract Syntax Tree (AST). Each type becomes a candidate for its own **Atomic Chat Unit (ACU)** or a distinct property within an ACU.

# OpenScroll Text Styles Registry
**Formal Definition of Presentation Modifiers**

**Date:** January 29, 2026
**Context:** Atomic Chat Unit (ACU) Parsing & Rendering

---

## 1. Overview
This document defines the **Text Styles** available within the OpenScroll ecosystem. While **Types** define *what* the data is, **Styles** define *how* it is emphasized or decorated.

Styles are typically applied **inline** to ranges of text within a Prose or List item ACU. They do not usually warrant creating a separate ACU, but are stored as metadata (spans) within the content.

---

## 2. Typographic Styles

### 2.1 Weight & Emphasis
*   **Bold / Strong:**
    *   *Markdown:* `**text**` or `__text__`
    *   *Semantics:* Heavy emphasis, key terms, UI elements.
*   **Italic / Emphasis:**
    *   *Markdown:* `*text*` or `_text_`
    *   *Semantics:* Variable names, book titles, foreign words, gentle emphasis.
*   **Bold Italic:**
    *   *Markdown:* `***text***` or `___text___`
    *   *Semantics:* Intense emphasis.

### 2.2 Decoration
*   **Strikethrough:**
    *   *Markdown:* `~~text~~`
    *   *Semantics:* Deleted information, corrections, sarcasm.
*   **Underline:**
    *   *Markdown:* Not standard (often `<u>` HTML).
    *   *Semantics:* Links (default), critical emphasis.
*   **Highlight / Mark:**
    *   *Markdown:* `==text==` (extended syntax).
    *   *Semantics:* Visual highlighting (yellow background).

### 2.3 Scripting
*   **Superscript:**
    *   *Markdown:* `^text^` (extended) or `<sup>` HTML.
    *   *Usage:* Footnotes `[1]`, mathematical powers `x^2`, ordinal numbers `1st`.
*   **Subscript:**
    *   *Markdown:* `~text~` (extended) or `<sub>` HTML.
    *   *Usage:* Chemical formulas `H2O`, mathematical indices `x_i`.

### 2.4 Monospace (Inline Code)
*   **Style:** `text` (backticks).
*   **Semantics:** Code literals, file paths, keystrokes, technical terms.
*   *Note:* While defined as a "Type" in the Types registry, it acts as a Style when used inline within a prose sentence.

---

## 3. Structural Styles (Block Level)

### 3.1 Headers (Hierarchy)
*   **Levels:** H1 (`#`) through H6 (`######`).
*   **Semantics:** Document structure, sectioning.
*   **ACU Implication:** Headers often trigger the start of a new semantic grouping.

### 3.2 Thematic Breaks
*   **Visual:** Horizontal Rule (`---`, `***`).
*   **Semantics:** Strong topic shift or section end.

### 3.3 Color (Provider Specific)
*   **Definition:** Text rendered in specific colors (e.g., Red for errors, Green for success).
*   **Source:** Often encoded via LaTeX `\textcolor{red}{...}` or HTML spans in rich captures.
*   **Handling:** Must be sanitized and mapped to theme-aware colors in the app (e.g., "Error Red" vs "Dark Mode Red").

---

## 4. Implementation Specification

### 4.1 Storage (The Span Model)
Instead of storing HTML/Markdown strings directly in the database (which makes search hard), we recommend a **Span-based** approach for complex styling, though Markdown text is the primary storage format.

**Markdown Storage (Simple):**
Store the raw markdown: `"This is **bold** text."`

**Span Object (Complex/Rich):**
```rust
struct StyledSpan {
    start: usize,
    end: usize,
    styles: Vec<StyleFlag>,
}

enum StyleFlag {
    Bold,
    Italic,
    Strike,
    Code,
    Color(HexCode),
}
```

### 4.2 Rendering Rules
*   **Normalization:** Convert provider-specific quirks (e.g., `\textbf{}` in LaTeX) to standard Markdown (`**`) during the Decomposition phase.
*   **Accessibility:** Ensure styles map to semantic HTML (e.g., `<strong>`, `<em>`) for screen readers.

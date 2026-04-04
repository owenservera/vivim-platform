# VIVIM ACU (Atomic Chat Units) System

## Overview

ACUs (Atomic Chat Units) are the fundamental building block of VIVIM - each conversation is broken into individually searchable, shareable units. This is VIVIM's key differentiator.

> **Analogy:**
> - **Messages** are like pages in a book
> - **ACUs** are the individual paragraphs, diagrams, and footnotes
> - **VIVIM** is the index that lets you remix these paragraphs into new books

---

## The Core Problem

**Traditional Approach**: Chat logs stored as Messages inside Threads
- Problem: Single AI message contains multiple distinct concepts
  - Code snippet
  - Explanation
  - Warning about edge cases
  - Suggested alternative library
- Consequence: Retrieval is blunt, sharing is coarse

**VIVIM Solution**: Atomic Chat Units (ACUs)
- Smallest semantically complete unit of information
- Can stand alone while maintaining links to origin
- Content-addressed, cryptographically signed, typed data structure

---

## ACU Data Structure

### Core Schema

```typescript
struct ACU {
    // Identity & Integrity
    id: Hash,                   // SHA-256(content + parent_hash) - Content Addressable
    signature: Signature,        // Ed25519 signature of the creator/miner
    
    // Provenance (The "Golden Thread")
    author_did: DID,            // Decentralized ID of creator (User or AI Agent)
    origin_message_id: Uuid,    // Link to raw log
    origin_conversation_id: Uuid,
    timestamp: u64,
    
    // The Payload (Immutable Core)
    content: ContentType,       // The actual text/code
    language: Option<String>,    // For code/markdown
    
    // Semantic Layer (Mutable Overlay)
    type: AcuType,             // Code, Fact, Reasoning, etc.
    embedding: Vector<f32>,     // 384-dim semantic vector (e.g. Phi-3/MiniLM)
    
    // Graph Connectivity
    links: Vec<Edge>,          // Outgoing links to other ACUs
}

enum ContentType {
    Text(String),
    CodeBlock { code: String, lang: String },
    Image { url: String, alt: String },
    StructuredData(Json),
}
```

---

## ACU Types Taxonomy

| Type | Description | Example |
|------|-------------|---------|
| **Statement** | General prose or fact | "React 19 introduces concurrent rendering." |
| **Question** | User intent or query | "How do I use useEffect properly?" |
| **Answer** | Direct response or solution | "Here's the proper useEffect pattern..." |
| **CodeSnippet** | Executable code block | `const [count, setCount] = useState(0);` |
| **Reasoning** | "Because X, therefore Y" | "Since the API is async, we need useEffect." |
| **Decision** | "We chose A over B" | "We chose Redux over Context for scale." |
| **Reference** | Citation or external link | "See React docs for useEffect cleanup." |

---

## ACU Lifecycle

### A. Birth (The "Miner")

The ACU is born when the **Parser Engine** processes a raw message:

1. **Normalization**: Markdown artifacts stripped
2. **Chunking**: TreeSitter heuristics break message into logical blocks
   - Separating code block from description
   - Splitting multi-paragraph explanations
3. **Hashing**: Content hashed to generate immutable ID
4. **Signing**: Cryptographic signature added

### B. Enrichment (The "Brain")

Once born, the ACU is processed by AI:

1. **Vectorization**: Generate embedding (e.g., `[0.12, -0.98, ...]`)
2. **Classification**: Tag with type and topics
   - "This is a **Python Code Snippet** related to **AsyncIO**"
3. **Entity Extraction**: Identify people, projects, technologies
4. **Relationship Analysis**: Determine connections to other ACUs

### C. Networking (The "Nervous System")

When shared via P2P:

1. **Verification**: Check signature against Author's DID
2. **Merging**: If edited, create child node or CRDT operation
3. **Propagation**: Sync across peers via CRDT

---

## Graph Semantics: How ACUs Connect

ACUs form a **Directed Acyclic Graph (DAG)**:

### Edge Types

| Edge Type | Symbol | Description | Example |
|-----------|--------|-------------|---------|
| **Sequential** | `NEXT` | Preserves linear reading order | ACU[1] → ACU[2] |
| **Hierarchical** | `CHILD_OF` | Code snippet belongs to explanation | code_ACU → explanation_ACU |
| **Semantic** | `RELATES_TO` | Created by vector similarity | react_hook_ACU ↔ vue_composable_ACU |
| **Citation** | `CITES` | Explicit reference | solution_ACU → documentation_ACU |
| **Follows** | `FOLLOWS_UP` | Builds on previous | refined_code_ACU → original_code_ACU |
| **Explains** | `EXPLAINS` | Detailed explanation | explanation_ACU → concept_ACU |
| **Contradicts** | `CONTRADICTS` | Opposing viewpoint | new_answer_ACU → outdated_answer_ACU |

---

## Why ACUs > Messages

### Comparison Table

| Feature | Messages | ACUs |
|---------|----------|------|
| **Granularity** | Entire conversation | Individual concepts |
| **Search** | Keyword only | Semantic + keyword |
| **Sharing** | Share entire thread | Share specific insight |
| **Reuse** | Copy-paste losing context | Links preserve origin |
| **Relationships** | Linear only | Graph connections |
| **Deduplication** | None | Automatic detection |
| **Attribution** | Thread-level | ACU-level |

### Use Cases Enabled

1. **Granular Access Control**
   - Share only "Solution" ACUs
   - Exclude "Sensitive Data" ACUs

2. **Collaborative Refinement**
   - User A shares "Draft Code" ACU
   - User B forks to "Optimized Code" ACU
   - Graph records both, links as `OPTIMIZES`

3. **Deduplication**
   - Same question asked twice
   - Answer ACUs might be identical
   - System detects via content hashing
   - Builds stronger weight for that fact

---

## ACU Operations

### Creation

```typescript
// From message to ACUs
const acus = await acuGenerator.extractFromMessage(message);

// Result: Array of ACU objects
// Each with content, type, embedding, links
```

### Search

```typescript
// Semantic search
const results = await acuService.search({
  query: "react hooks best practices",
  type: "CodeSnippet",
  limit: 10
});

// Hybrid search (semantic + keyword)
const hybridResults = await hybridRetrieval.search({
  query: "async await error handling",
  useSemantic: true,
  useKeyword: true
});
```

### Sharing

```typescript
// Share specific ACU
await acuService.share({
  acuId: "sha256:abc123...",
  recipients: ["user_did_1", "user_did_2"],
  permissions: ["read"] // or ["read", "fork"]
});

// Fork ACU (collaborative)
const forkedAcu = await acuService.fork({
  originalId: "sha256:abc123...",
  modifications: "optimized for production"
});
```

---

## ACU Database Schema

```sql
-- Core ACU table
CREATE TABLE acus (
    id              VARCHAR(64) PRIMARY KEY,  -- SHA-256 hash
    signature       TEXT NOT NULL,
    author_did      VARCHAR(64) NOT NULL,
    origin_message_id UUID,
    origin_conversation_id UUID,
    timestamp       BIGINT NOT NULL,
    content         TEXT NOT NULL,
    content_type    VARCHAR(20) NOT NULL,
    language        VARCHAR(20),
    acu_type        VARCHAR(20) NOT NULL,
    embedding       vector(384),  -- For semantic search
    
    -- Metadata
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ACU Relationships (edges)
CREATE TABLE acu_relationships (
    id              SERIAL PRIMARY KEY,
    source_acus_id  VARCHAR(64) REFERENCES acus(id),
    target_acus_id  VARCHAR(64) REFERENCES acus(id),
    relationship   VARCHAR(20) NOT NULL,  -- NEXT, CHILD_OF, RELATES_TO, etc.
    
    UNIQUE(source_acus_id, target_acus_id, relationship)
);

-- ACU Topics (many-to-many)
CREATE TABLE acu_topics (
    acu_id          VARCHAR(64) REFERENCES acus(id),
    topic           VARCHAR(100) NOT NULL,
    PRIMARY KEY (acu_id, topic)
);
```

---

## Deduplication Service

```typescript
// From acu-deduplication-service.ts
interface DeduplicationResult {
  originalAcuId: string;
  duplicateAcuId: string;
  similarity: number;  // 0-1
  action: "merge" | "link" | "ignore";
}

// Process:
// 1. Hash new ACU content
// 2. Check for existing hashes
// 3. If near-match: compare embeddings
// 4. If similarity > threshold: create link
// 5. Build stronger weight for fact
```

---

## Visual Elements for Landing Page

1. **ACU Decomposition Animation**: Show message breaking into ACUs
2. **Graph Visualization**: ACUs as nodes with edge types
3. **Type Icons**: Visual distinction for Code/Reasoning/Fact
4. **Search Demo**: Semantic search returning relevant ACUs
5. **Sharing Flow**: One-tap share with attribution

---

## Demo Scenarios

### Demo 1: "Find That Code"
User searches: "react useEffect cleanup"
- Returns: Individual CodeSnippet ACUs
- Not: Entire conversations containing the phrase

### Demo 2: "Share This Insight"
User shares: "That explanation of async/await"
- Shares: Single Reasoning ACU
- Preserves: Link to original conversation
- Includes: Author attribution

### Demo 3: "Build on Previous"
User: "Optimize that code"
- System: Forks CodeSnippet ACU
- Graph: Shows OPTIMIZES edge
- History: Preserves both versions

---

## Key Metrics

| Metric | Value |
|--------|-------|
| **Embedding Dimension** | 384 (Phi-3/MiniLM) |
| **Hash Algorithm** | SHA-256 |
| **Signature** | Ed25519 |
| **Content Addressable** | Yes (hash-based ID) |
| **Graph Edges** | 6 types (NEXT, CHILD_OF, RELATES_TO, CITES, FOLLOWS_UP, EXPLAINS) |
| **Deduplication Threshold** | ~95% similarity |

---

## Implementation Files

| File | Purpose |
|------|---------|
| `server/src/services/acu-generator.js` | Extract ACUs from messages |
| `server/src/services/acu-processor.js` | Process and enrich ACUs |
| `server/src/services/acu-deduplication-service.ts` | Deduplication logic |
| `server/src/routes/acus.js` | ACU API endpoints |
| `server/src/services/memory-conflict-detection.ts` | CRDT conflict resolution |
| `common/` | ACU type definitions |

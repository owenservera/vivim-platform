# VIVIM Cortex — CortexDB: Purpose-Built Database Architecture

> A memory-native database engine designed from first-principles
> for sovereign, multi-dimensional, temporally-aware AI memory systems.

---

## Table of Contents
1. [Why CortexDB](#1-why-cortexdb)
2. [Mathematical Foundations](#2-mathematical-foundations)
3. [Architecture](#3-architecture)
4. [Storage Engine](#4-storage-engine)
5. [Index Structures](#5-index-structures)
6. [Query Engine (CortexQL)](#6-query-engine-cortexql)
7. [Sovereign Partitioning](#7-sovereign-partitioning)
8. [Replication & Sync](#8-replication--sync)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Why CortexDB

### The Problem with Existing Databases

No existing database is built for the primary query pattern of a memory system:

> *"Given a user message, find the set of memories that maximizes total relevance WITHIN a token budget, considering semantic similarity, temporal decay, importance, access patterns, and relational connectivity — in < 100ms."*

This is a **constrained multi-objective optimization**, not a query. Every existing DB forces you to solve it in the application layer:

| Database | What It's Good At | What It Lacks for Memory |
|---|---|---|
| **PostgreSQL + pgvector** | Relational + vectors | No temporal decay, no budget-aware retrieval, no native compression tiers |
| **Pinecone / Weaviate** | Pure vector search | No relational context, no temporal awareness, no sovereignty |
| **Neo4j** | Graph traversal | No vector similarity, poor at aggregation, no budget optimization |
| **Redis** | Hot cache | No persistence hierarchy, no vector search, no graph |
| **SQLite** | Local-first | No vectors, no replication, no graph |
| **MongoDB** | Flexible schema | No vectors, poor at multi-dimensional queries |

**CortexDB** unifies all 6 dimensions into a single engine purpose-built for memory:

```
┌─────────────────────────────────────────────────────────┐
│              THE 6 DIMENSIONS OF MEMORY                 │
│                                                         │
│  1. SEMANTIC   — vector similarity (what it means)      │
│  2. TEMPORAL   — time decay (when it was relevant)      │
│  3. RELATIONAL — graph edges (how memories connect)     │
│  4. CATEGORICAL — taxonomy tree (what domain it's in)   │
│  5. IMPORTANCE  — scalar weight (how critical it is)    │
│  6. PROVENANCE  — chain of origin (where it came from)  │
│                                                         │
│  CortexDB indexes ALL 6 simultaneously.                │
│  Existing DBs handle at most 2.                        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Mathematical Foundations

### 2.1 The Ebbinghaus-Cortex Decay Function

Human memory follows a forgetting curve. AI memory should too — but with modifications for digital access patterns.

**Standard Ebbinghaus** (1885):
```
R(t) = e^(-t/S)
where R = retention, t = time, S = memory strength
```

**Cortex Decay** (modified power law with reinforcement):
```
φ(m, t) = φ₀ · (1 + t/τ)^(-α) · Π[ (1 + ρ · e^(-(t-tₖ)/σ)) ]

where:
  φ₀     = initial relevance (set at extraction time, 0.0–1.0)
  t      = time since memory creation (days)
  τ      = half-life constant (default: 30 days)
  α      = decay exponent (default: 0.3 — slower than exponential)
  tₖ     = timestamp of k-th access event
  ρ      = reinforcement amplitude (default: 0.4)
  σ      = reinforcement width (default: 7 days)
  Π[...] = product over all access reinforcement bumps
```

**Why power law, not exponential?**
Exponential decay (`e^(-t)`) falls too fast — a 6-month-old memory has essentially zero relevance. Power law (`t^(-α)`) has a long tail, matching how humans actually remember: old memories are weak but never truly gone. The `α = 0.3` exponent means a 1-year-old memory still retains ~40% of its initial relevance if never accessed.

**Reinforcement bumps**: Each time a memory is accessed (retrieved for context), it creates a Gaussian bump in the decay curve. This models the spacing effect — memories accessed repeatedly become more durable.

```
Relevance
   1.0 ├──╮
       │  │ ╭──╮        reinforcement       ╭─╮
   0.8 │  ╰─╯  ╰──╮     bump from          ─╯ ╰──╮
       │           ╰──╮   access                  ╰──╮
   0.6 │              ╰──╮                           ╰──
       │                 ╰───╮
   0.4 │  Power law decay    ╰───────╮
       │  (NOT exponential)          ╰──────────────────
   0.2 │                     Long tail — never reaches zero
       │
   0.0 └────────────────────────────────────────────────
       0    30    60    90    120   150   180   210 days
```

### 2.2 The Cortex Relevance Tensor

Instead of a single similarity score, CortexDB computes a **6-dimensional relevance tensor**:

```
R(q, m) = Σ wᵢ · fᵢ(q, m)

where:
  f₁(q, m) = cos(emb(q), emb(m))                    — Semantic similarity
  f₂(q, m) = φ(m, t_now)                             — Temporal relevance (decay)
  f₃(q, m) = 1 / (1 + d_graph(q_context, m))         — Graph proximity
  f₄(q, m) = |cats(q) ∩ cats(m)| / |cats(q) ∪ cats(m)| — Categorical Jaccard
  f₅(q, m) = m.importance                            — Importance weight
  f₆(q, m) = log(1 + m.accessCount) / log(1 + maxAccess) — Access frequency

  wᵢ = learned per-user weights (default: [0.35, 0.15, 0.10, 0.10, 0.20, 0.10])
```

**Adaptive weights**: The weights `wᵢ` are updated via simple online gradient descent after each context assembly. If a memory was retrieved and the user continued the conversation (positive signal), reinforce its dimension weights. If the user redirected (negative signal), decrease them.

```
w_update rule:
  After each assembly with memories {m₁...mₙ}:
    if user_continued(mᵢ):    wⱼ += η · fⱼ(q, mᵢ) for all j
    if user_redirected(mᵢ):   wⱼ -= η · fⱼ(q, mᵢ) for all j
    normalize: wⱼ = wⱼ / Σwⱼ

  η = learning rate (default: 0.01)
```

### 2.3 Token-Budgeted Retrieval (CortexKnapsack)

The core retrieval problem is a **bounded knapsack**:

```
maximize   Σ R(q, mᵢ) · xᵢ
subject to Σ tokens(mᵢ) · xᵢ ≤ B
           xᵢ ∈ {0, 1}
           i ∈ {1...N} (candidate memories)

where:
  B = token budget for memory layer
  R(q, mᵢ) = relevance tensor score
  tokens(mᵢ) = token count of memory content
```

**Approximate solution** (O(N log N), practical for 50K+ memories):
```
CortexKnapsack(candidates, budget):
  1. Compute R(q, m) for all candidates
  2. Compute efficiency: e(m) = R(q, m) / tokens(m)   ← relevance per token
  3. Sort by efficiency DESC
  4. Greedily select until budget exhausted
  5. If remaining budget > 0, try swapping smallest selected with largest unselected
  6. Return selected set with total relevance score
```

This outperforms naive "top-K by similarity" because it accounts for the fact that a short, highly relevant memory is more valuable than a long, moderately relevant one.

### 2.4 Consolidation Entropy

When should two memories be merged? Information theory gives us the answer:

```
Mergeability(m₁, m₂) = sim(m₁, m₂) · (1 - NormEntropy(m₁, m₂))

where:
  sim(m₁, m₂) = cosine similarity of embeddings
  NormEntropy(m₁, m₂) = H(m₁ ⊕ m₂) / max(H(m₁), H(m₂))
  H(m) = -Σ pᵢ · log₂(pᵢ)  (Shannon entropy over token distribution)
  m₁ ⊕ m₂ = concatenated content

Merge when:
  Mergeability(m₁, m₂) > 0.7
  AND sim(m₁, m₂) > 0.85
  AND neither is pinned
```

**Intuition**: High similarity + low normalized entropy means the memories are largely redundant. The merged version retains the information of both without doubling the storage.

### 2.5 Hyperbolic Embedding Space

Standard vector databases use Euclidean or cosine similarity. CortexDB uses **Poincaré Ball embeddings** for a fundamental advantage:

```
Hyperbolic space property:
  Volume grows EXPONENTIALLY with radius, vs polynomially in Euclidean.

  This means:
  - Hierarchical data (which memories ARE) embeds with lower distortion
  - 64-dim hyperbolic ≈ 1024-dim Euclidean for tree-like structures
  - 4x less storage for equivalent quality
```

**Poincaré distance**:
```
d_P(u, v) = arcosh(1 + 2 · ||u - v||² / ((1 - ||u||²)(1 - ||v||²)))

where u, v ∈ Bⁿ (Poincaré ball, ||x|| < 1)
```

**Why it matters for memory**: Memories naturally form hierarchies:
- `Identity > Preferences > Topic Knowledge > Episodic Events`
- `Project > Task > Subtask > Detail`

Hyperbolic space represents these hierarchies with near-zero distortion, while Euclidean space requires vastly more dimensions.

### 2.6 Temporal Bloom Filters

For fast "was this recently relevant?" pre-filtering:

```
Standard Bloom Filter: Set membership test, O(1), no false negatives
Temporal Bloom Filter: Set membership WITH TIME DECAY

Implementation:
  - Each bit position stores a timestamp instead of 0/1
  - A bit is "set" if timestamp > (now - window)
  - Bits naturally expire without explicit cleanup
  - Check: all k hash positions have timestamps within window

  insert(item, time):
    for each hash hᵢ(item):
      bits[hᵢ(item)] = time

  query(item, window):
    return ALL(bits[hᵢ(item)] > now - window for each hᵢ)
```

This enables O(1) pre-filtering of "has this memory been relevant in the last N days?" before running expensive vector search.

---

## 3. Architecture

### 3.1 Engine Layers

```
┌──────────────────────────────────────────────────────────────────┐
│  CORTEXQL API (Query Language)                                   │
│  RECALL, REMEMBER, CONSOLIDATE, FORGET, RELATE                  │
├──────────────────────────────────────────────────────────────────┤
│  QUERY PLANNER (CortexKnapsack Optimizer)                        │
│  Multi-dimensional relevance scoring → budget-aware retrieval    │
├──────────────────────────────────────────────────────────────────┤
│  INDEX LAYER                                                     │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐            │
│  │ VectorIdx │ │TemporalIdx│ │ GraphIdx │ │ TaxoIdx │           │
│  │ (HNSW +  │ │(B+Tree +  │ │(Adjacency│ │ (Trie)  │           │
│  │ Poincaré)│ │ TBloom)   │ │  + CSR)  │ │         │           │
│  └──────────┘ └───────────┘ └──────────┘ └─────────┘            │
├──────────────────────────────────────────────────────────────────┤
│  STORAGE ENGINE                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  T0 Page Cache  │  T1 WAL + LSM  │  T2 Columnar  │ T3  │    │
│  │  (mmap, hot)    │  (local SSD)   │  (compressed)  │IPFS │    │
│  └─────────────────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────────────────┤
│  SOVEREIGN PARTITION MANAGER                                     │
│  Per-DID merkle forest + encryption envelope + CRDT sync layer  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
WRITE PATH (REMEMBER):
  Message → Extraction Engine → Memory Object
    → Compute Poincaré embedding
    → Insert into VectorIdx (HNSW)
    → Insert into TemporalIdx (B+Tree by createdAt)
    → Insert into TaxoIdx (Trie by category)
    → Write to T0 Page Cache
    → Append to WAL (Write-Ahead Log)
    → Update Sovereign Merkle Tree leaf
    → Async: flush to T1 LSM tree

READ PATH (RECALL):
  Query → Tokenize + Embed query
    → Temporal Bloom Filter pre-check (O(1))
    → Multi-Index Fan-Out:
        VectorIdx:   top-100 by Poincaré distance
        TemporalIdx: filter by time window
        TaxoIdx:     filter by category/type
        GraphIdx:    expand by 1-hop relationships
    → Intersect + Relevance Tensor scoring
    → CortexKnapsack(candidates, tokenBudget)
    → Return memory set + metadata
```

---

## 4. Storage Engine

### 4.1 Page Format

CortexDB uses a fixed 16KB page format optimized for memory records:

```
┌─────────────────── 16 KB Page ───────────────────┐
│                                                   │
│  Page Header (128 bytes)                          │
│  ┌─────────────────────────────────────────────┐  │
│  │ pageId: u64                                 │  │
│  │ pageType: u8 (data/index/overflow/free)     │  │
│  │ ownerDid: [u8; 32] (sovereign partition)    │  │
│  │ recordCount: u16                            │  │
│  │ freeSpace: u16                              │  │
│  │ checksum: u32 (CRC32C)                      │  │
│  │ lsn: u64 (log sequence number)              │  │
│  │ compressionTier: u8 (T0/T1/T2/T3)          │  │
│  │ encryptionNonce: [u8; 12] (if encrypted)    │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  Slot Directory (variable, grows downward)        │
│  ┌────┬────┬────┬────┬─────────────────────────┐  │
│  │ S0 │ S1 │ S2 │ S3 │  ...                   │  │
│  │off │off │off │off │  (2 bytes each)          │  │
│  └────┴────┴────┴────┴─────────────────────────┘  │
│                                                   │
│  Free Space                                       │
│                                                   │
│  Records (variable, grow upward)                  │
│  ┌─────────────────────────────────────────────┐  │
│  │ Record 0: MemoryRecord                      │  │
│  │ Record 1: MemoryRecord                      │  │
│  │ ...                                         │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

### 4.2 Memory Record Format

```
MemoryRecord (variable size, avg ~800 bytes at T0)
┌────────────────────────────────────────────────────┐
│ Fixed Header (64 bytes)                            │
│   id:              [u8; 16]  (UUID)                │
│   memoryType:      u8                              │
│   importance:      f16       (half-precision)      │
│   relevance:       f16       (computed from φ)     │
│   confidence:      f16                             │
│   accessCount:     u16                             │
│   createdAt:       u48       (ms since epoch)      │
│   lastAccessedAt:  u48                             │
│   flags:           u16       (pinned|active|archived)│
│   contentLength:   u16                             │
│   embeddingSpec:   u8        (full|int8|binary|hash)│
│   tagCount:        u8                              │
│   relationCount:   u8                              │
│   compressionType: u8                              │
├────────────────────────────────────────────────────┤
│ Embedding (variable: 6144B full / 1536B int8 /     │
│            192B binary / 8B simhash)               │
├────────────────────────────────────────────────────┤
│ Content (variable, possibly compressed)            │
│   raw UTF-8 (T0) | LZ4 (T1) | zstd (T2) | brotli │
├────────────────────────────────────────────────────┤
│ Tags (variable: tagCount × varlen strings)         │
├────────────────────────────────────────────────────┤
│ Relations (variable: relationCount × 24B each)     │
│   [targetId: u128, relType: u8, strength: f16,     │
│    padding: u8]                                    │
└────────────────────────────────────────────────────┘
```

### 4.3 Tiered Storage Engine

```
┌──────────────────────────────────────────────────────────┐
│                    LSM-CORTEX ENGINE                      │
│                                                          │
│  T0: MemTable (in-memory skip list)                      │
│  ├── Sorted by (ownerDid, relevance DESC)                │
│  ├── Max size: 64 MB                                     │
│  ├── Full embeddings (float32)                           │
│  └── Flush → T1 when full                                │
│                                                          │
│  T1: WAL + L0 SSTable (local SSD)                        │
│  ├── Write-ahead log for durability                      │
│  ├── Sorted String Tables (size-tiered compaction)       │
│  ├── Int8 quantized embeddings                           │
│  ├── LZ4 content compression                            │
│  └── Compact → T2 when L0 count > 4                     │
│                                                          │
│  T2: Columnar Store (compressed, column-per-field)       │
│  ├── Columns: id | type | importance | embedding | ...   │
│  ├── Binary quantized embeddings                         │
│  ├── Zstd dictionary-compressed content                  │
│  ├── Run-length encoded categorical columns              │
│  └── Archive → T3 on demotion schedule                   │
│                                                          │
│  T3: Content-Addressed Archive (IPFS / Helia)            │
│  ├── Summary-only content (brotli)                       │
│  ├── SimHash embedding (8 bytes)                         │
│  ├── Immutable, content-addressed by CID                 │
│  └── Rehydrate → T2 on access                           │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Index Structures

### 5.1 VectorIdx: HNSW in Poincaré Space

```
Standard HNSW (Hierarchical Navigable Small World):
  - Graph-based approximate nearest neighbor
  - O(log N) search, O(N) space
  - State of the art for Euclidean/cosine

CortexDB Modification — Poincaré-HNSW:
  - Replace Euclidean distance with Poincaré distance
  - Edge selection uses hyperbolic midpoints (Möbius addition)
  - Layer assignment unchanged (geometric distribution)

  distance(u, v) = arcosh(1 + 2||u-v||²/((1-||u||²)(1-||v||²)))

  Benefits:
  - Hierarchical memories cluster naturally
  - 4x dimensionality reduction for tree-like data
  - Identity/Preference memories at center (near origin)
  - Episodic detail memories at periphery (near boundary)

  Parameters:
    M = 16 (max connections per node)
    efConstruction = 200
    efSearch = 100 (tunable per-query)
```

### 5.2 TemporalIdx: B+Tree with Decay Awareness

```
Standard B+Tree over (createdAt, ownerDid)

Augmented with:
  - Computed decay score at each leaf: φ(m, now)
  - Temporal Bloom Filter at each internal node
  - Range scan: "memories created between T1 and T2 with decay > threshold"

Temporal Bloom Filter per-node:
  - 1024-bit filter with k=7 hash functions
  - Each bit stores timestamp of last relevant insertion
  - Enables O(1) "any recently relevant memories in this subtree?" check
  - Zero maintenance: expired bits auto-ignored
```

### 5.3 GraphIdx: Compressed Sparse Row (CSR) Adjacency

```
Memory relationships stored as a CSR graph:

  offsets[]:  [0, 3, 5, 8, ...]  — start index per memory
  targets[]:  [m2, m5, m9, m1, m7, ...]  — related memory IDs
  types[]:    [similar, supports, contradicts, ...]
  weights[]:  [0.92, 0.78, 0.45, ...]

Operations:
  neighbors(m, depth=1):  O(degree)
  shortest_path(m1, m2):  O(V + E) BFS, cached
  cluster(m, threshold):  O(k · degree) connected component

Why CSR over adjacency matrix?
  - Memories graph is SPARSE (avg <= 5 edges per node)
  - CSR uses O(E + V) space vs O(V²) for matrix
  - Cache-friendly sequential access for neighbor traversal
```

### 5.4 TaxoIdx: Trie over Category Hierarchy

```
Category paths form a natural trie:

  root
  ├── technical/
  │   ├── languages/
  │   │   ├── typescript   ← 847 memories
  │   │   ├── python       ← 234 memories
  │   │   └── rust         ← 56 memories
  │   ├── tools/
  │   │   ├── git          ← 123 memories
  │   │   └── docker       ← 89 memories
  │   └── architecture/    ← 312 memories
  ├── personal/
  │   ├── preferences/     ← 67 memories
  │   └── goals/           ← 23 memories
  └── professional/
      ├── projects/        ← 456 memories
      └── relationships/   ← 189 memories

Operations:
  find("technical/languages/*"):  O(depth) trie traversal
  count("technical/**"):          O(subtree) via cached counters
  suggest(partial):               O(depth) prefix completion
```

---

## 6. Query Engine (CortexQL)

### 6.1 Core Operations

```sql
-- RECALL: The primary read operation (budget-aware retrieval)
RECALL FROM memories
  WHERE owner = 'did:key:z6Mk...'
  NEAR 'How do I refactor the auth middleware?'
  WITHIN 8000 TOKENS
  PREFER TYPE [PROCEDURAL, PROJECT, PREFERENCE]
  BOOST IMPORTANCE >= 0.8 BY 1.3
  DECAY HALFLIFE 30 DAYS
  DEPTH 1                    -- follow 1-hop relations
  LIMIT 20;

-- REMEMBER: Write a new memory
REMEMBER {
  content: 'User prefers Bun over Node.js for all TypeScript projects',
  type: PREFERENCE,
  importance: 0.85,
  category: 'technical/tools/runtime',
  tags: ['bun', 'nodejs', 'typescript', 'preference'],
  source: { provider: 'anthropic', model: 'claude-3.5-sonnet', conversationId: 'conv_abc' }
};

-- RELATE: Create edges between memories
RELATE mem_abc TO mem_def AS 'supports' WITH strength 0.87;

-- CONSOLIDATE: Merge similar memories (LLM-assisted)
CONSOLIDATE memories
  WHERE similarity > 0.85
  AND merged_entropy < 0.7
  USING MODEL 'gpt-4o-mini';

-- FORGET: Soft-delete (archive) or hard-delete
FORGET memories
  WHERE relevance < 0.1
  AND importance < 0.3
  AND NOT pinned
  ARCHIVE TO T3;         -- soft: move to archive tier
  -- OR: PERMANENTLY;    -- hard: GDPR right-to-erasure

-- INTROSPECT: Analytics queries
INTROSPECT memories
  GROUP BY type, category
  METRICS [count, avg_importance, avg_relevance, total_tokens]
  WHERE owner = 'did:key:z6Mk...';
```

### 6.2 CortexKnapsack Query Plan

When a `RECALL` query is executed:

```
RECALL QUERY PLAN:
━━━━━━━━━━━━━━━━━
  Phase 1 — Filter (< 5ms)
  ├── TemporalBloom pre-check: skip memories with zero recent relevance
  ├── TaxoIdx filter: restrict to PREFER TYPE categories
  └── Partition prune: only scan owner's sovereign partition

  Phase 2 — Candidates (< 30ms)
  ├── VectorIdx.search(query_embedding, efSearch=100) → 100 candidates
  ├── TemporalIdx.range_scan(now - 365d, now) → temporal filter
  ├── GraphIdx.expand(context_entities, depth=1) → relation expansion
  └── Union all → ~150-200 unique candidates

  Phase 3 — Score (< 15ms)
  ├── Compute R(q, m) for each candidate (6-dim tensor)
  ├── Apply BOOST multipliers
  ├── Apply DECAY function φ(m, t)
  └── Sort by R(q, m) DESC

  Phase 4 — Knapsack (< 5ms)
  ├── Compute efficiency: e(m) = R(q, m) / tokens(m)
  ├── Sort by efficiency DESC
  ├── Greedy fill until WITHIN budget exhausted
  └── Swap optimization pass

  Phase 5 — Return (< 2ms)
  ├── Decompress selected memories (from appropriate tier)
  ├── Update access statistics (async)
  └── Return result set + query plan metadata

  Total: < 60ms (target < 100ms with cold cache)
```

---

## 7. Sovereign Partitioning

### 7.1 Merkle Forest Architecture

Each user (DID) owns an independent Merkle tree. **The server never holds the complete tree of any user — only encrypted leaves and the tree structure.**

```
                    FOREST ROOT
                   (global integrity)
                  /        |         \
            ┌─────┐   ┌─────┐   ┌─────┐
            │DID_A│   │DID_B│   │DID_C│    ← Sovereign roots
            └──┬──┘   └──┬──┘   └──┬──┘
               │         │         │
          ┌────┴───┐  ┌──┴──┐  ┌──┴──┐
          │  USER  │  │ USER│  │ USER│
          │ MERKLE │  │MRKL │  │MRKL │    ← Independent trees
          │  TREE  │  │TREE │  │TREE │
          └────────┘  └─────┘  └─────┘

Each user tree:
           hash(L∪R)               ← User's tree root
          /         \
     hash(L∪R)    hash(L∪R)        ← Internal nodes
     /     \       /     \
   h(m₁) h(m₂) h(m₃)  h(m₄)      ← Leaf = hash of encrypted memory
```

**Properties**:
- **Tamper-evident**: Any modification changes the root hash
- **User-verifiable**: User can verify their data integrity without trusting the server
- **Privacy-preserving**: Forest root proves global integrity; individual trees are isolated
- **Efficient sync**: Merkle diff identifies changed memories in O(log N) comparisons

### 7.2 Partition Isolation

```typescript
interface SovereignPartition {
  // Identity
  ownerDid: string;
  partitionId: string;                 // hash(ownerDid)
  publicKey: Uint8Array;               // For encrypting partition data

  // Merkle tree
  merkleRoot: string;                  // Current root hash
  treeDepth: number;
  leafCount: number;

  // Storage quotas
  memoryCount: number;
  storageBytesUsed: number;
  storageBytesLimit: number;           // Per-tier limits

  // Encryption envelope
  partitionKey: Uint8Array;            // DEK for this partition (wrapped)
  keyVersion: number;
  rotatedAt: number;

  // Sync state
  lastSyncLSN: number;                // Log sequence number
  syncPeers: string[];                // DIDs of sync peers (devices)
}
```

### 7.3 Cross-Partition Queries (Enterprise)

In enterprise/team mode, an org can query across partitions — but only with delegated permission:

```
RECALL FROM memories
  WHERE org = 'org_acme'
  NEAR 'quarterly sales figures'
  WITHIN 4000 TOKENS
  PERMISSION CHAIN [
    org_admin → team_lead → member   -- delegation chain verified
  ];

Execution:
  1. Verify delegation chain signatures
  2. Fan-out to participant partitions (in parallel)
  3. Each partition decrypts + scores independently
  4. Merge results at org level
  5. Apply org-level policies (redaction, compliance)
  6. Return unified result set
```

---

## 8. Replication & Sync

### 8.1 CRDT-Native Design

CortexDB uses operation-based CRDTs for conflict-free replication:

```
Memory CRDT Operations:
  INSERT(memoryId, content, embedding, metadata)
    → LWW-Register (Last-Writer-Wins by wallclock + DID tiebreak)

  UPDATE(memoryId, field, newValue)
    → LWW-Register per field

  DELETE(memoryId)
    → Tombstone with causal timestamp

  RELATE(sourceId, targetId, type, strength)
    → OR-Set (Observed-Remove Set) for edge set

  UPDATE_SCORE(memoryId, newRelevance)
    → Max-Register (highest relevance wins — prevents decay conflicts)

  ACCESS(memoryId, timestamp)
    → G-Counter (monotonically increasing access count)
```

### 8.2 Sync Protocol

```
SYNC PROTOCOL (between user devices):

  Phase 1: Merkle Diff
    A sends: merkleRoot_A
    B checks: merkleRoot_A == merkleRoot_B?
    If equal: sync complete (no changes)
    If different: exchange subtree hashes to find diff leaves

  Phase 2: Operation Exchange
    A sends: operations since last common LSN
    B sends: operations since last common LSN
    Both apply CRDT merge rules (commutative, associative)

  Phase 3: Embedding Reconciliation
    If embedding model version differs:
      Mark memories as "embedding_stale"
      Queue for async re-embedding on both sides

  Phase 4: Verify
    Both compute new merkle roots
    Assert: merkleRoot_A' == merkleRoot_B'
    If not: flag conflict for manual resolution (should never happen with CRDTs)

  Bandwidth optimization:
    - Only send encrypted diffs, not full memories
    - Compress operations with delta encoding
    - Embedding sync uses quantized int8 (4x smaller)
```

---

## 9. Implementation Roadmap

### Phase 1: Core Engine (MVP — Weeks 1-10)

Build atop **Bun-native SQLite** as the initial storage backend, adding CortexDB primitives as an abstraction layer.

| Week | Deliverable | Details |
|---|---|---|
| 1-2 | Page format + record codec | Binary serialization of MemoryRecord |
| 3-4 | LSM-Cortex storage engine | MemTable + WAL + SSTable flush (using SQLite as L1 backend) |
| 5-6 | VectorIdx (HNSW) | In-memory HNSW with Euclidean (Poincaré in Phase 2) |
| 7-8 | CortexKnapsack query planner | Budget-aware retrieval, relevance tensor scoring |
| 9-10 | CortexQL parser + executor | Basic RECALL, REMEMBER, FORGET, INTROSPECT |

### Phase 2: Advanced Indexing (Weeks 10-18)

| Week | Deliverable |
|---|---|
| 10-12 | Poincaré embedding adapter + hyperbolic HNSW |
| 12-14 | Temporal Bloom Filters + B+Tree temporal index |
| 14-16 | CSR graph index + 1-hop expansion |
| 16-18 | Taxonomy trie + category-aware filtering |

### Phase 3: Sovereignty + Sync (Weeks 18-26)

| Week | Deliverable |
|---|---|
| 18-20 | Sovereign Merkle Forest per-DID |
| 20-22 | CRDT operation log + merge rules |
| 22-24 | Sync protocol (Merkle diff + op exchange) |
| 24-26 | Encryption envelope integration |

### Phase 4: Production Hardening (Weeks 26-32)

| Week | Deliverable |
|---|---|
| 26-28 | Compaction strategies (size-tiered → leveled) |
| 28-30 | Adaptive weight learning (online gradient descent) |
| 30-32 | Benchmarking suite + optimization (target: 50K recall < 60ms) |

---

*Document Version: 1.0 — March 2026*
*Codename: CortexDB*
*Part of: VIVIM Cortex Product Documentation*

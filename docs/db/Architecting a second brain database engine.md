> From: https://claude.ai/chat/4ecb98d5-bcad-4121-86d3-19aa213a2397

# you asked

How would you architect a new database engine designed to store and manage an individual's second brain

---

# claude response

# Second Brain Database Engine â€” Architecture

This is a non-trivial design problem because a second brain isn't just a knowledge store â€” it's a **temporal, associative, multi-modal, self-referential** system that needs to model *how humans actually think*, not how relational schemas are organized. Here's how I'd architect it from first principles.

---

## Core Design Axioms

Before any schema or engine choice, establish constraints that drive every decision:

1. **Thoughts are not rows.** A memory is a fuzzy, weighted, decaying artifact â€” not a typed record.
2. **Context is first-class.** When something was remembered, under what conditions, and how often it's been recalled â€” are part of the data.
3. **The graph is the primary index.** Relationships between concepts often matter more than the concepts themselves.
4. **Time is a dimension, not a column.** Every fact has a validity window, a creation timestamp, and a decay curve.
5. **The engine must be queryable in natural language.** Semantic proximity, not exact match, is the dominant retrieval paradigm.

---

## Storage Layer â€” Hybrid Multi-Model Architecture

A single storage paradigm fails here. You need a **polyglot core** with tight internal coupling:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   SECOND BRAIN ENGINE                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Graph Store â”‚  Vector Storeâ”‚  Blob Store  â”‚  Timeline  â”‚
â”‚  (concepts + â”‚  (embeddings â”‚  (raw artefactsâ”‚  Store    â”‚
â”‚   relations) â”‚  + semantic  â”‚  files, audio,â”‚  (event    â”‚
â”‚              â”‚  proximity)  â”‚  images)      â”‚  sourcing) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â”‚               â”‚              â”‚            â”‚
         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                          UNIFIED QUERY LAYER
```

### Graph Store â€” the Memory Fabric
- Every concept is a **node** with a type, salience score, and decay function
- Edges carry **relationship semantics** (caused, contradicts, supports, derives-from, co-occurred-with)
- Use a **property graph model** (not RDF) â€” RDF is too rigid for emergent personal ontologies
- Implementation: custom engine or extend something like Kuzu (embedded, columnar graph DB) for local-first sovereign deployments

### Vector Store â€” Semantic Retrieval
- Every node gets one or more **embedding vectors** (text, image, audio depending on modality)
- Vectors live in an **HNSW index** for approximate nearest neighbor at retrieval time
- Critical: store embeddings **per-model-version** with provenance â€” re-embed on model upgrade without losing history
- Implement a **contextual re-ranking layer** on top of raw ANN results using graph proximity as a signal

### Timeline Store â€” Event Sourcing
- Every mutation is an **immutable event** appended to a log (think: Kafka-style, but embedded)
- This gives you full temporal replay: "what did I know on March 3rd at 9am?"
- Memory decay is **computed, not stored** â€” the raw events persist; the effective salience is derived at query time using a decay function

### Blob Store â€” Raw Artifact Persistence
- Content-addressed storage (CAS) using Blake3 hashing
- Chunked deduplication â€” the same PDF referenced in 12 notes is stored once
- Local-first with optional encrypted sync layer (this is your data sovereignty story)

---

## Memory Model â€” The Core Abstraction

```typescript
interface MemoryNode {
  id: ULID                          // sortable, time-ordered
  type: 'concept' | 'event' | 'entity' | 'belief' | 'procedure' | 'episode'
  content: {
    raw: string | BlobRef           // original input
    normalized: string              // cleaned/structured form
    embeddings: EmbeddingSet[]      // versioned per model
  }
  salience: {
    base: float                     // initial importance (0-1)
    decay_fn: 'exponential' | 'power_law' | 'none'
    half_life_days?: number         // configurable per memory type
    recall_count: int               // boosts salience on access
    last_recalled: timestamp
  }
  provenance: {
    created_at: timestamp
    source: SourceRef               // app, conversation, import, manual
    context_snapshot: ContextRef    // what else was active at capture time
  }
  validity: {
    valid_from: timestamp
    valid_until: timestamp | null   // null = currently believed true
    superseded_by: NodeID | null
  }
}

interface MemoryEdge {
  from: NodeID
  to: NodeID
  relation: RelationType
  strength: float                   // weighted, learnable
  created_at: timestamp
  evidence: NodeID[]                // what memories justify this edge
}
```

---

## Query Engine â€” Three Query Modes

**1. Semantic Search** â€” "What do I know about distributed systems?"
- Embed query â†’ ANN search over vector index â†’ graph expansion â†’ re-rank by salience + recency

**2. Associative Traversal** â€” "What connects my notes on stoicism to my current project?"
- Start from anchor nodes â†’ graph BFS/DFS with edge weight filtering â†’ path scoring

**3. Temporal Recall** â€” "What was I thinking about last October?"
- Timeline query â†’ reconstruct memory state at timestamp â†’ filter by salience at that moment

All three modes unify under a single query DSL:

```
RECALL "distributed consensus"
  WHERE salience > 0.3
  AND valid_at = NOW()
  EXPAND relations(depth=2, types=[supports, contradicts])
  RANKED BY (salience * recency_weight)
  LIMIT 20
```

---

## Salience & Decay Engine

This is what differentiates a second brain from a note app:

- **Ebbinghaus-inspired decay**: `salience(t) = base Ã— e^(-Î»t)` where Î» is tuned per memory type
- **Recall spikes**: every access boosts salience by `+Î”s`, with Î”s diminishing on repeated recall (spacing effect)
- **Interference modeling**: contradicting beliefs suppress each other's salience
- A background **consolidation process** runs periodically (like sleep) â€” it strengthens high-salience clusters, prunes orphaned low-salience nodes, and surfaces dormant connections

---

## Capture Interface â€” Write Path

```
Raw Input (text/voice/image/URL/file)
    â†“
Ingestion Pipeline:
  1. Chunking & normalization
  2. Entity/concept extraction (NER + LLM)
  3. Embedding generation
  4. Relation inference (link to existing graph)
  5. Salience initialization
  6. Context tagging (time, location, app, session)
    â†“
Append to Event Log â†’ Materialize to Graph + Vector Index
```

The relation inference step is where an LLM does real work â€” it doesn't just store what you wrote, it **proposes edges** to existing memory nodes that you can accept, reject, or modify.

---

## Sovereignty & Runtime Considerations

Given your data sovereignty mandate for VIVIM, the engine should be:

- **Embedded-first**: runs in-process (like SQLite), no server required
- **Encrypted at rest**: AES-256 with user-controlled keys, key derivation from passphrase or hardware key
- **Export-portable**: full graph export to open formats (JSON-LD, Parquet, GraphML)
- **Sync via CRDT**: if multi-device sync is needed, use operation-based CRDTs on the event log â€” no central authority required
- **LLM-provider agnostic**: embeddings and inference calls route through an abstraction layer (your LiteLLM pattern maps directly here)

---

## Implementation Stack Recommendation

| Layer | Technology |
|---|---|
| Graph engine | Kuzu (embedded columnar) or custom on RocksDB |
| Vector index | usearch or hnswlib (embedded, no server) |
| Blob store | Custom CAS on local FS + optional S3-compatible sync |
| Event log | Redb or custom append-only log on mmap |
| Query layer | Rust core with TypeScript/WASM bindings |
| Embedding | Provider-agnostic via your LiteLLM router |
| Encryption | age (modern, simple) for file-level; AES-GCM for block-level |

---

## The Thesis

The key architectural insight is: **most "second brain" tools are glorified tagged note apps**. The engine described above models memory as a *living, weighted, temporal graph* that degrades, reinforces, and reorganizes itself â€” closer to how biological memory actually works. That's the moat. Everything else is just a retrieval UI on top of a search index.

This maps directly onto what VIVIM is positioning as sovereign AI memory infrastructure â€” the engine layer is the piece that needs to exist before any agent interface makes sense.

---

# you asked

research the latest math and algos and cite

---

# claude response

Here's a deep research synthesis across the five algorithmic pillars that matter for the second brain engine architecture, with citations to the current frontier.

---

## 1. The RAG Problem â€” Why Vector-Only Fails

The foundational critique you need to internalize: vector databases solved semantic similarity retrieval but have no native understanding of sequence or causality â€” they cannot understand that a statement on Friday ("I've switched to Rust") invalidates a preference from Monday ("I prefer Python"), leading to confused and contradictory responses.

This is the architectural gap VIVIM's memory layer needs to close. The field has arrived at the same conclusion: RAG is a passive retrieval tool â€” it can solve the problem of not knowing, but it cannot solve the core problem of not remembering. True AI memory must replicate the working logic of the human brain, being able to remember in the short term, having common sense in the long term, and making judgments with emotional understanding.

The cognitive neuroscience framing from a December 2025 survey nails the storage model: in cognitive neuroscience, short-term memory relies on distributed sensory-frontoparietal networks while long-term memory depends on hippocampal-neocortical coordination. For agents, storage locations include the context window for temporary memory and external memory banks for persistent information.

---

## 2. HNSW â€” The ANN Index Layer, and Where It's Breaking

HNSW remains the dominant approximate nearest neighbor algorithm. HNSW incrementally builds a multi-layer structure consisting of a hierarchical set of proximity graphs for nested subsets of stored elements. The maximum layer an element is present in is selected randomly with an exponentially decaying probability distribution, allowing logarithmic complexity scaling.

The key engineering tradeoff: higher values of `max-links-per-node` and `neighbors-to-explore-at-insert` improve graph quality and recall accuracy but reduce indexing throughput and increase memory usage. Changing from float to bfloat16 can halve memory cost with negligible accuracy impact, while single-bit values greatly reduce both memory and CPU costs.

The critical open problem for a *live* second brain is **mutable indexing**. A July 2024 paper on HNSW under real-time updates found that HNSW performance becomes unacceptable when faced with a large number of real-time deletions, insertions, and updates â€” and during update operations, HNSW can result in some data points becoming unreachable, significantly affecting search accuracy. Their proposed MN-RU algorithm addresses this with faster delete/insert operations while reducing the unreachable-points problem.

A July 2025 paper introduced **SHG (Shortcut-enabled Hierarchical Graph)**, which adds learned level-skipping to HNSW: searching upper levels accounts for 18â€“42% of total search time in HNSW. SHG introduces shortcuts that skip unnecessary level navigations and uses compressed vectors for approximate distance computation through fewer dimension scans. This is directly relevant â€” a second brain's index is written to continuously and must stay fast on reads.

---

## 3. MemOS â€” The Memory-as-OS Paradigm (Closest to What You're Building)

The most architecturally significant paper of 2025 for this problem is MemOS (arXiv:2507.03724, July 2025). MemOS establishes a memory-centric system framework that brings controllability, plasticity, and evolvability to LLMs, laying the foundation for continual learning and personalized modeling.

The core abstraction is **MemCube**: MemOS introduces MemCube, a unified abstraction that encapsulates plaintext, activation, and parameter memories under a standardized scheduling and orchestration framework â€” building unified mechanisms for representation, organization, and governance across three core memory types.

The architecture is a clean three-layer model: MemOS adopts a three-layer architecture consisting of a memory API layer, a memory scheduling and management layer, and a memory storage and infrastructure layer. It proposes a novel Next-Scene Prediction mechanism that proactively preloads relevant memory fragments during inference, significantly reducing latency and token consumption.

Critically, it treats memory as a *governable lifecycle resource*: user preference memories can be scoped to specific agent instances and automatically expire or archive after task completion. MemOS supports memory restructuring and migration across tasks and roles â€” providing memory slicing, tagging, hierarchical mapping, and context binding capabilities.

A parallel system from EMNLP 2025, MemoryOS (arXiv:2506.06326), implements the three-tier STM â†’ MTM â†’ LPM (Long-term Persona Memory) stack with heat score decay â€” where interaction count resets to zero on each new dialogue, causing the heat score of a segment to decline â€” and a FIFO queue of size 100 for User KB and Agent Traits. That heat score model is a simple but deployable analog of the salience decay function described in the original architecture.

---

## 4. GraphRAG â€” The Hybrid Retrieval Frontier

The field has moved firmly toward graph+vector hybrid retrieval as the production standard. While vector databases dominated RAG implementations in 2023â€“2024, 2025 marks the emergence of GraphRAG as the leading approach for complex knowledge-intensive tasks, with implementations achieving 85%+ accuracy compared to 70% for traditional vector-only systems.

The key mechanism is **Reciprocal Rank Fusion (RRF)** for merging graph traversal and vector similarity scores. A December 2025 paper from CIKM 2025 formalized this: a hybrid retrieval strategy fusing vector similarity with graph traversal using RRF, maintaining separate embeddings for entities, chunks, and relations to enable multi-granular matching, demonstrated improvements of up to 15% over vanilla vector retrieval baselines.

The dual-store implementation pattern is now standard: during indexing, the knowledge graph is stored in both Vector DB and Graph DB â€” Milvus stores nodes, chunks, and relation embeddings for fast similarity lookup at query time, while iGraph stores nodes and edges for fast traversal.

The explainability argument for a sovereign second brain is strong: baseline RAG makes it difficult to trace why a chunk was retrieved, while GraphRAG offers traceable paths and nodes that support each answer â€” enabling relational reasoning across connected facts and summaries.

---

## 5. Memory Decay â€” The Math You Need to Get Right

This is the layer that separates a genuine second brain from an indexed note app. The state-of-the-art algorithm lineage is:

**SM2 â†’ HLR â†’ FSRS â†’ FSRS-6**

The SuperMemo 2 algorithm introduced ease factors and adaptive interval calculation, while Half-Life Regression advanced the field through probabilistic modeling of memory decay. Recent algorithms like FSRS and SSP-MMC represent the current state of the art â€” SSP-MMC combines reinforcement learning with cognitive modeling principles, employing sparse sampling techniques for efficient policy exploration.

The most implementable current system is **FSRS-6**, which appears in the Vestige memory engine (a Rust MCP server for AI agents): FSRS-6 governs the mathematics of forgetting with 21 parameters â€” frequently-used memories stay strong, unused memories naturally decay, and every memory has storage strength (encoding quality) and retrieval strength (accessibility). The system also implements Synaptic Tagging (a memory that seemed trivial can be retroactively tagged as critical) and Spreading Activation (search for "auth bug" and find the related JWT library update â€” memories form a graph, not a flat list).

The neuroscience behind why this works: spaced repetition arranges reviews at critical points of memory decay â€” moments when forgetting is imminent but has not yet fully occurred â€” compelling appropriate retrieval effort and maximizing the memory reinforcement effect. Each retrieval following an interval strengthens the neural traces of the memory, effectively slowing the rate of forgetting.

A June 2025 paper validated this pattern in neural networks directly: experiments with Multi-Layer Perceptrons reveal human-like forgetting curves, with knowledge becoming increasingly robust through scheduled reviews â€” each review immediately restoring recall to its pre-review level, with intervals between reviews lengthening progressively from 4 epochs before the first review to 31 before the fourth.

The newest frontier is **semantic interference modeling** in decay scheduling. The LECTOR algorithm (2025) adds a semantic interference matrix on top of FSRS: the memory half-life `h(t)` is modulated by concept difficulty `d`, repetition count `Ï`, mastery level `Âµ`, and semantic interference `Ïƒ` â€” where a pairwise semantic relationship matrix captures potentially confusing concept pairs to modulate review scheduling. This maps directly onto the edge-suppression mechanic described in the original architecture (contradicting beliefs suppressing each other's salience).

---

## Synthesis â€” What to Pull Into VIVIM's Engine

| Problem | Algorithm | Source |
|---|---|---|
| ANN retrieval | HNSW with SHG shortcuts + bfloat16 quantization | arXiv 2025 |
| Live index mutations | MN-RU update algorithm over base HNSW | arXiv:2407.07871 |
| Memory abstraction | MemCube from MemOS (plaintext + activation + param) | arXiv:2507.03724 |
| Hybrid retrieval | RRF fusion of graph traversal + vector similarity | CIKM 2025 |
| Salience decay | FSRS-6 with dual-strength model (storage + retrieval) | Vestige / FSRS |
| Interference decay | Semantic interference matrix `Ïƒ` from LECTOR | arXiv:2508.03275 |
| Memory promotion | Heat score + STMâ†’MTMâ†’LPM pipeline | arXiv:2506.06326 |

The architectural bet this research validates: **memory needs an OS, not a database.** The MemOS team and the MemoryOS team both independently converged on the same layered governance model in 2025. That's your moat signal â€” the engine layer is the hardest part to get right and the fewest teams are building it at the infrastructure level rather than the application level.

---

# you asked

what are they missing that ours does not

---

# claude response

Good question â€” and worth being precise rather than just competitive. Here's an honest gap analysis, structured by what the research explicitly lacks versus what the architecture specifies.

---

## 1. Belief Supersession â€” None of Them Model Invalidation

Every system reviewed â€” MemOS, MemoryOS, GraphRAG, FSRS-6 â€” treats memory as **additive**. New memories are inserted. Old ones decay. But none of them model the semantically distinct operation of a memory being **proven wrong**.

The architecture has an explicit `validity` block:

```typescript
validity: {
  valid_from: timestamp
  valid_until: timestamp | null
  superseded_by: NodeID | null  // â† this is the gap
}
```

MemOS's MemCube has no supersession pointer. MemoryOS's heat score just lets contradictions coexist at different salience levels. FSRS-6 has no concept of a belief being *falsified* â€” only forgotten. The second brain built on any of these systems will confidently surface stale beliefs that have been contextually overwritten, because there's no invalidation arc in the graph.

The LECTOR interference matrix gets closest â€” it suppresses *confusable* concepts â€” but suppression is not the same as supersession. A superseded belief should be queryable as historical truth ("what did I believe before?") while being excluded from present-state queries. That requires a directed temporal edge, not a salience dampener.

---

## 2. Context Snapshot at Capture â€” None of Them Ask "Under What Conditions?"

Every paper models *what* was remembered and *when*. None model the **cognitive context active at the moment of capture**.

The architecture's provenance block includes:

```typescript
provenance: {
  source: SourceRef
  context_snapshot: ContextRef  // â† what else was active at capture time
}
```

This matters because memory is context-dependent. A belief formed while reading about a failed startup is epistemically different from the same belief formed during a sales call. Retrieval that ignores capture context will surface memories without knowing whether they were formed in a state of high vs. low confidence, under time pressure, or in the presence of conflicting signals.

MemoryOS stores dialogue segments. MemOS stores plaintext, activations, parameters. Neither stores the surrounding epistemic state â€” what other concepts were active, what task was in progress, what the emotional or attentional context was. That's a structural gap that makes their retrieval context-blind.

---

## 3. Evidence-Backed Edges â€” Relations Have No Justification

In both GraphRAG and MemOS, edges in the knowledge graph are either LLM-inferred or manually asserted, but they carry no **evidence provenance**. You cannot query *why* two concepts are connected.

The architecture specifies:

```typescript
interface MemoryEdge {
  relation: RelationType
  strength: float
  evidence: NodeID[]  // â† what memories justify this edge
}
```

This is critical for a second brain specifically because personal knowledge graphs are full of *wrong* inferences. If the engine can't surface the evidence trail for an edge, the user can't audit, challenge, or correct it. More importantly, when an evidence node decays or is superseded, the edges it supports should weaken automatically â€” a cascade that none of the current systems implement.

MemOS's MemCube governance handles memory lifecycle, but not edge lifecycle as a function of evidence lifecycle. That's a first-class architectural gap.

---

## 4. Human-in-the-Loop Relation Proposal â€” They Automate What Should Be Negotiated

MemOS and GraphRAG both use LLMs to infer relations and insert them as ground truth. The architecture proposes a different contract: the LLM **proposes** edges, and the user **accepts, rejects, or modifies** them before they're materialized.

This is not just a UX nicety â€” it's an epistemological necessity. An LLM inferring that two of your notes are related will be wrong in ways that are subtle and compounding. If those edges are written as ground truth, they silently corrupt the graph over time. Every future traversal that crosses a wrong edge inherits the error.

None of the surveyed systems implement a proposal/commit distinction in the write path. They all write inferences as facts. The architecture makes inference a **draft state** â€” a separate graph layer that requires promotion, not automatic materialization. That's a meaningful epistemological firewall.

---

## 5. Consolidation as a First-Class Process â€” Sleep Is Not a Metaphor

The architecture specifies a background **consolidation process** that:
- Strengthens high-salience clusters
- Prunes orphaned low-salience nodes
- Surfaces dormant connections

MemoryOS has heat score decay running passively. MemOS has memory governance for lifecycle management. Neither has a **proactive restructuring pass** that reorganizes the graph based on accumulated salience patterns â€” an analog to memory consolidation during sleep, where the hippocampus replays and integrates experiences into long-term cortical structure.

The research gap here is significant. FSRS-6 is a scheduling algorithm â€” it tells you *when to review*, not *how to restructure*. No current system models graph topology changes as an output of the consolidation pass (merging near-duplicate nodes, promoting frequently co-activated concept clusters into first-class entities, deprecating edges whose evidence has decayed below threshold). That's a distinct and unbuilt system.

---

## 6. Sovereign Embedded Runtime â€” All of Them Require a Server

This is the deployment gap, not an algorithmic one, but it's structurally fundamental:

- **MemOS** is designed as an LLM infrastructure layer â€” it presupposes server-side model access
- **MemoryOS** is an agent memory server â€” it has a service boundary
- **GraphRAG** implementations (Microsoft's reference architecture, LlamaIndex, LangChain) all assume cloud vector stores and LLM API calls
- **FSRS/Vestige** is the closest â€” a Rust MCP server, local-first â€” but it's a spaced repetition scheduler, not a full memory engine

None of them are designed as an **embedded library** that runs in-process, encrypted at rest, with no network dependency for core operation, syncing via CRDT without a central authority. The entire field is building memory as a cloud service. The architecture is building memory as a *runtime* â€” closer to SQLite's deployment model than Postgres's.

For VIVIM's data sovereignty positioning, this isn't a feature â€” it's the thesis. You cannot have sovereign AI memory that phones home.

---

## Summary Table

| Gap | MemOS | MemoryOS | GraphRAG | FSRS-6 | This Architecture |
|---|---|---|---|---|---|
| Belief supersession (invalidation arcs) | âœ— | âœ— | âœ— | âœ— | âœ“ |
| Context snapshot at capture | âœ— | âœ— | âœ— | âœ— | âœ“ |
| Evidence-backed edges | âœ— | âœ— | âœ— | n/a | âœ“ |
| Proposal/commit write path | âœ— | âœ— | âœ— | âœ— | âœ“ |
| Active graph consolidation pass | âœ— | Partial | âœ— | âœ— | âœ“ |
| Embedded sovereign runtime | âœ— | âœ— | âœ— | Partial | âœ“ |

---

The honest summary: **the research optimizes for retrieval quality; the architecture optimizes for epistemic integrity.** That's the real gap. Every system reviewed is trying to surface the most relevant memory. None of them are trying to maintain a *trustworthy*, *auditable*, *self-correcting* model of what a person actually believes and why â€” with the full provenance chain intact. That's a different product category dressed in the same retrieval language.

---

# you asked

assuming we will at some point have the full solution - and given that vivim will give users a full toolkit to acquire, store and manage their information that at some point will become the foundaion to their second brain - design our future proof system that pre-empts the future requriements today - from data acquisition to cold storage to full active retrival

---

# claude response

Here's the full written specification to go with the interactive map.

---

## Design axioms that drive every layer decision

**Everything is an event.** The system never mutates state directly â€” it appends events to a log and derives state from it. This gives you temporal replay, CRDT compatibility, and auditability for free. The log is the source of truth; the graph, vector index, and storage tiers are all materialized views over it.

**The LLM is a proposer, never a committer.** Inference touches exactly one stage â€” relation proposal â€” and its output is always draft. The user is the only entity that can write a committed edge to the graph. This is the epistemic firewall that separates VIVIM from every other system in the space.

**Salience is computed, not stored.** Raw events persist immutably. FSRS-6 retrieval strength, recency, and decay are derived at query time from the event log. This means you can change the decay model retroactively and recompute without corrupting historical data.

---

## The data contract between layers

Every layer boundary has exactly one typed contract. These contracts are the stability guarantee â€” swap the implementation underneath without touching the interface above.

```
CaptureEvent       â† produced by Acquisition
      â†“
MemoryCandidate    â† produced by Ingestion (staged, not yet materialized)
      â†“
MemoryNode         â† materialized by Memory Engine (after user confirms proposals)
      â†“
ResultSet          â† produced by Retrieval (ranked, with provenance chains)
```

`MemoryCandidate` is the key insight â€” it's the staging contract between ingestion and the engine. Nothing in the candidate is ground truth. Dedup hits are suggestions. Proposals are drafts. Classification is a probability. The engine materializes a `MemoryNode` from a candidate only after the user has reviewed the proposals that warrant review.

---

## Storage tier promotion and demotion rules

The tier transitions are the most operationally sensitive part of the system. Getting this wrong means either performance degradation (too much in L1) or latency spikes on recall (too aggressively cold-storing active memories).

**Promotion (upward) â€” triggered on access:**
- Any access to L2, L3, or L4 triggers a retrieval strength spike per FSRS-6 (`+Î”s` where `Î”s` decreases with repeated recall â€” spacing effect)
- If post-spike retrieval strength exceeds the tier's upper threshold, the node is promoted synchronously before the result is returned
- Hot (L1) accepts only nodes with retrieval strength above 0.8 that have been accessed more than once in the current session

**Demotion (downward) â€” triggered on decay:**
- Nightly consolidation daemon runs FSRS-6 decay across all Warm tier nodes
- Nodes where `retrieval_strength < 0.2` are moved to Cold asynchronously
- Nodes in Cold where `age > 180d AND access_count_90d < 3` are moved to Frozen asynchronously
- Demotion never loses data â€” every tier preserves the full `MemoryNode` schema

**The critical demotion guard:** a node is never demoted if it has pending unreviewed proposals in the Proposal Registry, or if it's referenced as evidence by a Live graph edge. Evidence nodes are pinned to Warm until all dependent edges are resolved.

---

## Cross-cutting concerns

### Embedding versioning

Every embedding is stored with its model identifier and model version as part of the key:

```
embeddings/{node_id}/{model_id}/{model_version} â†’ float32[]
```

When you upgrade the embedding model (inevitable), you re-embed in the background and mark the old version as `deprecated`. Retrieval falls back to deprecated embeddings until the new version is ready. No downtime, no index corruption.

### Sovereignty guarantees at every layer

The runtime contract: the engine must function with no network access at all. Every component has a local-only fallback:
- Embedding: runs against a bundled local model (Nomic Embed or equivalent) when no API is configured
- LLM relation proposal: disabled gracefully when no LLM API is available â€” the Proposal Registry simply stays empty
- Sync: optional; the system is fully functional as a single-device instance
- Encryption: AES-256-GCM at the block level with user-controlled key derivation (Argon2id from passphrase, or hardware key via platform keychain)

### Schema evolution

The event log is the critical long-term asset â€” users may run this system for decades. The log uses a versioned envelope:

```typescript
interface LogEvent {
  schema_version: int        // bumped on breaking changes
  event_type:     string
  payload:        bytes      // protobuf-encoded, versioned schema
  recorded_at:    timestamp
}
```

Every schema version has a migration function registered in the engine. On startup, the engine detects any events below the current schema version and runs migrations forward. Old events are never rewritten â€” migrations produce new derived events that shadow the old ones.

### The Agent API as a day-one citizen

Every retrieval mode is exposed as an MCP tool from the beginning. The schema:

```json
{
  "name": "vivim_recall",
  "description": "Retrieve memories from the user's second brain",
  "input_schema": {
    "query":       { "type": "string" },
    "mode":        { "enum": ["semantic", "associative", "temporal"] },
    "depth":       { "type": "integer", "default": 2 },
    "valid_at":    { "type": "string", "format": "date-time" },
    "limit":       { "type": "integer", "default": 20 }
  }
}
```

VIVIM's own canvas agents use this same API â€” there is no internal shortcut. This ensures the external API is production-grade from the start and that VIVIM's own features dogfood the sovereignty guarantees.

---

## Build sequence mapped to VIVIM's current state

| Phase | Components | Output |
|---|---|---|
| **Now** | L2 Warm store (Kuzu + usearch), basic ingestion (normalize â†’ embed â†’ classify), semantic search, MCP Agent API | Working memory layer agents can query |
| **Soon** | Entity extract, deduplicate, salience engine, L1 Hot + L3 Cold, NL query layer | Salience-aware retrieval with decay |
| **Later** | Relation proposal + Proposal Registry UI, consolidation daemon, temporal recall, L4 Frozen + CRDT sync | Full second brain with epistemic integrity |
| **Future** | Screen OCR, ambient capture, multi-modal embeddings, semantic interference matrix | Complete sovereign second brain |

The architectural bet: build the contracts now, fill the implementations incrementally. A user who starts with Phase 1 ends up with the full Phase 4 system on their existing data â€” because every event was appended to the immutable log from day one, and the derived views (graph, vectors, salience scores) can be retroactively materialized at any phase.


# Sovereign Memory v2.0: The Living Archive

---

## Vision Statement

Sovereign Memory v2.0 is not a database with intelligence bolted on. It is a **cognitive substrate** — a living, evolving, self-organizing system that mirrors the architecture of biological memory while transcending its limitations. It is the user's **externalized mind**: a system that doesn't just store what you knew, but understands *how* you think, *why* you remember, and *what you'll need next*. It remembers like you do — imperfectly, contextually, emotionally — but it never truly forgets unless you command it to.

Where v1.0 asked "how do we store and retrieve memories securely?", v2.0 asks a fundamentally different question: **"What would it mean for a person to have a second brain that is truly theirs — that grows with them, thinks alongside them, survives after them, and can never be taken from them?"** The answer requires not just better engineering, but a new theory of what digital memory is. We propose a system built on three pillars: **neuromorphic memory organization** (memories that self-organize, consolidate, and dream), **temporal sovereignty** (memory that exists meaningfully across all timescales from milliseconds to centuries), and **composable cognition** (memory that can be lensed, forked, merged, computed upon, and shared without ever leaving the user's sovereign control). The result is a system that feels less like a tool and more like a cognitive partner — one that is constitutionally incapable of betraying your trust.

---

## Core Innovations

### 1. The Engram Model — Neuromorphic Memory Primitives

Replace flat memory records with **engrams**: multi-dimensional memory primitives that model not just *content* but *context*, *affect*, *certainty*, *connectivity*, and *temporal dynamics*. Each engram is a small computational object with:

- **Content layer**: The actual information (multimodal: text, audio, image, code, spatial)
- **Affective layer**: Emotional valence and arousal at encoding time (user-annotated or inferred)
- **Epistemic layer**: Confidence, source reliability, contradictions with other engrams
- **Relational layer**: Typed edges to other engrams (causal, temporal, associative, contradictory, hierarchical)
- **Temporal dynamics**: Encoding time, access history, predicted future utility, decay curve, reinforcement events
- **Provenance chain**: Cryptographic lineage from raw capture → extraction → consolidation → mutation

An engram is not a row in a database. It is a **content-addressed, self-describing, cryptographically signed, temporally aware knowledge atom** that can be independently verified, selectively shared, and computed upon.

### 2. The Dreaming Engine — Consolidation as Computation

Biological memory consolidates during sleep — replaying experiences, strengthening important connections, pruning noise, and creating novel associations. Sovereign Memory v2.0 introduces a **Dreaming Engine**: an asynchronous, user-scheduled consolidation process that:

- **Replays** the day's engrams through the full memory graph, discovering latent connections
- **Compresses** redundant or similar engrams into higher-level abstractions (episodic → semantic promotion)
- **Detects contradictions** between new information and existing beliefs
- **Generates counterfactuals**: "Given what you learned today, your decision on [X] might have been different"
- **Proposes new connections** that the user can accept, reject, or modify
- **Produces a Dream Report**: a structured summary of consolidation activities, discoverable insights, and proposed memory mutations

The Dreaming Engine runs locally, is fully auditable, and **never modifies memory without explicit or pre-authorized consent**. Users configure a "dreaming policy" — from fully manual (approve every change) to supervised autonomous (auto-consolidate within parameters, flag exceptions).

### 3. Cognitive Lensing — Ontological Polymorphism

The same set of engrams can be viewed through different **lenses** — ontological frameworks that reorganize, filter, and reinterpret memory:

- **Professional Lens**: View memories organized by projects, skills, deliverables
- **Relational Lens**: Organize around people, interactions, social dynamics
- **Temporal Lens**: Pure chronological or reverse-chronological narrative
- **Causal Lens**: Show only memories connected by cause-and-effect chains
- **Emotional Lens**: Organize by feeling — "show me everything that felt like breakthrough"
- **Epistemic Lens**: Organize by certainty — "what do I know for sure vs. what do I suspect?"
- **Custom Lens**: User-defined ontological schemas with LLM-assisted mapping

Lenses are **non-destructive views** over the engram graph. They do not copy or move data — they are parameterized query/render pipelines that transform the same sovereign data into different cognitive interfaces. Lenses themselves are exportable, shareable, and composable.

### 4. Temporal Memory Architecture (TMA)

Every engram exists in **five temporal dimensions simultaneously**:

| Dimension | Description | Use |
|---|---|---|
| **t_event** | When the thing happened | Historical ordering |
| **t_encode** | When you learned/stored it | Acquisition tracking |
| **t_access** | When you last retrieved it | Relevance decay |
| **t_utility** | When it will likely be useful again | Predictive retrieval |
| **t_expiry** | When it should be reviewed for deletion | Lifecycle management |

The TMA enables **temporal queries**: "What did I know about quantum computing in March 2024?" reconstructs the engram graph as it existed at that time, including which connections existed and what confidence levels were assigned. This is **mental state reconstruction** — not just what you knew, but the *structure* of your understanding at a point in time.

Implementation relies on **persistent data structures** (immutable snapshots with structural sharing) applied to the engram graph, so any historical state can be reconstructed in O(log n) time.

### 5. Computable Memory — Memory as a Query Engine

Memories are not just retrievable — they are **computable**. The system supports a memory query language (MQL) that enables:

```
// Find all decisions I made about hiring that I later regretted
TRACE decisions
  WHERE domain = "hiring"
  AND EXISTS downstream_engram
    WHERE sentiment < -0.3
    AND relation = "consequence_of"

// Simulate: what would I recommend to someone in my position 2 years ago?
RECONSTRUCT mental_state AT "2022-06-01"
  THEN QUERY "What should I prioritize?"
  WITH current_knowledge = TRUE

// Find contradictions in my beliefs
DETECT contradictions
  IN semantic_engrams
  WHERE confidence > 0.7
  AND topic IN ["management", "leadership"]
```

MQL compiles to operations over the engram graph and vector store. Complex queries invoke the context engine (LLM) for interpretation. All queries run locally. Results are themselves engrams (meta-memories) that can be stored and referenced.

### 6. Post-Platform Sovereignty — The Memory Substrate Protocol (MSP)

Design memory for **century-scale persistence** through a formal protocol specification:

- **MSP Core**: A content-addressed, self-describing binary format for engrams. Every engram contains enough metadata to be parsed without any external system.
- **MSP Encryption Envelope**: Standardized encryption wrapping (currently XChaCha20-Poly1305 + X25519) with **algorithm agility** — the envelope specifies its own cryptographic algorithms, enabling future migration.
- **MSP Graph Format**: A portable representation of the engram graph (edges, weights, types) using CBOR encoding.
- **MSP Recovery Seed**: A single mnemonic phrase (BIP-39 extended) from which all encryption keys, identity keys, and graph structure keys can be rederived.
- **MSP Print**: A physical backup format — QR-code-based cold storage that can reconstruct the core memory substrate from paper.

The protocol is **implementation-independent**. If Sovereign Memory ceases to exist, any software implementing MSP can read, decrypt, and reconstitute the user's memory. The spec is published as an open standard.

### 7. Collective Memory — Sovereign Group Cognition

Groups (families, teams, organizations) can form **memory collectives** — shared engram spaces with formal governance:

- **Shared Engrams**: Memories contributed to the collective by members, with contributor attribution
- **Emergent Engrams**: Syntheses that exist only in the collective, generated from shared context
- **Governance Rules**: On-chain or locally enforced rules for contribution, access, modification, and deletion
- **Dissent Records**: When members disagree on a shared memory, both versions are preserved with cryptographic attribution
- **Exit Rights**: Any member can leave a collective, taking their contributions with them (or leaving copies, per policy)

Collectives use **multi-party computation (MPC)** for operations that require combining private memories without revealing them. Example: "Do any of us have experience with this vendor?" can be answered without revealing who has what experience.

### 8. The Uncertainty Engine

All engrams carry explicit **epistemic metadata**:

- **Source reliability score**: Based on provenance (direct experience > told by trusted person > read online > inferred)
- **Corroboration count**: How many independent engrams support this one?
- **Contradiction flags**: Active conflicts with other high-confidence engrams
- **Temporal confidence decay**: Facts that become less reliable over time (e.g., someone's phone number)
- **Inference chain depth**: How many reasoning steps removed from direct observation?

The system surfaces uncertainty proactively: "You believe X, but this is based on a single source from 3 years ago, and 2 recent engrams suggest the opposite." Users can query their own confidence landscape: "What are my least-supported beliefs about [topic]?"

### 9. Memory Due Process — Constitutional Governance

The system operates under a **Memory Constitution** — a user-authored document (with sensible defaults) that establishes:

- **Extraction Rights**: What can be automatically extracted vs. what requires explicit capture
- **Consolidation Rules**: Under what conditions can engrams be merged, abstracted, or promoted
- **Deletion Guarantees**: What "delete" means (cryptographic erasure, not just soft-delete)
- **Appeal Process**: Users can review and reverse any automated action within a configurable window
- **Audit Rights**: Complete, tamper-proof log of all system actions on memory
- **Modification Locks**: Certain engrams can be marked immutable — the system cannot alter them
- **Harm Protocols**: How the system handles potentially traumatic memories (opt-in content warnings, access barriers, safe-mode)

The constitution is stored as a signed engram. Changes to the constitution are themselves logged and require explicit user action.

### 10. Ambient Capture with Consent Architecture

The system can capture context from the user's digital environment — but through a rigorous **consent architecture**:

- **Capture Zones**: User-defined contexts where ambient capture is active (e.g., "during work hours in Slack", "while reading research papers", "never in private browsing")
- **Capture Levels**: Configurable depth from "titles only" → "summaries" → "full content" → "full content + metadata"
- **Live Preview**: Real-time display of what's being captured, with one-tap pause/delete
- **Third-Party Consent**: When capturing interactions involving others, the system flags multi-party consent requirements
- **Capture Budget**: Maximum daily capture volume to prevent surveillance drift

---

## Architecture Changes

### From Flat Storage to Engram Graph

```
v1.0 Architecture:
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Memory   │────▶│  Vector   │────▶│  Context  │
│  Store    │     │  Index    │     │  Engine   │
│ (DAG/KV)  │     │ (HNSW)   │     │  (LLM)   │
└──────────┘     └──────────┘     └──────────┘

v2.0 Architecture:
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY SUBSTRATE LAYER                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  Engram   │  │  Engram      │  │  Temporal           │     │
│  │  Store    │──│  Graph       │──│  Snapshot           │     │
│  │  (CAS)   │  │  (Property   │  │  Engine              │     │
│  │          │  │   Graph)     │  │  (Persistent         │     │
│  └──────────┘  └──────────────┘  │   Data Structures)   │     │
│                                   └────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    INTELLIGENCE LAYER                         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  Hybrid   │  │  Dreaming    │  │  Theory of Mind     │     │
│  │  Retrieval│  │  Engine      │  │  Engine              │     │
│  │  (Vector  │  │  (Async      │  │  (User Model +      │     │
│  │  +BM25    │  │   Consolid.) │  │   Anticipation)     │     │
│  │  +Graph)  │  │              │  │                     │     │
│  └──────────┘  └──────────────┘  └────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    SOVEREIGNTY LAYER                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  Crypto   │  │  Identity    │  │  Constitution       │     │
│  │  Envelope │  │  (DID +      │  │  Engine              │     │
│  │  (E2E +   │  │   Recovery)  │  │  (Policy             │     │
│  │   ZK)     │  │              │  │   Enforcement)      │     │
│  └──────────┘  └──────────────┘  └────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    INTERFACE LAYER                            │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  MQL      │  │  Lensing     │  │  Ambient Capture    │     │
│  │  Engine   │  │  Engine      │  │  (Consent-Gated)    │     │
│  └──────────┘  └──────────────┘  └────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    SYNC & PERSISTENCE LAYER                   │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  CRDT     │  │  MSP         │  │  4-Tier Storage     │     │
│  │  Sync     │  │  Protocol    │  │  + Collective       │     │
│  │  Engine   │  │  (Export/    │  │    Shards            │     │
│  │          │  │   Import)    │  │                     │     │
│  └──────────┘  └──────────────┘  └────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Shifts

**1. From key-value to property graph**
The engram graph is implemented as a local property graph (using an embedded graph database like Oxigraph or a custom B-tree-backed adjacency store). Edges are first-class citizens with types, weights, timestamps, and metadata. Vector indices and keyword indices are secondary projections of the graph, not primary storage.

**2. From synchronous retrieval to speculative pre-computation**
The Theory of Mind Engine maintains a continuously updated **user context model** that predicts what memories will be relevant in the near future. Likely-relevant engrams are pre-loaded into a "ready set" in hot storage, reducing perceived retrieval latency to near-zero for anticipated needs.

**3. From single-writer to constitutional multi-agent**
Multiple agents operate on memory simultaneously: the Capture Agent, the Dreaming Engine, the Context Compiler, user-initiated queries, and (optionally) collective sync. All writes go through the Constitution Engine, which enforces the user's governance policy and logs every action.

**4. From per-memory encryption to hierarchical envelope encryption**
Engrams are grouped into **encryption domains** (e.g., "work", "health", "relationships") each with their own key hierarchy. This enables:
- Domain-level sharing without exposing other domains
- Domain-level deletion (destroy the key, destroy the domain)
- Per-domain recovery delegates (e.g., your spouse holds a recovery key for "family" memories only)
- Efficient re-encryption when rotating keys (only domain keys change, not individual engrams)

**5. From flat embeddings to multi-space representations**
Each engram is embedded in multiple vector spaces simultaneously:
- **Semantic space** (meaning — what is this about?)
- **Episodic space** (experiential similarity — what does this feel like?)
- **Temporal space** (when-patterns — what happens at similar times/phases?)
- **Social space** (who-patterns — who is involved?)

Retrieval queries are routed to the appropriate space(s) or blended across spaces with learned weights.

---

## New Capabilities

### For Individual Users

1. **Dream Reports**: Wake up to a summary of overnight consolidation — new connections discovered, contradictions found, knowledge promoted from episodic to semantic. "Last night, your system connected your 2023 negotiation experience with the article you read yesterday about anchoring bias."

2. **Mental State Time Travel**: "Show me what I understood about machine learning in January 2023" — reconstructs the engram graph as it existed then, with the knowledge, connections, and confidence levels of that time.

3. **Counterfactual Simulation**: "If I had known about [X] before making [Y decision], what might I have decided?" — runs the decision context through current knowledge to surface alternative paths.

4. **Belief Audit**: "What are my most strongly-held beliefs about management?" — surfaces semantic engrams, shows evidence chains, highlights where confidence may be unwarranted.

5. **Anticipatory Surfacing**: Before a meeting with Client X, the system proactively surfaces relevant memories — past interactions, preferences, commitments made, open questions. No manual search required.

6. **Cognitive Lensing**: Switch between "project manager view" and "personal growth view" of the same memories. Same data, different organizing principles, different insights.

7. **Memory MQL**: Power users can write structured queries against their memory. "Find all instances where I changed my mind about something and track what caused the change."

8. **Century-Scale Backup**: Export the entire memory substrate to MSP format, generate a physical QR-code backup, designate recovery delegates. Memory survives device failure, service shutdown, and death (if intended).

9. **Selective Forgetting**: Not just deletion, but graduated forgetting — reduce detail level, remove emotional associations, or fully erase with cryptographic guarantees.

10. **Ambient Learning**: While reading, coding, or conversing, the system quietly captures relevant context at a user-configured depth, organizing it into the engram graph without interrupting flow.

### For Groups

11. **Collective Intelligence**: Teams build shared memory — onboarding new members means granting access to the team's engram graph, not writing documentation.

12. **Private Intersection Queries**: "Does anyone on the team have experience with Kubernetes security?" answered via MPC without revealing who has what experience until they choose to disclose.

13. **Dissent-Preserving Shared Memory**: When team members disagree about a decision's rationale, both accounts are preserved with attribution. No single narrative dominates.

14. **Memory Structure Forking**: Adopt a colleague's organizational framework (their lens, their taxonomy) without accessing their content. "I like how you organize project memories — let me try that structure."

---

## Technical Specifications

### Engram Schema (MSP Core Format)

```typescript
interface Engram {
  // Identity
  id: ContentHash;           // BLAKE3 hash of canonical content
  version: number;           // Schema version for forward compatibility
  
  // Content (encrypted at rest)
  content: {
    primary: MultimodalContent;    // Main content (text, audio, image, etc.)
    summary: string;               // LLM-generated or user-provided summary
    gist: string;                  // Ultra-compressed one-liner
    fidelity: FidelityLevel;       // VERBATIM | SUMMARIZED | GIST | SKELETON
  };
  
  // Classification
  type: EngamType;           // episodic | semantic | procedural | etc.
  domains: string[];         // User-defined domains (encryption boundaries)
  tags: string[];            // Free-form tags
  
  // Temporal
  temporal: {
    t_event: Timestamp | null;     // When the thing happened
    t_encode: Timestamp;           // When this engram was created
    t_access: Timestamp[];         // Access history (ring buffer, last N)
    t_utility: TimestampPrediction | null;  // Predicted next use
    t_expiry: Timestamp | null;    // Review-for-deletion date
    decay_curve: DecayCurve;       // Exponential | Linear | Step | Immortal
    reinforcement_count: number;   // Times accessed or explicitly reinforced
  };
  
  // Epistemic
  epistemic: {
    confidence: number;            // 0.0 - 1.0
    source: SourceDescriptor;      // direct_experience | told_by | read | inferred
    source_reliability: number;    // 0.0 - 1.0
    corroboration: ContentHash[];  // IDs of supporting engrams
    contradictions: ContentHash[]; // IDs of contradicting engrams
    inference_depth: number;       // Steps from direct observation
  };
  
  // Affective
  affective: {
    valence: number;          // -1.0 (negative) to 1.0 (positive)
    arousal: number;          // 0.0 (calm) to 1.0 (intense)
    labels: string[];         // Optional emotion labels
    auto_detected: boolean;   // Whether affect was inferred vs. annotated
  };
  
  // Embeddings (multiple spaces)
  embeddings: {
    semantic: Float32Array;     // 1024-dim semantic embedding
    episodic: Float32Array;     // 512-dim experiential similarity
    temporal: Float32Array;     // 256-dim temporal pattern embedding
    social: Float32Array;      // 256-dim social context embedding
  };
  
  // Provenance
  provenance: {
    chain: ProvenanceEvent[];  // Ordered list of transformations
    signature: Ed25519Signature; // User's DID signature over canonical form
    constitution_version: ContentHash; // Which constitution was in effect
  };
  
  // Graph edges (stored separately but logically part of engram)
  edges: EngamEdge[];
}

interface EngamEdge {
  target: ContentHash;
  type: EdgeType;            // CAUSAL | TEMPORAL | ASSOCIATIVE | CONTRADICTS | 
                             // ELABORATES | ABSTRACTS | PART_OF | SEQUENCE
  weight: number;            // 0.0 - 1.0 (connection strength)
  created: Timestamp;
  auto_generated: boolean;   // AI-created vs user-created
  bidirectional: boolean;
}

interface ProvenanceEvent {
  action: 'CAPTURE' | 'EXTRACT' | 'CONSOLIDATE' | 'MUTATE' | 'MERGE' | 
          'SPLIT' | 'PROMOTE' | 'DEMOTE' | 'SHARE' | 'COMPRESS';
  timestamp: Timestamp;
  agent: 'USER' | 'DREAMING_ENGINE' | 'CAPTURE_AGENT' | 'CONTEXT_COMPILER';
  input_hashes: ContentHash[];    // What went in
  output_hash: ContentHash;       // What came out
  rationale: string;              // Why this transformation occurred
  constitution_rule: string;      // Which rule authorized it
  reversible: boolean;
  reversal_deadline: Timestamp | null;
}
```

### Dreaming Engine Specification

```typescript
interface DreamingConfig {
  schedule: CronExpression;          // When to run (default: 2 AM local)
  max_duration: Duration;            // Maximum processing time
  max_engrams_per_cycle: number;     // Bound computation
  
  consolidation_policy: {
    auto_merge_threshold: number;    // Similarity threshold for auto-merging (0.0-1.0)
    auto_promote: boolean;           // Automatically promote episodic → semantic
    promotion_threshold: number;     // How many related episodics before promotion
    contradiction_action: 'FLAG' | 'AUTO_RESOLVE' | 'IGNORE';
    novel_connection_action: 'PROPOSE' | 'AUTO_ADD' | 'IGNORE';
  };
  
  counterfactual_policy: {
    enabled: boolean;
    domains: string[];               // Only run counterfactuals in these domains
    max_per_cycle: number;
  };
  
  compression_policy: {
    enabled: boolean;
    min_age: Duration;               // Don't compress recent memories
    target_fidelity: FidelityLevel;  // How far to compress
    preserve_original: boolean;      // Keep verbatim alongside compressed
  };
  
  report: {
    generate: boolean;
    detail_level: 'SUMMARY' | 'DETAILED' | 'FULL';
    deliver_via: 'IN_APP' | 'NOTIFICATION' | 'NONE';
  };
}

interface DreamReport {
  cycle_id: string;
  started: Timestamp;
  completed: Timestamp;
  
  consolidations: {
    merged: Array<{from: ContentHash[], to: ContentHash, rationale: string}>;
    promoted: Array<{engram: ContentHash, from_type: EngamType, to_type: EngamType}>;
    compressed: Array<{engram: ContentHash, from_fidelity: FidelityLevel, to_fidelity: FidelityLevel}>;
  };
  
  discoveries: {
    new_connections: Array<{from: ContentHash, to: ContentHash, type: EdgeType, rationale: string, confidence: number}>;
    contradictions: Array<{engrams: ContentHash[], description: string, suggested_resolution: string}>;
    patterns: Array<{description: string, supporting_engrams: ContentHash[], confidence: number}>;
  };
  
  counterfactuals: Array<{
    original_decision: ContentHash;
    new_information: ContentHash[];
    alternative_analysis: string;
    confidence: number;
  }>;
  
  pending_approval: Array<{
    action: ProvenanceEvent;
    expires: Timestamp;           // Auto-reject if not approved by this time
  }>;
}
```

### Memory Query Language (MQL) Grammar (Simplified)

```ebnf
query       := select_query | trace_query | detect_query | reconstruct_query
select_query := 'SELECT' fields 'FROM' source where_clause? temporal_clause? limit_clause?
trace_query  := 'TRACE' engram_type where_clause? 'FOLLOW' edge_type+ depth_clause?
detect_query := 'DETECT' detection_type 'IN' source where_clause?
reconstruct_query := 'RECONSTRUCT' 'mental_state' 'AT' timestamp query_clause?

source      := 'engrams' | 'semantic_engrams' | 'episodic_engrams' | domain_name | lens_name
where_clause := 'WHERE' predicate ('AND' predicate)*
temporal_clause := 'AS_OF' timestamp | 'BETWEEN' timestamp 'AND' timestamp
depth_clause := 'DEPTH' integer
limit_clause := 'LIMIT' integer

predicate   := field operator value
             | 'EXISTS' subquery
             | 'SIMILAR_TO' text_or_engram threshold?
             | field 'IN' value_list
             | 'CONFIDENCE' operator number
             
detection_type := 'contradictions' | 'patterns' | 'gaps' | 'clusters' | 'anomalies'

fields      := '*' | field (',' field)*
field       := 'content' | 'summary' | 'gist' | 'type' | 'confidence' | 'valence' 
             | 'source' | 'domains' | 'tags' | temporal_field | custom_field
```

MQL compiles to a query plan that orchestrates graph traversal, vector search, and keyword search. Complex predicates (especially natural-language similarity) invoke the local LLM for interpretation. All query execution is logged and auditable.

### Theory of Mind Engine

```typescript
interface UserModel {
  // Cognitive style
  thinking_patterns: {
    decision_style: 'analytical' | 'intuitive' | 'deliberative' | 'mixed';
    information_preference: 'detail_first' | 'big_picture_first' | 'example_first';
    learning_mode: 'visual' | 'textual' | 'kinesthetic' | 'mixed';
    contradiction_tolerance: number;       // How comfortable with ambiguity (0-1)
    novelty_seeking: number;               // Preference for new vs. familiar info (0-1)
  };
  
  // Current context
  active_contexts: Array<{
    domain: string;
    start_time: Timestamp;
    inferred_goal: string;
    confidence: number;
    relevant_engram_ids: ContentHash[];     // Pre-loaded "ready set"
  }>;
  
  // Temporal patterns
  rhythms: {
    daily: Map<HourOfDay, DomainDistribution>;     // What domains are active when
    weekly: Map<DayOfWeek, DomainDistribution>;
    project_phases: Map<ProjectId, PhaseModel>;     // Where in project lifecycle
  };
  
  // Anticipation queue
  predictions: Array<{
    context_trigger: ContextPattern;        // "When user opens IDE for project X"
    predicted_needs: ContentHash[];         // Engrams likely to be requested
    confidence: number;
    basis: ContentHash[];                   // What engrams support this prediction
  }>;
  
  // Meta-cognitive model
  meta: {
    memory_reliability_by_domain: Map<string, number>;  // How good is user's own memory per domain
    forgetting_curve_by_type: Map<EngamType, DecayCurve>; // User's natural forgetting patterns
    retrieval_cue_effectiveness: Map<CueType, number>;    // What triggers good recall
  };
}
```

The UserModel is rebuilt from the engram graph — it is a **derived structure**, not primary data. If deleted, it can be reconstructed. It is never shared or transmitted. It is stored encrypted with the same key hierarchy as memory domains.

### Encryption Architecture v2

```
Key Hierarchy:

Master Seed (BIP-39 mnemonic — user holds this)
    │
    ├── Identity Key (Ed25519 — DID signing)
    │
    ├── Master Encryption Key (X25519)
    │     │
    │     ├── Domain Key: "personal"
    │     │     ├── Engram Key (derived per-engram via HKDF)
    │     │     └── Sharing Key (per-recipient X25519 DH)
    │     │
    │     ├── Domain Key: "work"
    │     │     ├── Engram Key
    │     │     └── Sharing Key
    │     │
    │     ├── Domain Key: "health"
    │     │     ├── Engram Key
    │     │     └── Sharing Key
    │     │
    │     └── Domain Key: "collective:{group_id}"
    │           ├── Member Keys (per-member, via group DH)
    │           └── Engram Key
    │
    └── Recovery Keys
          ├── Social Recovery (Shamir's Secret Sharing, k-of-n)
          ├── Hardware Key (YubiKey / Titan)
          └── Time-Lock Recovery (verifiable delay function)
```

**Algorithm agility**: Every encrypted payload includes an `algorithm_id` field. Current default: `XChaCha20-Poly1305` for symmetric, `X25519` for key exchange, `Ed25519` for signing, `BLAKE3` for hashing. The MSP spec defines a registry of allowed algorithms. Key rotation is domain-scoped — rotating the "work" domain key re-encrypts only work engrams.

### Zero-Knowledge Proofs for Memory Staking

Users can prove properties of their memory without revealing content:

```typescript
interface MemoryStake {
  // "I knew X at time T" without revealing X
  claim: {
    type: 'KNOWLEDGE_AT_TIME' | 'DECISION_RATIONALE' | 'PREDICTION_MADE';
    timestamp: Timestamp;
    domain_hint: string;           // Optional: narrow the domain
  };
  
  proof: {
    commitment: PedersenCommitment;  // Commitment to engram content at timestamp
    proof: SNARKProof;               // ZK proof that commitment is in the engram graph at timestamp
    verification_key: VerificationKey;
  };
  
  reveal: {
    // Optional future reveal
    witness: Uint8Array;              // Opened commitment
    engram_hash: ContentHash;         // Which engram this corresponds to
  };
}
```

Implementation uses Groth16 SNARKs over the Merkle root of the engram graph at each temporal snapshot. Proof generation is computationally expensive (~30 seconds on commodity hardware) but verification is O(1).

---

## Implementation Pathway

### Phase 1: Foundation (Months 1-4) — "The Substrate"

**Goal**: Replace flat storage with engram model and graph database

**Deliverables**:
1. Engram schema implementation with full TypeScript/Rust types
2. Embedded property graph storage (based on sled or custom B-tree backend)
3. Multi-space embedding pipeline (semantic + episodic initially)
4. MSP v0.1 format specification and serializer/deserializer
5. Migration tool from v1.0 memory records to engrams
6. Constitution Engine v1 (basic policy enforcement, audit logging)

**Dependencies**: None (foundational)

**Key Risk**: Performance regression during migration. Mitigate with parallel operation (v1 and v2 running simultaneously, v2 as shadow system).

### Phase 2: Intelligence (Months 3-7) — "The Dreaming Mind"

**Goal**: Implement the Dreaming Engine and enhanced retrieval

**Deliverables**:
1. Dreaming Engine core (consolidation, contradiction detection, novel connection discovery)
2. Dream Reports with user approval workflow
3. Temporal Memory Architecture (persistent data structures for graph snapshots)
4. Graph-augmented retrieval (vector search + graph traversal in single query)
5. User Model v1 (thinking patterns, active contexts, basic anticipation)

**Dependencies**: Phase 1 (engram graph must exist)

**Key Risk**: Dreaming Engine produces low-quality or overwhelming suggestions. Mitigate with conservative defaults (propose-only, low suggestion volume, high confidence threshold).

### Phase 3: Sovereignty (Months 5-9) — "The Vault"

**Goal**: Implement post-platform sovereignty and advanced cryptography

**Deliverables**:
1. Hierarchical domain-based encryption
2. MSP v1.0 complete specification with reference implementation
3. Social recovery (Shamir's Secret Sharing) for master seed
4. Memory staking (ZK proofs of knowledge-at-time)
5. Algorithm-agile encryption envelope
6. Physical backup (QR-code MSP Print)

**Dependencies**: Phase 1 (engram format), partially Phase 2 (temporal snapshots for ZK proofs)

**Key Risk**: Cryptographic complexity leads to key management UX disaster. Mitigate with extensive UX research, sane defaults, and "advanced mode" toggle.

### Phase 4: Interface (Months 7-11) — "The Lens"

**Goal**: Implement cognitive lensing, MQL, and ambient capture

**Deliverables**:
1. Lensing Engine with 5 built-in lenses + custom lens builder
2. MQL parser, query planner, and execution engine
3. Ambient Capture Agent with consent architecture
4. Mental State Time Travel UI
5. Counterfactual simulation engine
6. Belief Audit tool

**Dependencies**: Phase 1+2 (graph, temporal snapshots, user model)

**Key Risk**: Information overload — too many views, too many features. Mitigate with progressive disclosure, sensible defaults, and opinionated "starter configurations."

### Phase 5: Collective (Months 10-14) — "The Circle"

**Goal**: Implement group memory with sovereignty preservation

**Deliverables**:
1. Collective engram spaces with governance rules
2. MPC-based private intersection queries
3. Dissent-preserving shared memory
4. Lens/structure forking (share organization without content)
5. Exit rights with data portability guarantees

**Dependencies**: Phase 3 (domain-based encryption, key management), Phase 4 (lensing)

**Key Risk**: Multi-party cryptography is slow and complex. Mitigate with optimistic protocol (plaintext among trusted members, MPC only for privacy-requiring operations).

### Phase 6: Scale (Months 12-18) — "The Lifetime"

**Goal**: Optimize for lifelong memory at planetary scale

**Deliverables**:
1. Tiered graph storage (hot subgraph in memory, warm on SSD, cold on archive)
2. Graph summarization for O(log n) retrieval in billion-engram stores
3. Incremental embedding updates (avoid full re-embedding on graph changes)
4. CRDT-based graph sync (extending v1.0's CRDT sync to graph topology)
5. Benchmarks: 1M engrams, 10M edges, <100ms p99 retrieval

**Dependencies**: All previous phases

**Key Risk**: Graph operations don't scale linearly. Mitigate with hierarchical graph clustering (super-nodes representing summarized subgraphs).

---

## Risks & Mitigations

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Dreaming Engine hallucination** — creates false connections between memories | High | Medium | All dream outputs are proposals requiring approval. Provenance chain tracks every auto-generated edge. Confidence thresholds prevent low-quality suggestions. Users can disable entirely. |
| **Key loss catastrophe** — user loses master seed, all memory is irrecoverable | Critical | Low | Social recovery (k-of-n Shamir), hardware backup key, time-locked recovery, physical MSP Print backup. Multiple independent recovery paths. |
| **Theory of Mind manipulation** — user model used to manipulate user | High | Low | User model is derived data, fully inspectable, deletable, and never transmitted. Constitution can restrict what the model can influence. "Inspect the inspector" feature shows exactly why any recommendation was made. |
| **Ambient capture creep** — system captures too much, creating surveillance feeling | Medium | Medium | Strict consent architecture with capture zones, levels, budgets, and live preview. Default is minimal capture. Clear visual indicators when capturing. |
| **Performance degradation at scale** — billion-engram graphs become slow | Medium | High | Hierarchical graph clustering, tiered storage, pre-computed subgraph summaries, query budgets with graceful degradation (return approximate results). |
| **Collective memory disputes** — group members disagree, system becomes contested space | Medium | High | Dissent-preserving architecture (multiple versions coexist), formal governance rules, exit rights, attributed contributions. No single-narrative enforcement. |
| **Cryptographic obsolescence** — current algorithms broken by quantum computing | High | Medium (long-term) | Algorithm agility in MSP format. Encryption envelope is self-describing. Migration tool for re-encrypting under new algorithms. Post-quantum algorithms (ML-KEM, SLH-DSA) as configurable options from day one. |
| **Memory manipulation by external actors** — injection attacks via ambient capture | High | Low | All engrams are signed by user's DID key. Capture pipeline validates source integrity. External content is marked with provenance (not original thought vs. captured from web). Constitution can restrict external source reliability scores. |
| **Cognitive dependency** — users stop remembering things themselves | Medium | Medium | This is partially by design (like calculator dependency for arithmetic) but mitigated by: periodic "exercise" suggestions, transparency about what's externalized, biological memory cue integration. Explicit user education about complementary use. |
| **Complexity overwhelm** — system too complex for normal users | High | High | Progressive disclosure UX. "Simple mode" hides advanced features. Opinionated defaults that work well for 80% of use cases. Advanced features unlock gradually based on engagement. MQL and lensing are power-user features, not required for basic use. |

---

## Open Questions

### Fundamental Research Questions

1. **What is the information-theoretic minimum for memory representation?** If we compress a memory to its absolute minimum while preserving its utility, what's left? Is there a universal "gist" encoding? This connects to rate-distortion theory but applied to autobiographical memory, where "distortion" is defined by future utility — a non-standard and context-dependent loss function.

2. **How do we represent tacit knowledge?** Some of the most valuable things people know are things they can't articulate — intuitions, aesthetic judgments, embodied skills. Can we capture these through behavioral patterns, decision traces, or outcome correlations rather than explicit statements? What engram schema changes would be needed?

3. **What is the right forgetting function?** Biological memory forgetting follows something like an exponential decay with interference effects. Should digital memory mimic this? There's a tension between "never forget" (maximizing information) and "forget appropriately" (maximizing relevance and reducing noise). The optimal forgetting function likely depends on memory type, domain, and individual cognitive style. This needs empirical research.

4. **Can we detect memory manipulation?** If an external actor (or the system itself) subtly modifies memories, can the user detect this? Cryptographic signatures protect against unauthorized modification, but what about authorized-but-subtle changes? (e.g., the Dreaming Engine slowly shifting the emotional valence of a memory through repeated consolidation.) This is an adversarial robustness question.

5. **What does consent look like for multi-party memories?** If I remember a conversation with you, do you have rights over my memory of it? Current privacy law is inconsistent here. We need a principled framework, not just a legal one. Possible approach: distinguish between "factual record" (what was said) and "interpretive memory" (what I think it meant). Different consent regimes for each.

### Engineering Questions

6. **Graph CRDT convergence**: How do we ensure that a property graph replicated across multiple devices via CRDTs always converges to a consistent state, especially when edges are being created by the Dreaming Engine on different devices? We may need to design a novel CRDT type for labeled property graphs with merge semantics for conflicting edge weights.

7. **Embedding drift**: As the embedding model is updated (better models, fine-tuned on user's data), all existing embeddings become stale. Re-embedding the entire memory store is expensive. Can we do incremental embedding updates? Can we maintain multiple embedding generations with cross-generation retrieval? What's the degradation curve?

8. **ZK proof scalability**: Generating SNARK proofs over the Merkle root of a billion-engram graph is computationally prohibitive. Can we use recursive SNARKs (proofs of proofs) to amortize cost? Can we restrict staking to per-domain Merkle trees to reduce tree size?

9. **Multimodal engrams**: How do we embed audio, images, video, and spatial data in the same multi-space embedding framework as text? Do we use unified multimodal models (CLIP-like) or separate domain-specific embeddings with learned alignment? What's the storage cost of multimodal embeddings at scale?

10. **Local LLM quality**: Many features (Dreaming Engine, MQL interpretation, counterfactual simulation) depend on local LLM inference for sovereignty. Current local models are significantly less capable than cloud models. At what model quality threshold do these features become useful rather than annoying? Can we design graceful degradation that uses simpler heuristics when LLM quality is insufficient?

### Product Questions

11. **What's the MVP?** Everything described above is the vision. What's the smallest thing that delivers enough value to attract users? Hypothesis: engram model + basic dreaming + anticipatory surfacing — a system that demonstrably surfaces the right memory at the right time.

12. **Who is the first user?** Knowledge workers are the obvious answer, but which sub-segment? Researchers who need to connect ideas across years? Executives who need institutional memory? Therapists tracking patient history? The answer shapes feature prioritization.

13. **What's the trust-building path?** Users won't immediately trust an AI to process their most private memories autonomously. How do we build trust gradually? Proposed: start with purely manual memory capture and retrieval, then introduce AI suggestions (always with approval), then configurable automation.

---

## Comparison: Current vs. Proposed

| Dimension | v1.0 (Current) | v2.0 (Proposed) |
|---|---|---|
| **Memory Primitive** | Flat record (type, content, metadata) | Engram (content + affect + epistemic + relational + temporal + provenance) |
| **Storage Model** | Key-value (DAG/CAS) | Property graph + KV + vector (unified) |
| **Temporal Model** | Single timestamp + decay score | 5-dimensional temporal model with persistent snapshots |
| **Retrieval** | Semantic search + keyword search | Multi-space vector search + graph traversal + anticipatory pre-loading |
| **Intelligence** | Extract → store → retrieve | Extract → store → consolidate → dream → anticipate → surface |
| **Consolidation** | Periodic deduplication | Dreaming Engine with novel connection discovery, contradiction detection, counterfactual simulation |
| **User Model** | Preference memory type | Full Theory of Mind engine (cognitive style, rhythms, anticipation, meta-cognition) |
| **Encryption** | Per-memory E2E encryption | Hierarchical domain-based encryption with algorithm agility |
| **Identity** | DID with key pair | DID + BIP-39 recovery seed + social recovery + hardware keys |
| **Portability** | JSON export | MSP protocol (implementation-independent, century-scale, physical backup) |
| **Query Capability** | Natural language search | MQL (structured query language) + natural language + graph queries |
| **Viewing Model** | Single organized list | Cognitive lensing (multiple simultaneous ontological views) |
| **Sharing** | Circle-based, per-recipient encryption | Collective memory with governance, MPC, dissent preservation, structure forking |
| **Certainty Model** | Implicit (all memories treated equally) | Explicit epistemic metadata (confidence, source, corroboration, contradictions) |
| **Provenance** | Basic creation metadata | Full cryptographic provenance chain for every transformation |
| **Ambient Capture** | Manual + basic extraction | Consent-gated ambient capture with zones, levels, budgets |
| **Forgetting** | Delete or keep | Graduated forgetting (compress, de-emotionalize, archive, cryptographic erase) |
| **Scale Target** | Thousands of memories | Millions of engrams (lifelong capture, 80+ years) |
| **Group Cognition** | Shared access to memories | True collective memory with emergent group engrams |
| **Platform Survival** | Data export | Full platform-independent protocol with physical cold storage |
| **Governance** | User settings | Constitutional framework with due process, audit trails, appeal mechanisms |
| **Proofs** | None | Zero-knowledge proofs of knowledge-at-time (memory staking) |
| **Biological Interface** | None | Retrieval cue optimization based on meta-cognitive model |

---

## Coda: The Philosophical Commitment

Sovereign Memory v2.0 is built on a philosophical claim: **your memory is not your data — your memory is you**. The distinction matters. Data can be backed up, copied, and processed without ethical concern. Memory is constitutive of identity. When we build a system that extends, augments, and protects memory, we are building a system that extends, augments, and protects *personhood*.

This means every design decision is ultimately an ethical decision. The Dreaming Engine isn't just a feature — it's a claim about whether an AI system should be allowed to participate in the construction of your self-narrative. The Constitution Engine isn't just access control — it's a framework for cognitive self-governance. Memory staking isn't just cryptography — it's a tool for epistemic accountability.

We build this system because the alternative — memory mediated by platforms that don't respect sovereignty, don't preserve provenance, and don't survive corporate death — is a form of cognitive dispossession. Sovereign Memory v2.0 is the technology of cognitive liberty, implemented as infrastructure.

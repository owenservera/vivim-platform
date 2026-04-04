# VIVIM Cortex — Phase 1 MVP: Core Algorithms Specification

> Adaptive Context Intelligence · Business Use Cases · Multi-Tiered Memory Compression

---

## 1. Situation-Adaptive Context Intelligence

### 1.1 The Problem
A developer debugging Kubernetes at 2 AM needs radically different context than a sales manager preparing for a client call at 9 AM. Static context assembly wastes tokens on irrelevant memories. The system must **detect the situation** and **reshape itself** in real-time.

### 1.2 Situation Detection Algorithm

```typescript
// Run on EVERY user message before context assembly
interface DetectedSituation {
  archetype: SituationArchetype;
  confidence: number;
  signals: SituationSignal[];
  contextOverrides: Partial<LayerConfig[]>;
}

type SituationArchetype =
  | 'software_engineering'   // coding, debugging, architecture
  | 'project_management'     // planning, tracking, deadlines
  | 'sales_business_dev'     // client calls, proposals, pipeline
  | 'legal_compliance'       // contracts, regulations, policies
  | 'medical_clinical'       // patient data, protocols, research
  | 'finance_accounting'     // budgets, forecasts, reporting
  | 'creative_design'        // writing, design, brainstorming
  | 'education_learning'     // studying, tutoring, curriculum
  | 'hr_people'              // hiring, reviews, onboarding
  | 'operations_infra'       // deployment, monitoring, incidents
  | 'research_analysis'      // data analysis, experiments, papers
  | 'personal_general';      // general conversation, life

interface SituationSignal {
  type: 'keyword' | 'entity' | 'temporal' | 'provider' | 'history' | 'explicit';
  value: string;
  weight: number;
}
```

**Detection Algorithm (runs in < 50ms)**:
```
DETECT_SITUATION(message, userHistory, currentTime):

  signals = []

  // SIGNAL 1: Keyword classification (fast, regex-based)
  for each archetype in KEYWORD_MAP:
    matchCount = count(archetype.keywords ∩ message.tokens)
    if matchCount > 0:
      signals.push({ type: 'keyword', value: archetype, weight: matchCount * 0.15 })

  // SIGNAL 2: Entity recognition (named entities hint at domain)
  entities = extractEntities(message)  // project names, people, tools
  for each entity:
    if entity matches userMemory(category='PROJECT'): signals.push('project_management', 0.3)
    if entity matches userMemory(category='person_info'): signals.push('sales/hr', 0.2)
    if entity matches userMemory(category='skill'): signals.push('software_engineering', 0.25)

  // SIGNAL 3: Temporal context
  hour = currentTime.hour
  dayOfWeek = currentTime.dayOfWeek
  if hour in [9..17] AND dayOfWeek in [Mon..Fri]:
    boost 'project_management', 'sales_business_dev' by 0.1
  if hour in [22..6]:
    boost 'software_engineering', 'personal_general' by 0.1

  // SIGNAL 4: Provider hint
  if provider == 'ollama' or provider == 'local':
    boost 'software_engineering' by 0.15  // local models = dev work
  if provider == 'claude':
    boost 'creative_design', 'legal_compliance' by 0.1  // writing-heavy

  // SIGNAL 5: Conversation momentum (last 3 messages)
  recentArchetype = mode(last3Messages.map(m => m.detectedArchetype))
  if recentArchetype: signals.push({ type: 'history', value: recentArchetype, weight: 0.3 })

  // SIGNAL 6: Explicit user declaration (highest priority)
  if message contains "working on project X" or "preparing for meeting":
    signals.push({ type: 'explicit', value: inferred_archetype, weight: 0.8 })

  // SCORE & SELECT
  scores = aggregate(signals, groupBy: archetype)
  winner = argmax(scores)
  confidence = scores[winner] / sum(scores)

  return { archetype: winner, confidence, signals, contextOverrides: ARCHETYPE_OVERRIDES[winner] }
```

### 1.3 Archetype → Context Override Map

Each detected situation reshapes which memory types get priority, how tokens are allocated, and what gets extracted:

| Archetype | Priority Memory Types | Boosted Layers | Token Shift | Extraction Focus |
|---|---|---|---|---|
| **Software Engineering** | `PROCEDURAL`, `PROJECT`, `SEMANTIC` | L2 Topic +40%, L5 Memory +20% | Active msgs ↑ | Code patterns, tools, configs, errors |
| **Project Management** | `PROJECT`, `GOAL`, `RELATIONSHIP` | L3 Entity +50%, L5 Memory +30% | Entity ↑, Conv ↓ | Deadlines, deliverables, blockers, owners |
| **Sales / Biz Dev** | `RELATIONSHIP`, `EPISODIC`, `GOAL` | L3 Entity +60%, L1 Prefs +20% | Entity ↑↑ | Client preferences, deal stages, meeting notes |
| **Legal / Compliance** | `FACTUAL`, `PROCEDURAL`, `SEMANTIC` | L2 Topic +50%, L5 Memory +40% | Memory ↑↑ | Clauses, precedents, regulations, dates |
| **Medical / Clinical** | `FACTUAL`, `PROCEDURAL`, `EPISODIC` | L0 Identity +30%, L5 Memory +50% | Memory ↑↑↑ | Protocols, medications, patient history |
| **Finance / Accounting** | `FACTUAL`, `PROJECT`, `PROCEDURAL` | L2 Topic +40%, L3 Entity +30% | Topic ↑ | Numbers, dates, accounts, forecasts |
| **Creative / Design** | `PREFERENCE`, `EPISODIC`, `IDENTITY` | L1 Prefs +50%, L0 Identity +30% | Prefs ↑↑ | Style choices, inspiration sources, tone |
| **Education / Learning** | `SEMANTIC`, `PROCEDURAL`, `GOAL` | L2 Topic +60%, L5 Memory +30% | Topic ↑↑ | Concepts learned, gaps, progress |
| **HR / People** | `RELATIONSHIP`, `IDENTITY`, `GOAL` | L3 Entity +50%, L0 Identity +20% | Entity ↑ | Candidate info, review notes, policies |
| **Operations / Infra** | `PROCEDURAL`, `PROJECT`, `EPISODIC` | L2 Topic +30%, L5 Memory +40% | Memory ↑ | Runbooks, incident history, configs |
| **Research / Analysis** | `SEMANTIC`, `FACTUAL`, `PROCEDURAL` | L2 Topic +50%, L5 Memory +50% | Topic ↑↑, Memory ↑↑ | Hypotheses, methods, findings, data |
| **Personal / General** | `IDENTITY`, `PREFERENCE`, `EPISODIC` | L0 Identity +40%, L1 Prefs +40% | Identity ↑↑ | Life goals, hobbies, relationships |

---

## 2. Business Use Case Matrix

### 2.1 Project Management Intelligence

```
SCENARIO: Product manager working across 3 projects with different teams

USER MESSAGE: "What's the status on the Horizon redesign?"

CORTEX BEHAVIOR:
  1. DETECT: archetype = 'project_management' (confidence: 0.91)
     signals: ["Horizon" → known PROJECT entity, "status" → PM keyword, "redesign" → PROJECT tag]

  2. RETRIEVE MEMORIES:
     ┌─────────────────────────────────────────────────────────┐
     │ [PROJECT] "Horizon redesign project started Jan 15,     │
     │  lead designer is Sarah, using Figma" (importance: 0.85)│
     │                                                         │
     │ [GOAL] "Horizon redesign must ship before Q2 board      │
     │  presentation on April 10" (importance: 0.92)           │
     │                                                         │
     │ [EPISODIC] "Last week's standup: Sarah flagged the      │
     │  mobile nav as blocked by API changes" (importance: 0.7)│
     │                                                         │
     │ [RELATIONSHIP] "Sarah Chen — Lead Designer, reports to  │
     │  VP Product, timezone: PST-8" (importance: 0.65)        │
     └─────────────────────────────────────────────────────────┘

  3. ASSEMBLE CONTEXT (12K tokens):
     L0 Identity:    "You are a PM at TechCorp..."           (300 tokens)
     L1 Prefs:       "Prefers bullet-point status updates"   (100 tokens)
     L3 Entities:    Horizon project + team members           (1,800 tokens) ← BOOSTED
     L5 Memory:      4 relevant project memories              (2,200 tokens) ← BOOSTED
     L4 Conv Arc:    Previous conversation summary             (1,600 tokens)
     L6 Active:      Current message thread                    (6,000 tokens)

  4. AI RESPONSE: Comprehensive status update referencing Sarah's blocker,
     the Q2 deadline, and the mobile nav dependency — WITHOUT the user
     having to re-explain any of this.
```

### 2.2 Job Role Intelligence

```
SCENARIO: Software engineer switching between frontend and backend work

EXTRACTED MEMORIES (accumulated over weeks):
  [IDENTITY]    "Senior full-stack engineer, 6 years experience"
  [PREFERENCE]  "Prefers TypeScript strict mode, functional patterns"
  [PREFERENCE]  "Uses Bun as runtime, not Node.js"
  [PROCEDURAL]  "Team uses trunk-based development with feature flags"
  [PROCEDURAL]  "Code review requires 2 approvals before merge"
  [PROJECT]     "Currently working on authentication refactor (auth-v2)"
  [SEMANTIC]    "Team uses PostgreSQL with Prisma ORM for data layer"
  [GOAL]        "Wants to learn Rust for systems programming"

CONTEXT ADAPTATION:
  When coding → inject PROCEDURAL memories (git workflows, patterns)
  When reviewing → inject code style PREFERENCES + team PROCEDURES
  When learning → inject GOAL memories + related SEMANTIC knowledge
  When debugging → inject PROJECT context + recent EPISODIC errors
```

### 2.3 Industry Compliance

```
SCENARIO: Healthcare compliance officer reviewing procedures

ACCUMULATED MEMORIES:
  [FACTUAL]      "Organization is HIPAA-covered entity since 2019"
  [PROCEDURAL]   "PHI must be de-identified using Safe Harbor method"
  [FACTUAL]      "Last HIPAA audit was September 2025, 2 findings"
  [RELATIONSHIP] "Chief Privacy Officer is Dr. Lisa Wang"
  [GOAL]         "Remediate audit findings before March 31"
  [SEMANTIC]     "HITECH Act penalties range from $100 to $50,000 per violation"

CONTEXT BEHAVIOR:
  - Memory layer gets 50% token boost (compliance = memory-heavy)
  - Extraction auto-tags any regulation references
  - Pinned memories for critical compliance deadlines
  - Every response includes source provenance for audit trail
```

### 2.4 Task Tracking & Execution

```
SCENARIO: Freelance designer managing multiple client tasks

MEMORY EXTRACTION TARGETS:
  [PROJECT]  "Logo redesign for Acme Corp — due March 15"
  [PROJECT]  "Brand guidelines for StartupX — waiting on feedback"
  [GOAL]     "Complete Acme deliverables before vacation March 20"
  [EPISODIC] "Client Acme requested 'more playful' in last revision"
  [PREFERENCE] "Acme Corp brand colors: #2D5BFF, #FF6B35"

ADAPTIVE BEHAVIOR:
  When user says "working on Acme" →
    Load ALL Acme-tagged memories (project, preferences, feedback)
    Pre-warm the context with Acme-specific entities
    Auto-suggest: "Note: Acme feedback requested 'more playful' — due March 15"
```

### 2.5 Client Intelligence (Sales)

```
SCENARIO: Account executive preparing for quarterly business review

ACCUMULATED OVER 6 MONTHS:
  [RELATIONSHIP] "John Smith, CTO @ MegaCorp, Met at SaaStr conference"
  [EPISODIC]     "Q3 deal: $450K ARR, closed after 3-month negotiation"
  [PREFERENCE]   "John prefers data-driven presentations, dislikes jargon"
  [GOAL]         "Expand MegaCorp deal to include analytics package"
  [FACTUAL]      "MegaCorp's fiscal year ends June 30"
  [EPISODIC]     "John mentioned budget pressure from CFO in last call"

CONTEXT ASSEMBLY:
  Entity layer gets 60% boost → John's full profile + company context
  Prefs layer gets 20% boost → presentation style guidance
  Result: AI can coach on the QBR strategy with full institutional knowledge
```

### 2.6 Code Companion

```
SCENARIO: Developer asks "refactor the auth middleware"

MEMORY-POWERED RESPONSE:
  Cortex injects:
  - [PROCEDURAL] Team coding standards (Bun, TypeScript strict, functional)
  - [PROJECT] Auth-v2 project context + related file paths
  - [PREFERENCE] User prefers Zod validation over manual checks
  - [SEMANTIC] Team uses JWT with RS256, refresh token rotation

  → AI generates code that ALREADY matches team standards, uses the right
     libraries, follows the established patterns — zero onboarding friction.
```

### 2.7 Meeting Intelligence

```
SCENARIO: After a meeting, user pastes notes or transcript

EXTRACTION ENGINE BEHAVIOR:
  1. Detect 'meeting' archetype from content patterns
  2. Extract with MEETING-SPECIFIC prompt additions:
     - Action items → PROJECT memories with deadlines
     - Decisions made → FACTUAL memories (high importance)
     - People mentioned → RELATIONSHIP memories
     - Follow-ups → GOAL memories with validUntil dates
  3. Auto-create relationships between extracted memories
  4. Link to the source conversation for audit trail
```

### 2.8 Onboarding Acceleration (Enterprise)

```
SCENARIO: New hire joins — team shares org memory space

DAY 1 CONTEXT:
  From shared org memories:
  - [PROCEDURAL] Git workflow, PR process, deployment runbook
  - [SEMANTIC] Architecture overview, tech stack decisions
  - [RELATIONSHIP] Team roster, reporting structure, key contacts
  - [PROJECT] Active projects, their status, deadlines
  - [PREFERENCE] Team conventions (naming, folder structure, tooling)

  → New hire's AI assistant is immediately as knowledgeable as a
     6-month veteran, reducing ramp-up from weeks to hours.
```

---

## 3. Multi-Tiered Memory Compression System

### 3.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TIERED MEMORY STORAGE                              │
│                                                                              │
│  ┌──────────────────┐                                                        │
│  │  T0: HOT CACHE   │  In-memory LRU · < 5ms access · Last 200 memories     │
│  │  (Active Session) │  Full content + full embeddings · No compression      │
│  └────────┬─────────┘                                                        │
│           │ Evicted after 30 min inactivity                                  │
│           ▼                                                                  │
│  ┌──────────────────┐                                                        │
│  │  T1: WARM STORE  │  SQLite (local) · < 20ms access · Last 5,000 memories │
│  │  (Recent Memory)  │  Full content + quantized embeddings (int8)           │
│  │                   │  LZ4 compression on content · 3x reduction            │
│  └────────┬─────────┘                                                        │
│           │ Promoted ↑ on access, Demoted ↓ after 30 days without access     │
│           ▼                                                                  │
│  ┌──────────────────┐                                                        │
│  │  T2: COLD STORE  │  PostgreSQL · < 100ms access · All active memories     │
│  │  (Long-term)      │  Summarized content + binary-quantized embeddings     │
│  │                   │  zstd compression · 6x reduction                      │
│  └────────┬─────────┘                                                        │
│           │ Demoted ↓ after 90 days without access + importance < 0.4        │
│           ▼                                                                  │
│  ┌──────────────────┐                                                        │
│  │  T3: ARCHIVE     │  IPFS (Helia) · < 2s access · Archived memories       │
│  │  (Deep Storage)   │  Summary-only + dehydrated embedding hash             │
│  │                   │  Brotli max compression · 12-18x reduction            │
│  └──────────────────┘                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Compression Algorithms Per Tier

```typescript
interface TierConfig {
  tierId: 'T0' | 'T1' | 'T2' | 'T3';
  storage: 'memory' | 'sqlite' | 'postgres' | 'ipfs';
  maxItems: number;
  accessLatency: string;

  contentStrategy: ContentCompressionStrategy;
  embeddingStrategy: EmbeddingCompressionStrategy;
  promotionCriteria: PromotionRule;
  demotionCriteria: DemotionRule;
}

// CONTENT COMPRESSION STRATEGIES
type ContentCompressionStrategy =
  | { type: 'none' }                                              // T0
  | { type: 'lz4'; level: number }                                // T1: fast, 3x
  | { type: 'zstd'; level: number; dictTrained: boolean }         // T2: balanced, 6x
  | { type: 'brotli'; quality: number; summaryOnly: boolean };    // T3: max, 12-18x

// EMBEDDING COMPRESSION STRATEGIES
type EmbeddingCompressionStrategy =
  | { type: 'full'; dimensions: 1536; dtype: 'float32' }         // T0: 6,144 bytes
  | { type: 'quantized_int8'; dimensions: 1536 }                 // T1: 1,536 bytes (4x smaller)
  | { type: 'binary_quantized'; dimensions: 1536 }               // T2: 192 bytes (32x smaller)
  | { type: 'hash_only'; algorithm: 'simhash'; bits: 64 };       // T3: 8 bytes (768x smaller)
```

### 3.3 Content Compression Detail

```
T0 (HOT):       Raw content, no compression
  "User prefers TypeScript strict mode with functional patterns for React components"
  → 91 chars = ~23 tokens

T1 (WARM):      LZ4-compressed full content
  LZ4(content) → ~30 bytes (3x reduction)
  Decompression: < 0.1ms (LZ4 is CPU-bound, near-memcpy speed)

T2 (COLD):      zstd-compressed summary
  Original: "User prefers TypeScript strict mode with functional patterns for React components.
             First mentioned on Jan 15 during conversation about project setup.
             Reinforced in 3 subsequent conversations about code review."
  Summary:  "Prefers: TS strict + functional React patterns"
  zstd(summary) → ~15 bytes (6x reduction from original)

T3 (ARCHIVE):   Brotli-max summary-only
  Summary:  "TS strict + functional React"
  brotli(summary, quality=11) → ~8 bytes (12-18x from original)
  Embedding: SimHash(original_embedding) → 8 bytes
```

### 3.4 Embedding Compression Detail

```
FULL (T0):           Float32[1536]     = 6,144 bytes per memory
  [0.0234, -0.0891, 0.1245, ...]
  Full cosine similarity precision

QUANTIZED INT8 (T1): Int8[1536]        = 1,536 bytes per memory (4x smaller)
  Quantization: v_q = round(v * 127 / max(|v|))
  Dequantization: v_f = v_q * max(|v|) / 127
  Similarity loss: < 2% on benchmarks

BINARY QUANTIZED (T2): BitArray[1536]  = 192 bytes per memory (32x smaller)
  Quantization: bit[i] = (v[i] > 0) ? 1 : 0
  Similarity: Hamming distance (XOR + popcount — extremely fast)
  Similarity loss: < 5%, but much faster search

HASH ONLY (T3):      SimHash[64 bits]  = 8 bytes per memory (768x smaller)
  SimHash: locality-sensitive hash preserving cosine similarity
  Used for: "is this memory probably relevant?" pre-filter only
  If hash match → rehydrate from IPFS → full comparison
```

### 3.5 Promotion/Demotion Algorithm

```
PROMOTION (T3 → T2 → T1 → T0):
  Trigger: Memory is accessed (retrieved for context or searched)

  T3 → T2:
    1. Fetch from IPFS by CID
    2. Decompress (Brotli)
    3. Re-generate full embedding if needed
    4. Store in PostgreSQL with zstd compression
    5. Update tier metadata

  T2 → T1:
    1. Decompress from zstd
    2. Re-quantize embedding to int8
    3. Store in local SQLite with LZ4
    4. accessCount++

  T1 → T0:
    1. Decompress from LZ4
    2. Load full float32 embedding
    3. Place in LRU cache
    4. accessCount++

DEMOTION (T0 → T1 → T2 → T3):
  Runs on consolidation schedule (hourly for T0→T1, daily for T1→T2, weekly for T2→T3)

  T0 → T1:
    Criteria: lastAccessedAt > 30 minutes ago
    Action: Compress with LZ4, quantize embedding, write to SQLite

  T1 → T2:
    Criteria: lastAccessedAt > 30 days ago AND accessCount < 5
    Action: Generate summary, compress with zstd, binary-quantize embedding, write to Postgres

  T2 → T3:
    Criteria: lastAccessedAt > 90 days ago AND importance < 0.4 AND NOT isPinned
    Action: Keep summary only, Brotli-max compress, SimHash embedding, pin to IPFS
    Note: NEVER archive pinned memories or importance ≥ 0.8
```

### 3.6 Storage & Performance Budget

| Metric | T0 (Hot) | T1 (Warm) | T2 (Cold) | T3 (Archive) |
|---|---|---|---|---|
| **Storage per memory** | ~6.3 KB | ~1.6 KB | ~0.3 KB | ~0.02 KB |
| **Embedding size** | 6,144 B | 1,536 B | 192 B | 8 B |
| **Content storage** | Raw | LZ4 | zstd summary | Brotli summary |
| **Access latency** | < 5 ms | < 20 ms | < 100 ms | < 2,000 ms |
| **Search method** | Cosine (exact) | Cosine (int8) | Hamming (binary) | SimHash pre-filter |
| **Max items** | 200 | 5,000 | Unlimited | Unlimited |
| **Total storage (10K memories)** | — | 16 MB | 3 MB | 0.2 MB |

### 3.7 Example: 50,000 Memory Portfolio

```
User with 50,000 memories accumulated over 2 years:

Distribution (natural decay):
  T0 (Hot):     150 memories   ×  6.3 KB  =     0.9 MB  (in RAM)
  T1 (Warm):   4,000 memories  ×  1.6 KB  =     6.4 MB  (SQLite)
  T2 (Cold):  30,000 memories  ×  0.3 KB  =     9.0 MB  (Postgres)
  T3 (Archive): 15,850 memories × 0.02 KB =     0.3 MB  (IPFS)
                                           ──────────────
  TOTAL STORAGE:                              16.6 MB

Without compression (all T0):
  50,000 × 6.3 KB = 315 MB

COMPRESSION RATIO: 19x overall

Search performance:
  Hot query (T0):   < 5ms   — covers current session context
  Warm query (T1):  < 20ms  — covers last month of interactions
  Cold query (T2):  < 100ms — covers full active history
  Archive scan (T3): < 2s   — only when specifically requested or SimHash match
```

---

## 4. Extraction Engine: Situation-Aware Prompts

### 4.1 Base Extraction + Situational Overlay

```typescript
function buildExtractionPrompt(
  conversation: NormalizedMessage[],
  situation: DetectedSituation
): string {
  const base = MEMORY_EXTRACTION_PROMPT; // existing 330-line prompt

  // Inject situation-specific extraction guidance
  const overlay = SITUATION_EXTRACTION_OVERLAYS[situation.archetype];

  return `${base}

## Situation-Specific Guidance (${situation.archetype}):
${overlay}

## Priority Extraction Targets:
${situation.archetype === 'project_management' ? `
- Extract ALL project names, deadlines, and owners as PROJECT memories
- Extract blockers and dependencies as high-importance FACTUAL memories
- Extract team decisions as EPISODIC memories with importance ≥ 0.8
- Tag all memories with the project name
` : ''}
${situation.archetype === 'software_engineering' ? `
- Extract coding patterns and preferences as PROCEDURAL memories
- Extract tool/library choices as PREFERENCE memories
- Extract architecture decisions as SEMANTIC memories (importance ≥ 0.85)
- Extract error patterns and solutions as PROCEDURAL memories
- Include language, framework, and version details in tags
` : ''}
${situation.archetype === 'sales_business_dev' ? `
- Extract client names, roles, companies as RELATIONSHIP memories
- Extract deal sizes, stages, and timelines as PROJECT memories
- Extract client preferences and communication style as PREFERENCE memories
- Mark ALL client-related memories as importance ≥ 0.7
` : ''}

Conversation to analyze:`;
}
```

---

*Document Version: 1.0 — March 2026*
*Supplement to: cortex_enterprise_roadmap.md, cortex_pillars_deepdive.md*

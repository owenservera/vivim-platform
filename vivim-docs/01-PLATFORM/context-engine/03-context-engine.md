# VIVIM Context Engine Deep Dive

## Overview

The Context Engine is VIVIM's core innovation - an 8-layer system (L0-L7) that assembles context for AI interactions. It's the "brain" that makes every AI conversation smarter than the last.

---

## Architecture Overview

```
+---------------------------------------------------------------------+
|                         Unified Context Service                      |
|                  (server/src/services/unified-context-service.ts)    |
+---------------------------------------------------------------------+
                                  |
      +------------------------------+------------------------------+
      |                              |                              |
      v                              v                              v
+-------------------+    +-----------------------+    +--------------------+
| Dynamic Context   |    |   Context             |    |   Librarian Worker |
|   Assembler       |    |   Orchestrator        |    |   (Autonomous      |
| (context-assembler|    | (context-orchestrator|    |    Learning)        |
|   .ts)            |    |   .ts)               |    | (librarian-worker) |
+-------------------+    +-----------------------+    +--------------------+
      |                              |                              |
      +------------------------------+------------------------------+
      |                              |                              |
      v                              v                              v
+-------------------+    +-----------------------+    +--------------------+
| Bundle Compiler   |    |   Prediction Engine   |    |   Hybrid Retrieval |
| (bundle-compiler)|    | (prediction-engine)   |    | (hybrid-retrieval) |
+-------------------+    +-----------------------+    +--------------------+
```

---

## Layer-by-Layer Breakdown

### L0: VIVIM Identity (Priority: 100)

**Purpose**: Establishes who VIVIM is - the system identity

**Token Allocation**: 150-500 tokens

**What it contains**:
- VIVIM system prompt defining the AI's identity
- Brand voice guidelines
- Core principles and values
- Operating parameters

**Data Source**: `vivim-identity-service.ts`

**Example**:
```
You are VIVIM, an AI memory assistant that knows the user deeply.
You draw from their archive to provide personalized, context-aware responses.
Always prioritize the user's stored knowledge over generic responses.
```

---

### L1: User Identity (Priority: 95)

**Purpose**: Facts about the user - biography, identity, role memories

**Token Allocation**: 100-800 tokens

**What it contains**:
- User biography facts
- Professional role and background
- Key life events and preferences
- Personal values and goals
- Communication style preferences

**Data Source**: 
- `profile-rollup-service.js`
- User memory database
- Identity service

**Example**:
```
User is a senior software engineer specializing in React and TypeScript.
They work at a Series A startup. Prefers concise, technical responses.
Currently learning about system design and distributed systems.
```

---

### L2: Global Preferences (Priority: 90)

**Purpose**: How VIVIM should respond - custom instructions, preferences

**Token Allocation**: 100-800 tokens

**What it contains**:
- Custom system instructions
- Response format preferences
- Topic preferences/aversions
- Tone and style settings
- Language preferences

**Data Source**: 
- User settings database
- `context-settings.ts`
- Custom instructions stored in profile

**Example**:
```
Always provide code examples when discussing programming.
Use TypeScript for all code snippets.
Include pros/cons for major decisions.
```

---

### L3: Topic Context (Priority: 70-85)

**Purpose**: Current topic being discussed - domain-specific context

**Token Allocation**: 0-25% of remaining budget

**What it contains**:
- Topic profile (e.g., "React", "startup-funding")
- Related concepts and terminology
- User's history with this topic
- Key entities in topic domain
- Topic-specific preferences

**Detection Method**:
- Semantic embedding matching
- Keyword detection
- Conversation history analysis

**Data Source**: 
- Topic profiles in database
- ACU topic tags
- Entity context service

---

### L4: Entity Context (Priority: 65)

**Purpose**: People, projects, and specific entities mentioned

**Token Allocation**: 0-12% of remaining budget

**What it contains**:
- People mentioned (user, colleagues, public figures)
- Projects being worked on
- Companies or organizations
- Products or tools
- Specific codebases or repositories

**Detection Method**:
- Named entity recognition
- Explicit mentions in conversation
- Semantic similarity to known entities

**Data Source**: 
- Entity profiles database
- Conversation analysis
- Project metadata

---

### L5: Conversation Context (Priority: 30-88)

**Purpose**: Current conversation arc and history

**Token Allocation**: 0-20% of remaining budget

**What it contains**:
- Recent messages in current thread
- Conversation intent and goals
- What has been established vs. what's pending
- Questions asked but not answered
- Decisions made in conversation

**Compression Strategies**:
- Summary-based compression
- Key point extraction
- Selective message retention
- Tree-truncation for deep histories

**Data Source**: 
- `conversation-context-engine.ts`
- Message database
- ACU extraction from conversation

---

### L6: JIT Knowledge (Priority: 75)

**Purpose**: Just-in-time retrieved relevant ACUs and memories

**Token Allocation**: 0-18% of remaining budget

**What it contains**:
- ACUs from past conversations relevant to current query
- Semantic search results
- Related facts and decisions
- Prior solutions to similar problems

**Retrieval Method**:
- Hybrid search (semantic + keyword)
- Reciprocal Rank Fusion (RRF)
- Re-ranking by relevance

**Data Source**: 
- `hybrid-retrieval.ts`
- ACU database with embeddings
- Memory store

---

### L7: Message History (Priority: 80-90)

**Purpose**: Full message history (compressed) for continuity

**Token Allocation**: 0-60% of remaining budget (typically smallest)

**What it contains**:
- Full message history (compressed)
- Earlier conversation turns
- Context from earlier sessions

**Compression Methods**:
- Summary compression
- First-message retention
- Important-turn preservation
- Sliding window

**Data Source**: 
- `conversation-context-engine.ts`
- Message database

---

## Token Budget Breakdown

| Layer | Priority | Default Tokens | Max Tokens | % of Budget |
|-------|----------|---------------|------------|-------------|
| L0 (VIVIM Identity) | 100 | 300 | 500 | 2-4% |
| L1 (User Identity) | 95 | 400 | 800 | 3-7% |
| L2 (Preferences) | 90 | 300 | 800 | 2-7% |
| L3 (Topic) | 70-85 | 2000 | 3000 | 0-25% |
| L4 (Entity) | 65 | 1000 | 1500 | 0-12% |
| L5 (Conversation) | 30-88 | 1500 | 2500 | 0-20% |
| L6 (JIT) | 75 | 1500 | 2200 | 0-18% |
| L7 (History) | 80-90 | 1000 | 7000 | 0-60% |

**Total Default Budget**: ~12,300 tokens

---

## Context Assembly Flow

```
User Message
     |
     v
+---------------------------------------------------------------+
| 1. DETECTION (context-assembler.ts)                          |
|    - Embed user message                                       |
|    - Detect topics from conversation history                  |
|    - Match entities via explicit + semantic                   |
|    - Determine if new topic vs continuation                  |
+---------------------------------------------------------------+
     |
     v
+---------------------------------------------------------------+
| 2. BUDGET ALLOCATION (budget-algorithm.ts)                   |
|    - Total budget = user settings (default 12,000)           |
|    - Allocate L0-L1 first (fixed priority)                   |
|    - Distribute remaining to L2-L7 based on:                 |
|      * Knowledge depth setting (minimal/standard/deep)        |
|      * Conversation pressure (tokens vs budget ratio)        |
|      * Topic/entity count                                    |
|      * Active conversation flag                              |
+---------------------------------------------------------------+
     |
     v
+---------------------------------------------------------------+
| 3. BUNDLE GATHERING                                          |
|    - L0: VIVIM Identity (from vivim-identity-service)        |
|    - L1: Identity Core (compile or fetch cached)             |
|    - L2: Global Preferences (compile or fetch cached)         |
|    - L3: Topic Context (per detected topic)                  |
|    - L4: Entity Context (per detected entity)                |
|    - L5: Conversation Context (if continuing)               |
+---------------------------------------------------------------+
     |
     v
+---------------------------------------------------------------+
| 4. JIT RETRIEVAL (hybrid-retrieval.ts)                       |
|    - Hybrid search: semantic (PostgreSQL/pgvector) + keyword  |
|    - Reciprocal Rank Fusion (RRF) for merging                |
|    - Retrieve relevant ACUs and memories                     |
|    - L6: JIT Knowledge (additional context)                  |
+---------------------------------------------------------------+
     |
     v
+---------------------------------------------------------------+
| 5. PROMPT COMPILATION                                        |
|    - Priority-sorted sections                                |
|    - Truncate to fit budget                                   |
|    - Concatenate with VIVIM Identity (L0)                   |
+---------------------------------------------------------------+
     |
     v
   Final System Prompt
```

---

## Key Components

### Core Services

| Service | Purpose | File |
|---------|---------|------|
| `UnifiedContextService` | Main entry point | `unified-context-service.ts` |
| `DynamicContextAssembler` | Budget allocation | `context-assembler.ts` |
| `ContextOrchestrator` | Client presence, prediction | `context-orchestrator.ts` |
| `BundleCompiler` | Compile context bundles | `bundle-compiler.ts` |
| `BudgetAlgorithm` | Token budget distribution | `budget-algorithm.ts` |
| `ConversationContextEngine` | Conversation compression | `conversation-context-engine.ts` |
| `PredictionEngine` | Predict next interactions | `prediction-engine.ts` |
| `HybridRetrievalService` | JIT knowledge retrieval | `hybrid-retrieval.ts` |
| `ContextSettingsService` | User settings | `settings-service.ts` |
| `ContextCache` | LRU cache with TTL | `context-cache.ts` |
| `ContextEventBus` | Event-driven invalidation | `context-event-bus.ts` |

---

## Key Terminology

| Term | Definition |
|------|------------|
| **Context Budget** | Total tokens allocated for context (default ~12,300) |
| **Layer Priority** | Fixed priority order for budget allocation |
| **JIT Retrieval** | Just-in-time fetching of relevant memories |
| **Hybrid Search** | Combining semantic (vector) + keyword search |
| **RRF** | Reciprocal Rank Fusion - merging search results |
| **Context Compression** | Reducing conversation history to fit budget |
| **Bundle** | Compiled context for a specific layer |
| **Prediction Engine** | Anticipates user needs, pre-warms context |

---

## Visual Elements for Landing Page

1. **Layer Stack Visualization**: Show L0-L7 as a vertical stack with tokens flowing in
2. **Budget Pie Chart**: Show token allocation across layers
3. **Assembly Animation**: Animated flow from user message → detection → retrieval → assembly
4. **Context Cockpit**: Real-time dashboard showing what's in context
5. **Token Counter**: Live token count updating as context assembles
6. **JIT Demo**: Show relevant memory popping in as user types

---

## Demo Scenarios

### Scenario 1: First-Time User
- Heavy L0 (VIVIM Identity)
- Heavy L1 (User Identity setup)
- Minimal L3-L7 (no history yet)
- Budget: ~8,000 tokens

### Scenario 2: Regular User (3 months)
- Balanced L0-L7
- Rich L3-L4 (topics, entities)
- Moderate L6 (some JIT)
- Budget: ~12,000 tokens

### Scenario 3: Power User (1 year)
- Efficient L0-L2 (cached)
- Heavy L3-L4 (many topics)
- Heavy L6 (lots of JIT retrieval)
- Complex L7 (compressed history)
- Budget: ~15,000 tokens (expanded)

---

## Technical Highlights

1. **Predictive Pre-compilation**: Anticipates needs, builds context bundles in advance
2. **Event-Driven Invalidation**: Reactive cache updates via event bus
3. **Hybrid Retrieval**: Combines semantic + keyword for best results
4. **Multiple Compression Strategies**: Summary, truncation, selective retention
5. **Per-User Isolation**: 100% isolated context engines
6. **Configurable Depth**: minimal/standard/deep knowledge settings

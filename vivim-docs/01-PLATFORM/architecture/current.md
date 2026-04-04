# VIVIM Context System Architecture

## Executive Summary

The VIVIM Context System is a sophisticated, multi-layered context management architecture designed to provide AI assistants with rich, dynamically assembled contextual information about users, their conversations, topics, entities, and knowledge. The system employs a layered context model (L0-L7), intelligent budget allocation, predictive pre-compilation, and an event-driven invalidation architecture.

**Key Characteristics:**
- **Layered Context Model**: 8 distinct context layers (L0-L7) with priority-based allocation
- **Per-User Isolation**: 100% isolated context engines per user database
- **Predictive Pre-compilation**: Anticipates user needs and pre-builds context bundles
- **Event-Driven Invalidation**: Reactive cache invalidation via an event bus
- **Hybrid Retrieval**: Combines semantic (vector) and keyword search for JIT knowledge
- **Compression Strategies**: Multiple conversation compression strategies for long contexts

---

## 1. Core Architecture

### 1.1 System Overview

```
+---------------------------------------------------------------------+
|                         Unified Context Service                      |
|                    (server/src/services/unified-context-service.ts)  |
+---------------------------------------------------------------------+
                                      |
        +------------------------------+------------------------------+
        |                              |                              |
        v                              v                              v
+-------------------+    +-----------------------+    +--------------------+
| Dynamic Context   |    |   Context             |    |   Librarian Worker |
|   Assembler       |    |   Orchestrator        |    |   (Autonomous      |
| (context-assembler|    | (context-orchestrator |    |    Learning)        |
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
        |
        +------------------------------+------------------------------+
        |                              |                              |
        v                              v                              v
+-------------------+    +-----------------------+    +--------------------+
| Budget Algorithm  |    | Conversation Context  |    |   Context Cache    |
| (budget-algorithm |    |   Engine             |    |   (LRU + TTL +     |
|   .ts)            |    | (conversation-       |    |    Namespaces)      |
|                   |    |   context-engine)    |    |                    |
+-------------------+    +-----------------------+    +--------------------+
```

### 1.2 Key Modules

| Module | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `unified-context-service.ts` | Main entry point, bridges new/old engines | `UnifiedContextService`, `generateContextForChat()` |
| `context-assembler.ts` | Dynamic context assembly with budget allocation | `DynamicContextAssembler`, `assemble()` |
| `context-orchestrator.ts` | Client presence, prediction, bundle warmup | `ContextOrchestrator`, `ingestPresence()` |
| `bundle-compiler.ts` | Compiles context bundles from data sources | `BundleCompiler`, `compileTopicContext()` |
| `budget-algorithm.ts` | Token budget allocation across layers | `BudgetAlgorithm`, `computeBudget()` |
| `conversation-context-engine.ts` | Conversation compression strategies | `ConversationContextEngine`, `buildConversationContext()` |
| `prediction-engine.ts` | Predicts next interactions | `PredictionEngine`, `predictNextInteractions()` |
| `hybrid-retrieval.ts` | L5 JIT knowledge retrieval | `HybridRetrievalService`, `retrieve()` |
| `settings-service.ts` | User context settings management | `ContextSettingsService`, `getSettings()` |
| `context-cache.ts` | In-memory LRU cache with TTL | `ContextCache`, `getContextCache()` |
| `context-event-bus.ts` | Event-driven invalidation | `ContextEventBus`, `on()`, `emit()` |
| `context-pipeline.ts` | Parallel assembly & streaming | `ParallelContextPipeline`, `assembleParallel()` |
| `vivim-identity-service.ts` | VIVIM system identity context | `getVIVIMSystemPrompt()`, `VIVIM_IDENTITY` |

---

## 2. Layered Context Model (L0-L7)

The context system uses 8 distinct layers, each serving a specific purpose with priority-based token allocation.

### 2.1 Layer Definitions

| Layer | Name | Priority | Purpose | Default Allocation |
|-------|------|----------|---------|-------------------|
| **L0** | VIVIM Identity | 100 | Who VIVIM is (system identity) | 150-500 tokens |
| **L1** | User Identity | 95 | Facts about the user (biography, identity, role memories) | 100-800 tokens |
| **L2** | Global Preferences | 90 | How to respond (custom instructions, preferences) | 100-800 tokens |
| **L3** | Topic Context | 70-85 | Current topic being discussed | 0-25% of budget |
| **L4** | Entity Context | 65 | People and projects mentioned | 0-12% of budget |
| **L5** | Conversation Context | 30-88 | Current conversation arc/history | 0-20% of budget |
| **L6** | JIT Knowledge | 75 | Just-in-time retrieved ACUs and memories | 0-18% of budget |
| **L7** | Message History | 80-90 | Full message history (compressed) | 0-60% of budget |

### 2.2 Context Flow

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
|    - Total budget = user settings (default 12,000)            |
|    - Allocate L0-L1 first (fixed priority)                    |
|    - Distribute remaining to L2-L7 based on:                  |
|      * Knowledge depth setting (minimal/standard/deep)        |
|      * Conversation pressure (tokens vs budget ratio)        |
|      * Topic/entity count                                     |
|      * Active conversation flag                               |
+---------------------------------------------------------------+
     |
     v
+---------------------------------------------------------------+
| 3. BUNDLE GATHERING                                           |
|    - L0: VIVIM Identity (from vivim-identity-service)        |
|    - L1: Identity Core (compile or fetch cached)              |
|    - L2: Global Preferences (compile or fetch cached)         |
|    - L3: Topic Context (per detected topic)                   |
|    - L4: Entity Context (per detected entity)                |
|    - L5: Conversation Context (if continuing)                |
+---------------------------------------------------------------+
     |
     v
+---------------------------------------------------------------+
| 4. JIT RETRIEVAL (hybrid-retrieval.ts)                       |
|    - Hybrid search: semantic (PostgreSQL/pgvector) + keyword   |
|    - Reciprocal Rank Fusion (RRF) for merging                |
|    - Retrieve relevant ACUs and memories                    |
|    - L6: JIT Knowledge (additional context)                  |
+---------------------------------------------------------------+
     |
     v
+---------------------------------------------------------------+
| 5. PROMPT COMPILATION                                         |
|    - Priority-sorted sections                                 |
|    - Truncate to fit budget                                   |
|    - Concatenate with VIVIM Identity (L0)                    |
+---------------------------------------------------------------+
     |
     v
   Final System Prompt
```

---

## 3. Context Bundle System

### 3.1 Bundle Types

The system compiles and caches context into **bundles** - pre-generated context snippets stored in the database.

```typescript
// From types.ts
type BundleType = 
  | 'identity_core'      // L0: User identity
  | 'global_prefs'       // L1: User preferences  
  | 'topic'              // L2: Topic-specific context
  | 'entity'             // L3: Entity-specific context
  | 'conversation'       // L4: Conversation arc
  | 'composite';         // Pre-merged bundles
```

### 3.2 Bundle Compilation

**BundleCompiler** (`bundle-compiler.ts`) is responsible for compiling all bundle types:

#### Identity Core (L1)
```typescript
// Compiles from high-importance memories
const coreMemories = await prisma.memory.findMany({
  where: {
    category: { in: ['biography', 'identity', 'role'] },
    importance: { gte: 0.8 }
  },
  take: 15
});
// Output: "## About This User\n- User is a software engineer...\n- User prefers..."
```

#### Global Preferences (L2)
```typescript
// Compiles from custom instructions + preference memories
const [instructions, prefMemories] = await Promise.all([
  prisma.customInstruction.findMany({ where: { scope: 'global' } }),
  prisma.memory.findMany({ where: { category: 'preference', importance: { gte: 0.6 } } })
]);
```

#### Topic Context (L3)
```typescript
// Compiles from topic profile + related memories + ACUs
const topic = await prisma.topicProfile.findUnique({
  where: { userId_slug: { userId, slug } },
  include: { conversations: { take: 10 } }
});
// Includes: proficiency level, engagement stats, instructions, memories, ACUs
```

#### Entity Context (L4)
```typescript
// Compiles from entity profile + related ACUs
const entity = await prisma.entityProfile.findUnique({ where: { id: entityId } });
// Includes: known facts (with confidence), relationship, relevant history
```

#### Conversation Context (L5)
```typescript
// Generates conversation arc via LLM
const summary = await llmService.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'system', content: COMPACTION_PROMPT }, ...messages]
});
// Output: { arc, openQuestions, decisions, currentFocus }
```

### 3.3 Bundle Caching

- **Storage**: `prisma.contextBundle` table
- **Cache Key**: Composite of `userId + bundleType + topicProfileId + entityProfileId + conversationId + personaId`
- **TTL**: Configurable per bundle type:
  - `identity_core`: 24 hours
  - `global_prefs`: 12 hours
  - `topic`: 4 hours
  - `entity`: 6 hours
  - `conversation`: 30 minutes
- **Dirty Flag**: Marked `isDirty=true` when source data changes

---

## 4. Budget Algorithm

### 4.1 Allocation Strategy

The **BudgetAlgorithm** (`budget-algorithm.ts`) implements a sophisticated token allocation system:

```typescript
interface BudgetInput {
  totalBudget: number;           // User's maxContextTokens (default 12,000)
  conversationMessageCount: number;
  conversationTotalTokens: number;
  userMessageTokens: number;
  detectedTopicCount: number;
  detectedEntityCount: number;
  hasActiveConversation: boolean;
  knowledgeDepth: 'minimal' | 'standard' | 'deep';
  prioritizeHistory: boolean;
  availableBundles: Map<string, number>;
}
```

### 4.2 Allocation Order

1. **L7 (User Message)**: Exact tokens for current message
2. **L0 (VIVIM Identity)**: ~2% of budget (150-500 tokens)
3. **L1 (Global Prefs)**: ~3% of budget (100-800 tokens)
4. **Elastic Layers** (L2-L6): Distributed based on:
   - **Priority weight**: Layer's priority / 100
   - **Elasticity**: How willing the layer is to shrink (0-1)
   - **Coverage factor**: How much is already in cached bundles

### 4.3 Adjustment Factors

- **Knowledge Depth Multiplier**:
  - `minimal`: 0.5x
  - `standard`: 1.0x (default)
  - `deep`: 1.5x
- **Conversation Pressure**: Reduces topic/entity allocation when conversation is large
- **Dialogue Heavy Boost**: 1.2x for chat-first users with long conversations

---

## 5. Prediction Engine

### 5.1 Prediction Signals

The **PredictionEngine** (`prediction-engine.ts`) analyzes client presence to predict next interactions:

```typescript
interface PredictedInteraction {
  type: 'continue_conversation' | 'new_on_topic' | 'entity_related' | 'cold_start';
  conversationId?: string;
  topicSlug?: string;
  entityId?: string;
  personaId?: string;
  probability: number;        // 0-1
  requiredBundles: BundleType[];
}
```

### 5.2 Prediction Signals

| Signal | Source | Probability Boost |
|--------|--------|-----------------|
| **Active Conversation** | `presence.activeConversationId` | 0.85 |
| **Visible Sidebar** | `presence.visibleConversationIds` | 0.30 each |
| **Time-of-Day** | `presence.localTime` + topic `peakHour` | 0.2 x importanceScore |
| **Hot Topics** | Topics engaged in last 48h | 0.15 x importanceScore |
| **Active Entities** | Entities mentioned in last 72h | 0.1 x importanceScore |
| **Navigation Pattern** | Bouncing notebook <> chat | Adds topic bundle |
| **Cold Start** | New session, no active conversation | 0.7 |

### 5.3 Context Warmup

**ContextOrchestrator** uses predictions to pre-compile bundles:

```typescript
// From context-orchestrator.ts
for (const prediction of predictions) {
  if (prediction.probability < 0.1) continue;
  
  if (prediction.conversationId) {
    await ensureFreshWithId(userId, 'conversation', prediction.conversationId, 
      () => bundleCompiler.compileConversationContext(userId, prediction.conversationId));
  }
  // Similar for topics and entities
}
```

---

## 6. Hybrid Retrieval (L5 JIT Knowledge)

### 6.1 Retrieval Architecture

The **HybridRetrievalService** (`hybrid-retrieval.ts`) provides just-in-time knowledge retrieval:

```
User Message
     |
     +----------------+----------------+
     v                v                v
+---------+      +------------+     +-------------+
| Semantic |      |  Keyword   |     |   Extract   |
| Search   |      |   Search   |     |  Keywords   |
| (Postgres/ |      |  (Postgres) |     |  from text  |
| Postgres) |      |            |     |             |
+----+------+      +-----+------+     +-------------+
     |                |
     +--------+-------+
              v
    +------------------+
    | Reciprocal Rank  |
    | Fusion (RRF)    |
    | k = 60          |
    | semanticWeight: 0.6
    | keywordWeight: 0.4
    +--------+---------+
             |
             v
      Ranked Results
```

### 6.2 RRF Algorithm

```typescript
// Score = (semanticWeight x RRF_rank) + (keywordWeight x similarity)
const k = 60;
const rrf = 1 / (rank + k);
const combinedScore = (semanticWeight * rrf) + (keywordWeight * (item.similarity || 0));
```

### 6.3 Fallback Strategy

1. **PostgreSQL/pgvector** - Primary for semantic search
2. **PostgreSQL** - Fallback using raw SQL with array operations
3. **Prisma ORM** - Final fallback with recent items

---

## 7. Conversation Compression

### 7.1 Compression Strategies

The **ConversationContextEngine** (`conversation-context-engine.ts`) implements 4 strategies:

| Strategy | Trigger (Compression Ratio) | Description |
|----------|---------------------------|-------------|
| **full** | <=1.0x | Include all messages as-is |
| **windowed** | 1.0-2.5x | Recent 70% full + older summarized |
| **compacted** | 2.5-8.0x | 3-zone: early(summary), middle(key), recent(full) |
| **multi_level** | >8.0x | Hierarchical: chunk 20 msgs each, progressive compression |

### 7.2 Importance Scoring

Messages are scored for inclusion based on:

```typescript
score = 
  + (index / totalCount) * 20        // Recency bias
  + Math.log2(wordCount + 1) * 5    // Length bonus
  + codeBlockCount * 15              // Code presence
  + questionCount * 5                // Questions
  + decisionCount * 10               // Decisions
  + (problemCount) * 5              // Errors/bugs
  + (firstOrLast) * 15;             // Start/end bonus
```

---

## 8. Settings System

### 8.1 Configuration Tiers

**Tier 1: Essential** (Default UI)
- `maxContextTokens`: 4,096 - 50,000 (default: 12,000)
- `responseStyle`: concise | balanced | detailed
- `memoryThreshold`: strict | moderate | permissive
- `focusMode`: chat-first | balanced | knowledge-first

**Tier 2: Advanced**
- `compressionStrategy`: auto | full | windowed | compacted | multi_level | none
- `predictionAggressiveness`: conservative | balanced | aggressive
- `enablePredictions`: boolean
- `enableJitRetrieval`: boolean

**Tier 3: Expert**
- Similarity thresholds (topic, entity, ACU, memory)
- Elasticity overrides per layer
- Custom budget formulas
- Exclusion lists

### 8.2 Presets

```typescript
const SETTINGS_PRESETS = {
  minimal: { maxContextTokens: 4096, prioritizeLatency: true },
  balanced: { maxContextTokens: 12000 },
  knowledge: { maxContextTokens: 32000, cacheAggressively: true },
  developer: { compressionStrategy: 'multi_level', predictionAggressiveness: 'aggressive' },
  privacy: { enablePredictions: false, enableJitRetrieval: false, cacheAggressively: false }
};
```

---

## 9. Caching and Invalidation

### 9.1 Context Cache

**ContextCache** (`context-cache.ts`) provides namespaced LRU caching:

```typescript
const NAMESPACE_CONFIGS = {
  bundle:    { maxEntries: 500, ttlMs: 30 min,  touchOnAccess: true },
  settings:  { maxEntries: 100, ttlMs: 60 min,  touchOnAccess: false },
  presence:  { maxEntries: 200, ttlMs: 5 min,   touchOnAccess: true },
  graph:     { maxEntries: 50,  ttlMs: 15 min,  touchOnAccess: true },
  prediction:{ maxEntries: 200, ttlMs: 2 min,   touchOnAccess: false },
  embedding: { maxEntries: 1000, ttlMs: 60 min, touchOnAccess: true },
};
```

### 9.2 Event-Driven Invalidation

**ContextEventBus** (`context-event-bus.ts`) provides reactive invalidation:

```typescript
// Event types
type ContextEventType =
  | 'memory:created' | 'memory:updated' | 'memory:deleted'
  | 'acu:created' | 'acu:processed' | 'acu:deleted'
  | 'conversation:message_added' | 'conversation:idle' | 'conversation:archived'
  | 'topic:created' | 'topic:updated' | 'topic:merged'
  | 'entity:created' | 'entity:updated' | 'entity:merged'
  | 'instruction:created' | 'instruction:updated' | 'instruction:deleted'
  | 'presence:updated' | 'presence:idle_detected'
  | 'settings:updated';

// Usage
eventBus.on('memory:created', async (event) => {
  if (event.payload.importance >= 0.8) {
    await markBundleDirty(event.userId, 'identity_core');
  }
});
```

---

## 10. Per-User Isolation

### 10.1 Architecture

The context system implements **100% per-user isolation**:

```
+-----------------------------------------------------------------+
|                      Master Database (Prisma)                    |
|                                                                  |
|  +-----------------+  +-----------------+  +-----------------+  |
|  | userId: alice  |  | userId: bob     |  | userId: charlie |  |
|  |                 |  |                 |  |                 |  |
|  | topicProfile   |  | topicProfile   |  | topicProfile   |  |
|  | entityProfile  |  | entityProfile  |  | entityProfile  |  |
|  | memory         |  | memory         |  | memory         |  |
|  | contextBundle  |  | contextBundle  |  | contextBundle  |  |
|  | userContextSet |  | userContextSet |  | userContextSet |  |
|  +-----------------+  +-----------------+  +-----------------+  |
+-----------------------------------------------------------------+
```

### 10.2 Routing

Every context operation requires user identification:

```typescript
// All queries filtered by userId
const bundles = await prisma.contextBundle.findMany({
  where: {
    userId,  // CRITICAL: ensures isolation
    bundleType,
    isDirty: false
  }
});
```

---

## 11. VIVIM Identity Context

### 11.1 System Prompt Generation

**vivim-identity-service.ts** generates the L0 context layer:

```typescript
export function getVIVIMSystemPrompt(): string {
  return `# VIVIM Identity (Who I Am) - READ THIS WHEN USER ASKS ABOUT VIVIM

## VIVIM - Own Your AI

VIVIM is a consumer app focused on capturing, owning, evolving, 
and sharing AI conversations.

## Core Pillars
- **Feed**: Social network for AI conversations
- **Vault**: Personal encrypted knowledge store  
- **Capture**: Extract from any AI platform
- **Chat**: Continue with your own AI keys

## Privacy and Security
- **End-to-End Encryption**: Only you can read your vault
- **Zero-Knowledge Sync**: Servers cannot read your data
- **Local-First**: Data in browser IndexedDB first

...`;
}
```

### 11.2 Identity Data

The identity includes:
- **Pillars**: Feed, Vault, Capture, Chat
- **Capabilities**: Capture, Vault, BYOK, Social, ACU, Search, Sync, Export
- **Providers**: OpenAI, Anthropic, Google, Grok, DeepSeek, Kimi, Qwen, Z.ai, Mistral
- **Privacy Features**: E2E, ZK, Local-first, No AI training, DID**: Common questions and answers

---

## 12. API Endpoints

###
- **FAQ 12.1 Context Routes

**`GET/POST /api/context`** (legacy)
- Get context health
- Trigger warmup

**`/api/v2/context`** (new)
- `GET /topics` - Get user topics
- `GET /entities` - Get user entities
- `GET /bundles` - Get context bundles
- `POST /bundle` - Create bundle
- `GET /conversations` - Get conversations
- `GET /memories` - Get memories
- `POST /memory` - Create memory
- `GET /notebooks` - Get notebooks
- `POST /notebook` - Create notebook
- `POST /notebook/:id/entry` - Add entry
- `GET /settings` - Get context settings
- `PUT /settings` - Update settings
- `GET /stats` - Get context stats
- `GET /acus` - Get ACUs
- `POST /compile` - Compile context
- `POST /search` - Semantic search
- `POST /vector` - Add to vector store

---

## 13. Data Models

### 13.1 Key Prisma Schema

```prisma
model ContextBundle {
  id              String   @id @default(cuid())
  userId          String
  bundleType      String   // identity_core, topic, entity, conversation
  compiledPrompt  String
  tokenCount      Int
  composition     Json?    // { memoryIds, acuIds, instructionIds }
  version         Int      @default(1)
  isDirty         Boolean  @default(false)
  compiledAt      DateTime @default(now())
  expiresAt       DateTime?
  
  // References
  topicProfileId  String?
  entityProfileId String?
  conversationId  String?
  personaId       String?
  
  // Stats
  useCount        Int      @default(0)
  missCount       Int      @default(0)
  lastUsedAt      DateTime?

  @@unique([userId, bundleType, topicProfileId, entityProfileId, conversationId, personaId])
}

model UserContextSettings {
  userId                    String   @id
  maxContextTokens          Int      @default(12000)
  responseStyle             String   @default("balanced")
  memoryThreshold           String   @default("moderate")
  focusMode                 String   @default("balanced")
  compressionStrategy       String   @default("auto")
  predictionAggressiveness  String   @default("balanced")
  enablePredictions         Boolean  @default(true)
  enableJitRetrieval        Boolean  @default(true)
  enableCompression         Boolean  @default(true)
  // ... many more settings fields
  updatedAt                 DateTime @updatedAt
}

model ClientPresence {
  userId                    String
  deviceId                  String
  activeConversationId      String?
  visibleConversationIds    String[]
  activeNotebookId          String?
  activePersonaId           String?
  lastNavigationPath        String?
  navigationHistory         Json?
  predictedTopics           String[]
  predictedEntities         String[]
  isOnline                  Boolean  @default(false)
  lastHeartbeatAt           DateTime @default(now())
  
  @@id([userId, deviceId])
}

model TopicProfile {
  id                String   @id @default(cuid())
  userId            String
  slug              String   // URL-safe identifier
  label             String   // Human-readable name
  proficiencyLevel  String   @default("intermediate")
  importanceScore   Float    @default(0.5)
  engagementStreak  Int      @default(0)
  totalConversations Int    @default(0)
  lastEngagedAt     DateTime @default(now())
  peakHour          Int?     // Hour of day with most engagement
  relatedMemoryIds  String[]
  relatedAcuIds     String[]
  compiledContext   String?
  compiledTokenCount Int?
  isDirty           Boolean  @default(false)
  
  @@unique([userId, slug])
}

model EntityProfile {
  id            String   @id @default(cuid())
  userId        String
  name          String
  type          String   // person, project, organization, tool
  aliases       String[]
  relationship  String?  // User's relationship to entity
  facts         Json?    // [{ fact, confidence, source }]
  importanceScore Float  @default(0.5)
  lastMentionedAt DateTime @default(now())
  
  @@unique([userId, name])
}
```

---

## 14. Performance Characteristics

### 14.1 Target Metrics

| Operation | Target | Mechanism |
|-----------|--------|-----------|
| Context Assembly | <200ms | Parallel fetching, caching |
| Bundle Compilation | <5s (async) | Background warmup |
| Cache Hit Rate | >80% | LRU + TTL + pre-warmup |
| Token Budget Calculation | <5ms | Simple arithmetic |

### 14.2 Optimization Techniques

1. **Parallel Pipeline** (`context-pipeline.ts`): Fetches settings, embedding, conversation concurrently
2. **LRU Caching**: Hot bundles cached in memory
3. **Predictive Warmup**: Pre-compiles likely-needed bundles
4. **Lazy Compilation**: Only compiles bundles when needed
5. **Delta Updates**: Marks bundles dirty vs. full recompilation

---

## 15. Configuration

### 15.1 Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `USE_DYNAMIC_CONTEXT` | Enable new context engine | `true` |
| `LIBRARIAN_ENABLED` | Enable autonomous learning | `false` |
| `COMPACTION_MODEL` | LLM for conversation compression | `glm-4.7-flash` |

### 15.2 Database Requirements

- **PostgreSQL** with:
  - `vector` extension (required for semantic search)
  - JSON support for composition fields
  - Composite unique constraints for bundles

---

## 16. Extension Points

### 16.1 Adding New Bundle Types

1. Add to `BundleType` in `types.ts`
2. Implement compilation in `bundle-compiler.ts`
3. Add to bundle gathering in `context-assembler.ts`
4. Set TTL in `context-orchestrator.ts`

### 16.2 Adding New Prediction Signals

1. Implement signal detection in `prediction-engine.ts`
2. Add to `EnabledSignals` in `settings-types.ts`
3. Wire up in `context-orchestrator.ts`

### 16.3 Custom Compression Strategies

1. Implement in `conversation-context-engine.ts`
2. Add to `CompressionStrategy` type
3. Wire to budget algorithm

---

## 17. Related Documentation

- [VIVIM User Context](./VIVIM_USER_CONTEXT.md) - User-focused context explanation
- [Memory System](./VIVIM_MEMORY_SYSTEM.md) - Memory and ACU architecture
- [Capture Pipeline](./VIVIM_CAPTURE_PIPELINE.md) - How conversations are captured
- [Database Schema](./DATABASE_SCHEMA.md) - Full Prisma schema
- [Architecture Overview](../USERS/01-architecture-overview.md) - High-level system design

---

*Generated: 2026-02-14*
*Source: server/src/context/*
# VIVIM Memory Layer & Context Engine Design
## Comprehensive Architecture Document for AI Chatbot Integration

**Version:** 1.0  
**Last Updated:** March 27, 2026  
**Audience:** System Architects, Integration Engineers, AI/ML Engineers

---

## Executive Summary

This document provides a complete technical specification of the VIVIM Memory Layer and Context Engine — a production-grade system for persistent AI memory, intelligent context assembly, and virtual user identification. It is designed to enable two primary integration patterns:

1. **Virtual User AI Chatbot**: A no-login chatbot that uses device fingerprinting to identify users, build persistent profiles over time, and provide personalized conversations with full memory recall.

2. **Enterprise Customer Service AI**: A full-featured customer service frontend with access to company documents, knowledge bases, conversation history, and intelligent context retrieval.

The system is **model-agnostic**, **privacy-compliant** (GDPR-ready), and **enterprise-scale** with support for multi-tenant deployments, team workspaces, and advanced security features.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Memory Layer Deep Dive](#memory-layer-deep-dive)
3. [Context Engine Architecture](#context-engine-architecture)
4. [Virtual User Identification System](#virtual-user-identification-system)
5. [Data Persistence & Storage](#data-persistence--storage)
6. [Integration Patterns](#integration-patterns)
7. [API Reference](#api-reference)
8. [Security & Compliance](#security--compliance)
9. [Performance & Scaling](#performance--scaling)
10. [Implementation Guide](#implementation-guide)

---

## System Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                │
│  (Web Chatbot, Mobile App, Customer Service Portal, External APIs)     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CORE SERVICES LAYER                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │  Context Engine  │  │  Memory Engine   │  │  Virtual User    │       │
│  │  (8-Layer System)│  │  (Second Brain)  │  │  Identification  │       │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘       │
│           │                      │                      │                 │
│           └──────────────────────┼──────────────────────┘               │
│                                  ▼                                       │
│                    ┌────────────────────────┐                           │
│                    │   AI Model Integration │                           │
│                    │   (Any LLM Provider)   │                           │
│                    └────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │   PostgreSQL     │  │   pgvector       │  │   Redis Cache    │       │
│  │   (Relational)   │  │   (Vector Search)│  │   (Session/Bundle)│      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Responsibility | Key Features |
|-----------|---------------|--------------|
| **Memory Engine** | Persistent knowledge storage | 9 memory types, vector search, conflict detection, consolidation |
| **Context Engine** | Dynamic context assembly | 8-layer architecture, token budget optimization, compression strategies |
| **Virtual User System** | No-login identification | Device fingerprinting, confidence scoring, session management |
| **ACU System** | Granular knowledge units | Atomic Chat Units, knowledge graph, cross-conversation linking |
| **Storage Layer** | Data persistence | PostgreSQL, pgvector, encryption, caching |

### Data Flow: User Interaction

```
User Message
     │
     ▼
┌─────────────────────────┐
│  Virtual User Auth      │ ← Device fingerprint, session token
│  (Identify/Validate)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Context Assembly       │ ← 8-layer context pipeline
│  - Detect topics        │
│  - Gather bundles       │
│  - JIT retrieval        │
│  - Budget allocation    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Memory Retrieval       │ ← Semantic search, relevance scoring
│  - Vector similarity    │
│  - Importance filtering │
│  - Conflict detection   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  LLM Inference          │ ← System prompt + context + message
│  (OpenAI, Anthropic,    │
│   self-hosted, etc.)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Response + Memory      │ ← Extract new memories, update context
│  Extraction             │
└─────────────────────────┘
```

---

## Memory Layer Deep Dive

### Overview

The Memory Engine is VIVIM's "Second Brain" — a sophisticated memory management system that stores, retrieves, and manages user memories with semantic search capabilities. It mimics human memory organization with episodic, semantic, and procedural memory types.

### Memory Types (9 Types)

The system supports **9 distinct memory types**, each optimized for different use cases:

| Type | Category | Description | Use Case Example |
|------|----------|-------------|------------------|
| **EPISODIC** | conversation_summary, event, experience | Specific events, conversations | "Last week we discussed migrating to TypeScript" |
| **SEMANTIC** | knowledge, concept, fact | General understanding, facts | "Python is the user's primary programming language" |
| **PROCEDURAL** | howto, skill, workflow | How-to knowledge, skills | "User prefers TDD methodology with Jest" |
| **FACTUAL** | biography, fact_about_user, background | User facts, bio, background | "User works as a senior engineer at TechCorp" |
| **PREFERENCE** | like, dislike, style | Likes, dislikes, preferences | "Prefers dark mode IDE and concise responses" |
| **IDENTITY** | role, identity, bio, values | Core identity information | "User is a full-stack developer specializing in React" |
| **RELATIONSHIP** | person_info, relationship, contact | People, contacts, relationships | "John is the user's tech lead and mentor" |
| **GOAL** | goal, plan, intention | Goals, plans, intentions | "User wants to launch MVP by Q2 2026" |
| **PROJECT** | project, task, deliverable | Project-specific context | "E-commerce platform uses Next.js and Stripe" |

### Memory Service API

```typescript
interface MemoryService {
  // Create
  createMemory(userId: string, input: CreateMemoryInput): Promise<MemoryWithRelations>;
  createMemoriesBatch(userId: string, inputs: CreateMemoryInput[]): Promise<MemoryWithRelations[]>;

  // Read
  getMemoryById(userId: string, memoryId: string): Promise<MemoryWithRelations | null>;
  searchMemories(userId: string, input: MemorySearchInput): Promise<SearchResult>;
  retrieveForContext(userId: string, options: MemoryRetrievalOptions): Promise<MemoryRetrievalResult>;
  getMemoriesByConversation(userId: string, conversationId: string): Promise<MemoryWithRelations[]>;
  getPinnedMemories(userId: string): Promise<MemoryWithRelations[]>;

  // Update
  updateMemory(userId: string, memoryId: string, input: UpdateMemoryInput): Promise<MemoryWithRelations>;
  togglePin(userId: string, memoryId: string): Promise<MemoryWithRelations>;
  archiveMemory(userId: string, memoryId: string): Promise<MemoryWithRelations>;
  restoreMemory(userId: string, memoryId: string): Promise<MemoryWithRelations>;

  // Delete
  deleteMemory(userId: string, memoryId: string): Promise<void>;
  deleteMemories(userId: string, memoryIds: string[]): Promise<number>;

  // Analytics
  getStatistics(userId: string): Promise<MemoryStatistics>;
}
```

### Memory Creation Example

```typescript
const memory = await memoryService.createMemory(userId, {
  content: 'User prefers dark mode for all their coding environments',
  memoryType: 'PREFERENCE',
  category: 'interface',
  importance: 0.8,
  tags: ['preference', 'ui', 'coding'],
  sourceConversationIds: [conversationId],
});
```

### Memory Extraction Engine

The system automatically extracts memories from conversations using LLM-powered analysis:

```typescript
const extractor = new MemoryExtractionEngine({
  prisma,
  llmService,
  config: { confidenceThreshold: 0.7 },
});

const memories = await extractor.extractFromConversation(userId, conversationId, {
  messageRange: { from: 0, to: 50 },
  extractTypes: ['EPISODIC', 'FACTUAL', 'PREFERENCE', 'GOAL'],
});
```

**Extraction Process:**

1. **Analyze conversation** with LLM to identify memorable content
2. **Classify** each potential memory by type and category
3. **Assign confidence scores** based on clarity and importance
4. **Generate embeddings** for semantic search
5. **Check for conflicts** with existing memories
6. **Store** with appropriate metadata and lineage

### Memory Retrieval Service

Intelligent retrieval with relevance scoring:

```typescript
const contextMemories = await memoryService.retrieveForContext(userId, {
  maxTokens: 2000,
  preferredTypes: ['EPISODIC', 'FACTUAL', 'PREFERENCE'],
  minImportance: 0.3,
  includePinned: true,
  contextMessage: 'Can you help me configure my IDE?',
});
```

**Retrieval Strategy:**

1. **Semantic search** using pgvector similarity
2. **Importance filtering** (threshold-based)
3. **Type prioritization** (preferred vs excluded types)
4. **Pinned memory inclusion** (always included)
5. **Token budget fitting** (truncate if needed)
6. **Relevance scoring** (recency + access count + importance)

### Conflict Detection

Automatically detects contradictory memories:

```typescript
const conflicts = await conflictDetectionService.checkForConflicts(
  userId,
  newContent,
  category,
  excludeMemoryId
);

for (const conflict of conflicts) {
  if (conflict.hasConflict && conflict.confidence > 0.7) {
    await conflictDetectionService.createConflict(
      userId,
      newMemoryId,
      conflictingMemoryId,
      conflict.conflictType,
      conflict.confidence,
      conflict.explanation,
      conflict.suggestedResolution
    );
  }
}
```

**Conflict Types:**

- `contradiction`: Direct logical conflict
- `outdated`: Newer information supersedes old
- `duplicate`: Same information, different wording

**Resolution Strategies:**

- `merge`: Combine both memories
- `archive`: Keep newest, archive old
- `keep_newest`: Replace with new
- `manual`: Flag for user review

### Memory Consolidation

Merges similar memories to reduce noise:

```typescript
await consolidator.consolidate(userId, {
  targetTypes: ['EPISODIC'],
  similarityThreshold: 0.8,
  maxMemories: 100,
});
```

### Embedding-Based Search

Using pgvector for semantic similarity:

```typescript
// Generate embedding for query
const queryEmbedding = await embeddingService.embed("user's programming skills");

// Semantic search
const similarMemories = await prisma.$queryRaw`
  SELECT
    id,
    content,
    1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM memories
  WHERE "userId" = ${userId}
    AND "memoryType" = 'PROCEDURAL'
    AND embedding IS NOT NULL
    AND "isActive" = true
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`;
```

### Memory Analytics

```typescript
const stats = await memoryService.getStatistics(userId);

console.log({
  totalMemories: stats.totalMemories,
  byType: stats.byType,           // { EPISODIC: 100, SEMANTIC: 50, ... }
  byImportance: {
    critical: stats.byImportance.critical,  // importance >= 0.9
    high: stats.byImportance.high,          // 0.7-0.9
    medium: stats.byImportance.medium,      // 0.4-0.7
    low: stats.byImportance.low,            // < 0.4
  },
  avgImportance: stats.avgImportance,
  avgRelevance: stats.avgRelevance,
  pinnedCount: stats.pinnedCount,
  archivedCount: stats.archivedCount,
  totalAccesses: stats.totalAccesses,
});
```

### Memory Data Model

```prisma
model Memory {
  // Core
  id          String   @id @default(uuid())
  userId      String
  content     String   // ENCRYPTED
  summary     String?  // ENCRYPTED

  // Type & Category
  memoryType  MemoryType  // EPISODIC, SEMANTIC, etc.
  category    String
  subcategory String?
  tags        String[]

  // Importance & Relevance
  importance  Float   @default(0.5)  // 0.0-1.0
  relevance   Float   @default(0.0)
  accessCount Int     @default(0)

  // Embeddings
  embedding   Unsupported("vector(1536)")?
  embeddingModel String?
  embeddingDimension Int?

  // Temporal
  occurredAt  DateTime?
  validFrom   DateTime?
  validUntil  DateTime?
  expiresAt   DateTime?

  // Hierarchy
  parentMemoryId   String?
  childMemoryIds   String[]
  relatedMemoryIds String[]

  // Consolidation
  consolidationStatus MemoryConsolidationStatus

  // Status
  isActive    Boolean @default(true)
  isPinned    Boolean @default(false)
  isArchived  Boolean @default(false)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Indexes
  @@index([userId, memoryType])
  @@index([userId, importance(sort: Desc)])
  @@index([userId, embedding])
}
```

---

## Context Engine Architecture

### Overview

The Dynamic Context Engine is VIVIM's intelligent context assembly system. It dynamically builds context prompts by combining multiple layers of information, optimizing for token budget while maintaining relevance.

### 8-Layer Context Architecture

The engine uses an **8-layer system** (L0-L7) for organized context assembly:

| Layer | Name | Priority | Typical Budget | Description | Elasticity |
|-------|------|----------|----------------|-------------|------------|
| **L0** | Identity Core | 100 | 200-500 tokens | User's core identity, bio, role | 0.0 (non-negotiable) |
| **L1** | Global Preferences | 95 | 100-300 tokens | User preferences, defaults | 0.1 |
| **L2** | Topic Context | 80 | 500-2000 tokens | Active topic profiles | 0.6 |
| **L3** | Entity Context | 70 | 300-1500 tokens | Related entity profiles (people, projects, tools) | 0.7 |
| **L4** | Conversation Arc | 60 | 200-800 tokens | Conversation summary, key decisions | 0.3 |
| **L5** | JIT Knowledge | 50 | 500-2000 tokens | Just-in-time retrieved knowledge (ACUs, memories) | 0.5 |
| **L6** | Message History | 80-90 | 1000-8000 tokens | Recent message history (compressed) | 0.4 |
| **L7** | User Message | 100 | 50-500 tokens | Current user message | 0.0 (exact size) |

**Elasticity** defines how much a layer can shrink under token pressure:
- 0.0 = Cannot be compressed
- 1.0 = Fully elastic (can be completely removed)

### Context Assembly Pipeline

```
User Message
     │
     ▼
┌─────────────────────────┐
│  1. Context Detection   │
│  - Topic matching       │
│  - Entity matching      │
│  - Intent detection     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  2. Bundle Gathering    │
│  - L0: Identity         │
│  - L1: Preferences      │
│  - L2: Topics           │
│  - L3: Entities         │
│  - L4: Conversation     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  3. JIT Retrieval (L5)  │
│  - Semantic search      │
│  - ACU retrieval        │
│  - Memory fetch         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  4. Budget Allocation   │
│  - Thermodynamics       │
│  - Priority logic       │
│  - Token distribution   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  5. Prompt Assembly     │
│  - Layer ordering       │
│  - Truncation           │
│  - Final compilation    │
└───────────┬─────────────┘
            │
            ▼
      System Prompt
```

### ContextAssembler API

```typescript
interface DynamicContextAssembler {
  assemble(params: AssemblyParams): Promise<AssembledContext>;
}

interface AssemblyParams {
  userId: string;
  conversationId: string;
  userMessage: string;
  modelId?: string;
  providerId?: string;
  personaId?: string;
  recipeId?: string;  // Context Recipe for customization
  settings?: {
    maxContextTokens?: number;
    knowledgeDepth?: 'shallow' | 'standard' | 'deep';
    prioritizeConversationHistory?: boolean;
  };
}

interface AssembledContext {
  systemPrompt: string;
  budget: ComputedBudget;
  bundlesUsed: string[];
  metadata: {
    assemblyTimeMs: number;
    detectedTopics: number;
    detectedEntities: number;
    cacheHitRate: number;
    conversationStats: {
      messageCount: number;
      totalTokens: number;
      hasConversation: boolean;
    };
    bundlesInfo: Array<{
      id: string;
      type: string;
      title: string;
      tokenCount: number;
      snippet: string;
    }>;
  };
}
```

### Budget Thermodynamics

The **ContextThermodynamics** system optimizes token allocation across layers:

**Energy Calculation:**
Each context piece has "energy" based on:
- **Recency**: More recent = higher energy
- **Relevance**: Detected relevance score
- **Importance**: User-defined importance

**Budget Distribution:**
1. Calculate total "energy" across all layers
2. Distribute tokens proportionally to energy
3. Respect minimum floors per layer
4. Handle conflicts (multiple layers want same tokens)
5. Preserve critical context (L0, L7 always included)

**Example Budget Computation:**

```typescript
const budget = assembler.computeBudget({
  totalBudget: 12000,
  conversationMessageCount: 150,
  conversationTotalTokens: 8500,
  userMessageTokens: 50,
  detectedTopicCount: 2,
  detectedEntityCount: 1,
  hasActiveConversation: true,
  knowledgeDepth: 'standard',
  prioritizeHistory: true,
  availableBundles: new Map([
    ['identity_core', 300],
    ['global_prefs', 200],
    ['topic', 1200],
    ['entity', 800],
    ['conversation', 2500],
  ]),
});
```

### Compression Strategies

The engine automatically selects compression strategies based on conversation size:

**Compression Ratio** = `totalTokens / totalBudget`

| Strategy | Ratio | Description | Use Case |
|----------|-------|-------------|----------|
| **Full** | ≤ 1.0 | No compression needed | Short conversations (< 50 messages) |
| **Windowed** | ≤ 2.5 | Keep recent, summarize older | Medium conversations (50-150 messages) |
| **Compacted** | ≤ 8.0 | Zone-based compression | Long conversations (150-500 messages) |
| **Multi-Level** | > 8.0 | Hierarchical chunk compression | Very long conversations (500+ messages) |

**Zone-Based Compression (Compacted Strategy):**

```
Zone A (0-40%):   Highly compressed summary     [10% of budget]
Zone B (40-75%):  Key messages selected         [25% of budget]
Zone C (75-100%): Recent messages in full       [65% of budget]
```

**Multi-Level Compression:**

```
Ancient (chunks 0-30%):   Second-level summary    [5% of budget]
Older (chunks 30-60%):    First-level summary     [10% of budget]
Middle (chunks 60-90%):   Key exchanges           [15% of budget]
Recent (last chunk):      Full messages           [70% of budget]
```

### Message Importance Scoring

The engine scores each message to determine what to keep during compression:

```typescript
function scoreMessageImportance(message, index, totalCount): number {
  let score = 0;

  // Recency weight (later messages more important)
  score += (index / totalCount) * 20;

  // Word count (longer = more informative)
  const wordCount = text.split(/\s+/).length;
  score += Math.min(25, Math.log2(wordCount + 1) * 5);

  // Code blocks (technical content valuable)
  const codeBlockCount = (text.match(/```/g) || []).length / 2;
  score += codeBlockCount * 15;

  // Questions (indicates open issues)
  const questionCount = (text.match(/\?/g) || []).length;
  score += Math.min(15, questionCount * 5);

  // Decisions (critical to preserve)
  const decisionPatterns = /\b(decided|decision|let's go with|agreed|final)\b/gi;
  const decisionCount = (text.match(decisionPatterns) || []).length;
  score += decisionCount * 10;

  // Problems (bugs, issues to track)
  const problemPatterns = /\b(error|bug|issue|problem|failed|broken)\b/gi;
  const problemCount = (text.match(problemPatterns) || []).length;
  score += Math.min(15, problemCount * 5);

  // Position bonuses (first/last messages)
  if (message.role === 'user') score += 5;
  if (index === 0 || index === totalCount - 1) score += 15;

  return score;
}
```

### Context Caching

**Bundle Caching:**
- Pre-compiled bundles cached for 5 minutes
- Cache invalidation on conversation updates
- Priority-based bundle selection

**Cache Entry:**

```typescript
interface CacheEntry {
  key: string;        // e.g., "ctx:userId:convId:messageSnippet"
  value: AssembledContext;
  expiresAt: Date;    // TTL: 5 minutes
  hitCount: number;
}
```

**Invalidation Events:**

- New message in conversation
- Memory updated (created, updated, deleted)
- User settings changed
- Topic profile updated
- Entity profile updated
- ACU created or modified

### Context Recipes (Customization)

Context Recipes allow per-user or per-use-case customization of the context assembly:

```typescript
interface ContextRecipe {
  id: string;
  userId?: string;     // null = system default
  isDefault: boolean;

  // Layer customization
  excludedLayers: string[];           // ['L5_jit']
  layerWeights: Record<string, number>; // { L2_topic: 90, L3_entity: 80 }
  customBudget?: number;              // Override total budget

  // Behavior
  knowledgeDepth: 'shallow' | 'standard' | 'deep';
  prioritizeHistory: boolean;
  compressionStrategy: 'auto' | 'conservative' | 'aggressive';
}
```

**Usage Example:**

```typescript
// Customer service bot recipe
const customerServiceRecipe = {
  excludedLayers: ['L1_global_prefs'],  // Don't include user prefs
  layerWeights: {
    L0_identity: 100,
    L2_topic: 95,      // High priority on topic
    L4_conversation: 90,  // Conversation context important
  },
  customBudget: 8000,
  knowledgeDepth: 'deep',
  prioritizeHistory: true,
};
```

### Context Bundle Compiler

Pre-compiles context bundles for fast retrieval:

```typescript
class BundleCompiler {
  async compileIdentityCore(userId: string): Promise<ContextBundle>;
  async compileGlobalPrefs(userId: string): Promise<ContextBundle>;
  async compileTopicContext(userId: string, topicSlug: string): Promise<ContextBundle>;
  async compileEntityContext(userId: string, entityId: string): Promise<ContextBundle>;
  async compileConversationContext(userId: string, conversationId: string): Promise<ContextBundle>;
}
```

**Bundle TTL (Time-To-Live):**

| Bundle Type | TTL |
|-------------|-----|
| identity_core | 24 hours |
| global_prefs | 12 hours |
| topic | 4 hours |
| entity | 6 hours |
| conversation | 30 minutes |

### Context Prediction & Prefetch

**Prediction Engine:**
Predicts what context will be needed for upcoming interactions:

```typescript
const predictions = await predictionEngine.predictNextInteractions(userId, presence);

// Returns:
[
  {
    type: 'topic_related',
    topicSlug: 'react-hooks',
    probability: 0.85,
    confidence: 0.72,
  },
  {
    type: 'entity_related',
    entityId: 'project-xyz',
    probability: 0.65,
    confidence: 0.58,
  },
]
```

**Prefetch Engine:**
Proactively warms up predicted bundles:

```typescript
await prefetchEngine.warmupBundles(userId, predictions);
```

### Context Telemetry

Tracks context quality and performance:

```typescript
interface ContextTelemetry {
  assemblyTimeMs: number;
  cacheHitRate: number;
  tokenUtilization: number;  // used / budget
  compressionRatio: number;
  layerUsage: Record<string, number>;
  anomalyScore: number;      // Detect unusual patterns
}
```

---

## Virtual User Identification System

### Overview

A comprehensive **no-login identification system** that creates and manages virtual user identities based on device fingerprinting, behavioral patterns, and persistent identifiers. Users get the full suite of memory and context features without requiring traditional authentication.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ Fingerprint │  │ Virtual      │  │ Memory/Context      │    │
│  │ SDK         │  │ Session Mgr  │  │ API Client          │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
│         │                │                       │               │
│         ▼                ▼                       ▼               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Virtual User Identification Layer           │    │
│  │  - Device Fingerprint  - Cookie/LocalStorage             │    │
│  │  - IP/UA Matching      - Behavioral Signals              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Server                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Virtual User Identification API              │   │
│  │  POST /api/v1/virtual/identify  - Identify or create      │   │
│  │  GET  /api/v1/virtual/profile   - Get virtual profile     │   │
│  │  POST /api/v1/virtual/merge     - Merge virtual users     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Virtual User Manager Service                 │   │
│  │  - Fingerprint matching  - Identity resolution            │   │
│  │  - Profile building      - Merge/split logic              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Device Fingerprinting Service                   │   │
│  │  - Canvas/WebGL fingerprints  - Audio context             │   │
│  │  - Font detection           - Hardware concurrency        │   │
│  │  - Screen/battery info      - IP/Timezone analysis        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Identification Signals

**Primary Signals (High Confidence):**

| Signal | Description | Persistence | Confidence Weight |
|--------|-------------|-------------|-------------------|
| **Device Fingerprint** | Canvas + WebGL + Audio + Fonts | Very High | 40% |
| **Virtual User Cookie** | Secure HttpOnly session cookie | Medium | 30% |
| **IP + User Agent + Timezone** | Network/browser signature | Low-Medium | 15% |
| **Screen/Battery/Touch** | Hardware characteristics | High | 15% |

**Secondary Signals (Supporting):**

| Signal | Description | Use Case |
|--------|-------------|----------|
| **Behavioral Patterns** | Typing rhythm, mouse movement | Continuous verification |
| **Local Storage Token** | Persistent identifier | Cookie fallback |
| **TLS Fingerprint** | JA3/TLS signature | Advanced identification |
| **WebRTC Leak** | Local IP addresses | Additional signal |

### Fingerprint Components

**Canvas Fingerprint:**
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.textBaseline = 'top';
ctx.font = '14px Arial';
ctx.fillText('VIVIM Fingerprint', 2, 2);
const hash = hashImage(canvas);  // SHA-256 of canvas data
```

**WebGL Fingerprint:**
```javascript
const gl = canvas.getContext('webgl');
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
const hash = hashString(`${vendor}:${renderer}`);
```

**Audio Fingerprint:**
```javascript
const audioCtx = new AudioContext();
const oscillator = audioCtx.createOscillator();
const analyser = audioCtx.createAnalyser();
oscillator.connect(analyser);
oscillator.start();
const data = new Float32Array(analyser.frequencyBinCount);
analyser.getFloatFrequencyData(data);
const hash = hashArray(data);
```

**Font Detection:**
```javascript
const baseFonts = ['monospace', 'sans-serif', 'serif'];
const testFonts = ['Arial', 'Verdana', 'Times New Roman', ...];  // 50+ fonts
const detectedFonts = testFonts.filter(font => isFontInstalled(font));
```

### Confidence Scoring

```typescript
interface IdentificationConfidence {
  score: number;        // 0-100
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: {
    fingerprint: number;   // 0-100
    cookie: number;        // 0-100
    ip_ua: number;         // 0-100
    behavioral: number;    // 0-100
  };
  threshold: {
    auto_identify: 75;     // Auto-identify if >= 75
    suggest_merge: 60;     // Suggest merge if >= 60
    create_new: 0;         // Create new virtual user
  };
}
```

**Confidence Levels:**

- **HIGH (≥75)**: Auto-identify, load existing user
- **MEDIUM (60-74)**: Suggest merge ("We found a previous session, is this you?")
- **LOW (<60)**: Create new virtual user

### Virtual User Lifecycle

**First Visit (New User):**

```
1. User visits website
2. SDK generates device fingerprint (canvas, webgl, audio, fonts, etc.)
3. POST /api/v1/virtual/identify with fingerprint + signals
4. No match found → Create new VirtualUser
5. Generate virtual user ID (uuid)
6. Store encrypted fingerprint signals
7. Create session (30-day expiration)
8. Set HttpOnly cookie
9. Return profile with consentRequired: true
10. Show consent modal to user
11. User accepts → POST /api/v1/virtual/consent
12. User can now chat and create memories
```

**Returning User:**

```
1. User returns to website
2. SDK generates fingerprint
3. Check existing session token (cookie/localStorage)
4. POST /api/v1/virtual/identify with fingerprint + existing token
5. Match found with HIGH confidence (≥75)
6. Load existing VirtualUser profile
7. Load memories from past conversations
8. Restore context and session
9. User continues seamlessly
```

**Profile Building Over Time:**

```
1. User chats with AI chatbot
2. Conversations stored in VirtualConversation
3. Memory extraction (LLM-powered) creates VirtualMemory
4. Topic interests updated based on conversations
5. Entity profiles created for mentioned people/projects
6. Context bundles rebuilt with new knowledge
7. Next conversation: full context restored
8. User experience improves with each interaction
```

### Virtual User Manager API

```typescript
interface VirtualUserManager {
  // Identification
  identifyOrCreate(request: IdentifyRequest): Promise<IdentifyResponse>;
  
  // CRUD
  getVirtualUserById(id: string): Promise<VirtualUser | null>;
  getVirtualUserProfile(id: string): Promise<VirtualUserProfile | null>;
  
  // Consent & Privacy
  updateConsent(id: string, consentGiven: boolean, policy: string): Promise<void>;
  anonymizeVirtualUser(id: string): Promise<void>;
  deleteVirtualUser(id: string): Promise<void>;
  
  // Merging
  mergeVirtualUsers(options: MergeOptions): Promise<{ success: boolean }>;
  
  // Profile Updates
  updateProfile(id: string, updates: ProfileUpdates): Promise<void>;
  incrementConversationCount(id: string): Promise<void>;
  incrementMemoryCount(id: string, count: number): Promise<void>;
}
```

### Virtual User Database Schema

```prisma
model VirtualUser {
  id                    String    @id @default(uuid())
  fingerprint           String    @unique  // Composite fingerprint hash
  confidenceScore       Float     @default(50)

  // Identification signals (encrypted)
  fingerprintSignals    Json      // Raw fingerprint components
  ipHistory             Json      // Historical IP addresses
  userAgentHistory      Json      // Historical user agents
  deviceCharacteristics Json      // Screen, battery, touch, etc.

  // Profile (built over time)
  displayName           String?   // Auto-generated or user-provided
  topicInterests        Json      @default("[]")
  entityProfiles        Json      @default("[]")
  conversationCount     Int       @default(0)
  memoryCount           Int       @default(0)
  firstSeenAt           DateTime  @default(now())
  lastSeenAt            DateTime  @updatedAt
  lastIpAddress         String?

  // Privacy & compliance
  consentGiven          Boolean   @default(false)
  consentTimestamp      DateTime?
  dataRetentionPolicy   String    @default("90_days")
  anonymizedAt          DateTime?
  deletedAt             DateTime?

  // Relations
  sessions              VirtualSession[]
  memories              VirtualMemory[]
  conversations         VirtualConversation[]
  acus                  VirtualACU[]
  notebooks             VirtualNotebook[]

  @@index([fingerprint])
  @@index([lastSeenAt])
  @@index([confidenceScore])
}

model VirtualSession {
  id              String    @id @default(uuid())
  virtualUserId   String
  virtualUser     VirtualUser @relation(...)

  sessionToken    String    @unique
  fingerprint     String

  // Session signals
  ipAddress       String?
  userAgent       String?
  timezone        String?
  language        String?
  screenResolution String?

  // Session state
  isActive        Boolean   @default(true)
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  lastActivityAt  DateTime  @updatedAt

  // Context state
  activeConversationId String?
  contextBundleVersion String?

  @@index([virtualUserId])
  @@index([sessionToken])
  @@index([expiresAt])
}
```

### Privacy & Compliance

**Data Retention Policies:**

| Policy | Duration | Auto-delete |
|--------|----------|-------------|
| **7_days** | 7 days | Yes |
| **30_days** | 30 days | Yes |
| **90_days** | 90 days | Yes (default) |
| **1_year** | 1 year | Yes |
| **indefinite** | Until manual delete | No |

**GDPR Compliance:**

- **Consent Required**: Before storing any virtual user data
- **Right to Access**: Export all virtual user data
- **Right to Erasure**: Complete deletion with cascade
- **Data Portability**: JSON export format
- **Transparency**: Access audit logs

**Anonymization Process:**

```typescript
async function anonymizeVirtualUser(virtualUserId: string) {
  // 1. Remove PII from memories
  await memoryService.anonymizeContent(virtualUserId);

  // 2. Hash fingerprint signals
  await virtualUserManager.hashSignals(virtualUserId);

  // 3. Remove IP history
  await virtualUserManager.clearIpHistory(virtualUserId);

  // 4. Delete sessions
  await virtualSessionManager.deleteAll(virtualUserId);

  // 5. Mark as anonymized
  await db.virtualUser.update({
    where: { id: virtualUserId },
    data: {
      anonymizedAt: new Date(),
      fingerprintSignals: {},
      ipHistory: [],
      userAgentHistory: [],
      deviceCharacteristics: {},
    }
  });
}
```

### Frontend SDK

**Installation:**

```bash
npm install @vivim/virtual-user-sdk
```

**Usage:**

```typescript
import { VirtualUserSDK } from '@vivim/virtual-user-sdk';

const sdk = new VirtualUserSDK({
  apiUrl: 'https://api.vivim.com',
  consentRequired: true,
  autoIdentify: true,
  dataRetentionPolicy: '90_days'
});

// Initialize and identify user
await sdk.initialize();

// Get virtual user state
const state = sdk.getState();
console.log(state.virtualUserId);
console.log(state.confidence);
console.log(state.profile);

// Listen for events
sdk.on('identified', (data) => {
  console.log('User identified:', data);
});

sdk.on('consentRequired', () => {
  showConsentModal();
});

// Give consent
await sdk.giveConsent({
  dataRetentionPolicy: '90_days'
});

// Chat with context
const response = await sdk.chat({
  message: 'Hello, remember me?',
  conversationId: 'optional_id'
});

// Export data
const exportData = await sdk.exportData();
```

---

## Data Persistence & Storage

### Database Architecture

**PostgreSQL with Extensions:**

```prisma
datasource db {
  provider   = "postgresql"
  extensions = [pgvector(map: "vector")]
}
```

**Key Extensions:**

- **pgvector**: Vector embeddings for semantic search (1536 dimensions)
- **pgcrypto**: Encryption at rest
- **uuid-ossp**: UUID generation

### Core Database Models

**40+ models** organized into layers:

**Identity Layer:**
- `User` - DID-based identity with cryptographic keys
- `Device` - Multi-device support with trust management
- `ApiKey` - API key management
- `VerificationRecord` - Email/phone verification

**Context Layer:**
- `ContextBundle` - Pre-compiled context bundles with TTL
- `TopicProfile` - User topic interests with embeddings
- `EntityProfile` - People, projects, tools with embeddings
- `ConversationCompaction` - Summarized conversation history
- `ClientPresence` - Real-time client state tracking

**Memory Layer:**
- `Memory` - 9 memory types with vector embeddings
- `MemoryConflict` - Contradictory memory tracking
- `MemoryRelationship` - Graph connections between memories
- `MemoryAnalytics` - Aggregated statistics

**ACU (Atomic Chat Unit) Layer:**
- `AtomicChatUnit` - Decomposed knowledge units with quality scores
- `AcuLink` - Relationships between ACUs (knowledge graph)
- `Notebook` / `NotebookEntry` - User collections

**Social Layer:**
- `Circle` / `CircleMember` - Sharing groups
- `Friend` / `Follow` - Social network relations
- `Group` / `Team` - Collaboration structures
- `SharingPolicy` - Content sharing rules

**Virtual User Layer:**
- `VirtualUser` - Virtual user identity
- `VirtualSession` - Session management
- `VirtualMemory` - Memory for virtual users
- `VirtualConversation` - Conversations for virtual users
- `VirtualACU` - ACUs for virtual users

### Vector Search (pgvector)

**Semantic Search Query:**

```typescript
// Find similar memories
const similarMemories = await prisma.$queryRaw`
  SELECT
    id,
    content,
    1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM memories
  WHERE "userId" = ${userId}
    AND "memoryType" = 'SEMANTIC'
    AND embedding IS NOT NULL
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`;
```

**Hybrid Search (Semantic + Keyword):**

```typescript
const hybridResults = await prisma.$queryRaw`
  SELECT
    id,
    content,
    1 - (embedding <=> ${queryEmbedding}::vector) as semantic_sim,
    ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) as text_rank
  FROM memories
  WHERE "userId" = ${userId}
    AND (
      embedding <=> ${queryEmbedding}::vector < 0.5
      OR to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
    )
  ORDER BY (1 - (embedding <=> ${queryEmbedding}::vector)) * 0.7 
         + ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) * 0.3 
         DESC
  LIMIT 20
`;
```

### Indexing Strategy

| Table | Index Type | Purpose |
|-------|------------|---------|
| `memories` | B-tree (userId, memoryType) | Type filtering |
| `memories` | B-tree (userId, importance DESC) | Priority retrieval |
| `memories` | Vector (embedding) | Semantic search |
| `memories` | B-tree (userId, expiresAt) | TTL cleanup |
| `topic_profiles` | Vector (embedding) | Topic matching |
| `entity_profiles` | Vector (embedding) | Entity matching |
| `atomic_chat_units` | Vector (embedding) | ACU search |
| `conversations` | B-tree (capturedAt DESC) | Time queries |

### Encryption

**Encryption at Rest:**

```typescript
import { encryptString, decryptString } from './lib/crypto';

class EncryptionService {
  // Encrypt before storage
  async saveEncrypted(userId: string, data: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return encryptString(data, user.publicKey);
  }

  // Decrypt on retrieval
  async getDecrypted(userId: string, encryptedData: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return decryptString(encryptedData, user.publicKey);
  }
}
```

**Encrypted Fields:**

- Memory content and summary
- Fingerprint signals
- Sensitive user metadata

### Caching Layer

**In-Memory Caching:**

```typescript
import { ContextCache, getContextCache } from './context';

const cache = getContextCache();

// Set cache entry with TTL
cache.set(
  'bundle',
  cacheKey,
  {
    compiledPrompt: '...',
    tokenCount: 1000,
  },
  5 * 60 * 1000  // 5 minutes
);

// Get cache entry
const cached = cache.get('bundle', cacheKey);

// Check cache stats
console.log(cache.getStats());
// { hits: 1250, misses: 380, hitRate: 0.767 }
```

**Cache Invalidation:**

```typescript
// Invalidate on memory update
memoryService.on('updated', async (event) => {
  await contextOrchestrator.invalidateOnMemoryCreated(
    event.userId,
    event.payload.memory
  );
});

// Invalidate on conversation message
await contextOrchestrator.invalidateOnConversationMessage(
  userId,
  conversationId
);
```

---

## Integration Patterns

### Pattern 1: Virtual User AI Chatbot

**Use Case:** No-login chatbot for website visitors with persistent memory.

**Architecture:**

```
Website Visitor
      │
      ▼
┌─────────────────────────┐
│  Fingerprint SDK        │ ← Generates device fingerprint
│  (Client-side)          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  POST /api/v1/virtual/  │ ← Identify or create
│  identify               │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Virtual User Created   │ ← Returns session token
│  Session Established    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  POST /api/v1/virtual/  │ ← Chat with full context
│  chat                   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Context Assembly       │ ← 8-layer context
│  Memory Retrieval       │ ← Semantic search
│  LLM Inference          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Response + Memory      │ ← Extract new memories
│  Extraction             │
└─────────────────────────┘
```

**Implementation:**

```typescript
// Frontend: Initialize SDK
import { VirtualUserSDK } from '@vivim/virtual-user-sdk';

const sdk = new VirtualUserSDK({
  apiUrl: 'https://api.yourapp.com',
  consentRequired: true,
  dataRetentionPolicy: '90_days'
});

// Initialize on page load
await sdk.initialize();

// Handle consent
sdk.on('consentRequired', () => {
  showConsentModal(async (accepted) => {
    if (accepted) {
      await sdk.giveConsent({
        dataRetentionPolicy: '90_days'
      });
    }
  });
});

// Chat handler
async function handleUserMessage(message: string) {
  const response = await sdk.chat({
    message,
    conversationId: currentConversationId,
  });
  
  displayResponse(response);
}
```

**Backend: Chat Endpoint**

```typescript
// POST /api/v1/virtual/chat
app.post('/api/v1/virtual/chat', 
  virtualUserAutoAuth, 
  async (req, res) => {
    const { userId } = req.virtualUser;
    const { message, conversationId } = req.body;

    // 1. Assemble context
    const context = await contextAssembler.assemble({
      userId,
      conversationId,
      userMessage: message,
      modelId: 'gpt-4',
    });

    // 2. Retrieve memories
    const memories = await memoryService.retrieveForContext(userId, {
      maxTokens: 1000,
      contextMessage: message,
    });

    // 3. Call LLM
    const response = await llmService.chat({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: context.systemPrompt },
        ...messageHistory,
        { role: 'user', content: message },
      ],
    });

    // 4. Extract memories from conversation
    const extractedMemories = await memoryExtractionEngine.extractFromMessages(
      userId,
      [message, response],
      { extractTypes: ['FACTUAL', 'PREFERENCE', 'GOAL'] }
    );

    // 5. Update conversation
    await conversationService.addMessage(conversationId, {
      role: 'user',
      content: message,
    });
    await conversationService.addMessage(conversationId, response);

    res.json({ response, context: context.metadata });
  }
);
```

### Pattern 2: Enterprise Customer Service AI

**Use Case:** Full-featured customer service chatbot with access to company documents, knowledge base, and customer history.

**Architecture:**

```
Customer
   │
   ▼
┌─────────────────────────┐
│  Customer Service       │
│  Chat Interface         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Customer Identification│ ← Email, account ID, or virtual user
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Context Assembly       │
│  - Customer profile     │
│  - Order history        │
│  - Support tickets      │
│  - Company knowledge    │
│  - Product docs         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  RAG Pipeline           │ ← Retrieve company docs
│  - Vector search        │
│  - Hybrid retrieval     │
│  - Re-ranking           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  LLM Inference          │
│  (with guardrails)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Response + Ticket      │ ← Create/update support ticket
│  Creation               │
└─────────────────────────┘
```

**Context Recipe for Customer Service:**

```typescript
const customerServiceRecipe = {
  id: 'customer-service-v1',
  name: 'Customer Service Bot',
  
  // Exclude personal preferences, focus on business context
  excludedLayers: ['L1_global_prefs'],
  
  layerWeights: {
    L0_identity: 100,      // Company identity critical
    L2_topic: 95,          // Product/topic context
    L3_entity: 90,         // Customer entity
    L4_conversation: 85,   // Current ticket context
    L5_jit: 80,            // Company knowledge base
  },
  
  customBudget: 10000,     // Larger budget for docs
  knowledgeDepth: 'deep',
  prioritizeHistory: true,
  
  // Compression: conservative (keep more context)
  compressionStrategy: 'conservative',
};
```

**Company Document Integration:**

```typescript
// Ingest company documents into ACU system
async function ingestCompanyDocument(document: CompanyDocument) {
  // 1. Chunk document
  const chunks = await chunkDocument(document.content, {
    chunkSize: 500,
    overlap: 50,
  });

  // 2. Generate embeddings
  const acus = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await embeddingService.embed(chunk.text);
      
      return prisma.atomicChatUnit.create({
        data: {
          authorDid: 'company-bot',
          content: chunk.text,
          type: 'text',
          category: document.category,
          embedding,
          metadata: {
            sourceDocument: document.id,
            chunkIndex: chunk.index,
            totalChunks: chunks.length,
          },
          sharingPolicy: 'public',  // Available to all customers
        },
      });
    })
  );

  // 3. Link ACUs to topic
  await prisma.topicProfile.update({
    where: { id: document.topicId },
    data: {
      relatedAcuIds: { push: acus.map(acu => acu.id) },
    },
  });

  return acus;
}
```

**RAG Pipeline:**

```typescript
async function retrieveCompanyKnowledge(
  userId: string,
  query: string,
  topicSlugs: string[]
) {
  // 1. Generate query embedding
  const queryEmbedding = await embeddingService.embed(query);

  // 2. Hybrid retrieval (ACUs + Memories)
  const results = await hybridRetrieval.retrieve(
    userId,
    query,
    queryEmbedding,
    topicSlugs
  );

  // 3. Re-rank by relevance
  const reranked = await reranker.rerank(
    query,
    [...results.acus, ...results.memories],
    { topK: 10 }
  );

  return reranked;
}
```

**Support Ticket Integration:**

```typescript
// Create support ticket from conversation
async function createSupportTicket(
  userId: string,
  conversationId: string,
  category: string,
  priority: 'low' | 'medium' | 'high' | 'urgent'
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: true },
  });

  // Extract issue summary
  const summary = await llmService.chat({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Summarize the customer issue in 2-3 sentences. Include: problem, impact, desired outcome.',
      },
      {
        role: 'user',
        content: conversation.messages.map(m => m.parts[0].content).join('\n'),
      },
    ],
  });

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      conversationId,
      category,
      priority,
      summary: summary.content,
      status: 'open',
    },
  });

  return ticket;
}
```

### Pattern 3: Multi-Tenant Team Deployment

**Use Case:** Team workspace with shared memories and role-based access.

**Features:**

- Team workspaces with shared context
- Role-based access control (RBAC)
- Shared team memories
- Audit logs
- Admin controls

**Schema Extensions:**

```prisma
model Team {
  id          String   @id @default(uuid())
  name        String
  description String?
  
  // Settings
  sharingPolicy    String  @default("team")
  memoryVisibility String  @default("all_members")
  
  // Relations
  members     TeamMember[]
  memories    TeamMemory[]
  conversations TeamConversation[]
}

model TeamMember {
  id        String   @id @default(uuid())
  teamId    String
  userId    String
  role      TeamRole  // ADMIN, MEMBER, VIEWER
  
  team      Team     @relation(...)
  user      User     @relation(...)
  
  @@unique([teamId, userId])
}

model TeamMemory {
  id          String   @id @default(uuid())
  teamId      String
  createdBy   String
  content     String   // ENCRYPTED
  memoryType  MemoryType
  category    String
  visibility  String   @default("all_members")  // all_members, admins_only, creators_only
  
  team        Team     @relation(...)
  
  @@index([teamId])
  @@index([visibility])
}
```

**RBAC Middleware:**

```typescript
async function requireTeamRole(requiredRole: TeamRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { teamId } = req.params;
    const { userId } = req.user;

    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a team member' });
    }

    const roleHierarchy = { VIEWER: 0, MEMBER: 1, ADMIN: 2 };
    if (roleHierarchy[member.role] < roleHierarchy[requiredRole]) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.teamMember = member;
    next();
  };
}

// Usage
app.post('/api/teams/:teamId/memories',
  requireTeamRole('MEMBER'),
  async (req, res) => {
    // Create team memory
  }
);
```

---

## API Reference

### Virtual User Endpoints

#### POST /api/v1/virtual/identify

Identify or create a virtual user based on signals.

**Request:**

```json
{
  "fingerprint": "sha256:abc123...",
  "signals": {
    "canvas": "data:image/png;base64,...",
    "webgl": "vendor_id,renderer_id",
    "audio": "hash_value",
    "fonts": ["font1", "font2"],
    "screen": { "width": 1920, "height": 1080 },
    "battery": { "level": 0.8, "charging": false },
    "touch": { "points": 10 },
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "timezone": "America/New_York",
    "language": "en-US"
  },
  "existingSessionToken": "optional_token"
}
```

**Response:**

```json
{
  "virtualUserId": "uuid",
  "sessionToken": "new_session_token",
  "identification": {
    "confidence": 92,
    "level": "HIGH",
    "isExisting": true,
    "matchedSignals": ["fingerprint", "cookie", "ip_ua"]
  },
  "profile": {
    "displayName": "Virtual User #1234",
    "conversationCount": 15,
    "memoryCount": 47,
    "topicInterests": ["technology", "science"],
    "firstSeenAt": "2025-01-15T10:30:00Z",
    "lastSeenAt": "2026-03-27T14:22:00Z"
  },
  "consentRequired": true
}
```

#### POST /api/v1/virtual/consent

Provide consent for data storage.

**Request:**

```json
{
  "virtualUserId": "uuid",
  "sessionToken": "token",
  "consentGiven": true,
  "dataRetentionPolicy": "90_days"
}
```

#### GET /api/v1/virtual/profile

Get virtual user profile with memories and context.

**Request:**

```
GET /api/v1/virtual/profile?virtualUserId=uuid&sessionToken=token
```

**Response:**

```json
{
  "virtualUserId": "uuid",
  "profile": { ... },
  "recentConversations": [...],
  "recentMemories": [...],
  "topicProfiles": [...],
  "entityProfiles": [...]
}
```

#### POST /api/v1/virtual/chat

Send a message and get AI response with full context.

**Request:**

```json
{
  "virtualUserId": "uuid",
  "sessionToken": "token",
  "message": "Hello, do you remember me?",
  "conversationId": "optional_conversation_id",
  "modelId": "gpt-4"
}
```

**Response:**

```json
{
  "response": {
    "role": "assistant",
    "content": "Yes! I remember you. Last time we discussed...",
    "usage": {
      "promptTokens": 1250,
      "completionTokens": 85,
      "totalTokens": 1335
    }
  },
  "context": {
    "assemblyTimeMs": 245,
    "detectedTopics": 2,
    "detectedEntities": 1,
    "memoriesUsed": 5,
    "totalContextTokens": 3450
  },
  "conversationId": "conv-123"
}
```

#### POST /api/v1/virtual/merge

Merge two virtual users.

**Request:**

```json
{
  "sourceVirtualUserId": "uuid1",
  "targetVirtualUserId": "uuid2",
  "sessionToken": "token",
  "reason": "confidence_match"
}
```

#### DELETE /api/v1/virtual/account

Delete virtual user and all data.

**Request:**

```
DELETE /api/v1/virtual/account?virtualUserId=uuid&sessionToken=token
```

#### GET /api/v1/virtual/export

Export all virtual user data (GDPR right to access).

**Request:**

```
GET /api/v1/virtual/export?virtualUserId=uuid&sessionToken=token
```

**Response:** JSON file with all data

### Memory Endpoints

#### POST /api/v2/memories

Create a new memory.

**Request:**

```json
{
  "userId": "uuid",
  "content": "User prefers TypeScript for backend development",
  "memoryType": "PREFERENCE",
  "category": "programming",
  "importance": 0.8,
  "tags": ["typescript", "backend", "preference"],
  "sourceConversationIds": ["conv-123"]
}
```

#### GET /api/v2/memories/search

Search memories.

**Request:**

```
GET /api/v2/memories/search?userId=uuid&query=typescript&memoryTypes=PREFERENCE,FACTUAL&minImportance=0.5&limit=20
```

#### GET /api/v2/memories/context

Retrieve memories for context.

**Request:**

```json
{
  "userId": "uuid",
  "maxTokens": 2000,
  "preferredTypes": ["EPISODIC", "FACTUAL"],
  "minImportance": 0.3,
  "contextMessage": "What programming languages do I use?"
}
```

### Context Engine Endpoints

#### POST /api/v2/context-engine/assemble

Assemble full context.

**Request:**

```json
{
  "userId": "uuid",
  "conversationId": "conv-123",
  "userMessage": "Help me with my React project",
  "modelId": "gpt-4",
  "settings": {
    "maxContextTokens": 12000,
    "knowledgeDepth": "standard",
    "prioritizeConversationHistory": true
  }
}
```

**Response:**

```json
{
  "systemPrompt": "## VIVIM Identity Core\n...\n\n## User Preferences\n...",
  "budget": {
    "layers": {
      "L0_identity": { "allocated": 300, "priority": 100 },
      "L1_global_prefs": { "allocated": 200, "priority": 95 },
      "L2_topic": { "allocated": 1200, "priority": 80 },
      ...
    },
    "totalAvailable": 12000,
    "totalUsed": 4850
  },
  "bundlesUsed": ["identity_core", "global_prefs", "topic", "conversation"],
  "metadata": {
    "assemblyTimeMs": 245,
    "detectedTopics": 2,
    "detectedEntities": 1,
    "cacheHitRate": 0.85,
    "bundlesInfo": [...]
  }
}
```

### Company Document Endpoints (Enterprise)

#### POST /api/v1/documents/ingest

Ingest company document.

**Request:**

```json
{
  "title": "Product API Documentation",
  "category": "product_docs",
  "topicSlug": "api-reference",
  "content": "Full document content...",
  "metadata": {
    "version": "2.1",
    "lastUpdated": "2026-03-01",
    "authors": ["Engineering Team"]
  }
}
```

#### GET /api/v1/documents/search

Search company documents.

**Request:**

```
GET /api/v1/documents/search?query=authentication&category=product_docs&limit=10
```

---

## Security & Compliance

### Security Measures

**Fingerprint Spoofing Prevention:**

1. **Multi-signal verification**: Require multiple matching signals
2. **Behavioral analysis**: Detect automated/bot behavior
3. **Rate limiting**: Prevent brute-force identification attempts
4. **Signal encryption**: Encrypt stored fingerprint signals
5. **Confidence decay**: Reduce confidence over time without activity

**Session Security:**

1. **Secure cookies**: HttpOnly, Secure, SameSite=Strict
2. **Token rotation**: Rotate session tokens periodically
3. **Expiration**: Sessions expire after inactivity (default: 30 days)
4. **IP binding**: Optional IP address binding for high-security scenarios

**Data Protection:**

1. **Encryption at rest**: All memories and signals encrypted
2. **Encryption in transit**: TLS 1.3 required
3. **Access controls**: Virtual users can only access their own data
4. **Audit logging**: All access logged for transparency

### GDPR Compliance

**Key Requirements:**

| Requirement | Implementation |
|-------------|----------------|
| **Consent** | Explicit consent required before data storage |
| **Right to Access** | Full data export via `/api/v1/virtual/export` |
| **Right to Erasure** | Complete deletion via `/api/v1/virtual/account` |
| **Right to Rectification** | Update memories via `/api/v2/memories/:id` |
| **Data Portability** | JSON export format |
| **Transparency** | Audit logs available |
| **Data Minimization** | Configurable retention policies |
| **Purpose Limitation** | Data used only for specified purposes |

**Data Retention Automation:**

```typescript
// Cleanup worker runs every 24 hours
async function cleanupExpiredData() {
  const policies = {
    '7_days': 7 * 24 * 60 * 60 * 1000,
    '30_days': 30 * 24 * 60 * 60 * 1000,
    '90_days': 90 * 24 * 60 * 60 * 1000,
    '1_year': 365 * 24 * 60 * 60 * 1000,
  };

  for (const [policy, ttl] of Object.entries(policies)) {
    const cutoff = new Date(Date.now() - ttl);

    // Delete expired virtual users
    await prisma.virtualUser.deleteMany({
      where: {
        dataRetentionPolicy: policy,
        lastSeenAt: { lt: cutoff },
        consentGiven: true,
      },
    });

    // Archive expired memories
    await prisma.memory.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isArchived: false,
      },
      data: { isArchived: true },
    });
  }
}
```

### Audit Logging

```prisma
model VirtualUserAuditLog {
  id              String   @id @default(uuid())
  virtualUserId   String
  action          String   // identify, consent, chat, memory_create, export, delete
  timestamp       DateTime @default(now())
  ipAddress       String?
  userAgent       String?
  metadata        Json
  result          String   // success, failure
  errorMessage    String?
  
  @@index([virtualUserId])
  @@index([timestamp])
  @@index([action])
}
```

**Example Log Entry:**

```json
{
  "virtualUserId": "uuid",
  "action": "chat",
  "timestamp": "2026-03-27T14:22:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "conversationId": "conv-123",
    "messageLength": 45,
    "contextTokens": 3450,
    "modelId": "gpt-4"
  },
  "result": "success"
}
```

---

## Performance & Scaling

### Performance Targets

| Operation | Target Latency | P95 | P99 |
|-----------|---------------|-----|-----|
| Virtual User Identify | < 100ms | 150ms | 250ms |
| Context Assembly | < 500ms | 750ms | 1000ms |
| Memory Retrieval | < 200ms | 300ms | 500ms |
| Memory Creation | < 100ms | 150ms | 250ms |
| Chat Response (excl. LLM) | < 800ms | 1200ms | 2000ms |
| Document Search | < 300ms | 500ms | 800ms |

### Optimization Strategies

**1. Bundle Caching:**

```typescript
// Pre-compile bundles during idle time
await contextOrchestrator.warmupBundles(userId, {
  conversationId: 'conv-123',
  personaId: 'persona-456',
});

// Cache hit rate target: > 70%
```

**2. Parallel Context Pipeline:**

```typescript
const pipeline = new ParallelContextPipeline({
  maxConcurrency: 5,
  timeoutMs: 5000,
});

const results = await pipeline.execute([
  () => fetchTopics(userId),
  () => fetchEntities(userId),
  () => fetchMemories(userId),
  () => fetchACUs(userId),
  () => fetchConversation(userId),
]);
```

**3. Database Query Optimization:**

```typescript
// Use select for specific fields
const lightData = await prisma.memory.findMany({
  where: { userId },
  select: { id: true, content: true, memoryType: true },
});

// Use include for relations
const withRelations = await prisma.memory.findMany({
  where: { userId },
  include: { user: { select: { did: true } } },
});

// Batch queries
const [users, memories, conversations] = await Promise.all([
  prisma.user.findMany(),
  prisma.memory.findMany({ where: { userId } }),
  prisma.conversation.findMany({ where: { ownerId: userId } }),
]);
```

**4. Connection Pooling:**

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      config: {
        connection_limit: 20,
        pool_timeout: 10,
      },
    },
  },
});
```

### Scaling Architecture

**Horizontal Scaling:**

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  App Node 1 │ │  App Node 2 │ │  App Node N │
│  (Stateless)│ │  (Stateless)│ │  (Stateless)│
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  PostgreSQL │ │    Redis    │ │   pgvector  │
│  (Primary)  │ │   (Cache)   │ │   (Vector)  │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Caching Strategy:**

- **L1 Cache**: In-memory (Node.js process) - 5 min TTL
- **L2 Cache**: Redis cluster - 30 min TTL
- **L3 Cache**: Database query cache - 1 hour TTL

**Database Scaling:**

- **Read Replicas**: For context assembly, memory retrieval
- **Write Primary**: For memory creation, updates
- **Connection Pooling**: 20 connections per node
- **Query Optimization**: Indexed queries, batch operations

### Monitoring & Metrics

**Key Metrics:**

```typescript
interface Metrics {
  // Identification
  identificationRate: number;      // Target: > 85%
  falsePositiveRate: number;       // Target: < 1%
  falseNegativeRate: number;       // Target: < 15%
  confidenceDistribution: {
    high: number;    // Target: 70%
    medium: number;  // Target: 20%
    low: number;     // Target: 10%
  };

  // Context
  contextAssemblyTime: number;     // Target: < 500ms
  cacheHitRate: number;            // Target: > 70%
  tokenUtilization: number;        // Target: 60-80%

  // Memory
  memoryRetrievalTime: number;     // Target: < 200ms
  memoryCreationTime: number;      // Target: < 100ms
  memoriesPerUser: number;         // Target: > 5/week

  // System
  requestRate: number;
  errorRate: number;               // Target: < 0.1%
  p95Latency: number;
  p99Latency: number;
}
```

**Dashboard Example:**

```typescript
// Prometheus metrics
const metrics = {
  virtual_user_identifications_total: new Counter(...),
  virtual_user_identification_duration_seconds: new Histogram(...),
  context_assembly_duration_seconds: new Histogram(...),
  memory_retrieval_duration_seconds: new Histogram(...),
  memory_creation_total: new Counter(...),
  cache_hits_total: new Counter(...),
  cache_misses_total: new Counter(...),
};
```

---

## Implementation Guide

### Phase 1: Core Infrastructure

**Tasks:**

1. **Database Setup**
   ```bash
   cd server
   bunx prisma migrate dev --name add_virtual_user_system
   bunx prisma generate
   ```

2. **Environment Configuration**
   ```env
   # .env
   DATABASE_URL=postgresql://user:pass@localhost:5432/vivim
   
   VIRTUAL_USER_ENABLED=true
   VIRTUAL_USER_CONSENT_REQUIRED=true
   VIRTUAL_USER_DEFAULT_RETENTION_POLICY=90_days
   VIRTUAL_USER_SESSION_DURATION_DAYS=30
   
   OPENAI_API_KEY=sk-...
   EMBEDDING_MODEL=text-embedding-3-small
   EMBEDDING_DIMENSION=1536
   
   DEFAULT_MAX_TOKENS=12000
   COMPACTION_MODEL=glm-4.7-flash
   ```

3. **Route Registration**
   ```javascript
   // server/src/server.js
   import { virtualUserRoutes } from './routes/virtual-user.js';
   import { virtualUserAutoAuth } from './middleware/virtual-user-auth.js';

   app.use('/api/v1/virtual', virtualUserRoutes);
   app.use('/api/v1/virtual/*', virtualUserAutoAuth);
   ```

### Phase 2: Frontend Integration

**1. Install SDK:**

```bash
npm install @vivim/virtual-user-sdk
```

**2. Initialize SDK:**

```javascript
// src/main.js
import { createVirtualUserSDK } from '@vivim/virtual-user-sdk';

const sdk = createVirtualUserSDK({
  apiUrl: 'https://api.yourapp.com',
  consentRequired: true,
  dataRetentionPolicy: '90_days'
});

await sdk.initialize();
```

**3. Chat Component:**

```jsx
// src/components/Chat.jsx
import { useVirtualUser } from '@vivim/virtual-user-sdk';

function Chat() {
  const { virtualUser, chat, isLoading } = useVirtualUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const response = await chat({
      message: input,
      conversationId: currentConversationId,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Type a message..."
      />
    </div>
  );
}
```

### Phase 3: Company Document Integration

**1. Document Ingestion Pipeline:**

```typescript
// scripts/ingest-documents.ts
import { ingestCompanyDocument } from '../src/services/document-ingestion';

async function main() {
  const documents = [
    {
      title: 'Product API Documentation',
      category: 'product_docs',
      topicSlug: 'api-reference',
      filePath: './docs/api.md',
    },
    {
      title: 'Customer Support Guidelines',
      category: 'support',
      topicSlug: 'support-guidelines',
      filePath: './docs/support.md',
    },
  ];

  for (const doc of documents) {
    const content = fs.readFileSync(doc.filePath, 'utf-8');
    await ingestCompanyDocument({ ...doc, content });
    console.log(`Ingested: ${doc.title}`);
  }
}

main();
```

**2. RAG Search Integration:**

```typescript
// src/services/rag-search.ts
export async function searchCompanyKnowledge(
  userId: string,
  query: string,
  topicSlugs: string[]
) {
  const queryEmbedding = await embeddingService.embed(query);
  
  const results = await hybridRetrieval.retrieve(
    userId,
    query,
    queryEmbedding,
    topicSlugs
  );

  // Re-rank
  const reranked = await reranker.rerank(query, results, { topK: 10 });

  return reranked;
}
```

### Phase 4: Testing & Optimization

**1. Load Testing:**

```bash
# Install k6
brew install k6

# Run load test
k6 run tests/load/virtual-user-load-test.js
```

**Load Test Script:**

```javascript
// tests/load/virtual-user-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
};

export default function () {
  const fingerprint = generateFingerprint();
  
  const identifyRes = http.post('http://localhost:3000/api/v1/virtual/identify', {
    fingerprint,
    signals: generateSignals(),
  });

  check(identifyRes, {
    'identify status is 200': (r) => r.status === 200,
    'identify latency < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);
}
```

**2. Performance Profiling:**

```typescript
// Add telemetry to context assembly
const startTime = Date.now();
const context = await contextAssembler.assemble(params);
const assemblyTime = Date.now() - startTime;

metrics.contextAssemblyTime.observe(assemblyTime);
logger.info({ assemblyTime, userId: params.userId }, 'Context assembled');
```

### Phase 5: Production Deployment

**1. Docker Configuration:**

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**2. Kubernetes Deployment:**

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vivim-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vivim-server
  template:
    metadata:
      labels:
        app: vivim-server
    spec:
      containers:
      - name: server
        image: vivim/server:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secret
              key: key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

**3. Monitoring Setup:**

```yaml
# k8s/monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: vivim-server
spec:
  selector:
    matchLabels:
      app: vivim-server
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **ACU** | Atomic Chat Unit - smallest meaningful piece of conversation |
| **Context Bundle** | Pre-compiled context for fast retrieval |
| **Device Fingerprint** | Unique identifier generated from browser/device characteristics |
| **Embedding** | Vector representation of text for semantic search |
| **JIT Retrieval** | Just-In-Time knowledge retrieval based on current context |
| **Memory Consolidation** | Process of merging similar memories to reduce noise |
| **pgvector** | PostgreSQL extension for vector similarity search |
| **RAG** | Retrieval-Augmented Generation - combining retrieval with LLM generation |
| **Virtual User** | No-login user identity based on device fingerprinting |

---

## Appendix B: Troubleshooting

### Common Issues

**Issue: Low identification confidence**

**Solution:**
- Check fingerprint generation consistency
- Verify all signals are being collected
- Increase signal diversity (add more fingerprint components)

**Issue: Slow context assembly**

**Solution:**
- Enable bundle caching
- Increase cache TTL
- Use parallel context pipeline
- Optimize database queries with indexes

**Issue: Memory retrieval returning irrelevant results**

**Solution:**
- Adjust embedding model
- Increase minImportance threshold
- Use hybrid retrieval (semantic + keyword)
- Add re-ranking step

**Issue: High token usage**

**Solution:**
- Reduce context budget
- Use more aggressive compression
- Exclude unnecessary layers via recipe
- Optimize layer weights

---

## Appendix C: Best Practices

### Memory Management

1. **Extract memories selectively**: Only extract high-confidence, high-importance memories
2. **Pin critical memories**: Always include user preferences and identity
3. **Consolidate regularly**: Merge similar memories to reduce noise
4. **Archive old memories**: Keep active memory set manageable

### Context Optimization

1. **Use recipes**: Customize context assembly per use case
2. **Warm up bundles**: Pre-compile context during idle time
3. **Monitor cache hit rate**: Target > 70%
4. **Adjust layer weights**: Prioritize based on use case

### Virtual User Security

1. **Multi-signal verification**: Don't rely on single signal
2. **Rate limit identification**: Prevent brute-force attacks
3. **Encrypt signals**: Protect stored fingerprint data
4. **Audit logging**: Track all identification attempts

---

## Appendix D: Product Tier Features

| Feature | Community | Team | Enterprise |
|---------|-----------|------|------------|
| **Core Engine** | | | |
| 8-Layer Context | ✓ | ✓ | ✓ |
| 9 Memory Types | ✓ | ✓ | ✓ |
| Vector Search | ✓ | ✓ | ✓ |
| Compression | ✓ | ✓ | Advanced |
| **Platform** | | | |
| Self-Hosted | ✓ | - | - |
| Cloud Hosting | - | ✓ | ✓ |
| Multi-Tenant | - | ✓ | ✓ |
| Single-Tenant | - | - | ✓ |
| **Team Features** | | | |
| Team Workspaces | - | ✓ | ✓ |
| Shared Memories | - | ✓ | ✓ |
| Role-Based Access | - | Basic | Advanced |
| Admin Controls | - | ✓ | ✓ |
| **Security & Compliance** | | | |
| Audit Logs | - | ✓ | ✓ |
| SSO/SAML | - | - | ✓ |
| Encryption at Rest | ✓ | ✓ | ✓ |
| SOC 2 Type II | - | - | Q4 2025 |
| HIPAA | - | - | Q1 2026 |
| GDPR Compliance | - | ✓ | ✓ |

---

**Document End**

*For additional documentation, see:*
- `MEMORY-ENGINE.md` - Memory system deep dive
- `CONTEXT-ENGINE.md` - Context engine technical specification
- `VIRTUAL_USER_DESIGN.md` - Virtual user system design
- `STORAGE.md` - Database schema and storage details
- `ATOMIC-CHAT-UNITS.md` - ACU system explanation

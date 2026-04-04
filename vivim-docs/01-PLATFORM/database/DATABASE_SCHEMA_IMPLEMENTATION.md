# Database Schema Implementation Guide

**Document Version:** 1.0.0
**Date:** February 11, 2026
**Related:** `IMPLEMENTATION_GUIDE_MASTER.md`

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Model Specifications](#model-specifications)
3. [Indexes and Performance](#indexes-and-performance)
4. [Relationships Diagram](#relationships-diagram)
5. [Migration Scripts](#migration-scripts)
6. [Query Patterns](#query-patterns)
7. [Data Integrity](#data-integrity)

---

## Schema Overview

### ER Diagram (Text-Based)

```
┌──────────────────────┐
│       User         │
└──────┬───────┬─────┘
       │       │
       │       │
       ▼       ▼
┌──────────────────┐  ┌──────────────────┐
│  TopicProfile   │  │  EntityProfile   │
│                  │  │                  │
│  ┌────────────┐│  │  ┌────────────┐│
│  │TopicConvo  ││  │  │facts      ││
│  └────────────┘│  │  └────────────┘│
└──────┬─────────┘  └──────┬───────────┘
       │                   │
       │                   │
       ▼                   ▼
┌───────────────────────────────────┐
│      ContextBundle            │
│                                 │
│  ┌─────────────────────────┐   │
│  │compiledContext (Text)  │   │
│  │isDirty, version, TTL  │   │
│  └─────────────────────────┘   │
└───────────────────────────────────┘

┌──────────────────────┐
│   ClientPresence   │
└──────────┬─────────┘
           │
           │
           ▼
┌──────────────────────┐
│  Prediction Cache │ (computed field)
└──────────────────────┘
```

### Key Design Principles

1. **Immutable ACUs**: Once an ACU is created, its content never changes. New versions create new ACUs.
2. **Layered Bundles**: Each context layer has its own pre-compiled bundle in `ContextBundle`.
3. **Compound Unique Keys**: `ContextBundle` uses 6-field compound key for deduplication.
4. **Nullable Foreign Keys**: Topic/Entity/Conversation references are nullable to support all bundle types.
5. **Temporal Indexing**: All profile tables have indexes on `lastEngagedAt`/`lastMentionedAt` for recent-item queries.
6. **Dirty Flag Tracking**: All compiled entities have `isDirty` for invalidation.

---

## Model Specifications

### 1. TopicProfile

**Purpose**: Stores user's domain expertise and engagement patterns.

```prisma
model TopicProfile {
  id          String   @id @default(uuid())
  userId      String

  // Topic Identity
  slug        String   // "prisma-orm", "distributed-systems", "typescript"
  label       String   // "Prisma ORM"
  aliases     String[] // ["prisma", "prisma.io", "prisma client"]

  // Hierarchical taxonomy
  parentSlug  String?  // "prisma-orm" → parent: "databases"
  domain      String   // "engineering", "personal", "creative", "business"

  // Engagement Metrics (auto-computed)
  totalConversations   Int      @default(0)
  totalAcus            Int      @default(0)
  totalMessages        Int      @default(0)
  totalTokensSpent     Int      @default(0)
  avgSessionDepth      Float    @default(0)

  // Temporal patterns
  firstEngagedAt       DateTime @db.Timestamptz
  lastEngagedAt        DateTime @db.Timestamptz
  engagementStreak     Int      @default(0)
  peakHour             Int?     // 0-23, when they usually discuss this

  // Skill/Knowledge level (inferred)
  proficiencyLevel     String   @default("unknown")
  proficiencySignals   Json     @default("[]")

  // Importance Score (composite)
  importanceScore      Float    @default(0.5)

  // Pre-built context
  compiledContext      String?  @db.Text
  compiledAt           DateTime? @db.Timestamptz
  compiledTokenCount   Int?
  contextVersion       Int      @default(0)
  isDirty              Boolean  @default(true)

  // Embedding
  embedding            Float[]
  embeddingModel       String?

  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  relatedMemoryIds     String[]
  relatedAcuIds        String[]
  conversations        TopicConversation[]
  contextBundles       ContextBundle[] @relation("TopicBundles")

  @@unique([userId, slug])
  @@index([userId, importanceScore(sort: Desc)])
  @@index([userId, lastEngagedAt(sort: Desc)])
  @@index([userId, isDirty])
  @@index([domain])
  @@map("topic_profiles")
}
```

**Field Descriptions:**

| Field | Type | Description | Required | Index |
|-------|------|-------------|-----------|--------|
| `slug` | String | Unique identifier for topic (used in URLs) | Yes | Unique |
| `domain` | String | High-level categorization | Yes | Index |
| `proficiencyLevel` | String | "beginner" \| "intermediate" \| "advanced" \| "expert" \| "unknown" | No | - |
| `importanceScore` | Float | Composite score (0.0-1.0) for sorting | No | Index |
| `isDirty` | Boolean | Flag for bundle invalidation | Yes | Index |
| `embedding` | Float[] | Vector for semantic similarity search | No | - |
| `compiledContext` | Text? | Pre-built Markdown context block | No | - |

**Key Queries:**

```typescript
// Get user's hot topics (recent + important)
const hotTopics = await prisma.topicProfile.findMany({
  where: {
    userId,
    lastEngagedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
  },
  orderBy: [
    { importanceScore: 'desc' },
    { engagementStreak: 'desc' }
  ],
  take: 5
});

// Get topics by time-of-day pattern
const timeBasedTopics = await prisma.topicProfile.findMany({
  where: {
    userId,
    peakHour: localHour,
    importanceScore: { gte: 0.4 }
  },
  orderBy: { importanceScore: 'desc' },
  take: 3
});

// Get topics needing recompilation
const dirtyTopics = await prisma.topicProfile.findMany({
  where: { userId, isDirty: true },
  take: 50
});
```

---

### 2. EntityProfile

**Purpose**: Stores information about people, projects, organizations, tools, and concepts.

```prisma
model EntityProfile {
  id          String   @id @default(uuid())
  userId      String

  // Entity Identity
  name        String   // "Sarah", "OpenScroll", "Vercel"
  type        String   // "person", "project", "organization", "tool", "concept"
  aliases     String[] // ["@sarah", "Sarah Chen", "my cofounder"]

  // Relationship to user
  relationship String?  // "cofounder", "manager", "client", "friend", "self"
  sentiment    Float    @default(0.0)

  facts        Json    @default("[]")

  mentionCount         Int      @default(0)
  conversationCount    Int      @default(0)
  lastMentionedAt      DateTime? @db.Timestamptz
  firstMentionedAt     DateTime? @db.Timestamptz

  compiledContext      String?  @db.Text
  compiledAt           DateTime? @db.Timestamptz
  compiledTokenCount   Int?
  contextVersion       Int      @default(0)
  isDirty              Boolean  @default(true)

  embedding            Float[]
  embeddingModel       String?

  importanceScore      Float    @default(0.5)

  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  contextBundles       ContextBundle[] @relation("EntityBundles")

  @@unique([userId, name, type])
  @@index([userId, importanceScore(sort: Desc)])
  @@index([userId, type])
  @@index([userId, lastMentionedAt(sort: Desc)])
  @@map("entity_profiles")
}
```

**Field Descriptions:**

| Field | Type | Description | Required |
|-------|------|-------------|-----------|
| `name` | String | Entity name (case-sensitive) | Yes |
| `type` | String | Entity category | Yes |
| `facts` | Json | Array of structured facts with confidence | No |
| `sentiment` | Float | -1.0 (negative) to 1.0 (positive) | No |

**Example Facts Structure:**

```json
[
  {
    "fact": "Works at Google",
    "confidence": 0.9,
    "source": "conv:uuid-123",
    "mentionedAt": "2026-02-11T10:30:00Z"
  },
  {
    "fact": "Expert in Rust",
    "confidence": 0.7,
    "source": "conv:uuid-456"
  }
]
```

---

### 3. ContextBundle

**Purpose**: Pre-compiled context blocks serving as cache for all layers (L0-L6).

```prisma
model ContextBundle {
  id          String   @id @default(uuid())
  userId      String

  bundleType  String
  // "identity_core", "global_prefs", "topic", "entity", "conversation", "composite"

  topicProfileId    String?
  topicProfile      TopicProfile? @relation("TopicBundles", fields: [topicProfileId], references: [id], onDelete: Cascade)
  entityProfileId   String?
  entityProfile     EntityProfile? @relation("EntityBundles", fields: [entityProfileId], references: [id], onDelete: Cascade)
  conversationId    String?
  conversation      Conversation? @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  personaId         String?
  persona           AiPersona? @relation(fields: [personaId], references: [id], onDelete: Cascade)

  compiledPrompt    String   @db.Text
  tokenCount        Int

  composition       Json     @default("{}")
  // { "memoryIds": [...], "acuIds": [...], "instructionIds": [...] }

  version           Int      @default(1)
  isDirty           Boolean  @default(false)
  priority          Float    @default(0.5)

  compiledAt        DateTime @default(now()) @db.Timestamptz
  expiresAt         DateTime? @db.Timestamptz
  lastUsedAt        DateTime @default(now()) @db.Timestamptz
  useCount          Int      @default(0)

  hitCount          Int      @default(0)
  missCount         Int      @default(0)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, bundleType])
  @@index([userId, priority(sort: Desc)])
  @@index([userId, isDirty])
  @@index([expiresAt])
  @@map("context_bundles")
}
```

**Critical Note**: The `@@unique` constraint for `ContextBundle` is intentionally **NOT** a Prisma model annotation. It is implemented at the database level as a compound unique constraint:

```sql
CREATE UNIQUE INDEX context_bundles_unique_key
ON context_bundles (userId, bundleType, topicProfileId, entityProfileId, conversationId, personaId)
WHERE (
  bundleType = 'topic' AND topicProfileId IS NOT NULL OR
  bundleType = 'entity' AND entityProfileId IS NOT NULL OR
  bundleType = 'conversation' AND conversationId IS NOT NULL OR
  bundleType = 'identity_core' AND topicProfileId IS NULL AND entityProfileId IS NULL AND conversationId IS NULL AND personaId IS NULL
);
```

**Bundle Type Combinations:**

| bundleType | Required Non-Null Fields | Optional Fields |
|-----------|------------------------|----------------|
| `identity_core` | userId | - |
| `global_prefs` | userId | - |
| `topic` | userId, topicProfileId | - |
| `entity` | userId, entityProfileId | - |
| `conversation` | userId, conversationId | - |
| `composite` | userId | topicProfileId, entityProfileId, conversationId, personaId |

---

### 4. ClientPresence

**Purpose**: Tracks user's real-time UI state for prediction and pre-generation.

```prisma
model ClientPresence {
  id              String   @id @default(uuid())
  userId          String
  deviceId        String

  activeConversationId    String?
  visibleConversationIds  String[]
  activeNotebookId        String?
  activePersonaId         String?

  lastNavigationPath      String?
  navigationHistory       Json     @default("[]")

  localTime               DateTime? @db.Timestamptz
  sessionStartedAt        DateTime @default(now()) @db.Timestamptz
  idleSince               DateTime? @db.Timestamptz

  predictedTopics         String[]
  predictedEntities       String[]

  lastHeartbeatAt         DateTime @default(now()) @db.Timestamptz
  isOnline                Boolean  @default(true)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceId])
  @@index([userId, isOnline])
  @@index([lastHeartbeatAt])
  @@map("client_presence")
}
```

**Navigation History Structure:**

```json
[
  { "path": "/chat/uuid-123", "timestamp": "2026-02-11T10:30:00Z" },
  { "path": "/notebooks/uuid-456", "timestamp": "2026-02-11T10:35:00Z" },
  { "path": "/chat/uuid-123", "timestamp": "2026-02-11T10:40:00Z" }
]
```

---

### 5. ConversationCompaction

**Purpose**: Stores hierarchical summaries of long conversations for progressive compaction.

```prisma
model ConversationCompaction {
  id              String   @id @default(uuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  fromMessageIndex  Int
  toMessageIndex    Int
  originalTokenCount Int
  compactedTokenCount Int

  summary           String @db.Text
  keyDecisions      Json   @default("[]")
  openQuestions     Json   @default("[]")
  codeArtifacts     Json   @default("[]")

  compressionRatio  Float
  compactionLevel   Int    @default(1)

  createdAt   DateTime @default(now()) @db.Timestamptz

  @@unique([conversationId, fromMessageIndex, toMessageIndex])
  @@index([conversationId, fromMessageIndex])
  @@map("conversation_compactions")
}
```

**Compaction Levels:**

| Level | Purpose | Use Case |
|-------|-----------|------------|
| `1` | First-pass summary | Direct from messages |
| `2` | Re-compressed summary | From Level-1 compactions |
| `3` | Highly compressed | From Level-2 compactions (for very long convos) |

---

### 6. TopicConversation (Junction Table)

**Purpose**: Links conversations to topics with relevance scores.

```prisma
model TopicConversation {
  id              String   @id @default(uuid())
  topicId         String
  topic           TopicProfile @relation(fields: [topicId], references: [id], onDelete: Cascade)
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  relevanceScore  Float    @default(0.5)

  @@unique([topicId, conversationId])
  @@index([topicId])
  @@index([conversationId])
  @@map("topic_conversations")
}
```

---

## Indexes and Performance

### Critical Indexes

| Table | Index | Purpose | Query Type |
|-------|--------|---------|------------|
| `topic_profiles` | `[userId, importanceScore(sort: Desc)]` | Get hot topics |
| `topic_profiles` | `[userId, isDirty]` | Find topics needing recompile |
| `topic_profiles` | `[domain]` | Domain-based queries |
| `entity_profiles` | `[userId, importanceScore(sort: Desc)]` | Get important entities |
| `entity_profiles` | `[userId, type]` | Filter by entity type |
| `context_bundles` | `[userId, bundleType]` | Get bundles by type |
| `context_bundles` | `[userId, isDirty]` | Find dirty bundles |
| `context_bundles` | `[expiresAt]` | Cleanup expired bundles |
| `client_presence` | `[userId, isOnline]` | Online user queries |
| `conversation_compactions` | `[conversationId, fromMessageIndex]` | Range queries for compaction |

### Vector Indexes (pgvector)

For semantic search (ACUs, topics, entities):

```sql
-- Create vector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- ACU embedding index
CREATE INDEX IF NOT EXISTS atomic_chat_units_embedding_idx
ON atomic_chat_units
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Topic profile embedding index
CREATE INDEX IF NOT EXISTS topic_profiles_embedding_idx
ON topic_profiles
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

-- Entity profile embedding index
CREATE INDEX IF NOT EXISTS entity_profiles_embedding_idx
ON entity_profiles
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);
```

### Index Tuning Guidelines

1. **ivfflat lists parameter**: Set to ~100 for ACU table (larger), ~50 for profiles (smaller)
2. **Composite indexes**: Use only for query patterns that always use all fields together
3. **Partial indexes**: For queries with frequent WHERE filters (e.g., `isDirty: true`)
4. **Vacuum schedule**: Run `VACUUM ANALYZE` weekly to maintain index statistics

---

## Relationships Diagram

```
User (1) ──────(N) TopicProfile
 │                  │
 │                  ├────(N) TopicConversation ─────(1) Conversation
 │                  │
 │                  └────(N) ContextBundle (type='topic')
 │
 ├────(N) EntityProfile
 │                  └────(N) ContextBundle (type='entity')
 │
 ├────(N) ContextBundle (type='identity_core', 'global_prefs')
 │
 ├────(N) ClientPresence
 │
 └────(N) AiPersona ─────(1) ContextBundle (personaId set)

Conversation (1) ──────(N) ContextBundle (type='conversation')
 │
 └────(N) ConversationCompaction
```

---

## Migration Scripts

### Initial Migration (Phase 1)

```prisma
// File: prisma/migrations/001_init_context_engine/migration.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- TopicProfile table
CREATE TABLE "topic_profiles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,

  -- Topic Identity
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "aliases" TEXT[],

  -- Hierarchical taxonomy
  "parentSlug" TEXT,
  "domain" TEXT NOT NULL,

  -- Engagement Metrics
  "totalConversations" INTEGER NOT NULL DEFAULT 0,
  "totalAcus" INTEGER NOT NULL DEFAULT 0,
  "totalMessages" INTEGER NOT NULL DEFAULT 0,
  "totalTokensSpent" INTEGER NOT NULL DEFAULT 0,
  "avgSessionDepth" DOUBLE PRECISION NOT NULL DEFAULT 0,

  -- Temporal patterns
  "firstEngagedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastEngagedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "engagementStreak" INTEGER NOT NULL DEFAULT 0,
  "peakHour" INTEGER,

  -- Skill level
  "proficiencyLevel" TEXT NOT NULL DEFAULT 'unknown',
  "proficiencySignals" JSONB NOT NULL DEFAULT '[]',

  -- Importance
  "importanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

  -- Pre-built context
  "compiledContext" TEXT,
  "compiledAt" TIMESTAMPTZ,
  "compiledTokenCount" INTEGER,
  "contextVersion" INTEGER NOT NULL DEFAULT 0,
  "isDirty" BOOLEAN NOT NULL DEFAULT true,

  -- Embedding
  "embedding" vector(1536),
  "embeddingModel" TEXT,

  -- Timestamps
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,

  -- Relations
  "relatedMemoryIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "relatedAcuIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  PRIMARY KEY ("id")
);

CREATE INDEX "topic_profiles_userId_slug_key" ON "topic_profiles"("userId", "slug");
CREATE INDEX "topic_profiles_importanceScore_idx" ON "topic_profiles"("importanceScore" DESC);
CREATE INDEX "topic_profiles_lastEngagedAt_idx" ON "topic_profiles"("lastEngagedAt" DESC);
CREATE INDEX "topic_profiles_isDirty_idx" ON "topic_profiles"("isDirty");
CREATE INDEX "topic_profiles_domain_idx" ON "topic_profiles"("domain");
CREATE INDEX "topic_profiles_embedding_idx" ON "topic_profiles" USING ivfflat("embedding" vector_cosine_ops) WITH (lists = 50);

-- EntityProfile table
CREATE TABLE "entity_profiles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,

  -- Entity Identity
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "aliases" TEXT[],

  -- Relationship to user
  "relationship" TEXT,
  "sentiment" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

  -- Facts
  "facts" JSONB NOT NULL DEFAULT '[]',

  -- Engagement
  "mentionCount" INTEGER NOT NULL DEFAULT 0,
  "conversationCount" INTEGER NOT NULL DEFAULT 0,
  "lastMentionedAt" TIMESTAMPTZ,
  "firstMentionedAt" TIMESTAMPTZ,

  -- Pre-built context
  "compiledContext" TEXT,
  "compiledAt" TIMESTAMPTZ,
  "compiledTokenCount" INTEGER,
  "contextVersion" INTEGER NOT NULL DEFAULT 0,
  "isDirty" BOOLEAN NOT NULL DEFAULT true,

  -- Embedding
  "embedding" vector(1536),
  "embeddingModel" TEXT,

  -- Importance
  "importanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

  -- Timestamps
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "entity_profiles_userId_name_type_key" ON "entity_profiles"("userId", "name", "type");
CREATE INDEX "entity_profiles_importanceScore_idx" ON "entity_profiles"("importanceScore" DESC);
CREATE INDEX "entity_profiles_type_idx" ON "entity_profiles"("type");
CREATE INDEX "entity_profiles_lastMentionedAt_idx" ON "entity_profiles"("lastMentionedAt" DESC);
CREATE INDEX "entity_profiles_embedding_idx" ON "entity_profiles" USING ivfflat("embedding" vector_cosine_ops) WITH (lists = 50);

-- ContextBundle table
CREATE TABLE "context_bundles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,

  "bundleType" TEXT NOT NULL,

  -- Foreign keys (nullable)
  "topicProfileId" TEXT,
  "entityProfileId" TEXT,
  "conversationId" TEXT,
  "personaId" TEXT,

  -- Compiled content
  "compiledPrompt" TEXT NOT NULL,
  "tokenCount" INTEGER NOT NULL,

  -- Composition metadata
  "composition" JSONB NOT NULL DEFAULT '{}',

  -- Cache control
  "version" INTEGER NOT NULL DEFAULT 1,
  "isDirty" BOOLEAN NOT NULL DEFAULT false,
  "priority" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

  -- Staleness tracking
  "compiledAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ,
  "lastUsedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "useCount" INTEGER NOT NULL DEFAULT 0,

  -- Hit tracking
  "hitCount" INTEGER NOT NULL DEFAULT 0,
  "missCount" INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY ("id")
);

-- Foreign key constraints
ALTER TABLE "context_bundles" ADD CONSTRAINT "context_bundles_topicProfileId_fkey"
  FOREIGN KEY ("topicProfileId") REFERENCES "topic_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "context_bundles" ADD CONSTRAINT "context_bundles_entityProfileId_fkey"
  FOREIGN KEY ("entityProfileId") REFERENCES "entity_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "context_bundles" ADD CONSTRAINT "context_bundles_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;

-- Note: personaId FK depends on existing AiPersona table

CREATE INDEX "context_bundles_userId_bundleType_idx" ON "context_bundles"("userId", "bundleType");
CREATE INDEX "context_bundles_priority_idx" ON "context_bundles"("priority" DESC);
CREATE INDEX "context_bundles_isDirty_idx" ON "context_bundles"("isDirty");
CREATE INDEX "context_bundles_expiresAt_idx" ON "context_bundles"("expiresAt");

-- ClientPresence table
CREATE TABLE "client_presence" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,

  -- Active/visible state
  "activeConversationId" TEXT,
  "visibleConversationIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "activeNotebookId" TEXT,
  "activePersonaId" TEXT,

  -- Navigation
  "lastNavigationPath" TEXT,
  "navigationHistory" JSONB NOT NULL DEFAULT '[]',

  -- Temporal
  "localTime" TIMESTAMPTZ,
  "sessionStartedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "idleSince" TIMESTAMPTZ,

  -- Predictions (computed)
  "predictedTopics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "predictedEntities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Heartbeat
  "lastHeartbeatAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "isOnline" BOOLEAN NOT NULL DEFAULT true,

  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_presence_userId_deviceId_key" ON "client_presence"("userId", "deviceId");
CREATE INDEX "client_presence_userId_isOnline_idx" ON "client_presence"("userId", "isOnline");
CREATE INDEX "client_presence_lastHeartbeatAt_idx" ON "client_presence"("lastHeartbeatAt");

-- ConversationCompaction table
CREATE TABLE "conversation_compactions" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,

  -- Range
  "fromMessageIndex" INTEGER NOT NULL,
  "toMessageIndex" INTEGER NOT NULL,
  "originalTokenCount" INTEGER NOT NULL,
  "compactedTokenCount" INTEGER NOT NULL,

  -- Content
  "summary" TEXT NOT NULL,
  "keyDecisions" JSONB NOT NULL DEFAULT '[]',
  "openQuestions" JSONB NOT NULL DEFAULT '[]',
  "codeArtifacts" JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  "compressionRatio" DOUBLE PRECISION NOT NULL,
  "compactionLevel" INTEGER NOT NULL DEFAULT 1,

  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY ("id")
);

ALTER TABLE "conversation_compactions" ADD CONSTRAINT "conversation_compactions_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "conversation_compactions_conversationId_fromMessageIndex_toMessageIndex_key"
  ON "conversation_compactions"("conversationId", "fromMessageIndex", "toMessageIndex");

CREATE INDEX "conversation_compactions_conversationId_fromMessageIndex_idx"
  ON "conversation_compactions"("conversationId", "fromMessageIndex");

-- TopicConversation junction table
CREATE TABLE "topic_conversations" (
  "id" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

  PRIMARY KEY ("id")
);

ALTER TABLE "topic_conversations" ADD CONSTRAINT "topic_conversations_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "topic_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "topic_conversations" ADD CONSTRAINT "topic_conversations_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "topic_conversations_topicId_conversationId_key"
  ON "topic_conversations"("topicId", "conversationId");

CREATE INDEX "topic_conversations_topicId_idx" ON "topic_conversations"("topicId");
CREATE INDEX "topic_conversations_conversationId_idx" ON "topic_conversations"("conversationId");
```

### Migration: Add User Relations (Existing User Model)

```sql
-- Add context engine relations to existing User table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "topicProfiles" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "entityProfiles" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contextBundles" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clientPresence" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "users_topicProfiles_idx" ON "users"("topicProfiles");
CREATE INDEX IF NOT EXISTS "users_entityProfiles_idx" ON "users"("entityProfiles");
```

### Migration: Update Existing Conversation Model

```sql
-- Add context engine relations to existing Conversation table
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "topicLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "compactions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "contextBundles" TEXT[] DEFAULT ARRAY[]::TEXT[];
```

---

## Query Patterns

### Pattern 1: Get Fresh Context Bundle

```typescript
async function getFreshBundle(
  userId: string,
  bundleType: string,
  referenceId?: string  // topicId, entityId, or conversationId
): Promise<ContextBundle | null> {
  const where: any = {
    userId,
    bundleType,
    isDirty: false,
    OR: [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } }
    ]
  };

  // Add reference filter based on bundle type
  if (bundleType === 'topic' && referenceId) {
    where.topicProfileId = referenceId;
  } else if (bundleType === 'entity' && referenceId) {
    where.entityProfileId = referenceId;
  } else if (bundleType === 'conversation' && referenceId) {
    where.conversationId = referenceId;
  }

  return await prisma.contextBundle.findFirst({ where });
}
```

### Pattern 2: Vector Similarity Search (ACUs)

```typescript
async function findSimilarACUs(
  userId: string,
  queryEmbedding: number[],
  threshold: number = 0.4,
  limit: number = 20
): Promise<ACU[]> {
  return await prisma.$queryRaw<ACU[]>`
    SELECT id, content, type, "createdAt",
      1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM atomic_chat_units
    WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
      AND state = 'ACTIVE'
      AND 1 - (embedding <=> ${queryEmbedding}::vector) > ${threshold}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;
}
```

### Pattern 3: Profile Rollup Batch Processing

```typescript
async function processUnprocessedACUs(userId: string, batchSize: number = 50) {
  const unprocessed = await prisma.atomicChatUnit.findMany({
    where: {
      authorDid: await getUserDid(userId),
      embedding: null,
      state: 'ACTIVE'
    },
    orderBy: { createdAt: 'asc' },
    take: batchSize
  });

  if (unprocessed.length === 0) return { processed: 0, profilesUpdated: 0 };

  // Extract topics/entities
  const { topics, entities } = extractTopicsAndEntities(unprocessed);

  // Generate embeddings in batch
  const embeddings = await generateEmbeddings(unprocessed.map(a => a.content));

  // Update ACUs with embeddings
  await prisma.atomicChatUnit.updateMany({
    where: { id: { in: unprocessed.map(a => a.id) } },
    data: { embedding: embeddings }
  });

  // Create/update profiles
  const results = {
    topicsCreated: 0,
    topicsUpdated: 0,
    entitiesCreated: 0,
    entitiesUpdated: 0
  };

  for (const topic of topics) {
    const existing = await prisma.topicProfile.findUnique({
      where: { userId_slug: { userId, slug: topic.slug } }
    });

    if (existing) {
      await prisma.topicProfile.update({
        where: { id: existing.id },
        data: {
          totalAcus: { increment: topic.acuCount },
          importanceScore: calculateTopicImportance(topic),
          lastEngagedAt: new Date(),
          isDirty: true
        }
      });
      results.topicsUpdated++;
    } else {
      await prisma.topicProfile.create({
        data: {
          userId,
          slug: topic.slug,
          label: topic.label,
          domain: topic.domain,
          totalAcus: topic.acuCount,
          importanceScore: calculateTopicImportance(topic),
          firstEngagedAt: new Date(),
          lastEngagedAt: new Date()
        }
      });
      results.topicsCreated++;
    }
  }

  return { processed: unprocessed.length, profilesUpdated: results };
}
```

---

## Data Integrity

### 1. Cascade Deletion Rules

All foreign keys use `ON DELETE CASCADE` to ensure orphaned records are cleaned up automatically:

- **User deleted** → All TopicProfiles, EntityProfiles, ContextBundles, ClientPresence records deleted
- **TopicProfile deleted** → All TopicConversation links and associated ContextBundles deleted
- **EntityProfile deleted** → Associated ContextBundles deleted
- **Conversation deleted** → All ConversationCompactions and associated ContextBundles deleted

### 2. Immutable ACUs

ACUs are NEVER updated once created. Corrections create new ACUs:

```typescript
// WRONG: Updating ACU content
await prisma.atomicChatUnit.update({
  where: { id: acuId },
  data: { content: "corrected content" }  // ❌ Violates immutability
});

// CORRECT: Create new ACU with correction reference
await prisma.atomicChatUnit.create({
  data: {
    content: "corrected content",
    type: "correction",
    relatedAcuIds: [acuId]  // Links to original
    authorDid: userDid,
    createdAt: new Date()
  }  // ✅ Preserves lineage
});
```

### 3. Bundle Version Tracking

When source data changes, bundle version increments:

```typescript
async function updateBundleOnSourceChange(bundleId: string) {
  const bundle = await prisma.contextBundle.findUnique({ where: { id: bundleId } });

  if (!bundle) return;

  const updatedBundle = await prisma.contextBundle.update({
    where: { id: bundleId },
    data: {
      version: { increment: 1 },
      compiledAt: new Date(),
      isDirty: false
    }
  });

  // Old version is lost (but could be archived if audit needed)
  // Version bump invalidates any caching layers that might have old version
  return updatedBundle;
}
```

### 4. Dirty Flag Propagation

When ACUs are added to a topic, mark bundle dirty:

```typescript
// In ProfileRollupService
async function addACUsToTopic(userId: string, topicSlug: string, acuIds: string[]) {
  // 1. Create ACUs
  await prisma.atomicChatUnit.createMany({
    data: acuIds.map(id => ({ id, ... }))
  });

  // 2. Link ACUs to topic
  const topic = await prisma.topicProfile.findUnique({
    where: { userId_slug: { userId, slug: topicSlug } },
    select: { id: true, relatedAcuIds: true }
  });

  await prisma.topicProfile.update({
    where: { id: topic.id },
    data: {
      relatedAcuIds: [...topic.relatedAcuIds, ...acuIds],
      totalAcus: { increment: acuIds.length },
      isDirty: true  // ← Mark dirty for recompile
    }
  });

  // 3. InvalidationService will trigger recompile
}
```

---

## Appendix: Prisma Schema Full

```prisma
// File: server/prisma/schema.prisma
// Context Engine Extensions (add to existing schema)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ... existing User, Conversation, Message, AtomicChatUnit models ...

model TopicProfile {
  id          String   @id @default(uuid())
  userId      String

  slug        String
  label       String
  aliases     String[]
  parentSlug  String?
  domain      String

  totalConversations   Int      @default(0)
  totalAcus            Int      @default(0)
  totalMessages        Int      @default(0)
  totalTokensSpent     Int      @default(0)
  avgSessionDepth      Float    @default(0)

  firstEngagedAt       DateTime @db.Timestamptz
  lastEngagedAt        DateTime @db.Timestamptz
  engagementStreak     Int      @default(0)
  peakHour             Int?

  proficiencyLevel     String   @default("unknown")
  proficiencySignals   Json     @default("[]")

  importanceScore      Float    @default(0.5)

  compiledContext      String?  @db.Text
  compiledAt           DateTime? @db.Timestamptz
  compiledTokenCount   Int?
  contextVersion       Int      @default(0)
  isDirty              Boolean  @default(true)

  embedding            Float[]
  embeddingModel       String?

  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  relatedMemoryIds     String[]
  relatedAcuIds        String[]
  conversations        TopicConversation[]
  contextBundles       ContextBundle[] @relation("TopicBundles")

  @@unique([userId, slug])
  @@index([userId, importanceScore(sort: Desc)])
  @@index([userId, lastEngagedAt(sort: Desc)])
  @@index([userId, isDirty])
  @@index([domain])
  @@map("topic_profiles")
}

model EntityProfile {
  id          String   @id @default(uuid())
  userId      String

  name        String
  type        String
  aliases     String[]

  relationship String?
  sentiment    Float    @default(0.0)

  facts        Json    @default("[]")

  mentionCount         Int      @default(0)
  conversationCount    Int      @default(0)
  lastMentionedAt      DateTime? @db.Timestamptz
  firstMentionedAt     DateTime? @db.Timestamptz

  compiledContext      String?  @db.Text
  compiledAt           DateTime? @db.Timestamptz
  compiledTokenCount   Int?
  contextVersion       Int      @default(0)
  isDirty              Boolean  @default(true)

  embedding            Float[]
  embeddingModel       String?

  importanceScore      Float    @default(0.5)

  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  contextBundles       ContextBundle[] @relation("EntityBundles")

  @@unique([userId, name, type])
  @@index([userId, importanceScore(sort: Desc)])
  @@index([userId, type])
  @@index([userId, lastMentionedAt(sort: Desc)])
  @@map("entity_profiles")
}

model ContextBundle {
  id          String   @id @default(uuid())
  userId      String

  bundleType  String
  topicProfileId    String?
  entityProfileId   String?
  conversationId    String?
  personaId         String?

  compiledPrompt    String   @db.Text
  tokenCount        Int

  composition       Json     @default("{}")

  version           Int      @default(1)
  isDirty           Boolean  @default(false)
  priority          Float    @default(0.5)

  compiledAt        DateTime @default(now()) @db.Timestamptz
  expiresAt         DateTime? @db.Timestamptz
  lastUsedAt        DateTime @default(now()) @db.Timestamptz
  useCount          Int      @default(0)

  hitCount          Int      @default(0)
  missCount         Int      @default(0)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, bundleType])
  @@index([userId, priority(sort: Desc)])
  @@index([userId, isDirty])
  @@index([expiresAt])
  @@map("context_bundles")
}

model ClientPresence {
  id              String   @id @default(uuid())
  userId          String
  deviceId        String

  activeConversationId    String?
  visibleConversationIds  String[]
  activeNotebookId        String?
  activePersonaId         String?

  lastNavigationPath      String?
  navigationHistory       Json     @default("[]")

  localTime               DateTime? @db.Timestamptz
  sessionStartedAt        DateTime @default(now()) @db.Timestamptz
  idleSince               DateTime? @db.Timestamptz

  predictedTopics         String[]
  predictedEntities       String[]

  lastHeartbeatAt         DateTime @default(now()) @db.Timestamptz
  isOnline                Boolean  @default(true)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceId])
  @@index([userId, isOnline])
  @@index([lastHeartbeatAt])
  @@map("client_presence")
}

model ConversationCompaction {
  id              String   @id @default(uuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  fromMessageIndex  Int
  toMessageIndex    Int
  originalTokenCount Int
  compactedTokenCount Int

  summary           String @db.Text
  keyDecisions      Json   @default("[]")
  openQuestions     Json   @default("[]")
  codeArtifacts     Json   @default("[]")

  compressionRatio  Float
  compactionLevel   Int    @default(1)

  createdAt   DateTime @default(now()) @db.Timestamptz

  @@unique([conversationId, fromMessageIndex, toMessageIndex])
  @@index([conversationId, fromMessageIndex])
  @@map("conversation_compactions")
}

model TopicConversation {
  id              String   @id @default(uuid())
  topicId         String
  topic           TopicProfile @relation(fields: [topicId], references: [id], onDelete: Cascade)
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  relevanceScore  Float    @default(0.5)

  @@unique([topicId, conversationId])
  @@index([topicId])
  @@index([conversationId])
  @@map("topic_conversations")
}

// Update existing models with new relations

model User {
  // ... existing fields ...

  topicProfiles       TopicProfile[]
  entityProfiles      EntityProfile[]
  contextBundles      ContextBundle[]
  clientPresence      ClientPresence[]
}

model Conversation {
  // ... existing fields ...

  topicLinks          TopicConversation[]
  compactions         ConversationCompaction[]
  contextBundles      ContextBundle[]
}

model AiPersona {
  // ... existing fields ...

  contextBundles      ContextBundle[]
}
```

---

**Document End**

Refer to `IMPLEMENTATION_GUIDE_MASTER.md` for overview and other implementation documents.

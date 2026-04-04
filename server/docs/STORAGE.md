# Storage Layer - Technical Deep Dive

## Overview

The VIVIM Storage Layer provides comprehensive data persistence using Prisma ORM with PostgreSQL. It includes vector storage (pgvector) for semantic search capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Code                            │
│         (Context Engine, Memory Engine, API Routes)             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Prisma ORM                                 │
│         (Type-safe database access)                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  Core    │ │  Context │ │  Memory  │ │  Social  │         │
│  │  Models  │ │  Models  │ │  Models  │ │  Models  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              pgvector Extension                          │   │
│  │         (Vector embeddings for semantic search)        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Models

#### User

```prisma
model User {
  id                String   @id @default(uuid())
  did               String   @unique        // Decentralized identifier
  handle            String?  @unique
  displayName       String?
  email             String?  @unique

  // Identity
  publicKey         String
  verificationLevel Int      @default(0)
  trustScore        Float    @default(50)

  // Account
  status            AccountStatus @default(ACTIVE)

  // Relations
  conversations     Conversation[]
  memories          Memory[]
  circlesOwned      Circle[]
  // ... many more relations
}
```

#### Conversation

```prisma
model Conversation {
  id            String   @id @default(uuid())
  provider      String   // openai, anthropic, google, etc.
  sourceUrl     String   @unique
  title         String

  // Stats
  messageCount     Int      @default(0)
  totalTokens      Int?
  totalWords       Int      @default(0)
  totalCodeBlocks  Int      @default(0)

  // Metadata
  metadata     Json     @default("{}")
  tags         String[]

  // Relations
  messages     Message[]
  contextBundles ContextBundle[]
  atomicChatUnits AtomicChatUnit[]

  // Indexes
  @@index([provider])
  @@index([capturedAt(sort: Desc)])
  @@index([ownerId])
}
```

#### Message

```prisma
model Message {
  id             String   @id @default(uuid())
  conversationId String
  role           String   // user, assistant, system
  author         String?
  parts          Json     // Rich content (text, code, images)
  messageIndex   Int      // Position in conversation

  // Rich rendering
  renderedContent Json?   // Pre-rendered HTML/Markdown
  textStyles      Json?   // Inline formatting

  // Metadata
  tokenCount     Int?
  metadata       Json     @default("{}")

  // Relations
  conversation   Conversation @relation(...)
}
```

### Context Models

#### ContextBundle

Pre-compiled context for fast retrieval.

```prisma
model ContextBundle {
  id              String   @id @default(uuid())
  userId          String
  bundleType      String   // identity_core, topic, entity, conversation

  // Relations
  topicProfileId   String?
  entityProfileId  String?
  conversationId  String?
  personaId       String?

  // Content
  compiledPrompt  String
  tokenCount      Int
  composition     Json     @default("{}")

  // Management
  version         Int      @default(1)
  isDirty         Boolean  @default(false)
  priority        Float    @default(0.5)

  // Stats
  useCount        Int      @default(0)
  hitCount        Int      @default(0)
  missCount       Int      @default(0)

  // TTL
  expiresAt       DateTime?

  // Relations
  user            User     @relation(...)
  topicProfile    TopicProfile? @relation(...)
}
```

#### TopicProfile

User's topic interests and knowledge.

```prisma
model TopicProfile {
  id                 String   @id @default(uuid())
  userId             String
  slug               String   // topic-identifier
  label              String   // Display name
  aliases            String[]

  // Domain
  domain             String
  proficiencyLevel   String   @default("unknown")

  // Stats
  totalConversations Int      @default(0)
  totalAcus          Int      @default(0)
  totalTokensSpent   Int      @default(0)
  avgSessionDepth    Float    @default(0)
  engagementStreak   Int      @default(0)

  // Importance
  importanceScore    Float    @default(0.5)

  // Context
  compiledContext    String?
  compiledAt         DateTime?
  contextVersion     Int      @default(0)
  isDirty           Boolean  @default(true)

  // Embedding for semantic search
  embedding          Unsupported("vector(1536)")?
  embeddingModel     String?

  // Relations
  relatedMemoryIds   String[]
  relatedAcuIds      String[]

  // Timestamps
  firstEngagedAt     DateTime
  lastEngagedAt      DateTime

  @@unique([userId, slug])
}
```

#### EntityProfile

Information about entities (people, projects, tools).

```prisma
model EntityProfile {
  id            String   @id @default(uuid())
  userId        String
  name          String
  type          String   // person, project, tool, etc.
  aliases       String[]

  // Relationship
  relationship  String?
  sentiment     Float    @default(0.0)

  // Facts
  facts         Json     @default("[]")

  // Stats
  mentionCount       Int      @default(0)
  conversationCount  Int      @default(0)
  lastMentionedAt    DateTime?
  firstMentionedAt   DateTime?

  // Context
  compiledContext    String?
  compiledAt        DateTime?
  contextVersion    Int      @default(0)
  isDirty           Boolean  @default(true)

  // Embedding
  embedding         Unsupported("vector(1536)")?
  embeddingModel    String?

  importanceScore   Float    @default(0.5)

  @@unique([userId, name, type])
}
```

#### ConversationCompaction

Summarized conversation history.

```prisma
model ConversationCompaction {
  id                  String   @id @default(uuid())
  conversationId      String
  fromMessageIndex    Int
  toMessageIndex      Int

  // Compression
  originalTokenCount  Int
  compactedTokenCount Int
  compressionRatio    Float

  // Content
  summary             String
  keyDecisions        Json     @default("[]")
  openQuestions       Json     @default("[]")
  codeArtifacts       Json     @default("[]")

  compactionLevel     Int      @default(1)

  @@unique([conversationId, fromMessageIndex, toMessageIndex])
}
```

### Memory Models

#### Memory

Core memory storage model.

```prisma
model Memory {
  // Core
  id          String   @id @default(uuid())
  userId      String
  content     String
  summary     String?

  // Type
  memoryType  MemoryType  // EPISODIC, SEMANTIC, PROCEDURAL, etc.
  category    String
  subcategory String?
  tags        String[]

  // Importance
  importance  Float   @default(0.5)
  relevance   Float   @default(0.5)
  accessCount Int     @default(0)
  lastAccessedAt DateTime?

  // Embedding
  embedding   Unsupported("vector(1536)")?
  embeddingModel String?
  embeddingDimension Int?

  // Consolidation
  consolidationStatus MemoryConsolidationStatus @default(RAW)
  consolidationScore Float?
  lastConsolidatedAt DateTime?

  // Temporal
  occurredAt    DateTime?
  validFrom     DateTime?
  validUntil    DateTime?
  expiresAt     DateTime?

  // Hierarchy
  parentMemoryId   String?
  childMemoryIds   String[]
  relatedMemoryIds String[]
  mergedFromIds    String[]

  // Lineage
  lineageDepth     Int      @default(0)
  lineageParentId  String?
  derivedFromIds   String[]
  version          Int      @default(1)

  // Status
  isActive     Boolean @default(true)
  isPinned     Boolean @default(false)
  isArchived   Boolean @default(false)

  // Verification
  isVerified       Boolean?
  verifiedAt        DateTime?
  verificationSource String?

  // Source tracking
  sourceConversationIds String[]
  sourceAcuIds          String[]
  sourceMessageIds      String[]

  // Provenance
  provenanceId     String?
  provider         String?
  sourceUrl        String?
  sourceType       String   @default("conversation")
  sourcePlatform   String?

  // Timestamps
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Indexes
  @@index([userId, memoryType])
  @@index([userId, importance(sort: Desc)])
  @@index([userId, relevance(sort: Desc)])
  @@index([userId, embedding])
  @@index([userId, expiresAt])
}
```

#### MemoryConflict

Tracks contradictory memories.

```prisma
model MemoryConflict {
  id                 String   @id @default(uuid())
  userId             String
  memoryId1          String
  memoryId2          String
  conflictType       String   // contradiction, outdated, duplicate
  confidence         Float    @default(0.5)
  explanation        String
  suggestedResolution String  // merge, archive, keep_newest, manual

  isResolved         Boolean  @default(false)
  resolvedAt         DateTime?
  resolutionMethod   String?
  resolvedBy         String?

  @@index([userId, isResolved])
}
```

#### MemoryRelationship

Graph-like connections between memories.

```prisma
model MemoryRelationship {
  id              String   @id @default(uuid())
  userId          String
  sourceMemoryId  String
  targetMemoryId  String
  relationshipType String   // similar, contradicts, supports, related_to
  strength        Float    @default(0.5)
  metadata        Json     @default("{}")

  @@unique([sourceMemoryId, targetMemoryId, relationshipType])
}
```

#### MemoryAnalytics

Aggregated memory statistics.

```prisma
model MemoryAnalytics {
  id              String   @id @default(uuid())
  userId          String   @unique

  totalMemories   Int      @default(0)
  memoriesByType  Json     @default("{}")
  memoriesByCategory Json   @default("{}")

  // Distribution
  criticalCount   Int      @default(0)
  highCount       Int      @default(0)
  mediumCount     Int      @default(0)
  lowCount        Int      @default(0)

  // Activity
  memoriesCreatedToday    Int  @default(0)
  memoriesCreatedThisWeek  Int  @default(0)
  memoriesCreatedThisMonth Int  @default(0)

  totalAccesses   Int      @default(0)
  avgRelevance    Float    @default(0)

  consolidatedCount Int    @default(0)
  mergedCount       Int    @default(0)

  lastExtractionAt     DateTime?
  lastConsolidationAt DateTime?
  lastCleanupAt       DateTime?
}
```

### Social Models

#### Circle

Private sharing circles.

```prisma
model Circle {
  id          String   @id @default(uuid())
  ownerId     String
  name        String
  description String?
  isPublic    Boolean  @default(false)

  members     CircleMember[]
  owner       User     @relation(...)
}
```

#### AtomicChatUnit (ACU)

Granular content units for sharing.

```prisma
model AtomicChatUnit {
  id            String   @id
  authorDid     String
  content       String
  contentHash   String?

  // Type & Category
  type          String   // code, text, image, etc.
  category      String

  // Quality
  qualityOverall      Float?
  contentRichness    Float?
  structuralIntegrity Float?
  uniqueness         Float?

  // Sharing
  sharingPolicy  String   @default("self")
  sharingCircles String[]

  // Metrics
  viewCount     Int      @default(0)
  shareCount    Int      @default(0)
  quoteCount    Int      @default(0)

  // Embedding
  embedding     Unsupported("vector(1536)")?

  // Relations
  linksFrom     AcuLink[] @relation("SourceAcu")
  linksTo       AcuLink[] @relation("TargetAcu")
}
```

## Vector Search (pgvector)

### Setup

```prisma
// schema.prisma
datasource db {
  provider   = "postgresql"
  extensions = [pgvector(map: "vector")]
}

model Memory {
  embedding Unsupported("vector(1536)")?
  // ... other fields
}
```

### Semantic Search Queries

```typescript
// Find similar memories
const similarMemories = await prisma.$queryRaw`
  SELECT 
    id, 
    content, 
    1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM memories
  WHERE "userId" = ${userId}
    AND embedding IS NOT NULL
    AND "memoryType" = 'SEMANTIC'
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`;

// Find nearby topics
const nearbyTopics = await prisma.$queryRaw`
  SELECT slug, label, embedding <=> ${userInterest}::vector as distance
  FROM topic_profiles
  WHERE "userId" = ${userId}
    AND embedding IS NOT NULL
  ORDER BY embedding <=> ${userInterest}::vector
  LIMIT 5
`;

// Hybrid search (semantic + keyword)
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
  ORDER BY (1 - (embedding <=> ${queryEmbedding}::vector)) * 0.7 + ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) * 0.3 DESC
  LIMIT 20
`;
```

## Encryption

Sensitive data encrypted at rest:

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

## Caching

In-memory caching layer:

```typescript
import { ContextCache, getContextCache } from './context';

const cache = getContextCache();

// Set cache entry
cache.set(
  'bundle',
  cacheKey,
  {
    compiledPrompt: '...',
    tokenCount: 1000,
  },
  5 * 60 * 1000
); // 5 min TTL

// Get cache entry
const cached = cache.get('bundle', cacheKey);

// Check cache stats
console.log(cache.getStats());
```

## Indexing Strategy

| Table             | Index Type                  | Purpose            |
| ----------------- | --------------------------- | ------------------ |
| memories          | B-tree (userId, memoryType) | Type filtering     |
| memories          | B-tree (userId, importance) | Priority retrieval |
| memories          | Vector (embedding)          | Semantic search    |
| memories          | B-tree (userId, expiresAt)  | TTL cleanup        |
| topic_profiles    | Vector (embedding)          | Topic matching     |
| entity_profiles   | Vector (embedding)          | Entity matching    |
| atomic_chat_units | Vector (embedding)          | ACU search         |
| conversations     | B-tree (capturedAt)         | Time queries       |

## Migration Guide

### Adding New Fields

1. Update schema.prisma
2. Run migration:

```bash
npx prisma migrate dev --name add_new_field
```

3. Generate client:

```bash
npx prisma generate
```

### Adding New Models

1. Add model to schema.prisma
2. Run migration
3. Add to TypeScript types if needed

## Performance Tuning

### Query Optimization

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

### Connection Pooling

```typescript
// prisma-client.ts
import { PrismaClient } from '@prisma/client';

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

## Backup & Recovery

```typescript
// Export data
const exportData = await prisma.$transaction([
  prisma.user.findMany(),
  prisma.memory.findMany(),
  prisma.conversation.findMany(),
]);

// Import data
await prisma.memory.createMany({
  data: memoriesToImport,
});
```

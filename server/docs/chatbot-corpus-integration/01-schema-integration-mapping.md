# VIVIM Corpus-Chatbot Schema Integration Mapping

**Document Purpose:** Map the chatbot corpus schema from `CHAT BOT context and memory opus 4.6.md` to the existing VIVIM schema, identifying conflicts, overlaps, and integration points for graceful merging.

**Created:** March 27, 2026  
**Status:** Integration Planning

---

## Executive Summary

The chatbot corpus document proposes a **dual-engine architecture** with:
1. **Corpus Context Engine** (C0-C4 layers) - Company knowledge base
2. **User Context Engine** (L0-L7 layers) - Existing VIVIM system

This document maps the proposed schema extensions to our existing 2787-line Prisma schema, ensuring:
- **Zero breaking changes** to existing functionality
- **Graceful integration** of new corpus models
- **Consistent naming** with existing conventions
- **Leverage existing infrastructure** (VirtualUser, Memory, ACU systems)

---

## 1. Schema Comparison Overview

### 1.1 Proposed New Models (from chatbot doc)

| Model | Purpose | Status in Existing Schema |
|-------|---------|---------------------------|
| `Tenant` | Multi-tenant company deployment | ❌ NEW - Need to create |
| `CorpusDocument` | Company document storage | ❌ NEW - Need to create |
| `CorpusDocumentVersion` | Document versioning | ❌ NEW - Need to create |
| `CorpusChunk` | Chunked document content with embeddings | ❌ NEW - Need to create |
| `CorpusTopic` | Topic taxonomy | ⚠️ PARTIAL - `TopicProfile` exists (user-focused) |
| `CorpusFAQ` | FAQ pairs | ❌ NEW - Need to create |
| `ConversationIndex` | Conversation summary index | ❌ NEW - Need to create |
| `UserProfileSnapshot` | Evolving user profile | ❌ NEW - Need to create |
| `OrchestrationLog` | Dual-engine telemetry | ❌ NEW - Need to create |

### 1.2 Models Requiring Extension

| Existing Model | Proposed Extension | Integration Approach |
|----------------|-------------------|---------------------|
| `VirtualUser` | Add `tenantId`, `currentAvatar`, `profileVersion` | ✅ COMPATIBLE - Add fields |
| `TopicProfile` | Distinguish user topics vs corpus topics | ✅ COMPATIBLE - Add `scope` enum |
| `Memory` | Add chatbot-specific memory categories | ✅ COMPATIBLE - Extend enum |
| `Conversation` | Link to tenant, add chatbot metadata | ✅ COMPATIBLE - Add optional fields |

---

## 2. Detailed Model Mapping

### 2.1 Tenant Model (NEW)

**Purpose:** Multi-tenant isolation for company chatbot deployments

```prisma
model Tenant {
  id                  String    @id @default(uuid())
  name                String
  slug                String    @unique

  // Chatbot configuration
  chatbotConfig       Json      @db.JsonB  // CompanyIdentityCore config
  brandVoice          Json      @db.JsonB  // BrandVoiceConfig
  guardrails          String[]

  // Corpus settings
  defaultModel        String    @default("gpt-4o")
  embeddingModel      String    @default("text-embedding-3-small")
  maxContextTokens    Int       @default(12000)

  // Relations
  documents           CorpusDocument[]
  topics              CorpusTopic[]
  chunks              CorpusChunk[]
  faqPairs            CorpusFAQ[]
  virtualUsers        VirtualUser[]

  // Timestamps
  createdAt           DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt           DateTime  @updatedAt @db.Timestamptz(6)

  @@index([slug])
  @@map("tenants")
}
```

**Integration Notes:**
- No conflicts with existing schema
- Follows existing naming conventions (camelCase, `@db.Timestamptz(6)`)
- Uses existing JSON pattern for config storage
- VirtualUser relation is backward-compatible (nullable initially)

---

### 2.2 CorpusDocument Model (NEW)

**Purpose:** Store company documents with versioning

```prisma
model CorpusDocument {
  id                  String    @id @default(uuid())
  tenantId            String
  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Content
  title               String
  description         String?
  sourceUrl           String?
  rawContent          String
  contentHash         String    // SHA-256 for change detection
  format              String    // markdown, html, pdf, api_spec

  // Organization
  category            String    // product_docs, api_reference, faq, etc.
  topicId             String?
  topic               CorpusTopic? @relation(fields: [topicId], references: [id])

  // Versioning
  version             String    // "2.3.1"
  isActive            Boolean   @default(true)
  previousVersionId   String?

  // Metadata
  authors             String[]
  lastPublishedAt     DateTime
  wordCount           Int

  // Relations
  chunks              CorpusChunk[]
  versions            CorpusDocumentVersion[]

  // Timestamps
  createdAt           DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt           DateTime  @updatedAt @db.Timestamptz(6)
  ingestedAt          DateTime  @default(now()) @db.Timestamptz(6)

  @@index([tenantId, category])
  @@index([tenantId, topicId])
  @@index([contentHash])
  @@map("corpus_documents")
}
```

**Integration Notes:**
- Similar pattern to `AtomicChatUnit` (content storage with embeddings)
- `contentHash` matches existing `Conversation.contentHash` pattern
- Category enum should be defined separately for type safety

---

### 2.3 CorpusDocumentVersion Model (NEW)

**Purpose:** Track document changes over time

```prisma
model CorpusDocumentVersion {
  id                  String    @id @default(uuid())
  documentId          String
  document            CorpusDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  version             String
  contentHash         String
  changeType          String    // major, minor, patch
  changelog           String
  changedSections     String[]

  addedChunkIds       String[]
  modifiedChunkIds    String[]
  removedChunkIds     String[]

  isActive            Boolean   @default(false)
  publishedAt         DateTime
  ingestedAt          DateTime  @default(now()) @db.Timestamptz(6)

  @@index([documentId, version])
  @@map("corpus_document_versions")
}
```

**Integration Notes:**
- Similar to `Conversation.version` but more detailed
- Chunk tracking arrays match existing patterns (`Memory.relatedMemoryIds`)

---

### 2.4 CorpusChunk Model (NEW)

**Purpose:** Indexed, embedded document chunks for retrieval

```prisma
model CorpusChunk {
  id                  String    @id @default(uuid())
  tenantId            String
  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  documentId          String
  document            CorpusDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  // Content
  content             String
  summary             String    // 1-line LLM summary

  // Hierarchy
  parentChunkId       String?
  parentChunk         CorpusChunk? @relation("ChunkHierarchy", fields: [parentChunkId], references: [id])
  childChunks         CorpusChunk[] @relation("ChunkHierarchy")
  chunkIndex          Int
  totalChunks         Int

  // Structure
  sectionPath         String[]  // ["API Reference", "Auth", "OAuth"]
  headingLevel        Int       // H1=1, H2=2, etc.
  contentType         String    // prose, code, table, list, mixed

  // Embeddings
  embedding           Unsupported("vector(1536)")? @db.Vector(1536)
  embeddingModel      String?

  // Metadata
  keywords            String[]
  topicSlug           String
  difficulty          String    // beginner, intermediate, advanced

  // Generated Q&A
  generatedQuestions  String[]
  generatedAnswer     String?
  questionEmbeddings  Json?     @db.JsonB

  // Freshness
  sourceUpdatedAt     DateTime
  freshnessScore      Float     @default(1.0)

  // Quality
  qualityScore        Float     @default(0.5)

  // Analytics
  retrievalCount      Int       @default(0)
  avgRelevanceScore   Float     @default(0.0)
  lastRetrievedAt     DateTime?

  // Status
  isActive            Boolean   @default(true)

  // Timestamps
  createdAt           DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt           DateTime  @updatedAt @db.Timestamptz(6)

  @@index([tenantId, topicSlug])
  @@index([tenantId, contentType])
  @@index([documentId, chunkIndex])
  @@index([tenantId, embedding])
  @@index([isActive])
  @@map("corpus_chunks")
}
```

**Integration Notes:**
- **CRITICAL:** Uses same `pgvector` extension as existing `Memory`, `TopicProfile`, etc.
- Hierarchy pattern (`parentChunkId`, `childChunks`) matches `Memory` model
- `contentType` should be an enum for type safety
- `embedding` syntax needs update to use proper Prisma vector type

**Naming Conflict Resolution:**
- Existing `AtomicChatUnit` also stores content chunks → these serve different purposes
- ACU = user conversation chunks (fine-grained, personal)
- CorpusChunk = company document chunks (authoritative, shared)
- Both can coexist; different use cases

---

### 2.5 CorpusTopic Model (NEW)

**Purpose:** Company knowledge topic taxonomy

```prisma
model CorpusTopic {
  id                  String    @id @default(uuid())
  tenantId            String
  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  slug                String
  name                String
  description         String?

  // Hierarchy
  parentTopicId       String?
  parentTopic         CorpusTopic? @relation("TopicHierarchy", fields: [parentTopicId], references: [id])
  childTopics         CorpusTopic[] @relation("TopicHierarchy")
  path                String[]
  depth               Int

  // Content stats
  documentCount       Int       @default(0)
  chunkCount          Int       @default(0)
  totalTokens         Int       @default(0)

  // Embeddings
  embedding           Unsupported("vector(1536)")? @db.Vector(1536)
  representativeQuestions String[]

  // Analytics
  queryCount          Int       @default(0)
  avgConfidence       Float     @default(0.0)
  popularity          Float     @default(0.0)

  // Freshness
  lastUpdatedAt       DateTime  @default(now())

  // Status
  isActive            Boolean   @default(true)

  // Relations
  documents           CorpusDocument[]

  @@unique([tenantId, slug])
  @@index([tenantId, parentTopicId])
  @@index([tenantId, embedding])
  @@map("corpus_topics")
}
```

**Integration with Existing `TopicProfile`:**

| Aspect | `TopicProfile` (existing) | `CorpusTopic` (new) | Integration |
|--------|--------------------------|---------------------|-------------|
| **Scope** | User-specific topics | Company knowledge topics | Different domains |
| **Owner** | `userId` | `tenantId` | Different relations |
| **Purpose** | Track user interests | Organize company docs | Complementary |
| **Embedding** | User topic embedding | Topic definition embedding | Both use pgvector |

**Recommendation:** Keep separate models - they serve fundamentally different purposes.

---

### 2.6 CorpusFAQ Model (NEW)

**Purpose:** FAQ pairs for quick Q&A matching

```prisma
model CorpusFAQ {
  id                  String    @id @default(uuid())
  tenantId            String
  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  question            String
  answer              String

  // Source
  sourceChunkId       String?
  sourceChunk         CorpusChunk? @relation(fields: [sourceChunkId], references: [id])
  isManual            Boolean   @default(false)  // Manually curated vs auto-generated

  // Embeddings
  questionEmbedding   Unsupported("vector(1536)")? @db.Vector(1536)

  // Metadata
  topicSlug           String
  category            String
  confidence          Float     @default(0.8)

  // Analytics
  matchCount          Int       @default(0)
  helpfulCount        Int       @default(0)
  unhelpfulCount      Int       @default(0)

  // Status
  isActive            Boolean   @default(true)

  @@index([tenantId, topicSlug])
  @@index([tenantId, questionEmbedding])
  @@map("corpus_faqs")
}
```

**Integration Notes:**
- No conflicts with existing schema
- Similar pattern to `Memory` (question/answer could be stored as memory type)
- FAQ auto-generation from chunks is a unique feature

---

### 2.7 ConversationIndex Model (NEW)

**Purpose:** Searchable conversation summaries for recall

```prisma
model ConversationIndex {
  id                  String    @id @default(uuid())
  virtualUserId       String
  virtualUser         VirtualUser @relation(fields: [virtualUserId], references: [id], onDelete: Cascade)
  conversationId      String    @unique

  // Searchable summary
  summary             String
  embedding           Unsupported("vector(1536)")? @db.Vector(1536)

  // Structured metadata
  topics              String[]
  keyFacts            Json      @db.JsonB  // KeyFact[]
  questionsAsked      String[]
  issuesDiscussed     String[]
  decisionsReached    String[]
  actionItems         String[]

  // Metrics
  messageCount        Int
  duration            Int       // minutes
  sentiment           String    // positive, neutral, negative, mixed
  resolutionStatus    String    // resolved, pending, escalated, unknown

  // Temporal
  startedAt           DateTime
  endedAt             DateTime?
  lastReferencedAt    DateTime?
  referenceCount      Int       @default(0)

  // Links
  relatedConversationIds String[]
  memoryIds           String[]

  @@index([virtualUserId, startedAt])
  @@index([virtualUserId, embedding])
  @@index([virtualUserId, topics])
  @@map("conversation_indices")
}
```

**Integration with Existing `Conversation`:**

| Aspect | `Conversation` (existing) | `ConversationIndex` (new) |
|--------|--------------------------|---------------------------|
| **Purpose** | Store full conversation | Searchable summary index |
| **Content** | Full messages (JSON) | Summary + structured metadata |
| **Use Case** | Message retrieval | Semantic search, recall |
| **Relation** | Standalone | 1:1 with Conversation |

**Integration Approach:**
- `ConversationIndex` is a **companion model** to `Conversation`
- `conversationId` is `@unique` - enforces 1:1 relationship
- Can be built asynchronously after conversation creation
- Enables fast semantic search without loading full conversations

---

### 2.8 UserProfileSnapshot Model (NEW)

**Purpose:** Track evolving user profile over time

```prisma
model UserProfileSnapshot {
  id                  String    @id @default(uuid())
  virtualUserId       String
  virtualUser         VirtualUser @relation(fields: [virtualUserId], references: [id], onDelete: Cascade)

  avatar              String    // STRANGER, ACQUAINTANCE, FAMILIAR, KNOWN
  version             Int       @default(1)

  // Core identity (JSON for flexibility)
  identity            Json      @db.JsonB
  // { displayName, role, company, teamSize, plan, expertise }

  // Preferences
  preferences         Json      @db.JsonB
  // { communicationStyle, technicalLevel, responseFormat, timezone, language }

  // Topic expertise map
  topicExpertise      Json      @db.JsonB
  // Record<string, { level, questionsAsked, lastInteraction }>

  // Behavioral patterns
  behavior            Json      @db.JsonB
  // { avgSessionLength, returnFrequency, escalationRate, ... }

  // Active concerns
  activeConcerns      Json      @db.JsonB
  // { unresolvedIssues, featureRequests, actionItems }

  // Evolution history
  evolutionLog        Json      @db.JsonB
  // Array of { timestamp, changes }

  // Timestamps
  createdAt           DateTime  @default(now()) @db.Timestamptz(6)
  lastEvolvedAt       DateTime  @default(now()) @db.Timestamptz(6)

  @@index([virtualUserId])
  @@unique([virtualUserId, version])
  @@map("user_profile_snapshots")
}
```

**Integration Notes:**
- Complements existing `VirtualUser` model
- Versioned approach allows tracking profile evolution
- JSON storage provides flexibility for schema-less evolution
- Could eventually migrate structured fields to dedicated columns

---

### 2.9 VirtualUser Extensions

**Proposed Changes:**

```prisma
model VirtualUser {
  // ... EXISTING FIELDS ...

  // NEW: Tenant association (for chatbot deployments)
  tenantId              String?
  tenant                Tenant? @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  // NEW: Profile evolution tracking
  currentAvatar         String    @default("STRANGER")  // STRANGER, ACQUAINTANCE, FAMILIAR, KNOWN
  profileVersion        Int       @default(0)

  // NEW: Relations
  conversationIndices   ConversationIndex[]
  profileSnapshots      UserProfileSnapshot[]

  // ... EXISTING RELATIONS ...
}
```

**Integration Analysis:**
- ✅ `tenantId` is **nullable** - backward compatible with existing virtual users
- ✅ `currentAvatar` extends existing identification system (confidence score → avatar classification)
- ✅ New relations are **additive** - don't break existing queries
- ✅ Avatar classification can be **computed** from existing metrics (conversationCount, memoryCount)

**Potential Conflict:**
- Existing `VirtualUser.confidenceScore` vs new `currentAvatar`
- **Resolution:** `confidenceScore` = identification confidence (how sure we are this is the same user)
- `currentAvatar` = relationship maturity (how well we know the user)
- Both are valuable; different purposes

---

### 2.10 OrchestrationLog Model (NEW)

**Purpose:** Telemetry for dual-engine orchestration

```prisma
model OrchestrationLog {
  id                  String    @id @default(uuid())
  tenantId            String
  virtualUserId       String
  conversationId      String

  // Classification
  intent              String
  intentConfidence    Float
  avatar              String

  // Weights
  corpusWeight        Float
  userWeight          Float

  // Performance
  assemblyTimeMs      Int
  totalTokens         Int
  corpusTokens        Int
  userTokens          Int
  historyTokens       Int

  // Quality
  corpusConfidence    Float
  chunksRetrieved     Int
  memoriesUsed        Int
  proactiveInsights   Int

  // Outcome
  userSatisfaction    String?   // thumbs_up, thumbs_down, null
  followUpRequired    Boolean   @default(false)
  escalated           Boolean   @default(false)

  createdAt           DateTime  @default(now()) @db.Timestamptz(6)

  @@index([tenantId, createdAt])
  @@index([virtualUserId])
  @@index([intent])
  @@map("orchestration_logs")
}
```

**Integration Notes:**
- Pure telemetry model - no impact on existing functionality
- Similar to existing analytics models (`MemoryAnalytics`, `ProviderStats`)
- Enables performance monitoring and optimization

---

## 3. Existing Model Extensions

### 3.1 TopicProfile Extension

**Current Schema:**
```prisma
model TopicProfile {
  id                 String   @id @default(uuid())
  userId             String
  slug               String
  label              String
  // ... user topic tracking fields
}
```

**Proposed Extension:**
```prisma
model TopicProfile {
  // ... EXISTING FIELDS ...

  // NEW: Distinguish scope
  scope               TopicScope  @default(USER)  // USER or CORPUS
  tenantId            String?     // For CORPUS scope
}

enum TopicScope {
  USER
  CORPUS
}
```

**Integration Analysis:**
- ✅ `scope` enum allows distinguishing user topics from corpus topics
- ✅ `tenantId` is nullable - only used for CORPUS scope
- ⚠️ **Alternative:** Keep separate models (recommended for clarity)

**Recommendation:** Create separate `CorpusTopic` model instead of extending `TopicProfile`. Cleaner separation of concerns.

---

### 3.2 Memory Extension

**Current Schema:**
```prisma
enum MemoryType {
  EPISODIC
  SEMANTIC
  PROCEDURAL
  FACTUAL
  PREFERENCE
  IDENTITY
  RELATIONSHIP
  GOAL
  PROJECT
  CUSTOM
}
```

**Proposed Extension:**
```prisma
// Add chatbot-specific categories
model Memory {
  // ... EXISTING FIELDS ...

  // NEW: Chatbot-specific metadata
  chatbotContext      Json? @db.JsonB
  // { extractedBy: 'realtime' | 'session_end' | 'consolidation', ... }
}
```

**Integration Analysis:**
- ✅ Existing `MemoryType` enum is sufficient - no new types needed
- ✅ `chatbotContext` JSON field provides flexibility
- ✅ `category` field can store chatbot-specific categories

**No breaking changes required.**

---

### 3.3 Conversation Extension

**Current Schema:**
```prisma
model Conversation {
  id              String @id @default(uuid())
  ownerId         String?
  // ... conversation fields
}
```

**Proposed Extension:**
```prisma
model Conversation {
  // ... EXISTING FIELDS ...

  // NEW: Chatbot integration
  tenantId          String?
  tenant            Tenant? @relation(fields: [tenantId], references: [id])
  
  // Chatbot-specific metadata
  chatbotMetadata   Json? @db.JsonB
  // { avatar: 'STRANGER', corpusWeight: 0.8, intent: 'CORPUS_QUERY', ... }
}
```

**Integration Analysis:**
- ✅ `tenantId` is nullable - backward compatible
- ✅ `chatbotMetadata` JSON provides flexibility
- ✅ Existing `metadata` field could also be used

**Recommendation:** Use existing `metadata` JSON field for chatbot data to avoid schema bloat.

---

## 4. Enum Definitions

### 4.1 New Enums Required

```prisma
// Avatar classification (relationship maturity)
enum UserAvatar {
  STRANGER
  ACQUAINTANCE
  FAMILIAR
  KNOWN
}

// Topic scope (user vs corpus)
enum TopicScope {
  USER
  CORPUS
}

// Chunk content type
enum ChunkContentType {
  prose
  code
  table
  list
  mixed
}

// Document change type
enum DocumentChangeType {
  major
  minor
  patch
}

// Intent types (for orchestration)
enum OrchestrationIntent {
  CORPUS_QUERY
  CORPUS_DEEP_DIVE
  SUPPORT_QUERY
  USER_RECALL
  COMPARISON
  HOW_TO
  STATUS_CHECK
  GENERAL_CHAT
  FEEDBACK
  ACCOUNT_SPECIFIC
  CLARIFICATION
  NAVIGATION
  ESCALATION
}

// Sentiment analysis
enum ConversationSentiment {
  positive
  neutral
  negative
  mixed
}

// Resolution status
enum ResolutionStatus {
  resolved
  pending
  escalated
  unknown
}
```

---

## 5. Index Strategy

### 5.1 New Indexes Required

| Model | Index | Purpose |
|-------|-------|---------|
| `Tenant` | `slug` | Tenant lookup by slug |
| `CorpusDocument` | `tenantId, category` | Filter docs by tenant + category |
| `CorpusDocument` | `contentHash` | Change detection |
| `CorpusChunk` | `tenantId, embedding` | Vector search within tenant |
| `CorpusChunk` | `documentId, chunkIndex` | Document chunk ordering |
| `CorpusTopic` | `tenantId, embedding` | Topic semantic search |
| `ConversationIndex` | `virtualUserId, embedding` | Conversation recall |
| `UserProfileSnapshot` | `virtualUserId` | Profile lookup |
| `OrchestrationLog` | `tenantId, createdAt` | Telemetry queries |

### 5.2 Vector Index Compatibility

All vector indexes use the same `pgvector` extension as existing models:
- `Memory.embedding`
- `TopicProfile.embedding`
- `EntityProfile.embedding`
- `AtomicChatUnit.embedding`

**No additional PostgreSQL extensions required.**

---

## 6. Migration Strategy

### 6.1 Phase 1: Core Corpus Models (Non-Breaking)

```bash
# Migration 1: Tenant + CorpusDocument + CorpusChunk + CorpusTopic + CorpusFAQ
npx prisma migrate dev --name add_corpus_core_models
```

**Impact:** Zero - all new models, no existing model changes

### 6.2 Phase 2: VirtualUser Extensions (Backward Compatible)

```bash
# Migration 2: VirtualUser tenant relation + avatar fields
npx prisma migrate dev --name add_virtual_user_chatbot_fields
```

**Impact:** Minimal - nullable fields, existing queries unaffected

### 6.3 Phase 3: Conversation Index + Profile Snapshot

```bash
# Migration 3: ConversationIndex + UserProfileSnapshot
npx prisma migrate dev --name add_conversation_awareness_models
```

**Impact:** Zero - new companion models

### 6.4 Phase 4: Telemetry + Enums

```bash
# Migration 4: OrchestrationLog + new enums
npx prisma migrate dev --name add_orchestration_telemetry
```

**Impact:** Zero - new models and enums only

---

## 7. Naming Convention Alignment

### 7.1 Existing VIVIM Conventions

| Aspect | Convention | Example |
|--------|------------|---------|
| Model names | PascalCase, singular | `Conversation`, `Memory` |
| Fields | camelCase | `userId`, `createdAt` |
| Relations | camelCase, plural for collections | `user`, `conversations` |
| Timestamps | `createdAt`, `updatedAt`, `deletedAt` | Standard across all models |
| IDs | `id` (primary), `{model}Id` (foreign) | `userId`, `conversationId` |
| Metadata | `metadata Json @default("{}")` | Flexible JSON storage |
| Indexes | `@@index([field])`, `@@unique` | Explicit index definitions |
| Mapping | `@@map("table_name")` | Snake-case table names |

### 7.2 Chatbot Doc Alignment

The chatbot corpus schema **already follows** VIVIM conventions:
- ✅ PascalCase model names
- ✅ camelCase fields
- ✅ Proper relation naming
- ✅ Standard timestamp fields
- ✅ JSON metadata pattern
- ✅ Explicit indexes
- ✅ Snake-case table mapping

**No naming conflicts detected.**

---

## 8. Integration Risks & Mitigations

### 8.1 Identified Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Vector dimension mismatch** | Medium | Ensure all embeddings use 1536 dimensions (text-embedding-3-small) |
| **Tenant isolation bugs** | High | Implement tenant-scoped queries at repository layer |
| **VirtualUser relation cycles** | Low | Use `onDelete: SetNull` for tenant relation |
| **Index bloat** | Medium | Monitor index sizes, implement index cleanup jobs |
| **JSON schema drift** | Low | Document JSON schemas in TypeScript types |

### 8.2 Testing Requirements

1. **Vector Search Tests:** Verify pgvector queries work across all models
2. **Tenant Isolation Tests:** Ensure tenant A cannot access tenant B's data
3. **Backward Compatibility Tests:** Existing VirtualUser queries must still work
4. **Performance Tests:** Measure query latency with new indexes
5. **Migration Rollback Tests:** Verify migrations can be rolled back safely

---

## 9. TypeScript Type Extensions

### 9.1 New Types Required

```typescript
// src/types/corpus.ts

export type UserAvatar = 'STRANGER' | 'ACQUAINTANCE' | 'FAMILIAR' | 'KNOWN';

export type TopicScope = 'USER' | 'CORPUS';

export type ChunkContentType = 'prose' | 'code' | 'table' | 'list' | 'mixed';

export type DocumentChangeType = 'major' | 'minor' | 'patch';

export type OrchestrationIntent =
  | 'CORPUS_QUERY'
  | 'CORPUS_DEEP_DIVE'
  | 'SUPPORT_QUERY'
  | 'USER_RECALL'
  | 'COMPARISON'
  | 'HOW_TO'
  | 'STATUS_CHECK'
  | 'GENERAL_CHAT'
  | 'FEEDBACK'
  | 'ACCOUNT_SPECIFIC'
  | 'CLARIFICATION'
  | 'NAVIGATION'
  | 'ESCALATION';

export type ConversationSentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export type ResolutionStatus = 'resolved' | 'pending' | 'escalated' | 'unknown';

export interface TenantChatbotConfig {
  companyName: string;
  productName: string;
  brandVoice: BrandVoiceConfig;
  guardrails: string[];
  escalationInstructions: string;
  answerStyle: 'concise' | 'detailed' | 'conversational';
  citeSources: boolean;
  suggestRelated: boolean;
  proactiveHelp: boolean;
}

export interface BrandVoiceConfig {
  tone: 'professional' | 'friendly' | 'casual' | 'technical';
  formality: 'formal' | 'neutral' | 'informal';
  personality: string[];  // ['helpful', 'patient', 'witty']
}

export interface KeyFact {
  fact: string;
  confidence: number;
  source: 'explicit' | 'inferred';
  messageIndex: number;
}
```

---

## 10. Summary & Recommendations

### 10.1 Schema Compatibility: ✅ EXCELLENT

The chatbot corpus schema integrates **gracefully** with the existing VIVIM schema:

- **Zero breaking changes** to existing models
- **Consistent naming conventions** throughout
- **Leverages existing infrastructure** (pgvector, JSON metadata, relations)
- **Backward compatible** extensions (nullable fields, optional relations)

### 10.2 Recommended Actions

1. **Proceed with schema creation** as documented in this mapping
2. **Create separate models** for corpus topics (don't extend `TopicProfile`)
3. **Use existing `metadata` JSON fields** where possible (avoid schema bloat)
4. **Implement tenant isolation** at repository layer (not just schema)
5. **Add TypeScript types** for all JSON structures
6. **Create comprehensive tests** for vector search across all models

### 10.3 Next Steps

1. ✅ Create Prisma schema files in `prisma/corpus-schema.prisma`
2. ✅ Run migrations in isolated test environment
3. ✅ Implement repository layer with tenant scoping
4. ✅ Create TypeScript types for all new models
5. ✅ Write integration tests for dual-engine orchestration

---

**Document Status:** Ready for Implementation  
**Review Date:** March 27, 2026  
**Approved By:** [Pending]

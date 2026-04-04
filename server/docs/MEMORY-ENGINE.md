# Memory Engine - Technical Deep Dive

## Overview

The Memory Engine is VIVIM's "Second Brain" system - a sophisticated memory management system that stores, retrieves, and manages user memories with semantic search capabilities. It mimics human memory organization with episodic, semantic, and procedural memory types.

> **Product Note**: The Memory Engine is available in all VIVIM tiers - Community (self-hosted), Team, and Enterprise.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Memory Engine                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Create     │  │   Retrieve  │  │  Consolidate │         │
│  │   Memory     │  │   Memory    │  │   Memory     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                │                  │                   │
│         └────────────────┼──────────────────┘                   │
│                          ▼                                      │
│              ┌─────────────────────┐                           │
│              │    Memory Service   │                           │
│              │    (Main API)       │                           │
│              └─────────────────────┘                           │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ Extraction │  │ Retrieval  │  │  Conflict  │              │
│  │  Engine   │  │  Service   │  │  Detection │              │
│  └────────────┘  └────────────┘  └────────────┘              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Storage Layer (Prisma)                   │   │
│  │  Memory | MemoryConflict | MemoryRelationship | ...  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Memory Types (9 Types)

| Type         | Description                    | Use Case                          | Example                                 |
| ------------ | ------------------------------ | --------------------------------- | --------------------------------------- |
| EPISODIC     | Specific events, conversations | Remembering specific interactions | "Last week we discussed..."             |
| SEMANTIC     | Facts, knowledge               | General understanding             | "Python is the user's primary language" |
| PROCEDURAL   | How-to knowledge, skills       | Workflows and processes           | "User prefers TDD methodology"          |
| FACTUAL      | User facts                     | Preferences, bio, background      | "User works as a senior engineer"       |
| PREFERENCE   | Likes, dislikes                | Personalization                   | "Prefers dark mode IDE"                 |
| IDENTITY     | Who the user is                | Core identity information         | "User is a full-stack developer"        |
| RELATIONSHIP | People information             | Contacts, relationships           | "John is the user's tech lead"          |
| GOAL         | Goals, plans                   | Task tracking                     | "User wants to launch MVP by Q2"        |
| PROJECT      | Project-specific               | Project context                   | "E-commerce platform uses Next.js"      |

## Core Components

### MemoryService

Primary interface for all memory operations.

```typescript
class MemoryService {
  // Create
  async createMemory(userId: string, input: CreateMemoryInput): Promise<MemoryWithRelations>;
  async createMemoriesBatch(
    userId: string,
    inputs: CreateMemoryInput[]
  ): Promise<MemoryWithRelations[]>;

  // Read
  async getMemoryById(userId: string, memoryId: string): Promise<MemoryWithRelations | null>;
  async searchMemories(userId: string, input: MemorySearchInput): Promise<SearchResult>;
  async retrieveForContext(
    userId: string,
    options: MemoryRetrievalOptions
  ): Promise<MemoryRetrievalResult>;
  async getMemoriesByConversation(
    userId: string,
    conversationId: string
  ): Promise<MemoryWithRelations[]>;
  async getPinnedMemories(userId: string): Promise<MemoryWithRelations[]>;

  // Update
  async updateMemory(
    userId: string,
    memoryId: string,
    input: UpdateMemoryInput
  ): Promise<MemoryWithRelations>;
  async togglePin(userId: string, memoryId: string): Promise<MemoryWithRelations>;
  async archiveMemory(userId: string, memoryId: string): Promise<MemoryWithRelations>;
  async restoreMemory(userId: string, memoryId: string): Promise<MemoryWithRelations>;

  // Delete
  async deleteMemory(userId: string, memoryId: string): Promise<void>;
  async deleteMemories(userId: string, memoryIds: string[]): Promise<number>;

  // Analytics
  async getStatistics(userId: string): Promise<MemoryStatistics>;
}
```

### MemoryExtractionEngine

Automatically extracts memories from conversations.

```typescript
class MemoryExtractionEngine {
  // Extract from conversation
  async extractFromConversation(
    userId: string,
    conversationId: string,
    options: ExtractionOptions
  ): Promise<ExtractedMemory[]>;

  // Extract from message batch
  async extractFromMessages(
    userId: string,
    messages: Message[],
    options: ExtractionOptions
  ): Promise<ExtractedMemory[]>;

  // Process extraction queue
  async processExtractionQueue(userId: string): Promise<void>;
}
```

### MemoryRetrievalService

Intelligent memory retrieval with relevance scoring.

```typescript
class MemoryRetrievalService {
  // Basic retrieval
  async retrieve(params: RetrievalParams): Promise<RetrievalResult>;

  // Semantic search
  async semanticSearch(
    userId: string,
    query: string,
    options?: SearchOptions
  ): Promise<MemoryWithRelations[]>;

  // Hybrid retrieval
  async hybridRetrieval(
    userId: string,
    query: string,
    options?: HybridOptions
  ): Promise<RetrievalResult>;
}
```

### MemoryConsolidationService

Manages memory hierarchy and merging.

```typescript
class MemoryConsolidationService {
  // Consolidate memories
  async consolidate(userId: string, options: ConsolidationOptions): Promise<ConsolidationResult>;

  // Merge similar memories
  async mergeMemories(userId: string, memoryIds: string[]): Promise<MemoryWithRelations>;

  // Archive old memories
  async archiveMemories(userId: string, options: ArchiveOptions): Promise<number>;
}
```

## Data Model

### Memory Schema

```prisma
model Memory {
  // Core
  id          String      @id @default(uuid())
  userId      String
  content     String
  summary     String?

  // Type & Category
  memoryType  MemoryType  // EPISODIC, SEMANTIC, etc.
  category    String
  subcategory String?
  tags        String[]

  // Importance & Relevance
  importance  Float       @default(0.5)  // 0.0-1.0
  relevance   Float       @default(0.0)
  accessCount Int         @default(0)

  // Embeddings
  embedding   Unsupported("vector(1536)")?
  embeddingModel String?

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
  isActive    Boolean     @default(true)
  isPinned    Boolean     @default(false)
  isArchived  Boolean     @default(false)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Usage Examples

### Creating a Memory

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

### Searching Memories

```typescript
const results = await memoryService.searchMemories(userId, {
  query: 'dark mode',
  memoryTypes: ['PREFERENCE', 'FACTUAL'],
  minImportance: 0.5,
  limit: 20,
  sortBy: 'relevance',
});

console.log(results.memories);
console.log(results.total);
console.log(results.hasMore);
```

### Context Retrieval

```typescript
const contextMemories = await memoryService.retrieveForContext(userId, {
  maxTokens: 2000,
  preferredTypes: ['EPISODIC', 'FACTUAL', 'PREFERENCE'],
  minImportance: 0.3,
  includePinned: true,
  contextMessage: 'Can you help me configure my IDE?',
});

// Returns formatted content ready for LLM context
console.log(contextMemories.content);
console.log(contextMemories.totalTokens);
```

### Memory Extraction

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

console.log(`Extracted ${memories.length} memories`);
for (const mem of memories) {
  console.log(`- [${mem.type}] ${mem.content} (confidence: ${mem.confidence})`);
}
```

## Conflict Detection

Automatically detects contradictory memories:

```typescript
const conflictService = await conflictDetectionService.checkForConflicts(
  userId,
  newContent,
  category,
  excludeMemoryId
);

for (const conflict of conflictService) {
  if (conflict.hasConflict && conflict.confidence > 0.7) {
    // Handle conflict
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

## Embedding Search

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

## Memory Analytics

```typescript
const stats = await memoryService.getStatistics(userId);

console.log({
  totalMemories: stats.totalMemories,
  byType: stats.byType,
  byImportance: {
    critical: stats.byImportance.critical,
    high: stats.byImportance.high,
    medium: stats.byImportance.medium,
    low: stats.byImportance.low,
  },
  avgImportance: stats.avgImportance,
  avgRelevance: stats.avgRelevance,
  pinnedCount: stats.pinnedCount,
  archivedCount: stats.archivedCount,
  totalAccesses: stats.totalAccesses,
});
```

## Event System

Memory operations emit events:

```typescript
// Subscribe to memory events
const unsubscribe = memoryService.on('created', (event) => {
  console.log(`Memory created: ${event.memoryId}`);
  console.log(`Type: ${event.payload.memoryType}`);
});

const unsubscribeAll = memoryService.on('*', (event) => {
  console.log(`Memory event: ${event.type}`, event);
});

// Unsubscribe
unsubscribe();
```

## Performance Considerations

| Operation         | Target Latency |
| ----------------- | -------------- |
| Create Memory     | < 100ms        |
| Search            | < 200ms        |
| Context Retrieval | < 300ms        |
| Batch Create      | < 500ms        |

### Optimization Tips

1. **Use embeddings**: Enable vector search for semantic queries
2. **Pin important memories**: Always include in context
3. **Set appropriate importance**: Higher = more likely to be retrieved
4. **Use summaries**: Store summaries for long memories
5. **Consolidate regularly**: Merge similar memories to reduce noise

## User Interaction

### How Users Interact with the Memory Engine

1. **Create Memories Manually**

   ```javascript
   await session.memory.create({
     content: 'User is building a fintech app',
     type: 'PROJECT',
     importance: 0.9,
     tags: ['fintech', 'startup'],
   });
   ```

2. **Search and Discover**

   ```javascript
   const results = await session.memory.search({
     query: 'coding preferences',
     types: ['PREFERENCE', 'PROCEDURAL'],
   });
   ```

3. **Pin Critical Memories**

   ```javascript
   await session.memory.pin(memoryId);
   // Pinned memories are always included in context
   ```

4. **View Memory Analytics**

   ```javascript
   const stats = await session.memory.stats();
   // Shows: total memories, by type, importance distribution
   ```

5. **Resolve Conflicts**

   ```javascript
   const conflicts = await session.memory.conflicts();
   // View contradictory memories and resolve
   await session.memory.resolve(conflictId, 'keep_newest');
   ```

6. **Extract from Conversations**
   ```javascript
   const extracted = await session.memory.extract(conversationId, {
     types: ['EPISODIC', 'FACTUAL', 'PREFERENCE'],
     confidenceThreshold: 0.7,
   });
   ```

## Product Tier Features

| Feature              | Community | Team     | Enterprise |
| -------------------- | --------- | -------- | ---------- |
| 9 Memory Types       | ✓         | ✓        | ✓          |
| Vector Search        | ✓         | ✓        | ✓          |
| Auto-Extraction      | ✓         | ✓        | ✓          |
| Conflict Detection   | ✓         | ✓        | ✓          |
| Memory Analytics     | Basic     | Advanced | Custom     |
| Team Shared Memories | -         | ✓        | ✓          |
| Role-Based Access    | -         | Basic    | Advanced   |
| Audit Logs           | -         | ✓        | ✓          |
| Memory Export        | -         | ✓        | ✓          |

---

_Part of VIVIM Core Services - Giving AI a memory that never forgets._

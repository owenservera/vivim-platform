# API Reference

## Table of Contents

1. [Context Engine API](#context-engine-api)
2. [Memory API](#memory-api)
3. [Settings API](#settings-api)
4. [TypeScript Interfaces](#typescript-interfaces)

---

## Context Engine API

### Endpoints

#### Health Check

```http
GET /api/v2/context-engine/health
```

Response:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600000,
  "stats": {
    "contextBundles": 150,
    "activeUsers": 25,
    "cacheHitRate": 0.72
  }
}
```

#### Assemble Context

```http
POST /api/v2/context-engine/assemble
```

Request:

```json
{
  "userId": "user-123",
  "conversationId": "conv-456",
  "userMessage": "Help me with my React project",
  "modelId": "gpt-4",
  "personaId": "persona-789"
}
```

Response:

```json
{
  "systemPrompt": "You are an AI assistant...",
  "budget": {
    "layers": {
      "L0": { "allocated": 250 },
      "L1": { "allocated": 150 },
      "L2": { "allocated": 1200 },
      "L3": { "allocated": 800 },
      "L4": { "allocated": 400 },
      "L5": { "allocated": 3200 }
    },
    "totalUsed": 6000,
    "totalAvailable": 8000
  },
  "bundlesUsed": ["identity_core", "global_prefs", "topic", "entity"],
  "metadata": {
    "assemblyTimeMs": 245,
    "detectedTopics": 3,
    "detectedEntities": 2,
    "cacheHitRate": 0.8
  }
}
```

#### Stream Context

```http
POST /api/v2/context-engine/assemble/stream
```

Response (Server-Sent Events):

```
data: {"type": "identity", "content": "You are...", "tokens": 250}
data: {"type": "preferences", "content": "User prefers...", "tokens": 150}
data: {"type": "topic", "content": "React context...", "tokens": 1200}
data: {"type": "done", "totalTokens": 6000}
```

#### Warmup Bundles

```http
POST /api/v2/context-engine/warmup/:userId
```

Request:

```json
{
  "conversationId": "conv-456",
  "personaId": "persona-789"
}
```

#### Invalidate Bundles

```http
POST /api/v2/context-engine/invalidate/:userId
```

Request:

```json
{
  "reason": "conversation_updated",
  "conversationId": "conv-456"
}
```

#### List Bundles

```http
GET /api/v2/context-engine/bundles/:userId
```

Response:

```json
{
  "bundles": [
    {
      "id": "bundle-1",
      "bundleType": "identity_core",
      "tokenCount": 250,
      "priority": 0.9,
      "useCount": 45,
      "hitCount": 40,
      "compiledAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Update Settings

```http
POST /api/v2/context-engine/settings/:userId
```

Request:

```json
{
  "maxContextTokens": 16000,
  "compressionStrategy": "auto",
  "enablePredictions": true,
  "enableJitRetrieval": true
}
```

---

## Memory API

### Endpoints

#### Create Memory

```http
POST /api/memory
```

Request:

```json
{
  "userId": "user-123",
  "content": "User prefers dark mode interface",
  "memoryType": "PREFERENCE",
  "category": "interface",
  "importance": 0.8,
  "tags": ["preference", "ui"],
  "sourceConversationIds": ["conv-456"]
}
```

Response:

```json
{
  "id": "memory-789",
  "content": "User prefers dark mode interface",
  "memoryType": "PREFERENCE",
  "category": "interface",
  "importance": 0.8,
  "tags": ["preference", "ui"],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Get Memory

```http
GET /api/memory/:id?userId=user-123
```

#### Update Memory

```http
PUT /api/memory/:id
```

Request:

```json
{
  "content": "Updated content",
  "importance": 0.9,
  "tags": ["preference", "ui", "coding"]
}
```

#### Delete Memory

```http
DELETE /api/memory/:id?userId=user-123
```

#### Search Memories

```http
GET /api/memory/search?userId=user-123&q=dark%20mode&types=PREFERENCE,FACTUAL&minImportance=0.5&limit=20
```

Query Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | Required - User ID |
| q | string | Search query |
| types | string | Comma-separated memory types |
| categories | string | Comma-separated categories |
| tags | string | Comma-separated tags |
| minImportance | number | Minimum importance (0-1) |
| maxImportance | number | Maximum importance (0-1) |
| limit | number | Results limit (default: 50) |
| offset | number | Pagination offset |
| sortBy | string | Sort field (relevance, importance, createdAt) |
| sortOrder | string | asc or desc |

Response:

```json
{
  "memories": [
    {
      "id": "memory-1",
      "content": "User prefers dark mode",
      "memoryType": "PREFERENCE",
      "importance": 0.8
    }
  ],
  "total": 15,
  "hasMore": false
}
```

#### Get User Memories

```http
GET /api/memory/user/:userId?limit=50&types=EPISODIC,SEMANTIC
```

#### Get Memory Statistics

```http
GET /api/memory/statistics/:userId
```

Response:

```json
{
  "totalMemories": 450,
  "byType": {
    "EPISODIC": 120,
    "SEMANTIC": 80,
    "FACTUAL": 100,
    "PREFERENCE": 50,
    "PROCEDURAL": 40,
    "IDENTITY": 30,
    "RELATIONSHIP": 20,
    "GOAL": 10
  },
  "byImportance": {
    "critical": 15,
    "high": 80,
    "medium": 200,
    "low": 155
  },
  "avgImportance": 0.55,
  "avgRelevance": 0.45,
  "pinnedCount": 12,
  "archivedCount": 45,
  "totalAccesses": 3500
}
```

#### Retrieve for Context

```http
POST /api/memory/retrieve
```

Request:

```json
{
  "userId": "user-123",
  "maxTokens": 2000,
  "preferredTypes": ["EPISODIC", "FACTUAL", "PREFERENCE"],
  "minImportance": 0.3,
  "includePinned": true,
  "contextMessage": "Can you help me code in Python?"
}
```

Response:

```json
{
  "content": "User is a Python developer...\n\nUser prefers dark mode...\n\nLast week user worked on...",
  "memories": [
    {
      "id": "memory-1",
      "content": "User is a Python developer",
      "memoryType": "IDENTITY",
      "importance": 0.9
    }
  ],
  "totalTokens": 1850,
  "usedTokenBudget": 2000
}
```

---

## Settings API

#### Get Settings

```http
GET /api/context-settings/:userId
```

Response:

```json
{
  "maxContextTokens": 12000,
  "responseStyle": "balanced",
  "memoryThreshold": "moderate",
  "focusMode": "balanced",
  "compressionStrategy": "auto",
  "enablePredictions": true,
  "enableJitRetrieval": true,
  "enableCompression": true,
  "enableEntityContext": true,
  "enableTopicContext": true,
  "prioritizeLatency": false,
  "cacheAggressively": true,
  "topicSimilarityThreshold": 0.35,
  "entitySimilarityThreshold": 0.4,
  "memorySimilarityThreshold": 0.4
}
```

#### Update Settings

```http
PUT /api/context-settings/:userId
```

Request:

```json
{
  "maxContextTokens": 16000,
  "compressionStrategy": "aggressive",
  "enablePredictions": false
}
```

---

## TypeScript Interfaces

### Context Types

```typescript
interface AssemblyParams {
  userId: string;
  conversationId: string;
  userMessage: string;
  modelId: string;
  personaId?: string;
  recipeId?: string;
}

interface AssembledContext {
  systemPrompt: string;
  budget: ComputedBudget;
  bundlesUsed: BundleType[];
  metadata: AssemblyMetadata;
}

interface ComputedBudget {
  layers: Record<string, LayerBudget>;
  totalUsed: number;
  totalAvailable: number;
}

interface LayerBudget {
  layer: string;
  minTokens: number;
  idealTokens: number;
  maxTokens: number;
  priority: number;
  allocated: number;
  elasticity: number;
}

type BundleType =
  | 'identity_core'
  | 'global_prefs'
  | 'topic'
  | 'entity'
  | 'conversation'
  | 'composite';

interface ConversationWindow {
  l4Arc: string;
  l6Messages: string;
  l4TokenCount: number;
  l6TokenCount: number;
  strategy: CompressionStrategy;
  coverage: {
    totalMessages: number;
    fullMessages: number;
    summarizedMessages: number;
    droppedMessages: number;
  };
}

type CompressionStrategy = 'full' | 'windowed' | 'compacted' | 'multi_level';
```

### Memory Types

```typescript
interface CreateMemoryInput {
  content: string;
  summary?: string;
  memoryType: MemoryType;
  category?: string;
  subcategory?: string;
  tags?: string[];
  importance?: number;
  sourceConversationIds?: string[];
  sourceAcuIds?: string[];
  sourceMessageIds?: string[];
  occurredAt?: Date;
  validFrom?: Date;
  validUntil?: Date;
  isPinned?: boolean;
  metadata?: Record<string, unknown>;
}

interface UpdateMemoryInput {
  content?: string;
  summary?: string;
  memoryType?: MemoryType;
  category?: string;
  subcategory?: string;
  tags?: string[];
  importance?: number;
  relevance?: number;
  isPinned?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  validUntil?: Date;
  metadata?: Record<string, unknown>;
}

interface MemorySearchInput {
  query?: string;
  memoryTypes?: MemoryType[];
  categories?: string[];
  tags?: string[];
  minImportance?: number;
  maxImportance?: number;
  isPinned?: boolean;
  isActive?: boolean;
  includeArchived?: boolean;
  occurredAfter?: Date;
  occurredBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'importance' | 'relevance' | 'createdAt' | 'accessedAt';
  sortOrder?: 'asc' | 'desc';
}

interface MemoryRetrievalOptions {
  maxTokens?: number;
  minImportance?: number;
  preferredTypes?: MemoryType[];
  requiredTypes?: MemoryType[];
  excludedTypes?: MemoryType[];
  tags?: string[];
  excludeTags?: string[];
  timeRange?: { start: Date; end: Date };
  includePinned?: boolean;
  contextMessage?: string;
}

interface MemoryRetrievalResult {
  content: string;
  memories: Array<{
    id: string;
    content: string;
    summary?: string;
    memoryType: MemoryType;
    category: string;
    importance: number;
    relevance: number;
    sourceConversationIds: string[];
  }>;
  totalTokens: number;
  usedTokenBudget: number;
}

interface MemoryStatistics {
  totalMemories: number;
  byType: Record<MemoryType, number>;
  byCategory: Record<string, number>;
  byImportance: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  avgImportance: number;
  avgRelevance: number;
  pinnedCount: number;
  archivedCount: number;
  activeCount: number;
  totalAccesses: number;
  lastActivity?: Date;
}

type MemoryType =
  | 'EPISODIC'
  | 'SEMANTIC'
  | 'PROCEDURAL'
  | 'FACTUAL'
  | 'PREFERENCE'
  | 'IDENTITY'
  | 'RELATIONSHIP'
  | 'GOAL'
  | 'PROJECT'
  | 'CUSTOM';
```

### Service Interfaces

```typescript
interface ITokenEstimator {
  estimateTokens(text: string): number;
  estimateMessageTokens(message: any): number;
}

interface ILLMService {
  chat(params: { model: string; messages: Array<{ role: string; content: string }> }): Promise<{
    content: string;
    usage?: { total_tokens: number };
  }>;
}

interface IEmbeddingService {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "InvalidRequest",
  "message": "Missing required field: userId",
  "code": "MISSING_FIELD"
}
```

### 404 Not Found

```json
{
  "error": "NotFound",
  "message": "Memory not found",
  "resourceId": "memory-123"
}
```

### 500 Internal Server Error

```json
{
  "error": "InternalError",
  "message": "Failed to assemble context",
  "traceId": "abc-123"
}
```

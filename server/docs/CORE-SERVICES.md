# VIVIM Core Services Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dynamic Context Engine](#dynamic-context-engine)
3. [Memory Engine](#memory-engine)
4. [Storage Layer](#storage-layer)
5. [Integration Guide](#integration-guide)
6. [API Reference](#api-reference)
7. [B2B Product Evolution](#b2b-product-evolution)

---

## Architecture Overview

The VIVIM Core Services provide a sophisticated three-layer architecture for managing AI context, memory, and persistence. This system is designed to be model-agnostic and use-case flexible.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                │
│  (Web App, Mobile App, API Consumers, External Integrations)           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CORE SERVICES LAYER                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ Dynamic Context  │  │   Memory Engine  │  │  Storage Layer   │       │
│  │     Engine       │  │   (Second Brain)│  │   (Prisma/DB)    │       │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘       │
│           │                      │                      │                 │
│           └──────────────────────┼──────────────────────┘               │
│                                  ▼                                       │
│                    ┌────────────────────────┐                           │
│                    │    Model Integration    │                           │
│                    │   (Any LLM Provider)   │                           │
│                    └────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dynamic Context Engine

### Overview

The Dynamic Context Engine is VIVIM's intelligent context assembly system. It dynamically builds context prompts by combining multiple layers of information, optimizing for token budget while maintaining relevance.

### Key Features

- **Layered Context Architecture**: 8-layer system (L0-L7) for organized context
- **Token Budget Optimization**: Intelligent allocation across layers
- **Just-in-Time (JIT) Retrieval**: On-demand knowledge fetching
- **Semantic Context Detection**: Topic and entity recognition
- **Adaptive Compression**: Multiple compression strategies based on conversation length
- **Bundle Caching**: Pre-compiled context bundles for performance

### Context Layers (8 Layers)

| Layer | Name               | Description                      | Typical Budget   |
| ----- | ------------------ | -------------------------------- | ---------------- |
| L0    | Identity Core      | User's core identity, bio, role  | 200-500 tokens   |
| L1    | Global Preferences | User preferences, defaults       | 100-300 tokens   |
| L2    | Topic Context      | Active topic profiles            | 500-2000 tokens  |
| L3    | Entity Context     | Related entity profiles          | 300-1500 tokens  |
| L4    | Conversation Arc   | Conversation summary             | 200-800 tokens   |
| L5    | JIT Knowledge      | Just-in-time retrieved knowledge | 500-2000 tokens  |
| L6    | Message History    | Recent message history           | 1000-8000 tokens |
| L7    | User Message       | Current user message             | 50-500 tokens    |

### Compression Strategies

The engine automatically selects compression strategies based on conversation size:

1. **Full Strategy** (`ratio <= 1.0`): No compression needed
2. **Windowed Strategy** (`ratio <= 2.5`): Keep recent, summarize older
3. **Compacted Strategy** (`ratio <= 8.0`): Zone-based compression
4. **Multi-Level Strategy** (`ratio > 8.0`): Chunk-based hierarchical compression

### Core Components

#### ConversationContextEngine

Manages conversation history compression and context assembly.

```typescript
// Initialize
import { ConversationContextEngine } from './context';
import { TiktokenEstimator } from './context/utils/token-estimator';

const tokenEstimator = new TiktokenEstimator();
const engine = new ConversationContextEngine({
  prisma,
  tokenEstimator,
  llmService,
});

// Build context for a conversation
const context = await engine.buildConversationContext(
  conversationId,
  l4Budget, // Arc budget
  l6Budget // Message budget
);
```

#### DynamicContextAssembler

Assembles full context from multiple sources with caching.

```typescript
import { DynamicContextAssembler } from './context';

const assembler = new DynamicContextAssembler({
  prisma,
  embeddingService,
  tokenEstimator,
  bundleCompiler,
});

const result = await assembler.assemble({
  userId,
  conversationId,
  userMessage: 'Help me with my React project',
  modelId: 'gpt-4',
  personaId,
});
```

#### ContextOrchestrator

Coordinates the entire context pipeline.

```typescript
import { ContextOrchestrator } from './context';

const orchestrator = new ContextOrchestrator({
  prisma,
  config: {
    maxTokens: 12000,
    enableCaching: true,
    enablePrefetch: true,
  },
});

const context = await orchestrator.assembleContext({
  userId,
  conversationId,
  message: "What's my project status?",
});
```

### Advanced Features

#### Context Prediction

Predicts what context will be needed for upcoming interactions.

```typescript
import { PredictionEngine } from './context';

const predictor = new PredictionEngine({ prisma });

const prediction = await predictor.predict({
  userId,
  conversationId,
  currentMessage: 'Can you check the logs?',
});
// Returns: { type: 'entity_related', requiredBundles: ['topic', 'entity'] }
```

#### Context Thermodynamics

Optimizes token allocation based on "energy" (importance) distribution.

```typescript
import { ContextThermodynamics } from './context';

const thermo = new ContextThermodynamics({
  prisma,
  energyFunction: 'recency-weighted',
});

const optimized = await thermo.optimize(contextStates, tokenBudget);
```

#### Parallel Context Pipeline

Processes multiple context sources concurrently.

```typescript
import { ParallelContextPipeline } from './context';

const pipeline = new ParallelContextPipeline({
  maxConcurrency: 5,
  timeoutMs: 5000,
});

const results = await pipeline.execute([
  () => fetchTopics(userId),
  () => fetchEntities(userId),
  () => fetchMemories(userId),
  () => fetchACUs(userId),
]);
```

---

## Memory Engine

### Overview

The Memory Engine is VIVIM's "Second Brain" system - a sophisticated memory management system that stores, retrieves, and manages user memories with semantic search capabilities.

### Memory Types

| Type         | Description                    | Use Case                          |
| ------------ | ------------------------------ | --------------------------------- |
| EPISODIC     | Specific events, conversations | Remembering specific interactions |
| SEMANTIC     | Facts, knowledge               | General understanding             |
| PROCEDURAL   | How-to knowledge, skills       | Workflows and processes           |
| FACTUAL      | User facts                     | Preferences, bio, background      |
| PREFERENCE   | Likes, dislikes                | Personalization                   |
| IDENTITY     | Who the user is                | Core identity information         |
| RELATIONSHIP | People information             | Contacts, relationships           |
| GOAL         | Goals, plans                   | Task tracking                     |
| PROJECT      | Project-specific               | Project context                   |

### Core Components

#### MemoryService

Primary interface for memory CRUD operations.

```typescript
import { MemoryService } from './context/memory';

// Initialize
const memoryService = new MemoryService({
  prisma,
  embeddingService,
  embeddingModel: 'text-embedding-3-small',
});

// Create a memory
const memory = await memoryService.createMemory(userId, {
  content: 'User prefers dark mode interface',
  memoryType: 'PREFERENCE',
  category: 'interface',
  importance: 0.8,
  tags: ['preference', 'ui'],
});

// Search memories
const results = await memoryService.searchMemories(userId, {
  query: 'dark mode',
  memoryTypes: ['PREFERENCE'],
  minImportance: 0.5,
});

// Retrieve for context
const contextMemories = await memoryService.retrieveForContext(userId, {
  maxTokens: 2000,
  preferredTypes: ['EPISODIC', 'FACTUAL', 'PREFERENCE'],
  minImportance: 0.3,
});
```

#### MemoryExtractionEngine

Automatically extracts memories from conversations.

```typescript
import { MemoryExtractionEngine } from './context/memory';

const extractor = new MemoryExtractionEngine({
  prisma,
  llmService,
  config: {
    extractionModel: 'glm-4.7-flash',
    confidenceThreshold: 0.7,
  },
});

// Extract from conversation
const memories = await extractor.extractFromConversation(userId, conversationId, {
  messageRange: { from: 0, to: 50 },
  extractTypes: ['EPISODIC', 'FACTUAL', 'PREFERENCE'],
});
```

#### MemoryRetrievalService

Intelligent memory retrieval with relevance scoring.

```typescript
import { MemoryRetrievalService } from './context/memory';

const retrieval = new MemoryRetrievalService({ prisma });

const results = await retrieval.retrieve({
  userId,
  query: "user's Python skills",
  options: {
    maxResults: 10,
    minRelevance: 0.4,
    includeTypes: ['PROCEDURAL', 'SEMANTIC'],
  },
});
```

#### MemoryConsolidationService

Merges similar memories and manages memory hierarchy.

```typescript
import { MemoryConsolidationService } from './context/memory';

const consolidator = new MemoryConsolidationService({ prisma });

await consolidator.consolidate(userId, {
  targetTypes: ['EPISODIC'],
  similarityThreshold: 0.8,
  maxMemories: 100,
});
```

### Memory Features

#### Conflict Detection

Automatically detects contradictory memories.

```typescript
import { conflictDetectionService } from './services/memory-conflict-detection';

const conflicts = await conflictDetectionService.checkForConflicts(
  userId,
  newContent,
  category,
  excludeMemoryId
);

for (const conflict of conflicts) {
  if (conflict.hasConflict && conflict.confidence > 0.7) {
    // Handle conflict
  }
}
```

#### Embedding-Based Search

Semantic search using vector embeddings.

```typescript
// Memories support pgvector similarity search
const results = await prisma.$queryRaw`
  SELECT id, content, 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM memories
  WHERE "userId" = ${userId}
    AND embedding IS NOT NULL
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`;
```

#### Memory Relationships

Graph-like connections between memories.

```typescript
// Create relationship
await prisma.memoryRelationship.create({
  data: {
    userId,
    sourceMemoryId,
    targetMemoryId,
    relationshipType: 'supports', // similar, contradicts, supports, related_to
    strength: 0.8,
  },
});
```

---

## Storage Layer

### Overview

The storage layer uses Prisma ORM with PostgreSQL and pgvector for vector storage. It provides a comprehensive schema for all VIVIM data models.

### Database Schema

#### Core Models

**Conversation**

```prisma
model Conversation {
  id            String    @id @default(uuid())
  provider      String    // openai, anthropic, etc.
  sourceUrl     String    @unique
  title         String
  messages      Message[]
  contextBundles ContextBundle[]
  atomicChatUnits AtomicChatUnit[]
  // ... metadata fields
}
```

**Message**

```prisma
model Message {
  id             String   @id @default(uuid())
  conversationId String
  role           String   // user, assistant, system
  parts          Json     // Rich content parts
  messageIndex   Int      // Position in conversation
  renderedContent Json?   // Pre-rendered content
  // ... metadata fields
}
```

**AtomicChatUnit (ACU)**

```prisma
model AtomicChatUnit {
  id            String   @id
  content       String
  type          String   // code, text, image, etc.
  category      String
  embedding     Unsupported("vector(1536)")?  // Vector for semantic search
  qualityOverall Float?
  sharingPolicy String   @default("self")
  // ... metadata fields
}
```

#### Context Models

**ContextBundle**

```prisma
model ContextBundle {
  id            String   @id @default(uuid())
  userId        String
  bundleType    String   // identity_core, topic, entity, conversation
  compiledPrompt String  // Pre-compiled context
  tokenCount    Int
  isDirty       Boolean  @default(false)
  priority      Float    @default(0.5)
  // Relations to TopicProfile, EntityProfile, etc.
}
```

**TopicProfile**

```prisma
model TopicProfile {
  id                String   @id @default(uuid())
  userId            String
  slug              String   // topic identifier
  label             String   // display name
  embedding         Unsupported("vector(1536)")?
  importanceScore   Float    @default(0.5)
  compiledContext   String?  // Pre-compiled topic context
  relatedMemoryIds  String[]
  // ... engagement metrics
}
```

**EntityProfile**

```prisma
model EntityProfile {
  id            String   @id @default(uuid())
  userId        String
  name          String
  type          String   // person, project, tool, etc.
  embedding     Unsupported("vector(1536)")?
  importanceScore Float  @default(0.5)
  compiledContext String?
  // ... relationship data
}
```

#### Memory Models

**Memory**

```prisma
model Memory {
  id             String   @id @default(uuid())
  userId         String
  content        String
  summary        String?
  memoryType     MemoryType  // EPISODIC, SEMANTIC, etc.
  category       String
  importance     Float    @default(0.5)
  relevance      Float    @default(0.5)
  embedding      Unsupported("vector(1536)")?
  consolidationStatus MemoryConsolidationStatus

  // Temporal
  occurredAt     DateTime?
  validFrom      DateTime?
  validUntil     DateTime?

  // Relationships
  parentMemoryId String?
  relatedMemoryIds String[]
  // ... metadata
}
```

**MemoryAnalytics**

```prisma
model MemoryAnalytics {
  id              String   @id @default(uuid())
  userId          String   @unique
  totalMemories   Int      @default(0)
  memoriesByType  Json     // { EPISODIC: 100, SEMANTIC: 50 }
  memoriesByCategory Json
  criticalCount   Int      @default(0)
  // ... usage statistics
}
```

### Storage Features

#### Vector Search

PostgreSQL with pgvector for semantic similarity search.

```typescript
// Enable pgvector in schema.prisma
datasource db {
  provider   = "postgresql"
  extensions = [pgvector(map: "vector")]
}

// Use in queries
const similarItems = await prisma.$queryRaw`
  SELECT *, 1 - (embedding <=> ${searchVector}::vector) as similarity
  FROM memories
  WHERE "userId" = ${userId}
    AND embedding IS NOT NULL
  ORDER BY embedding <=> ${searchVector}::vector
  LIMIT 10
`;
```

#### Encryption

Sensitive data encryption at rest.

```typescript
import { encryptString, decryptString } from './lib/crypto';

// Encrypt before storage
const encrypted = encryptString(plaintext, userPublicKey);

// Decrypt on retrieval
const decrypted = decryptString(encrypted, userPublicKey);
```

#### Caching

In-memory caching for performance.

```typescript
import { ContextCache, getContextCache } from './context';

const cache = getContextCache();

// Set with TTL
cache.set('bundle', cacheKey, data, 5 * 60 * 1000);

// Get cached
const cached = cache.get('bundle', cacheKey);
```

---

## Integration Guide

### Model Agnostic Design

The core services work with any LLM provider. Here's how to integrate:

```typescript
// 1. Implement token estimator for your model
import { ITokenEstimator } from './context/types';

class MyModelTokenEstimator implements ITokenEstimator {
  estimateTokens(text: string): number {
    // Model-specific estimation
    return Math.ceil(text.length / 4);
  }

  estimateMessageTokens(message: any): number {
    return this.estimateTokens(JSON.stringify(message.parts));
  }
}

// 2. Implement LLM service interface
import { ILLMService } from './context/types';

class MyModelLLMService implements ILLMService {
  async chat(params: { model: string; messages: any[] }) {
    // Call your model provider
    const response = await myModelClient.chat(params);
    return {
      content: response.choices[0].message.content,
      usage: response.usage,
    };
  }
}

// 3. Connect to services
const tokenEstimator = new MyModelTokenEstimator();
const llmService = new MyModelLLMService();

const contextEngine = new ConversationContextEngine({
  prisma,
  tokenEstimator,
  llmService,
});
```

### Quick Start

```typescript
import { ConversationContextEngine } from './context';
import { DynamicContextAssembler } from './context';
import { MemoryService } from './context/memory';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize all services
const tokenEstimator = new TiktokenEstimator();
const llmService = createLLMService({ provider: 'openai' });
const embeddingService = createEmbeddingService({ provider: 'openai' });

const contextEngine = new ConversationContextEngine({
  prisma,
  tokenEstimator,
  llmService,
});

const contextAssembler = new DynamicContextAssembler({
  prisma,
  embeddingService,
  tokenEstimator,
  bundleCompiler: new BundleCompiler({ prisma }),
});

const memoryService = new MemoryService({
  prisma,
  embeddingService,
});

// Use in your application
async function handleUserMessage(userId: string, message: string) {
  // 1. Assemble context
  const context = await contextAssembler.assemble({
    userId,
    userMessage: message,
    conversationId: currentConversationId,
  });

  // 2. Get relevant memories
  const memories = await memoryService.retrieveForContext(userId, {
    maxTokens: 1000,
    contextMessage: message,
  });

  // 3. Call your model
  const response = await llmService.chat({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: context.systemPrompt },
      ...history,
      { role: 'user', content: message },
    ],
  });

  return response;
}
```

---

## API Reference

### Context Engine Routes

| Method | Endpoint                                    | Description           |
| ------ | ------------------------------------------- | --------------------- |
| GET    | `/api/v2/context-engine/health`             | Engine health check   |
| POST   | `/api/v2/context-engine/assemble`           | Full context assembly |
| POST   | `/api/v2/context-engine/assemble/stream`    | Streaming context     |
| PUT    | `/api/v2/context-engine/presence/:userId`   | Update presence       |
| POST   | `/api/v2/context-engine/warmup/:userId`     | Trigger bundle warmup |
| POST   | `/api/v2/context-engine/invalidate/:userId` | Invalidate bundles    |
| GET    | `/api/v2/context-engine/bundles/:userId`    | List context bundles  |
| POST   | `/api/v2/context-engine/settings/:userId`   | Update settings       |

### Memory Routes

| Method | Endpoint                         | Description       |
| ------ | -------------------------------- | ----------------- |
| POST   | `/api/memory`                    | Create memory     |
| GET    | `/api/memory/:id`                | Get memory        |
| PUT    | `/api/memory/:id`                | Update memory     |
| DELETE | `/api/memory/:id`                | Delete memory     |
| GET    | `/api/memory/search`             | Search memories   |
| GET    | `/api/memory/user/:userId`       | Get user memories |
| GET    | `/api/memory/statistics/:userId` | Memory statistics |

### Settings Routes

| Method | Endpoint                        | Description     |
| ------ | ------------------------------- | --------------- |
| GET    | `/api/context-settings/:userId` | Get settings    |
| PUT    | `/api/context-settings/:userId` | Update settings |

---

## B2B Product Evolution

### Product Tiers

#### Community Edition (B2C - Current)

- **Target**: Individual developers, hobbyists
- **Deployment**: Self-hosted
- **Support**: Community (GitHub, Discord)
- **Cost**: Free (AGPL v3)

#### Team Edition (B2B - Phase 2)

- **Target**: Small teams (up to 50 users)
- **Deployment**: Cloud-hosted (VIVIM managed)
- **Support**: Email support
- **Cost**: $49/month
- **Launch**: Q2 2025

#### Enterprise Edition (B2B - Phase 3)

- **Target**: Large organizations
- **Deployment**: Cloud or dedicated infrastructure
- **Support**: Dedicated Customer Success Manager
- **Cost**: Custom pricing
- **Launch**: Q3 2025

### B2B Feature Roadmap

| Feature                   | Community | Team  | Enterprise |
| ------------------------- | --------- | ----- | ---------- |
| **Core Engine**           |           |       |            |
| 8-Layer Context           | ✓         | ✓     | ✓          |
| Memory Types              | 9         | 9     | 9          |
| Vector Search             | ✓         | ✓     | ✓          |
| Compression               | ✓         | ✓     | Advanced   |
| **Platform**              |           |       |            |
| Self-Hosted               | ✓         | -     | -          |
| Cloud Hosting             | -         | ✓     | ✓          |
| Multi-Tenant              | -         | ✓     | ✓          |
| Single-Tenant             | -         | -     | ✓          |
| **Team Features**         |           |       |            |
| Team Workspaces           | -         | ✓     | ✓          |
| Shared Memories           | -         | ✓     | ✓          |
| Role-Based Access         | -         | Basic | Advanced   |
| Admin Controls            | -         | ✓     | ✓          |
| **Security & Compliance** |           |       |            |
| Audit Logs                | -         | ✓     | ✓          |
| SSO/SAML                  | -         | -     | ✓          |
| Encryption at Rest        | ✓         | ✓     | ✓          |
| API Keys                  | -         | ✓     | ✓          |
| SOC 2 Type II             | -         | -     | Q4 2025    |
| HIPAA                     | -         | -     | Q1 2026    |
| GDPR Compliance           | -         | ✓     | ✓          |
| **Support**               |           |       |            |
| Community                 | ✓         | ✓     | ✓          |
| Email Support             | -         | ✓     | ✓          |
| Priority Support          | -         | -     | ✓          |
| Dedicated CSM             | -         | -     | ✓          |
| SLA                       | -         | 99.5% | 99.99%     |

### B2B Use Cases

#### AI SaaS Products

Companies building AI-powered products can use VIVIM as their memory infrastructure:

- Customer-facing AI assistants
- Internal productivity tools
- AI-powered CRM/Support

**Example**: A startup building a coding assistant uses VIVIM to remember each user's coding preferences, project contexts, and historical interactions.

#### Enterprise Knowledge Management

Large organizations use VIVIM to centralize organizational memory:

- Team knowledge bases
- Project documentation
- Institutional knowledge

**Example**: A consultancy firm uses VIVIM to maintain knowledge across client engagements, ensuring continuity when team members change.

#### Vertical AI Solutions

Industry-specific AI solutions leverage VIVIM for domain expertise:

- Legal tech
- Healthcare AI
- Financial services

**Example**: A legal tech company uses VIVIM to maintain case history, client preferences, and legal precedents.

### B2B Pricing Model

```
Team Edition: $49/month
├── Up to 50 users
├── 100K API calls/month
├── 10GB storage
├── Cloud hosting
├── Email support
└── 99.5% SLA

Enterprise: Custom
├── Unlimited users
├── Unlimited API calls
├── Unlimited storage
├── Dedicated infrastructure
├── SSO/SAML
├── Dedicated CSM
├── Custom integrations
├── Priority support
└── 99.99% SLA
```

### Enterprise Differentiation

What makes VIVIM Enterprise compelling:

1. **Data Sovereignty**
   - Choose deployment region (US, EU, APAC)
   - Keep data within compliance boundaries

2. **Compliance Ready**
   - SOC 2 Type II certified (Q4 2025)
   - HIPAA eligible (Q1 2026)
   - GDPR compliant

3. **Integration Ecosystem**
   - Pre-built connectors for common enterprise tools
   - Custom API integrations
   - Webhook support

4. **Dedicated Support**
   - Named Customer Success Manager
   - Priority ticket resolution
   - Regular business reviews

---

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/vivim

# Model Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Context Engine
DEFAULT_MAX_TOKENS=12000
COMPACTION_MODEL=glm-4.7-flash

# Embeddings
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

### User Settings Schema

```typescript
interface UserContextSettings {
  maxContextTokens: number; // 4096-50000
  responseStyle: string; // balanced, concise, detailed
  memoryThreshold: string; // minimal, moderate, aggressive
  focusMode: string; // balanced, focused, exploratory
  compressionStrategy: string; // auto, aggressive, conservative
  enablePredictions: boolean;
  enableJitRetrieval: boolean;
  enableCompression: boolean;
  enableEntityContext: boolean;
  enableTopicContext: boolean;
  prioritizeLatency: boolean;
  cacheAggressively: boolean;
}
```

---

## Performance Considerations

1. **Bundle Caching**: Pre-compiled context bundles reduce assembly time
2. **Parallel Pipeline**: Fetch multiple context sources concurrently
3. **Vector Indexing**: pgvector indexes for fast similarity search
4. **Smart Compression**: Select appropriate strategy based on conversation size
5. **TTL Management**: Automatic cleanup of expired context bundles

---

## Security

- **Encryption at Rest**: Sensitive memory content encrypted with user keys
- **Row-Level Security**: User data isolation at database level
- **API Authentication**: All endpoints require authentication
- **Input Validation**: Sanitized inputs to prevent injection

---

_Generated for VIVIM Core Services v1.0_

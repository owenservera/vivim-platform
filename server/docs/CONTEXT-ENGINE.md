# Dynamic Context Engine - Technical Deep Dive

## Overview

The Dynamic Context Engine is VIVIM's intelligent context assembly system. It dynamically builds context prompts by combining multiple layers of information, optimizing for token budget while maintaining relevance.

> **Product Note**: The Context Engine is available in all VIVIM tiers - Community (self-hosted), Team, and Enterprise.

## Architecture

```
User Message
     │
     ▼
┌─────────────────────┐
│  Context Detection  │
│  - Topic Matching   │
│  - Entity Matching │
│  - Intent Detection │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Bundle Gathering  │
│  - Identity (L0)   │
│  - Preferences (L1)│
│  - Topics (L2)     │
│  - Entities (L3)   │
│  - Conversation (L4)│
│  - JIT (L5)        │
│  - Messages (L6)   │
│  - User (L7)       │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│   JIT Retrieval    │
│  - Semantic Search  │
│  - Knowledge Fetch │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Budget Allocation  │
│  - Thermodynamics  │
│  - Priority Logic  │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Prompt Assembly   │
│  - Caching         │
│  - Compression     │
└─────────────────────┘
     │
     ▼
   System Prompt
```

## Context Layers (8 Layers)

### Layer 0: Identity Core (L0_identity)

- User's core identity information
- Bio, role, background
- ~200-500 tokens
- **Priority**: 100 (highest)
- **Elasticity**: 0.0 (non-negotiable)

### Layer 1: Global Preferences (L1_global_prefs)

- User settings and preferences
- Default behaviors
- ~100-300 tokens
- **Priority**: 95
- **Elasticity**: 0.1

### Layer 2: Topic Context (L2_topic)

- Active topic profiles
- Topic-specific knowledge
- ~500-2000 tokens
- **Priority**: 70-85 (dynamic based on detected topics)
- **Elasticity**: 0.6

### Layer 3: Entity Context (L3_entity)

- Related entity profiles
- People, projects, tools
- ~300-1500 tokens
- **Priority**: 65
- **Elasticity**: 0.7

### Layer 4: Conversation Arc (L4_conversation)

- Conversation summary
- Key decisions, open questions
- ~200-800 tokens
- **Priority**: 30-88 (higher for active conversations)
- **Elasticity**: 0.3

### Layer 5: JIT Knowledge (L5_jit)

- Just-in-time retrieved knowledge
- On-demand semantic search results
- ~500-2000 tokens
- **Priority**: 75
- **Elasticity**: 0.5

### Layer 6: Message History (L6_message_history)

- Recent message history
- Full or compressed based on length
- ~1000-8000 tokens
- **Priority**: 80-90 (higher for dialogue-heavy)
- **Elasticity**: 0.4

### Layer 7: User Message (L7_user_message)

- Current user message
- Included for context reference
- ~50-500 tokens
- **Priority**: 100 (highest)
- **Elasticity**: 0.0 (exact size)

## Compression Strategies

### Full Strategy

Used when `compressionRatio <= 1.0` (no compression needed)

```typescript
// No compression - all messages included as-is
const l6Content = messages.map((m) => formatMessage(m)).join('\n\n');
```

### Windowed Strategy

Used when `compressionRatio <= 2.5`

- Keep recent messages in full (~70%)
- Summarize older messages (~30%)

### Compacted Strategy

Used when `compressionRatio <= 8.0`

Zone-based approach:

- Zone A (0-40%): Highly compressed summary
- Zone B (40-75%): Key messages selected
- Zone C (75-100%): Recent messages full

### Multi-Level Strategy

Used when `compressionRatio > 8.0`

- Chunk-based approach (20 messages per chunk)
- Hierarchical summarization
- Multiple compression levels

## Key Classes

### ConversationContextEngine

Main engine for conversation context assembly.

```typescript
class ConversationContextEngine {
  async buildConversationContext(
    conversationId: string,
    l4Budget: number,
    l6Budget: number
  ): Promise<ConversationWindow>;

  // Private methods for each strategy
  private strategyFull(messages, l4Budget, l6Budget);
  private strategyWindowed(conv, messages, l4Budget, l6Budget);
  private strategyCompacted(conv, messages, l4Budget, l6Budget);
  private strategyMultiLevel(conv, messages, l4Budget, l6Budget);
}
```

### DynamicContextAssembler

Higher-level context assembly with caching.

```typescript
class DynamicContextAssembler {
  async assemble(params: AssemblyParams): Promise<AssembledContext>

  // Detects what topics/entities are relevant
  private async detectMessageContext(...)

  // Gathers pre-compiled bundles
  private async gatherBundles(...)

  // Just-in-time knowledge retrieval
  private async justInTimeRetrieval(...)

  // Allocates token budget
  private computeBudget(...)
}
```

### ContextOrchestrator

Coordinates entire pipeline.

```typescript
class ContextOrchestrator {
  async assembleContext(params): Promise<FullContext>;
  async warmupBundles(userId): Promise<void>;
  async invalidateBundles(userId): Promise<void>;
}
```

## Message Importance Scoring

The engine scores each message to determine what to keep:

````typescript
function scoreMessageImportance(message, index, totalCount): number {
  let score = 0;

  // Recency weight
  score += (index / totalCount) * 20;

  // Word count
  const wordCount = text.split(/\s+/).length;
  score += Math.min(25, Math.log2(wordCount + 1) * 5);

  // Code blocks
  const codeBlockCount = (text.match(/```/g) || []).length / 2;
  score += codeBlockCount * 15;

  // Questions
  const questionCount = (text.match(/\?/g) || []).length;
  score += Math.min(15, questionCount * 5);

  // Decisions
  const decisionPatterns = /\b(decided|decision|let's go with|agreed|final)\b/gi;
  const decisionCount = (text.match(decisionPatterns) || []).length;
  score += decisionCount * 10;

  // Problems
  const problemPatterns = /\b(error|bug|issue|problem|failed|broken)\b/gi;
  const problemCount = (text.match(problemPatterns) || []).length;
  score += Math.min(15, problemCount * 5);

  // Position bonuses
  if (message.role === 'user') score += 5;
  if (index === 0 || index === totalCount - 1) score += 15;

  return score;
}
````

## Caching Strategy

### Bundle Caching

- Pre-compiled bundles cached for 5 minutes
- Cache invalidation on conversation updates
- Priority-based bundle selection

### Context Cache

```typescript
interface CacheEntry {
  key: string;
  value: any;
  expiresAt: Date;
  hitCount: number;
}
```

### Invalidation Events

```typescript
// Events that trigger cache invalidation
- New message in conversation
- Memory updated
- User settings changed
- Topic profile updated
- Entity profile updated
```

## Budget Thermodynamics

The ContextThermodynamics system optimizes token allocation:

1. **Energy Calculation**: Each context piece has "energy" based on:
   - Recency (more recent = higher energy)
   - Relevance (detected relevance score)
   - Importance (user-defined importance)

2. **Budget Distribution**:
   - Calculate total "energy" across all layers
   - Distribute tokens proportionally to energy
   - Respect minimum floors per layer

3. **Optimization**:
   - Iterate to find optimal distribution
   - Handle conflicts (multiple layers want same tokens)
   - Preserve critical context

## Integration Example

```typescript
import { ConversationContextEngine } from './context';
import { TiktokenEstimator } from './context/utils/token-estimator';

const engine = new ConversationContextEngine({
  prisma,
  tokenEstimator: new TiktokenEstimator(),
  llmService,
});

// Build context for a 100-message conversation
const result = await engine.buildConversationContext(
  'conversation-123',
  500, // L4 budget (arc)
  4000 // L6 budget (messages)
);

console.log(result.strategy); // 'compacted'
console.log(result.l4TokenCount); // 234
console.log(result.l6TokenCount); // 3892
console.log(result.coverage); // { totalMessages: 100, fullMessages: 25, summarizedMessages: 75, droppedMessages: 0 }
```

## Performance Metrics

| Metric            | Target  |
| ----------------- | ------- |
| Assembly Time     | < 500ms |
| Cache Hit Rate    | > 70%   |
| Compression Ratio | 3-10x   |
| Token Accuracy    | ± 5%    |

## Configuration

```typescript
interface ContextConfig {
  maxTokens: number;
  defaultL4Budget: number;
  defaultL6Budget: number;
  compressionModel: string;
  enableCaching: boolean;
  cacheTTLMs: number;
  enablePrediction: boolean;
  enableJIT: boolean;
}
```

## User Interaction

### How Users Interact with the Context Engine

1. **Configure Layer Budgets**

   ```javascript
   await session.settings.update({
     layerBudgets: {
       L0_identity: { min: 200, ideal: 400, max: 600 },
       L1_global_prefs: { min: 100, ideal: 300, max: 500 },
       L2_topic: { min: 500, ideal: 1500, max: 2500 },
     },
   });
   ```

2. **View Assembled Context** (Debug Mode)

   ```javascript
   const assembly = await contextEngine.assemble({
     userId,
     conversationId,
     userMessage: 'Help me debug this code',
   });

   console.log(assembly.metadata.bundlesInfo);
   // Shows which layers were included and their token counts
   ```

3. **Set Compression Strategy**

   ```javascript
   await session.settings.update({
     compressionStrategy: 'aggressive', // or 'auto', 'conservative'
   });
   ```

4. **Warmup Bundles** (Pre-load context)
   ```javascript
   await contextEngine.warmup(userId, {
     conversationId: 'conv-123',
     personaId: 'persona-456',
   });
   ```

## Product Tier Features

| Feature            | Community | Team     | Enterprise |
| ------------------ | --------- | -------- | ---------- |
| 8 Layers           | ✓         | ✓        | ✓          |
| Bundle Caching     | ✓         | ✓        | Advanced   |
| JIT Retrieval      | ✓         | ✓        | ✓          |
| Thermodynamics     | Basic     | Advanced | Custom     |
| Context Prediction | -         | ✓        | ✓          |
| Streaming Support  | -         | ✓        | ✓          |

---

_Part of VIVIM Core Services - Giving AI a memory that never forgets._

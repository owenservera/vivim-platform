# Context Engine

## Overview

The Context Engine is the brain of Sovereign Memory - it intelligently retrieves, assembles, and optimizes context from your memory store to power personalized AI interactions.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Context Engine Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Query     │────►│  Parallel   │────►│   Hybrid    │      │
│  │  Analysis   │     │  Pipeline   │     │   Retrieval │      │
│  └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                  │              │
│                                                  ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Prompt    │◄────│   Context   │◄────│   Context   │      │
│  │  Formatter  │     │  Assembler  │     │   Assembler │      │
│  └─────────────┘     └──────┬──────┘     └─────────────┘      │
│                             │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                         │
│                    │  Token Budget   │                         │
│                    │   Allocator     │                         │
│                    └─────────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Parallel Context Pipeline

### Architecture

The Parallel Context Pipeline executes multiple retrieval tasks concurrently for optimal performance.

```typescript
interface PipelineConfig {
  // Concurrency control
  maxConcurrency: number;      // Default: 5
  timeout: number;             // Default: 30000ms
  
  // Streaming
  enableStreaming: boolean;    // Default: true
  streamBatchSize: number;     // Default: 5
  
  // Prioritization
  priorityLevels: {
    critical: number;          // 0-100
    high: number;              // 0-100
    normal: number;            // 0-100
    low: number;               // 0-100
  };
}
```

**Pipeline Execution:**

```typescript
interface PipelineInput {
  userId: string;
  query: string;
  conversationHistory?: Message[];
  options: {
    includeMemories: boolean;
    includeEntities: boolean;
    includeTopics: boolean;
    includeACUs: boolean;
    tokenBudget: number;
  };
}

interface PipelineOutput {
  // Retrieved context
  memories: MemoryResult[];
  entities: EntityResult[];
  topics: TopicResult[];
  acus: ACUResult[];
  
  // Metadata
  totalTokens: number;
  retrievalTime: number;
  cacheHits: number;
  cacheMisses: number;
  
  // Quality metrics
  relevanceScore: number;
  diversityScore: number;
  freshnessScore: number;
}

class ParallelContextPipeline {
  private config: PipelineConfig;
  private tasks: Map<string, ContextTask>;

  async execute(input: PipelineInput): Promise<PipelineOutput> {
    const startTime = Date.now();
    
    // Create parallel tasks
    const tasks: Promise<ContextResult>[] = [];
    
    if (input.options.includeMemories) {
      tasks.push(this.retrieveMemories(input));
    }
    if (input.options.includeEntities) {
      tasks.push(this.retrieveEntities(input));
    }
    if (input.options.includeTopics) {
      tasks.push(this.retrieveTopics(input));
    }
    if (input.options.includeACUs) {
      tasks.push(this.retrieveACUs(input));
    }
    
    // Execute in parallel with concurrency limit
    const results = await this.executeWithConcurrency(tasks, {
      concurrency: this.config.maxConcurrency,
      timeout: this.config.timeout,
    });
    
    // Aggregate results
    return this.aggregateResults(results, startTime);
  }

  private async executeWithConcurrency<T>(
    tasks: Promise<T>[],
    options: { concurrency: number; timeout: number }
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (const task of tasks) {
      const p = task.then((result) => {
        results.push(result);
      });
      
      executing.push(p);
      
      if (executing.length >= options.concurrency) {
        await Promise.race(executing);
        // Remove completed promises
        const stillExecuting = executing.filter(
          (p) => !((p as any).status === 'fulfilled')
        );
        executing.length = 0;
        executing.push(...stillExecuting);
      }
    }
    
    await Promise.all(executing);
    return results;
  }
}
```

### Task Types

**Memory Retrieval Task:**

```typescript
interface MemoryRetrievalTask {
  type: 'memories';
  priority: 'high' | 'normal' | 'low';
  
  execute(input: PipelineInput): Promise<MemoryResult> {
    // 1. Analyze query for memory type hints
    const hints = this.analyzeQuery(input.query);
    
    // 2. Retrieve from cache if available
    const cached = this.cache.get(input.userId, hints);
    if (cached) return cached;
    
    // 3. Hybrid search (semantic + keyword)
    const memories = await this.memoryService.search({
      userId: input.userId,
      query: input.query,
      filters: {
        types: hints.memoryTypes,
        minImportance: 0.5,
        limit: 50,
      },
    });
    
    // 4. Rank by relevance
    const ranked = this.rankMemories(memories, input.query);
    
    // 5. Cache results
    this.cache.set(input.userId, hints, ranked);
    
    return ranked;
  }
}
```

**Entity Retrieval Task:**

```typescript
interface EntityRetrievalTask {
  type: 'entities';
  priority: 'normal';
  
  execute(input: PipelineInput): Promise<EntityResult> {
    // 1. Extract entity mentions from query
    const mentions = this.extractEntityMentions(input.query);
    
    // 2. Fetch explicit entity links
    const explicit = this.fetchLinkedEntities(mentions);
    
    // 3. Fetch related entities via graph traversal
    const related = this.traverseEntityGraph(explicit, {
      maxDepth: 2,
      maxEntities: 20,
    });
    
    // 4. Score by relevance
    const scored = this.scoreEntities(related, input.query);
    
    return { entities: scored };
  }
}
```

**Topic Retrieval Task:**

```typescript
interface TopicRetrievalTask {
  type: 'topics';
  priority: 'normal';
  
  execute(input: PipelineInput): Promise<TopicResult> {
    // 1. Identify topic from query
    const topicSlug = this.identifyTopic(input.query);
    
    if (!topicSlug) {
      return { topics: [] };
    }
    
    // 2. Fetch topic profile
    const topic = await this.topicService.getProfile(topicSlug);
    
    // 3. Fetch related topics
    const related = await this.topicService.getRelated(topicSlug, {
      limit: 5,
    });
    
    return {
      topics: [topic, ...related],
      primaryTopic: topicSlug,
    };
  }
}
```

---

## 2. Hybrid Retrieval Service

### Retrieval Strategies

Hybrid Retrieval combines multiple strategies for comprehensive context gathering:

```typescript
interface HybridRetrievalConfig {
  // Explicit retrieval (direct mentions, links)
  explicit: {
    enabled: boolean;
    maxResults: number;
  };
  
  // Semantic retrieval (vector similarity)
  semantic: {
    enabled: boolean;
    model: string;
    topK: number;
    threshold: number;
  };
  
  // Keyword retrieval (BM25, TF-IDF)
  keyword: {
    enabled: boolean;
    algorithm: 'bm25' | 'tfidf';
    topK: number;
  };
  
  // Recent retrieval (temporal proximity)
  recent: {
    enabled: boolean;
    timeWindow: number;  // hours
    maxResults: number;
  };
  
  // Combination strategy
  fusion: {
    method: 'reciprocal_rank' | 'weighted_sum' | 'learned';
    weights: {
      explicit: number;
      semantic: number;
      keyword: number;
      recent: number;
    };
  };
}
```

### Explicit Retrieval

Direct matches based on explicit references:

```typescript
interface ExplicitRetrievalResult {
  // Direct mentions in query
  mentions: {
    type: 'memory' | 'entity' | 'topic' | 'acu';
    id: string;
    confidence: number;
  }[];
  
  // Explicit links via graph
  linked: {
    sourceId: string;
    targetId: string;
    relationshipType: string;
    strength: number;
  }[];
}

function retrieveExplicit(
  query: string,
  context: RetrievalContext
): ExplicitRetrievalResult {
  const mentions: ExplicitRetrievalResult['mentions'] = [];
  const linked: ExplicitRetrievalResult['linked'] = [];
  
  // Extract @mentions and #tags
  const mentionRegex = /@(\w+)/g;
  const tagRegex = /#(\w+)/g;
  
  for (const match of query.matchAll(mentionRegex)) {
    const id = match[1];
    const entity = await context.entityService.getById(id);
    if (entity) {
      mentions.push({
        type: 'entity',
        id: entity.id,
        confidence: 1.0,
      });
    }
  }
  
  // Fetch explicitly linked items
  for (const mention of mentions) {
    const links = await context.linkService.getLinks(mention.id);
    linked.push(...links);
  }
  
  return { mentions, linked };
}
```

### Semantic Retrieval

Vector-based similarity search:

```typescript
interface SemanticRetrievalResult {
  query: string;
  embedding: number[];
  results: {
    id: string;
    type: string;
    content: string;
    similarity: number;
  }[];
}

async function retrieveSemantic(
  query: string,
  options: SemanticOptions
): Promise<SemanticRetrievalResult> {
  // 1. Generate query embedding
  const embedding = await embeddingService.embed(query);
  
  // 2. Search vector store
  const results = await vectorStore.search({
    embedding,
    topK: options.topK,
    threshold: options.threshold,
    filters: options.filters,
  });
  
  // 3. Fetch full content
  const fullResults = await Promise.all(
    results.map(async (r) => ({
      id: r.id,
      type: r.metadata.type,
      content: await storage.get(r.id),
      similarity: r.similarity,
    }))
  );
  
  return {
    query,
    embedding,
    results: fullResults,
  };
}
```

### Keyword Retrieval

Traditional keyword-based search:

```typescript
interface KeywordRetrievalResult {
  query: string;
  results: {
    id: string;
    type: string;
    content: string;
    score: number;
    highlights: string[];
  }[];
}

async function retrieveKeyword(
  query: string,
  options: KeywordOptions
): Promise<KeywordRetrievalResult> {
  // Tokenize query
  const tokens = tokenize(query);
  
  // Search inverted index
  const results = await invertedIndex.search(tokens, {
    algorithm: options.algorithm,
    topK: options.topK,
  });
  
  // Extract highlights
  const highlighted = results.map((r) => ({
    ...r,
    highlights: extractHighlights(r.content, tokens),
  }));
  
  return {
    query,
    results: highlighted,
  };
}
```

### Reciprocal Rank Fusion

Combine results from multiple retrieval strategies:

```typescript
interface FusionResult {
  id: string;
  type: string;
  content: string;
  finalScore: number;
  componentScores: {
    explicit?: number;
    semantic?: number;
    keyword?: number;
    recent?: number;
  };
}

function reciprocalRankFusion(
  results: {
    explicit?: ExplicitRetrievalResult;
    semantic?: SemanticRetrievalResult;
    keyword?: KeywordRetrievalResult;
    recent?: RecentRetrievalResult;
  },
  config: FusionConfig
): FusionResult[] {
  const allResults = new Map<string, FusionResult>();
  
  // Add results from each strategy
  for (const [strategy, result] of Object.entries(results)) {
    if (!result) continue;
    
    const items = result.results || [];
    items.forEach((item, rank) => {
      if (!allResults.has(item.id)) {
        allResults.set(item.id, {
          id: item.id,
          type: item.type,
          content: item.content,
          finalScore: 0,
          componentScores: {},
        });
      }
      
      // Reciprocal rank score: 1 / (rank + k)
      const score = 1 / (rank + 60);  // k=60 is standard
      allResults.get(item.id)!.componentScores[strategy] = score;
    });
  }
  
  // Calculate final scores with weights
  const weightedResults = Array.from(allResults.values()).map((r) => ({
    ...r,
    finalScore:
      (r.componentScores.explicit || 0) * config.weights.explicit +
      (r.componentScores.semantic || 0) * config.weights.semantic +
      (r.componentScores.keyword || 0) * config.weights.keyword +
      (r.componentScores.recent || 0) * config.weights.recent,
  }));
  
  // Sort by final score
  return weightedResults.sort((a, b) => b.finalScore - a.finalScore);
}
```

---

## 3. Context Assembler

### Assembly Process

The Context Assembler aggregates and formats retrieved content for the LLM:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Context Assembly Process                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Raw       │────►│  Dedupli-   │────►│   Priority  │      │
│  │  Results    │     │  cation     │     │   Filtering │      │
│  └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                  │              │
│                                                  ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Format    │◄────│   Truncate  │◄────│   Token     │      │
│  │   for LLM   │     │   to Budget │     │   Budget    │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Token Budget Algorithm

Intelligent token allocation based on query type and user preferences:

```typescript
interface TokenBudget {
  // Total budget
  total: number;
  
  // Allocated tokens per category
  allocation: {
    system: number;        // System prompt
    identity: number;      // User identity
    memories: number;      // User memories
    entities: number;      // Entity context
    topics: number;        // Topic context
    history: number;       // Conversation history
    padding: number;       // Response buffer
  };
  
  // Dynamic adjustment factors
  factors: {
    queryType: 'factual' | 'creative' | 'debugging' | 'casual';
    urgency: 'high' | 'normal' | 'low';
    userPreferences: UserPreferences;
  };
}

function calculateBudget(
  availableTokens: number,
  queryType: string,
  userPreferences: UserPreferences
): TokenBudget {
  // Base allocation percentages
  const baseAllocation = {
    system: 500,           // Fixed
    identity: 200,         // Fixed
    memories: 2000,        // Variable
    entities: 1500,        // Variable
    topics: 1000,          // Variable
    history: 2000,         // Variable
    padding: 1000,         // Fixed buffer
  };
  
  // Adjust based on query type
  const adjustments: Record<string, Partial<typeof baseAllocation>> = {
    factual: { memories: 3000, entities: 2000 },
    creative: { memories: 1500, topics: 1500 },
    debugging: { entities: 2500, history: 3000 },
    casual: { memories: 1000, history: 1000 },
  };
  
  const adjusted = { ...baseAllocation, ...adjustments[queryType] };
  
  // Scale to fit available tokens
  const totalAllocated = Object.values(adjusted).reduce((a, b) => a + b, 0);
  const scale = (availableTokens - 1500) / totalAllocated;  // Reserve 1500 for system+padding
  
  return {
    total: availableTokens,
    allocation: {
      system: adjusted.system,
      identity: adjusted.identity,
      memories: Math.floor(adjusted.memories * scale),
      entities: Math.floor(adjusted.entities * scale),
      topics: Math.floor(adjusted.topics * scale),
      history: Math.floor(adjusted.history * scale),
      padding: adjusted.padding,
    },
    factors: { queryType, urgency: 'normal', userPreferences },
  };
}
```

### Priority Filtering

Apply priority rules to select the most relevant context:

```typescript
interface PriorityRule {
  // Rule conditions
  condition: (item: ContextItem) => boolean;
  
  // Priority level (higher = more important)
  priority: number;
  
  // Token cost
  tokenCost: number;
  
  // Required or optional
  required: boolean;
}

const defaultPriorityRules: PriorityRule[] = [
  // Pinned memories are always included
  {
    condition: (item) => item.isPinned,
    priority: 100,
    tokenCost: 500,
    required: true,
  },
  
  // High-importance memories
  {
    condition: (item) => item.importance >= 0.8,
    priority: 90,
    tokenCost: 300,
    required: false,
  },
  
  // Recently accessed items
  {
    condition: (item) => {
      const hoursSinceAccess =
        (Date.now() - new Date(item.lastAccessedAt).getTime()) /
        (1000 * 60 * 60);
      return hoursSinceAccess < 24;
    },
    priority: 80,
    tokenCost: 200,
    required: false,
  },
  
  // Directly mentioned entities
  {
    condition: (item) => item.explicitlyMentioned,
    priority: 95,
    tokenCost: 400,
    required: true,
  },
];

function applyPriorityFiltering(
  items: ContextItem[],
  budget: number,
  rules: PriorityRule[]
): ContextItem[] {
  // Score each item
  const scored = items.map((item) => {
    let score = 0;
    let isRequired = false;
    
    for (const rule of rules) {
      if (rule.condition(item)) {
        score += rule.priority;
        if (rule.required) {
          isRequired = true;
        }
      }
    }
    
    return { item, score, isRequired };
  });
  
  // Sort by priority
  scored.sort((a, b) => b.score - a.score);
  
  // Select items within budget
  const selected: ContextItem[] = [];
  let usedTokens = 0;
  
  // First, add required items
  for (const { item, isRequired } of scored) {
    if (isRequired) {
      selected.push(item);
      usedTokens += estimateTokens(item);
    }
  }
  
  // Then, add optional items by priority
  for (const { item, isRequired } of scored) {
    if (isRequired) continue;
    
    const itemTokens = estimateTokens(item);
    if (usedTokens + itemTokens <= budget) {
      selected.push(item);
      usedTokens += itemTokens;
    }
  }
  
  return selected;
}
```

### Deduplication

Remove duplicate or near-duplicate content:

```typescript
interface DeduplicationConfig {
  // Exact duplicate detection
  exactMatch: {
    enabled: boolean;
    fields: string[];  // ['id', 'content']
  };
  
  // Near-duplicate detection
  nearDuplicate: {
    enabled: boolean;
    threshold: number;  // 0-1, default: 0.9
    method: 'hash' | 'embedding';
  };
  
  // Consolidation strategy
  consolidation: {
    strategy: 'keep_highest' | 'merge' | 'keep_recent';
  };
}

function deduplicateResults(
  results: ContextItem[],
  config: DeduplicationConfig
): ContextItem[] {
  const seen = new Map<string, ContextItem>();
  const duplicates: ContextItem[] = [];
  
  for (const item of results) {
    // Check exact match
    if (config.exactMatch.enabled) {
      const key = config.exactMatch.fields
        .map((f) => item[f])
        .join('||');
      
      if (seen.has(key)) {
        duplicates.push(item);
        continue;
      }
      seen.set(key, item);
    }
    
    // Check near-duplicate
    if (config.nearDuplicate.enabled) {
      const similar = findSimilar(item, seen.values(), {
        threshold: config.nearDuplicate.threshold,
        method: config.nearDuplicate.method,
      });
      
      if (similar) {
        // Apply consolidation strategy
        switch (config.consolidation.strategy) {
          case 'keep_highest':
            if (item.importance > similar.importance) {
              seen.delete(generateKey(similar));
              seen.set(generateKey(item), item);
            }
            duplicates.push(item);
            break;
          case 'keep_recent':
            if (new Date(item.createdAt) > new Date(similar.createdAt)) {
              seen.delete(generateKey(similar));
              seen.set(generateKey(item), item);
            }
            duplicates.push(item);
            break;
        }
        continue;
      }
    }
  }
  
  return Array.from(seen.values());
}
```

---

## 4. Context Compiler

### Bundle Compilation

The Context Compiler creates optimized context bundles for different use cases:

```typescript
interface ContextBundle {
  id: string;
  userId: string;
  bundleType: BundleType;
  
  // Content
  content: string;
  tokens: number;
  
  // Metadata
  compiledAt: ISO8601;
  expiresAt: ISO8601;
  isDirty: boolean;
  
  // Source references
  sourceMemoryIds: string[];
  sourceEntityIds: string[];
  sourceTopicIds: string[];
  sourceAcuIds: string[];
}

type BundleType =
  | 'IDENTITY_CORE'      // User identity and preferences
  | 'GLOBAL_PREFS'       // Global settings
  | 'TOPIC'              // Topic-specific context
  | 'ENTITY'             // Entity-specific context
  | 'CONVERSATION';      // Recent conversation history

class ContextCompiler {
  async compileBundle(
    userId: string,
    bundleType: BundleType,
    referenceId?: string
  ): Promise<ContextBundle> {
    switch (bundleType) {
      case 'IDENTITY_CORE':
        return this.compileIdentityCore(userId);
      case 'GLOBAL_PREFS':
        return this.compileGlobalPrefs(userId);
      case 'TOPIC':
        return this.compileTopicContext(userId, referenceId!);
      case 'ENTITY':
        return this.compileEntityContext(userId, referenceId!);
      case 'CONVERSATION':
        return this.compileConversationContext(userId, referenceId!);
    }
  }

  private async compileIdentityCore(
    userId: string
  ): Promise<ContextBundle> {
    // Fetch identity memories
    const memories = await this.memoryService.search({
      userId,
      memoryTypes: ['IDENTITY', 'PREFERENCE'],
      minImportance: 0.7,
      limit: 20,
    });
    
    // Format as system prompt
    const content = this.formatIdentityPrompt(memories);
    
    return {
      id: generateBundleId(userId, 'IDENTITY_CORE'),
      userId,
      bundleType: 'IDENTITY_CORE',
      content,
      tokens: estimateTokens(content),
      compiledAt: new Date().toISOString(),
      expiresAt: addHours(new Date(), 24).toISOString(),
      isDirty: false,
      sourceMemoryIds: memories.map((m) => m.id),
      sourceEntityIds: [],
      sourceTopicIds: [],
      sourceAcuIds: [],
    };
  }

  private formatIdentityPrompt(memories: Memory[]): string {
    return [
      '## User Identity',
      '',
      '### Core Identity',
      ...memories
        .filter((m) => m.memoryType === 'IDENTITY')
        .map((m) => `- ${m.content}`),
      '',
      '### Preferences',
      ...memories
        .filter((m) => m.memoryType === 'PREFERENCE')
        .map((m) => `- ${m.content}`),
    ].join('\n');
  }
}
```

### Bundle Types

| Bundle Type | Tokens | Content | Refresh TTL |
|-------------|--------|---------|-------------|
| **IDENTITY_CORE** | ~200 | User identity, role, background | 24 hours |
| **GLOBAL_PREFS** | ~150 | Global settings, style | 12 hours |
| **TOPIC** | ~500 | Topic-specific knowledge | 4 hours |
| **ENTITY** | ~400 | Entity-specific context | 6 hours |
| **CONVERSATION** | ~300 | Recent messages | 30 minutes |

---

## 5. Prediction Engine

### Context Pre-warming

The Prediction Engine anticipates what context will be needed and pre-compiles bundles:

```typescript
interface PredictionEngine {
  // Predict next context needs
  predict(input: PredictionInput): Promise<Prediction[]>;
  
  // Track user behavior
  trackPresence(presence: ClientPresence): Promise<void>;
  
  // Learn from corrections
  learnFromCorrection(prediction: Prediction, actual: string): Promise<void>;
}

interface PredictionInput {
  userId: string;
  currentContext: {
    activeConversationId?: string;
    visibleConversationIds: string[];
    activeNotebookId?: string;
    lastNavigationPath: string;
  };
  historicalPatterns: UsagePattern[];
}

interface Prediction {
  // What is predicted
  type: 'conversation' | 'topic' | 'entity';
  referenceId: string;
  
  // Confidence
  probability: number;
  
  // Reasoning
  reason: string;
  
  // Suggested action
  action: 'precompile' | 'prefetch' | 'cache';
}
```

**Prediction Algorithm:**

```typescript
class PredictionEngine {
  private patterns: Map<string, UsagePattern[]>;
  private model?: PredictionModel;

  async predict(
    userId: string,
    presence: ClientPresence
  ): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    
    // 1. Analyze current context
    const contextSignals = this.extractContextSignals(presence);
    
    // 2. Match against historical patterns
    const matchedPatterns = this.matchPatterns(
      userId,
      contextSignals,
      this.patterns.get(userId) || []
    );
    
    // 3. Generate predictions from patterns
    for (const pattern of matchedPatterns) {
      if (pattern.nextAction) {
        predictions.push({
          type: pattern.nextAction.type,
          referenceId: pattern.nextAction.referenceId,
          probability: pattern.confidence,
          reason: `Based on ${pattern.frequency} similar past sessions`,
          action: 'precompile',
        });
      }
    }
    
    // 4. Apply ML model if available
    if (this.model) {
      const mlPredictions = await this.model.predict({
        userId,
        contextSignals,
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
      });
      
      predictions.push(...mlPredictions);
    }
    
    // 5. Sort by probability
    return predictions.sort((a, b) => b.probability - a.probability);
  }

  private extractContextSignals(presence: ClientPresence): ContextSignals {
    return {
      navigationPath: presence.lastNavigationPath,
      activeEntities: presence.visibleConversationIds,
      timeInApp: Date.now() - presence.sessionStartedAt.getTime(),
      recentActions: presence.recentActions,
    };
  }
}
```

### Usage Pattern Learning

```typescript
interface UsagePattern {
  // Pattern signature
  signature: {
    timeOfDay: number;      // 0-23
    dayOfWeek: number;      // 0-6
    navigationPath: string[];
    activeEntities: string[];
  };
  
  // Pattern statistics
  frequency: number;        // Times observed
  confidence: number;       // 0-1
  
  // Predicted next action
  nextAction?: {
    type: 'conversation' | 'topic' | 'entity';
    referenceId: string;
  };
  
  // Last observed
  lastObserved: ISO8601;
}

function learnPattern(
  existingPatterns: UsagePattern[],
  newObservation: Observation
): UsagePattern[] {
  // Find matching pattern
  const match = findMatchingPattern(existingPatterns, newObservation);
  
  if (match) {
    // Update existing pattern
    match.frequency++;
    match.confidence = calculateConfidence(match.frequency);
    match.lastObserved = new Date().toISOString();
    
    // Update next action prediction
    if (newObservation.nextAction) {
      match.nextAction = newObservation.nextAction;
    }
  } else {
    // Create new pattern
    existingPatterns.push({
      signature: newObservation.signature,
      frequency: 1,
      confidence: 0.3,  // Low confidence for new pattern
      nextAction: newObservation.nextAction,
      lastObserved: new Date().toISOString(),
    });
  }
  
  return existingPatterns;
}
```

---

## 6. Caching & Invalidation

### Multi-Layer Cache

```typescript
interface CacheLayer {
  name: string;
  implementation: 'memory' | 'redis' | 'database';
  ttl: number;  // seconds
}

const cacheLayers: CacheLayer[] = [
  { name: 'L1', implementation: 'memory', ttl: 30 },
  { name: 'L2', implementation: 'redis', ttl: 300 },
  { name: 'L3', implementation: 'database', ttl: 3600 },
];

class MultiLayerCache {
  private layers: CacheLayer[];

  async get<T>(key: string): Promise<T | null> {
    // Try each layer from fastest to slowest
    for (const layer of this.layers) {
      const value = await this.getFromLayer(layer, key);
      if (value) {
        // Promote to faster layers
        this.promoteToHigherLayers(key, value, layer);
        return value;
      }
    }
    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    // Set in all layers
    for (const layer of this.layers) {
      await this.setToLayer(layer, key, value);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidate in all layers
    for (const layer of this.layers) {
      await this.invalidateFromLayer(layer, pattern);
    }
  }
}
```

### Event-Driven Invalidation

```typescript
class ContextEventBus {
  private subscribers: Map<string, EventHandler[]>;

  subscribe(event: string, handler: EventHandler): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(handler);
    
    return () => this.unsubscribe(event, handler);
  }

  async emit(event: ContextEvent): Promise<void> {
    const handlers = this.subscribers.get(event.type) || [];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error({ error, event }, 'Event handler failed');
      }
    }
  }
}

// Cache invalidation handlers
eventBus.subscribe('MEMORY_CREATED', (event) => {
  cache.invalidatePattern(`context:*:${event.userId}:*`);
  cache.invalidatePattern(`search:*:${event.memoryId}`);
});

eventBus.subscribe('CONVERSATION_UPDATED', (event) => {
  cache.invalidate(`bundle:conversation:${event.conversationId}`);
});

eventBus.subscribe('USER_UPDATED', (event) => {
  cache.invalidate(`bundle:identity:${event.userId}`);
  cache.invalidate(`bundle:global_prefs:${event.userId}`);
});
```

---

## 7. Telemetry & Quality

### Quality Metrics

```typescript
interface ContextTelemetry {
  // Retrieval metrics
  retrievalLatency: number;
  cacheHitRate: number;
  resultsCount: number;
  
  // Assembly metrics
  tokenUsage: number;
  budgetUtilization: number;
  
  // Quality metrics
  relevanceScore: number;    // How relevant is the context
  diversityScore: number;    // How diverse are the sources
  freshnessScore: number;    // How recent is the context
  
  // Anomalies
  anomalies: AnomalyAlert[];
}

interface AnomalyAlert {
  type: 'low_relevance' | 'stale_context' | 'token_overflow';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: ISO8601;
}
```

### Quality Monitoring

```typescript
class ContextTelemetryService {
  async calculateQualityMetrics(
    context: AssembledContext
  ): Promise<ContextTelemetry> {
    return {
      retrievalLatency: context.retrievalTime,
      cacheHitRate: context.cacheHits / context.totalRetrievals,
      resultsCount: context.totalResults,
      
      tokenUsage: context.totalTokens,
      budgetUtilization: context.totalTokens / context.tokenBudget,
      
      relevanceScore: this.calculateRelevance(context),
      diversityScore: this.calculateDiversity(context),
      freshnessScore: this.calculateFreshness(context),
      
      anomalies: this.detectAnomalies(context),
    };
  }

  private calculateRelevance(context: AssembledContext): number {
    // Average relevance score of all items
    const scores = context.items.map((i) => i.relevanceScore);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  private calculateDiversity(context: AssembledContext): number {
    // Measure diversity of sources
    const types = new Set(context.items.map((i) => i.type));
    return types.size / Math.min(context.items.length, 5);
  }

  private calculateFreshness(context: AssembledContext): number {
    // Average freshness of items
    const now = Date.now();
    const ages = context.items.map((i) => 
      (now - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
    
    // Decay function: 1.0 for fresh, 0.0 for > 30 days old
    return Math.max(0, 1 - avgAge / 30);
  }
}
```

---

## Implementation Reference

For implementation details, see the source code:

- **Context Pipeline**: `server/src/context/context-pipeline.ts`
- **Context Assembler**: `server/src/context/context-assembler.ts`
- **Context Orchestrator**: `server/src/context/context-orchestrator.ts`
- **Bundle Compiler**: `server/src/context/bundle-compiler.ts`
- **Prediction Engine**: `server/src/context/prediction-engine.ts`
- **Context Cache**: `server/src/context/context-cache.ts`

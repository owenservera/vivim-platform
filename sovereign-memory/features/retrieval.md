# Memory Retrieval

## Overview

Memory Retrieval is the intelligent search system that finds relevant memories using hybrid search (semantic + keyword + explicit), relevance ranking, and contextual filtering.

---

## Retrieval Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                   Memory Retrieval Pipeline                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Query     │────►│   Hybrid    │────►│   Filter &  │      │
│  │  Analysis   │     │   Search    │     │   Rank      │      │
│  └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                  │              │
│                                                  ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Format    │◄────│   Truncate  │◄────│   Dedupe    │      │
│  │   Results   │     │   to Limit  │     │             │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Search Strategies

### 1. Explicit Retrieval

Direct matches based on IDs, mentions, and links:

```typescript
interface ExplicitRetrievalInput {
  // Direct IDs
  memoryIds?: string[];
  
  // Mentions (@memory-id, #tag)
  mentions?: string[];
  
  // Linked memories
  linkedTo?: string[];
  linkedFrom?: string[];
}

async function retrieveExplicit(
  input: ExplicitRetrievalInput
): Promise<Memory[]> {
  const memories: Memory[] = [];
  
  // Fetch by IDs
  if (input.memoryIds?.length) {
    const byId = await memoryService.getByIds(input.memoryIds);
    memories.push(...byId);
  }
  
  // Fetch by mentions
  if (input.mentions?.length) {
    for (const mention of input.mentions) {
      if (mention.startsWith('@')) {
        const id = mention.slice(1);
        const memory = await memoryService.getById(id);
        if (memory) memories.push(memory);
      } else if (mention.startsWith('#')) {
        const tag = mention.slice(1);
        const byTag = await memoryService.getByTag(tag);
        memories.push(...byTag);
      }
    }
  }
  
  // Fetch linked memories
  if (input.linkedTo?.length) {
    const linked = await memoryService.getLinkedTo(input.linkedTo);
    memories.push(...linked);
  }
  
  return memories;
}
```

### 2. Semantic Retrieval

Vector-based similarity search:

```typescript
interface SemanticRetrievalInput {
  query: string;
  topK: number;
  threshold: number;
  filters?: {
    memoryTypes?: MemoryType[];
    categories?: string[];
    dateRange?: { from: Date; to: Date };
    minImportance?: number;
  };
}

async function retrieveSemantic(
  input: SemanticRetrievalInput
): Promise<SemanticResult[]> {
  // 1. Generate query embedding
  const embedding = await embeddingService.embed(input.query);
  
  // 2. Search vector store
  const results = await vectorStore.search({
    embedding,
    topK: input.topK,
    threshold: input.threshold,
    filters: input.filters,
  });
  
  // 3. Fetch full memories
  const memories = await Promise.all(
    results.map(r => memoryService.getById(r.id))
  );
  
  return memories.map((memory, i) => ({
    memory,
    similarity: results[i].similarity,
    rank: i + 1,
  }));
}
```

### 3. Keyword Retrieval

BM25-based keyword search:

```typescript
interface KeywordRetrievalInput {
  query: string;
  topK: number;
  fields: ('content' | 'summary' | 'tags' | 'category')[];
  operator: 'AND' | 'OR';
}

async function retrieveKeyword(
  input: KeywordRetrievalInput
): Promise<KeywordResult[]> {
  // Tokenize query
  const tokens = tokenize(input.query);
  
  // Search inverted index
  const results = await invertedIndex.search(tokens, {
    fields: input.fields,
    operator: input.operator,
    topK: input.topK,
  });
  
  // Fetch full memories and highlight matches
  const memories = await Promise.all(
    results.map(async r => {
      const memory = await memoryService.getById(r.id);
      const highlights = extractHighlights(memory, tokens);
      return { memory, highlights, score: r.score };
    })
  );
  
  return memories;
}
```

### 4. Temporal Retrieval

Time-based retrieval for recent or time-specific memories:

```typescript
interface TemporalRetrievalInput {
  timeRange: {
    from: Date;
    to: Date;
  };
  recencyBoost: boolean;
}

async function retrieveTemporal(
  userId: string,
  input: TemporalRetrievalInput
): Promise<Memory[]> {
  const memories = await memoryService.search({
    userId,
    occurredAfter: input.timeRange.from,
    occurredBefore: input.timeRange.to,
  });
  
  if (input.recencyBoost) {
    // Boost recent memories
    return memories.sort((a, b) => {
      const aRecency = recencyScore(a.createdAt);
      const bRecency = recencyScore(b.createdAt);
      return bRecency - aRecency;
    });
  }
  
  return memories;
}

function recencyScore(date: Date): number {
  const daysOld = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-daysOld / 30);  // Half-life of 30 days
}
```

---

## Hybrid Fusion

### Reciprocal Rank Fusion

Combine results from multiple retrieval strategies:

```typescript
interface FusionConfig {
  weights: {
    explicit: number;
    semantic: number;
    keyword: number;
    temporal: number;
  };
  k: number;  // Reciprocal rank constant
}

const DEFAULT_FUSION_CONFIG: FusionConfig = {
  weights: {
    explicit: 0.4,    // Direct matches are strong signals
    semantic: 0.35,   // Semantic similarity
    keyword: 0.15,    // Keyword matching
    temporal: 0.1,    // Recency bonus
  },
  k: 60,  // Standard value for RR
};

function reciprocalRankFusion(
  results: {
    explicit?: Memory[];
    semantic?: SemanticResult[];
    keyword?: KeywordResult[];
    temporal?: Memory[];
  },
  config: FusionConfig
): FusionResult[] {
  const allMemories = new Map<string, FusionResult>();
  
  // Add explicit results (highest priority)
  results.explicit?.forEach((memory, rank) => {
    allMemories.set(memory.id, {
      memory,
      score: 1 / (0 + config.k),  // Rank 0 for explicit
      sources: ['explicit'],
    });
  });
  
  // Add semantic results
  results.semantic?.forEach((result, rank) => {
    const existing = allMemories.get(result.memory.id);
    if (existing) {
      existing.score += config.weights.semantic / (rank + config.k);
      existing.sources.push('semantic');
    } else {
      allMemories.set(result.memory.id, {
        memory: result.memory,
        score: config.weights.semantic / (rank + config.k),
        sources: ['semantic'],
      });
    }
  });
  
  // Add keyword results
  results.keyword?.forEach((result, rank) => {
    const existing = allMemories.get(result.memory.id);
    if (existing) {
      existing.score += config.weights.keyword / (rank + config.k);
      existing.sources.push('keyword');
    } else {
      allMemories.set(result.memory.id, {
        memory: result.memory,
        score: config.weights.keyword / (rank + config.k),
        sources: ['keyword'],
      });
    }
  });
  
  // Sort by final score
  return Array.from(allMemories.values())
    .sort((a, b) => b.score - a.score);
}
```

### Learned Fusion (ML-based)

Use machine learning to optimize fusion weights:

```typescript
interface LearnedFusionModel {
  // Feature weights (learned from user feedback)
  weights: {
    semantic: number;
    keyword: number;
    recency: number;
    importance: number;
    personalization: number;
  };
  
  // User-specific adjustments
  userBias: {
    preferRecent: number;
    preferImportant: number;
    preferSemantic: number;
  };
}

async function trainFusionModel(
  userId: string,
  feedback: SearchFeedback[]
): Promise<LearnedFusionModel> {
  // Analyze which features correlate with clicked memories
  const features = feedback.map(f => extractFeatures(f.result));
  const labels = feedback.map(f => f.clicked ? 1 : 0);
  
  // Train logistic regression
  const model = await trainLogisticRegression(features, labels);
  
  // Extract weights
  return {
    weights: {
      semantic: model.coefficients[0],
      keyword: model.coefficients[1],
      recency: model.coefficients[2],
      importance: model.coefficients[3],
      personalization: model.coefficients[4],
    },
    userBias: {
      preferRecent: calculateUserBias(feedback, 'recency'),
      preferImportant: calculateUserBias(feedback, 'importance'),
      preferSemantic: calculateUserBias(feedback, 'semantic'),
    },
  };
}
```

---

## Ranking & Scoring

### Final Score Calculation

```typescript
interface RankingConfig {
  // Score components
  weights: {
    retrievalScore: number;   // From fusion
    importanceScore: number;  // Memory importance
    recencyScore: number;     // Time decay
    personalizationScore: number;  // User preferences
  };
  
  // Boosts
  boosts: {
    pinned: number;
    highImportance: number;
    recentAccess: number;
  };
}

const DEFAULT_RANKING_CONFIG: RankingConfig = {
  weights: {
    retrievalScore: 0.4,
    importanceScore: 0.25,
    recencyScore: 0.2,
    personalizationScore: 0.15,
  },
  boosts: {
    pinned: 0.5,
    highImportance: 0.3,
    recentAccess: 0.2,
  },
};

function calculateFinalScore(
  memory: Memory,
  retrievalScore: number,
  config: RankingConfig
): number {
  // Base scores
  const importanceScore = memory.importance;
  const recencyScore = calculateRecencyScore(memory.createdAt);
  const personalizationScore = calculatePersonalizationScore(memory);
  
  // Weighted sum
  let score =
    retrievalScore * config.weights.retrievalScore +
    importanceScore * config.weights.importanceScore +
    recencyScore * config.weights.recencyScore +
    personalizationScore * config.weights.personalizationScore;
  
  // Apply boosts
  if (memory.isPinned) {
    score += config.boosts.pinned;
  }
  if (memory.importance >= 0.8) {
    score += config.boosts.highImportance;
  }
  if (wasRecentlyAccessed(memory)) {
    score += config.boosts.recentAccess;
  }
  
  return Math.min(1.0, score);
}
```

---

## Filtering

### Filter Types

```typescript
interface MemoryFilters {
  // Type filters
  memoryTypes?: MemoryType[];
  categories?: string[];
  subcategories?: string[];
  
  // Importance filters
  minImportance?: number;
  maxImportance?: number;
  isPinned?: boolean;
  
  // Status filters
  isActive?: boolean;
  includeArchived?: boolean;
  consolidationStatus?: ConsolidationStatus[];
  
  // Time filters
  occurredAfter?: Date;
  occurredBefore?: Date;
  createdAtAfter?: Date;
  createdAtBefore?: Date;
  
  // Relationship filters
  hasRelationships?: boolean;
  relatedToMemoryId?: string;
  
  // Content filters
  minContentLength?: number;
  hasEmbedding?: boolean;
  tagsInclude?: string[];
  tagsExclude?: string[];
}

function applyFilters(
  memories: Memory[],
  filters: MemoryFilters
): Memory[] {
  return memories.filter(memory => {
    // Type filters
    if (filters.memoryTypes?.length && 
        !filters.memoryTypes.includes(memory.memoryType)) {
      return false;
    }
    
    // Importance filters
    if (filters.minImportance && 
        memory.importance < filters.minImportance) {
      return false;
    }
    if (filters.maxImportance && 
        memory.importance > filters.maxImportance) {
      return false;
    }
    
    // Time filters
    if (filters.occurredAfter && 
        new Date(memory.occurredAt) < filters.occurredAfter) {
      return false;
    }
    
    // Status filters
    if (filters.isActive !== undefined && 
        memory.isActive !== filters.isActive) {
      return false;
    }
    
    // Tag filters
    if (filters.tagsInclude?.length &&
        !filters.tagsInclude.some(t => memory.tags?.includes(t))) {
      return false;
    }
    if (filters.tagsExclude?.length &&
        filters.tagsExclude.some(t => memory.tags?.includes(t))) {
      return false;
    }
    
    return true;
  });
}
```

---

## Deduplication

### Result Deduplication

```typescript
interface DeduplicationConfig {
  // Similarity threshold for dedup
  threshold: number;
  
  // Strategy when duplicates found
  strategy: 'keep_highest_score' | 'keep_newest' | 'keep_most_important';
  
  // Group duplicates
  groupDuplicates: boolean;
}

function deduplicateResults(
  results: FusionResult[],
  config: DeduplicationConfig
): FusionResult[] {
  const deduped: FusionResult[] = [];
  const duplicateGroups: FusionResult[][] = [];
  
  for (const result of results) {
    // Find existing group
    const existingGroup = duplicateGroups.find(group =>
      group.some(r => isDuplicate(r.memory, result.memory, config.threshold))
    );
    
    if (existingGroup) {
      // Add to existing group
      existingGroup.push(result);
      
      // Update group representative if needed
      const representative = selectRepresentative(
        existingGroup,
        config.strategy
      );
      if (representative !== existingGroup[0]) {
        const idx = existingGroup.indexOf(representative);
        [existingGroup[0], existingGroup[idx]] = 
        [existingGroup[idx], existingGroup[0]];
      }
    } else {
      // Check if starts new group
      const similarResults = results.filter(r =>
        r !== result && isDuplicate(r.memory, result.memory, config.threshold)
      );
      
      if (similarResults.length > 0) {
        // Create new group
        const group = [result, ...similarResults];
        duplicateGroups.push(group);
        deduped.push(result);
      } else {
        // No duplicates
        deduped.push(result);
      }
    }
  }
  
  return config.groupDuplicates
    ? deduped.map(r => ({
        ...r,
        duplicateGroup: duplicateGroups
          .find(g => g[0] === r)
          ?.slice(1)
          .map(g => g.memory),
      }))
    : deduped;
}

function isDuplicate(
  memory1: Memory,
  memory2: Memory,
  threshold: number
): boolean {
  // Same ID = same memory
  if (memory1.id === memory2.id) return true;
  
  // Check content similarity
  const similarity = calculateContentSimilarity(memory1, memory2);
  return similarity >= threshold;
}
```

---

## Contextual Retrieval

### Query-Aware Retrieval

```typescript
interface ContextualRetrievalInput {
  query: string;
  conversationContext?: Message[];
  userContext?: UserContext;
  currentTopic?: string;
}

async function retrieveWithContext(
  userId: string,
  input: ContextualRetrievalInput
): Promise<Memory[]> {
  // 1. Analyze query in context
  const analysis = await analyzeQueryWithContext(input);
  
  // 2. Adjust retrieval based on context
  const adjustedFilters = adjustFiltersForContext(
    input,
    analysis
  );
  
  // 3. Boost contextually relevant memories
  const contextBoost = await calculateContextBoost(
    userId,
    input
  );
  
  // 4. Retrieve with adjustments
  const results = await hybridSearch(userId, {
    query: input.query,
    filters: adjustedFilters,
    scoreBoosts: contextBoost,
  });
  
  return results;
}

async function analyzeQueryWithContext(
  input: ContextualRetrievalInput
): Promise<QueryAnalysis> {
  const prompt = `Analyze this query in context:

Query: "${input.query}"
Recent conversation: ${formatContext(input.conversationContext)}
Current topic: ${input.currentTopic || 'none'}

Identify:
1. What type of information is being sought?
2. What memory types are most relevant?
3. What time period is relevant?
4. Any specific entities mentioned?

Return analysis as JSON.`;

  const response = await llmService.chat({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.content);
}
```

---

## Implementation Reference

For implementation details, see the source code:

- **Retrieval Service**: `server/src/context/memory/memory-retrieval-service.ts`
- **Hybrid Retrieval**: `server/src/context/hybrid-retrieval.ts`
- **Query Optimizer**: `server/src/context/query-optimizer.ts`

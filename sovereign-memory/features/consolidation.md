# Memory Consolidation

## Overview

Memory Consolidation is the intelligent process of merging similar memories, resolving contradictions, and maintaining a clean, deduplicated memory store. Like human memory consolidation during sleep, this system continuously organizes and optimizes your memory landscape.

---

## Consolidation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                  Memory Consolidation Pipeline                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Identify  │────►│   Analyze   │────►│   Resolve   │      │
│  │   Similar   │     │  Relations  │     │Conflicts    │      │
│  │  Memories   │     │             │     │             │      │
│  └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                  │              │
│                                                  ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Update    │◄────│   Create    │◄────│   Merge     │      │
│  │   Index     │     │   Merged    │     │  Memories   │      │
│  │             │     │   Memory    │     │             │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Consolidation Triggers

### Automatic Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| **Similarity** | > 0.85 similarity score | Queue for merge |
| **Contradiction** | > 0.7 confidence | Flag for resolution |
| **Age** | 30+ days old | Batch consolidation |
| **User Action** | Memory created/updated | Trigger related analysis |

### Manual Triggers

| Action | Description |
|--------|-------------|
| User Merge Request | User explicitly requests merge |
| Admin Consolidation | Scheduled maintenance job |
| Import Deduplication | During bulk import |

---

## Similarity Detection

### Semantic Similarity

Using vector embeddings to find similar memories:

```typescript
interface SemanticSimilarityConfig {
  // Embedding model
  model: 'text-embedding-3-small' | 'text-embedding-3-large';
  
  // Thresholds
  highSimilarity: number;    // 0.85 - Consider for merge
  mediumSimilarity: number;  // 0.70 - Flag as related
  lowSimilarity: number;     // 0.50 - Store as weak relation
  
  // Comparison strategy
  strategy: 'cosine' | 'euclidean' | 'dot_product';
}

async function findSimilarMemories(
  memoryId: string,
  config: SemanticSimilarityConfig
): Promise<SimilarMemory[]> {
  // 1. Get source memory embedding
  const source = await memoryService.getById(memoryId);
  
  // 2. Search for similar memories
  const similar = await vectorStore.search({
    embedding: source.embedding,
    topK: 50,
    threshold: config.lowSimilarity,
    filters: {
      userId: source.userId,
      excludeIds: [memoryId],
      memoryTypes: [source.memoryType],
    },
  });
  
  // 3. Categorize by similarity level
  return similar.map(result => ({
    memoryId: result.id,
    similarity: result.similarity,
    level: categorizeSimilarity(result.similarity, config),
  }));
}

function categorizeSimilarity(
  score: number,
  config: SemanticSimilarityConfig
): 'high' | 'medium' | 'low' {
  if (score >= config.highSimilarity) return 'high';
  if (score >= config.mediumSimilarity) return 'medium';
  return 'low';
}
```

### Keyword Overlap

Supplement semantic search with keyword analysis:

```typescript
interface KeywordOverlapResult {
  memoryId: string;
  overlappingKeywords: string[];
  overlapScore: number;
  uniqueKeywords: {
    source: string[];
    target: string[];
  };
}

function calculateKeywordOverlap(
  source: Memory,
  target: Memory
): KeywordOverlapResult {
  const sourceKeywords = new Set(source.tags || []);
  const targetKeywords = new Set(target.tags || []);
  
  // Find overlapping keywords
  const overlapping = [...sourceKeywords].filter(k => targetKeywords.has(k));
  
  // Calculate overlap score (Jaccard similarity)
  const union = new Set([...sourceKeywords, ...targetKeywords]);
  const overlapScore = overlapping.length / union.size;
  
  // Find unique keywords
  const sourceUnique = [...sourceKeywords].filter(k => !targetKeywords.has(k));
  const targetUnique = [...targetKeywords].filter(k => !sourceKeywords.has(k));
  
  return {
    memoryId: target.id,
    overlappingKeywords: overlapping,
    overlapScore,
    uniqueKeywords: {
      source: sourceUnique,
      target: targetUnique,
    },
  };
}
```

### Temporal Proximity

Memories from similar time periods are more likely to be related:

```typescript
interface TemporalProximityResult {
  memoryId: string;
  timeDifference: number;  // hours
  proximityScore: number;  // 0-1
  sameSession: boolean;
}

function calculateTemporalProximity(
  source: Memory,
  target: Memory
): TemporalProximityResult {
  const sourceTime = new Date(source.occurredAt || source.createdAt).getTime();
  const targetTime = new Date(target.occurredAt || target.createdAt).getTime();
  
  const timeDiff = Math.abs(sourceTime - targetTime);
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  // Decay function: 1.0 for same time, 0.0 for > 24 hours apart
  const proximityScore = Math.max(0, 1 - hoursDiff / 24);
  
  // Same session if within 2 hours
  const sameSession = hoursDiff < 2;
  
  return {
    memoryId: target.id,
    timeDifference: hoursDiff,
    proximityScore,
    sameSession,
  };
}
```

### Combined Similarity Score

```typescript
interface CombinedSimilarityScore {
  memoryId: string;
  semanticScore: number;
  keywordScore: number;
  temporalScore: number;
  combinedScore: number;
  weights: {
    semantic: number;
    keyword: number;
    temporal: number;
  };
}

function calculateCombinedSimilarity(
  semantic: number,
  keyword: number,
  temporal: number,
  weights: { semantic: number; keyword: number; temporal: number }
): number {
  return (
    semantic * weights.semantic +
    keyword * weights.keyword +
    temporal * weights.temporal
  );
}

// Default weights
const DEFAULT_WEIGHTS = {
  semantic: 0.6,   // Most important
  keyword: 0.25,   // Supporting evidence
  temporal: 0.15,  // Contextual factor
};
```

---

## Conflict Detection

### Types of Conflicts

| Conflict Type | Description | Example |
|---------------|-------------|---------|
| **Contradiction** | Directly opposing information | "I prefer cats" vs "I prefer dogs" |
| **Temporal Conflict** | Same event, different times | Meeting on Monday vs Tuesday |
| **Factual Conflict** | Different facts about same topic | "Python is typed" vs "Python is untyped" |
| **Preference Change** | Preference evolved over time | "I liked X" (old) vs "I hate X" (new) |

### Conflict Detection Algorithm

```typescript
interface ConflictDetectionResult {
  hasConflict: boolean;
  confidence: number;
  conflictType: 'contradiction' | 'temporal' | 'factual' | 'preference_change';
  explanation: string;
  suggestedResolution: 'keep_newer' | 'keep_older' | 'merge' | 'manual';
}

async function detectConflict(
  memory1: Memory,
  memory2: Memory
): Promise<ConflictDetectionResult> {
  // 1. Check for contradiction keywords
  const contradictionKeywords = ['not', 'never', 'instead', 'changed', 'prefer'];
  const hasContradiction = checkContradictionKeywords(
    memory1.content,
    memory2.content,
    contradictionKeywords
  );
  
  // 2. Check for temporal conflicts
  const temporalConflict = checkTemporalConflict(memory1, memory2);
  
  // 3. Use LLM for semantic contradiction detection
  const semanticConflict = await detectSemanticContradiction(memory1, memory2);
  
  // 4. Combine signals
  const confidence = calculateConflictConfidence(
    hasContradiction,
    temporalConflict,
    semanticConflict
  );
  
  // 5. Determine conflict type and resolution
  const conflictType = determineConflictType(
    hasContradiction,
    temporalConflict,
    semanticConflict
  );
  
  const suggestedResolution = suggestResolution(
    conflictType,
    memory1,
    memory2
  );
  
  return {
    hasConflict: confidence > 0.7,
    confidence,
    conflictType,
    explanation: generateExplanation(conflictType, memory1, memory2),
    suggestedResolution,
  };
}
```

### LLM-Based Contradiction Detection

```typescript
const CONTRADICTION_DETECTION_PROMPT = `Analyze these two memories and determine if they contradict each other.

Memory 1: "{memory1_content}"
Memory 2: "{memory2_content}"

Consider:
1. Do they make opposing claims about the same topic?
2. Can both be true simultaneously?
3. Is one more recent/reliable than the other?

Respond with:
{
  "contradicts": true/false,
  "confidence": 0.0-1.0,
  "explanation": "Why they contradict or not",
  "contradiction_type": "direct" | "implicit" | "temporal" | "none"
}
`;

async function detectSemanticContradiction(
  memory1: Memory,
  memory2: Memory
): Promise<{ contradicts: boolean; confidence: number }> {
  const response = await llmService.chat({
    model: 'gpt-4-turbo',
    messages: [{
      role: 'user',
      content: CONTRADICTION_DETECTION_PROMPT
        .replace('{memory1_content}', memory1.content)
        .replace('{memory2_content}', memory2.content)
    }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.content);
}
```

---

## Merge Strategies

### Strategy 1: Keep Newer

For preference changes and evolving information:

```typescript
interface KeepNewerStrategy {
  name: 'keep_newer';
  preserveOld: boolean;  // Keep older as archived reference
  
  apply(memories: Memory[]): MergedMemory {
    // Sort by creation date
    const sorted = memories.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Keep newest as primary
    const primary = sorted[0];
    
    // Archive older ones
    const archived = sorted.slice(1).map(m => ({
      id: m.id,
      content: m.content,
      archivedAt: new Date().toISOString(),
    }));
    
    return {
      content: primary.content,
      mergedFrom: memories.map(m => m.id),
      archivedReferences: archived,
      mergeReason: 'Preference evolution - keeping most recent',
    };
  }
}
```

### Strategy 2: Merge Content

For complementary information:

```typescript
interface MergeContentStrategy {
  name: 'merge_content';
  preserveStructure: boolean;
  
  async apply(memories: Memory[]): Promise<MergedMemory> {
    // Use LLM to merge content intelligently
    const mergedContent = await llmMerge(
      memories.map(m => m.content)
    );
    
    // Combine tags (deduplicated)
    const combinedTags = deduplicateTags(
      memories.flatMap(m => m.tags || [])
    );
    
    // Average importance
    const avgImportance = memories.reduce(
      (sum, m) => sum + m.importance, 0
    ) / memories.length;
    
    return {
      content: mergedContent,
      summary: await generateSummary(mergedContent),
      tags: combinedTags,
      importance: avgImportance,
      mergedFrom: memories.map(m => m.id),
      mergeReason: 'Complementary information merged',
    };
  }
}

const MERGE_PROMPT = `Merge these memories into a single, comprehensive memory:

Memory 1: {memory1}
Memory 2: {memory2}
[... more memories ...]

Rules:
- Preserve all unique information
- Remove redundancy
- Maintain accuracy
- Keep it concise (2-3 sentences)

Merged memory:
`;
```

### Strategy 3: Manual Resolution

For high-stakes conflicts:

```typescript
interface ManualResolution {
  name: 'manual';
  flagForReview: true;
  
  apply(memories: Memory[]): ConflictFlag {
    return {
      conflictId: generateConflictId(),
      memories: memories.map(m => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        importance: m.importance,
      })),
      conflictType: detectConflictType(memories),
      status: 'pending_review',
      flaggedAt: new Date().toISOString(),
      resolutionOptions: [
        { action: 'keep', memoryId: memories[0].id, reason: 'Older, established' },
        { action: 'keep', memoryId: memories[1].id, reason: 'Newer, updated' },
        { action: 'merge', reason: 'Combine information' },
        { action: 'custom', reason: 'Manual edit' },
      ],
    };
  }
}
```

---

## Consolidation Service

### Service Implementation

```typescript
interface ConsolidationService {
  // Batch consolidation
  runBatchConsolidation(options: ConsolidationOptions): Promise<ConsolidationResult>;
  
  // Real-time consolidation
  consolidateOnCreate(memoryId: string): Promise<void>;
  consolidateOnUpdate(memoryId: string): Promise<void>;
  
  // Conflict management
  resolveConflict(conflictId: string, resolution: Resolution): Promise<void>;
  getPendingConflicts(userId: string): Promise<ConflictFlag[]>;
}

class MemoryConsolidationService implements ConsolidationService {
  private memoryService: MemoryService;
  private vectorStore: VectorStore;
  private llmService: LLMService;

  async runBatchConsolidation(
    options: ConsolidationOptions
  ): Promise<ConsolidationResult> {
    const {
      userId,
      batchSize = 100,
      minImportance = 0,
      maxAge = 24,  // hours
      similarityThreshold = 0.85,
    } = options;
    
    // 1. Fetch candidate memories
    const candidates = await this.memoryService.search({
      userId,
      minImportance,
      occurredBefore: hoursAgo(maxAge),
      limit: batchSize,
    });
    
    // 2. Find similar pairs
    const similarPairs = await this.findSimilarPairs(
      candidates,
      similarityThreshold
    );
    
    // 3. Detect conflicts
    const conflicts = await this.detectConflicts(similarPairs);
    
    // 4. Merge non-conflicting
    const merges = await this.mergeMemories(
      similarPairs.filter(p => !conflicts.find(c => c.pairId === p.pairId))
    );
    
    // 5. Update indexes
    await this.updateIndexes(merges);
    
    return {
      processed: candidates.length,
      similarPairs: similarPairs.length,
      conflicts: conflicts.length,
      merged: merges.length,
    };
  }

  private async findSimilarPairs(
    memories: Memory[],
    threshold: number
  ): Promise<SimilarPair[]> {
    const pairs: SimilarPair[] = [];
    
    for (let i = 0; i < memories.length; i++) {
      const similar = await findSimilarMemories(memories[i].id, {
        highSimilarity: threshold,
      });
      
      for (const sim of similar) {
        pairs.push({
          pairId: `${memories[i].id}-${sim.memoryId}`,
          memory1Id: memories[i].id,
          memory2Id: sim.memoryId,
          similarity: sim.similarity,
        });
      }
    }
    
    return deduplicatePairs(pairs);
  }
}
```

---

## Consolidation Status

```typescript
enum MemoryConsolidationStatus {
  RAW = 'RAW',              // Newly created, unprocessed
  CONSOLIDATING = 'CONSOLIDATING',  // Currently being processed
  CONSOLIDATED = 'CONSOLIDATED',    // Fully processed
  MERGED = 'MERGED',        // Merged into another memory
  ARCHIVED = 'ARCHIVED',    // Old, moved to cold storage
}

interface ConsolidationMetadata {
  status: MemoryConsolidationStatus;
  lastConsolidatedAt?: ISO8601;
  consolidationVersion: number;
  mergedInto?: string;      // If merged, ID of target memory
  mergedFrom?: string[];    // If result of merge, source memory IDs
  conflictsResolved: number;
}
```

---

## Consolidation Analytics

```typescript
interface ConsolidationAnalytics {
  // Volume metrics
  totalMemories: number;
  consolidatedMemories: number;
  mergedMemories: number;
  archivedMemories: number;
  
  // Quality metrics
  avgSimilarityScore: number;
  conflictRate: number;
  resolutionAccuracy: number;
  
  // Efficiency metrics
  avgConsolidationTime: number;  // ms
  batchThroughput: number;       // memories/second
  
  // Trends
  consolidationOverTime: TimeSeries;
  conflictsOverTime: TimeSeries;
}

async function generateConsolidationAnalytics(
  userId: string,
  timeRange: TimeRange
): Promise<ConsolidationAnalytics> {
  const memories = await memoryService.getAll(userId, timeRange);
  
  return {
    totalMemories: memories.length,
    consolidatedMemories: memories.filter(
      m => m.consolidation.status === 'CONSOLIDATED'
    ).length,
    mergedMemories: memories.filter(
      m => m.consolidation.status === 'MERGED'
    ).length,
    archivedMemories: memories.filter(
      m => m.consolidation.status === 'ARCHIVED'
    ).length,
    
    avgSimilarityScore: calculateAvgSimilarity(memories),
    conflictRate: calculateConflictRate(memories),
    resolutionAccuracy: calculateResolutionAccuracy(memories),
    
    avgConsolidationTime: await measureConsolidationTime(),
    batchThroughput: await measureBatchThroughput(),
    
    consolidationOverTime: await getTimeSeries(userId, 'consolidation'),
    conflictsOverTime: await getTimeSeries(userId, 'conflicts'),
  };
}
```

---

## Best Practices

### For Users

1. **Review Conflicts Promptly**: Resolve flagged conflicts to maintain memory quality
2. **Trust Automatic Merges**: System merges are conservative and safe
3. **Use Manual Merge**: For important memories, review merge suggestions
4. **Archive, Don't Delete**: Old memories may still be valuable

### For Developers

1. **Run Consolidation Async**: Don't block user operations
2. **Batch Small Updates**: Consolidate in batches for efficiency
3. **Preserve Provenance**: Always track which memories were merged
4. **Handle Edge Cases**: Empty content, missing embeddings, etc.
5. **Log Everything**: Consolidation decisions should be auditable

---

## Implementation Reference

For implementation details, see the source code:

- **Consolidation Service**: `server/src/context/memory/memory-consolidation-service.ts`
- **Conflict Detection**: `server/src/services/memory-conflict-detection.ts`
- **Similarity Search**: `server/src/context/memory/memory-retrieval-service.ts`

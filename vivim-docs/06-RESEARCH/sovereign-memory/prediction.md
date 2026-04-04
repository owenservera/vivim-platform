# Prediction Engine

## Overview

The Prediction Engine anticipates what context you'll need before you need it, pre-compiling context bundles and pre-warming caches for instant AI responses.

---

## Prediction Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prediction Engine Architecture                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   User      │────►│   Pattern   │────►│  Predict    │      │
│  │  Presence   │     │   Analyzer  │     │  Next Need  │      │
│  └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                  │              │
│                                                  ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Cache     │◄────│   Compile   │◄────│  Generate   │      │
│  │   Warm      │     │   Bundles   │     │   Actions   │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Input Signals

### Client Presence

```typescript
interface ClientPresence {
  userId: string;
  deviceId: string;
  
  // Current activity
  activeConversationId?: string;
  visibleConversationIds: string[];
  activeNotebookId?: string;
  activePersonaId?: string;
  
  // Navigation
  lastNavigationPath: string;
  navigationHistory: NavigationEvent[];
  localTime: string;
  
  // Session info
  sessionStartedAt: ISO8601;
  idleSince?: ISO8601;
  isOnline: boolean;
  lastHeartbeatAt: ISO8601;
  
  // Previous predictions
  predictedTopics: string[];
  predictedEntities: string[];
}

interface NavigationEvent {
  path: string;
  timestamp: ISO8601;
  duration: number;  // ms spent on previous page
  action: 'navigate' | 'open' | 'close' | 'search';
}
```

### Historical Patterns

```typescript
interface UsagePattern {
  patternId: string;
  userId: string;
  
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
  lastObserved: ISO8601;
  
  // Predicted next action
  nextAction?: {
    type: 'conversation' | 'topic' | 'entity' | 'memory';
    referenceId: string;
    probability: number;
  };
}
```

### Context Signals

```typescript
interface ContextSignals {
  // Temporal signals
  timeOfDay: number;
  dayOfWeek: number;
  isWorkHours: boolean;
  isWeekend: boolean;
  
  // Activity signals
  sessionDuration: number;
  pagesVisited: number;
  conversationsActive: number;
  
  // Content signals
  recentTopics: string[];
  recentEntities: string[];
  recentQueries: string[];
  
  // Device signals
  deviceType: 'desktop' | 'mobile' | 'tablet';
  isPrimaryDevice: boolean;
}
```

---

## Prediction Algorithms

### Pattern Matching

```typescript
interface PatternMatch {
  pattern: UsagePattern;
  similarity: number;
  matchedSignals: string[];
}

function matchPatterns(
  currentSignals: ContextSignals,
  historicalPatterns: UsagePattern[]
): PatternMatch[] {
  const matches: PatternMatch[] = [];
  
  for (const pattern of historicalPatterns) {
    const matchedSignals: string[] = [];
    let similarity = 0;
    
    // Match time of day (within 2 hours)
    if (Math.abs(currentSignals.timeOfDay - pattern.signature.timeOfDay) <= 2) {
      matchedSignals.push('timeOfDay');
      similarity += 0.25;
    }
    
    // Match day of week
    if (currentSignals.dayOfWeek === pattern.signature.dayOfWeek) {
      matchedSignals.push('dayOfWeek');
      similarity += 0.15;
    }
    
    // Match navigation path
    const pathSimilarity = calculatePathSimilarity(
      currentSignals.recentTopics,
      pattern.signature.navigationPath
    );
    if (pathSimilarity > 0.5) {
      matchedSignals.push('navigationPath');
      similarity += pathSimilarity * 0.3;
    }
    
    // Match active entities
    const entityOverlap = calculateEntityOverlap(
      currentSignals.recentEntities,
      pattern.signature.activeEntities
    );
    if (entityOverlap > 0.3) {
      matchedSignals.push('activeEntities');
      similarity += entityOverlap * 0.3;
    }
    
    if (similarity > 0.3) {  // Minimum threshold
      matches.push({
        pattern,
        similarity,
        matchedSignals,
      });
    }
  }
  
  return matches.sort((a, b) => b.similarity - a.similarity);
}
```

### ML-Based Prediction

```typescript
interface PredictionModel {
  modelType: 'gradient_boosting' | 'neural_network' | 'transformer';
  features: string[];
  targets: string[];
  weights: Float32Array;
}

interface PredictionInput {
  // User features
  userId: string;
  historicalActions: number[];
  
  // Context features
  timeOfDay: number;
  dayOfWeek: number;
  recentTopics: number[];  // Embedding
  recentEntities: number[];  // Embedding
  
  // Session features
  sessionDuration: number;
  pagesVisited: number;
  
  // Device features
  deviceType: number;  // Encoded
  isPrimaryDevice: boolean;
}

interface PredictionOutput {
  predictions: Array<{
    type: 'conversation' | 'topic' | 'entity' | 'memory';
    referenceId: string;
    probability: number;
  }>;
  confidence: number;
}

async function predictWithML(
  model: PredictionModel,
  input: PredictionInput
): Promise<PredictionOutput> {
  // 1. Extract features
  const features = extractFeatures(input);
  
  // 2. Run inference
  const scores = await runInference(model, features);
  
  // 3. Convert to predictions
  const predictions = scores
    .map((score, i) => ({
      type: model.targets[i].split(':')[0] as PredictionType,
      referenceId: model.targets[i].split(':')[1],
      probability: sigmoid(score),
    }))
    .filter(p => p.probability > 0.3);  // Threshold
  
  return {
    predictions,
    confidence: calculateConfidence(scores),
  };
}
```

### Collaborative Filtering

```typescript
interface CollaborativePrediction {
  // Find similar users
  similarUsers: string[];
  
  // Predict based on their behavior
  predictions: Array<{
    type: PredictionType;
    referenceId: string;
    probability: number;
    basedOnUsers: string[];
  }>;
}

async function predictWithCollaborativeFiltering(
  userId: string,
  currentContext: ContextSignals
): Promise<CollaborativePrediction> {
  // 1. Find similar users
  const similarUsers = await findSimilarUsers(userId, currentContext);
  
  // 2. Get their recent actions
  const actions = await getRecentActions(similarUsers, currentContext);
  
  // 3. Aggregate predictions
  const predictions = aggregateActions(actions);
  
  return {
    similarUsers,
    predictions,
  };
}

async function findSimilarUsers(
  userId: string,
  context: ContextSignals
): Promise<string[]> {
  // Find users with similar:
  // - Usage patterns (time, frequency)
  // - Topic interests
  // - Device types
  
  const userEmbedding = await createUserEmbedding(userId);
  const candidates = await getAllActiveUsers();
  
  const similarities = await Promise.all(
    candidates.map(async c => ({
      userId: c,
      similarity: cosineSimilarity(
        userEmbedding,
        await createUserEmbedding(c)
      ),
    }))
  );
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)  // Top 10 similar users
    .map(s => s.userId);
}
```

---

## Bundle Pre-compilation

### Bundle Types

| Bundle | TTL | Trigger | Content |
|--------|-----|---------|---------|
| IDENTITY_CORE | 24h | User login | Identity, preferences |
| GLOBAL_PREFS | 12h | Settings change | Global settings |
| TOPIC | 4h | Topic navigation | Topic-specific context |
| ENTITY | 6h | Entity mention | Entity-specific context |
| CONVERSATION | 30m | Active conversation | Recent messages |

### Compilation Strategy

```typescript
interface CompilationStrategy {
  bundleType: BundleType;
  
  // When to compile
  triggers: string[];
  cooldown: number;  // ms between compilations
  
  // What to include
  maxTokens: number;
  includedTypes: MemoryType[];
  minImportance: number;
  
  // Expiration
  ttl: number;  // ms
  invalidateOn?: string[];  // Events that invalidate
}

const COMPILATION_STRATEGIES: Record<BundleType, CompilationStrategy> = {
  IDENTITY_CORE: {
    bundleType: 'IDENTITY_CORE',
    triggers: ['user.login', 'identity.updated'],
    cooldown: 60 * 60 * 1000,  // 1 hour
    maxTokens: 200,
    includedTypes: ['IDENTITY', 'PREFERENCE'],
    minImportance: 0.7,
    ttl: 24 * 60 * 60 * 1000,  // 24 hours
    invalidateOn: ['user.updated', 'identity.changed'],
  },
  TOPIC: {
    bundleType: 'TOPIC',
    triggers: ['topic.view', 'topic.navigate'],
    cooldown: 15 * 60 * 1000,  // 15 minutes
    maxTokens: 500,
    includedTypes: ['SEMANTIC', 'FACTUAL', 'PROJECT'],
    minImportance: 0.5,
    ttl: 4 * 60 * 60 * 1000,  // 4 hours
    invalidateOn: ['topic.updated'],
  },
  // ... more strategies
};
```

### Pre-compilation Pipeline

```typescript
async function preCompileBundles(
  userId: string,
  predictions: Prediction[]
): Promise<CompilationResult[]> {
  const results: CompilationResult[] = [];
  
  for (const prediction of predictions) {
    if (prediction.probability < 0.5) continue;  // Skip low-confidence
    
    // Determine bundle type
    const bundleType = predictionTypeToBundleType(prediction.type);
    const strategy = COMPILATION_STRATEGIES[bundleType];
    
    // Check cooldown
    const lastCompiled = await getLastCompilation(userId, bundleType, prediction.referenceId);
    if (Date.now() - lastCompiled < strategy.cooldown) {
      continue;
    }
    
    // Compile bundle
    try {
      const bundle = await compileBundle(userId, {
        type: bundleType,
        referenceId: prediction.referenceId,
        strategy,
      });
      
      // Cache the bundle
      await cacheBundle(bundle);
      
      results.push({
        bundleId: bundle.id,
        bundleType,
        compiledAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + strategy.ttl).toISOString(),
        tokens: bundle.tokens,
      });
    } catch (error) {
      logger.error({ error, prediction }, 'Failed to pre-compile bundle');
    }
  }
  
  return results;
}
```

---

## Cache Warming

### Multi-Layer Cache

```typescript
interface CacheConfig {
  // L1: In-memory (fastest)
  l1: {
    maxSize: number;  // entries
    ttl: number;      // seconds
  };
  
  // L2: Redis (fast)
  l2: {
    connectionString: string;
    ttl: number;      // seconds
  };
  
  // L3: Database (slower, persistent)
  l3: {
    ttl: number;      // seconds
  };
}

async function warmCache(
  userId: string,
  bundles: ContextBundle[]
): Promise<void> {
  for (const bundle of bundles) {
    // L1: In-memory cache
    l1Cache.set(getCacheKey(userId, bundle.id), bundle, {
      ttl: CACHE_CONFIG.l1.ttl,
    });
    
    // L2: Redis cache
    await redisCache.set(getCacheKey(userId, bundle.id), bundle, {
      ttl: CACHE_CONFIG.l2.ttl,
    });
    
    // L3: Database (already stored during compilation)
  }
}

async function getCachedBundle(
  userId: string,
  bundleId: string
): Promise<ContextBundle | null> {
  // Try L1 first
  const l1Result = l1Cache.get(getCacheKey(userId, bundleId));
  if (l1Result) return l1Result;
  
  // Try L2
  const l2Result = await redisCache.get(getCacheKey(userId, bundleId));
  if (l2Result) {
    // Promote to L1
    l1Cache.set(getCacheKey(userId, bundleId), l2Result);
    return l2Result;
  }
  
  // Try L3 (database)
  const l3Result = await databaseCache.get(userId, bundleId);
  if (l3Result) {
    // Promote to L1 and L2
    l1Cache.set(getCacheKey(userId, bundleId), l3Result);
    await redisCache.set(getCacheKey(userId, bundleId), l3Result);
    return l3Result;
  }
  
  return null;  // Cache miss
}
```

### Prefetch Strategy

```typescript
interface PrefetchConfig {
  // How aggressive to prefetch
  aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  
  // Probability thresholds
  prefetchThreshold: number;
  compileThreshold: number;
  
  // Resource limits
  maxPrefetches: number;
  maxCacheSize: number;
}

const PREFETCH_CONFIGS: Record<string, PrefetchConfig> = {
  conservative: {
    aggressiveness: 'conservative',
    prefetchThreshold: 0.8,
    compileThreshold: 0.9,
    maxPrefetches: 3,
    maxCacheSize: 10,
  },
  balanced: {
    aggressiveness: 'balanced',
    prefetchThreshold: 0.6,
    compileThreshold: 0.75,
    maxPrefetches: 5,
    maxCacheSize: 20,
  },
  aggressive: {
    aggressiveness: 'aggressive',
    prefetchThreshold: 0.4,
    compileThreshold: 0.5,
    maxPrefetches: 10,
    maxCacheSize: 50,
  },
};

async function decidePrefetchActions(
  predictions: Prediction[],
  config: PrefetchConfig
): Promise<PrefetchAction[]> {
  const actions: PrefetchAction[] = [];
  
  for (const prediction of predictions) {
    if (prediction.probability >= config.compileThreshold) {
      // High confidence: compile and prefetch
      actions.push({
        type: 'compile_and_prefetch',
        prediction,
        priority: 'high',
      });
    } else if (prediction.probability >= config.prefetchThreshold) {
      // Medium confidence: just prefetch if exists
      actions.push({
        type: 'prefetch_only',
        prediction,
        priority: 'medium',
      });
    }
    
    // Stop if we hit max prefetches
    if (actions.length >= config.maxPrefetches) break;
  }
  
  return actions;
}
```

---

## Learning from Feedback

### Feedback Collection

```typescript
interface PredictionFeedback {
  predictionId: string;
  prediction: Prediction;
  
  // What actually happened
  actualAction?: {
    type: PredictionType;
    referenceId: string;
    timestamp: ISO8601;
  };
  
  // Was prediction correct?
  wasCorrect: boolean;
  
  // User explicit feedback (optional)
  userRating?: 1 | 2 | 3 | 4 | 5;
  userComment?: string;
  
  // Timing
  feedbackAt: ISO8601;
}

async function collectFeedback(
  userId: string,
  prediction: Prediction,
  actualAction?: ActualAction
): Promise<void> {
  const feedback: PredictionFeedback = {
    predictionId: prediction.id,
    prediction,
    actualAction: actualAction ? {
      type: actualAction.type,
      referenceId: actualAction.referenceId,
      timestamp: new Date().toISOString(),
    } : undefined,
    wasCorrect: actualAction
      ? prediction.type === actualAction.type &&
        prediction.referenceId === actualAction.referenceId
      : false,
    feedbackAt: new Date().toISOString(),
  };
  
  await feedbackStore.save(feedback);
  
  // Trigger model update
  await updatePredictionModel(userId, feedback);
}
```

### Model Update

```typescript
async function updatePredictionModel(
  userId: string,
  feedback: PredictionFeedback
): Promise<void> {
  // 1. Get current model
  const model = await getModel(userId);
  
  // 2. Calculate error
  const expected = feedback.wasCorrect ? 1 : 0;
  const predicted = feedback.prediction.probability;
  const error = expected - predicted;
  
  // 3. Update weights (online learning)
  const learningRate = 0.01;
  model.weights = updateWeights(
    model.weights,
    extractFeatures(feedback.prediction),
    error,
    learningRate
  );
  
  // 4. Save updated model
  await saveModel(userId, model);
  
  // 5. Log update
  logger.info({
    userId,
    predictionId: feedback.predictionId,
    wasCorrect: feedback.wasCorrect,
    error,
  }, 'Prediction model updated');
}
```

---

## Telemetry & Metrics

```typescript
interface PredictionTelemetry {
  // Accuracy metrics
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  
  // By type
  accuracyByType: Record<PredictionType, number>;
  
  // By confidence
  accuracyByConfidence: {
    high: number;    // > 0.8
    medium: number;  // 0.5-0.8
    low: number;     // < 0.5
  };
  
  // Performance
  avgPredictionTime: number;  // ms
  avgCompilationTime: number; // ms
  
  // Cache
  cacheHitRate: number;
  prefetchHitRate: number;
  
  // Trends
  accuracyOverTime: TimeSeries;
}

async function generatePredictionTelemetry(
  userId: string,
  timeRange: TimeRange
): Promise<PredictionTelemetry> {
  const feedbacks = await feedbackStore.getRange(userId, timeRange);
  
  const total = feedbacks.length;
  const correct = feedbacks.filter(f => f.wasCorrect).length;
  
  // Group by type
  const byType = groupBy(feedbacks, f => f.prediction.type);
  const accuracyByType = Object.fromEntries(
    Object.entries(byType).map(([type, feedbacks]) => [
      type,
      feedbacks.filter(f => f.wasCorrect).length / feedbacks.length,
    ])
  );
  
  // Group by confidence
  const byConfidence = {
    high: feedbacks.filter(f => f.prediction.probability > 0.8),
    medium: feedbacks.filter(f => f.prediction.probability > 0.5),
    low: feedbacks.filter(f => f.prediction.probability <= 0.5),
  };
  const accuracyByConfidence = {
    high: byConfidence.high.filter(f => f.wasCorrect).length / byConfidence.high.length,
    medium: byConfidence.medium.filter(f => f.wasCorrect).length / byConfidence.medium.length,
    low: byConfidence.low.filter(f => f.wasCorrect).length / byConfidence.low.length,
  };
  
  return {
    totalPredictions: total,
    correctPredictions: correct,
    accuracy: correct / total,
    accuracyByType,
    accuracyByConfidence,
    avgPredictionTime: await calculateAvgPredictionTime(),
    avgCompilationTime: await calculateAvgCompilationTime(),
    cacheHitRate: await calculateCacheHitRate(),
    prefetchHitRate: await calculatePrefetchHitRate(),
    accuracyOverTime: await calculateAccuracyOverTime(feedbacks),
  };
}
```

---

## Implementation Reference

For implementation details, see the source code:

- **Prediction Engine**: `server/src/context/prediction-engine.ts`
- **Prefetch Engine**: `server/src/context/prefetch-engine.ts`
- **Adaptive Prediction**: `server/src/context/adaptive-prediction.ts`
- **Context Cache**: `server/src/context/context-cache.ts`

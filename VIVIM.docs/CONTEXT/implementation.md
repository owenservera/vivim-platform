# VIVIM Context System - Implementation Documentation

**Date**: February 14, 2026  
**Status**: Implemented & Integrated  
**Version**: 1.0

---

## Executive Summary

This document details the implementation of VIVIM's dynamic context generation system and its integration with AI API interactions. The implementation bridges the sophisticated context architecture that existed but was previously disconnected from the AI routes.

### What Was Implemented

| Component | Status | Lines Changed |
|-----------|--------|---------------|
| Context integration in `ai.js` | ✅ Complete | ~30 |
| Context integration in `ai-chat.js` | ✅ Complete | ~20 |
| ContextCache wiring in assembler | ✅ Complete | ~15 |
| Telemetry tracking | ✅ Complete | ~25 |
| Environment configuration | ✅ Verified | 0 |

---

## 1. Architecture Overview

### 1.1 System Flow

```
User Request
    ↓
buildContextBundles() [ai.js / ai-chat.js]
    ↓
unifiedContextService.generateContextForChat()
    ↓
DynamicContextAssembler.assemble()
    ├── detectMessageContext() → topics, entities
    ├── gatherBundles() → L0-L5 pre-compiled
    ├── justInTimeRetrieval() → relevant ACUs/memories
    ├── computeBudget() → token allocation
    └── compilePrompt() → final system prompt
    ↓
ContextCache (5-minute TTL)
    ↓
AI API receives enriched system prompt
```

### 1.2 Context Layers (L0-L5)

| Layer | Type | Description |
|-------|------|-------------|
| L0 | Identity Core | User biography, identity, role memories |
| L1 | Global Preferences | Custom instructions, known preferences |
| L2 | Topic Context | Topic-specific knowledge and memories |
| L3 | Entity Context | Entity-specific facts and relationships |
| L4 | Conversation Context | Recent conversation arc and messages |
| L5 | Persona-Specific | Persona-customized context |

---

## 2. Implementation Details

### 2.1 AI Routes Integration

#### ai.js (Context-Aware Chat)

**File**: `server/src/routes/ai.js`

Changes made:

1. **Import added**:
```javascript
import { unifiedContextService } from '../services/unified-context-service.js';
```

2. **buildContextBundles() function** - Replaced empty stub with actual implementation:
```javascript
async function buildContextBundles(userId, conversationId, options = {}) {
  if (conversationId && conversationId !== 'new-chat') {
    const result = await unifiedContextService.generateContextForChat(conversationId, {
      userMessage: options.userMessage || '',
      personaId: options.personaId,
      deviceId: options.deviceId
    });
    return {
      systemPrompt: result.systemPrompt,
      layers: result.layers,
      stats: result.stats,
      engineUsed: result.engineUsed
    };
  }
  return null;
}
```

3. **Updated endpoints**:
   - `/complete` - Context-aware completion
   - `/stream` - Streaming with context
   - `/agent` - Agent pipeline with context
   - `/agent/stream` - Streaming agent with context
   - `/chat` - Legacy-compatible chat

4. **Fallback handling**: If context assembly fails, falls back to basic persona prompt:
```javascript
const systemPrompt = contextResult?.systemPrompt || systemPromptManager.buildPrompt({...});
```

#### ai-chat.js (Fresh Chat)

**File**: `server/src/routes/ai-chat.js`

Changes made:

1. **Import added**:
```javascript
import { unifiedContextService } from '../services/unified-context-service.js';
```

2. **Context integration in `/send`**:
```javascript
let contextResult = null;
if (userId) {
  try {
    contextResult = await unifiedContextService.generateContextForChat(conversationId, {
      userMessage: message,
      personaId: conv.personaId
    });
  } catch (ctxError) {
    logger.warn({ error: ctxError.message }, 'Context assembly failed for fresh chat');
  }
}
```

3. **Context integration in `/stream`**: Same pattern for streaming endpoint

4. **Graceful degradation**: Context is optional - falls back to basic prompt if:
   - User not authenticated
   - Context assembly fails
   - No conversation history available

### 2.2 ContextCache Integration

**File**: `server/src/context/context-assembler.ts`

Changes made:

1. **Import added**:
```javascript
import { getContextCache } from './index';
import { logger } from '../lib/logger.js';
```

2. **Cache instance**:
```javascript
private cache = getContextCache();
```

3. **Cache read**:
```javascript
const cacheKey = `ctx:${params.userId}:${params.conversationId}:${params.userMessage.substring(0, 50)}`;
const cached = this.cache.get<AssembledContext>('bundle', cacheKey);
if (cached) {
  logger.debug({ cacheKey }, 'Context assembly cache hit');
  return cached;
}
```

4. **Cache write**:
```javascript
this.cache.set('bundle', cacheKey, result, 5 * 60 * 1000);
return result;
```

**Cache Configuration** (from `context-cache.ts`):
- Namespace: `bundle`
- Max entries: 500
- Default TTL: 30 minutes
- Touch on access: true

### 2.3 Telemetry Integration

**File**: `server/src/services/unified-context-service.ts`

Changes made:

1. **Import added**:
```javascript
import { getContextTelemetry } from '../context/index.js';

const telemetry = getContextTelemetry();
```

2. **Telemetry recording**:
```javascript
telemetry.record({
  timestamp: Date.now(),
  userId,
  conversationId,
  totalDurationMs: result.metadata.assemblyTimeMs,
  tokenBudget: result.budget.totalAvailable,
  tokenUsed: result.budget.totalUsed,
  cacheHitRate: result.metadata.cacheHitRate,
  topicsDetected: result.metadata.detectedTopics,
  entitiesDetected: result.metadata.detectedEntities,
  bundlesUsed: result.bundlesUsed.length,
  engineUsed: 'legacy',
  parallelFactor: 1,
  errors: []
});
```

### 2.4 Environment Configuration

**File**: `server/.env`

Verified configuration:
```bash
USE_DYNAMIC_CONTEXT=true
LIBRARIAN_ENABLED=true
TOKEN_ESTIMATOR_TYPE=gpt
DYNAMIC_CONTEXT_LOG_LEVEL=info
COMPACTION_MODEL=glm-4.7-flash
```

---

## 3. Performance Features

### 3.1 Caching Strategy

| Cache Type | TTL | Max Entries | Purpose |
|------------|-----|-------------|---------|
| Bundle Cache | 30 min | 500 | Assembled contexts |
| Settings Cache | 1 hr | 100 | User preferences |
| Presence Cache | 5 min | 200 | Client presence |
| Graph Cache | 15 min | 50 | Context graphs |
| Prediction Cache | 5 min | 100 | Predicted contexts |
| Embedding Cache | 1 hr | 1000 | Text embeddings |

### 3.2 Invalidation Strategy

- **On memory create/update/delete**: Invalidate identity_core, global_prefs
- **On instruction change**: Invalidate global_prefs
- **On message created**: Invalidate conversation bundle
- **On ACU create/update**: Invalidate topic, entity bundles

### 3.3 Fallback Chain

```
1. Try DynamicContextAssembler
   ↓ (fails)
2. Log warning, use fallback
   ↓
3. Old context-generator.js
   ↓ (fails)
4. Basic persona prompt only
```

---

## 4. Existing Infrastructure (Previously Built)

The following components were already built but not connected:

### 4.1 Core Components

| Component | File | Status |
|-----------|------|--------|
| DynamicContextAssembler | `context-assembler.ts` | ✅ Built |
| BundleCompiler | `bundle-compiler.ts` | ✅ Built |
| BudgetAlgorithm | `budget-algorithm.ts` | ✅ Built |
| HybridRetrievalService | `hybrid-retrieval.ts` | ✅ Built |
| ContextCache | `context-cache.ts` | ✅ Built |
| ContextTelemetry | `context-telemetry.ts` | ✅ Built |
| ContextEventBus | `context-event-bus.ts` | ✅ Built |
| ParallelContextPipeline | `context-pipeline.ts` | ✅ Built |
| PrefetchEngine | `prefetch-engine.ts` | ✅ Built |
| QueryOptimizer | `query-optimizer.ts` | ✅ Built |

### 4.2 Not Yet Wired

The following exist but aren't actively used by the assembler:

- `ParallelContextPipeline` - For parallel bundle fetching
- `ContextEventBus` - For real-time invalidation
- `PrefetchEngine` - For predictive pre-loading

---

## 5. API Response Format

### 5.1 Context Stats in Response

When context is used, responses include:

```json
{
  "success": true,
  "data": {
    "content": "AI response...",
    "model": "glm-4.7-flash",
    "usage": {
      "totalTokens": 1500,
      "promptTokens": 1200,
      "completionTokens": 300
    },
    "provider": "zai",
    "conversationId": "conv_123"
  }
}
```

### 5.2 Internal Context Metadata

Available via `contextResult.stats`:

```javascript
{
  engine: 'dynamic',
  messageCount: 15,
  detectedTopics: 2,
  detectedEntities: 3,
  cacheHitRate: 0.85
}
```

---

## 6. Monitoring & Observability

### 6.1 Logs

Key log points:
- Context assembly start/end
- Cache hits/misses
- Fallback activation
- Errors with stack traces

Log levels:
- `info`: Assembly complete, tokens used
- `debug`: Cache hits
- `warn`: Context assembly failed, using fallback

### 6.2 Telemetry Metrics

Tracked metrics:
- `totalDurationMs` - Total assembly time
- `tokenBudget` / `tokenUsed` - Token utilization
- `cacheHitRate` - Cache performance
- `topicsDetected` / `entitiesDetected` - Context richness
- `bundlesUsed` - Layer coverage

### 6.3 Health Check

Available via `unifiedContextService.healthCheck()`:

```javascript
{
  newEngineAvailable: true,
  oldEngineAvailable: true,
  stats: {
    topicProfiles: 150,
    entityProfiles: 45,
    contextBundles: 320
  }
}
```

---

## 7. Future Improvements

### 7.1 High Priority

| Improvement | Effort | Impact |
|-------------|--------|--------|
| Wire ParallelContextPipeline | Medium | 3-5x faster assembly |
| Real-time context updates during streaming | High | Better responses |
| User-specific personalization | Medium | More relevant context |

### 7.2 Medium Priority

| Improvement | Effort | Impact |
|-------------|--------|--------|
| Context visualization for users | Medium | Transparency |
| Explainable AI decisions | Medium | Trust |
| Predictive pre-fetching | Medium | Faster first response |

### 7.3 Lower Priority

| Improvement | Effort | Impact |
|-------------|--------|--------|
| Advanced semantic reasoning | High | Smarter detection |
| Multi-modal context | High | Richer context |
| A/B testing framework | Medium | Data-driven improvements |

---

## 8. Troubleshooting

### 8.1 Context Not Working

1. Check `USE_DYNAMIC_CONTEXT=true` in `.env`
2. Check logs for "Context assembly failed"
3. Verify database has topic/entity profiles
4. Check Prisma connection

### 8.2 Slow Context Assembly

1. Check cache hit rate (target: 80%+)
2. Check database query performance
3. Enable parallel processing
4. Consider warming bundles proactively

### 8.3 Missing Context Layers

1. Check topic/entity profiles exist in database
2. Verify bundle compilation completed
3. Check for invalidation storms
4. Review telemetry for error patterns

---

## 9. Testing

### 9.1 Manual Testing

1. Start server with `USE_DYNAMIC_CONTEXT=true`
2. Create conversation with topics
3. Send messages and verify context in logs
4. Check cache hit rate increases on repeat messages

### 9.2 Automated Tests

Recommended tests:
- Context assembly with various conversation states
- Cache invalidation on data changes
- Fallback behavior on failures
- Telemetry accuracy

---

## 10. References

- **Gap Analysis**: `plans/VIVIM_context_system_gaps_analysis.md`
- **10x Plan**: `plans/VIVIM_context_system_10x_improvement_plan.md`
- **Context Types**: `server/src/context/types.ts`
- **Bundle Compiler**: `server/src/context/bundle-compiler.ts`
- **Unified Service**: `server/src/services/unified-context-service.ts`

---

*Generated: February 14, 2026*

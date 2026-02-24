---
sidebar_position: 1
title: Parallel Context Pipeline
---

# Parallel Context Pipeline (`ParallelContextPipeline`)

The `ParallelContextPipeline` is the most important infrastructural component of the context system. It is designed to overcome latency issues common in serial RAG systems, providing parallel data assembly and streaming chunking.

## Key Features

### Parallel Assembly
By fetching all the necessary context variables concurrently, VIVIM achieves extremely low latency.

```ts
async assembleParallel(params: AssemblyParams)
```

The pipeline queries external data, internal database dependencies `PrismaClient`, embeddings via `IEmbeddingService`, user settings, cache, and token budgets concurrently inside standard standard JavaScript Promise.all groups. 

### Streaming Yielding (`assembleStreaming`)
A true architectural advancement. Unlike monolithic text prompt structures, VIVIM yields sections in priority order to the downstream `StreamingContextChunk` wrapper using **async generators**.

### Concurrency Limiter
Fetching too many vectors at exactly the same microsecond can crash or block the Node event loop or database connections.
The `ConcurrencyLimiter` class ensures we only fetch a configured `maxConcurrent` number of operations (typically 5-10 operations at a time).

## Performance Optimization
* `PipelineMetrics`: Aggregates the duration, source, and error information for every micro-stage.
* **Cache Strategy**: Emits cache hit rate, skips computing bundles that are unmodified, returning immediately.

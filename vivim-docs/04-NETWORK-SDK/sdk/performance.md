---
sidebar_position: 15
---

# Performance Guide

Optimization techniques and best practices for high-performance VIVIM SDK applications.

## Benchmarking

### Setup

```typescript
import { bench, describe } from 'vitest';

describe('Storage Benchmarks', () => {
  let storageNode: StorageNode;
  
  beforeEach(async () => {
    storageNode = await sdk.loadNode('storage');
  });
  
  bench('store 1KB', async () => {
    const data = new Uint8Array(1024);
    await storageNode.store(data);
  });
  
  bench('store 1MB', async () => {
    const data = new Uint8Array(1024 * 1024);
    await storageNode.store(data);
  });
  
  bench('retrieve by CID', async () => {
    await storageNode.retrieve(testCid);
  });
});
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  operation: string;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number; // ops/sec
  errorRate: number;
}

async function measurePerformance(
  operation: () => Promise<void>,
  iterations: number = 1000
): Promise<PerformanceMetrics> {
  const latencies: number[] = [];
  let errors = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await operation();
    } catch {
      errors++;
    }
    latencies.push(performance.now() - start);
  }
  
  latencies.sort((a, b) => a - b);
  
  return {
    operation: operation.name,
    avgLatency: latencies.reduce((a, b) => a + b, 0) / iterations,
    p95Latency: latencies[Math.floor(iterations * 0.95)],
    p99Latency: latencies[Math.floor(iterations * 0.99)],
    throughput: iterations / (latencies.reduce((a, b) => a + b, 0) / 1000),
    errorRate: errors / iterations,
  };
}
```

## Optimization Techniques

### 1. Caching Strategies

```typescript
import { Extension } from '@vivim/sdk/extension';

// Multi-level cache extension
const cacheExtension: Extension = {
  id: 'myorg/multi-level-cache',
  extends: 'storage-node:method:retrieve',
  priority: 1,
  implementation: {
    before: async (originalMethod, cid) => {
      // L1: Memory cache
      const l1Hit = memoryCache.get(cid);
      if (l1Hit) return l1Hit;
      
      // L2: Disk cache
      const l2Hit = await diskCache.get(cid);
      if (l2Hit) {
        memoryCache.set(cid, l2Hit); // Populate L1
        return l2Hit;
      }
      
      return null; // Cache miss - proceed to storage
    },
    
    after: async (result, originalMethod, cid) => {
      // Populate caches on miss
      memoryCache.set(cid, result);
      await diskCache.set(cid, result);
      return result;
    },
  },
};
```

### 2. Batch Operations

```typescript
async function batchOperations<T>(
  items: T[],
  operation: (item: T) => Promise<void>,
  options: {
    batchSize?: number;
    concurrency?: number;
  } = {}
): Promise<void> {
  const { batchSize = 100, concurrency = 10 } = options;
  
  // Process in batches with limited concurrency
  for (let i = 0; i < items.length; i += batchSize * concurrency) {
    const batch = items.slice(i, i + batchSize * concurrency);
    
    const batchPromises = Array.from({ length: concurrency }, (_, cIndex) => {
      const start = cIndex * batchSize;
      const end = start + batchSize;
      const subBatch = batch.slice(start, end);
      
      return Promise.all(subBatch.map(operation));
    });
    
    await Promise.all(batchPromises);
  }
}

// Usage
await batchOperations(
  largeDataset,
  async (item) => await storageNode.store(item),
  { batchSize: 50, concurrency: 5 }
);
```

### 3. Connection Pooling

```typescript
class ConnectionPool {
  private connections: any[] = [];
  private available: any[] = [];
  private maxConnections: number;
  
  constructor(maxConnections: number = 10) {
    this.maxConnections = maxConnections;
  }
  
  async acquire(): Promise<any> {
    if (this.available.length === 0) {
      if (this.connections.length < this.maxConnections) {
        const conn = await this.createConnection();
        this.connections.push(conn);
        return conn;
      }
      // Wait for available connection
      await this.waitForAvailable();
      return this.acquire();
    }
    return this.available.pop();
  }
  
  async release(conn: any): Promise<void> {
    this.available.push(conn);
  }
}

// Usage with storage
const pool = new ConnectionPool(20);

async function pooledStore(data: any) {
  const conn = await pool.acquire();
  try {
    return await conn.store(data);
  } finally {
    await pool.release(conn);
  }
}
```

### 4. Lazy Loading

```typescript
class LazyNode {
  private node: StorageNode | null = null;
  private loadPromise: Promise<StorageNode> | null = null;
  
  async getNode(): Promise<StorageNode> {
    if (this.node) return this.node;
    
    if (!this.loadPromise) {
      this.loadPromise = sdk.loadNode('storage').then(n => {
        this.node = n;
        this.loadPromise = null;
        return n;
      });
    }
    
    return this.loadPromise;
  }
}

// Usage
const lazyStorage = new LazyNode();

// Node loads only when first accessed
const data = await (await lazyStorage.getNode()).retrieve(cid);
```

### 5. Compression

```typescript
import { compress, decompress } from '@vivim/sdk/utils';

async function compressedStore(storageNode: StorageNode, data: any) {
  // Compress before storing
  const compressed = await compress(data, {
    algorithm: 'gzip',
    level: 6, // Balance between speed and compression
  });
  
  return await storageNode.store(compressed, {
    metadata: { compressed: true, originalSize: data.length },
  });
}

async function compressedRetrieve(storageNode: StorageNode, cid: string) {
  const result = await storageNode.retrieve(cid);
  
  if (result.metadata?.compressed) {
    return await decompress(result.data);
  }
  
  return result.data;
}
```

## Memory Management

### Object Pooling

```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private create: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;
  
  constructor(
    create: () => T,
    reset: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.create = create;
    this.reset = reset;
    this.maxSize = maxSize;
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.create();
  }
  
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }
}

// Usage for buffers
const bufferPool = new ObjectPool(
  () => new Uint8Array(4096),
  (buf) => buf.fill(0),
  50
);

function processWithPool(data: Uint8Array) {
  const buffer = bufferPool.acquire();
  try {
    buffer.set(data);
    // Process buffer...
  } finally {
    bufferPool.release(buffer);
  }
}
```

### Garbage Collection Hints

```typescript
// Clear references explicitly
function cleanupNode(node: StorageNode) {
  // Clear caches
  node.clearCache?.();
  
  // Remove event listeners
  node.removeAllListeners?.();
  
  // Null out references
  node = null;
  
  // Hint to GC
  if (global.gc) {
    global.gc();
  }
}
```

## Network Optimization

### Request Deduplication

```typescript
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  
  async request<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Check if same request is pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }
    
    // Create new request
    const promise = operation()
      .finally(() => this.pendingRequests.delete(key));
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// Usage
const deduplicator = new RequestDeduplicator();

// Multiple concurrent calls to same CID deduplicate
const [result1, result2, result3] = await Promise.all([
  deduplicator.request(cid, () => storageNode.retrieve(cid)),
  deduplicator.request(cid, () => storageNode.retrieve(cid)),
  deduplicator.request(cid, () => storageNode.retrieve(cid)),
]);
// Only one actual storage call made
```

### Streaming

```typescript
async function* streamLargeData(cid: string): AsyncIterable<Uint8Array> {
  const storage = await sdk.loadNode('storage');
  const stream = await storage.getStream(cid);
  
  for await (const chunk of stream) {
    yield chunk;
  }
}

// Usage
for await (const chunk of streamLargeData(largeCid)) {
  processChunk(chunk);
}
```

## Profiling

### CPU Profiling

```typescript
import { Session } from 'inspector';

async function profileCPU(operation: () => Promise<void>) {
  const session = new Session();
  session.connect();
  
  session.post('Profiler.enable');
  session.post('Profiler.start');
  
  await operation();
  
  const profile = await new Promise((resolve) => {
    session.post('Profiler.stop', (err, result) => {
      resolve(result.profile);
    });
  });
  
  session.disconnect();
  
  // Analyze profile
  console.log('CPU Profile:', profile);
  return profile;
}
```

### Memory Profiling

```typescript
async function profileMemory(operation: () => Promise<void>) {
  // Take heap snapshot before
  const before = process.memoryUsage();
  
  await operation();
  
  // Take heap snapshot after
  const after = process.memoryUsage();
  
  console.log('Memory Delta:', {
    heapUsed: after.heapUsed - before.heapUsed,
    heapTotal: after.heapTotal - before.heapTotal,
    rss: after.rss - before.rss,
  });
}
```

## Best Practices

### 1. Use Appropriate Data Structures

```typescript
// ❌ Bad: O(n) lookup
const items = [item1, item2, item3];
const found = items.find(i => i.id === targetId);

// ✅ Good: O(1) lookup
const itemMap = new Map([
  [item1.id, item1],
  [item2.id, item2],
]);
const found = itemMap.get(targetId);
```

### 2. Avoid Unnecessary Serialization

```typescript
// ❌ Bad: Multiple JSON parses
const data = JSON.parse(JSON.stringify(original));

// ✅ Good: Direct reference or structuredClone
const data = structuredClone(original);
```

### 3. Use Typed Arrays

```typescript
// ❌ Bad: Regular arrays for binary data
const bytes = [0, 1, 2, 3];

// ✅ Good: Typed arrays
const bytes = new Uint8Array([0, 1, 2, 3]);
```

### 4. Debounce and Throttle

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Usage for search
const debouncedSearch = debounce(
  (query) => memoryNode.search(query),
  300
);
```

## Related

- [Testing Guide](./testing) - Performance testing
- [Advanced Examples](../examples/advanced) - Optimization patterns

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)

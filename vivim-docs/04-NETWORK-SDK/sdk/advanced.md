---
sidebar_position: 13
---

# Advanced Examples

Real-world examples and integration patterns for production applications.

## Multi-Node Orchestration

Coordinating multiple nodes for complex workflows.

```typescript
import { VivimSDK } from '@vivim/sdk';

async function multiNodeWorkflow() {
  const sdk = new VivimSDK({
    identity: { autoCreate: true },
    nodes: { autoLoad: true },
  });
  
  await sdk.initialize();
  
  // Load multiple nodes
  const [chatNode, memoryNode, contentNode] = await Promise.all([
    sdk.loadNode('ai-chat'),
    sdk.loadNode('memory'),
    sdk.loadNode('content'),
  ]);
  
  // Orchestrate workflow
  const userQuery = 'What did I learn about CRDTs?';
  
  // 1. Search memory for context
  const memories = await memoryNode.semanticSearch(userQuery, 5);
  
  // 2. Generate response with context
  const response = await chatNode.send({
    message: userQuery,
    context: {
      memories: memories.map(m => m.content),
    },
  });
  
  // 3. Create content from response
  const content = await contentNode.create({
    type: 'note',
    title: 'CRDT Learning Summary',
    body: response.content,
    tags: ['crdt', 'learning'],
  });
  
  // 4. Save new memory
  await memoryNode.create({
    content: `User learned about CRDTs: ${response.content}`,
    memoryType: 'episodic',
    category: 'learning',
    derivedFromIds: memories.map(m => m.id),
  });
  
  return { response, content };
}
```

## Event-Driven Architecture

Building reactive applications with SDK events.

```typescript
import { VivimSDK, SDK_EVENTS } from '@vivim/sdk';

class ReactiveApp {
  private sdk: VivimSDK;
  
  constructor() {
    this.sdk = new VivimSDK();
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    // Node lifecycle events
    this.sdk.on(SDK_EVENTS.NODE_LOADED, ({ nodeId }) => {
      console.log(`Node loaded: ${nodeId}`);
      this.onNodeReady(nodeId);
    });
    
    this.sdk.on(SDK_EVENTS.NODE_UNLOADED, ({ nodeId }) => {
      console.log(`Node unloaded: ${nodeId}`);
      this.cleanupNode(nodeId);
    });
    
    // Identity events
    this.sdk.on(SDK_EVENTS.IDENTITY_CREATED, ({ identity }) => {
      console.log(`Identity created: ${identity.did}`);
      this.onIdentityReady(identity);
    });
    
    // Operation events
    this.sdk.getRecordKeeper().on('operation:recorded', (op) => {
      console.log(`Operation recorded: ${op.type}`);
      this.updateUI(op);
    });
  }
  
  private async onNodeReady(nodeId: string) {
    if (nodeId === 'storage-node') {
      // Initialize storage when ready
      await this.initializeStorage();
    }
  }
  
  private async initializeStorage() {
    const storage = await this.sdk.loadNode('storage');
    
    // Load cached data
    const cache = await storage.retrieve(cacheCid);
    this.updateCache(cache);
  }
}
```

## Caching Layer

Implementing multi-level caching with extensions.

```typescript
import { Extension } from '@vivim/sdk/extension';

// Memory cache extension
const memoryCache: Extension = {
  id: 'myorg/memory-cache',
  extends: 'storage-node:method:retrieve',
  priority: 1,
  implementation: {
    before: async (originalMethod, cid) => {
      // Check memory cache first
      const cached = memoryCache.get(cid);
      if (cached) {
        console.log('Cache hit:', cid);
        return cached;
      }
      console.log('Cache miss:', cid);
      return null;
    },
    
    after: async (result, originalMethod, cid) => {
      // Cache the result
      memoryCache.set(cid, result, { ttl: 3600 });
      return result;
    },
  },
};

// Usage
const sdk = new VivimSDK();
await sdk.initialize();

sdk.getExtensionSystem().registerExtension(memoryCache);

const storage = await sdk.loadNode('storage');

// First call - cache miss
const data1 = await storage.retrieve(cid);

// Second call - cache hit (faster)
const data2 = await storage.retrieve(cid);
```

## Batch Operations

Processing large datasets efficiently.

```typescript
async function batchStore(storageNode, items, batchSize = 100) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(item => 
        storageNode.store(item, {
          encryption: true,
        }).catch(err => ({ error: err.message }))
      )
    );
    
    results.push(...batchResults);
    
    // Progress reporting
    const progress = Math.min(100, ((i + batchSize) / items.length) * 100);
    console.log(`Progress: ${progress.toFixed(1)}%`);
    
    // Rate limiting
    await sleep(100);
  }
  
  return results;
}

// Usage
const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: `Item ${i}`,
}));

const results = await batchStore(storageNode, largeDataset);
```

## Retry Logic

Implementing resilient operations with exponential backoff.

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    onRetry,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
          maxDelay
        );
        
        onRetry?.(error as Error, attempt);
        console.log(`Retry ${attempt}/${maxRetries} in ${delay.toFixed(0)}ms`);
        
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
}

// Usage
const result = await withRetry(
  () => storageNode.store(data),
  {
    maxRetries: 5,
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}: ${error.message}`);
    },
  }
);
```

## Circuit Breaker

Preventing cascade failures.

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        console.log('Circuit breaker: half-open');
      } else {
        throw new Error('Circuit breaker open');
      }
    }
    
    try {
      const result = await operation();
      
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        console.log('Circuit breaker: closed');
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.log('Circuit breaker: open');
      }
      
      throw error;
    }
  }
}

// Usage
const breaker = new CircuitBreaker(5, 60000);

async function resilientStore(data: any) {
  return await breaker.execute(() => storageNode.store(data));
}
```

## Monitoring & Observability

Implementing comprehensive monitoring.

```typescript
import { EventEmitter } from 'events';

class SDKMonitor extends EventEmitter {
  private metrics = new Map<string, Metric>();
  
  start(sdk: VivimSDK) {
    // Track node operations
    sdk.on(SDK_EVENTS.NODE_LOADED, () => {
      this.increment('nodes.loaded');
    });
    
    // Track operations
    const rk = sdk.getRecordKeeper();
    rk.on('operation:recorded', (op) => {
      this.increment(`operations.${op.type}`);
      this.histogram('operation.latency', op.duration);
    });
    
    // Track errors
    sdk.on(SDK_EVENTS.ERROR, (error) => {
      this.increment('errors.total');
      this.increment(`errors.${error.code}`);
    });
    
    // Periodic reporting
    setInterval(() => this.report(), 60000);
  }
  
  private increment(name: string) {
    const metric = this.metrics.get(name) || { count: 0, name };
    metric.count++;
    this.metrics.set(name, metric);
  }
  
  private report() {
    const report = {
      timestamp: Date.now(),
      metrics: Object.fromEntries(this.metrics),
    };
    
    this.emit('report', report);
    
    // Send to monitoring service
    sendToMonitoringService(report);
  }
}

// Usage
const monitor = new SDKMonitor();
monitor.start(sdk);

monitor.on('report', (report) => {
  console.log('Metrics report:', report);
});
```

## Related

- [Testing Guide](./testing) - Testing strategies
- [Performance Guide](./performance) - Optimization techniques

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **Examples Source**: [github.com/vivim/vivim-sdk/tree/main/examples](https://github.com/vivim/vivim-sdk/tree/main/examples)

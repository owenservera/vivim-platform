# VIVIM Autonomous Service Workers
## AI-Managed Background Services for Decentralized Social Network

---

## 1. Service Worker Architecture

### 1.1 Worker Types & Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORKER HIERARCHY                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         ┌─────────────┐                            │
│                         │   ORCHESTRATOR   │                        │
│                         │   (Main Agent)   │                        │
│                         └────────┬────────┘                            │
│                                  │                                     │
│           ┌──────────────────────┼──────────────────────┐              │
│           │                      │                      │              │
│     ┌─────▼─────┐         ┌─────▼─────┐         ┌─────▼─────┐        │
│     │  CORE     │         │  NETWORK  │         │  SOCIAL   │        │
│     │  LEADER   │         │  LEADER   │         │  LEADER   │        │
│     └─────┬─────┘         └─────┬─────┘         └─────┬─────┘        │
│           │                      │                      │              │
│     ┌─────┴─────┐         ┌─────┴─────┐         ┌─────┴─────┐        │
│     │BlockMaker │         │P2PConnect │         │FeedAggregator      │
│     │TxPool     │         │Discovery  │         │NotificationMgr    │
│     │Validator  │         │NATTraverse│         │MessageIndex       │
│     │StateSync  │         │RelayPool  │         │GraphSync          │
│     └───────────┘         └───────────┘         └───────────┘        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Worker Specifications

#### Core Workers

| Worker | Type | Description | Dependencies |
|--------|------|-------------|--------------|
| **BlockMaker** | Periodic | Creates and proposes new blocks | TxPool, StateSync |
| **TxPool** | Always-On | Manages transaction queue | Validator |
| **StateSync** | Event | Syncs state with peers | Network workers |
| **Validator** | Always-On | Validates transactions/blocks | All core |
| **GCWorker** | Periodic | Garbage collection | Storage workers |

#### Network Workers

| Worker | Type | Description | Dependencies |
|--------|------|-------------|--------------|
| **P2PConnect** | Always-On | Manages peer connections | None |
| **Discovery** | Periodic | Finds new peers | P2PConnect |
| **NATTraversal** | Event | Handles NAT punch-through | P2PConnect |
| **RelayMgr** | Always-On | Manages relay nodes | Discovery |
| **BandwidthOpt** | Periodic | Optimizes bandwidth | All network |

#### Social Workers

| Worker | Type | Description | Dependencies |
|--------|------|-------------|--------------|
| **FeedAggregator** | Always-On | Aggregates feed content | Network workers |
| **NotificationMgr** | Event | Sends notifications | FeedAggregator |
| **MessageIndexer** | Event | Indexes messages for search | Storage workers |
| **GraphSync** | Periodic | Syncs social graph | Network workers |
| **ModerationWorker** | AI | Moderates content | AI workers |

#### AI Workers

| Worker | Type | Description | Dependencies |
|--------|------|-------------|--------------|
| **AssistantWorker** | AI | AI chat responses | API Key |
| **ToolExecutor** | Event | Executes AI tools | AssistantWorker |
| **MemoryManager** | Periodic | Manages AI memory | Storage workers |
| **ContextPreparer** | Event | Prepares context | AssistantWorker |
| **CostOptimizer** | Periodic | Optimizes AI costs | All AI |

---

## 2. Worker Implementation

### 2.1 Base Worker

```typescript
// sdk/src/workers/base-worker.ts

import { EventEmitter } from 'events';
import type { DID, Timestamp } from './db-schema.js';

/**
 * Base class for all VIVIM service workers
 * Provides lifecycle management, health checking, and metrics
 */
export abstract class BaseWorker extends EventEmitter {
  // Identity
  readonly workerId: string;
  readonly workerType: WorkerType;
  readonly did: DID;
  
  // State
  protected state: WorkerState = 'initialized';
  protected config: WorkerConfig;
  protected startTime?: Timestamp;
  protected restartCount: number = 0;
  
  // Metrics
  protected metrics: WorkerMetrics = {
    messagesProcessed: 0,
    errors: 0,
    avgLatency: 0,
    lastActivity: 0
  };
  
  // Dependencies
  protected dependencies: Map<string, BaseWorker> = new Map();
  
  // Constructor
  constructor(config: WorkerConfig) {
    super();
    this.workerId = config.workerId;
    this.workerType = config.workerType;
    this.config = config;
  }
  
  // Lifecycle methods
  abstract async initialize(): Promise<void>;
  abstract async start(): Promise<void>;
  abstract async stop(): Promise<void>;
  
  // Health check
  abstract async healthCheck(): Promise<HealthStatus>;
  
  // Get metrics
  getMetrics(): WorkerMetrics {
    return {
      ...this.metrics,
      uptime: this.startTime ? Date.now() - Number(this.startTime) : 0,
      state: this.state
    };
  }
  
  // Dependency injection
  addDependency(worker: BaseWorker): void {
    this.dependencies.set(worker.workerId, worker);
  }
  
  removeDependency(workerId: string): void {
    this.dependencies.delete(workerId);
  }
  
  // Protected helpers
  protected async waitForDependencies(): Promise<void> {
    for (const [id, worker] of this.dependencies) {
      if (worker.state !== 'running') {
        await new Promise((resolve) => {
          worker.once('started', resolve);
        });
      }
    }
  }
  
  protected log(level: 'info' | 'warn' | 'error', message: string, meta?: object): void {
    const logEntry = {
      workerId: this.workerId,
      workerType: this.workerType,
      level,
      message,
      meta,
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(logEntry));
  }
  
  protected updateMetrics(updates: Partial<WorkerMetrics>): void {
    this.metrics = { ...this.metrics, ...updates, lastActivity: Date.now() };
  }
}

/**
 * Worker configuration
 */
export interface WorkerConfig {
  workerId: string;
  workerType: WorkerType;
  priority: number;        // 1-10
  maxMemory: number;       // bytes
  maxCPU: number;          // percentage
  timeout: number;         // ms
  retryPolicy: RetryPolicy;
  dependencies: WorkerType[];
  environment: WorkerEnvironment;
  
  // AI-specific
  aiConfig?: AIWorkerConfig;
}

/**
 * Worker types
 */
export type WorkerType = 
  | 'core.blockmaker'
  | 'core.txpool'
  | 'core.statesync'
  | 'core.validator'
  | 'core.gc'
  | 'network.p2p'
  | 'network.discovery'
  | 'network.nat'
  | 'network.relay'
  | 'network.bandwidth'
  | 'social.feed'
  | 'social.notification'
  | 'social.indexer'
  | 'social.graph'
  | 'social.moderation'
  | 'ai.assistant'
  | 'ai.tool'
  | 'ai.memory'
  | 'ai.context'
  | 'ai.cost'
  | 'trust.reputation'
  | 'trust.governance'
  | 'orchestrator';

/**
 * Worker states
 */
export type WorkerState = 
  | 'initialized'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'restarting';

/**
 * Worker metrics
 */
export interface WorkerMetrics {
  messagesProcessed: number;
  errors: number;
  avgLatency: number;
  lastActivity: number;
  uptime?: number;
  state?: WorkerState;
}

/**
 * Health status
 */
export interface HealthStatus {
  healthy: boolean;
  checks: HealthCheck[];
  score: number; // 0-100
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  lastCheck: Timestamp;
}

/**
 * Retry policy
 */
export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Worker environment
 */
export interface WorkerEnvironment {
  isOnline: boolean;
  isBackground: boolean;
  batteryLevel?: number;
  networkType?: 'wifi' | 'cellular' | 'offline';
  memoryPressure?: number;
}
```

### 2.2 Worker Runner

```typescript
// sdk/src/workers/worker-runner.ts

/**
 * Manages worker lifecycle and coordination
 */
export class WorkerRunner {
  private workers: Map<string, BaseWorker> = new Map();
  private orchestrator: WorkerOrchestrator;
  private eventBus: WorkerEventBus;
  
  // Worker management
  async registerWorker(worker: BaseWorker): Promise<void> {
    this.workers.set(worker.workerId, worker);
    
    // Set up event handlers
    worker.on('started', () => this.handleWorkerStarted(worker));
    worker.on('stopped', () => this.handleWorkerStopped(worker));
    worker.on('error', (error) => this.handleWorkerError(worker, error));
  }
  
  async startAll(): Promise<void> {
    // Start workers in dependency order
    const sorted = this.topologicalSort();
    
    for (const worker of sorted) {
      await this.startWorker(worker);
    }
  }
  
  async stopAll(): Promise<void> {
    // Stop in reverse order
    const sorted = this.topologicalSort().reverse();
    
    for (const worker of sorted) {
      await this.stopWorker(worker);
    }
  }
  
  // Health monitoring
  async performHealthCheck(): Promise<SystemHealth> {
    const results = await Promise.all(
      Array.from(this.workers.values()).map(w => w.healthCheck())
    );
    
    const healthy = results.filter(r => r.healthy).length;
    const score = (healthy / results.length) * 100;
    
    return {
      healthy: score >= 80,
      workerHealth: results,
      overallScore: score,
      timestamp: new Date().toISOString()
    };
  }
  
  // Auto-restart failed workers
  private setupAutoRecovery(): void {
    for (const worker of this.workers.values()) {
      worker.on('failed', async (error) => {
        if (worker.restartCount < 3) {
          await this.restartWorker(worker.workerId);
        } else {
          await this.disableWorker(worker.workerId);
        }
      });
    }
  }
}

/**
 * Worker orchestrator - coordinates workers
 */
export class WorkerOrchestrator extends BaseWorker {
  private childWorkers: Map<string, BaseWorker> = new Map();
  private taskQueue: TaskQueue;
  private aiPlanner: AITaskPlanner;
  
  constructor(config: WorkerConfig) {
    super({
      ...config,
      workerType: 'orchestrator'
    });
    this.taskQueue = new TaskQueue();
    this.aiPlanner = new AITaskPlanner(config.aiConfig);
  }
  
  async initialize(): Promise<void> {
    this.log('info', 'Initializing orchestrator');
    
    // Register all worker types
    await this.registerWorkerTypes();
    
    // Initialize AI planning
    await this.aiPlanner.initialize();
  }
  
  async start(): Promise<void> {
    this.state = 'running';
    this.startTime = new Date().toISOString() as Timestamp;
    
    // Start the autonomous loop
    this.runAutonomousLoop();
  }
  
  private async runAutonomousLoop(): Promise<void> {
    while (this.state === 'running') {
      try {
        // 1. Assess system state
        const systemState = await this.assessSystemState();
        
        // 2. Get AI recommendations
        const plan = await this.aiPlanner.createPlan(systemState);
        
        // 3. Execute plan
        await this.executePlan(plan);
        
        // 4. Monitor execution
        await this.monitorExecution();
        
        // 5. Learn and adapt
        await this.learn();
        
        // 6. Sleep
        await this.sleep(5000); // 5 seconds
      } catch (error) {
        this.log('error', 'Autonomous loop error', { error });
      }
    }
  }
  
  private async assessSystemState(): Promise<SystemState> {
    const workers = Array.from(this.childWorkers.values());
    
    return {
      workerStates: new Map(workers.map(w => [w.workerId, w.getMetrics()])),
      networkHealth: await this.getNetworkHealth(),
      resourceUsage: await this.getResourceUsage(),
      pendingTasks: await this.taskQueue.getPendingCount(),
      errorRates: await this.getErrorRates()
    };
  }
}
```

---

## 3. AI Service Workers

### 3.1 AI Worker Implementation

```typescript
// sdk/src/workers/ai-worker.ts

import type { AIProviderType, AITask, AIResponse } from './db-schema.js';

/**
 * AI-powered service worker
 * Uses API keys to autonomously execute tasks
 */
export class AIServiceWorker extends BaseWorker {
  // AI Configuration
  private apiKeys: Map<string, AIKeyConfig> = new Map();
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private activeTasks: Map<string, AITask> = new Map();
  
  // Context management
  private contextWindow: ContextWindow;
  private memoryStore: VectorStore;
  
  // Rate limiting
  private rateLimiter: RateLimiter;
  private costTracker: CostTracker;
  
  constructor(config: WorkerConfig) {
    super({
      ...config,
      workerType: 'ai.assistant'
    });
    
    this.contextWindow = new ContextWindow(config.aiConfig?.maxTokens || 128000);
    this.memoryStore = new VectorStore();
    this.rateLimiter = new RateLimiter();
    this.costTracker = new CostTracker();
  }
  
  async initialize(): Promise<void> {
    this.log('info', 'Initializing AI worker');
    
    // Initialize providers
    await this.initializeProviders();
    
    // Load API keys
    await this.loadAPIKeys();
    
    // Set up context window
    await this.setupContextWindow();
  }
  
  /**
   * Process task with AI
   */
  async processTask(task: AITask): Promise<AIResponse> {
    // Check rate limits
    const rateCheck = await this.rateLimiter.check(this.selectActiveKey());
    if (!rateCheck.allowed) {
      throw new Error('Rate limit exceeded');
    }
    
    // Prepare context
    const context = await this.prepareContext(task);
    
    // Select best provider
    const provider = this.selectProvider(task.preferredProvider);
    
    // Execute with retries
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.executeWithProvider(provider, context, task);
        
        // Track costs
        await this.costTracker.record(response.usage);
        
        // Update context
        await this.updateContext(task, response);
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Try next provider on failure
        provider = this.selectFallbackProvider();
      }
    }
    
    throw lastError;
  }
  
  /**
   * Execute tool on behalf of AI
   */
  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.getTool(toolCall.name);
    
    if (!tool) {
      return { success: false, error: 'Tool not found' };
    }
    
    try {
      // Validate parameters
      const params = this.validateParams(toolCall.args, tool.inputSchema);
      
      // Execute with timeout
      const result = await this.executeWithTimeout(
        () => tool.handler(params),
        this.config.timeout || 30000
      );
      
      return { success: true, result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
  
  /**
   * Manage memory
   */
  async storeMemory(memory: AIMemory): Promise<void> {
    const embedding = await this.createEmbedding(memory.content);
    
    await this.memoryStore.store({
      id: memory.id,
      content: memory.content,
      embedding,
      metadata: memory.metadata
    });
  }
  
  async retrieveMemories(query: string, limit: number = 10): Promise<AIMemory[]> {
    const queryEmbedding = await this.createEmbedding(query);
    const results = await this.memoryStore.search(queryEmbedding, limit);
    
    return results.map(r => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata
    }));
  }
  
  /**
   * Cost optimization
   */
  async optimizeCosts(): Promise<CostOptimization> {
    const currentSpend = await this.costTracker.getCurrentSpend();
    const allocations = await this.getAllocations();
    
    // Generate optimization recommendations
    const recommendations = await this.aiPlanner.optimizeCosts(
      currentSpend,
      allocations
    );
    
    // Apply if savings > threshold
    if (recommendations.savings > 100) {
      await this.applyOptimizations(recommendations);
    }
    
    return recommendations;
  }
  
  // Private methods
  private async initializeProviders(): Promise<void> {
    // Initialize OpenAI
    this.providers.set('openai', new OpenAIProvider());
    
    // Initialize Anthropic
    this.providers.set('anthropic', new AnthropicProvider());
    
    // Initialize Ollama for local
    this.providers.set('ollama', new OllamaProvider());
  }
  
  private selectProvider(preferred?: AIProviderType): AIProvider {
    if (preferred && this.providers.has(preferred)) {
      return this.providers.get(preferred)!;
    }
    
    // Select based on availability and cost
    for (const [type, provider] of this.providers) {
      if (this.isProviderAvailable(type)) {
        return provider;
      }
    }
    
    throw new Error('No AI provider available');
  }
  
  private async prepareContext(task: AITask): Promise<AIContext> {
    // Get relevant memories
    const memories = await this.retrieveMemories(task.prompt, 5);
    
    // Get system prompt
    const systemPrompt = await this.getSystemPrompt(task.type);
    
    // Build context
    return {
      system: systemPrompt,
      memories,
      task: task.prompt,
      tools: this.getAvailableTools(task.type),
      maxTokens: this.contextWindow.getRemaining()
    };
  }
  
  async healthCheck(): Promise<HealthStatus> {
    const providerHealth = await Promise.all(
      Array.from(this.providers.entries()).map(
        async ([type, provider]) => ({
          name: type,
          status: await this.checkProviderHealth(provider) ? 'pass' : 'fail',
          lastCheck: new Date().toISOString()
        })
      )
    );
    
    const activeTasks = this.activeTasks.size;
    const healthy = providerHealth.some(p => p.status === 'pass') && activeTasks < 100;
    
    return {
      healthy,
      checks: providerHealth,
      score: healthy ? 90 : 30
    };
  }
}

/**
 * AI Provider Interface
 */
interface AIProvider {
  complete(prompt: string, options: CompletionOptions): Promise<AIResponse>;
  stream(prompt: string, options: CompletionOptions): AsyncGenerator<AIStreamChunk>;
  embed(text: string): Promise<number[]>;
  isAvailable(): boolean;
  getCostPerToken(): CostRates;
}

/**
 * Tool execution
 */
interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

interface ToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

/**
 * Tool definition
 */
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (params: unknown) => Promise<unknown>;
  uiComponent?: string;
}
```

### 3.2 Autonomous Task Execution

```typescript
// sdk/src/workers/autonomous-tasks.ts

/**
 * Autonomous task execution engine
 */
export class AutonomousTaskEngine {
  private workers: Map<string, AIServiceWorker> = new Map();
  private taskQueue: PriorityQueue<Task>;
  private executionHistory: ExecutionHistory;
  
  /**
   * Submit task for autonomous execution
   */
  async submitTask(task: Task): Promise<TaskId> {
    // Prioritize based on urgency and importance
    const priority = this.calculatePriority(task);
    
    // Add to queue
    const taskId = await this.taskQueue.enqueue(task, priority);
    
    // Notify available workers
    await this.notifyWorkers(task);
    
    return taskId;
  }
  
  /**
   * Execute task with AI guidance
   */
  private async executeAutonomous(task: Task): Promise<TaskResult> {
    const worker = await this.selectWorker(task);
    
    // Create execution context
    const context = await this.createExecutionContext(task);
    
    // Execute with AI planning
    let attempts = 0;
    const maxAttempts = task.maxAttempts || 3;
    
    while (attempts < maxAttempts) {
      try {
        // Get AI plan
        const plan = await worker.getAIPlan(context);
        
        // Execute plan steps
        for (const step of plan.steps) {
          await this.executeStep(worker, step);
          
          // Check for completion
          if (await this.checkCompletion(context)) {
            return { success: true, result: context.result };
          }
        }
        
        // Update context with new learnings
        context.learnings = await this.extractLearnings(plan);
        
        attempts++;
      } catch (error) {
        // Log error and retry
        await this.executionHistory.record(task.id, { error, attempt: attempts });
        attempts++;
      }
    }
    
    return { success: false, error: 'Max attempts exceeded' };
  }
  
  /**
   * Self-healing: recover from failures
   */
  async recoverFromFailure(taskId: string, error: Error): Promise<void> {
    const task = await this.taskQueue.get(taskId);
    const history = await this.executionHistory.get(taskId);
    
    // Analyze failure
    const analysis = await this.analyzeFailure(error, history);
    
    // Get recovery plan from AI
    const recoveryPlan = await this.getRecoveryPlan(analysis);
    
    // Execute recovery
    for (const action of recoveryPlan.actions) {
      await this.executeRecoveryAction(action);
    }
  }
  
  /**
   * Continuously learn and improve
   */
  private async learn(): Promise<void> {
    // Analyze recent executions
    const recentExecutions = await this.executionHistory.getRecent(100);
    
    // Extract patterns
    const patterns = await this.extractPatterns(recentExecutions);
    
    // Update strategies
    await this.updateStrategies(patterns);
    
    // Optimize resource allocation
    await this.optimizeResources();
  }
}
```

---

## 4. Worker Communication

### 4.1 Message Bus

```typescript
// sdk/src/workers/message-bus.ts

/**
 * Inter-worker message bus
 */
export class WorkerMessageBus extends EventEmitter {
  private subscriptions: Map<string, Set<MessageHandler>> = new Map();
  private messageQueue: AsyncQueue<WorkerMessage>;
  private deadLetterQueue: DeadLetterQueue;
  
  // Publish
  publish(topic: string, message: WorkerMessage): void {
    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (error) {
          this.handleHandlerError(topic, error);
        }
      }
    }
    
    // Also publish to wildcard subscribers
    const wildcardHandlers = this.subscriptions.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        handler({ ...message, topic });
      }
    }
  }
  
  // Subscribe
  subscribe(topic: string, handler: MessageHandler): Subscription {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    
    this.subscriptions.get(topic)!.add(handler);
    
    return {
      unsubscribe: () => {
        this.subscriptions.get(topic)?.delete(handler);
      }
    };
  }
  
  // Request-response
  async request<T>(
    workerId: string,
    request: WorkerRequest,
    timeout: number = 5000
  ): Promise<T> {
    const correlationId = generateId();
    
    const response = await Promise.race([
      this.waitForResponse<T>(correlationId, workerId),
      this.timeout(timeout, new Error('Request timeout'))
    ]);
    
    return response;
  }
  
  // Broadcast
  async broadcast(message: WorkerMessage, targets?: WorkerType[]): Promise<void> {
    if (targets) {
      for (const target of targets) {
        await this.sendToType(message, target);
      }
    } else {
      // Broadcast to all
      this.publish('broadcast', message);
    }
  }
}

/**
 * Message types
 */
interface WorkerMessage {
  id: string;
  from: WorkerId;
  to: WorkerId | '*';
  type: MessageType;
  topic: string;
  payload: unknown;
  priority: 'high' | 'normal' | 'low';
  ttl: number;
  correlationId?: string;
  timestamp: Timestamp;
}

type MessageType = 
  | 'task'
  | 'result'
  | 'error'
  | 'health'
  | 'metric'
  | 'event'
  | 'control';
```

---

## 5. Background Service Workers

### 5.1 Online/Offline Detection

```typescript
// sdk/src/workers/background-service.ts

/**
 * Background service worker for browser environments
 */
export class BackgroundServiceWorker {
  private registration?: ServiceWorkerRegistration;
  private syncQueue: BackgroundSyncQueue;
  private pushManager?: PushManager;
  
  /**
   * Register as service worker
   */
  async register(): Promise<void> {
    if ('serviceWorker' in navigator) {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      // Set up periodic sync
      if ('periodicSync' in this.registration) {
        await this.setupPeriodicSync();
      }
      
      // Set up push notifications
      await this.setupPushNotifications();
    }
  }
  
  /**
   * Background sync
   */
  async setupBackgroundSync(): Promise<void> {
    // Queue failed requests
    await this.syncQueue.initialize();
    
    // Register for sync event
    this.registration?.addEventListener('sync', (event) => {
      if (event.tag.startsWith('vivim-')) {
        this.handleBackgroundSync(event.tag);
      }
    });
  }
  
  /**
   * Handle background sync
   */
  private async handleBackgroundSync(tag: string): Promise<void> {
    const action = tag.replace('vivim-', '');
    
    switch (action) {
      case 'sync-messages':
        await this.syncPendingMessages();
        break;
      case 'sync-social-graph':
        await this.syncSocialGraph();
        break;
      case 'upload-content':
        await this.uploadPendingContent();
        break;
      case 'refresh-feed':
        await this.refreshFeed();
        break;
    }
  }
  
  /**
   * Periodic tasks
   */
  private async setupPeriodicSync(): Promise<void> {
    const periodicSync = this.registration!.periodicSync as PeriodicSyncManager;
    
    await periodicSync.register('vivim-feed-refresh', {
      minInterval: 15 * 60 * 1000 // 15 minutes
    });
    
    periodicSync.addEventListener('periodicsync', (event) => {
      if (event.tag === 'vivim-feed-refresh') {
        this.refreshFeed();
      }
    });
  }
}

/**
 * Sync queue for offline support
 */
class BackgroundSyncQueue {
  private db: IDBDatabase;
  private maxRetries = 3;
  
  async enqueue(request: PendingRequest): Promise<void> {
    const tx = this.db.transaction('queue', 'readwrite');
    await tx.objectStore('queue').add({
      ...request,
      timestamp: Date.now(),
      retries: 0
    });
  }
  
  async processQueue(): Promise<void> {
    const tx = this.db.transaction('queue', 'readwrite');
    const store = tx.objectStore('queue');
    const requests = await store.getAll();
    
    for (const request of requests) {
      try {
        await this.retryRequest(request);
        await store.delete(request.id);
      } catch (error) {
        if (request.retries >= this.maxRetries) {
          await this.moveToDeadLetter(request);
        } else {
          await store.put({
            ...request,
            retries: request.retries + 1
          });
        }
      }
    }
  }
}
```

---

## 6. Worker Metrics & Monitoring

### 6.1 Metrics Collection

```typescript
// sdk/src/workers/metrics.ts

/**
 * Worker metrics collection
 */
export class WorkerMetricsCollector {
  private metrics: Map<string, WorkerMetrics> = new Map();
  private alerts: Alert[] = [];
  
  // Collect from all workers
  async collect(): Promise<SystemMetrics> {
    const workerMetrics = Array.from(this.metrics.values());
    
    return {
      timestamp: Date.now(),
      totalWorkers: workerMetrics.length,
      activeWorkers: workerMetrics.filter(m => m.state === 'running').length,
      totalMessages: workerMetrics.reduce((sum, m) => sum + m.messagesProcessed, 0),
      totalErrors: workerMetrics.reduce((sum, m) => sum + m.errors, 0),
      avgLatency: this.calculateAverage(workerMetrics, 'avgLatency'),
      alerts: this.alerts
    };
  }
  
  // Check for alerts
  async checkAlerts(metrics: SystemMetrics): Promise<void> {
    // High error rate
    if (metrics.totalErrors / metrics.totalMessages > 0.1) {
      this.alerts.push({
        level: 'error',
        message: 'High error rate detected',
        source: 'metrics-collector'
      });
    }
    
    // Worker failures
    const failedWorkers = metrics.totalWorkers - metrics.activeWorkers;
    if (failedWorkers > metrics.totalWorkers * 0.2) {
      this.alerts.push({
        level: 'warning',
        message: `${failedWorkers} workers failed`,
        source: 'metrics-collector'
      });
    }
  }
}

/**
 * Dashboards for monitoring
 */
export interface MonitoringDashboard {
  // Worker status
  workerStatus: WorkerStatusDisplay[];
  
  // Resource usage
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  
  // AI costs
  dailySpend: number;
  monthlySpend: number;
  tokensUsed: number;
  
  // Alerts
  activeAlerts: Alert[];
  recentIncidents: Incident[];
}
```

---

## 7. Implementation Files

### 7.1 Index Export

```typescript
// sdk/src/workers/index.ts

export { BaseWorker } from './base-worker.js';
export type { 
  WorkerConfig, 
  WorkerType, 
  WorkerState, 
  WorkerMetrics, 
  HealthStatus,
  HealthCheck,
  RetryPolicy,
  WorkerEnvironment
} from './base { WorkerRunner } from './worker-runner.js';
export-worker.js';

export { WorkerOrchestrator } from './worker-runner.js';

export { AIServiceWorker } from './ai-worker.js';
export type { 
  AIProvider,
  ToolCall,
  ToolResult,
  ToolDefinition 
} from './ai-worker.js';

export { AutonomousTaskEngine } from './autonomous-tasks.js';

export { WorkerMessageBus } from './message-bus.js';
export type { WorkerMessage, MessageType } from './message-bus.js';

export { BackgroundServiceWorker } from './background-service.js';

export { WorkerMetricsCollector } from './metrics.js';
export type { MonitoringDashboard } from './metrics.js';
```

---

## 8. Integration with Transport Layer

The workers integrate with the social transport layer through the message bus:

```typescript
// Example: Social worker using transport
class SocialWorker extends BaseWorker {
  private transport: SocialTransport;
  private messageBus: WorkerMessageBus;
  
  async initialize(): Promise<void> {
    // Subscribe to transport events
    this.transport.on('message', (msg) => {
      this.messageBus.publish('social.message', {
        type: 'message',
        payload: msg
      });
    });
    
    // Subscribe to other workers
    this.messageBus.subscribe('ai.completion', (msg) => {
      this.handleAICompletion(msg.payload);
    });
  }
  
  async start(): Promise<void> {
    // Begin processing messages
    this.messageBus.subscribe('social.message', async (msg) => {
      await this.processSocialMessage(msg);
    });
  }
}
```

---

## 9. API Key Management

```typescript
// sdk/src/workers/api-key-manager.ts

/**
 * Manages API keys for AI workers
 */
export class APIKeyManager {
  private keys: Map<string, EncryptedAPIKey> = new Map();
  private keyring: Keyring;
  
  // Create new key
  async createKey(config: KeyConfig): Promise<APIKey> {
    // Generate key
    const key = await this.generateKey(config.provider);
    
    // Encrypt and store
    const encrypted = await this.encrypt(key);
    this.keys.set(key.id, encrypted);
    
    // Set up rate limiting
    await this.rateLimiter.setLimit(key.id, config.limits);
    
    // Set up budget
    if (config.budget) {
      await this.budgetManager.set(key.id, config.budget);
    }
    
    return key;
  }
  
  // Rotate key
  async rotateKey(keyId: string): Promise<APIKey> {
    const oldKey = await this.getKey(keyId);
    const newKey = await this.createKey({
      provider: oldKey.provider,
      limits: oldKey.limits
    });
    
    // Migrate usage
    await this.migrateUsage(oldKey.id, newKey.id);
    
    // Revoke old
    await this.revokeKey(oldKey.id, 'Rotated');
    
    return newKey;
  }
  
  // Get best available key
  async getBestKey(task: Task): Promise<APIKey> {
    const available = await this.getAvailableKeys();
    
    // Filter by capability
    const capable = available.filter(k => 
      this.hasCapability(k, task.requiredCapability)
    );
    
    // Sort by cost and availability
    return this.sortByCost(capable)[0];
  }
}
```

---

*Document Version: 1.0.0*
*Status: Implementation Ready*
*Worker Framework Complete - Ready for Implementation*

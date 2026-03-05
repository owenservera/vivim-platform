# VIVIM — Context Engine · Memory Layer · ACU System
## Deep Architecture Extraction — Complete Audit

**Generated:** 2026-03-05  
**Auditor:** Qwen Code  
**Purpose:** Full documentation for production-ready SOTA redesign

---

## SECTION A — THE DYNAMIC CONTEXT ENGINE

### A1 — System Overview

**What is the Context Engine's job in one sentence?**

The Context Engine dynamically assembles, scores, and budgets multi-layer contextual information (identity, preferences, topics, entities, conversations, and retrieved knowledge) into an optimized token-constrained system prompt for AI provider requests.

**Where does it sit in the request lifecycle?**

The Context Engine is invoked **per-message** when a user sends a message to the AI chat. It is triggered by `UnifiedContextService.generateContextForChat()` which is called from the chat message handling pipeline before the AI provider SDK is invoked.

**What is its input?**

```typescript
interface AssemblyParams {
  userId: string;
  conversationId: string;        // Current conversation or 'new-chat'
  userMessage: string;           // The user's message text
  personaId?: string;            // Optional persona override
  deviceId?: string;             // Client device identifier
  providerId?: string;           // AI provider (e.g., 'openai', 'anthropic')
  modelId?: string;              // Model identifier (e.g., 'gpt-4o')
  settings?: Partial<UserContextSettings>;
}
```

**What is its output?**

```typescript
interface AssembledContext {
  systemPrompt: string;          // Final compiled system prompt with all context
  budget: ComputedBudget;        // Token budget breakdown per layer
  bundlesUsed: BundleType[];     // Which bundle types were included
  metadata: {
    assemblyTimeMs: number;
    detectedTopics: number;
    detectedEntities: number;
    cacheHitRate: number;
    bundlesInfo?: Array<{ id, type, title, tokenCount, snippet }>;
    conversationStats?: { messageCount, totalTokens, hasConversation };
  };
}
```

**Who calls it?**

The call chain is:
1. `UnifiedContextService.generateContextForChat()` (entry point)
2. → `DynamicContextAssembler.assemble()` (new engine) OR `oldContextGenerator.getContextForChat()` (fallback)
3. → `ParallelContextPipeline.assembleParallel()` or `assembleStreaming()` (optional parallel mode)

**What happens if it fails?**

The `UnifiedContextService` has explicit fallback logic:
- If `enableNewContextEngine` is true but `DynamicContextAssembler` throws, it falls back to `oldContextGenerator.js`
- If `fallbackOnError` is false, the error propagates up
- Individual layer failures are handled gracefully via `Promise.allSettled()` — partial context is assembled

---

### A2 — The Layer Architecture (L0–L7)

The `ContextVisualizer` component defines 8 layers. Here is the complete breakdown:

---

#### Layer: L0_identity

**Display Name:** Identity Core

**Purpose:** Core biographical facts about the user — their role, profession, background, skills, values, personality traits. This is the highest-priority context that defines "who the AI is talking to."

**Data Source:** 
- `Memory` table where `category IN ('biography', 'identity', 'role')` AND `importance >= 0.8`
- Compiled into `ContextBundle` table with `bundleType = 'identity_core'`

**Token Budget Allocation:**
```typescript
{
  minTokens: 100,
  idealTokens: 300,
  maxTokens: 500,
  priority: 100,
  elasticity: 0.3  // Low elasticity — identity is critical
}
```

**Priority:** 100 (highest) — never truncated unless budget is critically exceeded

**Assembly Logic:** `BundleCompiler.compileIdentityCore()` — retrieves top 15 core memories ordered by importance

**Implementation File:** `server/src/context/bundle-compiler.ts` lines 68-85

**Implementation Status:** 🟢 IMPLEMENTED

**Known Issues:** 
- Hardcoded memory limit (15) doesn't account for variable memory lengths
- No deduplication of similar identity memories

---

#### Layer: L1_global_prefs

**Display Name:** Global Preferences

**Purpose:** User's communication preferences, response guidelines, and global instructions that should apply to all AI interactions.

**Data Source:**
- `CustomInstruction` table where `scope = 'global'`
- `Memory` table where `category = 'preference'` AND `importance >= 0.6`
- Compiled into `ContextBundle` table with `bundleType = 'global_prefs'`

**Token Budget Allocation:**
```typescript
{
  minTokens: 100,
  idealTokens: 200,
  maxTokens: 400,
  priority: 95,
  elasticity: 0.4
}
```

**Priority:** 95 — second only to identity

**Assembly Logic:** `BundleCompiler.compileGlobalPrefs()` — retrieves instructions and preference memories

**Implementation File:** `server/src/context/bundle-compiler.ts` lines 87-112

**Implementation Status:** 🟢 IMPLEMENTED

**Known Issues:**
- Instructions and memories are concatenated without clear separation markers
- No user-facing way to reorder or prioritize specific preferences

---

#### Layer: L2_topic

**Display Name:** Topic Context

**Purpose:** Domain-specific knowledge about the current conversation topic — user's proficiency level, engagement history, related memories, and key knowledge points (ACUs).

**Data Source:**
- `TopicProfile` table (user's topic model)
- `Memory` table linked via `relatedMemoryIds`
- `AtomicChatUnit` table (semantic search)
- `CustomInstruction` table where `scope = 'topic'`
- Compiled into `ContextBundle` table with `bundleType = 'topic'`

**Token Budget Allocation:**
```typescript
{
  minTokens: 500,
  idealTokens: 1500,
  maxTokens: 3000,
  priority: 80,
  elasticity: 0.6  // Medium-high elasticity
}
```

**Priority:** 80 — important but can be reduced for budget

**Assembly Logic:** `BundleCompiler.compileTopicContext()` — compiles topic profile with related memories and ACUs

**Implementation File:** `server/src/context/bundle-compiler.ts` lines 114-178

**Implementation Status:** 🟢 IMPLEMENTED

**Known Issues:**
- Only the primary (highest confidence) topic is compiled; secondary topics are fetched but not always used
- Topic detection relies on pgvector semantic search which may fail silently with fallback

---

#### Layer: L3_entity

**Display Name:** Entity Context

**Purpose:** Information about specific entities (people, projects, tools, concepts) mentioned in the conversation.

**Data Source:**
- `EntityProfile` table
- `AtomicChatUnit` table (semantic search for entity-related ACUs)
- Compiled into `ContextBundle` table with `bundleType = 'entity'`

**Token Budget Allocation:**
```typescript
{
  minTokens: 200,
  idealTokens: 500,
  maxTokens: 1500,
  priority: 70,
  elasticity: 0.7
}
```

**Priority:** 70 — can be significantly reduced

**Assembly Logic:** `BundleCompiler.compileEntityContext()` — retrieves entity facts and related ACUs

**Implementation File:** `server/src/context/bundle-compiler.ts` lines 180-218

**Implementation Status:** 🟢 IMPLEMENTED

**Known Issues:**
- Entity-ACU semantic search uses a hardcoded similarity of 0.5 (not actual vector comparison)
- No handling for entity aliases beyond what's stored in the profile

---

#### Layer: L4_conversation

**Display Name:** Conversation Arc

**Purpose:** The current conversation's history, arc, unresolved questions, decisions made, and current focus.

**Data Source:**
- `Conversation` table
- `Message` table (all messages in conversation)
- `TopicConversation` table (topics linked to conversation)
- LLM-generated conversation arc via `BundleCompiler.generateConversationArc()`
- Compiled into `ContextBundle` table with `bundleType = 'conversation'`

**Token Budget Allocation:**
```typescript
{
  minTokens: 500,
  idealTokens: 2000,
  maxTokens: 8000,
  priority: 85,
  elasticity: 0.5  // Medium elasticity
}
```

**Priority:** 85 — high priority for continuing conversations

**Assembly Logic:** `BundleCompiler.compileConversationContext()` — generates conversation arc summary

**Implementation File:** `server/src/context/bundle-compiler.ts` lines 220-275

**Implementation Status:** 🟢 IMPLEMENTED

**Known Issues:**
- Conversation arc generation uses `gpt-4o-mini` hardcoded — not configurable
- For long conversations (>6 messages), an LLM call is required which adds latency
- Fallback arc is very basic ("Conversation about: {title}")

---

#### Layer: L5_jit

**Display Name:** JIT (Just-In-Time) Retrieval

**Purpose:** Dynamically retrieved knowledge (ACUs and memories) relevant to the current message via semantic search.

**Data Source:**
- `AtomicChatUnit` table (semantic search via pgvector)
- `Memory` table (semantic search via pgvector)
- NOT pre-compiled — retrieved fresh on each request

**Token Budget Allocation:**
```typescript
{
  minTokens: 300,
  idealTokens: 1000,
  maxTokens: 2000,
  priority: 75,
  elasticity: 0.8  // High elasticity
}
```

**Priority:** 75 — important but highly elastic

**Assembly Logic:** `HybridRetrievalService.retrieve()` — performs hybrid semantic + keyword search

**Implementation File:** `server/src/context/hybrid-retrieval.ts` lines 27-67

**Implementation Status:** 🟢 IMPLEMENTED

**Known Issues:**
- Keyword search uses SQL LIKE which is slow on large datasets
- Reciprocal Rank Fusion (RRF) parameters are hardcoded (k=60)
- No caching of JIT retrieval results

---

#### Layer: L6_message_history

**Display Name:** Message History

**Purpose:** Raw message history from the current conversation that doesn't fit in the L4 conversation arc.

**Data Source:**
- `Message` table (raw message parts)
- NOT pre-compiled — assembled on-the-fly

**Token Budget Allocation:**
```typescript
{
  minTokens: 1000,
  idealTokens: 4000,
  maxTokens: 8000,
  priority: 90,
  elasticity: 0.4
}
```

**Priority:** 90 — high priority for context continuity

**Assembly Logic:** Handled in `DynamicContextAssembler.compilePrompt()` — messages are added after bundles

**Implementation File:** `server/src/context/context-assembler.ts` lines 295-330

**Implementation Status:** 🟡 PARTIAL

**Known Issues:**
- No explicit message windowing strategy (sliding window, summarization, etc.)
- Messages are simply concatenated without intelligent compression
- The layer is referenced in the UI but assembly logic is implicit

---

#### Layer: L7_user_message

**Display Name:** User Message

**Purpose:** The current user message being sent to the AI.

**Data Source:**
- Directly from `AssemblyParams.userMessage`

**Token Budget Allocation:**
```typescript
{
  minTokens: 50,
  idealTokens: 200,
  maxTokens: 500,
  priority: 100,
  elasticity: 0.0  // Zero elasticity — user message is always included
}
```

**Priority:** 100 — never truncated

**Assembly Logic:** Simple token estimation in `DynamicContextAssembler.computeBudget()`

**Implementation File:** `server/src/context/context-assembler.ts` lines 260-293

**Implementation Status:** 🟢 IMPLEMENTED

**Known Issues:**
- Token estimation uses simple character division (`length / 4`) which is inaccurate for some languages

---

### A3 — The Assembly Pipeline (Step-by-Step Trace)

Here is the complete execution path for a single context assembly request:

---

#### Step 1: UnifiedContextService.generateContextForChat()

**Function/Method:** `generateContextForChat(conversationId, options)`

**File:** `server/src/services/unified-context-service.ts` lines 76-156

**Input:**
```typescript
{
  conversationId: string,
  options: {
    userId?: string,
    userMessage?: string,
    personaId?: string,
    deviceId?: string,
    providerId?: string,
    modelId?: string
  }
}
```

**Output:**
```typescript
{
  systemPrompt: string,
  layers: any,
  stats: any,
  engineUsed: 'new' | 'old'
}
```

**What it does:**
1. Determines userId (from options or by looking up conversation owner)
2. Fetches user's context settings from `UserContextSettings` table
3. Calls `DynamicContextAssembler.assemble()` with assembly params
4. On error, falls back to `oldContextGenerator.getContextForChat()`
5. Records telemetry via `getContextTelemetry().record()`

**Async:** Yes — awaits DB lookups, assembly, and telemetry

**Can it fail:** Yes — catches errors from dynamic assembler and either falls back or re-throws

**Side effects:** 
- DB read: `Conversation` table for userId
- DB read: `UserContextSettings` table
- Telemetry write (in-memory)

---

#### Step 2: DynamicContextAssembler.assemble()

**Function/Method:** `assemble(params: AssemblyParams)`

**File:** `server/src/context/context-assembler.ts` lines 53-130

**Input:** `AssemblyParams` (see A1)

**Output:** `AssembledContext`

**What it does:**
1. Checks cache for pre-assembled context (5-minute TTL)
2. Fetches conversation stats if conversationId provided
3. Embeds user message via `embeddingService.embed()`
4. Detects message context (topics, entities) via `detectMessageContext()`
5. Gathers bundles in parallel via `gatherBundles()`
6. Performs JIT retrieval via `justInTimeRetrieval()`
7. Computes token budget via `computeBudget()`
8. Compiles final prompt via `compilePrompt()`
9. Caches result and returns

**Async:** Yes — multiple awaits for embedding, DB queries, bundle compilation

**Can it fail:** Yes — embedding or DB failures are caught and handled with fallbacks

**Side effects:**
- Cache read/write
- DB reads: `Conversation`, `TopicProfile`, `EntityProfile`, `ContextBundle`, `AtomicChatUnit`, `Memory`
- DB writes: `ContextBundle` (usage tracking via `trackUsage()`)

---

#### Step 3: detectMessageContext()

**Function/Method:** `detectMessageContext(userId, message, embedding, conversationId)`

**File:** `server/src/context/context-assembler.ts` lines 132-208

**Input:**
- `userId: string`
- `message: string`
- `embedding: number[]` (the embedded user message)
- `conversationId: string`

**Output:**
```typescript
DetectedContext {
  topics: DetectedTopic[],
  entities: DetectedEntity[],
  isNewTopic: boolean,
  isContinuation: boolean
}
```

**What it does:**
1. **Topic semantic search:** Raw SQL query against `topic_profiles` table using pgvector `<=>` operator, returns top 3 matches with similarity > 0.35
2. **Entity semantic search:** Raw SQL query against `entity_profiles` table using pgvector, returns top 5 matches with similarity > 0.4
3. **Explicit entity mention detection:** Fetches all entities and checks if name/aliases appear in message text
4. **Merges entity matches:** Explicit mentions override semantic matches with confidence 1.0
5. **Conversation topic lookup:** Fetches topics linked to conversation via `TopicConversation` table
6. Returns combined detection result

**Async:** Yes — awaits multiple DB queries

**Can it fail:** Yes — semantic search has try/catch with fallback to non-vector queries

**Side effects:** DB reads only

---

#### Step 4: gatherBundles()

**Function/Method:** `gatherBundles(userId, context, conversationId, personaId)`

**File:** `server/src/context/context-assembler.ts` lines 235-293

**Input:**
- `userId: string`
- `context: DetectedContext`
- `conversationId: string`
- `personaId?: string`

**Output:** `CompiledBundle[]`

**What it does:**
1. Creates parallel fetch tasks for each layer:
   - L0: `compileIdentityCore(userId)` — always fetched
   - L1: `compileGlobalPrefs(userId)` — always fetched
   - L2: Primary topic bundle (highest confidence topic)
   - L2: Secondary topic bundle (if exists, cache-only)
   - L3: Entity bundles (up to 2 entities)
   - L4: Conversation bundle (if continuing conversation)
   - L5: Persona bundle (if personaId provided)
2. Executes all tasks via `Promise.all()`
3. Filters out null results

**Async:** Yes — parallel bundle fetching

**Can it fail:** Individual bundle fetch failures are caught and return null

**Side effects:**
- Cache reads for each bundle
- DB reads: `ContextBundle` table
- DB writes: Bundle compilation if not cached (via `BundleCompiler`)

---

#### Step 5: justInTimeRetrieval()

**Function/Method:** `justInTimeRetrieval(userId, message, embedding, context)`

**File:** `server/src/context/context-assembler.ts` lines 295-320

**Input:**
- `userId: string`
- `message: string`
- `embedding: number[]`
- `context: DetectedContext`

**Output:**
```typescript
JITKnowledge {
  acus: Array<{ id, content, type, category, createdAt, similarity }>,
  memories: Array<{ id, content, category, importance, similarity }>
}
```

**What it does:**
1. Extracts topic slugs from detected context
2. Calls `HybridRetrievalService.retrieve()` with user message and embedding
3. Returns ACUs and memories with similarity scores

**Async:** Yes — awaits hybrid retrieval

**Can it fail:** Yes — returns empty arrays on error

**Side effects:** DB reads via hybrid retrieval

---

#### Step 6: computeBudget()

**Function/Method:** `computeBudget(bundles, jit, params, conversationStats, detectedContext)`

**File:** `server/src/context/context-assembler.ts` lines 322-365

**Input:**
- `bundles: CompiledBundle[]`
- `jit: JITKnowledge`
- `params: AssemblyParams`
- `conversationStats: { messageCount, totalTokens, hasConversation }`
- `detectedContext: DetectedContext`

**Output:**
```typescript
ComputedBudget {
  layers: Record<string, LayerBudget>,
  totalUsed: number,
  totalAvailable: number
}
```

**What it does:**
1. Gets `totalAvailable` from user settings (default 12000)
2. Bounds to model's safe max if provider/model known (95% of model context)
3. Builds `BudgetInput` with conversation stats and detected context
4. Creates `BudgetAlgorithm` instance and calls `computeBudget(input)`
5. Sums allocated tokens across layers
6. Returns computed budget

**Async:** No — pure computation

**Can it fail:** No — has safe defaults

**Side effects:** None

---

#### Step 7: compilePrompt()

**Function/Method:** `compilePrompt(bundles, jit, budget)`

**File:** `server/src/context/context-assembler.ts` lines 367-415

**Input:**
- `bundles: CompiledBundle[]`
- `jit: JITKnowledge`
- `budget: ComputedBudget`

**Output:** `string` (the final system prompt)

**What it does:**
1. Creates sections array with priority ordering:
   - identity_core (100)
   - global_prefs (95)
   - conversation (90)
   - topic (80)
   - entity (70)
   - memories (60)
   - ACUs (55)
2. Sorts sections by priority
3. Adds VIVIM identity prompt first
4. Iteratively adds sections until budget is reached
5. Truncates last section if needed to fit budget
6. Joins sections with `---` separator

**Async:** No — pure string manipulation

**Can it fail:** No

**Side effects:** None

---

### A4 — Token Budget Management

**Token Counting Mechanism:**

The system uses a simple character-based estimation:
```typescript
estimateTokens: (text: string) => Math.ceil(text.length / 4)
```

This is implemented in `DynamicContextAssembler` via the `ITokenEstimator` interface.

**Where Token Counting is Performed:** Server-side only (in `DynamicContextAssembler` and `BundleCompiler`)

**How Total Budget is Determined:**

1. User setting: `UserContextSettings.maxContextTokens` (default 12000)
2. Bounded by model capability: `modelInfo.context * 0.95` (5% buffer)
3. Final budget = min(user setting, model safe max)

**LayerBudget Type:**

```typescript
interface LayerBudget {
  layer: string;           // Layer identifier (e.g., 'L0_identity')
  minTokens: number;       // Hard floor — below this, don't include
  idealTokens: number;     // Target allocation
  maxTokens: number;       // Hard ceiling — never exceed
  priority: number;        // 0-100, for allocation conflicts
  allocated: number;       // Final allocation after algorithm
  elasticity: number;      // 0-1, willingness to shrink
}
```

**Truncation Strategy:**

When budget is exceeded:
1. Sections are sorted by priority (highest first)
2. Sections are added until adding the next would exceed budget
3. The last section is truncated to fit remaining tokens
4. JIT knowledge (memories/ACUs) is dropped first if budget is tight

**Which Layers Get Cut First:**
1. L5_jit (priority 75) — JIT retrieval
2. L3_entity (priority 70) — Entity context
3. L2_topic (priority 80) — Topic context (secondary topics first)

**Is Content Truncated or Layer Dropped:** Content is truncated within a layer (with `[truncated]` marker), not entire layers dropped.

**User Notification:** The `ContextVisualizer` component shows token allocation per layer but doesn't explicitly indicate truncation.

**ContextMetadata Type:**

```typescript
interface ContextMetadata {
  detectedTopics?: DetectedItem[];
  detectedEntities?: DetectedItem[];
  memories?: Array<{ id: string; content: string; category: string; importance: number }>;
  acus?: Array<{ id: string; content: string; category: string; similarity: number }>;
  cacheHitRate?: number;
  assemblyTimeMs?: number;
  conversationStats?: {
    messageCount: number;
    totalTokens: number;
    hasConversation: boolean;
  };
}
```

**contextAllocation Record Shape:**

```typescript
Record<string, LayerBudget>
// Example:
{
  L0_identity: { layer: 'L0_identity', minTokens: 100, maxTokens: 500, priority: 100, allocated: 312 },
  L1_global_prefs: { layer: 'L1_global_prefs', minTokens: 100, maxTokens: 400, priority: 95, allocated: 187 },
  // ... etc
}
```

---

### A5 — Context Recipes

**What is a Context Recipe?**

⚠️ INFERRED: Context Recipes are referenced in the UI (`/settings/ai` page links to "Configure Context Recipes") but the actual type definition is NOT found in the codebase. Based on the context system design, a Context Recipe would likely be:

```typescript
// INFERRED TYPE — NOT FOUND IN CODE
interface ContextRecipe {
  id: string;
  name: string;
  layerWeights: Record<string, number>;  // Override priority per layer
  excludedLayers: string[];               // Layers to skip
  customBudget?: number;                  // Override total budget
  isDefault: boolean;
  userId?: string;                        // null = global default
}
```

**Where Recipes are Stored:** ❌ NOT FOUND — No database model or storage mechanism found for recipes.

**How Recipes Modify Pipeline:** ❌ NOT IMPLEMENTED — The pipeline does not currently read or apply recipes.

**Default Recipes:** ❌ NOT FOUND

**API for Recipes:** ❌ NOT FOUND

**Scope:** ❌ NOT FOUND

**Implementation Status:** 🔴 STUB — Referenced in UI but not implemented in backend.

---

### A6 — The unified-context-service.ts Deep Dive

**Full Class Structure:**

```typescript
class UnifiedContextService {
  constructor(config: UnifiedContextServiceConfig)
  
  // Public Methods
  generateContextForChat(conversationId, options): Promise<{ systemPrompt, layers, stats, engineUsed }>
  warmupBundles(userId, presence): Promise<void>
  invalidateBundles(userId, eventType, relatedIds): Promise<void>
  triggerLibrarian(conversationId): Promise<void>
  getLibrarianStatus(): { enabled, lastRunTime } | null
  healthCheck(): Promise<{ newEngineAvailable, oldEngineAvailable, stats }>
  
  // Private Methods
  getUserIdForConversation(conversationId): Promise<string | null>
  getUserContextSettings(userId): Promise<any>
  getBundleTypesForEvent(eventType): string[]
}
```

**Method Details:**

---

**generateContextForChat()**

- **Input:** `conversationId: string`, `options: { userId?, userMessage?, personaId?, deviceId?, providerId?, modelId? }`
- **Output:** `{ systemPrompt: string, layers: any, stats: any, engineUsed: 'new' | 'old' }`
- **Logic:**
  1. Resolve userId from options or conversation lookup
  2. Fetch user context settings
  3. If new engine enabled, call `dynamicAssembler.assemble()`
  4. On success: record telemetry, return result
  5. On error: fallback to old generator if configured
- **Side effects:** Telemetry recording, DB reads

---

**invalidateBundles()**

- **Input:** `userId: string`, `eventType: string`, `relatedIds: string[]`
- **Output:** `Promise<void>`
- **Logic:**
  1. Maps event type to affected bundle types via `getBundleTypesForEvent()`
  2. For each bundle type, marks matching bundles as `isDirty: true`
  3. Bundle matching uses Prisma `updateMany()` with appropriate where clause
- **Side effects:** DB writes to `ContextBundle` table

**Cache Invalidation Issue (VIVIM-GAP-018):**

The current inline invalidation in `unified-context-service.ts` directly updates `ContextBundle.isDirty` flags. This creates a race condition:

```
Request A: Bundle compiled (clean)
Request B: Memory updated → marks bundle dirty
Request A: Bundle used (now stale, but already compiled)
```

The race window is between bundle compilation and bundle usage. The fix would be to:
1. Add version/timestamp to bundle cache key
2. Check dirty flag before using cached bundle
3. Use optimistic locking on bundle updates

---

**ContextEventBus:**

**EXISTS:** Yes — `server/src/context/context-event-bus.ts`

**Event Types:**
```typescript
type ContextEventType =
  | 'memory:created' | 'memory:updated' | 'memory:deleted'
  | 'acu:created' | 'acu:processed' | 'acu:deleted' | 'acu:batch_processed'
  | 'conversation:message_added' | 'conversation:idle' | 'conversation:archived'
  | 'topic:created' | 'topic:updated' | 'topic:merged'
  | 'entity:created' | 'entity:updated' | 'entity:merged'
  | 'bundle:compiled' | 'bundle:invalidated' | 'bundle:expired'
  | 'instruction:created' | 'instruction:updated' | 'instruction:deleted'
  | 'presence:updated' | 'presence:idle_detected' | 'presence:offline'
  | 'settings:updated'
  | 'telemetry:assembly_complete' | 'telemetry:prediction_scored'
  | 'system:cleanup' | 'system:warmup_requested';
```

**Emitters:** Various services emit events via `eventBus.emit()`

**Listeners:** Default invalidation handlers wired in `wireDefaultInvalidation()` — invalidates cache on memory/ACU/instruction events

---

**InvalidationService:**

**EXISTS:** Yes — `server/src/services/invalidation-service.ts`

**Interface:**
```typescript
class InvalidationService {
  invalidate(event: InvalidationEvent): Promise<void>
  queueInvalidation(event: InvalidationEvent): Promise<void>
  processQueue(): Promise<number>
  cleanupQueue(olderThanHours: number): Promise<number>
  getHealth(): Promise<{ queueLength, dirtyBundles }>
}
```

**Current Status:** 🟡 PARTIAL — Service exists but is not fully integrated with event bus

---

**Circuit Breaker (opossum) Usage:**

❌ NOT FOUND — No opossum circuit breaker usage found in the codebase despite being mentioned in project overview.

---

### A7 — Context Engine Client Side

**ContextCockpit Page (`/context-cockpit`):**

**File:** `pwa/src/pages/ContextCockpitPage.tsx`

**Data Displayed:**
- Layer-by-layer token allocation (8 layers)
- Bundle information (ID, type, token count, snippet)
- Detected topics and entities with confidence scores
- Retrieved memories and ACUs
- Cache hit rate, assembly time, conversation stats
- Telemetry (durations per stage, token efficiency)

**Data Source:**
- URL query params (for demo/debug)
- Real-time from context assembly result (in production)

**Data Flow:**
1. Context assembled server-side
2. Result metadata serialized to JSON
3. Passed to client via URL params or API response
4. `ContextCockpitPage` parses and displays

**Implementation Status:** 🟢 IMPLEMENTED (demo mode with sample data)

---

**ContextVisualizer Component:**

**File:** `pwa/src/components/ContextVisualizer.tsx`

**Full Prop Interface:**
```typescript
interface ContextVisualizerProps {
  contextAllocation: Record<string, LayerBudget> | null;
  totalTokensAvailable: number;
  bundlesInfo?: BundleInfo[];
  onDismissBundle?: (bundleId: string) => void;
  metadata?: ContextMetadata;
}
```

**Rendering Branches:**
1. **Collapsed state:** Shows stacked bar chart with token counts
2. **Expanded state:** Shows grid with per-layer details
3. **XAI Details:** Shows bundle snippets with dismiss buttons
4. **Live Context Data:** Shows detected topics, entities, memories, ACUs

**Layer Expanded State Shows:**
- Layer name and color
- Allocated token count
- Detected items (topics/entities) with confidence
- Retrieved memories/ACUs with category

---

**useContext* Hooks:**

❌ NOT FOUND — No `useContext*` hooks found. Context data is passed via props or fetched directly.

---

**Client-Side Token Counting:**

❌ NOT FOUND — No client-side token counting implementation found. Token estimation is server-side only.

---

### A8 — Known Gaps, Stubs, and Failure Modes (Context Engine)

| Location | Code | Impact | Classification |
|----------|------|--------|----------------|
| `server/src/services/unified-context-service.ts:330` | `// TODO: Move this to InvalidationService once implemented` | Invalidation logic duplicated, not using event bus | MEDIUM |
| `server/src/context/context-assembler.ts:53` | Cache key uses `userMessage.substring(0, 50)` — collisions possible | Cache may return wrong context for similar messages | HIGH |
| `server/src/context/bundle-compiler.ts:245` | `model: 'gpt-4o-mini'` hardcoded | Not configurable, vendor lock-in | MEDIUM |
| `server/src/context/hybrid-retrieval.ts:120` | `similarity: 0.5 + index * 0.02` fallback | Fallback similarity is fake, affects ranking | MEDIUM |
| `server/src/context/types.ts:150` | `CompositeBundle` type referenced but not implemented | Composite bundles not working | LOW |
| `pwa/src/pages/ContextComponents.tsx:45` | `// In a full implementation, this would call PUT...` | Bundle editing is local-only, no persistence | LOW |
| `server/src/context/context-assembler.ts:330` | `qualityOverall: 0.5` hardcoded for memories | Memory importance not properly mapped | MEDIUM |
| `server/src/services/unified-context-service.ts:1` | `// falls back to the old context-generator.js` | Old generator is deprecated tech debt | MEDIUM |
| `server/src/context/context-pipeline.ts:1` | `// Replaces serial processing` — but serial path still exists | Confusing code paths, maintenance burden | LOW |

---

## SECTION B — THE MEMORY LAYER

### B1 — System Overview

**What is "memory" in VIVIM?**

A Memory is a distilled, structured knowledge unit extracted from conversations or explicitly created by the user. Unlike a stored conversation (which is a raw message log), a Memory:
- Is **semantic** — captures meaning, not exact words
- Is **categorized** — has explicit type (episodic, semantic, preference, etc.)
- Has **importance scoring** — ranked by relevance to the user
- Has **embeddings** — enables semantic search
- Can be **consolidated** — merged with similar memories
- Has **lifecycle** — can decay, be archived, or expire

**Lifecycle of a Memory:**

```
[Creation] → [Processing] → [Active] → [Accessed/Used] → [Consolidation] → [Archived/Expired]
     ↓            ↓              ↓           ↓                ↓                  ↓
  Manual     LLM extraction  Semantic    Context         Similarity         TTL or manual
  creation   or ACU conv.   searchable  injection       merging            archive
```

**Entity Diagram:**

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Conversation  │         │      Memory     │         │  AtomicChatUnit │
│─────────────────│         │─────────────────│         │─────────────────│
│ id              │         │ id              │         │ id              │
│ ownerId         │◄────────│ userId          │◄────────│ authorDid       │
│ messages[]      │         │ content         │         │ content         │
│ capturedAt      │         │ memoryType      │         │ type            │
└─────────────────┘         │ category        │         │ category        │
         │                  │ importance      │         │ qualityOverall  │
         │ extraction       │ embedding[]     │         │ embedding[]     │
         ▼                  │ sourceAcuId     │         │ conversationId  │
┌─────────────────┐         │ sourceConvId    │         │ messageId       │
│     Message     │         │ relatedMemoryIds│         │ createdAt       │
│─────────────────│         │ isActive        │         └─────────────────┘
│ id              │         │ isArchived      │                  │
│ conversationId  │         │ createdAt       │                  │ extraction
│ role            │         │ updatedAt       │                  ▼
│ content         │         └─────────────────┘         ┌─────────────────┐
│ messageIndex    │                  ▲                  │      ACU        │
└─────────────────┘                  │                  └─────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │  Memory Relationship│
                          │─────────────────────│
                          │ sourceMemoryId      │
                          │ targetMemoryId      │
                          │ relationshipType    │
                          │ strength            │
                          └─────────────────────┘
```

**Where Does Memory Live?**

- **Server-side:** PostgreSQL with pgvector (`Memory` table)
- **Client-side:** In-memory cache only (no persistent client storage)
- **Sync:** Not synced — server is source of truth

**When is Memory Retrieved?**

Automatically on **every AI request** via the Context Engine's L5_jit layer. The `HybridRetrievalService` performs semantic search for memories relevant to the user's message.

**What Makes VIVIM's Memory Different?**

1. **Semantic search** — pgvector embeddings enable finding memories by meaning, not keywords
2. **Importance scoring** — memories are ranked by importance (0-1)
3. **Type system** — 9 memory types (episodic, semantic, procedural, factual, preference, identity, relationship, goal, project)
4. **Consolidation** — similar memories can be merged automatically
5. **Context integration** — memories are injected into AI context automatically

---

### B2 — The Memory Schema

**Full Prisma Memory Model:**

```prisma
model Memory {
  id                  String    @id @default(uuid())
  userId              String
  did                 String?
  
  // Content
  content             String
  summary             String?
  memoryType          MemoryType
  category            String
  subcategory         String?
  tags                String[]
  
  // Importance & relevance
  importance          Float     @default(0.5)
  relevance           Float     @default(0.5)
  
  // Provenance
  sourceConversationIds String[]
  sourceAcuIds        String[]
  sourceMessageIds    String[]
  occurredAt          DateTime?
  validFrom           DateTime?
  validUntil          DateTime?
  
  // Embedding
  embedding           Float[]   @db.Vector(1536)
  embeddingModel      String?
  embeddingDimension  Int?
  
  // Status
  isActive            Boolean   @default(true)
  isArchived          Boolean   @default(false)
  isPinned            Boolean   @default(false)
  consolidationStatus MemoryConsolidationStatus @default(RAW)
  
  // Relations
  relatedMemoryIds    String[]
  parentMemoryId      String?
  parent              Memory?   @relation("MemoryHierarchy", fields: [parentMemoryId], references: [id])
  children            Memory[]  @relation("MemoryHierarchy")
  
  // Access tracking
  accessCount         Int       @default(0)
  lastAccessedAt      DateTime?
  
  // Metadata
  metadata            Json      @default("{}")
  
  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Indexes
  @@index([userId])
  @@index([memoryType])
  @@index([category])
  @@index([importance])
  @@index([embedding])
  @@map("memories")
}
```

**Field-by-Field Analysis:**

| Field | Data | Populated By | Queried By | Index |
|-------|------|--------------|------------|-------|
| `id` | UUID | Auto-generated | All lookups | Primary |
| `userId` | String | Creation | User-scoped queries | Yes |
| `content` | String | User input or LLM extraction | Search, display | No |
| `summary` | String? | LLM extraction | Context injection | No |
| `memoryType` | MemoryType enum | User or LLM | Type filtering | Yes |
| `category` | String | User or LLM | Category filtering | Yes |
| `importance` | Float (0-1) | User or calculated | Ranking | Yes |
| `relevance` | Float (0-1) | Calculated (decay) | Ranking | No |
| `embedding` | Float[1536] | Embedding service | Semantic search | Yes (pgvector) |
| `sourceAcuIds` | String[] | ACU conversion | Provenance | No |
| `relatedMemoryIds` | String[] | Manual or consolidation | Graph traversal | No |
| `isPinned` | Boolean | User | Pin filtering | No |
| `consolidationStatus` | Enum | Consolidation service | Status filtering | No |

**Embedding Field Details:**

- **Model:** `text-embedding-3-small` (OpenAI) or `glm-4.7-flash` (Z.AI)
- **Dimensions:** 1536
- **Index:** pgvector with `<=>` (cosine distance) operator
- **Distance Metric:** Cosine similarity (`1 - (a <=> b)`)

---

### B3 — Memory Creation Pipeline

**Trigger:** Memory creation can be triggered by:
1. **Explicit user action** — user creates memory directly
2. **ACU conversion** — high-quality ACU auto-converted
3. **Conversation extraction** — LLM extracts memories from conversation
4. **Engagement conversion** — user engagement (like/bookmark) triggers conversion

---

#### Step 1: MemoryService.createMemory()

**Function:** `createMemory(userId, input)`

**File:** `server/src/context/memory/memory-service.ts` lines 68-120

**Input:**
```typescript
CreateMemoryInput {
  content: string,
  summary?: string,
  memoryType?: MemoryTypeEnum,
  category?: string,
  tags?: string[],
  importance?: number,
  sourceConversationIds?: string[],
  sourceAcuIds?: string[],
  // ... etc
}
```

**Output:** `MemoryWithRelations`

**What it does:**
1. Generates embedding via `embeddingService.embed(content)` if service available
2. Sets default category from memory type
3. Creates memory record via Prisma
4. Emits `created` event via event handlers
5. Updates analytics

**Async:** Yes — awaits embedding generation and DB write

**Embedding Generated:** Yes — at this step, synchronously

**DB Write:** INSERT into `Memory` table

---

#### Step 2: MemoryExtractionEngine.extractFromConversation()

**Function:** `extractFromConversation(userId, input)`

**File:** `server/src/context/memory/memory-extraction-engine.ts` lines 37-130

**Input:**
```typescript
MemoryExtractionInput {
  conversationId: string,
  messageRange?: { from: number, to: number },
  priority?: number,
  forceReextract?: boolean
}
```

**Output:** `{ success: boolean, memories?: CreateMemoryInput[], error?: string }`

**What it does:**
1. Fetches conversation with messages
2. Checks if already extracted (unless force)
3. Creates extraction job record
4. Formats conversation for LLM
5. Calls LLM with extraction prompt
6. Parses JSON response
7. Filters by confidence threshold
8. Creates memories via `createMemoryFromExtraction()`
9. Updates job status

**Async:** Yes — LLM call is async

**Embedding Generated:** Yes — in `createMemoryFromExtraction()`

---

#### Step 3: Importance Calculation

**Function:** `calculateImportance(acu)` (in ACU conversion)

**File:** `server/src/services/acu-memory-pipeline.ts` lines 185-205

**What it does:**
1. Base score: 0.5
2. Add quality bonus: `(qualityOverall - 0.5) * 0.3`
3. Add engagement bonus: `min(0.2, engagementCount * 0.05)`
4. Add length bonus: +0.1 if >200 words, +0.1 if >500 words
5. Clamp to [0, 1]

**Topics Extraction:**

Topics are NOT extracted for memories — memories have a `category` field but not explicit topics. Topics are stored in `TopicProfile` table separately.

---

### B4 — Memory Retrieval (Semantic Search)

**Method:** `MemoryRetrievalService.retrieve()`

**File:** `server/src/context/memory/memory-retrieval-service.ts` lines 33-105

**Input Parameters:**
```typescript
{
  userId: string,
  contextMessage: string,
  options: {
    maxTokens?: number,
    minImportance?: number,
    preferredTypes?: MemoryTypeEnum[],
    requiredTypes?: MemoryTypeEnum[],
    excludedTypes?: MemoryTypeEnum[],
    tags?: string[],
    excludeTags?: string[],
    timeRange?: { after?: Date, before?: Date },
    includePinned?: boolean
  }
}
```

**Query Execution:**

1. **Embed query text:** `embeddingService.embed(contextMessage)` — synchronous before search
2. **SQL Query (semantic):**
```sql
SELECT id, content, summary, "memoryType", category, importance, relevance,
       "sourceConversationIds",
       1 - (embedding <=> $1::vector) as similarity
FROM memories
WHERE "userId" = $2
  AND "isActive" = true
  AND embedding IS NOT NULL
  AND array_length(embedding, 1) > 0
ORDER BY embedding <=> $1::vector
LIMIT 50
```
3. **Similarity Threshold:** 0.3 (configurable via `defaultSimilarityThreshold`)
4. **Pre-filter:** userId, isActive, memoryType, tags
5. **Post-filter:** Results filtered by similarity threshold after retrieval

**Output Shape:**
```typescript
{
  content: string,
  memories: Array<{
    id: string,
    content: string,
    summary?: string,
    memoryType: string,
    category: string,
    importance: number,
    relevance: number,
    sourceConversationIds: string[]
  }>,
  totalTokens: number,
  usedTokenBudget: number
}
```

**Caching:** No explicit caching — relies on context cache layer

**Performance:**
- Uses pgvector index (assumed HNSW or IVFFlat — not explicitly configured)
- Sequential scan risk if embedding column not indexed
- No N+1 issues — single query retrieves all data

**Implementation Status:** 🟢 IMPLEMENTED

---

### B5 — Memory Consolidation and Evolution

**Consolidation (Merging Memories):**

**EXISTS:** Yes — `MemoryConsolidationService.mergeMemories()`

**File:** `server/src/context/memory/memory-consolidation-service.ts` lines 45-110

**What it does:**
1. Fetches memories to merge
2. Calls LLM to consolidate content
3. Creates new merged memory
4. Marks source memories as inactive/merged
5. Creates relationships between merged and sources

**Decay:**

**EXISTS:** Yes — `calculateRelevance()` in `memory-types.ts`

**File:** `server/src/context/memory/memory-types.ts` lines 205-225

**Formula:**
```typescript
let relevance = baseRelevance;
const accessBoost = Math.min(0.2, accessCount * 0.02);
relevance += accessBoost;

// Decay for non-access (30-day half-life)
const daysSinceAccess = (now - lastAccessedAt) / (1000 * 60 * 60 * 24);
const decayFactor = Math.pow(0.5, daysSinceAccess / 30);
relevance = relevance * (0.5 + 0.5 * decayFactor);
```

**Promotion:** ❌ NOT FOUND — No explicit promotion mechanism for frequently accessed memories.

**Conflict Resolution:** ❌ NOT FOUND — No contradiction detection or resolution.

---

### B6 — Memory ↔ Context Engine Integration

**Which Context Layer:** L5_jit (Just-In-Time Retrieval)

**Function Call:** `HybridRetrievalService.retrieve()` called from `DynamicContextAssembler.justInTimeRetrieval()`

**File:** `server/src/context/context-assembler.ts` lines 295-320

**How Many Memories:** Up to 10 memories retrieved, filtered by similarity > 0.35

**Formatting:** Memories formatted as:
```
## Additionally Relevant Context
- [category] content
- [category] content
...
```

**Relevance Threshold:** 0.35 similarity minimum

**On Slow/Fail:** Returns empty array — context assembly continues without memories

---

### B7 — Memory Client Side

**memoryEnabled Flag:**

**EXISTS:** Referenced in prompt but NOT FOUND in actual code. The `useAppStore.ai.memoryEnabled` flag is mentioned in the brief but no implementation found.

**Memory Management UI:** ❌ NOT FOUND — No dedicated memory management screen found.

**For You Feed Integration:**

**File:** `pwa/src/pages/ForYou.tsx` — ❌ NOT FOUND (file not in listing)

The feed system references ACUs but memory integration is unclear from available code.

**ContextVisualizer Display:**

Memories are displayed in the "Live Context Data" section under "Retrieved Memories" with category badges and content snippets.

---

### B8 — Known Gaps, Stubs, and Failure Modes (Memory Layer)

| Location | Code | Impact | Classification |
|----------|------|--------|----------------|
| `server/src/context/memory/memory-service.ts:95` | `embedding.length > 0 ? this.embeddingModel : null` — silent failure | Memory created without embedding, unsearchable | CRITICAL |
| `server/src/context/memory/memory-retrieval-service.ts:85` | `logger.warn({ error }, 'Vector search failed')` — silent fallback | Falls back to non-vector search, degraded quality | HIGH |
| `server/src/services/acu-memory-pipeline.ts:185` | `calculateImportance` uses hardcoded weights | Importance scoring not tunable | MEDIUM |
| `server/src/context/memory/memory-consolidation-service.ts:150` | `calculateSimilarity` uses word overlap | Crude similarity, misses semantic matches | MEDIUM |
| `sdk/src/nodes/memory-node.ts:200` | `semanticSearch` falls back to text search | No actual vector search in SDK | HIGH |
| `server/src/context/memory/memory-types.ts:1` | `// Designed for production use` — but no retry logic | Embedding failures not retried | MEDIUM |

---

## SECTION C — THE ATOMIC CHAT UNIT (ACU)

### C1 — What is an ACU?

**Exact Definition:**

An Atomic Chat Unit (ACU) is the smallest meaningful knowledge unit extracted from a conversation. It represents a single coherent piece of information (statement, question, answer, code snippet, etc.) that can be independently searched, scored, and reused.

**Granularity:**

Variable — an ACU can be:
- A single message (if it contains one coherent unit)
- A segment of a message (if message contains multiple units)
- A Q&A exchange (question + answer pair)

The segmentation is LLM-driven via the extraction pipeline.

**ACUs per Conversation:**

Depends on conversation length and density. A typical 20-message conversation might produce 10-30 ACUs.

**Immutability:**

ACUs are **immutable** once created. Updates would require creating a new ACU with a new ID.

**Ownership:**

ACUs are owned by the user who captured the conversation (`authorDid` = user's DID).

**Independent Existence:**

❌ NOT FOUND — ACUs always have a `conversationId` and `messageId` reference. No mechanism for standalone ACU creation found.

---

### C2 — The ACU Schema

**Full Prisma Model:**

```prisma
model AtomicChatUnit {
  id                  String    @id
  authorDid           String
  signature           Bytes
  content             String
  contentHash         String?
  version             Int       @default(1)
  language            String?
  type                String
  category            String
  origin              String    @default("extraction")
  embedding           Float[]   @db.Vector(1536)
  embeddingModel      String?
  conversationId      String?
  messageId           String?
  messageIndex        Int?
  provider            String?
  model               String?
  sourceTimestamp     DateTime?
  parentId            String?
  extractorVersion    String?
  parserVersion       String?
  state               String    @default("ACTIVE")
  securityLevel       Int       @default(0)
  isPersonal          Boolean   @default(false)
  level               Int       @default(4)
  contentType         String    @default("text")
  
  // Quality scores
  qualityOverall      Float?
  contentRichness     Float?
  structuralIntegrity Float?
  uniqueness          Float?
  
  // Engagement metrics
  viewCount           Int       @default(0)
  shareCount          Int       @default(0)
  quoteCount          Int       @default(0)
  rediscoveryScore    Float?
  
  // Sharing
  sharingPolicy       String    @default("self")
  sharingCircles      String[]
  canView             Boolean   @default(true)
  canAnnotate         Boolean   @default(false)
  canRemix            Boolean   @default(false)
  canReshare          Boolean   @default(false)
  
  // Lifecycle
  expiresAt           DateTime?
  createdAt           DateTime  @default(now())
  indexedAt           DateTime  @default(now())
  
  // Metadata
  metadata            Json      @default("{}")
  tags                String[]
  
  // Relations
  linksFrom           AcuLink[] @relation("SourceAcu")
  linksTo             AcuLink[] @relation("TargetAcu")
  author              User      @relation(fields: [authorDid], references: [did])
  conversation        Conversation? @relation(fields: [conversationId], references: [id])
  message             Message?  @relation(fields: [messageId], references: [id])
  parent              AtomicChatUnit? @relation("AcuDerivations")
  derivations         AtomicChatUnit[] @relation("AcuDerivations")
  notebooks           NotebookEntry[]
  
  // Indexes
  @@index([authorDid])
  @@index([type])
  @@index([category])
  @@index([qualityOverall(sort: Desc)])
  @@index([embedding])
  @@map("atomic_chat_units")
}
```

**Field Analysis:**

| Field | Type | Purpose | Populated By | Queried By | Index |
|-------|------|---------|--------------|------------|-------|
| `id` | String | Unique identifier | Auto-generated | All lookups | Primary |
| `authorDid` | String | Owner's DID | From user | User-scoped queries | Yes |
| `content` | String | ACU text content | LLM extraction | Search, display | No |
| `type` | String | ACU type (statement, question, etc.) | LLM classification | Type filtering | Yes |
| `category` | String | Topic category | LLM classification | Category filtering | Yes |
| `embedding` | Float[1536] | Semantic vector | Embedding service | Semantic search | Yes |
| `qualityOverall` | Float | Overall quality score (0-1) | Quality scorer | Ranking | Yes |
| `contentRichness` | Float | Content density score | Quality scorer | Filtering | No |
| `structuralIntegrity` | Float | Structural completeness | Quality scorer | Filtering | No |
| `uniqueness` | Float | Novelty score | Quality scorer | Filtering | No |
| `conversationId` | String | Parent conversation | From source | Conversation lookup | Yes |
| `messageId` | String | Source message | From source | Message lookup | No |
| `messageIndex` | Int | Position in conversation | From source | Ordering | No |

**Embedding Field:**
- **Model:** Same as Memory (text-embedding-3-small or glm-4.7-flash)
- **Dimensions:** 1536
- **Index:** pgvector cosine similarity

**qualityOverall Scale:**

0.0 to 1.0 (Float). Computed from sub-scores.

**Sub-scores:**
- `contentRichness` — information density
- `structuralIntegrity` — completeness/coherence
- `uniqueness` — novelty vs existing knowledge

**type Enum Values:**

```typescript
type ACUType =
  | 'statement'
  | 'question'
  | 'answer'
  | 'code_snippet'
  | 'formula'
  | 'table'
  | 'image_reference'
  | 'tool_use';
```

**parts Field:**

❌ NOT FOUND — The `parts` field mentioned in the brief is not in the schema. ACUs have `content` (string) not `parts` (JSON).

**authorDid:**

Always the capturing user's DID. Set during ACU creation from the authenticated user.

**Federation/Sharing Fields:**

- `sharingPolicy` — 'self', 'circle', 'friends', 'public'
- `sharingCircles` — circle IDs allowed to view
- `canView`, `canAnnotate`, `canRemix`, `canReshare` — permission flags

---

### C3 — ACU Creation Pipeline

**Phase 1 — Segmentation:**

**Trigger:** POST to `/acus/process` endpoint (manual or automated)

**Function:** ❌ NOT FOUND — No explicit segmentation function found. ACU creation appears to be LLM-driven in a single extraction step.

**Algorithm:** ⚠️ INFERRED — Based on `MemoryExtractionEngine`, the LLM is prompted to extract distinct knowledge units from conversation text.

**Output:** Structured ACU data with type, category, content

---

**Phase 2 — Enrichment:**

**Type Classification:**

**Function:** LLM-driven via extraction prompt

**File:** `server/src/context/memory/memory-extraction-engine.ts` lines 150-200

**LLM Call:** Yes — `glm-4.7-flash` model

**Prompt:** `MEMORY_EXTRACTION_PROMPT` — asks LLM to classify each extracted unit

**Fallback:** Unknown type → 'unknown' or 'statement'

---

**Quality Scoring:**

**Function:** ❌ NOT FOUND — No explicit quality scoring function found. Quality fields may be set by LLM or default to null.

---

**Phase 3 — Embedding:**

**Function:** `createMemoryFromExtraction()` calls `embeddingService.embed()`

**File:** `server/src/context/memory/memory-extraction-engine.ts` lines 205-225

**Model:** `text-embedding-3-small` or `glm-4.7-flash`

**Provider:** OpenAI or Z.AI

**Batch Processing:** ❌ NOT FOUND — Embeddings generated one-at-a-time

**Error Handling:** Silent failure — embedding failure logs warning but ACU creation continues without embedding

**Storage:** Via Prisma `AtomicChatUnit.create()`

---

**Phase 4 — Indexing and Storage:**

**DB Write:**
```typescript
await prisma.atomicChatUnit.create({
  data: {
    id: generatedId,
    authorDid: userId,
    content: acu.content,
    type: acu.type,
    category: acu.category,
    embedding: embedding,
    // ... etc
  }
});
```

**Atomicity:** ❌ NOT FOUND — No explicit transaction wrapping found. Partial ACU creation possible if embedding fails after DB write.

**Post-write Events:** ❌ NOT FOUND — No events emitted on ACU creation (event bus has `acu:created` type but no emitter found).

---

### C4 — ACU Quality Scoring System

**qualityOverall:**

⚠️ INFERRED — Based on schema fields, `qualityOverall` appears to be either:
1. Set directly by LLM during extraction
2. Computed from sub-scores (but no computation logic found)

**Sub-scores:**
- `contentRichness` — information density
- `structuralIntegrity` — coherence/completeness
- `uniqueness` — novelty

**Scoring Algorithm:** ❌ NOT FOUND — No explicit scoring algorithm implementation found.

**When Computed:** At ACU creation time (during extraction)

**Manual Adjustment:** ❌ NOT FOUND — No UI or API for manual quality adjustment.

**Quality Effects:**

| System | Effect |
|--------|--------|
| Memory Creation | ACUs with `qualityOverall >= 0.7` eligible for conversion |
| Context Retrieval | Higher quality ACUs ranked higher in search |
| Social Sharing | ⚠️ INFERRED — High quality ACUs likely prioritized in feed |
| Search Ranking | Quality used as re-ranking signal |

---

### C5 — ACU Retrieval and Search

**Query Type: Semantic Search**

**Trigger:** `HybridRetrievalService.retrieve()`

**Function:** `semanticSearchACUs()`

**File:** `server/src/context/hybrid-retrieval.ts` lines 60-95

**Query Logic:**
```sql
SELECT id, content, type, category, "createdAt",
       1 - (embedding <=> $1::vector) as similarity
FROM atomic_chat_units
WHERE "authorDid" = (SELECT did FROM users WHERE id = $2)
  AND state = 'ACTIVE'
  AND embedding IS NOT NULL
  AND array_length(embedding, 1) > 0
ORDER BY embedding <=> $1::vector
LIMIT 20
```

**Filters:** userId (via authorDid), state = 'ACTIVE', embedding not empty

**Vector Search:** Yes — pgvector cosine similarity

**Result Limit:** 20 (configurable)

**Sort:** By similarity (descending)

**Caching:** No explicit caching

**Performance Risk:** Sequential scan if embedding index not configured

---

**Query Type: Keyword Search**

**Function:** `keywordSearchACUs()`

**File:** `server/src/context/hybrid-retrieval.ts` lines 130-160

**Query Logic:** SQL LIKE with keyword conditions

**Performance Risk:** LIKE is slow on large datasets

---

**Query Type: Conversation ACU List**

**Function:** `getConversationACUs()`

**File:** `pwa/src/lib/acu-api.ts` lines 145-150

**Query Logic:** List ACUs filtered by conversationId

---

### C6 — ACU Lifecycle Management

**Update:** ❌ NOT FOUND — No update function for ACUs. ACUs appear to be immutable.

**Deletion:** ⚠️ INFERRED — ACUs likely cascade-delete with parent conversation (based on Prisma relation `onDelete: Cascade`).

**Expiry:** `expiresAt` field exists but no TTL mechanism found.

**Deduplication:** ❌ NOT FOUND — No deduplication on ACU creation.

**Re-processing:** ❌ NOT FOUND — No mechanism to regenerate ACUs from conversation.

---

### C7 — ACU Viewer and Graph Components

**ACUViewer:**

**File:** `pwa/src/components/ACUViewer.tsx`

**Props:**
```typescript
interface ACUViewerProps {
  conversationId: string;
  onACUClick?: (acu: ACU) => void;
}
```

**Renders:**
- Filter controls (type, min quality)
- ACU cards with type icon, category badge, content, quality bar
- Metadata (message index, date)

**Data Source:** `getConversationACUs()` API call

**Mobile Layout:** Responsive CSS (not explicitly adapted)

**Quality Visualization:** Progress bar with color coding (green ≥80, yellow ≥60, orange ≥40, red <40)

**Actions:** Click to view details (no edit/delete in current implementation)

**Missing/Broken:** No relationship visualization within viewer

---

**ACUGraph:**

**File:** `pwa/src/components/ACUGraph.tsx`

**Graph Library:** Custom canvas rendering (not D3/Cytoscape/React Flow)

**Nodes:** ACUs (center node + related ACUs)

**Edges:** ACU relationships (linksFrom/linksTo)

**Data Computation:** Server-side via `/acus/:id/links?depth=N` endpoint

**Real-time Updates:** No — data loaded once on mount

**Mobile Behavior:** Canvas scales but not specifically adapted

**Performance:** Unknown — no node limit found

---

### C8 — ACU ↔ Memory ↔ Context Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     Extraction     ┌──────────────┐     Conversion       │
│  │ Conversation │ ──────────────────►│     ACU      │ ──────────────────►  │
│  └──────────────┘   (LLM + Embed)    └──────────────┘   (if quality≥0.7)   │
│         │                                   │                              │
│         │                                   │ Semantic Search              │
│         │                                   ▼                              │
│         │                          ┌──────────────┐                        │
│         │                          │   Context    │                        │
│         │                          │   Engine     │                        │
│         │                          │   (L5_jit)   │                        │
│         │                          └──────────────┘                        │
│         │                                   │                              │
│         │                                   │                              │
│         ▼                                   ▼                              │
│  ┌──────────────┐     Extraction     ┌──────────────┐                      │
│  │   Memory     │ ◄──────────────────│   Context    │                      │
│  └──────────────┘   (direct)         │   Injection  │                      │
│                                      └──────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Connection: ACU → Memory**

**Trigger:** High quality ACU (≥0.7) or user engagement (like/bookmark)

**Function:** `convertACUToMemory()`

**File:** `server/src/services/acu-memory-pipeline.ts` lines 25-80

**Transformation:**
```typescript
{
  userId: acu.authorDid,
  content: acu.content,
  category: acu.category || 'general',
  importance: calculatedImportance(acu),
  sourceAcuId: acu.id,
  sourceConversationId: acu.conversationId
}
```

**Conditions:** `qualityOverall >= 0.7` OR engagement score >= 3

**Status:** 🟢 IMPLEMENTED

---

**Connection: Memory → Context**

**Trigger:** Every AI message

**Function:** `HybridRetrievalService.retrieve()`

**File:** `server/src/context/hybrid-retrieval.ts` lines 27-67

**Status:** 🟢 IMPLEMENTED

---

**Connection: ACU → Context (direct)**

**Trigger:** Every AI message

**Function:** `HybridRetrievalService.retrieve()` — returns both ACUs and memories

**File:** `server/src/context/hybrid-retrieval.ts` lines 27-67

**Status:** 🟢 IMPLEMENTED

---

**Connection: Context → ACU (feedback)**

❌ NOT FOUND — No mechanism to mark ACUs as "used" in context.

---

### C9 — SDK ACU Interface

**ContentNode:**

**File:** `sdk/src/nodes/content-node.ts`

**Note:** This is a content management node, not specifically an ACU node. ACU-specific SDK methods not found.

**Public Methods:**
- `create()` — create content
- `get()` — retrieve content
- `update()` — update content
- `delete()` — delete content
- `getFeed()` — get content feed
- `search()` — search content
- `like()` — like content
- `share()` — share content

**ACU-specific methods:** ❌ NOT FOUND in SDK

---

### C10 — Known Gaps, Stubs, and Failure Modes (ACU System)

| Location | Code | Impact | Classification |
|----------|------|--------|----------------|
| `server/src/services/acu-memory-pipeline.ts:55` | `sourceAcuId: acuId` — but schema has `sourceAcuIds` (array) | Type mismatch, may cause Prisma error | CRITICAL |
| `sdk/src/nodes/memory-node.ts:200` | `semanticSearch` falls back to text search | SDK semantic search doesn't work | HIGH |
| `server/src/context/hybrid-retrieval.ts:90` | Fallback similarity: `0.5 + index * 0.02` | Fake similarity scores affect ranking | MEDIUM |
| `server/prisma/schema.prisma:200` | `embedding Float[] @db.Vector(1536)` — no index defined | Sequential scan on semantic search | HIGH |
| `pwa/src/components/ACUGraph.tsx:60` | Custom canvas rendering — no force layout | Graph visualization is static, not interactive | LOW |
| `server/src/context/memory/memory-extraction-engine.ts:100` | No retry logic for LLM rate limits | Extraction fails on rate limit | MEDIUM |

---

## SECTION D — CROSS-SYSTEM INTEGRATION AUDIT

### D1 — The Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE DATA FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER CAPTURES CONVERSATION                                                 │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────┐                                                        │
│  │   Conversation   │                                                        │
│  │   (PostgreSQL)   │                                                        │
│  └──────────────────┘                                                        │
│         │                                                                    │
│         │ ACU Extraction Pipeline                                            │
│         ▼                                                                    │
│  ┌──────────────────┐     ┌──────────────────┐                              │
│  │  Segmentation    │────►│  Enrichment      │                              │
│  │  (LLM-driven)    │     │  (type, category)│                              │
│  └──────────────────┘     └──────────────────┘                              │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────┐     ┌──────────────────┐                              │
│  │   Embedding      │◄────│  Quality Scoring │                              │
│  │  (pgvector)      │     │  (LLM or rules)  │                              │
│  └──────────────────┘     └──────────────────┘                              │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────┐                                                        │
│  │  AtomicChatUnit  │                                                        │
│  │  (PostgreSQL)    │                                                        │
│  └──────────────────┘                                                        │
│         │                                                                    │
│         │ Auto-conversion (if quality ≥ 0.7)                                 │
│         ▼                                                                    │
│  ┌──────────────────┐                                                        │
│  │     Memory       │                                                        │
│  │  (PostgreSQL)    │                                                        │
│  └──────────────────┘                                                        │
│                                                                              │
│  USER SENDS AI MESSAGE                                                      │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────┐                                                        │
│  │  Context Engine  │                                                        │
│  │  Triggered       │                                                        │
│  └──────────────────┘                                                        │
│         │                                                                    │
│         │ Layer Assembly (Parallel)                                          │
│         ├─────────────────────────────────────────────────────────┐          │
│         │ L0: Identity ─────► Memory (importance ≥ 0.8)           │          │
│         │ L1: Prefs ────────► CustomInstruction + Memory          │          │
│         │ L2: Topic ────────► TopicProfile + ACU semantic search  │          │
│         │ L3: Entity ───────► EntityProfile + ACU semantic search │          │
│         │ L4: Conversation ─► Message history + Arc summary       │          │
│         │ L5: JIT ──────────► HybridRetrieval (ACU + Memory)      │          │
│         │ L6: History ──────► Raw messages                        │          │
│         │ L7: User Message ─► Direct input                        │          │
│         └─────────────────────────────────────────────────────────┘          │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────┐                                                        │
│  │  Token Budget    │                                                        │
│  │  (12000 default) │                                                        │
│  │  Truncation      │                                                        │
│  └──────────────────┘                                                        │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────┐                                                        │
│  │  System Prompt   │                                                        │
│  │  (Compiled)      │                                                        │
│  └──────────────────┘                                                        │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────┐                                                        │
│  │  AI Provider     │                                                        │
│  │  (OpenAI, etc.)  │                                                        │
│  └──────────────────┘                                                        │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────┐                                                        │
│  │  Streaming       │                                                        │
│  │  Response        │                                                        │
│  └──────────────────┘                                                        │
│         │                                                                    │
│         │ New ACUs from response?                                            │
│         ▼                                                                    │
│  ┌──────────────────┐                                                        │
│  │  Back to ACU     │                                                        │
│  │  Extraction      │                                                        │
│  └──────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### D2 — Event Bus and Side Effect Map

| Event | Emitted By | Payload | Listeners | Side Effects |
|-------|------------|---------|-----------|--------------|
| `memory:created` | `MemoryService.createMemory()` | `{ memoryType, category }` | `ContextEventBus` default handler | Invalidate identity/prefs bundles |
| `memory:updated` | `MemoryService.updateMemory()` | Update fields | Default handler | Invalidate related bundles |
| `memory:deleted` | `MemoryService.deleteMemory()` | Memory ID | Default handler | Invalidate related bundles |
| `acu:created` | ❌ NOT FOUND | — | Default handler | Invalidate topic/entity bundles |
| `acu:processed` | ❌ NOT FOUND | — | Default handler | Invalidate topic/entity bundles |
| `conversation:message_added` | ❌ NOT FOUND | `{ conversationId }` | Default handler | Invalidate conversation bundle |
| `instruction:created` | ❌ NOT FOUND | — | Default handler | Invalidate global prefs |
| `settings:updated` | ❌ NOT FOUND | — | Default handler | Invalidate settings cache |
| `telemetry:assembly_complete` | `ParallelContextPipeline.assembleParallel()` | Metrics | None found | None |

**Missing Listeners:**
- `acu:created` — no emitter found
- `acu:processed` — no emitter found
- `conversation:message_added` — no emitter found
- `instruction:*` — no emitters found

---

### D3 — Shared Type Definitions

**From `server/src/context/types.ts`:**

```typescript
interface LayerBudget { /* ... */ }
interface BudgetInput { /* ... */ }
interface ComputedBudget { /* ... */ }
interface DetectedContext { /* ... */ }
interface CompiledBundle { /* ... */ }
interface AssembledContext { /* ... */ }
interface AssemblyParams { /* ... */ }
interface JITKnowledge { /* ... */ }
interface IEmbeddingService { /* ... */ }
interface ILLMService { /* ... */ }
interface ITokenEstimator { /* ... */ }
```

**From `server/src/context/memory/memory-types.ts`:**

```typescript
type MemoryTypeEnum = 'EPISODIC' | 'SEMANTIC' | ...;
interface CreateMemoryInput { /* ... */ }
interface MemoryRetrievalOptions { /* ... */ }
interface MemoryRetrievalResult { /* ... */ }
interface IEmbeddingService { /* ... */ }
interface ILLMService { /* ... */ }
```

**Type Mismatches Found:**

1. `IEmbeddingService` defined in both files with same interface — OK
2. `ILLMService` defined in both files with same interface — OK
3. `sourceAcuId` (string) vs `sourceAcuIds` (string[]) — mismatch in ACU-memory conversion

---

### D4 — Performance Bottlenecks

| Operation | File | Risk | Impact at Scale |
|-----------|------|------|-----------------|
| Semantic search (ACU) | `hybrid-retrieval.ts:60` | Sequential scan if no pgvector index | 100k ACUs → seconds per query |
| Semantic search (Memory) | `memory-retrieval-service.ts:85` | Same as above | 100k memories → seconds |
| Keyword search (LIKE) | `hybrid-retrieval.ts:130` | Full table scan | 100k ACUs → very slow |
| Bundle compilation | `bundle-compiler.ts:245` | LLM call per bundle | High latency on cache miss |
| Conversation arc | `bundle-compiler.ts:245` | LLM call for long conversations | Adds 500-1000ms per request |
| No caching for JIT | `context-assembler.ts:295` | Repeated semantic searches | Wasted compute on repeated queries |

---

### D5 — p-queue and opossum Usage

**p-queue:** ❌ NOT FOUND — No p-queue usage in codebase.

**opossum:** ❌ NOT FOUND — No circuit breaker implementation found.

---

## SECTION E — SOTA REDESIGN REQUIREMENTS

### E1 — Critical Blockers

| Issue | File | Why Critical |
|-------|------|--------------|
| Missing pgvector index | `server/prisma/schema.prisma` | Semantic search will be unusably slow at scale |
| Silent embedding failures | `memory-service.ts:95` | Memories created without embeddings are unsearchable |
| Type mismatch (sourceAcuId) | `acu-memory-pipeline.ts:55` | ACU→Memory conversion may fail silently |
| No transaction boundaries | Multiple files | Partial state on failures (ACU without embedding, etc.) |
| No retry logic | `memory-extraction-engine.ts` | LLM rate limits cause permanent failures |

---

### E2 — What Exists and is Worth Keeping

| Component | File | Why Keep | Changes Needed |
|-----------|------|----------|----------------|
| ContextEventBus | `context-event-bus.ts` | Solid event-driven architecture | Wire up missing emitters |
| ContextCache (LRU) | `context-cache.ts` | Well-designed with TTL and namespaces | None |
| HybridRetrievalService | `hybrid-retrieval.ts` | Good RRF fusion approach | Add proper pgvector index |
| MemoryRetrievalService | `memory-retrieval-service.ts` | Comprehensive retrieval options | Add caching layer |
| BundleCompiler | `bundle-compiler.ts` | Clean compilation logic | Make LLM model configurable |
| ParallelContextPipeline | `context-pipeline.ts` | Good parallel architecture | Integrate with main assembler |

---

### E3 — What Must Be Replaced

| Component | File | Why Replace | SOTA Replacement |
|-----------|------|-------------|------------------|
| Token estimation | `context-assembler.ts:400` | Character division is inaccurate | Use tiktoken or provider-specific tokenizer |
| Quality scoring | Multiple | No actual implementation found | Implement proper multi-factor scoring |
| ACU segmentation | ❌ Missing | LLM-only is slow and expensive | Hybrid rule-based + LLM segmentation |
| Conversation arc | `bundle-compiler.ts:245` | Hardcoded model, no fallback | Configurable model with summarization fallback |
| Context Recipes | ❌ Missing | Referenced but not implemented | Full recipe system with persistence |

---

### E4 — Missing Systems

| Missing System | Purpose | Hooks In | Scope |
|----------------|---------|----------|-------|
| Circuit Breaker | Protect against cascading failures | Wrap LLM calls, DB queries | M |
| Retry with backoff | Handle transient failures | Embedding, LLM, DB operations | S |
| Rate limiter | Prevent API abuse | Entry points (API routes) | S |
| Observability | Metrics, tracing, logging | All services | L |
| ACU deduplication | Prevent duplicate knowledge | ACU creation pipeline | M |
| Memory conflict detection | Find contradictory memories | Memory consolidation | L |
| Client-side token counting | Pre-flight budget check | PWA before sending message | S |
| Background job processor | Async ACU/memory processing | Queue for extraction jobs | M |
| Vector index management | Configure pgvector indexes | Database migrations | S |

---

## APPENDIX A — File Inventory

### Files Found and Read

**Context Engine:**
- ✅ `server/src/services/unified-context-service.ts`
- ✅ `server/src/context/context-pipeline.ts`
- ✅ `server/src/context/context-assembler.ts`
- ✅ `server/src/context/context-cache.ts`
- ✅ `server/src/context/context-event-bus.ts`
- ✅ `server/src/context/context-graph.ts`
- ✅ `server/src/context/context-telemetry.ts`
- ✅ `server/src/context/context-thermodynamics.ts`
- ✅ `server/src/context/context-orchestrator.ts`
- ✅ `server/src/context/bundle-compiler.ts`
- ✅ `server/src/context/hybrid-retrieval.ts`
- ✅ `server/src/context/types.ts`
- ✅ `server/src/services/invalidation-service.ts`

**Memory Layer:**
- ✅ `sdk/src/nodes/memory-node.ts`
- ✅ `server/src/context/memory/memory-service.ts`
- ✅ `server/src/context/memory/memory-retrieval-service.ts`
- ✅ `server/src/context/memory/memory-extraction-engine.ts`
- ✅ `server/src/context/memory/memory-consolidation-service.ts`
- ✅ `server/src/context/memory/memory-types.ts`

**ACU System:**
- ✅ `pwa/src/lib/acu-api.ts`
- ✅ `pwa/src/types/acu.ts`
- ✅ `server/src/services/acu-memory-pipeline.ts`
- ✅ `server/prisma/schema.prisma` (AtomicChatUnit model)

**Client Components:**
- ✅ `pwa/src/components/ContextVisualizer.tsx`
- ✅ `pwa/src/components/ACUViewer.tsx`
- ✅ `pwa/src/components/ACUGraph.tsx`
- ✅ `pwa/src/pages/ContextCockpitPage.tsx`
- ✅ `pwa/src/pages/ContextComponents.tsx`

**SDK:**
- ✅ `sdk/src/nodes/content-node.ts`
- ✅ `sdk/src/nodes/memory-node.ts`

### Files Not Found

- ❌ `server/src/services/context-engine.ts` — Does not exist
- ❌ `server/src/services/parallel-context-pipeline.ts` — Does not exist (logic in `context-pipeline.ts`)
- ❌ `pwa/src/hooks/useContext*.ts` — No such hooks
- ❌ `pwa/src/stores/*context*` — No context stores found
- ❌ `server/src/routes/*memory*` — Routes not in searched paths
- ❌ `pwa/src/lib/*memory*` — No memory lib files found
- ❌ `pwa/src/pages/ForYou.tsx` — Not in listing
- ❌ `sdk/src/VivimSDK.ts` — Does not exist
- ❌ Context Recipes implementation — Referenced but not found

---

## APPENDIX B — Prisma Schema Summary

**Key Models:**

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | User accounts | id, did, handle, settings |
| `Conversation` | Captured conversations | id, ownerId, messageCount, metadata |
| `Message` | Individual messages | id, conversationId, role, parts |
| `AtomicChatUnit` | Knowledge units | id, authorDid, content, type, embedding, qualityOverall |
| `Memory` | Long-term memory | id, userId, content, memoryType, embedding, importance |
| `ContextBundle` | Pre-compiled context | id, userId, bundleType, compiledPrompt, isDirty |
| `TopicProfile` | User topic model | id, userId, slug, embedding, relatedMemoryIds |
| `EntityProfile` | User entity model | id, userId, name, type, embedding, facts |
| `CustomInstruction` | User instructions | id, userId, content, scope, priority |
| `UserContextSettings` | Context preferences | userId, maxContextTokens, knowledgeDepth |

**pgvector Columns:**

| Table | Column | Dimensions |
|-------|--------|------------|
| `atomic_chat_units` | embedding | 1536 |
| `memories` | embedding | 1536 |
| `topic_profiles` | embedding | 1536 |
| `entity_profiles` | embedding | 1536 |

---

**END OF AUDIT**

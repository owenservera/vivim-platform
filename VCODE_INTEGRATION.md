# VIVIM SDK — vCode Core Upgrades Integration Guide

**Date**: April 5, 2026
**Source**: vCode (github.com/owenservera/vicode) — 512K+ LOC Anthropic Claude Code fork
**Target**: VIVIM SDK (`sdk/src/`) — adapted for web/P2P architecture
**Strategy**: Port patterns and architecture only — never copy code verbatim

---

## What Was Built

### Phase 1: Memory Foundation (6 modules) ✅

| Module | File | vCode Source | Description |
|---|---|---|---|
| **Hierarchical Memory Directory** | `sdk/src/services/memory/directory.ts` | `src/memdir/` | 3-tier memory: project → user → team with file-based paths |
| **Memory Store** | `sdk/src/services/memory/store.ts` | `src/memdir/` + `src/services/SessionMemory/` | Core persistence with storage adapter pattern (IndexedDB ↔ filesystem) |
| **Memory Commands** | `sdk/src/services/memory/commands.ts` | `src/commands/memory/` | High-level CRUD: add, get, update, delete, search, list, export, import |
| **Memory Extractor** | `sdk/src/services/memory/extractor.ts` | `src/services/extractMemories/` | Auto-extraction from conversations via explicit/implicit/LLM-assisted patterns |
| **Session Memory** | `sdk/src/services/memory/session-memory.ts` | `src/services/SessionMemory/` | Per-session context with promote-to-global, export/import |
| **Memory Usage Tracker** | `sdk/src/services/memory/usage.ts` | `src/hooks/useMemoryUsage.ts` | Quota, growth rate, token estimation, tag/category analytics |
| **Team Memory Sync** | `sdk/src/services/memory/team-sync.ts` | `src/services/teamMemorySync/` | CRDT-based sync with merkle verification, conflict resolution, delta sync |

### Phase 2: Extensibility Layer (5 modules) ✅

| Module | File | vCode Source | Description |
|---|---|---|---|
| **Tool Definition Pattern** | `sdk/src/core/tools.ts` | `src/Tool.ts` (~29K LOC) | `buildTool()` factory with Zod validation, permissions, timing, error handling |
| **Tool Registry** | `sdk/src/core/tools/registry.ts` | `src/tools.ts` | `assembleToolPool()` — merge builtin + MCP + plugin tools, filter by permissions |
| **Permission Manager** | `sdk/src/core/permissions.ts` | `src/hooks/toolPermission/` | 4 modes (default/plan/auto/bypass), wildcard rules, batch checks |
| **Plugin Loader** | `sdk/src/plugins/loader.ts` | `src/services/plugins/` | Discover → install → load → execute → auto-update lifecycle |
| **Bundled Skills** | `sdk/src/skills/bundled.ts` | `src/skills/bundled/` (16 skills) | memory, context, session, config, cost, diagnostics, search, batch, simplify, verify, remember, loop, debug, stuck, share, mcp-builder |

### Phase 3: Agent Infrastructure (4 modules) ✅

| Module | File | vCode Source | Description |
|---|---|---|---|
| **Task Manager** | `sdk/src/core/task-manager.ts` | `src/tools/Task*Tool/` (6 tools) | create/get/list/update/output/stop — shell, agent, memory, sync, custom types |
| **Agent Spawner** | `sdk/src/core/agents/spawner.ts` | `src/tools/AgentTool/` | Spawn with scoped tool access, allowed/denied lists, provider-agnostic |
| **Context Compression** | `sdk/src/services/compression.ts` | `src/services/compact/` | Snip, summary, hybrid strategies with token budget management |
| **Permission System** | *(already in Phase 2)* | *(already in Phase 2)* | |

### Phase 4: Observability & Control ✅

| Capability | Status | Location |
|---|---|---|
| Session export/import | ✅ | `SessionMemoryManager.exportSession()` / `importSession()` |
| Cost tracking | ✅ | `createCostSkill()` in bundled skills |
| Config system | ✅ | `createConfigSkill()` in bundled skills |
| Diagnostics | ✅ | `createDiagnosticsSkill()` in bundled skills |
| Memory usage stats | ✅ | `MemoryUsageTracker.getStats()` |
| Task statistics | ✅ | `TaskManager.getStats()` |
| Agent statistics | ✅ | `AgentSpawner.getStats()` |

---

## File Map

### New Files Created

```
sdk/src/
├── services/
│   ├── memory/
│   │   ├── index.ts              # Memory system barrel export
│   │   ├── directory.ts          # Hierarchical directory manager
│   │   ├── store.ts              # Core persistence layer + StorageAdapter
│   │   ├── commands.ts           # High-level CRUD operations
│   │   ├── extractor.ts          # Auto memory extraction engine
│   │   ├── session-memory.ts     # Per-session memory manager
│   │   ├── usage.ts              # Memory usage tracker
│   │   └── team-sync.ts          # CRDT-based team sync
│   ├── index.ts                  # Updated — added all memory + compression exports
│   └── compression.ts            # Context compression service
├── core/
│   ├── index.ts                  # Updated — added tools, registry, permissions, tasks, agents
│   ├── tools.ts                  # Tool definition pattern + buildTool()
│   ├── permissions.ts            # Permission manager with wildcard rules
│   ├── task-manager.ts           # 6-tool task lifecycle manager
│   ├── tools/
│   │   └── registry.ts           # Tool registry + assembleToolPool()
│   └── agents/
│       └── spawner.ts            # Agent spawning with scoped tool access
├── plugins/
│   ├── index.ts                  # Plugin system barrel export
│   └── loader.ts                 # Plugin lifecycle manager
└── skills/
    ├── index.ts                  # Updated — added bundled skills exports
    └── bundled.ts                # 16 bundled skills

sdk/tests/
└── core-upgrades.test.ts         # Integration tests for all new modules
```

### Modified Files

```
sdk/src/services/index.ts         # Added memory system + compression exports
sdk/src/core/index.ts             # Added tools, registry, permissions, tasks, agents exports
sdk/src/skills/index.ts           # Added bundled skills exports + registerBundledSkills()
```

---

## Quick Start

### 1. Use the Memory System

```ts
import {
  MemoryDirectoryManager,
  MemoryStore,
  MemoryCommands,
  MemoryExtractor,
  NoOpStorageAdapter,
} from '@vivim/sdk';

// Setup
const dirManager = new MemoryDirectoryManager({
  projectRoot: process.cwd(),
  userId: 'user-123',
  teamId: 'team-alpha',
});

const store = new MemoryStore(dirManager, new NoOpStorageAdapter());
await store.initialize();

const commands = new MemoryCommands(store);

// Create memories
await commands.add({
  content: 'We use Bun as the runtime',
  scope: 'project',
  tags: ['bun', 'runtime'],
  category: 'infrastructure',
});

// Search
const results = await commands.search('Bun');

// Auto-extract from conversations
const extractor = new MemoryExtractor(commands);
const extraction = await extractor.extractFromConversation(
  'Remember that we use TypeScript everywhere',
  'Got it, I will remember that.',
  { sourceId: 'conv-1', provider: 'anthropic' }
);
```

### 2. Build Tools with `buildTool()`

```ts
import { buildTool, ToolRegistry, z } from '@vivim/sdk';

const searchMemoryTool = buildTool({
  name: 'memory_search',
  description: 'Search memories by text query',
  category: 'memory',
  inputSchema: z.object({
    query: z.string().min(1),
    limit: z.number().default(10),
    scope: z.enum(['project', 'user', 'team']).optional(),
  }),
  permissions: { level: 'user', requiresConfirmation: false },
  handler: async (input, ctx) => {
    const results = await memoryCommands.search(input.query, {
      limit: input.limit,
      scopes: input.scope ? [input.scope] : undefined,
    });
    return { success: true, data: { count: results.length, results } };
  },
});

// Register in tool pool
const registry = new ToolRegistry();
registry.register(searchMemoryTool);
```

### 3. Assemble Tool Pool from Multiple Sources

```ts
import { assembleToolPool, PermissionManager } from '@vivim/sdk';

const registry = assembleToolPool({
  builtinTools: [memoryTool, contentTool, socialTool],
  mcpTools: mcpDiscoveredTools, // from MCP client
  pluginTools: pluginTools,     // from plugin loader
  excludedTools: ['dangerous_tool'],
});

// Enforce permissions
const permissions = new PermissionManager();
permissions.setMode('default');
```

### 4. Manage Background Tasks

```ts
import { TaskManager } from '@vivim/sdk';

const tm = new TaskManager();

// Create
const task = tm.create({
  name: 'Memory consolidation',
  type: 'memory',
  payload: { scope: 'project' },
  priority: 'normal',
});

// Register executor
tm.registerExecutor('memory', async (task, onOutput, onStatus, signal) => {
  onOutput('Starting consolidation...');
  onStatus('running', 'Processing memories...');
  // ... actual work ...
  onStatus('completed', 'Done');
});

// Execute
await tm.execute(task.id);

// Or background
tm.executeBackground(task.id);

// Check status
const output = tm.getOutput(task.id);
const stats = tm.getStats();
```

### 5. Spawn Agents

```ts
import { AgentSpawner, ToolRegistry } from '@vivim/sdk';

const spawner = new AgentSpawner({ toolRegistry });

// Set LLM executor (integrates with server's AI provider)
spawner.setLLMExecutor(async ({ instructions, tools }) => {
  // Call your AI provider here
  return { response: 'Agent result', toolCalls: [] };
});

const agent = spawner.spawn({
  instructions: 'Analyze the codebase and suggest improvements',
  allowedTools: ['memory_search', 'content_list', 'search_text'],
  deniedTools: ['content_delete'],
  provider: 'anthropic',
  model: 'claude-opus-4.6',
});

const result = await spawner.execute(agent.id);
```

### 6. Compress Context

```ts
import { ContextCompressionService } from '@vivim/sdk';

const service = new ContextCompressionService({
  summarizer: async (messages) => {
    // Call AI to summarize
    return 'Summary of conversation';
  },
});

const result = await service.compress(messages, {
  targetTokens: 4000,
  strategy: 'hybrid', // snip → summary
  preserveIndices: [0], // always preserve system prompt
});

console.log(`Compressed ${result.originalTokens} → ${result.compressedTokens} tokens`);
console.log(`Removed ${result.messagesRemoved} messages`);
```

### 7. Load Plugins

```ts
import { PluginLoader } from '@vivim/sdk/plugins';

const loader = new PluginLoader(['./plugins', '~/.vivim/plugins']);

// Discover
const manifests = await loader.discover();

// Install
await loader.install('my-plugin', 'local', './plugins/my-plugin', manifest);

// Load
await loader.load('my-plugin', pluginExports);

// Get tools from plugins
const pluginTools = loader.getAllPluginTools();
```

### 8. Use Bundled Skills

```ts
import { registerBundledSkills, SkillRegistry } from '@vivim/sdk';

const registry = new SkillRegistry();
registerBundledSkills(registry);

// Use a skill
const result = await registry.executeCapability(
  '@vivim/skill-remember',
  'remember',
  { content: 'The project uses React 19' },
  sdk
);
```

---

## Integration Points

### With VIVIM Server

The memory system integrates with `server/src/ai/` for:
- **Auto extraction**: Server's AI pipeline calls `MemoryExtractor.extractFromConversation()`
- **LLM-assisted extraction**: Server provides summarizer function to `ContextCompressionService`
- **Agent execution**: Server's AI providers implement `AgentExecutor` interface

### With VIVIM PWA

- **Session Memory**: `SessionMemoryManager` integrates with React components via Zustand store
- **Memory Display**: PWA renders memories from SDK's `MemoryCommands.list()`
- **Usage Stats**: `MemoryUsageTracker` feeds the settings page

### With VIVIM Network

- **Team Sync**: `TeamMemorySync` produces/consumes deltas that the network layer transmits via LibP2P
- **CRDT**: Existing Yjs infrastructure handles conflict resolution; `TeamMemorySync` provides the domain logic

---

## What's Next (Tier 3-4 — Study/Ignore)

Per the porting priority matrix, the following are study-only (Tier 3) or excluded (Tier 4):

**Tier 3 (Study as needed):**
- Snip/History Snip → advanced memory management for long sessions
- Auto Dream → background memory consolidation during idle P2P sync
- Plan Mode → agent autonomy levels
- Session Rename/Tag → basic session organization
- Context Visualization → transparency = sovereignty
- Model Selection → provider-agnostic routing

**Tier 4 (Explicitly excluded):**
- Query Engine core (Anthropic-specific)
- Bridge/IDE integration (CLI↔IDE, not web)
- Vim Mode, Keybindings, Themes (terminal-specific)
- Git Commands (VIVIM is not a dev tool)
- Authentication (Anthropic-specific)
- x402 Payment Protocol (not relevant)
- Analytics/Telemetry (conflicts with privacy mission)

---

## License Note

vCode is leaked source code from Anthropic. **Only patterns and architecture were ported — no code was copied verbatim.** All implementations are original adaptations of the design patterns observed in vCode's public repository structure.

# VIVIM × VICODE — Porting Priority Matrix

**Mission**: Sovereign, portable, agnostic, user-owned & controlled AI memory — fully plug-and-play.

**Strategy**: Port capabilities from vicode (leaked Claude Code CLI) into vivim-app's SDK layer, adapting patterns from terminal/CLI to web/P2P architecture.

---

## PORTING TIERS

### 🟢 TIER 1: ADOPT IMMEDIATELY (Score 8-10/10)

*Direct integration into vivim SDK — highest ROI, core to mission.*

| # | Capability | Score | Target Location | Effort | Impact |
|---|---|---|---|---|---|
| 1 | **Hierarchical Memory (memdir/)** | 10/10 | `sdk/src/services/memory/` | Medium | **Transformative** |
| 2 | **Auto Memory Extraction** | 9/10 | `sdk/src/services/memory/extractor.ts` | Medium | **Transformative** |
| 3 | **Team Memory Sync** | 9/10 | `network/` (CRDT layer) | High | **Transformative** |
| 4 | **MCP Client Architecture** | 9/10 | `sdk/src/mcp/` (enhance existing) | Medium | **High** |
| 5 | **Tool Definition Pattern** | 8/10 | `sdk/src/core/tools.ts` | Medium | **High** |
| 6 | **Session Memory** | 8/10 | `sdk/src/services/sessions/` | Medium | **High** |
| 7 | **Memory Commands** | 8/10 | `sdk/src/services/memory/commands.ts` | Low | **High** |
| 8 | **Context Compression** | 8/10 | `sdk/src/services/compression/` | Medium | **High** |
| 9 | **Plugin Loader** | 8/10 | `sdk/src/plugins/` | Medium | **High** |
| 10 | **Skill System Architecture** | 8/10 | `sdk/src/skills/` (enhance existing) | Medium | **High** |
| 11 | **Agent Tool (sub-agent spawning)** | 8/10 | `sdk/src/core/agents/` | High | **High** |
| 12 | **Task Management (6 tools)** | 8/10 | `sdk/src/core/tasks/` | Medium | **High** |
| 13 | **Session Resume** | 8/10 | `sdk/src/services/sessions/resume.ts` | Medium | **High** |
| 14 | **Permission System** | 8/10 | `sdk/src/core/permissions/` | Medium | **High** |

**Estimated effort**: 3-4 sprints for full Tier 1
**Dependencies**: Memory system first (enables extraction, sync, session memory), then tool/skill/plugin infrastructure

---

### 🟡 TIER 2: ADAPT & INTEGRATE (Score 6-7/10)

*Moderate rework needed — clear patterns, significant value.*

| # | Capability | Score | Target Location | Effort | Impact |
|---|---|---|---|---|---|
| 15 | **MCP Tool Discovery** | 8/10 | `sdk/src/mcp/discovery.ts` | Medium | **High** |
| 16 | **Plugin Commands** | 7/10 | `sdk/src/plugins/commands.ts` | Low | **Medium** |
| 17 | **MCP Skill Builders** | 7/10 | `sdk/src/skills/mcp-builder.ts` | Medium | **Medium** |
| 18 | **Bundled Skills (16 skills)** | 7/10 | `sdk/src/skills/bundled/` | Low | **Medium** |
| 19 | **MCP Resources (List/Read)** | 7/10 | `sdk/src/mcp/resources.ts` | Low | **Medium** |
| 20 | **Memory Usage Tracking** | 7/10 | `sdk/src/services/memory/usage.ts` | Low | **Medium** |
| 21 | **Remember Skill** | 7/10 | `sdk/src/skills/bundled/remember.ts` | Low | **Medium** |
| 22 | **Permission Commands** | 7/10 | `sdk/src/permissions/commands.ts` | Low | **Medium** |
| 23 | **Config System** | 7/10 | `sdk/src/core/config/` | Medium | **Medium** |
| 24 | **Config Schema System** | 7/10 | `sdk/src/schemas/` | Medium | **Medium** |
| 25 | **Task Types** | 7/10 | `sdk/src/core/tasks/types.ts` | Medium | **Medium** |
| 26 | **Send Message (inter-agent)** | 7/10 | `sdk/src/core/agents/messaging.ts` | Medium | **Medium** |
| 27 | **Session Management** | 7/10 | `sdk/src/services/sessions/manager.ts` | Medium | **Medium** |
| 28 | **Session Export** | 7/10 | `sdk/src/services/sessions/export.ts` | Low | **Medium** |
| 29 | **File Read/Write/Edit Tools** | 7/10 | `sdk/src/core/tools/file.ts` | Low | **Medium** |
| 30 | **Grep/Glob Tools** | 7/10 | `sdk/src/core/tools/search.ts` | Low | **Medium** |
| 31 | **Web Fetch/Search Tools** | 7/10 | `sdk/src/core/tools/web.ts` | Low | **Medium** |
| 32 | **Cost Tracker** | 7/10 | `sdk/src/services/cost/` | Low | **Medium** |
| 33 | **Token Estimation** | 7/10 | `sdk/src/utils/token-estimation.ts` | Low | **Medium** |
| 34 | **Tool Registry & Assembly** | 7/10 | `sdk/src/core/tools/registry.ts` | Medium | **Medium** |
| 35 | **Doctor Diagnostics** | 6/10 | `sdk/src/services/diagnostics/` | Medium | **Medium** |
| 36 | **Session Statistics** | 6/10 | `sdk/src/services/sessions/stats.ts` | Low | **Medium** |
| 37 | **Session Share** | 6/10 | `sdk/src/services/sessions/share.ts` | Medium | **Medium** |
| 38 | **Session Summary** | 6/10 | `sdk/src/services/sessions/summary.ts` | Medium | **Medium** |
| 39 | **Context Management** | 6/10 | `sdk/src/services/context/` | Medium | **Medium** |
| 40 | **Config Migrations** | 6/10 | `sdk/src/migrations/` | Medium | **Medium** |
| 41 | **Privacy Settings** | 6/10 | `sdk/src/services/privacy/` | Medium | **Medium** |
| 42 | **LSP Tool** | 6/10 | `sdk/src/core/tools/lsp.ts` | Medium | **Medium** |
| 43 | **Ask User Question Tool** | 6/10 | `sdk/src/core/tools/interaction.ts` | Medium | **Medium** |
| 44 | **Coordinator Mode** | 6/10 | `sdk/src/core/coordinator/` | High | **Medium** |
| 45 | **Agent Summaries** | 6/10 | `sdk/src/services/agents/summaries.ts` | Medium | **Medium** |

**Estimated effort**: 4-5 sprints for full Tier 2
**Dependencies**: Requires Tier 1 infrastructure (memory, tools, skills, plugins)

---

### 🟠 TIER 3: LEARN & EXTRACT (Score 4-5/10)

*Study patterns, reimplement for vivim's architecture.*

| # | Capability | Score | Notes |
|---|---|---|---|
| 46 | **Snip/History Snip** | 6/10 | Advanced memory management — useful for long sessions |
| 47 | **Policy Limits** | 5/10 | Org policy enforcement — team/enterprise tier |
| 48 | **Auto Dream** | 5/10 | Background memory consolidation — interesting for P2P sync |
| 49 | **Feature Flag System** | 5/10 | Feature-gated capabilities — concept is portable |
| 50 | **Plan Mode** | 5/10 | Thinking vs acting separation — agent autonomy levels |
| 51 | **Remote Agent Tasks** | 5/10 | Federated execution pattern |
| 52 | **Schedule Cron / Remote Triggers** | 5/10 | Time-based agent activation |
| 53 | **Session Rename/Tag** | 5/10 | Basic session organization |
| 54 | **Session Clear** | 5/10 | Right to forget — data sovereignty |
| 55 | **Usage Tracking** | 5/10 | Granular usage analytics |
| 56 | **Context Visualization** | 5/10 | Transparency = sovereignty |
| 57 | **Prompt Suggestion** | 5/10 | Follow-up prompt suggestions |
| 58 | **Todo Write Tool** | 5/10 | Agent self-organization |
| 59 | **AppState Store** | 6/10 | Centralized state pattern (vivim uses Zustand) |
| 60 | **Change Observers** | 5/10 | Reactive state change hooks |
| 61 | **Lazy Loading Pattern** | 5/10 | Performance optimization |
| 62 | **Hook System** | 5/10 | React hooks patterns |
| 63 | **Error Handling & Retry** | 5/10 | Provider-agnostic error patterns |
| 64 | **System Prompt Construction** | 6/10 | Composable system prompts |
| 65 | **Model Selection** | 5/10 | Provider-agnostic routing |
| 66 | **Brief Tool** | 4/10 | Output formatting control |
| 67 | **Synthetic Output Tool** | 4/10 | Structured output generation |
| 68 | **Remote Managed Settings** | 4/10 | Enterprise policy sync |
| 69 | **Sandbox Toggle** | 4/10 | Execution isolation |
| 70 | **Parallel Prefetch** | 4/10 | Startup optimization |
| 71 | **Rate Limit Options** | 4/10 | Multi-provider rate limit visibility |
| 72 | **Rewind** | 4/10 | Session time-travel |

**Estimated effort**: Ongoing — extract patterns as needed
**Dependencies**: Study during Tier 1/2 implementation

---

### 🔴 TIER 4: IGNORE (Score 0-3/10)

*Wrong domain, vendor-locked, or conflicts with vivim's mission.*

| # | Capability | Score | Why Skip |
|---|---|---|---|
| 73 | **Query Engine (core)** | 2/10 | Anthropic-specific, 46K lines — vivim needs own LLM abstraction |
| 74 | **Bridge (IDE Integration)** | 1/10 | CLI↔IDE communication — vivim is web app |
| 75 | **Voice System** | 2/10 | Not core to memory mission, Anthropic-specific |
| 76 | **Vim Mode** | 1/10 | Terminal input — irrelevant for web |
| 77 | **Keybindings** | 1/10 | Terminal shortcuts — web has own input |
| 78 | **Theme/Output Style** | 2/10 | Terminal themes — vivim uses CSS/Tailwind |
| 79 | **Ink UI Components (~140)** | 1/10 | Terminal rendering — zero web portability |
| 80 | **Screens (REPL, Doctor, Resume)** | 2/10 | Full-screen terminal UIs |
| 81 | **Git Commands** | 2/10 | Vivim is not a dev tool |
| 82 | **Authentication (OAuth/Anthropic)** | 2/10 | Anthropic-specific — vivim has own auth |
| 83 | **x402 Payment Protocol** | 1/10 | Not relevant to memory mission |
| 84 | **Chrome Extension Integration** | 1/10 | Not applicable |
| 85 | **Teleport/Device Handoff** | 2/10 | Implementation is specific |
| 86 | **Analytics/Telemetry** | 1/10 | Conflicts with privacy mission |
| 87 | **Buddy Sprite** | 0/10 | Easter egg |
| 88 | **Stickers/Good-Claude** | 0/10 | Easter eggs |
| 89 | **Thinkback** | 3/10 | Niche debug tool |
| 90 | **Web Browser Tool** | 3/10 | Complex, feature-gated |
| 91 | **PowerShell Tool** | 2/10 | Platform-specific |
| 92 | **Notebook Edit Tool** | 3/10 | Niche use case |
| 93 | **Performance Issue Reporting** | 3/10 | Debug tool |

**No effort allocated** — explicitly excluded from porting plan.

---

## IMPLEMENTATION ROADMAP

### Phase 1: Memory Foundation (Weeks 1-3)

**Goal**: Build the core memory system — vivim's raison d'être.

| Week | Deliverable | Source | Target |
|---|---|---|---|
| 1 | Hierarchical memory types & storage | `src/memdir/` | `sdk/src/services/memory/` |
| 1 | Memory CRUD operations | `src/commands/memory/` | `sdk/src/services/memory/commands.ts` |
| 2 | Auto memory extraction engine | `src/services/extractMemories/` | `sdk/src/services/memory/extractor.ts` |
| 2 | Session memory management | `src/services/SessionMemory/` | `sdk/src/services/sessions/memory.ts` |
| 3 | Team memory sync with CRDT | `src/services/teamMemorySync/` | `network/` (CRDT layer) |
| 3 | Memory usage tracking | `src/hooks/useMemoryUsage.ts` | `sdk/src/services/memory/usage.ts` |

### Phase 2: Extensibility Layer (Weeks 4-6)

**Goal**: Make vivim plug-and-play — any provider, any tool, any extension.

| Week | Deliverable | Source | Target |
|---|---|---|---|
| 4 | MCP client architecture (enhance existing) | `src/services/mcp/` | `sdk/src/mcp/` |
| 4 | MCP tool discovery | `src/tools/ToolSearchTool/` | `sdk/src/mcp/discovery.ts` |
| 5 | Plugin loader | `src/services/plugins/` | `sdk/src/plugins/` |
| 5 | Skill system (enhance existing) | `src/skills/` | `sdk/src/skills/` |
| 6 | Tool definition pattern | `src/Tool.ts` | `sdk/src/core/tools.ts` |
| 6 | Tool registry & assembly | `src/tools.ts` | `sdk/src/core/tools/registry.ts` |

### Phase 3: Agent Infrastructure (Weeks 7-9)

**Goal**: Sovereign AI that can delegate, coordinate, and work autonomously.

| Week | Deliverable | Source | Target |
|---|---|---|---|
| 7 | Task management system | `src/tools/Task*Tool/` | `sdk/src/core/tasks/` |
| 7 | Agent spawning | `src/tools/AgentTool/` | `sdk/src/core/agents/spawner.ts` |
| 8 | Inter-agent messaging | `src/tools/SendMessageTool/` | `sdk/src/core/agents/messaging.ts` |
| 8 | Team coordination | `src/tools/TeamCreateTool/` | `sdk/src/core/agents/teams.ts` |
| 9 | Permission system | `src/hooks/toolPermission/` | `sdk/src/core/permissions/` |
| 9 | Context compression | `src/services/compact/` | `sdk/src/services/compression/` |

### Phase 4: User Control & Observability (Weeks 10-12)

**Goal**: Full user visibility and control over AI behavior.

| Week | Deliverable | Source | Target |
|---|---|---|---|
| 10 | Session resume/export | `src/commands/resume/`, `export/` | `sdk/src/services/sessions/` |
| 10 | Session management | `src/commands/session/` | `sdk/src/services/sessions/manager.ts` |
| 11 | Cost tracker | `src/cost-tracker.ts` | `sdk/src/services/cost/` |
| 11 | Token estimation | `src/services/tokenEstimation.ts` | `sdk/src/utils/token-estimation.ts` |
| 12 | Config system & schemas | `src/schemas/`, `ConfigTool` | `sdk/src/core/config/` |
| 12 | Diagnostics | `src/commands/doctor/` | `sdk/src/services/diagnostics/` |

---

## RISK ASSESSMENT

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Anthropic-specific dependencies in "portable" code | Medium | High | Audit each module before porting — strip vendor-specific imports |
| Terminal patterns don't translate to web | Low | Medium | Focus on logic/patterns, not UI — adapt for React web components |
| Bun-specific features (`bun:bundle`) | Medium | Low | Replace with standard ES module patterns |
| Tight coupling between subsystems | Medium | Medium | Extract clean interfaces between modules before porting |
| License concerns (leaked source) | High | Critical | **Only port patterns and architecture — never copy code verbatim** |
| Scope creep (trying to port everything) | High | High | Stick to Tier 1-2 only — Tier 3 is study-only |

---

## SUCCESS METRICS

| Metric | Target | Measurement |
|---|---|---|
| Memory system operational | Hierarchical project/user/team memory | Can create, read, update, delete memories at all three scopes |
| Auto extraction working | Memories extracted from conversations | System identifies and persists facts from chat sessions |
| MCP client functional | Connect to external MCP servers | Tool discovery and invocation from any MCP server |
| Plugin system active | Third-party plugins loadable | Install, load, execute, uninstall plugins |
| Skill system enhanced | 16+ bundled skills available | Skills invocable via SDK API |
| Task system running | Background tasks creatable and trackable | Create, monitor, stop, get output from tasks |
| Permission system active | Granular tool permissions enforced | Users can define allow/deny rules for any tool |
| Session portability | Sessions resume across devices | Export session, import on different device, continue |
| Cost tracking live | Per-session cost visibility | Users see token usage and cost breakdown |
| Context compression working | Conversations compress without losing key facts | Compressed sessions retain essential information |

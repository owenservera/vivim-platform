# VICODE → VIVIM: Capability Alignment Ranking

**VIVIM Core Mission**: *Sovereign, portable, agnostic, user-owned & controlled AI memory — fully plug-and-play.*

**Analysis Date**: April 3, 2026
**Source**: `github.com/owenservera/vicode` (leaked Claude Code CLI — ~1,900 files, 512K+ lines)
**Target**: `C:\0-BlackBoxProject-0\vivim-app-og\vivim-app` (VIVIM Monorepo — PWA, Server, Network, SDK, Admin)

---

## Scoring Criteria

| Score | Meaning |
|---|---|
| **10** | Direct hit — core to mission, drop-in applicable |
| **8-9** | Highly aligned — minor adaptation needed |
| **6-7** | Strong overlap — moderate adaptation, clear value |
| **4-5** | Partially aligned — useful patterns, significant rework |
| **2-3** | Tangential — conceptual value only |
| **0-1** | Misaligned — wrong domain or vendor-locked |

---

## 🧠 CATEGORY 1: MEMORY SYSTEMS

*The core of vivim's mission — persistent, hierarchical, user-owned AI memory.*

| Rank | Capability | Score | Source | Use Case | Why |
|---|---|---|---|---|---|
| 1 | **Hierarchical Memory (memdir/)** | **10/10** | `src/memdir/` | Project/User/Team memory scopes with file-based persistence | Vivim IS this. Three-tier memory hierarchy (project root CLAUDE.md → user ~/.claude/CLAUDE.md → team sync) is exactly vivim's sovereignty model. File-based = user-owned, no vendor lock-in. |
| 2 | **Auto Memory Extraction** | **9/10** | `src/services/extractMemories/` | Automatically extract persistent memories from conversations | Core to "evolve your AI" — system watches conversations, identifies reusable facts/preferences/conventions, persists them. Provider-agnostic extraction logic. |
| 3 | **Team Memory Sync** | **9/10** | `src/services/teamMemorySync/` | Shared team knowledge synchronization | Directly maps to vivim's "Share Your AI" principle. Syncs memories across team members — pairs perfectly with vivim's CRDT/P2P layer. |
| 4 | **Session Memory** | **8/10** | `src/services/SessionMemory/` | Session-scoped memory that persists across turns | Per-session context that survives — critical for portable AI sessions. User owns session data, can export/import. |
| 5 | **Memory Commands (/memory)** | **8/10** | `src/commands/memory/` | CRUD operations on memories — list, add, edit, delete, search | User-facing memory management UX. The command logic (search, filter, prioritize memories) is directly portable to vivim's web UI. |
| 6 | **Context Compression (compact/)** | **8/10** | `src/services/compact/` | Compress conversation history to fit more context | Sovereign memory means efficient memory. Compression algorithms are provider-agnostic — works with any LLM's context window. |
| 7 | **Memory Usage Tracking** | **7/10** | `src/hooks/useMemoryUsage.ts` | Track memory size, quota, growth over time | User control = user visibility. Shows how much memory is used, growth trends, helps users manage their AI knowledge base. |
| 8 | **Remember Skill** | **7/10** | `src/skills/bundled/remember` | Persist information to memory via natural language | "Remember this pattern" — natural language memory interface. User-friendly way to add memories without manual file editing. |
| 9 | **Snip/History Snip** | **6/10** | `src/services/compact/snipCompact.ts` | Selective history trimming with projection | Advanced memory management — snip out irrelevant history while preserving key facts. Useful for long-running sessions. |
| 10 | **Auto Dream** | **5/10** | `src/services/autoDream/` | Background ideation and memory consolidation | Background process that reorganizes/consolidates memories during idle time. Interesting concept for vivim's P2P sync cycles. |

---

## 🔌 CATEGORY 2: PLUG-AND-PLAY EXTENSIBILITY

*Making vivim fully modular — any provider, any tool, any extension.*

| Rank | Capability | Score | Source | Use Case | Why |
|---|---|---|---|---|---|
| 11 | **MCP Client Architecture** | **9/10** | `src/services/mcp/` | Connect to any MCP server, discover tools/resources dynamically | MCP is THE standard for tool interoperability. Vicode's MCP client handles discovery, auth, tool invocation, connection monitoring — vivim's SDK needs this exact pattern. |
| 12 | **MCP Tool Discovery (ToolSearchTool)** | **8/10** | `src/tools/ToolSearchTool/` | Discover tools from MCP servers at runtime | Deferred tool loading — find and invoke tools from connected servers without pre-registration. Critical for plug-and-play. |
| 13 | **Plugin Loader** | **8/10** | `src/services/plugins/` | Discover, load, and manage third-party plugins | Generic plugin lifecycle: discovery → installation → loading → execution → auto-update. Vivim's SDK needs this for its extension ecosystem. |
| 14 | **Plugin Commands (/plugin, /reload-plugins)** | **7/10** | `src/commands/plugin/`, `src/commands/reload-plugins/` | Install, remove, manage, reload plugins | User-facing plugin management. The installation flow, validation, and hot-reload patterns are directly applicable. |
| 15 | **Skill System Architecture** | **8/10** | `src/skills/` (full system) | Named, reusable workflows with prompts + tool configs | Vivim already has `sdk/src/skills/` — vicode's skill loader, registry, MCP skill builders, and 16 bundled skills are a masterclass in skill design. |
| 16 | **MCP Skill Builders** | **7/10** | `src/skills/mcpSkillBuilders.ts` | Auto-generate skills from MCP server resources | Bridges MCP and skills — turns any MCP resource into an invocable skill. Perfect for vivim's agnostic vision. |
| 17 | **Bundled Skills (16 skills)** | **7/10** | `src/skills/bundled/` | batch, debug, loop, simplify, verify, stuck, skillify, etc. | Reusable workflow patterns: batch operations, debugging loops, simplification, verification. These are provider-agnostic workflows vivim can adopt. |
| 18 | **MCP Auth Tool** | **6/10** | `src/tools/McpAuthTool/` | Handle OAuth/auth flows for MCP servers | Generic MCP authentication — handles auth challenges from any MCP server. Useful for vivim's multi-server MCP connections. |
| 19 | **MCP Resources (List/Read)** | **7/10** | `src/tools/ListMcpResourcesTool/`, `src/tools/ReadMcpResourceTool/` | List and read resources from MCP servers | Standard MCP resource protocol implementation. Vivim's SDK can use these patterns for resource-based MCP interactions. |
| 20 | **Feature Flag System** | **5/10** | `bun:bundle` + `src/services/analytics/` | Build-time feature toggles, dead code elimination | GrowthBook-based feature flags. The concept is portable (feature-gated capabilities), but implementation is Anthropic-specific. |

---

## 🤖 CATEGORY 3: AGENT ORCHESTRATION

*Sovereign AI that can delegate, coordinate, and work autonomously.*

| Rank | Capability | Score | Source | Use Case | Why |
|---|---|---|---|---|---|
| 21 | **Agent Tool (sub-agent spawning)** | **8/10** | `src/tools/AgentTool/` | Spawn sub-agents with scoped tool access | Core multi-agent pattern: spawn agent, define allowed/denied tools, collect results. Provider-agnostic orchestration. |
| 22 | **Team Create/Delete** | **7/10** | `src/tools/TeamCreateTool/`, `src/tools/TeamDeleteTool/` | Create teams of parallel agents | Parallel agent coordination — spawn multiple agents on shared task list. Vivim's SDK could use this for distributed AI work. |
| 23 | **Send Message (inter-agent)** | **7/10** | `src/tools/SendMessageTool/` | Send messages between agents | Inter-agent communication protocol. Essential for vivim's P2P agent network. |
| 24 | **Task Management (6 tools)** | **8/10** | `src/tools/Task{Create,Get,List,Update,Output,Stop}Tool/` | Full task lifecycle: create, track, update, stop, get output | Generic background task system — shell tasks, agent tasks, remote tasks. Vivim needs this for its agent execution layer. |
| 25 | **Task Types (LocalShell, LocalAgent, RemoteAgent, InProcessTeammate)** | **7/10** | `src/tasks/` | Different task execution environments | Task type hierarchy with different execution contexts. Maps to vivim's local vs. P2P vs. federated agent execution. |
| 26 | **Coordinator Mode** | **6/10** | `src/coordinator/` | Multi-agent orchestration with role assignment | Coordinator assigns roles, collects results, manages team lifecycle. Pattern is portable but implementation is tightly coupled. |
| 27 | **Agent Summaries** | **6/10** | `src/services/AgentSummary/` | Generate summaries of agent work | Auto-summarize what agents accomplished — useful for vivim's memory extraction (agents → memories). |
| 28 | **Plan Mode (Enter/Exit)** | **5/10** | `src/tools/EnterPlanModeTool/`, `src/tools/ExitPlanModeTool/` | Switch between planning and execution modes | Separates thinking from acting — useful pattern for vivim's agent autonomy levels. |
| 29 | **Remote Agent Tasks** | **5/10** | `src/tasks/RemoteAgentTask/` | Agents running on remote machines | Remote execution pattern — relevant for vivim's federated architecture but implementation is specific. |
| 30 | **Schedule Cron / Remote Triggers** | **5/10** | `src/tools/ScheduleCronTool/`, `src/tools/RemoteTriggerTool/` | Schedule agent actions on cron triggers | Time-based agent activation — "check this every hour" pattern. Useful for vivim's background memory sync. |

---

## 🔐 CATEGORY 4: USER CONTROL & SOVEREIGNTY

*User owns, controls, and configures their AI — no black boxes.*

| Rank | Capability | Score | Source | Use Case | Why |
|---|---|---|---|---|---|
| 31 | **Permission System (toolPermission/)** | **8/10** | `src/hooks/toolPermission/` | Granular tool permissions with wildcard rules | Core to sovereignty: `FileEdit(/src/*)`, `Bash(git *)` — user defines what AI can do. Four modes (default/plan/bypass/auto) give users control spectrum. |
| 32 | **Permission Commands (/permissions)** | **7/10** | `src/commands/permissions/` | Manage tool permission rules | User-facing permission management — add/remove/edit rules. The rule syntax and management UX is portable. |
| 33 | **Config System (ConfigTool + /config)** | **7/10** | `src/tools/ConfigTool/`, `src/commands/config/` | Read/modify settings at runtime | Runtime configuration management. User can tweak settings without editing files. Schema-driven config is portable. |
| 34 | **Config Schema System (schemas/)** | **7/10** | `src/schemas/` | Zod v4 schemas for user/project/org settings | Type-safe configuration with validation. User/project/org policy hierarchy — directly applicable to vivim's multi-tenant model. |
| 35 | **Config Migrations** | **6/10** | `src/migrations/` | Handle config format changes between versions | Migration system for config evolution. Important for vivim's long-term user data ownership. |
| 36 | **Privacy Settings** | **6/10** | `src/commands/privacy-settings/` | Manage data collection, telemetry, privacy controls | User privacy controls — what data is shared, what stays local. Core to vivim's sovereignty mission. |
| 37 | **Policy Limits** | **5/10** | `src/services/policyLimits/` | Organization-level rate limits and quotas | Org policy enforcement. Less relevant for individual sovereignty but useful for vivim's team/enterprise tier. |
| 38 | **Remote Managed Settings** | **4/10** | `src/services/remoteManagedSettings/` | Enterprise managed settings sync | Enterprise policy sync — conflicts with individual sovereignty but relevant for team deployments. |
| 39 | **Sandbox Toggle** | **4/10** | `src/commands/sandbox-toggle/` | Enable/disable sandboxed execution | Execution isolation — useful for vivim's agent safety but implementation is CLI-specific. |

---

## 🛠️ CATEGORY 5: TOOLS & CAPABILITIES

*Self-contained capabilities that make AI useful — file ops, search, web, etc.*

| Rank | Capability | Score | Source | Use Case | Why |
|---|---|---|---|---|---|
| 40 | **File Read/Write/Edit Tools** | **7/10** | `src/tools/File{Read,Write,Edit}Tool/` | Safe file operations with range support, image/PDF reading | Generic file I/O with safety checks. Vivim's agents need file operations — these are production-tested implementations. |
| 41 | **Grep/Glob Tools** | **7/10** | `src/tools/GrepTool/`, `src/tools/GlobTool/` | Content search (ripgrep) and file pattern matching | Codebase search capabilities. Vivim's agents need to search project files — these are optimized implementations. |
| 42 | **Web Fetch/Search Tools** | **7/10** | `src/tools/WebFetchTool/`, `src/tools/WebSearchTool/` | Fetch URLs, search the web | Web access for agents — fetch content, search for information. Provider-agnostic, directly portable. |
| 43 | **LSP Tool** | **6/10** | `src/tools/LSPTool/` | Go-to-definition, find references, diagnostics | Language server integration — agents can understand code structure. Useful for vivim's code-aware agents. |
| 44 | **Ask User Question Tool** | **6/10** | `src/tools/AskUserQuestionTool/` | Prompt user for input during agent execution | Agent-to-user communication — "which approach do you prefer?" Essential for interactive AI. |
| 45 | **Todo Write Tool** | **5/10** | `src/tools/TodoWriteTool/` | Structured task/todo tracking | Agent self-organization — track subtasks. Simple but effective pattern for vivim's agent planning. |
| 46 | **Brief Tool** | **4/10** | `src/tools/BriefTool/` | Generate brief summaries | Output formatting control. Minor utility but the concept of output style control is useful. |
| 47 | **Synthetic Output Tool** | **4/10** | `src/tools/SyntheticOutputTool/` | Generate structured output | Structured output generation — useful for vivim's API responses but implementation is specific. |
| 48 | **Notebook Edit Tool** | **3/10** | `src/tools/NotebookEditTool/` | Jupyter notebook cell editing | Niche — only relevant if vivim supports notebook workflows. |
| 49 | **Web Browser Tool** | **3/10** | `src/tools/WebBrowserTool/` (feature-gated) | Full browser automation | Browser automation — interesting but feature-gated and complex. |
| 50 | **PowerShell Tool** | **2/10** | `src/tools/PowerShellTool/` | Windows shell execution | Platform-specific. Vivim is cross-platform — not directly useful. |

---

## 📊 CATEGORY 6: OBSERVABILITY & DIAGNOSTICS

*User visibility into AI behavior — costs, performance, health.*

| Rank | Capability | Score | Source | Use Case | Why |
|---|---|---|---|---|---|
| 51 | **Cost Tracker** | **7/10** | `src/cost-tracker.ts`, `src/costHook.ts` | Track token usage and cost per turn | User sovereignty = cost transparency. Track spending per session, per agent, per tool. Provider-agnostic cost calculation. |
| 52 | **Token Estimation** | **7/10** | `src/services/tokenEstimation.ts` | Estimate token counts before API calls | Pre-flight token estimation — helps users understand context usage. Provider-agnostic algorithm. |
| 53 | **Doctor Diagnostics** | **6/10** | `src/commands/doctor/`, `src/screens/Doctor.tsx` | Environment health checks | System diagnostics — API connectivity, auth status, tool availability. Vivim needs equivalent health checks. |
| 54 | **Session Statistics** | **6/10** | `src/commands/stats/`, `src/commands/status/` | Session metrics: turns, tokens, tools used, duration | User visibility into AI usage patterns. Stats per session help users understand their AI behavior. |
| 55 | **Usage Tracking** | **5/10** | `src/commands/usage/`, `src/commands/extra-usage/` | Detailed API usage breakdown | Granular usage analytics — tokens by model, cost by tool. Useful for vivim's cost management. |
| 56 | **Context Visualization** | **5/10** | `src/commands/context/` | Visualize current context (files, memory, tools) | Show users what the AI "sees" — files in context, loaded memories, available tools. Transparency = sovereignty. |
| 57 | **Prompt Suggestion** | **5/10** | `src/services/PromptSuggestion/` | Suggested follow-up prompts | Help users discover capabilities — "you could also ask about X". Useful for vivim's onboarding. |
| 58 | **Rate Limit Options** | **4/10** | `src/commands/rate-limit-options/` | View rate limit configuration | Rate limit visibility — useful for multi-provider setups but Anthropic-specific. |
| 59 | **Performance Issue Reporting** | **3/10** | `src/commands/perf-issue/` | Report performance problems | Debug tool — not core to vivim's mission. |

---

## 🔄 CATEGORY 7: SESSION & CONTEXT MANAGEMENT

*Portable AI sessions — resume, export, share, migrate.*

| Rank | Capability | Score | Source | Use Case | Why |
|---|---|---|---|---|---|
| 60 | **Session Resume** | **8/10** | `src/commands/resume/`, `src/screens/ResumeConversation.tsx` | Restore previous conversation sessions | Session portability — pick up where you left off. Critical for vivim's "own your AI sessions" mission. |
| 61 | **Session Management** | **7/10** | `src/commands/session/` | List, switch, delete sessions | Session lifecycle management. Users control their session history — create, browse, clean up. |
| 62 | **Session Export** | **7/10** | `src/commands/export/` | Export conversations to files | Data portability — users can export their AI interactions. Core to "user-owned data." |
| 63 | **Session Share** | **6/10** | `src/commands/share/` | Share sessions via link | Shareable AI sessions — "look at this conversation." Useful for vivim's collaboration features. |
| 64 | **Session Summary** | **6/10** | `src/commands/summary/` | Generate session summaries | Auto-summarize what happened in a session. Useful for memory extraction and session review. |
| 65 | **Session Rename/Tag** | **5/10** | `src/commands/rename/`, `src/commands/tag/` | Organize sessions with names and tags | Session organization — naming, tagging for retrieval. Basic but necessary for session management. |
| 66 | **Session Clear** | **5/10** | `src/commands/clear/` | Clear conversation history | User control over data — delete what you don't want. Sovereignty = right to forget. |
| 67 | **Context Management (/add-dir, /files)** | **6/10** | `src/commands/add-dir/`, `src/commands/files/` | Add directories to context, list context files | Context scoping — users control what files the AI can see. Directly relevant to vivim's context management. |
| 68 | **Rewind** | **4/10** | `src/commands/rewind/` | Revert to previous state | Session time-travel — go back to earlier point. Interesting but complex to implement. |
| 69 | **Thinkback** | **3/10** | `src/commands/thinkback/`, `src/commands/thinkback-play/` | Replay AI's thinking process | Debug/audit tool — see how AI reasoned. Useful for transparency but niche. |

---

## 🏗️ CATEGORY 8: ARCHITECTURE PATTERNS

*Design patterns and abstractions worth learning from.*

| Rank | Capability | Score | Source | Use Case | Why |
|---|---|---|---|---|---|
| 70 | **Tool Definition Pattern** | **8/10** | `src/Tool.ts` | buildTool() — schema + permissions + execution + UI | The gold standard for tool abstraction. Zod-validated inputs, permission checks, execution logic, render components. Vivim should adopt this pattern for its agent tools. |
| 71 | **Tool Registry & Assembly** | **7/10** | `src/tools.ts` | assembleToolPool() — merge built-in + MCP tools | Dynamic tool pool assembly — combine native tools with discovered MCP tools, filter by permissions. Exactly what vivim's SDK needs. |
| 72 | **AppState Store** | **6/10** | `src/state/AppState.ts` | Global mutable state with context providers | Centralized state passed to tools/commands. Vivim uses Zustand — different implementation but same pattern. |
| 73 | **Change Observers** | **5/10** | `src/state/onChangeAppState.ts` | Side-effects on state changes | Reactive state change hooks — "when X changes, do Y." Useful for vivim's reactive UI. |
| 74 | **Lazy Loading Pattern** | **5/10** | Dynamic imports throughout | Defer heavy modules until first use | Performance pattern — don't load what you don't need. Vivim should adopt for its SDK. |
| 75 | **Parallel Prefetch** | **4/10** | `src/main.tsx` startup | Fire independent side-effects in parallel at startup | Startup optimization — parallelize MDM, keychain, API preconnect. Useful for vivim's app initialization. |
| 76 | **Hook System (~80 hooks)** | **5/10** | `src/hooks/` | Permission, input, session, plugin, notification hooks | React hooks library — many are Ink-specific but patterns (permission checks, input handling) are portable. |
| 77 | **Error Handling & Retry** | **5/10** | `src/services/api/errors.js` | Categorized API error handling with retry logic | Error classification and retry strategies. Provider-agnostic error handling patterns. |
| 78 | **System Prompt Construction** | **6/10** | `src/utils/queryContext.js` | Dynamic system prompt assembly from parts | Composable system prompts — build prompts from modular parts. Useful for vivim's multi-provider AI routing. |
| 79 | **Model Selection** | **5/10** | `src/utils/model/model.js` | Parse and switch between models | Model switching logic — "use this model for this task." Relevant for vivim's provider-agnostic routing. |

---

## 🚫 CATEGORY 9: NOT APPLICABLE / VENDOR-LOCKED

*Capabilities that don't align with vivim's mission.*

| Rank | Capability | Score | Source | Why Not |
|---|---|---|---|---|
| 80 | **Query Engine (core)** | **2/10** | `src/QueryEngine.ts` | ~46K lines of Anthropic-specific streaming, token counting, retry logic. Vivim needs its own LLM abstraction layer. |
| 81 | **Bridge (IDE Integration)** | **1/10** | `src/bridge/` | Bidirectional CLI↔IDE communication. Vivim is a web app — no IDE bridge needed. |
| 82 | **Voice System** | **2/10** | `src/voice/`, `src/services/voice.ts` | Voice input/output — interesting but not core to memory mission. Implementation is Anthropic-specific. |
| 83 | **Vim Mode** | **1/10** | `src/vim/`, `src/commands/vim/` | Terminal input mode. Irrelevant for web app. |
| 84 | **Keybindings** | **1/10** | `src/keybindings/` | Terminal keyboard shortcuts. Web has its own input handling. |
| 85 | **Theme/Output Style** | **2/10** | `src/commands/theme/`, `src/commands/output-style/` | Terminal color themes. Vivim uses CSS/Tailwind. |
| 86 | **Ink UI Components (~140)** | **1/10** | `src/components/` | Terminal rendering with Ink/Chalk. Zero portability to web React. |
| 87 | **Screens (REPL, Doctor, Resume)** | **2/10** | `src/screens/` | Full-screen terminal UIs. Web has its own routing/page model. |
| 88 | **Git Commands** | **2/10** | `/commit`, `/diff`, `/branch`, etc. | Vivim is not a dev tool — git operations aren't core to memory mission. |
| 89 | **Authentication (OAuth/Anthropic)** | **2/10** | `src/services/oauth/`, `/login`, `/logout` | Anthropic-specific OAuth flow. Vivim has its own auth system. |
| 90 | **x402 Payment Protocol** | **1/10** | `src/commands/x402/`, `src/tools/x402/` | Payment protocol integration. Not relevant to vivim's mission. |
| 91 | **Chrome Extension Integration** | **1/10** | `src/commands/chrome/` | Chrome extension bridge. Not applicable. |
| 92 | **Teleport/Device Handoff** | **2/10** | `src/commands/teleport/`, `/desktop`, `/mobile` | Cross-device session transfer. Interesting concept but implementation is specific. |
| 93 | **Analytics/Telemetry** | **1/10** | `src/services/analytics/` | GrowthBook + OpenTelemetry — Anthropic's internal telemetry. Conflicts with vivim's privacy mission. |
| 94 | **Buddy Sprite** | **0/10** | `src/buddy/` | Easter egg companion sprite. Not relevant. |
| 95 | **Stickers/Good-Claude** | **0/10** | `src/commands/stickers/`, `/good-claude` | Easter eggs. Not relevant. |

---

## 📈 AGGREGATE SUMMARY

### By Mission Alignment

| Mission Pillar | Top Capabilities | Avg Score | Count 8+ |
|---|---|---|---|
| **Sovereign** (user control) | Permission system, config schemas, privacy settings, cost tracking | **6.8** | 5 |
| **Portable** (cross-platform) | Session resume/export, MCP client, tool definition pattern, task system | **7.2** | 8 |
| **Agnostic** (provider-neutral) | MCP architecture, skill system, plugin loader, model selection, system prompt construction | **7.0** | 7 |
| **User-Owned Memory** | Hierarchical memory, auto extraction, team sync, session memory, context compression | **8.4** | 6 |
| **Plug-and-Play** | Plugin loader, MCP discovery, skill registry, tool assembly, feature flags | **7.4** | 6 |

### By Portability Tier

| Tier | Score Range | Count | Action |
|---|---|---|---|
| **🟢 Adopt Immediately** | 8-10/10 | **14 capabilities** | Direct integration into vivim SDK |
| **🟡 Adapt & Integrate** | 6-7/10 | **26 capabilities** | Moderate rework, clear patterns |
| **🟠 Learn & Extract** | 4-5/10 | **22 capabilities** | Study patterns, reimplement |
| **🔴 Ignore** | 0-3/10 | **33 capabilities** | Wrong domain or vendor-locked |

### Top 14 Capabilities to Port (Score ≥ 8)

1. **Hierarchical Memory (memdir/)** — 10/10 — Core mission
2. **Auto Memory Extraction** — 9/10 — Evolve your AI
3. **Team Memory Sync** — 9/10 — Share your AI
4. **MCP Client Architecture** — 9/10 — Plug-and-play
5. **Tool Definition Pattern** — 8/10 — Agnostic tool abstraction
6. **Session Memory** — 8/10 — User-owned sessions
7. **Memory Commands** — 8/10 — User memory management
8. **Context Compression** — 8/10 — Efficient memory
9. **Plugin Loader** — 8/10 — Extensibility
10. **Skill System Architecture** — 8/10 — Reusable workflows
11. **Agent Tool (sub-agent spawning)** — 8/10 — Sovereign AI delegation
12. **Task Management (6 tools)** — 8/10 — Agent execution
13. **Session Resume** — 8/10 — Portable sessions
14. **Permission System** — 8/10 — User control

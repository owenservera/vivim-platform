# VICODE — Subsystem Architecture Map

**Source**: `github.com/owenservera/vicode` (leaked Claude Code CLI)
**Scale**: ~1,900 files · 512,000+ lines · TypeScript (strict)
**Runtime**: Bun · **UI**: React + Ink (terminal) · **CLI**: Commander.js

---

## HIGH-LEVEL ARCHITECTURE

```
User Input → CLI Parser → Query Engine → LLM API → Tool Execution Loop → Terminal UI
```

The architecture follows a pipeline model with React/Ink for terminal rendering and Commander.js for CLI parsing.

---

## DIRECTORY MAP

### Core Engine

| Directory | Purpose | Key Files | Lines | Portability |
|---|---|---|---|---|
| `src/main.tsx` | Entrypoint — Commander.js CLI parser + React/Ink renderer | `main.tsx` | — | Low (terminal-specific) |
| `src/QueryEngine.ts` | Core LLM API engine — streaming, tool-call loops, thinking mode, retries, token counting | `QueryEngine.ts` | ~46K | Low (Anthropic-specific) |
| `src/Tool.ts` | Base tool type definitions — input schemas, permissions, progress state | `Tool.ts` | ~29K | **Medium** (pattern is portable) |
| `src/query/` | Query pipeline internals | Multiple files | — | Low (coupled to QueryEngine) |
| `src/replLauncher.tsx` | REPL session launcher | `replLauncher.tsx` | — | Low (terminal-specific) |
| `src/commands.ts` | Command registration & execution | `commands.ts` | ~25K | Medium (pattern is portable) |
| `src/tools.ts` | Tool registry & assembly | `tools.ts` | ~390 | **High** (tool assembly logic) |

### Tool System (~40 tools)

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/tools/FileReadTool/` | Read files (text, images, PDFs, notebooks) with line range support | `FileReadTool.ts`, `UI.tsx` | **High** |
| `src/tools/FileWriteTool/` | Create or overwrite files | `FileWriteTool.ts` | **High** |
| `src/tools/FileEditTool/` | Partial file modification via string replacement | `FileEditTool.ts` | **High** |
| `src/tools/GlobTool/` | Find files matching glob patterns | `GlobTool.ts` | **High** |
| `src/tools/GrepTool/` | Content search using ripgrep | `GrepTool.ts` | **High** |
| `src/tools/BashTool/` | Execute shell commands in bash | `BashTool.ts`, `UI.tsx` | Medium |
| `src/tools/PowerShellTool/` | Execute PowerShell commands (Windows) | `PowerShellTool.ts` | Low |
| `src/tools/REPLTool/` | Run code in REPL sessions | `REPLTool.ts` | Low |
| `src/tools/AgentTool/` | Spawn sub-agents with scoped tool access | `AgentTool.ts`, `loadAgentsDir.ts` | **High** |
| `src/tools/TeamCreateTool/` | Create teams of parallel agents | `TeamCreateTool.ts` | **High** |
| `src/tools/TeamDeleteTool/` | Remove team agents | `TeamDeleteTool.ts` | **High** |
| `src/tools/SendMessageTool/` | Send messages between agents | `SendMessageTool.ts` | **High** |
| `src/tools/EnterPlanModeTool/` | Switch to planning mode | `EnterPlanModeTool.ts`, `ExitPlanModeV2Tool.ts` | Medium |
| `src/tools/EnterWorktreeTool/` | Isolate work in git worktree | `EnterWorktreeTool.ts`, `ExitWorktreeTool.ts` | Low |
| `src/tools/TaskCreateTool/` | Create background tasks | `TaskCreateTool.ts` | **High** |
| `src/tools/TaskGetTool/` | Get task details | `TaskGetTool.ts` | **High** |
| `src/tools/TaskListTool/` | List all tasks | `TaskListTool.ts` | **High** |
| `src/tools/TaskUpdateTool/` | Update task status | `TaskUpdateTool.ts` | **High** |
| `src/tools/TaskOutputTool/` | Get task output | `TaskOutputTool.ts` | **High** |
| `src/tools/TaskStopTool/` | Stop running tasks | `TaskStopTool.ts` | **High** |
| `src/tools/WebFetchTool/` | Fetch content from URLs | `WebFetchTool.ts` | **High** |
| `src/tools/WebSearchTool/` | Search the web | `WebSearchTool.ts` | **High** |
| `src/tools/MCPTool/` | Invoke tools on MCP servers | `MCPTool.ts` | **High** |
| `src/tools/ListMcpResourcesTool/` | List MCP resources | `ListMcpResourcesTool.ts` | **High** |
| `src/tools/ReadMcpResourceTool/` | Read MCP resources | `ReadMcpResourceTool.ts` | **High** |
| `src/tools/McpAuthTool/` | Handle MCP server authentication | `McpAuthTool.ts` | **High** |
| `src/tools/ToolSearchTool/` | Discover deferred tools from MCP servers | `ToolSearchTool.ts` | **High** |
| `src/tools/LSPTool/` | Language Server Protocol operations | `LSPTool.ts` | **High** |
| `src/tools/SkillTool/` | Execute registered skills | `SkillTool.ts` | **High** |
| `src/tools/ScheduleCronTool/` | Create scheduled cron triggers | `CronCreateTool.ts`, `CronDeleteTool.ts`, `CronListTool.ts` | Medium |
| `src/tools/RemoteTriggerTool/` | Fire remote triggers | `RemoteTriggerTool.ts` | Medium |
| `src/tools/AskUserQuestionTool/` | Prompt user for input during execution | `AskUserQuestionTool.ts` | **High** |
| `src/tools/BriefTool/` | Generate brief summaries | `BriefTool.ts` | Medium |
| `src/tools/ConfigTool/` | Read/modify configuration | `ConfigTool.ts` | Medium |
| `src/tools/TodoWriteTool/` | Write to structured todo file | `TodoWriteTool.ts` | Medium |
| `src/tools/NotebookEditTool/` | Edit Jupyter notebook cells | `NotebookEditTool.ts` | Low |
| `src/tools/SleepTool/` | Pause execution (proactive mode) | `SleepTool.ts` | Low |
| `src/tools/SyntheticOutputTool/` | Generate structured output | `SyntheticOutputTool.ts` | Medium |
| `src/tools/WorkflowTool/` | Workflow automation scripts | `WorkflowTool.ts`, `bundled/` | Medium |
| `src/tools/SnipTool/` | History snipping for context management | `SnipTool.ts` | Medium |
| `src/tools/WebBrowserTool/` | Full browser automation | `WebBrowserTool.ts` | Low |

### Command System (~85 commands)

| Directory | Commands | Purpose | Portability |
|---|---|---|---|
| `src/commands/commit.ts`, `commit-push-pr.ts` | `/commit`, `/commit-push-pr` | Git commit with AI messages | Low |
| `src/commands/review.ts`, `security-review.ts` | `/review`, `/security-review` | AI-powered code review | **High** |
| `src/commands/advisor.ts` | `/advisor` | Architectural/design advice | **High** |
| `src/commands/bughunter/` | `/bughunter` | Find potential bugs | **High** |
| `src/commands/compact/` | `/compact` | Compress conversation context | **High** |
| `src/commands/resume/` | `/resume` | Restore previous sessions | **High** |
| `src/commands/session/` | `/session` | Manage sessions (list, switch, delete) | **High** |
| `src/commands/share/` | `/share` | Share sessions via link | Medium |
| `src/commands/export/` | `/export` | Export conversations to files | **High** |
| `src/commands/summary/` | `/summary` | Generate session summaries | Medium |
| `src/commands/clear/` | `/clear` | Clear conversation history | Medium |
| `src/commands/config/` | `/config` | View/modify settings | Medium |
| `src/commands/permissions/` | `/permissions` | Manage tool permission rules | **High** |
| `src/commands/memory/` | `/memory` | Manage persistent memory | **High** |
| `src/commands/add-dir/` | `/add-dir` | Add directory to project context | Medium |
| `src/commands/files/` | `/files` | List files in context | Medium |
| `src/commands/mcp/` | `/mcp` | Manage MCP server connections | **High** |
| `src/commands/plugin/` | `/plugin` | Install/remove/manage plugins | **High** |
| `src/commands/reload-plugins/` | `/reload-plugins` | Reload all plugins | Medium |
| `src/commands/skills/` | `/skills` | View/manage skills | **High** |
| `src/commands/doctor/` | `/doctor` | Environment diagnostics | Medium |
| `src/commands/cost/` | `/cost` | Display token usage and cost | **High** |
| `src/commands/stats/`, `status/` | `/stats`, `/status` | Session statistics and status | Medium |
| `src/commands/usage/`, `extra-usage/` | `/usage`, `/extra-usage` | Detailed API usage | Medium |
| `src/commands/context/` | `/context` | Visualize current context | Medium |
| `src/commands/model/` | `/model` | Switch active model | Medium |
| `src/commands/effort/` | `/effort` | Adjust response effort level | Medium |
| `src/commands/privacy-settings/` | `/privacy-settings` | Manage privacy/data settings | Medium |
| `src/commands/agents/` | `/agents` | Manage sub-agents | Medium |
| `src/commands/tasks/` | `/tasks` | Manage background tasks | **High** |
| `src/commands/plan/` | `/plan` | Enter planning mode | Medium |
| `src/commands/ultraplan.tsx` | `/ultraplan` | Generate detailed execution plan | Medium |
| `src/commands/login/`, `logout/` | `/login`, `/logout` | Authentication | Low |
| `src/commands/bridge/` | `/bridge` | IDE bridge connections | Low |
| `src/commands/desktop/`, `mobile/` | `/desktop`, `/mobile` | Device handoff | Low |
| `src/commands/teleport/` | `/teleport` | Transfer session between devices | Low |
| `src/commands/insights.ts` | `/insights` | Show codebase insights | Medium |
| `src/commands/thinkback/`, `thinkback-play/` | `/thinkback`, `/thinkback-play` | Replay AI thinking process | Low |

### Services Layer

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/services/api/` | Anthropic API client, file uploads, bootstrap | `claude.ts`, `errors.ts`, `bootstrap.ts` | Low (Anthropic-specific) |
| `src/services/mcp/` | MCP client connections and tool discovery | Multiple files | **High** |
| `src/services/oauth/` | OAuth 2.0 authentication flow | Multiple files | Low (Anthropic-specific) |
| `src/services/lsp/` | Language Server Protocol manager | Multiple files | **High** |
| `src/services/analytics/` | GrowthBook feature flags, telemetry | Multiple files | Low (Anthropic-specific) |
| `src/services/plugins/` | Plugin loader and marketplace | Multiple files | **High** |
| `src/services/compact/` | Conversation context compression | `snipCompact.ts`, `snipProjection.ts` | **High** |
| `src/services/policyLimits/` | Organization rate limits/quota | Multiple files | Low |
| `src/services/remoteManagedSettings/` | Enterprise managed settings sync | Multiple files | Low |
| `src/services/tokenEstimation.ts` | Token count estimation | `tokenEstimation.ts` | **High** |
| `src/services/teamMemorySync/` | Team knowledge synchronization | Multiple files | **High** |
| `src/services/extractMemories/` | Auto-extract memories from conversations | Multiple files | **High** |
| `src/services/SessionMemory/` | Session-level memory management | Multiple files | **High** |
| `src/services/AgentSummary/` | Agent work summaries | Multiple files | Medium |
| `src/services/PromptSuggestion/` | Suggested follow-up prompts | Multiple files | Medium |
| `src/services/MagicDocs/` | Documentation generation | Multiple files | Medium |
| `src/services/autoDream/` | Background ideation | Multiple files | Medium |
| `src/services/x402/` | x402 payment protocol | Multiple files | Low |
| `src/services/tips/` | Contextual usage tips | Multiple files | Low |
| `src/services/voice.ts`, `voiceStreamSTT.ts`, `voiceKeyterms.ts` | Voice input/output support | `voice.ts`, `voiceStreamSTT.ts` | Low |

### State Management

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/state/AppState.ts` | Global mutable state object | `AppState.ts` | Medium |
| `src/context/` | React context providers for notifications, stats, FPS | Multiple files | Medium |
| `src/state/` | Selectors, derived state functions | Multiple files | Medium |
| `src/state/onChangeAppState.ts` | Side-effects on state changes | `onChangeAppState.ts` | Medium |

### Memory System

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/memdir/` | Hierarchical memory directory (project/user/team) | `memdir.ts`, `paths.ts` | **High** |
| `src/services/extractMemories/` | Automatic memory extraction from conversations | Multiple files | **High** |
| `src/services/teamMemorySync/` | Team memory synchronization | Multiple files | **High** |
| `src/services/SessionMemory/` | Session-level memory | Multiple files | **High** |

### Skills System

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/skills/bundled/` | 16 bundled skills (batch, debug, loop, remember, simplify, verify, etc.) | `bundledSkills.ts` + individual skills | **High** |
| `src/skills/loadSkillsDir.ts` | Load skills from disk directories | `loadSkillsDir.ts` | **High** |
| `src/skills/mcpSkillBuilders.ts` | Create skills from MCP resources | `mcpSkillBuilders.ts` | **High** |
| `src/skills/bundledSkills.ts` | Registration of all bundled skills | `bundledSkills.ts` | **High** |

### Plugin System

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/plugins/` | Plugin implementations | `builtinPlugins.ts` | **High** |
| `src/services/plugins/` | Plugin loader and marketplace | Multiple files | **High** |
| `src/plugins/bundled/` | Bundled plugin code | Multiple files | Medium |
| `src/types/plugin.ts` | Plugin TypeScript types | `plugin.ts` | **High** |

### Coordinator / Multi-Agent

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/coordinator/` | Multi-agent orchestration | `coordinatorMode.ts` | Medium |
| `src/tasks/` | Task management (shell, agent, remote, teammate, dream) | Multiple files | **High** |

### Hooks (~80 hooks)

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/hooks/toolPermission/` | Tool permission checks | `PermissionContext.ts`, `handlers/`, `permissionLogging.ts` | **High** |
| `src/hooks/` | Permission, input, session, plugin, notification hooks | ~80 hook files | Medium |
| `src/hooks/notifs/` | Notification hooks (rate limits, deprecation warnings) | Multiple files | Low |

### Configuration & Schemas

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/schemas/` | Zod v4 schemas for user/project/org settings | Multiple files | **High** |
| `src/migrations/` | Config format change migrations | Multiple files | Medium |

### UI Components (~140 components)

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/components/` | ~140 Ink (React terminal) components | Multiple files | Low (Ink-specific) |
| `src/components/design-system/` | Design system primitives | Multiple files | Low (Ink-specific) |
| `src/screens/` | Full-screen UIs (REPL, Doctor, Resume) | `REPL.tsx`, `Doctor.tsx`, `ResumeConversation.tsx` | Low (terminal-specific) |

### Bridge / IDE Integration

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/bridge/` | Bidirectional IDE communication (VS Code, JetBrains) | `bridgeMain.ts`, `bridgeMessaging.ts`, `bridgePermissionCallbacks.ts`, `replBridge.ts`, `jwtUtils.ts`, `sessionRunner.ts` | Low (IDE-specific) |

### Other

| Directory | Purpose | Key Files | Portability |
|---|---|---|---|
| `src/voice/` | Voice input/output support | Multiple files | Low |
| `src/vim/` | Vim mode for input | Multiple files | Low |
| `src/keybindings/` | Keyboard shortcut configuration | Multiple files | Low |
| `src/cost-tracker.ts` | Token usage and cost tracking | `cost-tracker.ts`, `costHook.ts` | **High** |
| `src/context.ts` | System/user context collection | `context.ts` | Medium |
| `src/types/` | TypeScript type definitions | Multiple files | Medium |
| `src/utils/` | Utility functions | Multiple files | Medium |
| `src/constants/` | Constants and configuration values | Multiple files | Low |
| `src/entrypoints/` | Initialization logic | `cli.tsx`, `init.ts`, `mcp.ts`, `sdk/` | Medium |
| `src/ink/` | Ink renderer wrapper | Multiple files | Low |
| `src/buddy/` | Companion sprite (Easter egg) | Multiple files | Low |
| `src/native-ts/` | Native TypeScript utils | Multiple files | Low |
| `src/outputStyles/` | Output styling configuration | Multiple files | Low |
| `src/upstreamproxy/` | Proxy configuration | Multiple files | Low |
| `src/remote/` | Remote session support | Multiple files | Low |
| `src/server/` | Server mode | Multiple files | Medium |
| `src/bootstrap/` | Bootstrap and initialization | Multiple files | Medium |
| `src/moreright/` | Additional utilities | Multiple files | Low |
| `src/shims/` | Compatibility shims | Multiple files | Low |
| `src/assistant/` | Assistant-specific features | Multiple files | Low |
| `src/interactiveHelpers.tsx` | Interactive helper functions | `interactiveHelpers.tsx` | Low |
| `src/history.ts` | Session history management | `history.ts` | Medium |
| `src/Task.ts` | Task type definitions | `Task.ts` | Medium |
| `src/tasks.ts` | Task utilities | `tasks.ts` | Medium |
| `src/dialogLaunchers.tsx` | Dialog launch utilities | `dialogLaunchers.tsx` | Low |
| `src/projectOnboardingState.ts` | Project onboarding state tracking | `projectOnboardingState.ts` | Medium |
| `src/setup.ts` | Setup and initialization | `setup.ts` | Medium |

---

## TECH STACK

| Category | Technology |
|---|---|
| Runtime | Bun |
| Language | TypeScript (strict) |
| Terminal UI | React + Ink |
| CLI Parsing | Commander.js (`@commander-js/extra-typings`) |
| Schema Validation | Zod v4 |
| Code Search | ripgrep (via GrepTool) |
| Protocols | MCP SDK · LSP |
| API | Anthropic SDK |
| Telemetry | OpenTelemetry + gRPC |
| Feature Flags | GrowthBook |
| Auth | OAuth 2.0 · JWT · macOS Keychain |

---

## DESIGN PATTERNS

### Parallel Prefetch
MDM settings, keychain reads, and API preconnect fire in parallel as side-effects before heavy module evaluation.

### Lazy Loading
Heavy modules (OpenTelemetry ~400KB, gRPC ~700KB) are deferred via dynamic `import()` until first use.

### Agent Swarms
Sub-agents spawn via `AgentTool`, with `coordinator/` handling orchestration. `TeamCreateTool` enables team-level parallel work.

### Skill System
Defined in `skills/` and executed through `SkillTool`. Users can add custom skills.

### Plugin Architecture
Built-in and third-party plugins loaded through the `plugins/` subsystem.

### Feature Flags (Dead Code Elimination)
Bun's `bun:bundle` feature flags for build-time dead code elimination:
- `PROACTIVE` — Proactive agent mode
- `KAIROS` — Kairos subsystem
- `BRIDGE_MODE` — IDE bridge integration
- `DAEMON` — Background daemon mode
- `VOICE_MODE` — Voice input/output
- `AGENT_TRIGGERS` — Triggered agent actions
- `MONITOR_TOOL` — Monitoring tool
- `COORDINATOR_MODE` — Multi-agent coordinator
- `WORKFLOW_SCRIPTS` — Workflow automation scripts
- `HISTORY_SNIP` — History snipping
- `CONTEXT_COLLAPSE` — Context collapse
- `TERMINAL_PANEL` — Terminal panel
- `WEB_BROWSER_TOOL` — Web browser tool
- `UDS_INBOX` — UDS inbox
- `OVERFLOW_TEST_TOOL` — Overflow test tool
- `KAIROS_PUSH_NOTIFICATION` — Push notifications
- `KAIROS_GITHUB_WEBHOOKS` — GitHub webhooks

# VIVIM — Target Architecture Map

**Source**: `C:\0-BlackBoxProject-0\vivim-app-og\vivim-app`
**Type**: Monorepo — PWA, Server, Network Engine, SDK, Admin Panel
**Runtime**: Bun · **Frontend**: React 19 + TypeScript + TailwindCSS + Vite 7 · **Backend**: Express 5 + Prisma + PostgreSQL

---

## HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     VIVIM Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   PWA       │  │   Server    │  │   Network Engine        │ │
│  │  (React)    │◄─┤   (Bun)     │◄─┤   (LibP2P + CRDT)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                      │               │
│         └────────────────┴──────────────────────┘               │
│                          │                                      │
│              ┌───────────▼───────────┐                          │
│              │      SDK Core         │                          │
│              │  (TypeScript/Node)    │                          │
│              └───────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## MONOREPO STRUCTURE

### Root Level

| Path | Purpose | Key Files |
|---|---|---|
| `package.json` | Monorepo root — workspaces, shared scripts | `package.json` |
| `bunfig.toml` | Bun configuration | `bunfig.toml` |
| `.env.example` | Environment template | `.env.example` |
| `Dockerfile` | Container configuration | `Dockerfile` |
| `vercel.json` | Vercel deployment config | `vercel.json` |
| `setup-database.sql` | Database setup scripts | `setup-database.sql` |
| `startup.sh` | Startup script | `startup.sh` |
| `verify-system.ts` | System verification | `verify-system.ts` |
| `setup-redis.ts` | Redis setup | `setup-redis.ts` |
| `cleanup-sdk.ts` | SDK cleanup | `cleanup-sdk.ts` |
| `capture-dev-logs.ts` | Dev log capture | `capture-dev-logs.ts` |

### Workspaces

| Workspace | Purpose | Tech Stack | Port |
|---|---|---|---|
| `pwa/` | Progressive Web App — main user interface | React 19, TypeScript, TailwindCSS, Vite 7, Framer Motion, Zustand, TanStack Query | 5173 |
| `server/` | API Server — backend services & database | Bun, Express 5, Prisma ORM, PostgreSQL, Redis, Socket.IO, AI SDK (OpenAI, Anthropic) | 3000 |
| `network/` | Network Engine — P2P & Federation layer | LibP2P, Yjs CRDT, WebRTC, WebSockets, @noble/crypto, multiformats, uint8arrays | 1235 |
| `admin-panel/` | Admin Dashboard — platform management | React, TypeScript, Vite | 5174 |
| `sdk/` | SDK Core — developer toolkit | TypeScript/Node | — |

---

## SDK DEEP DIVE

**Path**: `sdk/`

The SDK is the core developer toolkit for building VIVIM-compatible applications. This is the **primary target** for vicode capability porting.

### SDK Structure

| Directory | Purpose | Key Files |
|---|---|---|
| `sdk/src/` | SDK source root | `index.ts` |
| `sdk/src/core/` | Core SDK functionality | — |
| `sdk/src/mcp/` | MCP (Model Context Protocol) integration | — |
| `sdk/src/skills/` | Skill system | — |
| `sdk/src/services/` | Service layer | — |
| `sdk/src/nodes/` | Node definitions | — |
| `sdk/src/graph/` | Graph/composition utilities | — |
| `sdk/src/protocols/` | Protocol implementations | — |
| `sdk/src/registry/` | Registry system | — |
| `sdk/src/tokens/` | Token management | — |
| `sdk/src/utils/` | Utility functions | — |
| `sdk/src/cli/` | CLI tools | — |
| `sdk/src/bun/` | Bun-specific integrations | — |
| `sdk/src/extension/` | Extension support | — |
| `sdk/src/apps/` | SDK applications | `public-dashboard/`, `publishing-agent/` |
| `sdk/examples/` | Usage examples | — |
| `sdk/bin/` | Binary scripts | — |
| `sdk/dist/` | Build output | — |

### SDK Key Files

| File | Purpose |
|---|---|
| `sdk/package.json` | SDK dependencies and scripts |
| `sdk/tsconfig.json` | TypeScript configuration |
| `sdk/vitest.config.ts` | Test configuration |
| `sdk/README.md` | SDK documentation |
| `sdk/BUN_INTEGRATION.md` | Bun integration guide |
| `sdk/SECURITY.md` | Security documentation |
| `sdk/CONTRIBUTING.md` | Contribution guidelines |

---

## PWA FRONTEND

**Path**: `pwa/`

Modern React-based progressive web application — the main user interface.

### Tech Stack
- React 19
- TypeScript
- TailwindCSS
- Vite 7
- Framer Motion
- Zustand (state management)
- TanStack Query (data fetching)

---

## API SERVER

**Path**: `server/`

Backend services, database, and API endpoints.

### Tech Stack
- Bun Runtime
- Express 5
- Prisma ORM
- PostgreSQL
- Redis
- Socket.IO
- AI SDK (OpenAI, Anthropic)

---

## NETWORK ENGINE

**Path**: `network/`

P2P networking, CRDT sync, and federation layer.

### Tech Stack
- LibP2P
- Yjs CRDT
- WebRTC
- WebSockets
- @noble/crypto
- multiformats
- uint8arrays

---

## ADMIN PANEL

**Path**: `admin-panel/`

Platform management and monitoring dashboard.

### Tech Stack
- React
- TypeScript
- Vite

---

## EXISTING AI/LLM CAPABILITIES

| Capability | Location | Status |
|---|---|---|
| AI SDK Integration | `server/` (OpenAI, Anthropic) | ✅ Active |
| MCP Support | `sdk/src/mcp/` | ✅ Present |
| Skills System | `sdk/src/skills/` | ✅ Present |
| Publishing Agent | `sdk/apps/publishing-agent/` | ✅ Active |
| Public Dashboard | `sdk/apps/public-dashboard/` | ✅ Active |
| Memory Context Engine | `VIVIM_MEMORY_CONTEXT_ENGINE_DESIGN.md` | 📋 Designed |
| OpenCore Strategy | `vivim_opencore_strategy_DRAFT.md` | 📋 Draft |
| Chat Bot Context | `CHAT BOT context and memory opus 4.6.md` | 📋 Documented |
| Conversation Rendering | `CONVERSATION_RENDERING_SUMMARY.md` | 📋 Documented |
| Frontend User Identification | `FRONTEND USER IDENTIFICATION opus 4.6 t .md` | 📋 Documented |
| Sentry Integration | `SENTRY_SETUP.md`, `SENTRY_ACCOUNT_SETUP.md` | ✅ Active |

---

## DOCUMENTATION & DESIGN ARTIFACTS

| File | Purpose |
|---|---|
| `VIVIM_MEMORY_CONTEXT_ENGINE_DESIGN.md` | Memory context engine design document |
| `vivim_opencore_strategy_DRAFT.md` | OpenCore strategy draft |
| `CHAT BOT context and memory opus 4.6.md` | Chatbot context and memory design |
| `CONVERSATION_RENDERING_SUMMARY.md` | Conversation rendering summary |
| `FRONTEND USER IDENTIFICATION opus 4.6 t .md` | Frontend user identification design |
| `QUICK_START_SENTRY.md` | Sentry quick start guide |
| `SENTRY_SETUP.md` | Sentry integration setup |
| `SENTRY_ACCOUNT_SETUP.md` | Sentry account configuration |
| `session-ses_2f30.md`, `session-ses_2fce.md` | Session documentation |
| `qwen-code-export-2026-03-27T16-26-50-918Z.md` | Code export documentation |

---

## SERVICE PORTS

| Service | Port | URL |
|---|---|---|
| PWA | 5173 | http://localhost:5173 |
| Admin Panel | 5174 | http://localhost:5174 |
| API Server | 3000 | http://localhost:3000 |
| Network WS | 1235 | ws://localhost:1235 |

---

## DEVELOPMENT COMMANDS

| Command | Purpose |
|---|---|
| `bun run dev` | Run all core services (PWA, Server, Network, Admin) |
| `bun run dev:core` | Run core services without dashboard/agent |
| `bun run dev:all` | Run all services including dashboard and agent |
| `bun run dev:debug` | Run with debug logging |
| `bun run dev:pwa` | PWA frontend only |
| `bun run dev:server` | API server only |
| `bun run dev:network:ws` | Network engine only |
| `bun run dev:admin` | Admin panel only |
| `bun run dev:dashboard` | Public dashboard |
| `bun run dev:agent` | Publishing agent |
| `bun run setup` | Install deps + setup database |
| `bun run setup:deps` | Install all dependencies |
| `bun run setup:db` | Generate database clients |
| `bun run build` | Build all packages |
| `bun run test` | Run all tests |

---

## CORE PRINCIPLES

| Principle | Description | Status |
|---|---|---|
| **🔐 Own Your AI** | Users maintain full control over their AI systems and data | ✅ Active |
| **🔗 Share Your AI** | Enable secure sharing of AI configurations and knowledge | 🚧 In Progress |
| **📈 Evolve Your AI** | Support continuous improvement and adaptation | ✅ Active |

---

## GAPS IDENTIFIED (vs VICODE)

| Capability | Vivim Status | Vicode Has | Priority |
|---|---|---|---|
| Hierarchical Memory System | 📋 Designed | ✅ Implemented | **Critical** |
| Auto Memory Extraction | ❌ Missing | ✅ Implemented | **Critical** |
| Team Memory Sync | ❌ Missing | ✅ Implemented | **High** |
| Session Memory | ❌ Missing | ✅ Implemented | **High** |
| Context Compression | ❌ Missing | ✅ Implemented | **High** |
| MCP Client Architecture | ✅ Present (basic) | ✅ Advanced | **Medium** |
| Plugin Loader | ❌ Missing | ✅ Implemented | **High** |
| Skill System | ✅ Present (basic) | ✅ Advanced | **Medium** |
| Task Management | ❌ Missing | ✅ Implemented | **High** |
| Permission System | ❌ Missing | ✅ Implemented | **High** |
| Agent Orchestration | ✅ Present (basic) | ✅ Advanced | **Medium** |
| Cost Tracking | ❌ Missing | ✅ Implemented | **Medium** |
| Token Estimation | ❌ Missing | ✅ Implemented | **Medium** |
| Session Resume/Export | ❌ Missing | ✅ Implemented | **High** |
| Tool Definition Pattern | ❌ Missing | ✅ Implemented | **High** |
| Config Schema System | ❌ Missing | ✅ Implemented | **Medium** |
| Memory Commands | ❌ Missing | ✅ Implemented | **High** |
| Prompt Suggestion | ❌ Missing | ✅ Implemented | **Medium** |
| Agent Summaries | ❌ Missing | ✅ Implemented | **Medium** |
| Context Visualization | ❌ Missing | ✅ Implemented | **Medium** |

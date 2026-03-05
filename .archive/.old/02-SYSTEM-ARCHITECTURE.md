# VIVIM — System Architecture
**Archived**: 2026-03-05 | **Status**: Implementation Reference

---

## Architecture Philosophy

VIVIM follows an **offline-first, user-sovereign** architecture. The system treats the user's local device as the primary source of truth, with the centralized server acting as a sync/backup layer and the P2P network (LibP2P) as an optional decentralized transport.

```
┌─────────────────────────────────────────────────┐
│                   PWA (React)                    │
│  Zustand │ TanStack Query │ Dexie (IndexedDB)    │
│          │ Yjs (CRDT) │ framer-motion            │
└────────────────────┬────────────────────────────┘
                     │ HTTP + WebSocket (Socket.IO)
┌────────────────────▼────────────────────────────┐
│              Backend (Bun + Express)             │
│  Prisma │ PostgreSQL+pgvector │ Redis │ Socket.IO│
│  Context Engine │ ACU Generator │ Librarian      │
└────────────────────┬────────────────────────────┘
                     │ (Future: LibP2P)
┌────────────────────▼────────────────────────────┐
│           P2P Network Layer (LibP2P)             │
│  @vivim/network-engine │ Yjs CRDT │ GossipSub   │
└─────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Tech Stack
- **Framework**: React 19 with Vite 7
- **Routing**: react-router-dom v7 (file-based routes via `pwa/src/app/routes.tsx`)
- **Styling**: TailwindCSS 4 + custom CSS files (Home.css, Capture.css)
- **Animations**: framer-motion 12
- **Icons**: lucide-react 0.575

### State Management Layers
| Layer | Tool | Purpose |
|-------|------|---------|
| Server state | TanStack Query 5 | All API fetching, caching, invalidation |
| Global UI state | Zustand 5 | Auth, identity, sync status, settings |
| Persistent offline state | Dexie 4 (IndexedDB) | Conversations, ACUs, context bundles |
| CRDT sync state | Yjs + y-indexeddb | Real-time / offline-first data |
| Real-time events | Socket.IO client | Server push, context updates |

### Key Stores
- `identity.store.ts` — DID, public key, authentication state
- `settings.store.ts` — User preferences, context engine settings
- `sync.store.ts` — Sync status, pending operations, conflicts
- `ui.store.ts` — Global UI flags, modals, notifications
- `useHomeUIStore.ts` — Home page filter/sort/view state

---

## Backend Architecture

### Server Entry: `server/src/server.js`
- Runtime: **Bun** (replaces Node.js)
- HTTP Server: Express 5
- WebSockets: Socket.IO 4.8 mounted on the same server
- ORM: Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg`)

### Database
- **Primary**: PostgreSQL 15+ with `pgvector` extension
  - Vector embeddings for semantic search (dimension: 384 or 1536)
  - JSONB for structured metadata fields
  - Full-text search via PostgreSQL native capabilities
- **Schema**: `server/prisma/schema.prisma` (60+ models, 1997 lines)
- **Migrations**: Applied via `bunx prisma migrate deploy`

### Context Engine (8-Layer Architecture)
The Context Engine assembles personalized system prompts from 6+ bundle types:

| Layer | Bundle Type | Description |
|-------|-------------|-------------|
| L0 | `identity_core` | User's DID, name, persistent identity facts |
| L1 | `global_prefs` | User preferences, language, behavior settings |
| L2 | `topic` | Detected topic profiles (TopicProfile model) |
| L3 | `entity` | Named entities tracked (EntityProfile model) |
| L4 | `conversation` | Current conversation context |
| L5 | `composite` | Pre-merged bundles from BundleCompiler |
| L6 | JIT Memories | Just-in-time retrieved Memory records |
| L7 | JIT ACUs | Semantically similar ACUs retrieved on-demand |

**Key Files:**
- `server/src/context/bundle-compiler.ts` — Compilation logic
- `server/src/context/context-assembler.ts` — Assembly orchestration
- `server/src/context/context-orchestrator.ts` — End-to-end orchestration
- `server/src/context/budget-algorithm.ts` — Token budget distribution
- `server/src/context/hybrid-retrieval.ts` — JIT retrieval from vector DB

### AI Provider Integration
Primary provider: **Z.AI** (via `ZAI_API_KEY`, `ZAI_BASE_URL`)

| Provider | Package | Key Env Var |
|----------|---------|-------------|
| Z.AI (default) | Custom adapter | `ZAI_API_KEY` |
| OpenAI | `@ai-sdk/openai` | `OPENAI_API_KEY` |
| Anthropic | `@ai-sdk/anthropic` | `ANTHROPIC_API_KEY` |
| Google | `@ai-sdk/google` | `GOOGLE_GENERATIVE_AI_KEY` |
| xAI (Grok) | `@ai-sdk/xai` | `XAI_API_KEY` |

### Capture Pipeline
```
POST /api/v1/capture
  → extractor.js (orchestration)
  → extractor-{provider}.js (Playwright scraping)
  → storage-adapter.js (Prisma upsert)
  → acu-generator.js (async ACU creation + embeddings + signing)
  → librarian-worker.ts (memory extraction, 30min cooldown)
```

Supported providers: ChatGPT, Claude, DeepSeek, Gemini, Grok, Kimi, Mistral, Qwen, Z.AI

---

## P2P / CRDT Layer

**Status**: Infrastructure present, not fully operational.

- **LibP2P**: `@vivim/network-engine` package
- **Listen addresses**: `/ip4/0.0.0.0/tcp/4001`, `/ip4/0.0.0.0/tcp/4002/ws`
- **CRDT**: Yjs (`Y.Doc`, `Y.Map`, `Y.Array`, `Y.Text`) with y-websocket transport
- **Automerge**: Installed, not actively used
- **GossipSub**: Planned for P2P message propagation

---

## Security Architecture

### Cryptography Stack
| Operation | Algorithm |
|-----------|-----------|
| Key exchange | ML-KEM-1024 (Kyber — quantum-resistant) |
| Message signing | Ed25519 |
| Symmetric encryption | AES-GCM |
| Identity | DID:key with Ed25519 |

### Authentication Layers
1. **Google OAuth** — via Passport.js (`passport-google-oauth20`)
2. **JWT** — Session tokens, stored in HTTP-only cookies
3. **DID Auth** — Decentralized identity verification
4. **API Keys** — Hashed keys for server-to-server and SDK usage
5. **2FA (TOTP)** — via `otplib` with QR code generation

---

## Deployment Configuration

```
# Vercel (PWA)
vercel.json — configured

# Docker (Server)
docker-compose.yml — PostgreSQL + Server

# CI/CD
server/.github/ — Basic GitHub Actions workflows
```

**Production Readiness**: NOT PRODUCTION READY
- Missing: Proper secrets, rate limiting enforcement, CDN, email service, DB backup strategy, load balancing

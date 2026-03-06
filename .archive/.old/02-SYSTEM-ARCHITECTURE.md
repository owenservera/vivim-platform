# VIVIM — System Architecture
**Archived**: 2026-03-05 | **Status**: Implementation Reference

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PWA (React 19 + Vite 7)             │
│  Zustand │ TanStack Query │ Dexie (IndexedDB) │ Yjs    │
│                  framer-motion │ TailwindCSS            │
└────────────────────────┬────────────────────────────────┘
              HTTP REST + WebSocket (Socket.IO)
┌────────────────────────▼────────────────────────────────┐
│             Backend (Bun + Express 5)                   │
│  Prisma 7 │ PostgreSQL + pgvector │ Redis │ Socket.IO   │
│  Context Engine │ ACU Generator │ Librarian Worker      │
│  Playwright Extractors │ AI SDK │ Sync Service          │
└────────────────────────┬────────────────────────────────┘
              (Future) LibP2P P2P Network
┌────────────────────────▼────────────────────────────────┐
│           P2P Network Layer (@vivim/network-engine)     │
│  LibP2P │ GossipSub │ Yjs CRDT │ Automerge (future)    │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Routing
- File: `pwa/src/app/routes.tsx`
- Library: `react-router-dom` v7

| Route | Component | Notes |
|-------|-----------|-------|
| `/` | Home.tsx | Main feed + AI chat |
| `/login` | Login.tsx | Google OAuth |
| `/capture` | Capture.tsx | URL-based capture |
| `/simple-capture` | CaptureSimple.tsx | Simplified flow |
| `/conversation/:id` | ConversationView.tsx | Single conversation |
| `/settings` | Settings.tsx | User & AI settings |
| `/analytics` | Analytics.tsx | Usage insights |
| `/bookmarks` | Bookmarks.tsx | Saved items |
| `/search` | Search.tsx | Global search |
| `/ai-conversations` | AIConversationsPage.tsx | AI chat list |
| `/conversation/:id/share` | Share.tsx | Share dialog |
| `/receive/:code` | Receive.tsx | Receive shared content |
| `/account` | Account.tsx | Account management |
| `/errors` | ErrorDashboard.tsx | Error tracking |

### State Management Layers

| Layer | Tool | Purpose |
|-------|------|---------|
| Server state | TanStack Query 5 | API fetching, background refetch, caching |
| Global UI state | Zustand 5 | Auth, identity, sync status, settings |
| Persistent offline state | Dexie 4 (IndexedDB) | Conversations, ACUs, context bundles |
| CRDT real-time sync | Yjs + y-indexeddb | Offline-first collaborative data |
| Real-time push | Socket.IO client | Server-push for context updates, sync |

### Zustand Stores
| Store | File | Owns |
|-------|------|------|
| Identity | `identity.store.ts` | DID, public key, auth status |
| Settings | `settings.store.ts` | User preferences, context engine settings |
| Sync | `sync.store.ts` | Sync status, pending operations, conflicts |
| UI | `ui.store.ts` | Global UI flags, modals, notifications |
| Home UI | `useHomeUIStore.ts` | Home page filter/sort/view state |

### TanStack Query Keys
- `conversations:list` / `conversations:detail`
- `memories:list`
- `context:bundles`
- `feed:personalized`
- `user:profile`
- `ai:settings`
- `acus:search`

---

## Backend Architecture

### Request Lifecycle
```
HTTP Client
  → Express Router (versioned: /api/v1, /api/v2, /api/admin)
  → Middleware (auth, rate-limit, cors, logging)
  → Route Handler
  → Service Layer (business logic)
  → Prisma ORM
  → PostgreSQL
```

### Service Layer Map

| Service | File | Responsibility |
|---------|------|---------------|
| Capture | `services/extractor.js` | Orchestrates Playwright extraction |
| Storage Adapter | `services/storage-adapter.js` | Persists captured data via Prisma |
| ACU Generator | `services/acu-generator.js` | Creates ACUs, generates embeddings, signs with Ed25519 |
| ACU Memory Pipeline | `services/acu-memory-pipeline.ts` | Links ACUs to memory extraction |
| Socket Service | `services/socket.ts` | WebSocket events, CRDT sync write-back |
| Sync Service | `services/sync-service.js` | HLC-timestamped sync operations |
| Queue Service | `services/queue-service.js` | In-memory job queue (p-queue, 5 concurrent) |
| Sharing Policy | `services/sharing-policy-service.js` | Access control for shared content |
| Sharing Intent | `services/sharing-intent-service.js` | Share link generation |
| Identity Service | `services/identity-service.ts` | DID creation, device registration |
| MFA Service | `services/mfa-service.js` | TOTP generation and verification |
| Social Service | `services/social-service.ts` | Friends, follows, groups, teams |
| Circle Service | `services/circle-service.js` | Circle CRUD and membership |
| Portability Service | `services/portability-service.js` | Data export/import |
| Feed Service | `services/feed-service.js` | Feed ranking and personalization |
| Moderation Service | `services/moderation-service.js` | Content flagging and review |
| Admin Network Service | `services/admin-network-service.js` | P2P network telemetry (STUBBED) |

### Context Engine Architecture

```
User Request (chat message)
  → ContextOrchestrator
  → ContextAssembler
      ├── identity_core bundle (vivim-identity-context.json)
      ├── global_prefs bundle (user settings)
      ├── topic bundles (TopicProfile model)
      ├── entity bundles (EntityProfile model)
      ├── conversation bundle (current thread)
      └── composite bundle (BundleCompiler)
  → BudgetAlgorithm (token allocation across layers)
  → HybridRetrieval (JIT: ACUs + Memories via pgvector)
  → BundleCompiler → compiledPrompt + tokenCount
  → AI SDK (streaming response)
```

Key files:
- `context/bundle-compiler.ts` — Final compilation
- `context/context-assembler.ts` — Bundle assembly
- `context/context-orchestrator.ts` — Top-level orchestration
- `context/budget-algorithm.ts` — Token budget distribution
- `context/hybrid-retrieval.ts` — pgvector similarity search
- `context/query-optimizer.ts` — Query optimization
- `context/prefetch-engine.ts` — Prefetch for fast first response
- `context/context-thermodynamics.ts` — Adaptive budget tuning
- `context/librarian-worker.ts` — Cron: memory extraction (30min cooldown)

---

## Database Architecture

### PostgreSQL Schema Highlights
- **Total Models**: 60+ in `server/prisma/schema.prisma` (1,997 lines)
- **Extension**: `pgvector` for float[] vector similarity search
- **Key Models**: User, Conversation, Message, AtomicChatUnit, Memory, Circle, ContextBundle, Notebook, SharingPolicy, SharingIntent

### Multiple Schema Files (Phase-Based)
| File | Purpose |
|------|---------|
| `schema.prisma` | **CANONICAL** — current consolidated schema |
| `schema-extended.prisma` | Extended version |
| `schema-phase2-circles.prisma` | Phase 2 additions |
| `schema-phase3-sharing.prisma` | Phase 3 additions |
| `schema-phase4-discovery.prisma` | Phase 4 additions |
| `schema-phase5-portability.prisma` | Phase 5 additions |

**Note**: Only `schema.prisma` should be used going forward. Others are historical.

### Applied Migrations
| Migration | Date |
|-----------|------|
| `20260211045216_initial_schema` | 2026-02-11 |
| `20260211073604_add_context_models` | 2026-02-11 |

---

## Security Architecture

### Auth Flow
1. **Google OAuth** → Passport.js → Express session → JWT cookie
2. **DID Auth** → Ed25519 keypair generated client-side → registered server-side → `authenticateDID` middleware
3. **API Keys** → Hashed with SHA-256, stored as `keyHash`, passed via `X-API-Key` header
4. **Admin Auth** → `requireAdminAuth` middleware (role check + IP allowlist)
5. **2FA** → TOTP via `otplib`, QR code via `qrcode`, 10 backup codes

### Middleware Auth Map
| Route Prefix | Auth Type |
|-------------|-----------|
| `/api/v1/account/*` | JWT (`requireAuth`) |
| `/api/v1/conversations/*` | JWT (`requireAuth`) |
| `/api/v1/acus/*` | Optional JWT |
| `/api/v1/memory/*` | DID (`authenticateDID`) |
| `/api/v2/context/*` | DID or None |
| `/api/v2/circles/*` | DID |
| `/api/v2/social/*` | DID |
| `/api/v2/sharing/*` | DID |
| `/api/v2/moderation/*` | Moderator role |
| `/api/admin/*` | Admin role |

### Crypto Stack
| Operation | Algorithm | Status |
|-----------|-----------|--------|
| Key exchange | ML-KEM-1024 (Kyber) | ✅ Implemented |
| Message signing | Ed25519 | ✅ Implemented |
| Symmetric encryption | AES-GCM | ✅ Implemented |
| Post-quantum signing | CRYSTALS-Dilithium | ⚠️ Stubbed (WASM needed) |

---

## Real-Time Architecture (Socket.IO)

### Server-Side Events (`server/src/services/socket.ts`)
| Event | Direction | Handler |
|-------|-----------|---------|
| `connection` | Inbound | JWT auth, room join |
| `disconnect` | Inbound | Cleanup |
| `context:update` | Bidirectional | Context bundle refresh |
| `sync:request` | Inbound | CRDT sync initiation |
| `sync:response` | Outbound | CRDT sync data |
| `sync:push` | Inbound | **Write-back to Postgres** (✅ Fixed) |

### Client-Side Listener (`pwa/src/components/GlobalSocketListener.tsx`)
- Subscribes to: `connection`, `context:update`, `sync:response`
- Integrated into app root

---

## P2P Network Layer (Future)

**Package**: `@vivim/network-engine`

- **Status**: Infrastructure ready, NOT operational (no bootstrap peers configured)
- **Protocol**: LibP2P
- **Listen**: `/ip4/0.0.0.0/tcp/4001`, `/ip4/0.0.0.0/tcp/4002/ws`
- **Messaging**: GossipSub (planned)
- **CRDT Transport**: Yjs over y-websocket (active), y-indexeddb (offline persistence)
- **Bootstrap Peers**: `P2P_BOOTSTRAP_PEERS` env var — currently empty

---

## Deployment

| Component | Platform | Config |
|-----------|---------|--------|
| PWA | Vercel | `vercel.json` |
| Server | Docker / Any Node host | `docker-compose.yml` |
| Database | PostgreSQL (managed or self-hosted) | `DATABASE_URL` |
| Redis | Optional | `REDIS_URL` |
| CI/CD | GitHub Actions | `server/.github/` |

**Production Gate Items** (must fix before going live):
1. Rotate `SESSION_SECRET`, `JWT_SECRET`, `ZAI_API_KEY`
2. Configure `CORS_ORIGINS` to production domains only
3. Enable `DATABASE_SSL_REQUIRED=true`
4. Set `P2P_BOOTSTRAP_PEERS` for P2P functionality
5. Enforce rate limiting across all endpoints
6. Set up monitoring/alerting (Sentry DSN)
7. Configure automated database backups
8. Set up CDN for static assets

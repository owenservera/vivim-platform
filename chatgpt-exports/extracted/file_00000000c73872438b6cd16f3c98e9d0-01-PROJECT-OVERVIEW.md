# VIVIM — Project Overview
**Archived**: 2026-03-05 | **Status**: Historical Snapshot (Post Socket-Sync & Security Fix Session)

---

## What is VIVIM?

VIVIM is a **personal AI memory and social platform** that gives users true ownership over their AI conversations. It captures, enriches, and connects AI interactions from any provider (ChatGPT, Claude, Gemini, etc.) into a unified, searchable, shareable intelligence graph.

**North Star**: *"VIVIM is the default place where people interact with AI content socially — where users own their intelligence, can import from any provider, and share, fork, and build on each other's AI conversations."*

### Core Value Propositions
1. **Data Ownership** — Every conversation you've had with any AI belongs to you: importable, exportable, fully portable.
2. **Atomic Chat Units (ACUs)** — Conversations are broken into granular, cryptographically signed, shareable units with full provenance tracking.
3. **Multi-Layer Context Engine** — An 8-layer personalization system that learns from your AI interactions and makes future responses better over time.
4. **Social AI Layer** — Share, fork, and continue shared AI threads with granular permissions, circles, and feed discovery.
5. **Decentralized Identity** — DID-based identity with Ed25519 keypairs and quantum-resistant key exchange (ML-KEM-1024/Kyber).

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend (PWA) | React 19, Vite 7, TailwindCSS 4, Zustand 5, TanStack Query 5, Dexie 4, Yjs, framer-motion 12 |
| Backend | Bun runtime, Express 5, Prisma 7, PostgreSQL (pgvector), Redis, Socket.IO 4.8 |
| AI SDKs | Vercel AI SDK 6 — `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/xai` |
| Capture | Playwright 1.58, Cheerio, playwright-extra + stealth |
| Cryptography | TweetNaCl (Ed25519), ML-KEM-1024 (Kyber), AES-GCM |
| SDK | `@vivim/sdk`, `@vivim/network-engine` (LibP2P) |

---

## Monorepo Structure

```
vivim-app/
├── pwa/                          # React PWA frontend (Vite)
│   ├── src/
│   │   ├── app/routes.tsx        # Route definitions
│   │   ├── pages/               # Route-level page components
│   │   ├── components/          # Shared components (ui/, unified/, ios/, admin/)
│   │   ├── stores/              # Zustand state stores
│   │   └── lib/                 # Utilities, crypto, storage-v2
├── server/                      # Bun + Express backend
│   ├── src/
│   │   ├── server.js            # Entry point
│   │   ├── routes/              # API route handlers (organized by domain)
│   │   ├── services/            # Business logic services
│   │   ├── extractors/          # Provider-specific Playwright scrapers
│   │   ├── context/             # Context Engine (bundle types, budget, retrieval)
│   │   ├── workers/             # Background job workers
│   │   └── middleware/          # Auth, rate limiting, logging
│   └── prisma/
│       ├── schema.prisma        # Main schema (60+ models, 1997 lines)
│       └── seed-real-data.ts    # Database seeding
├── packages/
│   ├── sdk/                     # @vivim/sdk — JavaScript client SDK
│   └── network-engine/          # @vivim/network-engine — LibP2P P2P layer
└── .archive/
    ├── .current/                # Latest audit snapshots
    └── .dev/                    # Development documents (this folder)
```

---

## Development Entry Points

| Service | Command | Port |
|---------|---------|------|
| PWA Dev Server | `bun run dev:pwa` | 5173 |
| API Server | `bun run dev:server` | 3000 |
| Full Stack | `bun run dev` | Both |
| Database migrate | `bun run db:migrate` | — |
| Database seed | `bun run db:seed` | — |

---

## Session Work Log (2026-03-05)

### ✅ Completed This Session
| Task | File | Severity |
|------|------|---------|
| WebSocket write-back (Prisma transaction for sync push) | `server/src/services/socket.ts` | CRITICAL |
| SQL injection patch (`$queryRaw` allowlist) | `server/src/routes/admin/database.js` | CRITICAL |
| Real disk/memory/CPU metrics in admin | `server/src/routes/admin/system.js` | HIGH |
| Real DB stats via Prisma introspection | `server/src/routes/admin/database.js` | HIGH |
| CRDT conflict resolution wired to sync-service | `server/src/routes/admin/crdt.js` | MEDIUM |
| Archived card opacity bug (CSS) | `pwa/src/pages/Home.css` | LOW |
| `formatDate` returns "Unknown" for invalid dates | `pwa/src/pages/Home.tsx` | LOW |
| Space key support for card keyboard nav | `pwa/src/pages/Home.tsx` | MEDIUM |
| ARIA labels on stats pills (sr-only) | `pwa/src/pages/Home.tsx` | MEDIUM |
| `prefers-reduced-motion` CSS fallbacks | `pwa/src/pages/Home.css` | LOW |
| Standard `line-clamp` alongside `-webkit-line-clamp` | `pwa/src/pages/Home.css` | LOW |

### ⚠️ Remaining Backlog
| Task | File | Priority |
|------|------|---------|
| Admin Network Telemetry (libp2p integration) | `server/src/services/admin-network-service.js` | HIGH |
| `exportAllData` Zustand action | `pwa/src/stores/appStore.ts` | MEDIUM |
| Desktop Sidebar component | `pwa/src/components/SideNav.tsx` | MEDIUM |
| Desktop Responsive Layout | `pwa/src/components/unified/ResponsiveLayout.tsx` | MEDIUM |
| Post-quantum WASM crypto (Kyber/Dilithium) | `pwa/src/lib/storage-v2/secure-crypto.ts` | LOW |
| Blockchain anchoring verification | `pwa/src/lib/storage-v2/privacy-manager.ts` | LOW |
| Feed analytics telemetry sync | `POST /api/v2/feed/analytics` | LOW |
| Cache invalidation refactor (use InvalidationService) | `server/src/services/unified-context-service.ts` | LOW |

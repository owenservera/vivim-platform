# VIVIM — Project Overview
**Archived**: 2026-03-05 | **Status**: Historical Snapshot (Pre-Socket-Sync-Fix Session)

---

## What is VIVIM?

VIVIM is a **personal AI memory and social platform** that gives users true ownership over their AI conversations. It captures, enriches, and connects AI interactions from any provider (ChatGPT, Claude, Gemini, etc.) into a unified, searchable, shareable intelligence graph.

**Core Value Propositions:**
1. **Data Ownership**: Every conversation you've had with any AI belongs to you — importable, exportable, portable.
2. **Atomic Chat Units (ACUs)**: Conversations are broken into granular, signed, shareable units with full provenance tracking.
3. **Multi-Layer Context Engine**: An 8-layer personalization system that learns from your AI interactions and makes future responses better over time.
4. **Social AI Layer**: Share, fork, and continue shared AI threads with permissions, circles, and feed discovery.
5. **Decentralized Identity**: DID-based identity with Ed25519 keypairs and quantum-resistant key exchange (ML-KEM-1024).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend (PWA) | React 19, Vite 7, TailwindCSS 4, Zustand 5, TanStack Query 5, Dexie 4, Yjs, framer-motion |
| Backend | Bun runtime, Express 5, Prisma 7, PostgreSQL (pgvector), Redis, Socket.IO |
| AI SDKs | Vercel AI SDK 6 (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/xai`) |
| Capture | Playwright 1.58, Cheerio |
| Crypto | TweetNaCl (Ed25519), ML-KEM-1024 (Kyber), AES-GCM |
| SDK | `@vivim/sdk`, `@vivim/network-engine` (LibP2P) |

---

## Monorepo Structure

```
vivim-app/
├── pwa/                  # React PWA frontend
│   ├── src/pages/        # Route-level pages
│   ├── src/components/   # Shared components
│   ├── src/stores/       # Zustand stores
│   └── src/lib/          # Utilities, crypto, storage
├── server/               # Bun + Express backend
│   ├── src/routes/       # API route handlers
│   ├── src/services/     # Business logic
│   ├── src/extractors/   # Provider-specific scrapers
│   ├── src/context/      # Context engine
│   └── src/workers/      # Background job workers
├── packages/
│   ├── sdk/              # @vivim/sdk
│   └── network-engine/   # @vivim/network-engine (LibP2P)
└── .archive/             # Documentation snapshots
```

---

## Entry Points

| Service | Command | Port |
|---------|---------|------|
| PWA Dev Server | `bun run dev:pwa` | 5173 |
| API Server | `bun run dev:server` | 3000 |
| Full Stack | `bun run dev` | Both |

---

## Key Completed Work (as of 2026-03-05 Session)

- ✅ WebSocket write-back logic implemented (`socket.ts` — `handleSyncPush`)
- ✅ SQL injection vulnerability patched (`admin/database.js`)
- ✅ Real system metrics wired in admin panel (`admin/system.js`)
- ✅ CRDT conflict resolution connected to `sync-service.js` (`admin/crdt.js`)
- ✅ Frontend UX bugs fixed: archived card opacity, date fallback, Space key nav, ARIA labels, reduced motion, CSS compatibility

## Remaining Work

- ⚠️ Real Admin Network Telemetry (libp2p integration in `admin-network-service.js`)
- ⚠️ `exportAllData` in Zustand `appStore.ts` needs implementation
- ⚠️ Desktop Sidebar (`SideNav.tsx`, `ResponsiveLayout.tsx`)
- ⚠️ Post-quantum crypto WASM modules (Kyber/Dilithium)
- ⚠️ Blockchain anchoring verification in `privacy-manager.ts`
- ⚠️ Analytics telemetry sync (`POST /api/v2/feed/analytics`)

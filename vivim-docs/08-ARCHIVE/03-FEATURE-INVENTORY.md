# VIVIM — Feature Inventory
**Archived**: 2026-03-05 | **Basis**: `08A-feature-implementation-audit.md`

---

## Feature Completion Summary

| Feature | Status | Completion |
|---------|--------|-----------|
| Conversation Capture (9 providers) | ✅ WORKING | 100% |
| ACU Generation + Processing | ✅ WORKING | 100% |
| ACU Signing (Ed25519) | ⚠️ PARTIAL | 75% (blockchain verification missing) |
| Share Link / Access Control | ✅ WORKING | 100% |
| Fork / Derivation (ACU + Conversation) | ✅ WORKING | 100% |
| Memory Extraction (Librarian) | ⚠️ PARTIAL | 75% (ad-hoc triggering needs work) |
| Memory Consolidation | ✅ WORKING | 100% |
| Context Engine (6+ bundle types) | ✅ WORKING | 100% |
| Context Cockpit UI | ✅ WORKING | 100% |
| Circles CRUD + Membership | ✅ WORKING | 100% |
| Groups CRUD | ✅ WORKING | 100% |
| Teams + Channels | ✅ WORKING | 100% |
| Friends (bidirectional) | ✅ WORKING | 100% |
| Follows (one-way) | ✅ WORKING | 100% |
| Notebooks + ACU Linking | ✅ WORKING | 100% |
| User Onboarding | ⚠️ PARTIAL | 75% (edge cases need testing) |
| Google OAuth | ✅ WORKING | 100% |
| DID Identity + Device Registration | ✅ WORKING | 100% |
| 2FA (TOTP) | ✅ WORKING | 100% |
| BYOK (Bring Your Own Key) | ✅ WORKING | 100% |
| Feed / Discovery | ✅ WORKING | 100% |
| Moderation System | ✅ WORKING | 100% |
| Analytics / Insights | ✅ WORKING | 100% |
| P2P / CRDT Sync | ⚠️ PARTIAL | 50% (infra ready, not operational) |
| Data Portability (Export/Import) | ✅ WORKING | 100% |
| Admin Panel | ✅ WORKING | 100% |

---

## 1. Conversation Capture Pipeline (100%)

### Supported Providers
| Provider | Extractor | Status |
|----------|-----------|--------|
| ChatGPT | `extractor-chatgpt.js` | WORKING |
| Claude | `extractor-claude.js` | WORKING |
| DeepSeek | `extractor-deepseek.js` | WORKING |
| Gemini | `extractor-gemini.js` | WORKING |
| Grok | `extractor-grok.js` | WORKING |
| Kimi | `extractor-kimi.js` | WORKING |
| Mistral | `extractor-mistral.js` | WORKING |
| Qwen | `extractor-qwen.js` | WORKING |
| Z.AI | `extractor-zai.js` | WORKING |

### API Endpoints
- `POST /api/v1/capture/capture` — Single conversation capture
- `POST /api/v1/capture/capture/bulk` — Bulk capture
- `POST /api/v1/capture/capture-sync/init` — Sync capture init
- `GET /api/v1/capture/detect-provider` — Auto-detect provider from URL
- `GET /api/v1/capture/providers` — List supported providers
- `POST /api/v1/capture/handshake` — Quantum-resistant key exchange

### Pipeline Flow
1. POST /capture/capture received
2. `extractor.js` orchestrates provider detection
3. `extractor-{provider}.js` runs Playwright scrape
4. `storage-adapter.js` persists to Prisma (Conversation + Messages)
5. `acu-generator.js` queued for async ACU creation
6. `librarian-worker.ts` picks up for memory extraction (30min cooldown)

---

## 2. ACU Generation (100%)

### Components
- `server/src/services/acu-generator.js` — Main creation logic
- `server/src/services/acu-processor.js` — Post-processing
- `server/src/services/acu-memory-pipeline.ts` — Memory integration

### Per-ACU Process
1. Parse message content into meaningful chunks
2. Assign `type`, `category`, `origin` metadata
3. Generate vector embedding (384 or 1536 dimensions)
4. Sign with Ed25519 (`signature = nacl.sign(hash, privateKey)`)
5. Compute content hash (SHA-256)
6. Store in `AtomicChatUnit` table with parent conversation/message reference

### ACU Scoring
- `qualityOverall` — Composite quality score (0–1)
- `contentRichness` — Depth and information density
- `structuralIntegrity` — Organization and coherence
- `uniqueness` — Rarity relative to existing ACUs
- `rediscoveryScore` — Predicted future value

---

## 3. Context Engine (100%)

### Bundle Types
| Bundle Type | Source | Purpose |
|-------------|--------|---------|
| `identity_core` | `vivim-identity-context.json` + User model | Stable user identity facts |
| `global_prefs` | User.settings JSON | Behavior preferences |
| `topic` | TopicProfile model | Detected topic interests |
| `entity` | EntityProfile model | Named entity tracking |
| `conversation` | Current conversation messages | Active thread context |
| `composite` | BundleCompiler merge | Pre-merged cross-layer bundles |
| JIT ACUs | pgvector search | Semantically similar past ACUs |
| JIT Memories | pgvector search | Relevant extracted memories |

### Token Budget Algorithm
- Default max: 12,000 tokens
- Range: 4,096 – 50,000 tokens (configurable)
- Layers assigned elasticity scores (willingness to shrink under budget pressure)
- JIT retrieval activated only if budget permits

### User Settings Exposed (ContextCockpitPage)
- `maxContextTokens` — 4096–50000
- `topicSimilarityThreshold` — default 0.35
- `entitySimilarityThreshold` — default 0.40
- `acuSimilarityThreshold` — default 0.35
- `memorySimilarityThreshold` — default 0.40
- Toggle: predictions, JIT retrieval, compression, entity/topic context

---

## 4. Sharing System (100%)

### Share Types
- **Link shares** — Unique `linkCode`, optional password, optional expiry, optional max views
- **Circle shares** — All circle members with role-based permissions
- **Direct shares** — Specific users by DID

### Granular Permissions
| Permission | Description |
|------------|-------------|
| `canView` | Read access |
| `canAnnotate` | Add comments to ACU |
| `canRemix` | Fork and modify |
| `canReshare` | Share further |

### API
- `POST /api/v2/sharing/policies` — Create policy
- `GET|PUT|DELETE /api/v2/sharing/policies/:id` — Manage policy
- `POST /api/v2/sharing/share` — Create share intent
- `GET /api/v2/sharing/share/:shareId` — Resolve share (public)
- `POST /api/v2/sharing/revoke/:shareId` — Revoke

---

## 5. Social Layer (100%)

### Social Graph
| Feature | Endpoint | Description |
|---------|----------|-------------|
| Friends | `/api/v2/social/friends/*` | Bidirectional + block |
| Follows | `/api/v2/social/follow/*` | One-way + mute |
| Groups | `/api/v2/social/groups/*` | Open/closed communities |
| Teams | `/api/v2/social/teams/*` | Structured organizations |
| Channels | `/api/v2/social/teams/:id/channels` | Team sub-channels |
| Circles | `/api/v2/circles/*` | Trust-based inner circles |

---

## 6. Memory System (75%)

### Memory Types
- `FACTUAL` — Verified facts about the user
- `PREFERENCE` — Detected user preferences
- `EPISODIC` — Specific past events/conversations
- `RELATIONSHIP` — Interpersonal relationships

### Extraction (Working)
- Triggered by: Librarian Worker (30min after conversation idle)
- LLM analyzes conversation → extracts memories → stores with confidence score
- Auto-links to source conversation/ACU

### Consolidation (Working)
- Manual trigger: `POST /api/v1/memory/consolidate`
- Merges similar memories, updates importance scores, prunes low-value entries

### Gap
- No TTL/expiry on memories
- Memory worker ad-hoc triggering not fully implemented

---

## 7. Data Portability (100%)

### Export Formats
- JSON, ActivityPub, ATProtocol, Markdown, HTML

### API
- `POST /api/v2/portability/export` — Request export
- `GET /api/v2/portability/export/:id` — Check export status
- `POST /api/v2/portability/import` — Import external data
- `POST /api/v2/portability/migrate` — Migrate from another platform
- `GET /api/v1/account/me/data/export` — Account data export

---

## 8. Admin Panel (100%)

### Admin Sections
| Section | Route | Notes |
|---------|-------|-------|
| System Stats | `GET /api/admin/system/stats` | ✅ Real data (os module + Prisma) |
| System Health | `GET /api/admin/system/health` | ✅ Real service checks |
| Database Tables | `GET /api/admin/database/tables` | ✅ Real — pg_stat_user_tables |
| DB Query Runner | `POST /api/admin/database/query` | ✅ Secured — allowlist only |
| DB Stats | `GET /api/admin/database/stats` | ✅ Real — pg_database_size |
| P2P Nodes | `GET /api/admin/network/nodes` | ⚠️ Stubbed (no libp2p) |
| CRDT Documents | `GET /api/admin/crdt/documents` | ✅ Working |
| CRDT Resolve | `POST /api/admin/crdt/documents/:id/resolve` | ✅ Wired to sync-service |
| PubSub Topics | `GET /api/admin/pubsub/topics` | ✅ Working |
| Data Flows | `GET /api/admin/dataflow/flows` | ✅ Working |

---

## 9. P2P / CRDT Sync (50%)

### What Works
- Yjs CRDT types (`Y.Doc`, `Y.Map`, `Y.Array`, `Y.Text`) active in PWA
- `y-indexeddb` for offline persistence
- `y-websocket` for server relay
- Socket.IO `sync:push` write-back to Postgres (✅ Fixed this session)
- `sync-service.js` with HLC timestamping

### What's Missing
- LibP2P bootstrap peers not configured
- `@vivim/network-engine` not fully integrated
- P2P peer authentication not implemented
- Admin network telemetry returns empty arrays (stub)

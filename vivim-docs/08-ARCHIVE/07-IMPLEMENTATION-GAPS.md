# VIVIM — Implementation Gaps & Bug Tracker
**Archived**: 2026-03-05 | **Basis**: `04-IMPLEMENTATION-GAPS.md` + Session Work

---

## Status Legend
- ✅ **FIXED** — Resolved this session (2026-03-05)
- ⚠️ **OPEN** — Not yet addressed
- 🔴 **CRITICAL** — Data loss or security risk
- 🟡 **HIGH** — Core functionality broken
- 🟢 **MEDIUM/LOW** — UX broken or pattern issue

---

## CRITICAL — Security & Data Integrity

### ✅ VIVIM-GAP-014: WebSocket Write-Back (FIXED)
| Field | Value |
|-------|-------|
| **File** | `server/src/services/socket.ts:205` |
| **Problem** | `handleSyncPush` received CRDT sync payloads via Socket.IO but did NOT persist them to PostgreSQL. Changes were logged then discarded — causing silent data loss for offline users who came back online. |
| **Fix Applied** | Implemented Prisma transaction-based write-back: upserts conversations, messages, and ACUs within a single atomic transaction on `sync:push` events. |
| **Severity** | 🔴 CRITICAL — DATA MISMATCH |

### ✅ VIVIM-GAP-015: SQL Injection in Admin Query Runner (FIXED)
| Field | Value |
|-------|-------|
| **File** | `server/src/routes/admin/database.js:55` |
| **Problem** | `POST /api/admin/database/query` used `prisma.$queryRawUnsafe(userInput)` — direct SQL injection vector. Any admin could execute destructive queries. |
| **Fix Applied** | Replaced with an allowlist approach: pre-defined safe read-only queries are matched against a registry. User input is validated against the allowlist before execution. Raw arbitrary SQL no longer possible. |
| **Severity** | 🔴 CRITICAL — SECURITY VULNERABILITY |

---

## HIGH — Admin Panel (All Fixed This Session)

### ✅ Mocked System Stats
| Field | Value |
|-------|-------|
| **File** | `server/src/routes/admin/system.js:42, 237, 238` |
| **Problem** | Admin system health endpoint returned hardcoded "up" for network/storage, and fake disk usage metrics. |
| **Fix Applied** | `fs.statfs` for disk usage, `os` module for memory/CPU, Prisma for real user/conversation/storage counts. Health check now reflects actual service states. |

### ✅ Mocked Database Stats
| Field | Value |
|-------|-------|
| **File** | `server/src/routes/admin/database.js:55, 81` |
| **Problem** | Table listing returned hardcoded mock arrays. DB stats returned fake numbers. |
| **Fix Applied** | `pg_stat_user_tables` for table sizes, `information_schema.columns` for schema, `pg_database_size` for total size. |

### ✅ CRDT Conflict Resolution Stub
| Field | Value |
|-------|-------|
| **File** | `server/src/routes/admin/crdt.js:170` |
| **Problem** | `POST /api/admin/crdt/documents/:id/resolve` did nothing—it was a complete stub with a TODO comment. |
| **Fix Applied** | Wired to `sync-service.js`. Supports resolution strategies: `last-write-wins`, `explicit-value`, `delete`. Records winning state as a sync operation via Prisma and updates/deletes the entity accordingly. |

---

## HIGH — Remaining Open Issues

### ⚠️ Admin Network Service (STUB)
| Field | Value |
|-------|-------|
| **File** | `server/src/services/admin-network-service.js:5, 23, 58, 75` |
| **Problem** | All network telemetry functions return empty arrays/objects. No integration with LibP2P `NetworkNode` instance. Admin panel Network tab shows no data. |
| **Recommended Fix** | Inject the global `NetworkNode` instance from `@vivim/network-engine` and call its peer list/topic functions. |
| **Severity** | 🟡 HIGH — MISSING IMPL |

---

## MEDIUM — Frontend UX (All Fixed This Session)

### ✅ Archived Card Opacity Bug
| Field | Value |
|-------|-------|
| **File** | `pwa/src/pages/Home.css:368-377` |
| **Problem** | `.is-archived { opacity: 0.6 }` applied to the entire card, making action buttons (Pin, Archive, Share, Delete) semi-transparent and difficult to click. |
| **Fix Applied** | Moved opacity to `.conv-card-body` selector. Action buttons remain fully opaque and usable. |

### ✅ Missing Keyboard Navigation (Space Key)
| Field | Value |
|-------|-------|
| **File** | `pwa/src/pages/Home.tsx:N/A` |
| **Problem** | Conversation cards only handled `Enter` key. `Space` key (standard button activation) did nothing — accessibility gap. |
| **Fix Applied** | `onKeyDown` handler now triggers card expansion for both `Enter` and `Space`. |

### ✅ Missing ARIA Labels on Stats Pills
| Field | Value |
|-------|-------|
| **File** | `pwa/src/pages/Home.tsx:N/A` |
| **Problem** | Stats pills (message count, word count, code blocks) showed icons with no text labels — useless for screen readers. |
| **Fix Applied** | Added `<span className="sr-only">Messages:</span>` etc. to each stat pill icon. |

---

## LOW — UX & Pattern Issues

### ✅ Missing Date Fallback
| Field | Value |
|-------|-------|
| **File** | `pwa/src/pages/Home.tsx:53-65` |
| **Problem** | `formatDate()` returned empty string for `undefined` or invalid dates — leaving blank space in the UI. |
| **Fix Applied** | Now returns `"Unknown"` for invalid/missing dates. |

### ✅ CSS Compatibility (line-clamp)
| Field | Value |
|-------|-------|
| **File** | `pwa/src/pages/Home.css:400-409` |
| **Problem** | Only `-webkit-line-clamp` was used. Firefox and other non-WebKit browsers didn't honor the text truncation. |
| **Fix Applied** | Added standard `line-clamp` property alongside the vendor-prefixed one. |

### ✅ Reduced Motion Accessibility
| Field | Value |
|-------|-------|
| **File** | `pwa/src/pages/Home.css:772-780` |
| **Problem** | No `prefers-reduced-motion` fallback. Users with vestibular disorders or motion sensitivity experienced full animations without opt-out. |
| **Fix Applied** | Added `@media (prefers-reduced-motion: reduce)` block disabling transitions and animations in Home.css. |

---

## LOW — Still Open

### ⚠️ Post-Quantum Crypto (WASM Stub)
| Field | Value |
|-------|-------|
| **File** | `pwa/src/lib/storage-v2/secure-crypto.ts:537, 608, 737, 754` |
| **Problem** | CRYSTALS-Kyber and Dilithium are stubbed. Current implementation falls back to standard elliptic curves, not the spec-required post-quantum algorithms. |
| **Recommended Fix** | Integrate WebAssembly modules for both Kyber-1024 and Dilithium3/5. |
| **Severity** | 🟢 MEDIUM — MISSING IMPL |

### ⚠️ Blockchain Anchoring Verification (Stub)
| Field | Value |
|-------|-------|
| **File** | `pwa/src/lib/storage-v2/privacy-manager.ts:383, 496` |
| **Problem** | Privacy state verification via blockchain Merkle root anchoring is stubbed. It does not query the VIVIM chain client. |
| **Recommended Fix** | Implement cross-check with the VIVIM chain client to verify Merkle roots. |
| **Severity** | 🟡 HIGH — MISSING IMPL |

### ⚠️ Server Analytics Telemetry Sync
| Field | Value |
|-------|-------|
| **File** | `pwa/src/lib/recommendation/analytics.ts:169` |
| **Problem** | Client-side recommendation engine logs feed impressions locally but never syncs them to the server. Server analytics endpoints don't exist yet. |
| **Recommended Fix** | Create `POST /api/v2/feed/analytics` endpoint and wire PWA to batch-send telemetry. |
| **Severity** | 🟢 MEDIUM — MISSING IMPL |

### ⚠️ Cache Invalidation Pattern
| Field | Value |
|-------|-------|
| **File** | `server/src/services/unified-context-service.ts:252` |
| **Problem** | Cache invalidation is done inline instead of emitting to `InvalidationService` via `ContextEventBus`. Breaks the event-driven architecture pattern. |
| **Recommended Fix** | Refactor to emit events to `ContextEventBus` which the `InvalidationService` subscribes to. |
| **Severity** | 🟢 LOW — BROKEN PATTERN |

### ⚠️ SyncIndicator Manual Sync Button
| Field | Value |
|-------|-------|
| **File** | `pwa/src/components/SyncIndicator.tsx` |
| **Problem** | `handleManualSync` is a no-op stub (`// Chain client handles GossipSub sync automatically`). The button is clickable but does nothing — false feedback. |
| **Recommended Fix** | Either implement actual GossipSub trigger, or disable/hide the button with a tooltip explaining auto-sync. |
| **Severity** | 🟢 LOW — UX BROKEN |

### ⚠️ ContextVisualizer Hardcoded Colors
| Field | Value |
|-------|-------|
| **File** | `pwa/src/components/ContextVisualizer.tsx` |
| **Problem** | `LAYER_COLORS = { 'L0_identity': '#8b5cf6', ... }` are hardcoded hex values that bypass the Tailwind/CSS variable design system. |
| **Recommended Fix** | Move to CSS variables: `var(--layer-0)` through `var(--layer-7)`. |
| **Severity** | 🟢 LOW — DESIGN PATTERN |

### ⚠️ ErrorState Component Location
| Field | Value |
|-------|-------|
| **File** | `pwa/src/components/ios/ErrorState.tsx` |
| **Problem** | Lives in `ios/` folder but is used across the whole app. Uses hardcoded Tailwind colors instead of design tokens. |
| **Recommended Fix** | Move to `pwa/src/components/unified/`. Replace hardcoded colors with `var(--color-error-*)` tokens. |
| **Severity** | 🟢 LOW — DESIGN PATTERN |

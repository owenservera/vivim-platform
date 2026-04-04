# VIVIM — API Route Inventory
**Archived**: 2026-03-05 | **Basis**: `08B-api-route-inventory.md`

**Total Routes**: ~215 | **Overall Status**: All routes implemented, majority WORKING

---

## Auth Domain — `/api/v1/auth/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/auth/google` | None | WORKING — Initiate Google OAuth |
| GET | `/auth/google/callback` | None | WORKING — OAuth callback |
| GET | `/auth/failed` | None | WORKING — OAuth failure handler |
| GET | `/auth/me` | Session | WORKING — Get current user |
| POST | `/auth/logout` | Session | WORKING — Logout |

---

## Capture Domain — `/api/v1/capture/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/capture/handshake` | None | WORKING — Quantum-resistant key exchange |
| GET | `/capture/` | None | WORKING — Health check |
| POST | `/capture/capture` | API Key | WORKING — Capture single conversation |
| POST | `/capture/capture/bulk` | Optional | WORKING — Bulk capture |
| POST | `/capture/capture-sync/init` | API Key | WORKING — Sync capture init |
| GET | `/capture/capture-sync` | Optional | WORKING — Sync status |
| GET | `/capture/detect-provider` | API Key | WORKING — Detect provider from URL |
| GET | `/capture/providers` | API Key | WORKING — List supported providers |

---

## Conversations Domain — `/api/v1/conversations/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/conversations/` | JWT | WORKING — List with pagination |
| GET | `/conversations/:id` | JWT | WORKING — Get conversation |
| GET | `/conversations/:id/messages` | JWT | WORKING — Get messages |
| GET | `/conversations/search/:query` | JWT | WORKING — Search by title |
| GET | `/conversations/stats/summary` | JWT | WORKING — Statistics |
| GET | `/conversations/recent` | JWT | WORKING — Recent conversations |
| DELETE | `/conversations/:id` | JWT | WORKING — Delete conversation |
| POST | `/conversations/:id/fork` | JWT | WORKING — Fork conversation |
| GET | `/conversations/:id/related` | JWT | WORKING — Related conversations |

---

## ACUs Domain — `/api/v1/acus/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/acus/` | None | WORKING — List ACUs |
| GET | `/acus/:id` | None | WORKING — Get ACU |
| GET | `/acus/:id/links` | None | WORKING — Get ACU links |
| POST | `/acus/search` | None | WORKING — Search ACUs (vector) |
| POST | `/acus/process` | None | WORKING — Process ACU |
| POST | `/acus/batch` | None | WORKING — Batch process |
| POST | `/acus/quick` | None | WORKING — Quick process |
| POST | `/acus/:id/remix` | None | WORKING — Fork/remix ACU |
| POST | `/acus/:id/annotate` | None | WORKING — Annotate ACU |
| POST | `/acus/:id/bookmark` | None | WORKING — Bookmark ACU |
| GET | `/acus/stats` | None | WORKING — ACU statistics |

---

## Memory Domain — `/api/v1/memory/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/memory/` | DID | WORKING — List memories |
| GET | `/memory/:id` | DID | WORKING — Get memory |
| POST | `/memory/` | DID | WORKING — Create memory |
| POST | `/memory/search` | DID | WORKING — Search memories |
| POST | `/memory/consolidate` | DID | WORKING — Trigger consolidation |

---

## Context Engine Domain — `/api/v2/context/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/context/topics` | None | WORKING |
| GET | `/context/entities` | None | WORKING |
| GET | `/context/bundles` | None | WORKING |
| POST | `/context/bundles` | None | WORKING |
| GET | `/context/memories` | None | WORKING |
| POST | `/context/memories` | None | WORKING |
| GET | `/context/notebooks` | None | WORKING |
| POST | `/context/notebooks` | None | WORKING |
| POST | `/context/notebooks/:notebookId/entries` | None | WORKING |
| GET | `/context/settings` | None | WORKING |
| PUT | `/context/settings` | None | WORKING |
| GET | `/context/stats` | None | WORKING |
| GET | `/context/acus` | None | WORKING |
| POST | `/context/compile` | None | WORKING — Full bundle compilation |
| POST | `/context/search` | None | WORKING — Semantic search |
| POST | `/context/vector/add` | None | WORKING — Add vector |

---

## Sharing Domain — `/api/v2/sharing/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/sharing/policies` | DID | WORKING — Create policy |
| GET | `/sharing/policies` | DID | WORKING — List policies |
| GET | `/sharing/policies/:id` | DID | WORKING — Get policy |
| PUT | `/sharing/policies/:id` | DID | WORKING — Update policy |
| DELETE | `/sharing/policies/:id` | DID | WORKING — Delete policy |
| POST | `/sharing/share` | DID | WORKING — Create share |
| GET | `/sharing/share/:shareId` | None | WORKING — Resolve share (public) |
| POST | `/sharing/revoke/:shareId` | DID | WORKING — Revoke share |

---

## Social Domain — `/api/v2/social/*`

### Friends & Follows
| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/social/friends` | DID | WORKING |
| POST | `/social/friends` | DID | WORKING — Send request |
| PUT | `/social/friends/:friendId` | DID | WORKING — Accept/decline |
| DELETE | `/social/friends/:friendId` | DID | WORKING — Remove |
| PUT | `/social/friends/:friendId/block` | DID | WORKING — Block |
| GET | `/social/followers` | DID | WORKING |
| GET | `/social/following` | DID | WORKING |
| POST | `/social/follow` | DID | WORKING — Follow |
| DELETE | `/social/follow/:followingId` | DID | WORKING — Unfollow |
| PUT | `/social/follow/:followingId/mute` | DID | WORKING — Mute |

### Groups
| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/social/groups` | DID | WORKING |
| GET | `/social/groups/public` | None | WORKING |
| POST | `/social/groups` | DID | WORKING |
| GET | `/social/groups/:groupId` | DID | WORKING |
| PUT | `/social/groups/:groupId` | DID | WORKING |
| DELETE | `/social/groups/:groupId` | DID | WORKING |
| POST | `/social/groups/:groupId/join` | DID | WORKING |
| POST | `/social/groups/:groupId/leave` | DID | WORKING |

### Teams
| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/social/teams` | DID | WORKING |
| POST | `/social/teams` | DID | WORKING |
| GET | `/social/teams/:teamId` | DID | WORKING |
| PUT | `/social/teams/:teamId` | DID | WORKING |
| DELETE | `/social/teams/:teamId` | DID | WORKING |
| POST | `/social/teams/:teamId/members` | DID | WORKING |
| DELETE | `/social/teams/:teamId/members/:memberId` | DID | WORKING |
| POST | `/social/teams/:teamId/channels` | DID | WORKING |

---

## Circles Domain — `/api/v2/circles/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/circles/` | DID | WORKING |
| GET | `/circles/` | DID | WORKING |
| GET | `/circles/:circleId` | DID | WORKING |
| PUT | `/circles/:circleId` | DID | WORKING |
| DELETE | `/circles/:circleId` | DID | WORKING |
| POST | `/circles/:circleId/members` | DID | WORKING — Add member |
| DELETE | `/circles/:circleId/members/:memberId` | DID | WORKING — Remove member |
| GET | `/circles/suggestions/all` | DID | WORKING |
| POST | `/circles/suggestions/generate` | DID | WORKING |

---

## Account Domain — `/api/v1/account/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/account/me` | JWT | WORKING |
| DELETE | `/account/me` | JWT | WORKING — Soft delete |
| POST | `/account/me/undelete` | JWT | WORKING |
| GET | `/account/me/data/export` | JWT | WORKING |
| GET | `/account/me/api-keys` | JWT | WORKING |
| POST | `/account/me/api-keys` | JWT | WORKING |
| DELETE | `/account/me/api-keys/:keyId` | JWT | WORKING |
| POST | `/account/me/mfa/setup` | JWT | WORKING |
| POST | `/account/me/mfa/enable` | JWT | WORKING |
| POST | `/account/me/mfa/disable` | JWT | WORKING |

---

## AI Domain — `/api/v1/ai/*` and `/api/v1/ai-chat/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/ai/complete` | API Key | WORKING |
| POST | `/ai/stream` | API Key | WORKING — SSE streaming |
| POST | `/ai/agent` | API Key | WORKING — Agent mode |
| POST | `/ai/chat` | API Key | WORKING |
| POST | `/ai-chat/start` | JWT | WORKING |
| POST | `/ai-chat/send` | JWT | WORKING |
| POST | `/ai-chat/stream` | JWT | WORKING |
| GET | `/ai-chat/list` | JWT | WORKING |
| POST | `/ai-chat/fork` | JWT | WORKING |
| GET | `/ai-settings/providers` | None | WORKING |
| GET | `/ai-settings/models` | None | WORKING |
| POST | `/ai-settings/personas` | JWT | WORKING |
| GET | `/ai-settings/telemetry/user` | JWT | WORKING |

---

## Feed Domain — `/api/v2/feed/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/feed` | DID | WORKING — Personalized feed |
| GET | `/feed/discover` | DID | WORKING — Discovery |
| GET | `/feed/explain/:contentId` | DID | WORKING — Feed explanation |
| GET | `/feed/preferences` | DID | WORKING |
| PUT | `/feed/preferences` | DID | WORKING |
| POST | `/feed/interact/:contentId` | DID | WORKING |
| GET | `/feed/contextual` | DID | WORKING |
| GET | `/feed/similar/:conversationId` | DID | WORKING |

---

## Admin Domain — `/api/admin/*`

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/admin/system/stats` | Admin | WORKING — Real OS metrics |
| GET | `/admin/system/health` | Admin | WORKING — Real service check |
| GET | `/admin/database/tables` | Admin | WORKING — Real pg_stat_user_tables |
| POST | `/admin/database/query` | Admin | WORKING — Allowlisted read-only queries |
| GET | `/admin/database/stats` | Admin | WORKING — Real pg_database_size |
| GET | `/admin/network/nodes` | Admin | ⚠️ STUB — Returns empty (no libp2p) |
| GET | `/admin/network/connections` | Admin | ⚠️ STUB |
| GET | `/admin/crdt/documents` | Admin | WORKING |
| POST | `/admin/crdt/documents/:id/resolve` | Admin | WORKING — Wired to sync-service |
| GET | `/admin/pubsub/topics` | Admin | WORKING |
| GET | `/admin/dataflow/flows` | Admin | WORKING |

---

## Sync, Portability, Collections

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/sync/push` | API Key | WORKING |
| GET | `/sync/pull` | API Key | WORKING |
| POST | `/portability/export` | DID | WORKING |
| POST | `/portability/import` | DID | WORKING |
| GET | `/collections/` | API Key | WORKING |
| POST | `/collections/` | API Key | WORKING |
| GET | `/collections/:id` | API Key | WORKING |

---

## Domain Summary

| Domain | Routes | Status |
|--------|--------|--------|
| Auth | 5 | ✅ WORKING |
| Capture | 8 | ✅ WORKING |
| Conversations | 9 | ✅ WORKING |
| ACUs | 11 | ✅ WORKING |
| Memory | 5 | ✅ WORKING |
| Context | 21 | ✅ WORKING |
| Sharing | 9 | ✅ WORKING |
| Social | 37 | ✅ WORKING |
| Circles | 12 | ✅ WORKING |
| Account | 11 | ✅ WORKING |
| Identity | 10 | ✅ WORKING |
| AI | 16 | ✅ WORKING |
| Feed | 10 | ✅ WORKING |
| Moderation | 4 | ✅ WORKING |
| Portability | 4 | ✅ WORKING |
| Collections | 8 | ✅ WORKING |
| Sync | 3 | ✅ WORKING |
| Admin | 22 | ⚠️ MOSTLY WORKING (network stubs) |
| Health/Debug | 4 | ✅ WORKING |

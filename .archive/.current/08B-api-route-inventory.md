# DOCUMENT B: API Route Inventory

**Date**: 2026-03-05
**Project**: VIVIM — API Server Routes

---

## Auth Domain

### /api/v1/auth/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /auth/google | None | WORKING | Initiate Google OAuth |
| GET | /auth/google/callback | None | WORKING | OAuth callback |
| GET | /auth/failed | None | WORKING | OAuth failure handler |
| GET | /auth/me | Session | WORKING | Get current user |
| POST | /auth/logout | Session | WORKING | Logout |

---

## Capture Domain

### /api/v1/capture/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /capture/handshake | None | WORKING | Quantum-resistant key exchange |
| GET | /capture/ | None | WORKING | Health check |
| POST | /capture/capture | API Key | WORKING | Capture single conversation |
| POST | /capture/capture/bulk | Optional | WORKING | Bulk capture |
| POST | /capture/capture-sync/init | API Key | WORKING | Initialize sync capture |
| GET | /capture/capture-sync | Optional | WORKING | Get sync status |
| GET | /capture/detect-provider | API Key | WORKING | Detect provider from URL |
| GET | /capture/providers | API Key | WORKING | List supported providers |

---

## Conversations Domain

### /api/v1/conversations/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /conversations/ | JWT | WORKING | List with pagination |
| GET | /conversations/:id | JWT | WORKING | Get conversation |
| GET | /conversations/:id/messages | JWT | WORKING | Get messages |
| GET | /conversations/search/:query | JWT | WORKING | Search by title |
| GET | /conversations/stats/summary | JWT | WORKING | Get stats |
| GET | /conversations/recent | JWT | WORKING | Recent conversations |
| DELETE | /conversations/:id | JWT | WORKING | Delete conversation |
| POST | /conversations/:id/fork | JWT | WORKING | Fork conversation |
| GET | /conversations/:id/related | JWT | WORKING | Related conversations |

---

## ACUs Domain

### /api/v1/acus/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /acus/ | None | WORKING | List ACUs |
| GET | /acus/:id | None | WORKING | Get ACU |
| GET | /acus/:id/links | None | WORKING | Get ACU links |
| POST | /acus/search | None | WORKING | Search ACUs |
| POST | /acus/process | None | WORKING | Process ACU |
| POST | /acus/batch | None | WORKING | Batch process |
| POST | /acus/quick | None | WORKING | Quick process |
| POST | /acus/:id/remix | None | WORKING | Fork/remix ACU |
| POST | /acus/:id/annotate | None | WORKING | Annotate ACU |
| POST | /acus/:id/bookmark | None | WORKING | Bookmark ACU |
| GET | /acus/stats | None | WORKING | ACU statistics |

---

## Memory Domain

### /api/v1/memory/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /memory/ | DID | WORKING | List memories |
| GET | /memory/:id | DID | WORKING | Get memory |
| POST | /memory/ | DID | WORKING | Create memory |
| POST | /memory/search | DID | WORKING | Search memories |
| POST | /memory/consolidate | DID | WORKING | Trigger consolidation |

---

## Context Engine Domain

### /api/v2/context/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /context/topics | None | WORKING | List topics |
| GET | /context/entities | None | WORKING | List entities |
| GET | /context/bundles | None | WORKING | List bundles |
| POST | /context/bundles | None | WORKING | Create bundle |
| GET | /context/conversations | None | WORKING | Context conversations |
| GET | /context/memories | None | WORKING | Context memories |
| POST | /context/memories | None | WORKING | Create memory |
| GET | /context/notebooks | None | WORKING | List notebooks |
| POST | /context/notebooks | None | WORKING | Create notebook |
| POST | /context/notebooks/:notebookId/entries | None | WORKING | Add notebook entry |
| GET | /context/settings | None | WORKING | Get context settings |
| PUT | /context/settings | None | WORKING | Update settings |
| GET | /context/stats | None | WORKING | Context stats |
| GET | /context/acus | None | WORKING | Context ACUs |
| POST | /context/compile | None | WORKING | Compile context bundle |
| POST | /context/search | None | WORKING | Search context |
| POST | /context/vector/add | None | WORKING | Add vector |

### /api/v1/context/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /context/context | None | WORKING | Legacy context |
| PUT | /context/context | None | WORKING | Update context |
| POST | /context/preset/:name | None | WORKING | Load preset |
| POST | /context/reset | None | WORKING | Reset context |
| GET | /context/presets | None | WORKING | List presets |
| GET | /context/schema | None | WORKING | Get schema |

---

## Sharing Domain

### /api/v2/sharing/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /sharing/policies | DID | WORKING | Create policy |
| GET | /sharing/policies | DID | WORKING | List policies |
| GET | /sharing/policies/:id | DID | WORKING | Get policy |
| PUT | /sharing/policies/:id | DID | WORKING | Update policy |
| DELETE | /sharing/policies/:id | DID | WORKING | Delete policy |
| POST | /sharing/share | DID | WORKING | Create share |
| GET | /sharing/share/:shareId | None | WORKING | Resolve share |
| POST | /sharing/revoke/:shareId | DID | WORKING | Revoke share |

---

## Social Domain

### /api/v2/social/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /social/summary | DID | WORKING | Social summary |
| GET | /social/profile/:did | DID | WORKING | Get profile |
| GET | /social/friends | DID | WORKING | List friends |
| GET | /social/friends/requests | DID | WORKING | Friend requests |
| POST | /social/friends | DID | WORKING | Send friend request |
| PUT | /social/friends/:friendId | DID | WORKING | Accept/decline |
| DELETE | /social/friends/:friendId | DID | WORKING | Remove friend |
| PUT | /social/friends/:friendId/block | DID | WORKING | Block user |
| GET | /social/followers | DID | WORKING | List followers |
| GET | /social/following | DID | WORKING | List following |
| POST | /social/follow | DID | WORKING | Follow user |
| DELETE | /social/follow/:followingId | DID | WORKING | Unfollow |
| PUT | /social/follow/:followingId/mute | DID | WORKING | Mute user |
| GET | /social/groups | DID | WORKING | List groups |
| GET | /social/groups/public | None | WORKING | Public groups |
| POST | /social/groups | DID | WORKING | Create group |
| GET | /social/groups/:groupId | DID | WORKING | Get group |
| PUT | /social/groups/:groupId | DID | WORKING | Update group |
| DELETE | /social/groups/:groupId | DID | WORKING | Delete group |
| POST | /social/groups/:groupId/join | DID | WORKING | Join group |
| POST | /social/groups/:groupId/leave | DID | WORKING | Leave group |
| GET | /social/groups/:groupId/members | DID | WORKING | Group members |
| GET | /social/groups/:groupId/posts | DID | WORKING | Group posts |
| POST | /social/groups/:groupId/posts | DID | WORKING | Create post |
| GET | /social/teams | DID | WORKING | List teams |
| POST | /social/teams | DID | WORKING | Create team |
| GET | /social/teams/:teamId | DID | WORKING | Get team |
| PUT | /social/teams/:teamId | DID | WORKING | Update team |
| DELETE | /social/teams/:teamId | DID | WORKING | Delete team |
| POST | /social/teams/:teamId/members | DID | WORKING | Add member |
| DELETE | /social/teams/:teamId/members/:memberId | DID | WORKING | Remove member |
| POST | /social/teams/:teamId/channels | DID | WORKING | Create channel |

---

## Circles Domain

### /api/v2/circles/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /circles/ | DID | WORKING | Create circle |
| GET | /circles/ | DID | WORKING | List circles |
| GET | /circles/:circleId | DID | WORKING | Get circle |
| PUT | /circles/:circleId | DID | WORKING | Update circle |
| DELETE | /circles/:circleId | DID | WORKING | Delete circle |
| POST | /circles/:circleId/members | DID | WORKING | Add member |
| DELETE | /circles/:circleId/members/:memberId | DID | WORKING | Remove member |
| GET | /circles/:circleId/suggestions | DID | WORKING | Suggestions |
| POST | /circles/:circleId/auto-populate | DID | WORKING | Auto-populate |
| GET | /circles/suggestions/all | DID | WORKING | All suggestions |
| POST | /circles/suggestions/generate | DID | WORKING | Generate suggestions |
| GET | /circles/:circleId/activity | DID | WORKING | Activity |

---

## Account Domain

### /api/v1/account/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /account/me | JWT | WORKING | Get current user |
| DELETE | /account/me | JWT | WORKING | Delete account |
| POST | /account/me/undelete | JWT | WORKING | Undelete account |
| GET | /account/me/data/export | JWT | WORKING | Export data |
| GET | /account/me/api-keys | JWT | WORKING | List API keys |
| POST | /account/me/api-keys | JWT | WORKING | Create API key |
| DELETE | /account/me/api-keys/:keyId | JWT | WORKING | Delete API key |
| POST | /account/me/mfa/setup | JWT | WORKING | Setup MFA |
| POST | /account/me/mfa/enable | JWT | WORKING | Enable MFA |
| POST | /account/me/mfa/disable | JWT | WORKING | Disable MFA |

---

## Identity Domain

### /api/v2/identity/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /identity/register | None | WORKING | Register user/DID |
| GET | /identity/resolve/:did | None | WORKING | Resolve DID |
| POST | /identity/devices | DID | WORKING | Register device |
| GET | /identity/devices | DID | WORKING | List devices |
| DELETE | /identity/devices/:deviceId | DID | WORKING | Remove device |
| POST | /identity/verify | DID | WORKING | Verify identity |
| GET | /identity/credentials | DID | WORKING | List credentials |

### /api/v1/identity/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /identity/register | None | WORKING | Legacy registration |
| GET | /identity/:did | None | WORKING | Get identity |
| PUT | /identity/:did | None | WORKING | Update identity |

---

## AI Domain

### /api/v1/ai/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /ai/complete | API Key | WORKING | Non-streaming completion |
| POST | /ai/stream | API Key | WORKING | Streaming completion |
| POST | /ai/agent | API Key | WORKING | Agent mode |
| POST | /ai/agent/stream | API Key | WORKING | Streaming agent |
| POST | /ai/structured | API Key | WORKING | Structured output |
| POST | /ai/chat | API Key | WORKING | Chat completion |
| POST | /ai/actions | API Key | WORKING | AI actions |

### /api/v1/ai-chat/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /ai-chat/start | JWT | WORKING | Start chat session |
| POST | /ai-chat/send | JWT | WORKING | Send message |
| POST | /ai-chat/stream | JWT | WORKING | Stream messages |
| GET | /ai-chat/list | JWT | WORKING | List chats |
| GET | /ai-chat/:id | JWT | WORKING | Get chat |
| DELETE | /ai-chat/:id | JWT | WORKING | Delete chat |
| POST | /ai-chat/fork | JWT | WORKING | Fork chat |

### /api/v1/ai-settings/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /ai-settings/providers | None | WORKING | List providers |
| GET | /ai-settings/models | None | WORKING | List models |
| GET | /ai-settings/personas | JWT | WORKING | List personas |
| POST | /ai-settings/personas | JWT | WORKING | Create persona |
| GET | /ai-settings/telemetry | Admin | WORKING | System telemetry |
| GET | /ai-settings/telemetry/user | JWT | WORKING | User telemetry |
| GET | /ai-settings/telemetry/estimate | JWT | WORKING | Estimate tokens |
| GET | /ai-settings/capabilities | None | WORKING | AI capabilities |

---

## Feed/Discovery Domain

### /api/v1/feed/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /feed | Optional | WORKING | Main feed |

### /api/v2/feed/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /feed | DID | WORKING | Personalized feed |
| GET | /feed/discover | DID | WORKING | Discovery feed |
| GET | /feed/explain/:contentId | DID | WORKING | Feed explanation |
| GET | /feed/preferences | DID | WORKING | Feed preferences |
| PUT | /feed/preferences | DID | WORKING | Update preferences |
| POST | /feed/interact/:contentId | DID | WORKING | Interact with content |
| GET | /feed/contextual | DID | WORKING | Contextual feed |
| GET | /feed/similar/:conversationId | DID | WORKING | Similar content |
| GET | /feed/privacy | DID | WORKING | Feed privacy |

---

## Moderation Domain

### /api/v2/moderation/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /moderation/flag | DID | WORKING | Flag content |
| GET | /moderation/flags | Mod | WORKING | List flags |
| PUT | /moderation/flags/:id | Mod | WORKING | Review flag |
| POST | /moderation/flags/:id/resolve | Mod | WORKING | Resolve flag |

---

## Portability Domain

### /api/v2/portability/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /portability/export | DID | WORKING | Request export |
| GET | /portability/export/:id | DID | WORKING | Get export status |
| POST | /portability/import | DID | WORKING | Import data |
| POST | /portability/migrate | DID | WORKING | Migrate to platform |

---

## Collections Domain

### /api/v1/collections/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /collections/ | API Key | WORKING | List collections |
| POST | /collections/ | API Key | WORKING | Create collection |
| GET | /collections/:id | API Key | WORKING | Get collection |
| PUT | /collections/:id | API Key | WORKING | Update collection |
| DELETE | /collections/:id | API Key | WORKING | Delete collection |
| POST | /collections/:id/items | API Key | WORKING | Add item |
| DELETE | /collections/:id/items/:itemId | API Key | WORKING | Remove item |
| GET | /collections/:id/conversations | API Key | WORKING | Collection conversations |

---

## Sync Domain

### /api/v1/sync/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| POST | /sync/push | API Key | WORKING | Push changes |
| GET | /sync/pull | API Key | WORKING | Pull changes |
| POST | /sync/ack | API Key | WORKING | Acknowledge sync |

---

## Admin Domain

### /api/admin/system/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /admin/system/stats | Admin | WORKING | System stats |
| GET | /admin/system/users/stats | Admin | WORKING | User stats |
| GET | /admin/system/conversations/stats | Admin | WORKING | Conversation stats |
| GET | /admin/system/storage/stats | Admin | WORKING | Storage stats |
| GET | /admin/system/logs | Admin | WORKING | System logs |
| GET | /admin/system/health | Admin | WORKING | Health check |

### /api/admin/database/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /admin/database/tables | Admin | WORKING | List tables |
| GET | /admin/database/tables/:name | Admin | WORKING | Table schema |
| POST | /admin/database/query | Admin | WORKING | Run query |
| GET | /admin/database/stats | Admin | WORKING | DB stats |

### /api/admin/network/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /admin/network/nodes | Admin | WORKING | P2P nodes |
| GET | /admin/network/nodes/:id | Admin | WORKING | Node details |
| GET | /admin/network/connections | Admin | WORKING | Connections |
| GET | /admin/network/metrics | Admin | WORKING | Network metrics |
| GET | /admin/network/metrics/latest | Admin | WORKING | Latest metrics |
| GET | /admin/network/stats | Admin | WORKING | Network stats |

### /api/admin/crdt/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /admin/crdt/documents | Admin | WORKING | List documents |
| GET | /admin/crdt/documents/:id | Admin | WORKING | Get document |
| GET | /admin/crdt/documents/:id/sync | Admin | WORKING | Sync status |
| POST | /admin/crdt/documents/:id/resolve | Admin | WORKING | Resolve conflicts |

### /api/admin/pubsub/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /admin/pubsub/topics | Admin | WORKING | List topics |
| GET | /admin/pubsub/topics/:id | Admin | WORKING | Topic details |
| GET | /admin/pubsub/topics/:id/subscribers | Admin | WORKING | Subscribers |

### /api/admin/dataflow/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /admin/dataflow/flows | Admin | WORKING | List flows |
| GET | /admin/dataflow/stats | Admin | WORKING | Flow stats |

---

## ZAI MCP Domain

### /api/v1/zai-mcp/*

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /zai-mcp/tools | None | WORKING | List tools |
| POST | /zai-mcp/websearch | None | WORKING | Web search |
| POST | /zai-mcp/webread | None | WORKING | Web read |
| POST | /zai-mcp/github | None | WORKING | GitHub integration |

---

## Health/Debug Domain

| Method | Path | Auth | Status | Notes |
|--------|------|------|--------|-------|
| GET | /health | None | WORKING | Health check |
| GET | /debug/status | Dev | WORKING | Debug status |
| GET | /debug/memory | Dev | WORKING | Memory usage |
| GET | /debug/database | Dev | WORKING | Database debug |

---

## Summary

| Domain | Routes | Status |
|--------|--------|--------|
| Auth | 5 | WORKING |
| Capture | 8 | WORKING |
| Conversations | 9 | WORKING |
| ACUs | 11 | WORKING |
| Memory | 5 | WORKING |
| Context | 21 | WORKING |
| Sharing | 9 | WORKING |
| Social | 37 | WORKING |
| Circles | 12 | WORKING |
| Account | 11 | WORKING |
| Identity | 10 | WORKING |
| AI | 16 | WORKING |
| Feed | 10 | WORKING |
| Moderation | 4 | WORKING |
| Portability | 4 | WORKING |
| Collections | 8 | WORKING |
| Sync | 3 | WORKING |
| Admin | 22 | WORKING |
| ZAI MCP | 4 | WORKING |
| Health | 4 | WORKING |

**Total Routes**: ~215
**Status**: All routes implemented, majority WORKING

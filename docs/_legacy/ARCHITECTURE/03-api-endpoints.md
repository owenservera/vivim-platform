# VIVIM API Endpoints Documentation

## Overview

This document provides a comprehensive list of all API endpoints in the VIVIM platform. The API is organized by version (v1, v2, v3) and functionality.

---

## Base URL

```
Development: http://localhost:3000/api
Production:  https://api.vivim.io/api
```

---

## 1. Health & Status Endpoints

| Method | Endpoint         | Description            | Auth |
| ------ | ---------------- | ---------------------- | ---- |
| GET    | `/`              | Health check           | No   |
| GET    | `/api/v1`        | API v1 health          | No   |
| GET    | `/api/v1/health` | Detailed health status | No   |

---

## 2. Authentication Endpoints (v1)

| Method | Endpoint                       | Description           | Auth |
| ------ | ------------------------------ | --------------------- | ---- |
| GET    | `/api/v1/auth/google`          | Google OAuth login    | No   |
| GET    | `/api/v1/auth/google/callback` | Google OAuth callback | No   |
| GET    | `/api/v1/auth/logout`          | Logout user           | Yes  |
| GET    | `/api/v1/auth/session`         | Get current session   | Yes  |
| POST   | `/api/v1/auth/refresh`         | Refresh token         | Yes  |

---

## 3. Account Endpoints (v1)

| Method | Endpoint                             | Description         | Auth |
| ------ | ------------------------------------ | ------------------- | ---- |
| GET    | `/api/v1/account/me`                 | Get account info    | Yes  |
| DELETE | `/api/v1/account/me`                 | Delete account      | Yes  |
| POST   | `/api/v1/account/me/undelete`        | Cancel deletion     | Yes  |
| GET    | `/api/v1/account/me/data/export`     | Request data export | Yes  |
| GET    | `/api/v1/account/me/api-keys`        | List API keys       | Yes  |
| POST   | `/api/v1/account/me/api-keys`        | Create API key      | Yes  |
| DELETE | `/api/v1/account/me/api-keys/:keyId` | Revoke API key      | Yes  |
| POST   | `/api/v1/account/me/mfa/setup`       | Setup MFA           | Yes  |
| POST   | `/api/v1/account/me/mfa/enable`      | Enable MFA          | Yes  |
| POST   | `/api/v1/account/me/mfa/disable`     | Disable MFA         | Yes  |

---

## 4. Identity Endpoints

### 4.1 Identity v1

| Method | Endpoint                | Description         | Auth |
| ------ | ----------------------- | ------------------- | ---- |
| GET    | `/api/v1/identity`      | Get identity        | Yes  |
| PUT    | `/api/v1/identity`      | Update identity     | Yes  |
| GET    | `/api/v1/identity/keys` | Get encryption keys | Yes  |
| POST   | `/api/v1/identity/keys` | Generate new keys   | Yes  |
| GET    | `/api/v1/identity/did`  | Get DID document    | Yes  |

### 4.2 Identity v2

| Method | Endpoint                        | Description          | Auth |
| ------ | ------------------------------- | -------------------- | ---- |
| GET    | `/api/v2/identity`              | Get full identity    | Yes  |
| PUT    | `/api/v2/identity`              | Update identity      | Yes  |
| GET    | `/api/v2/identity/profile`      | Get extended profile | Yes  |
| PUT    | `/api/v2/identity/profile`      | Update profile       | Yes  |
| POST   | `/api/v2/identity/verification` | Request verification | Yes  |

---

## 5. Conversation Endpoints

| Method | Endpoint                             | Description         | Auth |
| ------ | ------------------------------------ | ------------------- | ---- |
| GET    | `/api/v1/conversations`              | List conversations  | Yes  |
| POST   | `/api/v1/conversations`              | Create conversation | Yes  |
| GET    | `/api/v1/conversations/:id`          | Get conversation    | Yes  |
| PUT    | `/api/v1/conversations/:id`          | Update conversation | Yes  |
| DELETE | `/api/v1/conversations/:id`          | Delete conversation | Yes  |
| GET    | `/api/v1/conversations/:id/messages` | Get messages        | Yes  |
| POST   | `/api/v1/conversations/:id/messages` | Add message         | Yes  |
| GET    | `/api/v1/conversations/:id/export`   | Export conversation | Yes  |
| POST   | `/api/v1/conversations/:id/share`    | Share conversation  | Yes  |

---

## 6. Capture Endpoints (v1)

| Method | Endpoint                        | Description              | Auth |
| ------ | ------------------------------- | ------------------------ | ---- |
| POST   | `/api/v1/capture`               | Capture conversation     | Yes  |
| POST   | `/api/v1/capture/url`           | Capture from URL         | Yes  |
| POST   | `/api/v1/capture/batch`         | Batch capture            | Yes  |
| GET    | `/api/v1/capture/status/:id`    | Get capture status       | Yes  |
| GET    | `/api/v1/capture/providers`     | List supported providers | Yes  |
| GET    | `/api/v1/capture/providers/:id` | Get provider info        | Yes  |

---

## 7. ACU (Atomic Chat Unit) Endpoints

| Method | Endpoint                           | Description   | Auth |
| ------ | ---------------------------------- | ------------- | ---- |
| GET    | `/api/v1/acus`                     | List ACUs     | Yes  |
| GET    | `/api/v1/acus/:id`                 | Get ACU       | Yes  |
| PUT    | `/api/v1/acus/:id`                 | Update ACU    | Yes  |
| DELETE | `/api/v1/acus/:id`                 | Delete ACU    | Yes  |
| GET    | `/api/v1/acus/:id/links`           | Get ACU links | Yes  |
| POST   | `/api/v1/acus/:id/links`           | Create link   | Yes  |
| DELETE | `/api/v1/acus/:id/links/:targetId` | Delete link   | Yes  |
| GET    | `/api/v1/acus/search`              | Search ACUs   | Yes  |
| POST   | `/api/v1/acus/export`              | Export ACUs   | Yes  |

---

## 8. Feed Endpoints

### 8.1 Feed v1

| Method | Endpoint                       | Description           | Auth |
| ------ | ------------------------------ | --------------------- | ---- |
| GET    | `/api/v1/feed`                 | Get personalized feed | Yes  |
| GET    | `/api/v1/feed/recommendations` | Get recommendations   | Yes  |
| POST   | `/api/v1/feed/interaction`     | Record interaction    | Yes  |
| GET    | `/api/v1/feed/trending`        | Get trending content  | Yes  |

### 8.2 Feed v2

| Method | Endpoint                   | Description           | Auth |
| ------ | -------------------------- | --------------------- | ---- |
| GET    | `/api/v2/feed`             | Get enhanced feed     | Yes  |
| GET    | `/api/v2/feed/foryou`      | Get For You feed      | Yes  |
| GET    | `/api/v2/feed/following`   | Get following feed    | Yes  |
| GET    | `/api/v2/feed/discover`    | Discover new content  | Yes  |
| POST   | `/api/v2/feed/interaction` | Record interaction v2 | Yes  |
| GET    | `/api/v2/feed/analytics`   | Feed analytics        | Yes  |

---

## 9. Memory Endpoints

### 9.1 Memory v2

| Method | Endpoint                             | Description         | Auth |
| ------ | ------------------------------------ | ------------------- | ---- |
| GET    | `/api/v2/memories`                   | List memories       | Yes  |
| POST   | `/api/v2/memories`                   | Create memory       | Yes  |
| GET    | `/api/v2/memories/:id`               | Get memory          | Yes  |
| PUT    | `/api/v2/memories/:id`               | Update memory       | Yes  |
| DELETE | `/api/v2/memories/:id`               | Delete memory       | Yes  |
| GET    | `/api/v2/memories/:id/relationships` | Get relationships   | Yes  |
| POST   | `/api/v2/memories/:id/relationships` | Create relationship | Yes  |

### 9.2 Memory Search

| Method | Endpoint                          | Description       | Auth |
| ------ | --------------------------------- | ----------------- | ---- |
| POST   | `/api/v2/memories/query`          | Search memories   | Yes  |
| POST   | `/api/v2/memories/query/semantic` | Semantic search   | Yes  |
| GET    | `/api/v2/memories/stats`          | Memory statistics | Yes  |
| GET    | `/api/v2/memories/analytics`      | Memory analytics  | Yes  |

---

## 10. Context Endpoints (v2)

| Method | Endpoint                      | Description             | Auth |
| ------ | ----------------------------- | ----------------------- | ---- |
| GET    | `/api/v2/context`             | Get context settings    | Yes  |
| PUT    | `/api/v2/context`             | Update context settings | Yes  |
| GET    | `/api/v2/context/budget`      | Get context budget      | Yes  |
| PUT    | `/api/v2/context/budget`      | Update budget           | Yes  |
| GET    | `/api/v2/context/bundles`     | List context bundles    | Yes  |
| POST   | `/api/v2/context/bundles`     | Create bundle           | Yes  |
| DELETE | `/api/v2/context/bundles/:id` | Delete bundle           | Yes  |
| POST   | `/api/v2/context/compile`     | Compile context         | Yes  |

---

## 11. Circle Endpoints (v2)

| Method | Endpoint                              | Description        | Auth |
| ------ | ------------------------------------- | ------------------ | ---- |
| GET    | `/api/v2/circles`                     | List circles       | Yes  |
| POST   | `/api/v2/circles`                     | Create circle      | Yes  |
| GET    | `/api/v2/circles/:id`                 | Get circle         | Yes  |
| PUT    | `/api/v2/circles/:id`                 | Update circle      | Yes  |
| DELETE | `/api/v2/circles/:id`                 | Delete circle      | Yes  |
| POST   | `/api/v2/circles/:id/members`         | Add member         | Yes  |
| DELETE | `/api/v2/circles/:id/members/:userId` | Remove member      | Yes  |
| GET    | `/api/v2/circles/:id/content`         | Get circle content | Yes  |
| POST   | `/api/v2/circles/:id/share`           | Share to circle    | Yes  |

---

## 12. Sharing Endpoints (v2)

| Method | Endpoint                                 | Description           | Auth |
| ------ | ---------------------------------------- | --------------------- | ---- |
| POST   | `/api/v2/sharing/intent`                 | Create sharing intent | Yes  |
| GET    | `/api/v2/sharing/intent/:id`             | Get intent            | Yes  |
| PUT    | `/api/v2/sharing/intent/:id`             | Update intent         | Yes  |
| DELETE | `/api/v2/sharing/intent/:id`             | Delete intent         | Yes  |
| POST   | `/api/v2/sharing/intent/:id/publish`     | Publish intent        | Yes  |
| POST   | `/api/v2/sharing/intent/:id/revoke`      | Revoke intent         | Yes  |
| GET    | `/api/v2/sharing/access/:linkCode`       | Access via link       | Yes  |
| POST   | `/api/v2/sharing/access/:linkCode/grant` | Grant access          | Yes  |
| GET    | `/api/v2/sharing/logs`                   | Access logs           | Yes  |

---

## 13. Portability Endpoints (v2)

| Method | Endpoint                            | Description              | Auth |
| ------ | ----------------------------------- | ------------------------ | ---- |
| GET    | `/api/v2/portability/export`        | Export user data         | Yes  |
| POST   | `/api/v2/portability/import`        | Import user data         | Yes  |
| GET    | `/api/v2/portability/status/:jobId` | Get export/import status | Yes  |
| POST   | `/api/v2/portability/verify`        | Verify data integrity    | Yes  |

---

## 14. Social Endpoints

### 14.1 Social v1

| Method | Endpoint                      | Description        | Auth |
| ------ | ----------------------------- | ------------------ | ---- |
| GET    | `/api/v1/social/profile/:did` | Get social profile | Yes  |
| PUT    | `/api/v1/social/profile`      | Update profile     | Yes  |
| GET    | `/api/v1/social/followers`    | Get followers      | Yes  |
| GET    | `/api/v1/social/following`    | Get following      | Yes  |
| POST   | `/api/v1/social/follow/:did`  | Follow user        | Yes  |
| DELETE | `/api/v1/social/follow/:did`  | Unfollow user      | Yes  |

### 14.2 Social v3

| Method | Endpoint                          | Description          | Auth |
| ------ | --------------------------------- | -------------------- | ---- |
| GET    | `/api/v3/social/profile/:did`     | Get extended profile | Yes  |
| PUT    | `/api/v3/social/profile`          | Update profile       | Yes  |
| GET    | `/api/v3/social/friends`          | Get friends list     | Yes  |
| POST   | `/api/v3/social/friends/request`  | Send friend request  | Yes  |
| POST   | `/api/v3/social/friends/accept`   | Accept request       | Yes  |
| DELETE | `/api/v3/social/friends/:id`      | Remove friend        | Yes  |
| GET    | `/api/v3/social/groups`           | Get groups           | Yes  |
| POST   | `/api/v3/social/groups`           | Create group         | Yes  |
| GET    | `/api/v3/social/groups/:id`       | Get group details    | Yes  |
| PUT    | `/api/v3/social/groups/:id`       | Update group         | Yes  |
| DELETE | `/api/v3/social/groups/:id`       | Delete group         | Yes  |
| POST   | `/api/v3/social/groups/:id/join`  | Join group           | Yes  |
| POST   | `/api/v3/social/groups/:id/leave` | Leave group          | Yes  |
| GET    | `/api/v3/social/teams`            | Get teams            | Yes  |
| POST   | `/api/v3/social/teams`            | Create team          | Yes  |

---

## 15. Collections Endpoints

| Method | Endpoint                                | Description       | Auth |
| ------ | --------------------------------------- | ----------------- | ---- |
| GET    | `/api/v1/collections`                   | List collections  | Yes  |
| POST   | `/api/v1/collections`                   | Create collection | Yes  |
| GET    | `/api/v1/collections/:id`               | Get collection    | Yes  |
| PUT    | `/api/v1/collections/:id`               | Update collection | Yes  |
| DELETE | `/api/v1/collections/:id`               | Delete collection | Yes  |
| POST   | `/api/v1/collections/:id/items`         | Add item          | Yes  |
| DELETE | `/api/v1/collections/:id/items/:itemId` | Remove item       | Yes  |
| POST   | `/api/v1/collections/:id/share`         | Share collection  | Yes  |

---

## 16. AI Endpoints

### 16.1 AI v1

| Method | Endpoint                 | Description           | Auth |
| ------ | ------------------------ | --------------------- | ---- |
| GET    | `/api/v1/ai/providers`   | List AI providers     | Yes  |
| GET    | `/api/v1/ai/models`      | List available models | Yes  |
| POST   | `/api/v1/ai/chat`        | Chat completion       | Yes  |
| POST   | `/api/v1/ai/chat/stream` | Stream chat           | Yes  |
| POST   | `/api/v1/ai/completion`  | Text completion       | Yes  |

### 16.2 AI Chat

| Method | Endpoint                              | Description         | Auth |
| ------ | ------------------------------------- | ------------------- | ---- |
| POST   | `/api/v1/ai/chat/session`             | Create chat session | Yes  |
| GET    | `/api/v1/ai/chat/session/:id`         | Get session         | Yes  |
| DELETE | `/api/v1/ai/chat/session/:id`         | Delete session      | Yes  |
| POST   | `/api/v1/ai/chat/session/:id/message` | Send message        | Yes  |
| GET    | `/api/v1/ai/chat/session/:id/history` | Get chat history    | Yes  |

### 16.3 AI Settings

| Method | Endpoint                           | Description     | Auth |
| ------ | ---------------------------------- | --------------- | ---- |
| GET    | `/api/v1/ai/settings`              | Get AI settings | Yes  |
| PUT    | `/api/v1/ai/settings`              | Update settings | Yes  |
| GET    | `/api/v1/ai/settings/personas`     | List personas   | Yes  |
| POST   | `/api/v1/ai/settings/personas`     | Create persona  | Yes  |
| PUT    | `/api/v1/ai/settings/personas/:id` | Update persona  | Yes  |
| DELETE | `/api/v1/ai/settings/personas/:id` | Delete persona  | Yes  |

---

## 17. Sync Endpoints

| Method | Endpoint               | Description       | Auth |
| ------ | ---------------------- | ----------------- | ---- |
| POST   | `/api/v1/sync/push`    | Push changes      | Yes  |
| GET    | `/api/v1/sync/pull`    | Pull changes      | Yes  |
| GET    | `/api/v1/sync/status`  | Sync status       | Yes  |
| POST   | `/api/v1/sync/resolve` | Resolve conflicts | Yes  |
| GET    | `/api/v1/sync/cursor`  | Get sync cursor   | Yes  |
| PUT    | `/api/v1/sync/cursor`  | Update cursor     | Yes  |

---

## 18. Settings Endpoints

| Method | Endpoint                         | Description           | Auth |
| ------ | -------------------------------- | --------------------- | ---- |
| GET    | `/api/v1/settings`               | Get all settings      | Yes  |
| PUT    | `/api/v1/settings`               | Update settings       | Yes  |
| GET    | `/api/v1/settings/privacy`       | Privacy settings      | Yes  |
| PUT    | `/api/v1/settings/privacy`       | Update privacy        | Yes  |
| GET    | `/api/v1/settings/notifications` | Notification settings | Yes  |
| PUT    | `/api/v1/settings/notifications` | Update notifications  | Yes  |

---

## 19. Unified API Endpoints

| Method | Endpoint                   | Description     | Auth |
| ------ | -------------------------- | --------------- | ---- |
| POST   | `/api/unified/search`      | Unified search  | Yes  |
| POST   | `/api/unified/query`       | Unified query   | Yes  |
| GET    | `/api/unified/suggestions` | Get suggestions | Yes  |

---

## 20. Other Endpoints

### 20.1 Moderation (v2)

| Method | Endpoint               | Description                  | Auth      |
| ------ | ---------------------- | ---------------------------- | --------- |
| \*     | `/api/v2/moderation/*` | Content moderation endpoints | Yes/Admin |

### 20.2 Omni (v1)

| Method | Endpoint         | Description           | Auth |
| ------ | ---------------- | --------------------- | ---- |
| \*     | `/api/v1/omni/*` | Omnichannel endpoints | Yes  |

### 20.3 Z.AI MCP (v1)

| Method | Endpoint            | Description               | Auth |
| ------ | ------------------- | ------------------------- | ---- |
| \*     | `/api/v1/zai-mcp/*` | MCP integrations for Z.AI | Yes  |

---

## 21. Debug & Monitoring Endpoints

| Method | Endpoint                   | Description        | Auth |
| ------ | -------------------------- | ------------------ | ---- |
| GET    | `/api/v1/debug/state`      | Get debug state    | Yes  |
| GET    | `/api/v1/debug/metrics`    | Get metrics        | Yes  |
| GET    | `/api/v1/debug/logs`       | Get recent logs    | Yes  |
| POST   | `/api/v1/debug/test-error` | Test error handler | No   |

---

## 21. Error Reporting Endpoints

| Method | Endpoint               | Description       | Auth |
| ------ | ---------------------- | ----------------- | ---- |
| POST   | `/api/v1/errors`       | Report error      | Yes  |
| GET    | `/api/v1/errors/:id`   | Get error details | Yes  |
| GET    | `/api/v1/errors/stats` | Error statistics  | Yes  |

---

## 22. Admin Endpoints

### 22.1 Network Administration

| Method | Endpoint                                | Description          | Auth  |
| ------ | --------------------------------------- | -------------------- | ----- |
| GET    | `/api/admin/network/peers`              | List connected peers | Admin |
| GET    | `/api/admin/network/stats`              | Network statistics   | Admin |
| GET    | `/api/admin/network/topology`           | Network topology     | Admin |
| POST   | `/api/admin/network/connect`            | Connect to peer      | Admin |
| DELETE | `/api/admin/network/disconnect/:peerId` | Disconnect peer      | Admin |

### 22.2 Database Administration

| Method | Endpoint                     | Description         | Auth  |
| ------ | ---------------------------- | ------------------- | ----- |
| GET    | `/api/admin/database/stats`  | Database statistics | Admin |
| GET    | `/api/admin/database/tables` | List tables         | Admin |
| POST   | `/api/admin/database/query`  | Execute query       | Admin |
| POST   | `/api/admin/database/backup` | Create backup       | Admin |

### 22.3 System Administration

| Method | Endpoint                    | Description          | Auth  |
| ------ | --------------------------- | -------------------- | ----- |
| GET    | `/api/admin/system/health`  | System health        | Admin |
| GET    | `/api/admin/system/metrics` | System metrics       | Admin |
| GET    | `/api/admin/system/config`  | System configuration | Admin |
| PUT    | `/api/admin/system/config`  | Update config        | Admin |
| GET    | `/api/admin/system/logs`    | System logs          | Admin |

### 22.4 CRDT Administration

| Method | Endpoint                        | Description        | Auth  |
| ------ | ------------------------------- | ------------------ | ----- |
| GET    | `/api/admin/crdt/status`        | CRDT status        | Admin |
| GET    | `/api/admin/crdt/documents`     | List documents     | Admin |
| GET    | `/api/admin/crdt/documents/:id` | Get document state | Admin |
| POST   | `/api/admin/crdt/sync`          | Force sync         | Admin |

### 22.5 PubSub Administration

| Method | Endpoint                          | Description        | Auth  |
| ------ | --------------------------------- | ------------------ | ----- |
| GET    | `/api/admin/pubsub/topics`        | List topics        | Admin |
| GET    | `/api/admin/pubsub/subscriptions` | List subscriptions | Admin |
| POST   | `/api/admin/pubsub/publish`       | Publish message    | Admin |

### 22.6 Dataflow Administration

| Method | Endpoint                                  | Description         | Auth  |
| ------ | ----------------------------------------- | ------------------- | ----- |
| GET    | `/api/admin/dataflow/pipelines`           | List pipelines      | Admin |
| GET    | `/api/admin/dataflow/pipelines/:id`       | Get pipeline status | Admin |
| POST   | `/api/admin/dataflow/pipelines/:id/start` | Start pipeline      | Admin |
| POST   | `/api/admin/dataflow/pipelines/:id/stop`  | Stop pipeline       | Admin |
| GET    | `/api/admin/dataflow/metrics`             | Dataflow metrics    | Admin |

---

## 23. WebSocket Events

### 23.1 Socket.io Events

| Event                 | Direction     | Description          |
| --------------------- | ------------- | -------------------- |
| `connect`             | Client→Server | Establish connection |
| `disconnect`          | Client→Server | Disconnect           |
| `sync:push`           | Client→Server | Push local changes   |
| `sync:pull`           | Client→Server | Pull remote changes  |
| `conversation:new`    | Server→Client | New conversation     |
| `conversation:update` | Server→Client | Conversation updated |
| `message:new`         | Server→Client | New message          |
| `presence:update`     | Server→Client | Presence update      |
| `notification:new`    | Server→Client | New notification     |

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-02-22T17:00:00Z",
    "requestId": "req_xxx"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

---

## Rate Limiting

- **Production**: 100 requests per 15 minutes per IP
- **Development**: No rate limiting

---

## Authentication

Most endpoints require authentication via:

1. **Session Cookie**: Automatically sent with requests
2. **Authorization Header**: `Bearer <token>`

---

_Document Version: 1.0_
_Last Updated: February 2026_

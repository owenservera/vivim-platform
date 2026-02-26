# API Reference

## Base Configuration

```
Base URL: /api/v2/sharing
Authentication: DID-based JWT
Content-Type: JSON
```

## Common Headers

```http
Authorization: Bearer <did-jwt>
X-Request-ID: <uuid>
X-Client-Version: <semver>
X-Device-ID: <uuid>
```

## Response Formats

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Intent Management

### Create Intent

Create a new sharing intent.

**Endpoint:** `POST /intents`

**Authentication:** Required

**Request Body:**
```json
{
  "contentType": "CONVERSATION",
  "contentIds": ["uuid-1"],
  "contentScope": "FULL",
  "audienceType": "CIRCLE",
  "circleIds": ["circle-uuid"],
  "permissions": {
    "canView": true,
    "canAnnotate": true,
    "canShare": false
  },
  "schedule": {
    "expiresAt": "2026-03-01T00:00:00Z"
  },
  "metadata": {
    "title": "My Shared Chat",
    "description": "Sharing this conversation"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "intent-uuid",
    "status": "DRAFT",
    "contentType": "CONVERSATION",
    ...
  }
}
```

---

### List Intents

List sharing intents for authenticated user.

**Endpoint:** `GET /intents`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (DRAFT, ACTIVE, REVOKED, etc.) |
| contentType | string | Filter by content type |
| audienceType | string | Filter by audience type |
| limit | number | Items per page (default: 50) |
| offset | number | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "...", "status": "ACTIVE", ... }
  ]
}
```

---

### Get Intent

Get specific intent by ID.

**Endpoint:** `GET /intents/:intentId`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "intent-uuid",
    "contentType": "CONVERSATION",
    "contentIds": ["uuid-1"],
    "audienceType": "CIRCLE",
    "permissions": { ... },
    "status": "ACTIVE",
    "shareLinks": [ ... ],
    "accessGrants": [ ... ]
  }
}
```

---

### Update Intent

Update intent properties.

**Endpoint:** `PATCH /intents/:intentId`

**Authentication:** Required

**Request Body:**
```json
{
  "audienceType": "USERS",
  "userDids": ["did:user1", "did:user2"],
  "permissions": {
    "canView": true,
    "canCopy": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Publish Intent

Publish sharing intent to network.

**Endpoint:** `POST /intents/:intentId/publish`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "intent-uuid",
    "status": "ACTIVE",
    "publishedAt": "2026-02-14T05:00:00Z"
  }
}
```

---

### Revoke Intent

Revoke a shared content.

**Endpoint:** `POST /intents/:intentId/revoke`

**Authentication:** Required

**Request Body:**
```json
{
  "reason": "No longer needed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "intent-uuid",
    "status": "REVOKED",
    "revokedAt": "2026-02-14T05:00:00Z"
  }
}
```

---

## Share Links

### Create Share Link

Create a shareable link for content.

**Endpoint:** `POST /links`

**Authentication:** Required

**Request Body:**
```json
{
  "intentId": "intent-uuid",
  "maxUses": 100,
  "expiresAt": "2026-02-28T00:00:00Z",
  "password": "optional-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "link": {
      "id": "link-uuid",
      "linkCode": "abc123xyz",
      "usesCount": 0
    },
    "url": "/share/abc123xyz"
  }
}
```

---

### Get Share Link

Get share link information.

**Endpoint:** `GET /links/:linkCode`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "link-uuid",
    "linkCode": "abc123xyz",
    "intent": { ... },
    "isActive": true,
    "expiresAt": "2026-02-28T00:00:00Z"
  }
}
```

---

### Access Share Link

Access content via share link.

**Endpoint:** `POST /links/:linkCode/access`

**Authentication:** Optional

**Request Body:**
```json
{
  "password": "password-if-protected",
  "did": "accessor-did-if-authenticated"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "intent-uuid",
    "contentType": "CONVERSATION",
    "contentIds": ["uuid-1"],
    "permissions": { ... }
  }
}
```

**Error (403):**
```json
{
  "success": false,
  "error": "Invalid password"
}
```

---

## Analytics

### Get User Metrics

Get sharing metrics for authenticated user.

**Endpoint:** `GET /analytics/metrics`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date (ISO) |
| endDate | string | End date (ISO) |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalShares": 15,
    "totalViews": 234,
    "linkClicks": 56,
    "sharesAccepted": 12,
    "sharesDeclined": 2,
    "contentSaved": 8
  }
}
```

---

### Get Activity Log

Get user's sharing activity.

**Endpoint:** `GET /analytics/activity`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Max items (default: 50) |
| eventTypes | string | Comma-separated event types |
| startDate | string | Start date (ISO) |
| endDate | string | End date (ISO) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "eventType": "SHARE_VIEWED",
      "actorDid": "did:user",
      "intentId": "intent-uuid",
      "timestamp": "2026-02-14T05:00:00Z"
    }
  ]
}
```

---

### Get Insights

Get AI-generated insights.

**Endpoint:** `GET /analytics/insights`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| unreadOnly | boolean | Only unread insights |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "insight-uuid",
      "insightType": "RECOMMENDATION",
      "title": "High Engagement Rate",
      "description": "Your shares have 5.2x views on average...",
      "confidence": 0.8,
      "relevanceScore": 0.9,
      "isRead": false,
      "generatedAt": "2026-02-14T05:00:00Z"
    }
  ]
}
```

---

### Mark Insight Read

Mark an insight as read.

**Endpoint:** `POST /analytics/insights/:insightId/read`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "insight-uuid",
    "isRead": true,
    "readAt": "2026-02-14T05:00:00Z"
  }
}
```

---

### Dismiss Insight

Dismiss an insight.

**Endpoint:** `POST /analytics/insights/:insightId/dismiss`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "insight-uuid",
    "isDismissed": true
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 500 | Internal Error - Server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /intents | 10/minute |
| GET /intents | 60/minute |
| POST /links | 20/minute |
| GET /analytics/* | 30/minute |

---

Generated: 2026-02-14

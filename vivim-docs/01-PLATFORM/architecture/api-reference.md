# VIVIM API Reference

Complete API documentation for the VIVIM platform.

---

## Base URL

```
Production: https://api.vivim.app
Sandbox:    https://api.sandbox.vivim.app
```

---

## Authentication

All API requests require authentication. VIVIM supports two methods:

### Bearer Token

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.vivim.app/api/conversations
```

### Generating API Keys

```bash
# Using Dashboard
# 1. Navigate to Settings → Developer → API Keys
# 2. Click "Generate New Key"
# 3. Name your key and set permissions
# 4. Copy and store securely (shown once)
```

---

## Response Format

All responses follow this structure:

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### List Response

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Conversations API

### List Conversations

```http
GET /api/conversations
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Number of results (max 100) |
| `offset` | integer | 0 | Pagination offset |
| `provider` | string | - | Filter by AI provider |
| `since` | date | - | Filter by creation date |
| `until` | date | - | Filter by creation date |
| `sort` | string | createdAt | Sort field |
| `order` | string | desc | Sort order (asc/desc) |

**Example:**

```bash
curl -X GET "https://api.vivim.app/api/conversations?limit=10&provider=chatgpt" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**

```json
{
  "data": [
    {
      "id": "conv_123abc",
      "provider": "chatgpt",
      "sourceUrl": "https://chat.openai.com/c/abc123",
      "title": "Project Alpha Discussion",
      "visibility": "private",
      "messageCount": 45,
      "totalTokens": 12500,
      "totalCodeBlocks": 12,
      "totalImages": 3,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:45:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Conversation

```http
GET /api/conversations/:id
```

**Example:**

```bash
curl -X GET "https://api.vivim.app/api/conversations/conv_123abc" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Create Conversation

```http
POST /api/conversations
```

**Request Body:**

```json
{
  "provider": "chatgpt",
  "sourceUrl": "https://chat.openai.com/c/abc123",
  "title": "My Conversation",
  "visibility": "private",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    },
    {
      "role": "assistant", 
      "content": "Hi there!"
    }
  ]
}
```

### Delete Conversation

```http
DELETE /api/conversations/:id
```

---

## Messages API

### List Messages

```http
GET /api/conversations/:conversationId/messages
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of results (max 500) |
| `offset` | integer | Pagination offset |
| `role` | string | Filter by role (user/assistant) |

### Get Message

```http
GET /api/conversations/:conversationId/messages/:messageId
```

---

## Memories API

### List Memories

```http
GET /api/memories
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of results |
| `offset` | integer | Pagination offset |
| `type` | string | Memory type filter |
| `importance` | float | Minimum importance (0-1) |
| `provider` | string | Source AI provider |
| `since` | date | Created after |
| `until` | date | Created before |

**Example:**

```bash
curl -X GET "https://api.vivim.app/api/memories?type=EPISODIC&importance=0.7" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Search Memories

```http
POST /api/memories/search
```

**Request Body:**

```json
{
  "query": "authentication code",
  "filters": {
    "type": "PROCEDURAL",
    "minImportance": 0.5,
    "tags": ["programming", "security"]
  },
  "limit": 10,
  "offset": 0
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "mem_abc123",
      "content": "Use bcrypt for password hashing with cost factor 12",
      "summary": "Password hashing best practices",
      "type": "PROCEDURAL",
      "importance": 0.85,
      "provider": "claude",
      "createdAt": "2024-01-10T15:30:00Z",
      "relevance": 0.92
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Create Memory

```http
POST /api/memories
```

**Request Body:**

```json
{
  "content": "This is my important memory",
  "type": "FACTUAL",
  "importance": 0.8,
  "tags": ["personal", "important"],
  "metadata": {
    "customField": "value"
  }
}
```

### Update Memory

```http
PUT /api/memories/:id
```

**Request Body:**

```json
{
  "content": "Updated content",
  "importance": 0.9,
  "tags": ["updated", "important"]
}
```

### Delete Memory

```http
DELETE /api/memories/:id
```

---

## Collections API

### List Collections

```http
GET /api/collections
```

### Create Collection

```http
POST /api/collections
```

**Request Body:**

```json
{
  "name": "Work Projects",
  "description": "All work-related conversations",
  "visibility": "circle",
  "color": "#3B82F6",
  "icon": "briefcase"
}
```

### Add Item to Collection

```http
POST /api/collections/:collectionId/items
```

**Request Body:**

```json
{
  "itemType": "conversation",
  "itemId": "conv_abc123"
}
```

---

## Users API

### Get Current User

```http
GET /api/users/me
```

**Response:**

```json
{
  "data": {
    "id": "user_123",
    "did": "did:vivim:user:abc123",
    "handle": "@johndoe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
    "createdAt": "2024-01-01T00:00:00Z",
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

### Update Current User

```http
PUT /api/users/me
```

**Request Body:**

```json
{
  "displayName": "John Smith",
  "settings": {
    "theme": "light"
  }
}
```

---

## Topics API

### List Topics

```http
GET /api/topics
```

### Get Topic

```http
GET /api/topics/:slug
```

---

## Entities API

### List Entities

```http
GET /api/entities
```

### Get Entity

```http
GET /api/entities/:id
```

---

## Search API

### Global Search

```http
POST /api/search
```

**Request Body:**

```json
{
  "query": "authentication JWT",
  "types": ["conversations", "memories"],
  "providers": ["chatgpt", "claude"],
  "dateRange": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "limit": 20,
  "highlight": true
}
```

---

## Sharing API

### Share Content

```http
POST /api/sharing/share
```

**Request Body:**

```json
{
  "contentType": "conversation",
  "contentId": "conv_abc123",
  "shareType": "link",
  "permissions": {
    "view": true,
    "annotate": true,
    "remix": false,
    "reshare": false
  },
  "expiresAt": "2024-02-15T00:00:00Z"
}
```

### Get Shared Content

```http
GET /api/sharing/shared/:shareId
```

### Revoke Share

```http
POST /api/sharing/revoke
```

**Request Body:**

```json
{
  "shareId": "share_abc123"
}
```

---

## Webhooks API

### List Webhooks

```http
GET /api/webhooks
```

### Create Webhook

```http
POST /api/webhooks
```

**Request Body:**

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["conversation.created", "memory.created"],
  "secret": "your-webhook-secret"
}
```

### Test Webhook

```http
POST /api/webhooks/:id/test
```

### Delete Webhook

```http
DELETE /api/webhooks/:id
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limits

Rate limits are enforced per API key:

| Plan | Requests/minute | Burst | Daily |
|------|-----------------|-------|-------|
| Free | 60 | 100 | 1,000 |
| Pro | 300 | 500 | 10,000 |
| Team | 1,000 | 2,000 | 100,000 |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705312800
X-RateLimit-Window: 60s
```

---

## Pagination

All list endpoints support cursor-based pagination:

```bash
# First page
GET /api/conversations?limit=20

# Next page
GET /api/conversations?limit=20&offset=20

# Or use cursor
GET /api/conversations?limit=20&cursor=eyJpZCI6ImNvbnZfMTIzIn0=
```

---

## Filtering Syntax

### Date Filters

```
?since=2024-01-01
?until=2024-01-31
?dateRange=2024-01-01,2024-01-31
```

### Array Filters

```
?provider=chatgpt
?providers=chatgpt,claude
?tags=includes:programming
?tags=any:programming,security
```

### Numeric Filters

```
?importance=gte:0.7
?messageCount=between:10,50
```

---

## SDK Quick Reference

### JavaScript/TypeScript SDK

```typescript
import { VIVIMClient } from '@vivim/sdk';

const client = new VIVIMClient({
  apiKey: process.env.VIVIM_API_KEY
});

// List conversations
const { data, pagination } = await client.conversations.list({
  limit: 20,
  provider: 'chatgpt'
});

// Search memories
const results = await client.memories.search({
  query: 'authentication',
  filters: { type: 'PROCEDURAL' }
});

// Create memory
await client.memories.create({
  content: 'Important fact',
  type: 'FACTUAL',
  importance: 0.8
});
```

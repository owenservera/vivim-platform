# API Overview

## Executive Summary

Sovereign Memory/Context System provides a comprehensive REST API for managing memories, contexts, synchronization, and portability operations. The API is designed to be:

- **Platform-agnostic**: Works with any client platform
- **Secure**: All operations authenticated and signed
- **Efficient**: Optimized for low-latency operations
- **Extensible**: Versioned API with backward compatibility

## Base URL

```
Production:  https://api.sovereign-memory.io
Staging:     https://api-staging.sovereign-memory.io
Local:       http://localhost:3000
```

## Authentication

### DID-Based Authentication

All API requests require authentication using Decentralized Identifiers (DIDs):

```bash
# Using Bearer token
curl -H "Authorization: Bearer $TOKEN" \
  https://api.sovereign-memory.io/api/v1/memory

# Using API key (for integrations)
curl -H "X-API-Key: $API_KEY" \
  https://api.sovereign-memory.io/api/v1/memory
```

### Authentication Flow

```
1. Client generates DID (did:key:z...)
2. Client signs request with Ed25519 private key
3. Server verifies signature
4. Server validates DID against authorized list
5. Server processes request
6. Server signs response with server key
7. Client verifies response signature
```

### Token Endpoints

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

## Core API Resources

### Memory Operations

#### Create Memory

```http
POST /api/v1/memory
Content-Type: application/json
Authorization: Bearer $TOKEN

{
  "type": "MEMORY",
  "content": [
    {
      "type": "text",
      "content": "My first memory",
      "language": "en"
    }
  ],
  "encrypted": true,
  "metadata": {
    "importance": 0.8,
    "tags": ["important", "work"]
  }
}
```

**Response:**
```json
{
  "id": "did:key:z...memory-id",
  "hash": "sovereign:sha3-256:1a2b3c4d...",
  "type": "MEMORY",
  "timestamp": "2026-03-09T12:00:00Z",
  "author": "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu",
  "signature": "base64-signature"
}
```

#### Get Memory

```http
GET /api/v1/memory/:id
Authorization: Bearer $TOKEN
```

#### Search Memories

```http
GET /api/v1/memory?search=typescript%20react&limit=10&after=cursor123
Authorization: Bearer $TOKEN
```

**Parameters:**
- `search` (optional): Search query
- `type` (optional): Filter by memory type
- `after` (optional): Cursor for pagination
- `limit` (optional): Max results (default: 20, max: 100)

#### Update Memory

```http
PUT /api/v1/memory/:id
Content-Type: application/json
Authorization: Bearer $TOKEN

{
  "content": [
    {
      "type": "text",
      "content": "Updated memory content"
    }
  ]
}
```

#### Delete Memory

```http
DELETE /api/v1/memory/:id
Authorization: Bearer $TOKEN
```

---

### Context Operations

#### Compile Context

```http
POST /api/v1/context/compile
Content-Type: application/json
Authorization: Bearer $TOKEN

{
  "userId": "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu",
  "types": ["IDENTITY_CORE", "GLOBAL_PREFS", "TOPIC"],
  "maxTokens": 4000,
  "referenceId": "topic-id-123"
}
```

**Response:**
```json
{
  "id": "bundle-id-123",
  "bundleType": "TOPIC",
  "compiledPrompt": "You are an AI assistant helping with...",
  "tokenCount": 3845,
  "composition": {
    "identity_core": { "tokens": 200, "included": true },
    "global_prefs": { "tokens": 150, "included": true },
    "topic": { "tokens": 500, "included": true },
    "entity": { "tokens": 0, "included": false },
    "conversation": { "tokens": 2995, "included": true }
  },
  "contentHash": "sovereign:sha3-256:5e6f7g8h...",
  "bundleSignature": "base64-signature",
  "compiledAt": "2026-03-09T12:00:00Z",
  "expiresAt": "2026-03-09T12:30:00Z"
}
```

#### Get Context Bundles

```http
GET /api/v1/context/bundles?userId=did:key:z...&types=IDENTITY_CORE,TOPIC
Authorization: Bearer $TOKEN
```

#### Invalidate Context

```http
POST /api/v1/context/invalidate
Content-Type: application/json
Authorization: Bearer $TOKEN

{
  "userId": "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu",
  "type": "TOPIC",
  "referenceId": "topic-id-123"
}
```

---

### Sync Operations

#### Handshake

```http
POST /api/v1/sync/handshake
Content-Type: application/json
Authorization: Bearer $TOKEN

{
  "deviceId": "device-abc123",
  "capabilities": ["memory-v1", "context-v1", "sync-v2"],
  "version": "1.0.0"
}
```

**Response:**
```json
{
  "sessionId": "session-xyz789",
  "serverTime": "2026-03-09T12:00:00Z",
  "hlcInitial": "1234567890-abc123",
  "capabilities": ["memory-v1", "context-v1", "sync-v2"]
}
```

#### Get Sync Delta

```http
GET /api/v1/sync/delta?deviceId=device-abc123&since=1234567890-abc123
Authorization: Bearer $TOKEN
```

**Response:**
```json
{
  "operations": [
    {
      "hlcTimestamp": "1234567890-abc124",
      "entityType": "memory",
      "entityId": "did:key:z...memory-id",
      "operation": "CREATE",
      "payload": { /* memory data */ },
      "authorDid": "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkG4smIC1kqr1RV1Lu",
      "deviceDid": "device-abc123"
    }
  ],
  "cursor": "1234567890-abc125",
  "requiresManualResolution": []
}
```

#### Push Sync Operations

```http
POST /api/v1/sync/push
Content-Type: application/json
Authorization: Bearer $TOKEN

{
  "deviceId": "device-abc123",
  "operations": [
    {
      "hlcTimestamp": "1234567890-def456",
      "entityType": "memory",
      "entityId": "did:key:z...memory-id",
      "operation": "CREATE",
      "payload": { /* memory data */ }
    }
  ]
}
```

#### Resolve Conflicts

```http
POST /api/v1/sync/resolve
Content-Type: application/json
Authorization: Bearer $TOKEN

{
  "conflicts": [
    {
      "operationId": "op-123",
      "resolution": "KEEP_LOCAL",
      "resolvedContent": { /* merged content */ }
    }
  ]
}
```

---

### Portability Operations

#### Request Export

```http
POST /api/v1/portability/export
Content-Type: application/json
Authorization: Bearer $TOKEN

{
  "format": "sovereign-v1",
  "encrypted": true,
  "includeContent": true,
  "includeSettings": true,
  "includeKeys": false
}
```

**Response:**
```json
{
  "exportId": "export-abc123",
  "status": "processing",
  "estimatedSize": 25000000,
  "estimatedCompletion": "2026-03-09T12:30:00Z",
  "createdAt": "2026-03-09T12:00:00Z"
}
```

#### Get Export Status

```http
GET /api/v1/portability/export/:exportId
Authorization: Bearer $TOKEN
```

**Response:**
```json
{
  "exportId": "export-abc123",
  "status": "completed",
  "url": "https://cdn.sovereign-memory.io/exports/export-abc123.zip",
  "expiresAt": "2026-03-10T12:00:00Z",
  "size": 24589000,
  "contentHash": "sovereign:sha3-256:9a8b7c6d...",
  "integrityProofs": [
    {
      "hash": "sovereign:sha3-256:...",
      "merkleRoot": "sovereign:sha3-256:..."
    }
  ]
}
```

#### Import Data

```http
POST /api/v1/portability/import
Content-Type: multipart/form-data
Authorization: Bearer $TOKEN

file=@export.zip
&format=sovereign-v1
&conflictStrategy=KEEP_NEWEST
```

**Response:**
```json
{
  "importId": "import-xyz789",
  "status": "processing",
  "estimatedOperations": 1520,
  "createdAt": "2026-03-09T12:00:00Z"
}
```

#### Verify Export

```http
POST /api/v1/portability/verify
Content-Type: application/json
Authorization: Bearer $TOKEN

{
  "exportHash": "sovereign:sha3-256:9a8b7c6d...",
  "merkleProof": {
    "root": "sovereign:sha3-256:...",
    "leaf": "sovereign:sha3-256:...",
    "path": [
      { "hash": "...", "direction": "left" },
      { "hash": "...", "direction": "right" }
    ]
  }
}
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('wss://api.sovereign-memory.io/ws');

ws.onopen = () => {
  // Send handshake
  ws.send(JSON.stringify({
    type: 'handshake',
    deviceId: 'device-abc123',
    token: 'Bearer eyJhbGc...',
    capabilities: ['memory-v1', 'sync-v2']
  }));
};
```

### Real-time Sync Events

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'sync_delta':
      // Handle incoming sync operations
      processSyncDelta(message.payload);
      break;

    case 'conflict':
      // Handle sync conflict
      handleConflict(message.payload);
      break;

    case 'pong':
      // Heartbeat response
      break;

    default:
      console.warn('Unknown message type:', message.type);
  }
};
```

### Heartbeat

```javascript
// Send ping every 30 seconds
setInterval(() => {
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: Date.now()
  }));
}, 30000);
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided authentication token is invalid or expired",
    "details": {
      "token": "Bearer eyJhbGc...",
      "expiredAt": "2026-03-08T12:00:00Z"
    },
    "requestId": "req-abc123-xyz789"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TOKEN` | 401 | Authentication token is invalid or expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Rate Limiting

- **Authenticated requests**: 1000 requests per hour per user
- **Unauthenticated requests**: 100 requests per hour per IP
- **WebSockets**: 10 concurrent connections per user

Headers included in rate-limited responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 850
X-RateLimit-Reset: 1677788800
```

---

## API Versioning

### Version Strategy

- **URL-based versioning**: `/api/v1/`, `/api/v2/`, etc.
- **Backward compatibility**: Minor versions maintain compatibility
- **Deprecation timeline**: 6 months notice before deprecation
- **Semantic versioning**: MAJOR.MINOR.PATCH

### Version Detection

```http
GET /api/v1/version
```

**Response:**
```json
{
  "version": "1.0.0",
  "latestVersion": "1.2.0",
  "deprecationNotice": null,
  "supportedVersions": ["1.0.0", "1.1.0", "1.2.0"]
}
```

---

## SDK Reference

The API has official SDKs for:

### JavaScript/TypeScript

```typescript
import { SovereignMemoryClient } from '@sovereign-memory/sdk';

const client = new SovereignMemoryClient({
  apiUrl: 'https://api.sovereign-memory.io',
  token: 'Bearer eyJhbGc...'
});

const memory = await client.createMemory({
  type: 'MEMORY',
  content: [{ type: 'text', content: 'My memory' }],
  encrypted: true
});
```

### React SDK

```typescript
import { useMemory, useMemorySearch } from '@sovereign-memory/react';

function MemoryComponent({ id }: { id: string }) {
  const { data: memory, error, isLoading } = useMemory(id);
  // ... use memory
}

function SearchComponent({ query }: { query: string }) {
  const { data: memories } = useMemorySearch(query);
  // ... display results
}
```

### Go SDK (Coming Soon)

```go
import "github.com/sovereign-memory/go-sdk"

client := sdk.NewClient("https://api.sovereign-memory.io", token)
memory, err := client.CreateMemory(&sdk.MemoryInput{
    Type: "MEMORY",
    Content: []sdk.ContentBlock{
        {Type: "text", Content: "My memory"},
    },
})
```

---

## Testing

### Test Environment

```
URL: https://api-test.sovereign-memory.io
Features: Full API with test data
Rate Limits: Relaxed
Data: Reset daily at 00:00 UTC
```

### API Examples

Use the interactive API explorer:
https://api-test.sovereign-memory.io/docs

---

## Support

### Documentation
- [API Reference](./api/)
- [Authentication Guide](./authentication.md)
- [Error Handling](./error-handling.md)

### Tools
- [Postman Collection](https://api.sovereign-memory.io/postman)
- [OpenAPI Specification](https://api.sovereign-memory.io/openapi.yaml)
- [GraphQL Playground](https://api.sovereign-memory.io/graphql)

### Community
- [GitHub Discussions](https://github.com/sovereign-memory/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/sovereign-memory-api)
- [API Status](https://status.sovereign-memory.io)

---

**Document Version**: 1.0.0
**Last Updated**: 2026-03-09
**Related Documents**:
- [Authentication Guide](./authentication.md)
- [SDK Documentation](./sdk/)
- [WebSocket Protocol](./websocket.md)
- [Error Handling](./error-handling.md)

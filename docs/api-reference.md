itle: "API Reference"
description: "VIVIM REST API reference for memory management, context assembly, conversations, and federation."
---

# API Reference

VIVIM exposes a REST API at `/api/v1/` for programmatic access to all platform capabilities.

## Authentication

All API endpoints require authentication via API key:

```
Authorization: Bearer YOUR_API_KEY
```

For self-hosted instances, API keys can be disabled in development mode.

## Base URL

| Environment | URL |
|---|---|
| **Cloud** | `https://api.vivim.app/api/v1` |
| **Self-hosted** | `http://localhost:3000/api/v1` |

## Endpoints

### Health

```
GET /api/v1/health
```

Check service health.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600
}
```

### Memory

#### List memories

```
GET /api/v1/memory
```

**Query parameters:**
| Parameter | Type | Description |
|---|---|---|
| `limit` | `number` | Max results (default: 20) |
| `offset` | `number` | Pagination offset |
| `type` | `string` | Filter by memory type |
| `sort` | `string` | Sort field (`created_at`, `updated_at`) |

#### Search memories

```
POST /api/v1/memory/search
```

**Request body:**
```json
{
  "query": "deployment strategy",
  "filters": {
    "types": ["semantic", "factual"]
  },
  "limit": 10
}
```

#### Create memory

```
POST /api/v1/memory
```

**Request body:**
```json
{
  "content": "We deploy to Vercel using the CLI",
  "type": "procedural",
  "tags": ["deployment", "vercel"]
}
```

#### Get memory

```
GET /api/v1/memory/:id
```

#### Update memory

```
PATCH /api/v1/memory/:id
```

#### Delete memory

```
DELETE /api/v1/memory/:id
```

### Conversations

#### List conversations

```
GET /api/v1/conversations
```

#### Import conversation

```
POST /api/v1/conversations/import
```

**Request body:**
```json
{
  "provider": "openai",
  "format": "json",
  "data": { "messages": [...] }
}
```

#### Get conversation

```
GET /api/v1/conversations/:id
```

### Context

#### Assemble context

```
POST /api/v1/context/assemble
```

**Request body:**
```json
{
  "query": "How do I deploy?",
  "maxTokens": 4000,
  "layers": ["identity", "goals", "relevant"]
}
```

### Collections

#### List collections

```
GET /api/v1/collections
```

#### Create collection

```
POST /api/v1/collections
```

#### Add memory to collection

```
POST /api/v1/collections/:id/memories
```

### Sharing

#### List circles

```
GET /api/v1/circles
```

#### Create circle

```
POST /api/v1/circles
```

#### Share memory

```
POST /api/v1/circles/:id/share
```

### Observability

#### Get metrics

```
GET /api/v1/observability/metrics
```

Returns Prometheus-format metrics.


::: info
For detailed parameter documentation and request/response examples, see the full API specification in the [server/docs/](https://github.com/owenservera/vivim-platform/tree/main/server/docs) directory.
:::


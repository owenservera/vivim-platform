---
title: API Overview
description: VIVIM API Endpoints
---

# API Overview

VIVIM provides a comprehensive REST API for conversation capture, context management, and social features.

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000` |
| Production | `https://api.vivim.app` |

## API Versions

| Version | Prefix | Status |
|---------|--------|--------|
| v1 | `/api/v1` | Stable |
| v2 | `/api/v2` | Current |
| Admin | `/api/admin` | Internal |

## Authentication

### Session-Based Auth

```bash
# Login with Google
GET /api/v1/auth/google
# Redirects to Google OAuth

# Session cookie (HttpOnly, Secure)
Set-Cookie: connect.sid=s%3A...; Path=/; HttpOnly; Secure
```

### API Key Auth

```bash
# Using API key
curl -H "X-API-Key: vivim_sk_xxxx" \
  https://api.vivim.app/api/v1/conversations
```

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token or session |
| `X-API-Key` | Conditional | For API key authentication |
| `Content-Type` | Yes | `application/json` |
| `X-Request-ID` | No | Request tracking ID |

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid source URL",
    "details": { ... }
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

### Pagination

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

## Rate Limits

| Tier | Requests | Window |
|------|----------|--------|
| Free | 100 | 15 minutes |
| Pro | 1000 | 15 minutes |
| Enterprise | 10000 | 15 minutes |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```

---

## Endpoint Categories

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/capture` | Capture conversation from URL |
| GET | `/api/v1/conversations` | List conversations |
| GET | `/api/v1/conversations/:id` | Get conversation |
| DELETE | `/api/v1/conversations/:id` | Delete conversation |

### Context Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/context` | Get context for AI |
| POST | `/api/v1/context/bundle` | Create context bundle |
| PUT | `/api/v1/context/settings` | Update context preferences |

### Social Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/circles` | List circles |
| POST | `/api/v2/circles` | Create circle |
| GET | `/api/v2/feed` | Get social feed |

### ACU Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/acus` | List ACUs |
| POST | `/api/v1/acus` | Create ACU |
| PUT | `/api/v1/acus/:id` | Update ACU |

---

## WebSocket Events

Connect to: `wss://api.vivim.app/ws`

```typescript
// Authentication
{ "type": "auth", "token": "session_token" }

// Subscribe to updates
{ "type": "subscribe", "channel": "conversations" }

// Events received
{ "type": "conversation:updated", "data": { ... } }
{ "type": "sync:status", "data": { ... } }
```

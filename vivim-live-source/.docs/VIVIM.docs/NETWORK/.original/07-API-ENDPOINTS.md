# API Endpoint Specifications

## Overview

This document provides detailed API specifications for VIVIM's network sharing system. The API enables frontend clients to interact with the sharing, publishing, and network orchestration layers.

## Database Architecture

The API operates across both databases:

- **Master Database (PostgreSQL)**: Identity, auth, sharing metadata, circle data
- **User Databases (SQLite)**: User content (conversations, ACUs, profiles)

## Base Configuration

```
Base URL: /api/v1
Protocol: HTTPS
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

### Success Response

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: PaginationInfo;
  };
}
```

### Error Response

```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}
```

### Pagination

```typescript
interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
  cursor?: string;
}
```

---

## Sharing Intent API

### Create Intent

Create a new sharing intent.

```http
POST /sharing/intents
```

**Request Body:**

```typescript
interface CreateIntentRequest {
  content: {
    type: 'conversation' | 'acu' | 'collection' | 'annotation';
    ids: string[];
    scope?: 'full' | 'partial' | 'summary' | 'preview';
    includeACUs?: string[];
    excludeACUs?: string[];
  };
  
  audience: {
    type: 'public' | 'circle' | 'users' | 'link';
    circleIds?: string[];
    userDids?: string[];
  };
  
  permissions: {
    view: boolean;
    copy?: boolean;
    annotate?: boolean;
    remix?: boolean;
    share?: boolean;
    download?: boolean;
  };
  
  schedule?: {
    publishAt?: string; // ISO 8601
    expiresAt?: string; // ISO 8601
  };
  
  transformations?: {
    removeSystemMessages?: boolean;
    removeToolCalls?: boolean;
    removeImages?: boolean;
    redactPersonalInfo?: boolean;
    addWatermark?: boolean;
    addAttribution?: boolean;
    anonymizeUserMessages?: boolean;
    anonymizeAIMessages?: boolean;
  };
  
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}
```

**Response:**

```typescript
interface CreateIntentResponse {
  intent: SharingIntent;
  validation: {
    valid: boolean;
    warnings?: string[];
  };
}
```

**Example:**

```bash
curl -X POST /api/v1/sharing/intents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "type": "conversation",
      "ids": ["conv-123"]
    },
    "audience": {
      "type": "circle",
      "circleIds": ["circle-friends"]
    },
    "permissions": {
      "view": true,
      "annotate": true
    }
  }'
```

---

### Get Intent

Retrieve a specific sharing intent.

```http
GET /sharing/intents/:intentId
```

**Response:**

```typescript
interface GetIntentResponse {
  intent: SharingIntent;
  permissions?: SharePermission[];
  analytics?: ContentAnalytics;
}
```

---

### Update Intent

Update an existing sharing intent.

```http
PATCH /sharing/intents/:intentId
```

**Request Body:**

```typescript
interface UpdateIntentRequest {
  audience?: {
    type: 'public' | 'circle' | 'users' | 'link';
    circleIds?: string[];
    userDids?: string[];
  };
  
  permissions?: {
    view: boolean;
    copy?: boolean;
    annotate?: boolean;
    remix?: boolean;
    share?: boolean;
    download?: boolean;
  };
  
  schedule?: {
    publishAt?: string;
    expiresAt?: string;
  };
  
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}
```

---

### List Intents

List sharing intents for the authenticated user.

```http
GET /sharing/intents
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (draft, active, expired, revoked) |
| contentType | string | Filter by content type |
| audienceType | string | Filter by audience type |
| startDate | string | Filter by created date (ISO) |
| endDate | string | Filter by created date (ISO) |
| page | number | Page number (default: 1) |
| pageSize | number | Items per page (default: 20) |
| sortBy | string | Sort field (createdAt, publishedAt) |
| sortOrder | string | Sort order (asc, desc) |

**Response:**

```typescript
interface ListIntentsResponse {
  intents: SharingIntent[];
  pagination: PaginationInfo;
}
```

---

### Publish Intent

Publish a sharing intent to the network.

```http
POST /sharing/intents/:intentId/publish
```

**Response:**

```typescript
interface PublishIntentResponse {
  success: boolean;
  contentId: string;
  distribution: {
    providers: string[];
    replicas: number;
  };
  publishedAt: string;
}
```

---

### Revoke Intent

Revoke a shared content.

```http
POST /sharing/intents/:intentId/revoke
```

**Request Body:**

```typescript
interface RevokeIntentRequest {
  reason?: string;
  notifyRecipients?: boolean;
}
```

---

## Share Links API

### Create Share Link

Create a shareable link for content.

```http
POST /sharing/links
```

**Request Body:**

```typescript
interface CreateShareLinkRequest {
  intentId: string;
  maxUses?: number;
  expiresAt?: string;
  password?: string;
}
```

**Response:**

```typescript
interface CreateShareLinkResponse {
  link: ShareLink;
  url: string; // Full shareable URL
}
```

---

### Get Share Link

Access content via share link.

```http
GET /sharing/links/:linkCode
```

**Response:**

```typescript
interface GetShareLinkResponse {
  content: {
    contentId: string;
    preview: ContentPreview;
    permissions: Permissions;
  };
  requiresPassword: boolean;
}
```

---

### Access with Password

Access password-protected share link.

```http
POST /sharing/links/:linkCode/access
```

**Request Body:**

```typescript
interface AccessShareLinkRequest {
  password: string;
}
```

---

## Content API

### Get Content

Retrieve shared content from the owner's user database.

```http
GET /content/:contentId
```

**Response:**

```typescript
interface GetContentResponse {
  content: EncryptedContent;
  metadata: ContentMetadata;
  permissions: EffectivePermissions;
}
```

**Implementation Note:**
- Content is fetched from the owner's SQLite database
- ContentRecord metadata is retrieved from Master DB (PostgreSQL)

---

### Query Content

Search for shared content.

```http
GET /content
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query |
| ownerDid | string | Filter by owner |
| contentType | string | Filter by type |
| tags | string | Filter by tags |
| audience | string | Filter by audience type |
| page | number | Page number |
| pageSize | number | Items per page |

**Response:**

```typescript
interface QueryContentResponse {
  results: ContentSummary[];
  pagination: PaginationInfo;
}
```

---

## Circle API (Extended for Sharing)

### Share to Circle

Share content to a circle.

```http
POST /circles/:circleId/shares
```

**Request Body:**

```typescript
interface ShareToCircleRequest {
  contentId: string;
  permissions: {
    view: boolean;
    annotate?: boolean;
    copy?: boolean;
    share?: boolean;
  };
  notifyMembers?: boolean;
}
```

---

### Get Circle Shares

Get all shares associated with a circle.

```http
GET /circles/:circleId/shares
```

**Response:**

```typescript
interface GetCircleSharesResponse {
  shares: CircleShare[];
  stats: {
    totalShares: number;
    totalViews: number;
    activeMembers: number;
  };
}
```

---

## Analytics API

### Get User Analytics

Get sharing analytics for a user.

```http
GET /analytics/user/:did/sharing
```

**Response:**

```typescript
interface GetUserAnalyticsResponse {
  metrics: UserSharingMetrics;
  trends: TrendData;
  topContent: ContentMetrics[];
}
```

---

### Get Content Analytics

Get analytics for specific content.

```http
GET /analytics/content/:contentId
```

**Response:**

```typescript
interface GetContentAnalyticsResponse {
  metrics: ContentSharingMetrics;
  reach: ReachMetrics;
  timeline: TimeSeriesData;
  viewers: ViewerInfo[];
}
```

---

### Get Activity Log

Get user's sharing activity log.

```http
GET /analytics/activity
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date |
| endDate | string | End date |
| eventTypes | string | Comma-separated event types |
| page | number | Page number |
| pageSize | number | Items per page |

---

### Get Insights

Get AI-generated insights.

```http
GET /analytics/insights
```

**Response:**

```typescript
interface GetInsightsResponse {
  insights: Insight[];
  unreadCount: number;
}
```

---

### Mark Insight as Read

Mark an insight as read.

```http
POST /analytics/insights/:insightId/read
```

---

## Network API

### Get Network Status

Get current network status.

```http
GET /network/status
```

**Response:**

```typescript
interface GetNetworkStatusResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  nodeCount: number;
  activeConnections: number;
  contentCount: number;
  latency: {
    avg: number;
    p50: number;
    p99: number;
  };
}
```

---

### Get Content Providers

Get providers for specific content.

```http
GET /network/content/:contentId/providers
```

**Response:**

```typescript
interface GetProvidersResponse {
  contentId: string;
  providers: ProviderInfo[];
  replicaCount: number;
  availability: 'high' | 'medium' | 'low';
}
```

---

### Request Content

Request content from the network.

```http
POST /network/content/:contentId/request
```

**Response:**

```typescript
interface RequestContentResponse {
  requestId: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  estimatedTime?: number;
}
```

---

## Permissions API

### Check Permission

Check if user has permission to access content.

```http
GET /permissions/:contentId/check
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userDid | string | User's DID |
| permission | string | Permission to check (view, copy, etc.) |

**Response:**

```typescript
interface CheckPermissionResponse {
  allowed: boolean;
  permission: Permission;
  expiresAt?: string;
  reason?: string;
}
```

---

### Get Effective Permissions

Get effective permissions for a user.

```http
GET /permissions/:contentId/effective
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userDid | string | User's DID |

---

## WebSocket API

### Analytics Stream

Subscribe to real-time analytics updates.

```http
WS /ws/analytics
```

**Subscription Message:**

```typescript
interface AnalyticsSubscription {
  type: 'subscribe';
  channel: 'user' | 'content' | 'network';
  entityId?: string;
}
```

**Event Messages:**

```typescript
interface AnalyticsEventMessage {
  type: 'event';
  event: {
    eventType: string;
    data: any;
    timestamp: string;
  };
}
```

---

### Network Stream

Subscribe to network status updates.

```http
WS /ws/network
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| VALIDATION_ERROR | Invalid request data | 400 |
| UNAUTHORIZED | Authentication required | 401 |
| FORBIDDEN | Insufficient permissions | 403 |
| NOT_FOUND | Resource not found | 404 |
| CONFLICT | Resource conflict | 409 |
| RATE_LIMITED | Too many requests | 429 |
| INTERNAL_ERROR | Server error | 500 |
| SERVICE_UNAVAILABLE | Service unavailable | 503 |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /sharing/intents | 10/minute |
| GET /sharing/intents | 60/minute |
| POST /sharing/links | 20/minute |
| GET /content | 120/minute |
| GET /analytics/* | 30/minute |

Rate limit headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Versioning

API versioning via URL path:

```
/api/v1/sharing/intents
```

Version deprecation:
- Deprecated versions return `Warning` header
- Deprecated date in response body
- 12-month deprecation period

---

## Conclusion

This API specification provides comprehensive endpoints for:

- **Sharing Intent Management**: Create, update, publish, revoke
- **Share Links**: Create and manage shareable links
- **Content Access**: Retrieve and query shared content
- **Circle Integration**: Share to circles
- **Analytics**: User and content metrics
- **Network**: Content providers and status
- **Permissions**: Access control checking
- **Real-time**: WebSocket subscriptions

The API is designed for:
- RESTful best practices
- Consistent response formats
- Comprehensive error handling
- Rate limiting protection
- Versioning support

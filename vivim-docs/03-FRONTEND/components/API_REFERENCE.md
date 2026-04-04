# Frontend API Reference

> **Purpose**: Complete API endpoint reference for VIVIM frontend  
> **Related**: FRONTEND.md

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Conversations](#2-conversations)
3. [Messages](#3-messages)
4. [Capture](#4-capture)
5. [Feed](#5-feed)
6. [ACU](#6-acu)
7. [Users](#7-users)
8. [Collections](#8-collections)
9. [Settings](#9-settings)
10. [Context](#10-context)
11. [Sync](#11-sync)

---

## 1. Authentication

### POST /api/v1/auth/register

Register a new user.

**Request**:
```typescript
{
  email: string;
  password: string;
  displayName?: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}
```

### POST /api/v1/auth/login

Authenticate user.

**Request**:
```typescript
{
  email: string;
  password: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}
```

### POST /api/v1/auth/logout

Logout user.

**Response**:
```typescript
{
  success: true;
  message: 'Logged out successfully';
}
```

### POST /api/v1/auth/refresh

Refresh access token.

**Request**:
```typescript
{
  refreshToken: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}
```

### POST /api/v1/auth/magic-link

Send magic link email.

**Request**:
```typescript
{
  email: string;
}
```

**Response**:
```typescript
{
  success: true;
  message: 'Magic link sent';
}
```

---

## 2. Conversations

### GET /api/v1/conversations

Get list of conversations.

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  provider?: string;
  startDate?: string; // ISO date
  endDate?: string;
  sortBy?: 'capturedAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    conversations: Conversation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### GET /api/v1/conversations/:id

Get single conversation.

**Response**:
```typescript
{
  success: true;
  data: Conversation;
}
```

### POST /api/v1/conversations

Create new conversation.

**Request**:
```typescript
{
  title: string;
  provider: string;
  sourceUrl?: string;
  messages?: CreateMessageInput[];
}
```

**Response**:
```typescript
{
  success: true;
  data: Conversation;
}
```

### PUT /api/v1/conversations/:id

Update conversation.

**Request**:
```typescript
{
  title?: string;
  metadata?: Record<string, any>;
}
```

**Response**:
```typescript
{
  success: true;
  data: Conversation;
}
```

### DELETE /api/v1/conversations/:id

Delete conversation.

**Response**:
```typescript
{
  success: true;
  message: 'Conversation deleted';
}
```

### POST /api/v1/conversations/:id/bookmark

Bookmark conversation.

**Response**:
```typescript
{
  success: true;
  data: {
    isBookmarked: boolean;
  };
}
```

---

## 3. Messages

### GET /api/v1/conversations/:conversationId/messages

Get messages for conversation.

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  role?: 'user' | 'assistant';
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    messages: Message[];
    pagination: Pagination;
  };
}
```

### GET /api/v1/messages/:id

Get single message.

**Response**:
```typescript
{
  success: true;
  data: Message;
}
```

### POST /api/v1/conversations/:conversationId/messages

Create message in conversation.

**Request**:
```typescript
{
  role: 'user' | 'assistant';
  parts: ContentPart[];
}
```

**Response**:
```typescript
{
  success: true;
  data: Message;
}
```

### PUT /api/v1/messages/:id

Update message.

**Request**:
```typescript
{
  parts?: ContentPart[];
}
```

**Response**:
```typescript
{
  success: true;
  data: Message;
}
```

### DELETE /api/v1/messages/:id

Delete message.

**Response**:
```typescript
{
  success: true;
  message: 'Message deleted';
}
```

---

## 4. Capture

### POST /api/v1/capture

Capture conversation from URL.

**Request**:
```typescript
{
  url: string;
  provider?: string; // auto-detect if not provided
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    captureId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  };
}
```

### GET /api/v1/capture/:id/status

Get capture status.

**Response**:
```typescript
{
  success: true;
  data: {
    captureId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    logs?: string[];
    error?: string;
    conversationId?: string;
  };
}
```

### GET /api/v1/capture/:id/result

Get capture result.

**Response**:
```typescript
{
  success: true;
  data: {
    conversation: Conversation;
    metrics: {
      messageCount: number;
      wordCount: number;
      codeBlockCount: number;
    };
  };
}
```

### POST /api/v1/capture/validate-url

Validate capture URL.

**Request**:
```typescript
{
  url: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    isValid: boolean;
    provider?: string;
    providerName?: string;
    error?: string;
  };
}
```

---

## 5. Feed

### GET /api/v1/feed/for-you

Get personalized feed.

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    items: FeedItem[];
    pagination: Pagination;
  };
}
```

### GET /api/v1/feed/following

Get following feed.

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    items: FeedItem[];
    pagination: Pagination;
  };
}
```

### GET /api/v1/feed/trending

Get trending feed.

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  timeframe?: 'day' | 'week' | 'month';
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    items: FeedItem[];
    pagination: Pagination;
  };
}
```

### POST /api/v1/feed/:type/:id/like

Like feed item.

**Response**:
```typescript
{
  success: true;
  data: {
    likeCount: number;
    isLiked: boolean;
  };
}
```

### POST /api/v1/feed/:type/:id/save

Save feed item.

**Response**:
```typescript
{
  success: true;
  data: {
    isSaved: boolean;
  };
}
```

### POST /api/v1/feed/:type/:id/fork

Fork feed item.

**Request**:
```typescript
{
  title?: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    forkedId: string;
    forkCount: number;
  };
}
```

### POST /api/v1/feed/:type/:id/share

Share feed item.

**Request**:
```typescript
{
  policy: 'public' | 'unlisted' | 'circle';
  circleIds?: string[];
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    shareUrl: string;
  };
}
```

---

## 6. ACU

### GET /api/v1/acus

Search ACUs.

**Query Parameters**:
```typescript
{
  query?: string;
  type?: string;
  category?: string;
  conversationId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'qualityOverall' | 'viewCount';
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    acus: AtomicChatUnit[];
    pagination: Pagination;
  };
}
```

### GET /api/v1/acus/:id

Get single ACU.

**Response**:
```typescript
{
  success: true;
  data: AtomicChatUnit;
}
```

### POST /api/v1/acus

Create ACU manually.

**Request**:
```typescript
{
  content: string;
  type: string;
  category: string;
  conversationId: string;
  messageId: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: AtomicChatUnit;
}
```

### POST /api/v1/acus/:id/share

Share ACU.

**Request**:
```typescript
{
  policy: 'public' | 'unlisted' | 'circle';
  circleIds?: string[];
  expiresAt?: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    shareUrl: string;
  };
}
```

### POST /api/v1/acus/:id/fork

Fork ACU to own vault.

**Response**:
```typescript
{
  success: true;
  data: AtomicChatUnit;
}
```

---

## 7. Users

### GET /api/v1/users/me

Get current user.

**Response**:
```typescript
{
  success: true;
  data: User;
}
```

### PUT /api/v1/users/me

Update current user.

**Request**:
```typescript
{
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  links?: Array<{ platform: string; url: string }>;
}
```

**Response**:
```typescript
{
  success: true;
  data: User;
}
```

### GET /api/v1/users/:id

Get user profile.

**Response**:
```typescript
{
  success: true;
  data: {
    user: User;
    stats: {
      conversationCount: number;
      followerCount: number;
      followingCount: number;
    };
    isFollowing: boolean;
  };
}
```

### POST /api/v1/users/:id/follow

Follow user.

**Response**:
```typescript
{
  success: true;
  data: {
    followerCount: number;
    isFollowing: boolean;
  };
}
```

### DELETE /api/v1/users/:id/follow

Unfollow user.

**Response**:
```typescript
{
  success: true;
  data: {
    followerCount: number;
    isFollowing: boolean;
  };
}
```

### GET /api/v1/users/:id/conversations

Get user's public conversations.

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    conversations: Conversation[];
    pagination: Pagination;
  };
}
```

### GET /api/v1/users/:id/acus

Get user's shared ACUs.

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    acus: AtomicChatUnit[];
    pagination: Pagination;
  };
}
```

---

## 8. Collections

### GET /api/v1/collections

Get user's collections.

**Response**:
```typescript
{
  success: true;
  data: {
    collections: Collection[];
  };
}
```

### POST /api/v1/collections

Create collection.

**Request**:
```typescript
{
  name: string;
  description?: string;
  isPublic?: boolean;
}
```

**Response**:
```typescript
{
  success: true;
  data: Collection;
}
```

### PUT /api/v1/collections/:id

Update collection.

**Request**:
```typescript
{
  name?: string;
  description?: string;
  isPublic?: boolean;
}
```

**Response**:
```typescript
{
  success: true;
  data: Collection;
}
```

### DELETE /api/v1/collections/:id

Delete collection.

**Response**:
```typescript
{
  success: true;
  message: 'Collection deleted';
}
```

### POST /api/v1/collections/:id/items

Add item to collection.

**Request**:
```typescript
{
  type: 'conversation' | 'acu';
  itemId: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: Collection;
}
```

### DELETE /api/v1/collections/:id/items/:itemId

Remove item from collection.

**Response**:
```typescript
{
  success: true;
  message: 'Item removed from collection';
}
```

---

## 9. Settings

### GET /api/v1/settings

Get user settings.

**Response**:
```typescript
{
  success: true;
  data: UserSettings;
}
```

### PUT /api/v1/settings

Update user settings.

**Request**:
```typescript
{
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  defaultProvider?: string;
  defaultModel?: string;
  syncEnabled?: boolean;
  syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'manual';
}
```

**Response**:
```typescript
{
  success: true;
  data: UserSettings;
}
```

### GET /api/v1/settings/ai-keys

Get user's AI API keys (encrypted).

**Response**:
```typescript
{
  success: true;
  data: {
    keys: Array<{
      id: string;
      provider: string;
      name: string;
      lastUsed?: string;
      createdAt: string;
    }>;
  };
}
```

### POST /api/v1/settings/ai-keys

Add AI API key.

**Request**:
```typescript
{
  provider: string;
  apiKey: string;
  name?: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    id: string;
    provider: string;
    name: string;
  };
}
```

### DELETE /api/v1/settings/ai-keys/:id

Remove AI API key.

**Response**:
```typescript
{
  success: true;
  message: 'API key removed';
}
```

### POST /api/v1/settings/ai-keys/:id/validate

Validate AI API key.

**Response**:
```typescript
{
  success: true;
  data: {
    isValid: boolean;
    error?: string;
  };
}
```

---

## 10. Context

### GET /api/v1/context/health

Get context engine health.

**Response**:
```typescript
{
  success: true;
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    topicProfiles: number;
    entityProfiles: number;
    contextBundles: number;
    dirtyBundles: number;
  };
}
```

### POST /api/v1/context/presence/:userId

Update presence.

**Request**:
```typescript
{
  deviceId: string;
  activeConversationId?: string;
  visibleConversationIds: string[];
  lastNavigationPath?: string;
  localTime: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    sessionId: string;
  };
}
```

### POST /api/v1/context/warmup/:userId

Trigger context warmup.

**Request**:
```typescript
{
  deviceId?: string;
  force?: boolean;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    freshTopicBundles: number;
    freshEntityBundles: number;
    freshConversationBundles: number;
    dirtyBundles: number;
  };
}
```

### POST /api/v1/context/invalidate/:userId

Trigger context invalidation.

**Request**:
```typescript
{
  eventType: string;
  relatedIds?: {
    topicId?: string;
    entityId?: string;
    conversationId?: string;
    memoryId?: string;
  };
}
```

**Response**:
```typescript
{
  success: true;
  message: 'Invalidation queued';
}
```

---

## 11. Sync

### GET /api/v1/sync/status

Get sync status.

**Response**:
```typescript
{
  success: true;
  data: {
    lastSyncedAt?: string;
    pendingChanges: number;
    isSyncing: boolean;
    conflicts?: SyncConflict[];
  };
}
```

### POST /api/v1/sync/push

Push local changes.

**Request**:
```typescript
{
  changes: SyncChange[];
  lastSyncedAt?: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    syncedAt: string;
    results: Array<{
      id: string;
      status: 'success' | 'conflict' | 'error';
      error?: string;
    }>;
  };
}
```

### GET /api/v1/sync/pull

Pull remote changes.

**Query Parameters**:
```typescript
{
  since?: string;
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    changes: SyncChange[];
    syncedAt: string;
  };
}
```

---

## Common Types

### Pagination

```typescript
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}
```

### API Response

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 14, 2026

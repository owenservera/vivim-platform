# API Endpoints and Routing Implementation Guide

**Document Version:** 1.0.0
**Date:** February 11, 2026
**Related:** `IMPLEMENTATION_GUIDE_MASTER.md`, `SERVICE_LAYER_SPECIFICATIONS.md`

---

## Table of Contents

1. [API Architecture](#api-architecture)
2. [Context Routes](#context-routes)
3. [AI Route Integration](#ai-route-integration)
4. [Request/Response Formats](#requestresponse-formats)
5. [Error Handling](#error-handling)
6. [Security Considerations](#security-considerations)

---

## API Architecture

### Route Structure

```
/api/v1/
├── context/              (Context Engine Endpoints)
│   ├── health
│   ├── presence/:userId
│   ├── warmup/:userId
│   ├── rollup/:userId
│   └── invalidate/:userId
├── ai/                   (AI Chat Route - Enhanced)
│   └── chat               (Uses UnifiedContextService)
└── system/                (Admin/Monitoring)
    ├── health
    └── metrics
```

### Middleware Stack

```typescript
// server/src/middleware/context-engine-middleware.ts

import { ContextEngine } from '../context';

export function contextEngineMiddleware(req, res, next) {
  // Feature flag check
  const useDynamicContext =
    req.headers['x-use-dynamic-context'] === 'true' ||
    process.env.USE_DYNAMIC_CONTEXT === 'true';

  req.useDynamicContext = useDynamicContext;
  req.contextEngine = new ContextEngine();

  next();
}
```

---

## Context Routes

### Route: Health Check

**Endpoint:** `GET /api/v1/context/health`

**Purpose:** Monitor context engine health and statistics

**Implementation:**

```javascript
// server/src/routes/context.js

const router = require('express').Router();
const ContextEngine = require('../services/unified-context-service');

router.get('/health', async (req, res) => {
  try {
    const health = await ContextEngine.getHealth();

    const statusCode = health.status === 'healthy' ? 200 :
                       health.status === 'degraded' ? 206 : 503;

    res.status(statusCode).json({
      status: health.status,
      newEngineAvailable: health.newEngineAvailable,
      oldEngineAvailable: health.oldEngineAvailable,
      topicProfiles: health.stats?.topicProfiles || 0,
      entityProfiles: health.stats?.entityProfiles || 0,
      contextBundles: health.stats?.contextBundles || 0,
      dirtyBundles: health.stats?.dirtyBundles || 0,
      invalidationQueue: health.stats?.invalidationQueue || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Context routes: Health check failed');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Health check failed'
    });
  }
});

module.exports = router;
```

**Response Example:**

```json
{
  "status": "healthy",
  "newEngineAvailable": true,
  "oldEngineAvailable": true,
  "topicProfiles": 15,
  "entityProfiles": 8,
  "contextBundles": 42,
  "dirtyBundles": 3,
  "invalidationQueue": 0,
  "timestamp": "2026-02-11T12:30:00Z"
}
```

---

### Route: Presence Update

**Endpoint:** `POST /api/v1/context/presence/:userId`

**Purpose:** Report user's real-time UI state for prediction and warmup

**Request Body:**

```typescript
interface PresenceUpdateRequest {
  deviceId: string;
  activeConversationId?: string;
  visibleConversationIds: string[];
  activeNotebookId?: string;
  activePersonaId?: string;
  lastNavigationPath?: string;
  localTime: string;  // ISO 8601 format
}
```

**Implementation:**

```javascript
router.post('/presence/:userId', async (req, res) => {
  const { userId } = req.params;
  const presence = req.body;

  try {
    // Validate required fields
    if (!presence.deviceId || !presence.localTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: deviceId, localTime'
      });
    }

    // Upsert client presence
    const updatedPresence = await prisma.clientPresence.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId: presence.deviceId
        }
      },
      update: {
        activeConversationId: presence.activeConversationId || null,
        visibleConversationIds: presence.visibleConversationIds || [],
        activeNotebookId: presence.activeNotebookId || null,
        activePersonaId: presence.activePersonaId || null,
        lastNavigationPath: presence.lastNavigationPath || null,
        localTime: new Date(presence.localTime),
        lastHeartbeatAt: new Date(),
        isOnline: true,
        navigationHistory: {
          push: presence.lastNavigationPath ? {
            path: presence.lastNavigationPath,
            timestamp: new Date().toISOString()
          } : undefined
        }
      },
      create: {
        userId,
        deviceId: presence.deviceId,
        activeConversationId: presence.activeConversationId || null,
        visibleConversationIds: presence.visibleConversationIds || [],
        activeNotebookId: presence.activeNotebookId || null,
        activePersonaId: presence.activePersonaId || null,
        lastNavigationPath: presence.lastNavigationPath || null,
        localTime: new Date(presence.localTime),
        lastHeartbeatAt: new Date(),
        isOnline: true,
        navigationHistory: presence.lastNavigationPath ? [{
          path: presence.lastNavigationPath,
          timestamp: new Date().toISOString()
        }] : []
      }
    });

    // Trigger warmup (async, non-blocking)
    ContextWarmupWorker.onPresenceUpdate(userId, updatedPresence);

    logger.info({
      userId,
      deviceId: presence.deviceId,
      activeConversation: presence.activeConversationId,
      visibleCount: presence.visibleConversationIds?.length || 0
    }, 'Context routes: Presence updated');

    res.json({
      success: true,
      message: 'Presence updated',
      data: {
        sessionId: updatedPresence.id
      }
    });

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Context routes: Presence update failed');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update presence'
    });
  }
});
```

**Response Example:**

```json
{
  "success": true,
  "message": "Presence updated",
  "data": {
    "sessionId": "uuid-123-456-789"
  }
}
```

---

### Route: Warmup Trigger

**Endpoint:** `POST /api/v1/context/warmup/:userId`

**Purpose:** Manually trigger context warmup for a user (useful for testing/pre-warming)

**Request Body:**

```typescript
interface WarmupTriggerRequest {
  deviceId?: string;
  force?: boolean;  // Force warmup even if bundles are fresh
}
```

**Implementation:**

```javascript
router.post('/warmup/:userId', async (req, res) => {
  const { userId } = req.params;
  const { deviceId, force } = req.body || {};

  try {
    // Fetch user's presence (or use provided deviceId)
    let presence;
    if (deviceId) {
      presence = await prisma.clientPresence.findUnique({
        where: { userId_deviceId: { userId, deviceId } }
      });
    } else {
      presence = await prisma.clientPresence.findFirst({
        where: { userId },
        orderBy: { lastHeartbeatAt: 'desc' }
      });
    }

    if (!presence) {
      return res.status(404).json({
        success: false,
        error: 'Presence not found for user'
      });
    }

    // Trigger warmup
    await ContextWarmupWorker.onPresenceUpdate(userId, presence);

    // Get warmup stats
    const warmupStats = await getWarmupStats(userId);

    logger.info({
      userId,
      force,
      stats: warmupStats
    }, 'Context routes: Warmup triggered');

    res.json({
      success: true,
      message: 'Warmup initiated',
      data: warmupStats
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Context routes: Warmup failed');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

async function getWarmupStats(userId) {
  const [
    topicBundles,
    entityBundles,
    conversationBundles,
    dirtyCount
  ] = await Promise.all([
    prisma.contextBundle.count({
      where: { userId, bundleType: 'topic', isDirty: false }
    }),
    prisma.contextBundle.count({
      where: { userId, bundleType: 'entity', isDirty: false }
    }),
    prisma.contextBundle.count({
      where: { userId, bundleType: 'conversation', isDirty: false }
    }),
    prisma.contextBundle.count({ where: { userId, isDirty: true } })
  ]);

  return {
    freshTopicBundles: topicBundles,
    freshEntityBundles: entityBundles,
    freshConversationBundles: conversationBundles,
    dirtyBundles: dirtyCount,
    totalFreshBundles: topicBundles + entityBundles + conversationBundles
  };
}
```

---

### Route: Profile Rollup Trigger

**Endpoint:** `POST /api/v1/context/rollup/:userId`

**Purpose:** Trigger profile rollup to populate ghost tables from unprocessed ACUs

**Request Body:**

```typescript
interface RollupTriggerRequest {
  limit?: number;     // Max ACUs to process (default: 50)
  force?: boolean;     // Force rollup even if running
}
```

**Implementation:**

```javascript
router.post('/rollup/:userId', async (req, res) => {
  const { userId } = req.params;
  const { limit, force } = req.body || {};

  try {
    // Check if rollup is already running (unless forced)
    const runningRollup = await prisma.systemAction.findFirst({
      where: {
        trigger: 'profile-rollup',
        status: 'processing',
        metadata: { like: `"userId":"${userId}"` }
      }
    });

    if (runningRollup && !force) {
      return res.status(409).json({
        success: false,
        error: 'Rollup already in progress',
        message: 'Use force=true to override'
      });
    }

    // Create system action record
    await prisma.systemAction.create({
      data: {
        trigger: 'profile-rollup',
        status: 'processing',
        metadata: JSON.stringify({ userId, limit })
      }
    });

    // Trigger rollup
    const results = await ProfileRollupService.triggerRollupForUser(userId, { limit });

    logger.info({
      userId,
      limit,
      results
    }, 'Context routes: Profile rollup triggered');

    res.json({
      success: true,
      message: 'Profile rollup complete',
      data: results
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Context routes: Profile rollup failed');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

**Response Example:**

```json
{
  "success": true,
  "message": "Profile rollup complete",
  "data": {
    "topicsCreated": 3,
    "topicsUpdated": 2,
    "entitiesCreated": 5,
    "entitiesUpdated": 1,
    "acusProcessed": 47
  }
}
```

---

### Route: Invalidation Trigger

**Endpoint:** `POST /api/v1/context/invalidate/:userId`

**Purpose:** Manually trigger invalidation of context bundles

**Request Body:**

```typescript
interface InvalidationTriggerRequest {
  eventType: string;
  relatedIds?: {
    topicId?: string;
    entityId?: string;
    conversationId?: string;
    memoryId?: string;
    instructionId?: string;
  };
}
```

**Implementation:**

```javascript
router.post('/invalidate/:userId', async (req, res) => {
  const { userId } = req.params;
  const { eventType, relatedIds } = req.body;

  try {
    // Validate event type
    const validEventTypes = [
      'memory_created', 'memory_updated', 'memory_deleted',
      'instruction_changed', 'instruction_deleted',
      'message_created', 'message_updated',
      'acu_created', 'acu_updated',
      'topic_updated', 'topic_deleted',
      'entity_updated', 'entity_deleted',
      'conversation_updated'
    ];

    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type',
        validTypes: validEventTypes
      });
    }

    // Trigger invalidation
    await InvalidationService.invalidate({
      eventType,
      userId,
      relatedIds,
      timestamp: new Date()
    });

    logger.info({
      userId,
      eventType,
      relatedIds
    }, 'Context routes: Invalidaton triggered');

    res.json({
      success: true,
      message: 'Invalidation queued'
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Context routes: Invalidation failed');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

---

## AI Route Integration

### Route: Enhanced Chat

**Endpoint:** `POST /api/v1/ai/chat`

**Purpose:** Generate AI response using unified context service with feature flag support

**Request Body:**

```typescript
interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  conversationId: string;
  userId: string;
  provider?: string;  // 'zai', 'openai'
  model?: string;      // 'glm-4.7', 'gpt-4', etc.
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

// Enhanced request with context options
interface EnhancedChatRequest extends ChatRequest {
  includeHistory?: boolean;           // Legacy option
  useDynamicContext?: boolean;       // New engine option
  maxContextTokens?: number;         // Budget override
}
```

**Implementation:**

```javascript
// server/src/routes/ai.js

const router = require('express').Router();
const UnifiedContextService = require('../services/unified-context-service');
const unifiedProvider = require('../services/unified-provider');

router.post('/chat', async (req, res) => {
  const startTime = Date.now();

  const {
    messages,
    conversationId,
    userId,
    provider = 'zai',
    model = 'glm-4.7',
    maxTokens = 4000,
    temperature = 0.7,
    stream = false,
    includeHistory = true,
    useDynamicContext,
    maxContextTokens
  } = req.body;

  // Validate required fields
  if (!messages || !conversationId || !userId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: messages, conversationId, userId'
    });
  }

  // Feature flag: check header or env var
  const dynamicContextEnabled =
    useDynamicContext !== undefined ? useDynamicContext :
    req.headers['x-use-dynamic-context'] === 'true' ||
    process.env.USE_DYNAMIC_CONTEXT === 'true';

  logger.info({
    useDynamicContext: dynamicContextEnabled,
    userId,
    conversationId
  }, 'AI routes: Chat request received');

  try {
    let contextResult;
    let systemPrompt;

    if (dynamicContextEnabled) {
      // ═════════════════════════════════════════════
      // NEW ENGINE PATH
      // ═══════════════════════════════════════════════
      contextResult = await UnifiedContextService.generateContextForChat({
        conversationId,
        userId,
        includeHistory: includeHistory !== false
      });

      systemPrompt = contextResult.systemPrompt;
    } else {
      // ═══════════════════════════════════════════════
      // LEGACY FALLBACK PATH
      // ═════════════════════════════════════════════════
      const legacyContext = await getContextForChat(conversationId, {
        includeHistory: includeHistory !== false
      });

      systemPrompt = legacyContext.systemPrompt;
      contextResult = {
        systemPrompt,
        engineUsed: 'legacy',
        stats: {
          assemblyTimeMs: Date.now() - startTime,
          cacheHitRate: 0,  // Legacy doesn't track
          bundlesUsed: []
        }
      };
    }

    // Prepare messages for LLM
    const contextualMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Determine token budget
    const budget = contextResult.budget || { totalAvailable: 12000 };
    const availableTokens = budget.totalAvailable || 12000;
    const contextTokens = systemPrompt.length > 0 ? estimateTokens(systemPrompt) : 0;

    // Call LLM provider
    const llmResult = await unifiedProvider.complete({
      messages: contextualMessages,
      provider,
      model,
      maxTokens: maxTokens || Math.max(100, availableTokens - contextTokens - 2000),  // Reserve 2K for response
      temperature,
      stream
    });

    // Save the new message to conversation
    await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: llmResult.content,
        messageIndex: llmResult.messageIndex,
        parts: [{
          type: 'text',
          text: { value: llmResult.content }
        }],
        tokenCount: llmResult.usage?.totalTokens || estimateTokens(llmResult.content)
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Trigger invalidation for next context generation
    await InvalidationService.invalidate({
      eventType: 'message_created',
      userId,
      relatedIds: { conversationId }
    });

    const assemblyTimeMs = Date.now() - startTime;

    logger.info({
      engineUsed: contextResult.engineUsed,
      provider,
      model,
      tokensUsed: llmResult.usage?.totalTokens,
      assemblyTimeMs,
      contextStats: contextResult.stats
    }, 'AI routes: Chat complete');

    res.json({
      success: true,
      data: {
        content: llmResult.content,
        model: llmResult.model,
        usage: llmResult.usage,
        engine: contextResult.engineUsed,
        contextStats: contextResult.stats
      },
      metadata: {
        assemblyTimeMs,
        cacheHitRate: contextResult.stats?.cacheHitRate || 0,
        bundlesUsed: contextResult.stats?.bundlesUsed || []
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      useDynamicContext: dynamicContextEnabled
    }, 'AI routes: Chat failed');

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "content": "Based on the context, I can help you with...",
    "model": "glm-4.7",
    "usage": {
      "totalTokens": 1534,
      "promptTokens": 1200,
      "completionTokens": 334
    },
    "engine": "dynamic",
    "contextStats": {
      "assemblyTimeMs": 47,
      "cacheHitRate": 0.85,
      "bundlesUsed": ["identity_core", "global_prefs", "topic", "conversation"]
    }
  },
  "metadata": {
    "assemblyTimeMs": 47,
    "cacheHitRate": 0.85,
    "bundlesUsed": ["identity_core", "global_prefs", "topic", "conversation"]
  }
}
```

---

## Request/Response Formats

### Standard Response Structure

```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

interface ErrorResponse {
  success: false;
  error: string;           // Machine-readable error code
  message: string;          // Human-readable error message
  statusCode?: number;        // HTTP status code (for reference)
}
```

### Error Codes

| Error Code | HTTP Status | Description |
|-----------|--------------|-------------|
| `INVALID_REQUEST` | 400 | Missing or invalid parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource state conflict (e.g., rollup in progress) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server-side error |
| `SERVICE_UNAVAILABLE` | 503 | Context engine degraded/unavailable |
| `CONTEXT_ENGINE_ERROR` | 503 | New context engine failed (fallback used) |
| `LEGACY_ENGINE_ERROR` | 500 | Legacy context engine also failed |

---

## Error Handling

### Global Error Handler

```javascript
// server/src/middleware/error-handler.js

function errorHandler(err, req, res, next) {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId
  }, 'Global error handler');

  // Handle known error types
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Database constraint violation'
    });
  }

  if (err.name === 'PrismaClientInitializationError') {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_CONNECTION_ERROR',
      message: 'Failed to connect to database'
    });
  }

  if (err.name === 'ContextEngineError') {
    return res.status(503).json({
      success: false,
      error: 'CONTEXT_ENGINE_ERROR',
      message: 'Context generation failed'
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  });
}

module.exports = errorHandler;
```

### Route-Specific Error Handling

```javascript
// Wrap route handlers in try-catch with specific error messages

router.post('/presence/:userId', async (req, res) => {
  try {
    // ... implementation ...
  } catch (error) {
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_PRESENCE',
        message: 'Presence already exists for this user/device combination'
      });
    }

    if (error.code === 'P2025') {
      // Prisma foreign key constraint violation
      return res.status(400).json({
        success: false,
        error: 'INVALID_REFERENCE',
        message: 'Referenced conversation/topic/entity does not exist'
      });
    }

    // Re-throw to global handler
    throw error;
  }
});
```

---

## Security Considerations

### Authentication & Authorization

```javascript
// Middleware to authenticate context API requests

function authenticateContextAPI(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Missing authorization header'
    });
  }

  // Extract token
  const token = authHeader.replace(/^Bearer\s+/, '');

  try {
    // Verify JWT or session token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.userId = decoded.userId;
    req.userPermissions = decoded.permissions;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    });
  }
}

// Apply to context routes
router.use(authenticateContextAPI);
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// Context-specific rate limits
const contextApiLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 30,                    // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

const chatApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,                    // 20 chat requests per minute
  standardHeaders: true
});

// Apply to routes
router.use('/context', contextApiLimiter);
router.use('/ai/chat', chatApiLimiter);
```

### Input Validation

```javascript
const { body, param, query } = require('express-validator');

// Presence update validation
router.post('/presence/:userId',
  body('deviceId').notEmpty().isLength({ min: 1, max: 255 }),
  body('localTime').isISO8601(),
  validateRequest,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  // ... handler
);
```

### CORS Configuration

```javascript
const cors = require('cors');

// Configure CORS for context API
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-use-dynamic-context'],
  credentials: process.env.CORS_CREDENTIALS === 'true'
};

// Apply to router
router.use(cors(corsOptions));
```

---

## WebSocket Support (Optional - Future Enhancement)

### Real-Time Presence Updates

```javascript
const WebSocket = require('ws');

// Create WebSocket server for real-time presence updates
const wss = new WebSocket.Server({
  port: process.env.WS_PORT || 3001,
  perMessageDeflate: false
});

// Track connected clients
const clients = new Map();  // userId → Set of WebSocket connections

wss.on('connection', (ws, req) => {
  const userId = req.user?.id;  // From JWT auth

  if (!userId) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  // Add to clients map
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(ws);

  logger.info({ userId, clientsCount: clients.get(userId).size }, 'WebSocket: Client connected');

  // Handle incoming messages
  ws.on('message', async (data) => {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'presence_update':
        // Handle presence update via WebSocket
        await handlePresenceUpdate(userId, message.data);
        break;

      case 'heartbeat':
        // Respond to heartbeat
        ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
        break;
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    const userClients = clients.get(userId);
    if (userClients) {
      userClients.delete(ws);

      // Clean up if no more connections for this user
      if (userClients.size === 0) {
        clients.delete(userId);
      }
    }

    logger.info({ userId }, 'WebSocket: Client disconnected');
  });

  // Handle presence updates from WebSocket
async function handlePresenceUpdate(userId, presence) {
  // Update database
  await prisma.clientPresence.upsert({
    where: { userId_deviceId: { userId, deviceId: presence.deviceId } },
    update: {
      activeConversationId: presence.activeConversationId,
      visibleConversationIds: presence.visibleConversationIds,
      lastNavigationPath: presence.lastNavigationPath,
      lastHeartbeatAt: new Date()
    },
    create: {
      userId,
      deviceId: presence.deviceId,
      activeConversationId: presence.activeConversationId,
      visibleConversationIds: presence.visibleConversationIds,
      lastNavigationPath: presence.lastNavigationPath
    }
  });

  // Trigger warmup
  await ContextWarmupWorker.onPresenceUpdate(userId, presence);

  // Broadcast presence to other clients of this user (multi-device sync)
  const userClients = clients.get(userId);
  if (userClients) {
    const broadcast = JSON.stringify({
      type: 'presence_sync',
      data: presence,
      timestamp: Date.now()
    });

    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcast);
      }
    });
  }
}

module.exports = wss;
```

---

**Document End**

Refer to `IMPLEMENTATION_GUIDE_MASTER.md` for overview and other implementation documents.

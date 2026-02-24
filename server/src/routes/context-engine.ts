/**
 * Enhanced Context API Router
 *
 * Exposes the full enhanced dynamic context engine over HTTP:
 *   GET  /api/v2/context-engine/health       - Engine health check
 *   POST /api/v2/context-engine/assemble     - Full parallel context assembly
 *   POST /api/v2/context-engine/assemble/stream - Streaming context delivery
 *   PUT  /api/v2/context-engine/presence/:userId - Update client presence
 *   POST /api/v2/context-engine/warmup/:userId   - Trigger bundle warmup
 *   POST /api/v2/context-engine/invalidate/:userId - Invalidate bundles
 *   GET  /api/v2/context-engine/bundles/:userId   - List user's context bundles
 *   POST /api/v2/context-engine/settings/:userId  - Update context settings
 */

import { Router } from 'express';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { unifiedContextService } from '../services/unified-context-service.js';
import { invalidationService } from '../services/invalidation-service.js';
import { getContextWarmupWorker } from '../services/context-warmup-worker.js';
import {
  getContextCache,
  getContextEventBus,
  getContextTelemetry,
  ContextSettingsService,
} from '../context/index.js';
import { isContextSystemBooted } from '../services/context-startup.js';

const router = Router();
const prisma = getPrismaClient();

// ── Auth middleware – accept userId from auth or x-user-id header ─────────────
function extractUserId(req: any): string | null {
  if (req.isAuthenticated?.() && req.user?.userId) return req.user.userId;
  return (req.headers['x-user-id'] as string) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health', async (req: any, res: any) => {
  try {
    const cache = getContextCache();
    const eventBus = getContextEventBus();
    const engineHealth = await unifiedContextService.healthCheck();
    const invalidationHealth = await invalidationService.getHealth();
    const warmupWorker = getContextWarmupWorker();

    res.json({
      booted: isContextSystemBooted(),
      engines: {
        newEngine: engineHealth.newEngineAvailable,
        oldEngine: engineHealth.oldEngineAvailable,
      },
      database: {
        topicProfiles: engineHealth.stats.topicProfiles,
        entityProfiles: engineHealth.stats.entityProfiles,
        contextBundles: engineHealth.stats.contextBundles,
      },
      invalidation: invalidationHealth,
      cache: cache.getAllStats(),
      eventBus: {
        handlerCount: eventBus.getHandlerCount(),
        recentEvents: eventBus.getRecentEvents(10).length,
      },
      warmupWorker: warmupWorker ? await warmupWorker.getHealth() : { active: false },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Context engine health check failed');
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /assemble  – Full parallel context assembly
// ─────────────────────────────────────────────────────────────────────────────
router.post('/assemble', async (req: any, res: any) => {
  try {
    const userId = extractUserId(req) || req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const {
      conversationId = 'new-chat',
      userMessage = '',
      personaId,
      providerId,
      modelId,
    } = req.body;

    const result = await unifiedContextService.generateContextForChat(conversationId, {
      userId,
      userMessage,
      personaId,
      deviceId: req.headers['x-device-id'] as string,
      providerId,
      modelId,
    });

    res.json({
      success: true,
      engineUsed: result.engineUsed,
      systemPrompt: result.systemPrompt,
      budget: result.layers,
      stats: result.stats,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Context assemble failed');
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /presence/:userId  – Upsert client presence
// ─────────────────────────────────────────────────────────────────────────────
router.put('/presence/:userId', async (req: any, res: any) => {
  const { userId } = req.params;
  const {
    deviceId = req.headers['x-device-id'] || 'web',
    activeConversationId,
    visibleConversationIds = [],
    activeNotebookId,
    activePersonaId,
    lastNavigationPath,
    localTime,
    isOnline = true,
  } = req.body;

  try {
    const presence = await prisma.clientPresence.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      update: {
        activeConversationId: activeConversationId ?? null,
        visibleConversationIds,
        activeNotebookId: activeNotebookId ?? null,
        activePersonaId: activePersonaId ?? null,
        lastNavigationPath: lastNavigationPath ?? null,
        localTime: localTime ? new Date(localTime) : null,
        lastHeartbeatAt: new Date(),
        isOnline,
      },
      create: {
        userId,
        deviceId,
        activeConversationId: activeConversationId ?? null,
        visibleConversationIds,
        activeNotebookId: activeNotebookId ?? null,
        activePersonaId: activePersonaId ?? null,
        lastNavigationPath: lastNavigationPath ?? null,
        localTime: localTime ? new Date(localTime) : null,
        sessionStartedAt: new Date(),
        lastHeartbeatAt: new Date(),
        isOnline,
      },
    });

    // Emit presence event for context pipeline to react
    getContextEventBus().emit('presence:updated', userId, {
      deviceId,
      presence,
    }).catch(() => {});

    // Trigger background warmup if active conversation changed
    if (activeConversationId) {
      const warmupWorker = getContextWarmupWorker();
      if (warmupWorker) {
        warmupWorker.warmupForUser(userId, deviceId).catch(() => {});
      }
    }

    res.json({ success: true, presence });
  } catch (error: any) {
    logger.error({ userId, error: error.message }, 'Presence update failed');
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /warmup/:userId  – Trigger bundle warmup
// ─────────────────────────────────────────────────────────────────────────────
router.post('/warmup/:userId', async (req: any, res: any) => {
  const { userId } = req.params;
  const deviceId = (req.body.deviceId as string) || (req.headers['x-device-id'] as string) || 'web';

  try {
    const warmupWorker = getContextWarmupWorker();
    if (!warmupWorker) {
      return res.json({ success: true, message: 'Warmup worker not available (Z.AI not configured)' });
    }

    // Non-blocking - warmup runs in background
    warmupWorker.warmupForUser(userId, deviceId).catch((err: any) =>
      logger.warn({ userId, error: err.message }, 'Warmup failed')
    );

    res.json({ success: true, message: 'Warmup triggered' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /invalidate/:userId  – Manual bundle invalidation
// ─────────────────────────────────────────────────────────────────────────────
router.post('/invalidate/:userId', async (req: any, res: any) => {
  const { userId } = req.params;
  const { eventType, relatedIds = [] } = req.body;

  if (!eventType) return res.status(400).json({ error: 'eventType required' });

  try {
    await invalidationService.invalidate({ eventType, userId, relatedIds, timestamp: new Date() });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /bundles/:userId  – List user context bundles
// ─────────────────────────────────────────────────────────────────────────────
router.get('/bundles/:userId', async (req: any, res: any) => {
  const { userId } = req.params;
  const { type, limit = '20' } = req.query;

  try {
    const bundles = await prisma.contextBundle.findMany({
      where: {
        userId,
        ...(type ? { bundleType: type as string } : {}),
      },
      orderBy: { compiledAt: 'desc' },
      take: parseInt(limit as string),
      select: {
        id: true,
        bundleType: true,
        tokenCount: true,
        isDirty: true,
        compiledAt: true,
        expiresAt: true,
        lastUsedAt: true,
        useCount: true,
        priority: true,
      },
    });

    res.json({ success: true, bundles, count: bundles.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /settings/:userId  – Get context settings
// ─────────────────────────────────────────────────────────────────────────────
router.get('/settings/:userId', async (req: any, res: any) => {
  const { userId } = req.params;

  try {
    const settingsService = new ContextSettingsService({ prisma: prisma as any });
    const result = await settingsService.getSettingsWithMetadata(userId);
    res.json({ success: true, ...result, presets: settingsService.getPresets() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /settings/:userId  – Update context settings
// ─────────────────────────────────────────────────────────────────────────────
router.put('/settings/:userId', async (req: any, res: any) => {
  const { userId } = req.params;

  try {
    const settingsService = new ContextSettingsService({ prisma: prisma as any });
    const result = await settingsService.updateSettings(userId, req.body);

    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.errors });
    }

    // Emit settings change event to invalidate caches
    getContextEventBus().emit('settings:updated', userId, { settings: result.settings }).catch(() => {});

    res.json({ success: true, settings: result.settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /settings/:userId/preset/:name  – Apply a preset
// ─────────────────────────────────────────────────────────────────────────────
router.post('/settings/:userId/preset/:name', async (req: any, res: any) => {
  const { userId, name } = req.params;

  try {
    const settingsService = new ContextSettingsService({ prisma: prisma as any });
    const result = await settingsService.applyPreset(userId, name as any);

    if (!result.success) {
      return res.status(400).json({ error: 'Failed to apply preset', details: result.errors });
    }

    getContextEventBus().emit('settings:updated', userId, { preset: name, settings: result.settings }).catch(() => {});

    res.json({ success: true, preset: name, settings: result.settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /telemetry  – Context telemetry stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/telemetry', async (req: any, res: any) => {
  try {
    const telemetry = getContextTelemetry();
    const report = telemetry.getQualityReport();
    const rawEntries = telemetry.export(60 * 60 * 1000); // last 1h
    const eventBus = getContextEventBus();
    const eventCounts = eventBus.getEventCountByType();
    const recentEvents = eventBus.getRecentEvents(20);

    res.json({ success: true, report, entryCount: rawEntries.length, eventCounts, recentEvents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

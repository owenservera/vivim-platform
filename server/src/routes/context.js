/**
 * Context Routes
 *
 * API routes for context-related operations:
 * - ClientPresence updates (from UI clients)
 * - Context warmup triggers
 * - Invalidation events
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { unifiedContextService } from '../services/unified-context-service.js';
import { invalidationService } from '../services/invalidation-service.js';
import { profileRollupService } from '../services/profile-rollup-service.js';

const prisma = getPrismaClient();

/**
 * Update client presence state
 */
export async function updatePresence(req, res) {
  const { userId } = req.params;
  const { deviceId, activeConversationId, visibleConversationIds, activeNotebookId, activePersonaId, lastNavigationPath, localTime } = req.body;

  try {
    const presence = await prisma.clientPresence.upsert({
      where: {
        userId_deviceId: { userId, deviceId }
      },
      update: {
        activeConversationId,
        visibleConversationIds: visibleConversationIds || [],
        activeNotebookId,
        activePersonaId,
        lastNavigationPath,
        localTime: localTime ? new Date(localTime) : null,
        lastHeartbeatAt: new Date(),
        isOnline: true,
        sessionStartedAt: new Date()
      },
      create: {
        userId,
        deviceId,
        lastNavigationPath,
        localTime: localTime ? new Date(localTime) : null,
        sessionStartedAt: new Date(),
        lastHeartbeatAt: new Date(),
        isOnline: true
      }
    });

    const log = logger.child({ userId, deviceId });
    log.info({ activeConversationId, visibleConversationIds: visibleConversationIds?.length || 0 }, 'Presence updated');

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() }
    });

    res.json({ success: true, presence });
  } catch (error) {
    const log = logger.child({ userId, deviceId });
    log.error({ error: error.message }, 'Failed to update presence');
    res.status(500).json({ error: 'Failed to update presence' });
  }
}

/**
 * Trigger context warmup based on current presence
 */
export async function triggerWarmup(req, res) {
  const { userId } = req.params;

  try {
    const presence = await prisma.clientPresence.findUnique({
      where: {
        userId_deviceId: { userId, deviceId: req.body.deviceId || 'web' }
      }
    });

    if (!presence) {
      return res.status(404).json({ error: 'Presence not found' });
    }

    await unifiedContextService.warmupBundles(userId, presence);

    const log = logger.child({ userId });
    log.info({ activeConversation: presence.activeConversationId }, 'Context warmup triggered');

    res.json({ success: true });
  } catch (error) {
    const log = logger.child({ userId });
    log.error({ error: error.message }, 'Failed to trigger warmup');
    res.status(500).json({ error: 'Failed to trigger warmup' });
  }
}

/**
 * Manual rollup trigger (for testing/admin)
 */
export async function triggerRollup(req, res) {
  const { userId } = req.params;

  try {
    const result = await profileRollupService.triggerRollupForUser(userId);

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() }
    });

    const log = logger.child({ userId });
    log.info(result, 'Profile rollup triggered');

    res.json({ success: true, ...result });
  } catch (error) {
    const log = logger.child({ userId });
    log.error({ error: error.message }, 'Failed to trigger rollup');
    res.status(500).json({ error: 'Failed to trigger rollup' });
  }
}

/**
 * Invalidate bundles manually
 */
export async function invalidateBundles(req, res) {
  const { userId } = req.params;
  const { eventType, relatedIds } = req.body;

  try {
    if (!eventType || !Array.isArray(relatedIds)) {
      return res.status(400).json({ error: 'Invalid request - eventType and relatedIds required' });
    }

    await invalidationService.invalidate({
      eventType,
      userId,
      relatedIds,
      timestamp: new Date()
    });

    const log = logger.child({ userId, eventType });
    log.info({ relatedIds: relatedIds.length }, 'Bundles invalidated');

    res.json({ success: true });
  } catch (error) {
    const log = logger.child({ userId, eventType });
    log.error({ error: error.message }, 'Failed to invalidate bundles');
    res.status(500).json({ error: 'Failed to invalidate bundles' });
  }
}

/**
 * Get context health/status
 */
export async function getContextHealth(req, res) {
  try {
    const [newEngineHealth, profileStats] = await Promise.all([
      unifiedContextService.healthCheck(),
      profileRollupService.getProfileStats('system')
    ]);

    const invalidationHealth = await invalidationService.getHealth();

    const log = logger.child({});
    log.info({ ...newEngineHealth.stats, ...profileStats, ...invalidationHealth }, 'Context health check');

    res.json({
      health: {
        newEngine: newEngineHealth.newEngineAvailable,
        oldEngine: newEngineHealth.oldEngineAvailable,
        topicProfiles: profileStats.topicProfiles,
        entityProfiles: profileStats.entityProfiles,
        contextBundles: newEngineHealth.stats.contextBundles,
        dirtyBundles: invalidationHealth.dirtyBundles,
        invalidationQueue: invalidationHealth.queueLength
      }
    });
  } catch (error) {
    const log = logger.child({});
    log.error({ error: error.message }, 'Failed to get context health');
    res.status(500).json({ error: 'Failed to get context health' });
  }
}

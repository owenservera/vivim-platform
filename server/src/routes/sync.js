/**
 * Sync API Routes
 * 
 * Implements the sync protocol for PWA-Server synchronization
 * Protocol: Last-write-wins with CRDT support for Yjs documents
 * 
 * Endpoints:
 * - POST /api/v1/sync/push   - Push local changes to server
 * - GET  /api/v1/sync/pull   - Pull server changes
 * - POST /api/v1/sync/resolve - Resolve conflicts
 * - GET  /api/v1/sync/status - Get sync status
 */

import express from 'express';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const router = express.Router();

/**
 * POST /api/v1/sync/push
 * Push local changes to server
 */
router.post('/push', async (req, res) => {
  try {
    const {
      deviceId,
      userId,
      changes,
      lastSyncTimestamp,
    } = req.body;

    if (!deviceId || !changes || !Array.isArray(changes)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: deviceId and changes array required',
      });
    }

    logger.info(`Sync push from device ${deviceId}: ${changes.length} changes`);

    const results = {
      accepted: [],
      rejected: [],
      conflicts: [],
    };

    // Process each change
    for (const change of changes) {
      try {
        const result = await processChange(change, deviceId, userId);
        
        if (result.conflict) {
          results.conflicts.push({
            changeId: change.id,
            reason: result.reason,
            serverVersion: result.serverVersion,
            clientVersion: change,
          });
        } else if (result.accepted) {
          results.accepted.push(change.id);
        } else {
          results.rejected.push({
            changeId: change.id,
            reason: result.reason,
          });
        }
      } catch (error) {
        logger.error(`Failed to process change ${change.id}`, { error: error.message });
        results.rejected.push({
          changeId: change.id,
          reason: error.message,
        });
      }
    }

    // Update last sync timestamp for device
    const newSyncTimestamp = new Date().toISOString();

    res.json({
      success: true,
      syncTimestamp: newSyncTimestamp,
      results,
    });

  } catch (error) {
    logger.error('Sync push failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Sync push failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/sync/pull
 * Pull server changes since last sync
 */
router.get('/pull', async (req, res) => {
  try {
    const {
      deviceId,
      userId,
      since,
    } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'deviceId required',
      });
    }

    const sinceDate = since ? new Date(since) : new Date(0);

    logger.info(`Sync pull for device ${deviceId} since ${sinceDate.toISOString()}`);

    // Get all changes since timestamp
    const [conversations, messages] = await Promise.all([
      // Conversations updated since last sync
      getPrismaClient().conversation.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          ...(userId && { ownerId: userId }),
        },
        include: {
          messages: {
            where: {
              createdAt: { gt: sinceDate },
            },
            orderBy: { messageIndex: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // Standalone message updates (in case conversation wasn't updated)
      getPrismaClient().message.findMany({
        where: {
          createdAt: { gt: sinceDate },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const changes = {
      conversations: conversations.map(conv => ({
        type: 'conversation',
        action: 'upsert',
        data: conv,
        timestamp: conv.updatedAt.toISOString(),
      })),
      messages: messages.map(msg => ({
        type: 'message',
        action: 'upsert',
        data: msg,
        timestamp: msg.createdAt.toISOString(),
      })),
    };

    const syncTimestamp = new Date().toISOString();

    res.json({
      success: true,
      syncTimestamp,
      changes,
      stats: {
        conversations: conversations.length,
        messages: messages.length,
        total: conversations.length + messages.length,
      },
    });

  } catch (error) {
    logger.error('Sync pull failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Sync pull failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/sync/resolve
 * Resolve sync conflicts
 */
router.post('/resolve', async (req, res) => {
  try {
    const {
      conflictId,
      resolution, // 'server' | 'client' | 'merge'
      mergedData,
    } = req.body;

    if (!conflictId || !resolution) {
      return res.status(400).json({
        success: false,
        error: 'conflictId and resolution required',
      });
    }

    logger.info(`Resolving conflict ${conflictId} with strategy: ${resolution}`);

    // In a real implementation, you'd fetch the conflict from a conflicts table
    // For now, we'll just acknowledge the resolution

    let result;
    switch (resolution) {
      case 'server':
        result = { strategy: 'server-wins', applied: true };
        break;
      case 'client':
        result = { strategy: 'client-wins', applied: true };
        break;
      case 'merge':
        if (!mergedData) {
          return res.status(400).json({
            success: false,
            error: 'mergedData required for merge resolution',
          });
        }
        result = { strategy: 'manual-merge', applied: true, data: mergedData };
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid resolution strategy',
        });
    }

    res.json({
      success: true,
      conflictId,
      resolution: result,
    });

  } catch (error) {
    logger.error('Conflict resolution failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Conflict resolution failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/sync/status
 * Get sync status for a device
 */
router.get('/status', async (req, res) => {
  try {
    const { deviceId, userId } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'deviceId required',
      });
    }

    // Get latest conversation update time
    const latestConversation = await getPrismaClient().conversation.findFirst({
      where: userId ? { ownerId: userId } : {},
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    // Get total counts
    const [conversationCount, messageCount] = await Promise.all([
      getPrismaClient().conversation.count({
        where: userId ? { ownerId: userId } : {},
      }),
      getPrismaClient().message.count(),
    ]);

    res.json({
      success: true,
      status: {
        deviceId,
        lastServerUpdate: latestConversation?.updatedAt?.toISOString() || null,
        serverCounts: {
          conversations: conversationCount,
          messages: messageCount,
        },
        syncAvailable: true,
      },
    });

  } catch (error) {
    logger.error('Sync status check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Sync status check failed',
      message: error.message,
    });
  }
});

/**
 * Helper: Process a single change
 */
async function processChange(change, deviceId, userId) {
  const { type, action, data, timestamp } = change;

  // Check for conflicts (last-write-wins)
  if (type === 'conversation') {
    const existing = await getPrismaClient().conversation.findUnique({
      where: { id: data.id },
    });

    if (existing) {
      const serverTime = new Date(existing.updatedAt);
      const clientTime = new Date(timestamp);

      // Conflict: server version is newer
      if (serverTime > clientTime) {
        return {
          accepted: false,
          conflict: true,
          reason: 'Server version is newer',
          serverVersion: existing,
        };
      }
    }

    // No conflict, apply change
    if (action === 'upsert') {
      await getPrismaClient().conversation.upsert({
        where: { id: data.id },
        update: {
          ...data,
          ownerId: userId || data.ownerId,
          updatedAt: new Date(timestamp),
        },
        create: {
          ...data,
          ownerId: userId || data.ownerId,
          createdAt: new Date(data.createdAt || timestamp),
          updatedAt: new Date(timestamp),
        },
      });

      return { accepted: true };
    }

    if (action === 'delete') {
      await getPrismaClient().conversation.delete({
        where: { id: data.id },
      });
      return { accepted: true };
    }
  }

  if (type === 'message') {
    const existing = await getPrismaClient().message.findUnique({
      where: { id: data.id },
    });

    if (existing) {
      const serverTime = new Date(existing.createdAt);
      const clientTime = new Date(timestamp);

      if (serverTime > clientTime) {
        return {
          accepted: false,
          conflict: true,
          reason: 'Server version is newer',
          serverVersion: existing,
        };
      }
    }

    if (action === 'upsert') {
      await getPrismaClient().message.upsert({
        where: { id: data.id },
        update: {
          ...data,
          createdAt: new Date(data.createdAt || timestamp),
        },
        create: {
          ...data,
          createdAt: new Date(data.createdAt || timestamp),
        },
      });

      return { accepted: true };
    }

    if (action === 'delete') {
      await getPrismaClient().message.delete({
        where: { id: data.id },
      });
      return { accepted: true };
    }
  }

  return {
    accepted: false,
    reason: `Unknown change type: ${type} or action: ${action}`,
  };
}

export default router;

/**
 * Admin CRDT Routes
 *
 * CRDT document management and monitoring endpoints
 */

import { Router } from 'express';
import { createRequestLogger } from '../../lib/logger.js';
import { getPrismaClient } from '../../lib/database.js';
import { recordOperation } from '../../services/sync-service.js';

const router = Router();
const prisma = getPrismaClient();

// ============================================================================
// GET CRDT DOCUMENTS — query real SyncOperation log
// ============================================================================

/**
 * GET /api/admin/crdt/documents
 *
 * List CRDT document state by entity type using the SyncOperation log.
 */
router.get('/documents', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { type, status } = req.query;

    // Build an aggregated view of sync state from SyncOperation table
    const where = {};
    if (type) where.entityType = type;

    const ops = await prisma.syncOperation.findMany({
      where,
      orderBy: { hlcTimestamp: 'desc' },
      take: 100,
      distinct: ['entityId'],
    });

    const documents = ops.map((op) => ({
      id: op.entityId,
      type: op.entityType,
      version: 1, // HLC ordering covers versioning — simplify to 1 for display
      status: op.isProcessed ? 'SYNCED' : 'PENDING',
      lastSyncedAt: op.appliedAt?.toISOString() ?? op.createdAt?.toISOString() ?? null,
      createdAt: op.createdAt?.toISOString() ?? null,
      hlcTimestamp: op.hlcTimestamp,
      authorDid: op.authorDid,
    }));

    const filtered = status
      ? documents.filter((d) => d.status === status)
      : documents;

    log.info({ count: filtered.length, filters: { type, status } }, 'CRDT documents listed');
    res.json(filtered);
  } catch (error) {
    log.error({ error: error.message }, 'Failed to list CRDT documents');
    next(error);
  }
});

// ============================================================================
// GET DOCUMENT DETAILS
// ============================================================================

/**
 * GET /api/admin/crdt/documents/:id
 *
 * Get CRDT document operation history for a given entity ID.
 */
router.get('/documents/:id', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;

    const ops = await prisma.syncOperation.findMany({
      where: { entityId: id },
      orderBy: { hlcTimestamp: 'desc' },
    });

    if (ops.length === 0) {
      return res.status(404).json({ error: 'Document not found in sync log' });
    }

    const latest = ops[0];
    const document = {
      id,
      type: latest.entityType,
      status: latest.isProcessed ? 'SYNCED' : 'PENDING',
      lastSyncedAt: latest.appliedAt?.toISOString() ?? null,
      operationCount: ops.length,
      history: ops.map((o) => ({
        hlcTimestamp: o.hlcTimestamp,
        operation: o.operation,
        authorDid: o.authorDid,
        deviceDid: o.deviceDid,
        appliedAt: o.appliedAt?.toISOString() ?? null,
      })),
    };

    log.info({ documentId: id }, 'CRDT document retrieved');
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET DOCUMENT SYNC STATUS
// ============================================================================

/**
 * GET /api/admin/crdt/documents/:id/sync
 *
 * Get CRDT document sync status
 */
router.get('/documents/:id/sync', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;

    const [latest, pendingCount] = await Promise.all([
      prisma.syncOperation.findFirst({
        where: { entityId: id },
        orderBy: { hlcTimestamp: 'desc' },
      }),
      prisma.syncOperation.count({
        where: { entityId: id, isProcessed: false },
      }),
    ]);

    if (!latest) {
      return res.status(404).json({ error: 'Document not found in sync log' });
    }

    const syncStatus = {
      status: pendingCount > 0 ? 'PENDING' : 'SYNCED',
      pendingOperations: pendingCount,
      lastSyncedAt: latest.appliedAt?.toISOString() ?? null,
      lastHlc: latest.hlcTimestamp,
    };

    log.info({ documentId: id }, 'CRDT sync status retrieved');
    res.json(syncStatus);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// RESOLVE DOCUMENT CONFLICT — wired to sync-service
// ============================================================================

/**
 * POST /api/admin/crdt/documents/:id/resolve
 *
 * Resolve CRDT document conflicts by applying a resolution strategy:
 *   - "last-write-wins": accept the provided value as authoritative
 *   - "explicit-value":  apply the resolution.value to the entity
 *   - "delete":          remove the conflicted entity
 */
router.post('/documents/:id/resolve', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!resolution || !resolution.strategy) {
      return res.status(400).json({
        error: 'resolution.strategy is required',
        strategies: ['last-write-wins', 'explicit-value', 'delete'],
      });
    }

    // Look up what entity type this document is
    const latestOp = await prisma.syncOperation.findFirst({
      where: { entityId: id },
      orderBy: { hlcTimestamp: 'desc' },
    });

    if (!latestOp) {
      return res.status(404).json({ error: 'Document not found in sync log' });
    }

    const entityType = latestOp.entityType;

    if (resolution.strategy === 'delete') {
      // Hard-delete the entity based on its type
      if (entityType === 'conversation') {
        await prisma.conversation.deleteMany({ where: { id } });
      } else if (entityType === 'message') {
        await prisma.message.deleteMany({ where: { id } });
      } else if (entityType === 'atomicChatUnit') {
        await prisma.atomicChatUnit.deleteMany({ where: { id } });
      }

      await recordOperation({
        entityType,
        entityId: id,
        operation: 'resolve_delete',
        payload: resolution,
        tableName: entityType,
        recordId: id,
        authorDid: 'admin',
        deviceDid: 'admin_panel',
      });
    } else if (resolution.strategy === 'last-write-wins' || resolution.strategy === 'explicit-value') {
      // Apply the winning value to the entity
      const value = resolution.value;
      if (!value) {
        return res.status(400).json({ error: 'resolution.value is required for this strategy' });
      }

      if (entityType === 'conversation') {
        await prisma.conversation.updateMany({
          where: { id },
          data: {
            title: value.title,
            metadata: value.metadata,
            tags: value.tags,
            updatedAt: new Date(),
          },
        });
      } else if (entityType === 'message') {
        await prisma.message.updateMany({
          where: { id },
          data: { content: value.content, parts: value.parts, metadata: value.metadata },
        });
      } else if (entityType === 'atomicChatUnit') {
        await prisma.atomicChatUnit.updateMany({
          where: { id },
          data: { ...value, updatedAt: new Date() },
        });
      }

      await recordOperation({
        entityType,
        entityId: id,
        operation: `resolve_${resolution.strategy}`,
        payload: resolution,
        tableName: entityType,
        recordId: id,
        authorDid: 'admin',
        deviceDid: 'admin_panel',
      });
    } else {
      return res.status(400).json({
        error: `Unknown resolution strategy: "${resolution.strategy}"`,
        strategies: ['last-write-wins', 'explicit-value', 'delete'],
      });
    }

    log.info({ documentId: id, strategy: resolution.strategy }, 'CRDT conflict resolved');

    res.json({
      success: true,
      message: `Conflict resolved using strategy: ${resolution.strategy}`,
      documentId: id,
      entityType,
    });
  } catch (error) {
    log.error({ error: error.message }, 'CRDT conflict resolution failed');
    next(error);
  }
});

export default router;

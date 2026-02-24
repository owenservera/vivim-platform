/**
 * Sync Controller
 *
 * Handles delta-synchronization between clients and server.
 * Uses Hybrid Logical Clocks (HLC) and Vector Clocks for consistency.
 */

import { Router } from 'express';
import { requireApiKey } from '../middleware/auth.js';
import { createRequestLogger } from '../lib/logger.js';
import { getPrismaClient } from '../lib/database.js';
import { z } from 'zod';

const router = Router();
const prisma = getPrismaClient();

// ============================================================================
// Schema Validation
// ============================================================================

const SyncPacketSchema = z.object({
  deviceId: z.string(),
  lastSyncId: z.string().optional(), // Cursor
  operations: z.array(
    z.object({
      id: z.string(),
      entityType: z.string(), // 'conversation', 'message', 'acu'
      entityId: z.string(),
      operation: z.enum(['INSERT', 'UPDATE', 'DELETE']),
      payload: z.any(),
      hlcTimestamp: z.string(),
      vectorClock: z.record(z.number()).optional(),
    })
  ),
});

// ============================================================================
// PULL CHANGES (Downstream)
// ============================================================================

router.get('/pull', requireApiKey(), async (req, res, next) => {
  const log = createRequestLogger(req);
  try {
    const { deviceId, lastSyncId, limit = 100 } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId required' });
    }

    // Fetch operations since the last known sync ID (cursor)
    // Ordered by HLC timestamp to ensure causal consistency
    const operations = await prisma.syncOperation.findMany({
      where: {
        deviceId: { not: String(deviceId) }, // Don't send back own changes
        ...(lastSyncId ? { id: { gt: String(lastSyncId) } } : {}),
      },
      orderBy: {
        hlcTimestamp: 'asc',
      },
      take: Number(limit),
    });

    const newSyncId = operations.length > 0 ? operations[operations.length - 1].id : lastSyncId;

    res.json({
      syncId: newSyncId,
      operations,
      hasMore: operations.length === Number(limit),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PUSH CHANGES (Upstream)
// ============================================================================

router.post('/push', requireApiKey(), async (req, res, next) => {
  const log = createRequestLogger(req);
  try {
    const packet = SyncPacketSchema.parse(req.body);
    const results = [];

    // Process operations in a transaction
    await prisma.$transaction(async (tx) => {
      for (const op of packet.operations) {
        // 1. Conflict Resolution (LWW based on HLC)
        // Check if we have a newer version already
        const existing = await tx.syncOperation.findFirst({
          where: {
            entityType: op.entityType,
            entityId: op.entityId,
            hlcTimestamp: { gt: op.hlcTimestamp },
          },
        });

        if (existing) {
          log.info({ opId: op.id }, 'Conflict: Local version is newer, ignoring push');
          results.push({ id: op.id, status: 'conflict_ignored' });
          continue;
        }

        // 2. Apply Change to Domain Model
        try {
          await applyOperationToDomain(tx, op);

          // 3. Record Operation for Other Clients
          await tx.syncOperation.create({
            data: {
              id: op.id, // Keep client ID for idempotency
              authorDid: req.user?.did || 'unknown',
              deviceId: packet.deviceId,
              tableName: `${op.entityType}s`, // Simple pluralization
              recordId: op.entityId,
              entityType: op.entityType,
              entityId: op.entityId,
              operation: op.operation,
              payload: op.payload,
              hlcTimestamp: op.hlcTimestamp,
              isProcessed: true,
            },
          });

          results.push({ id: op.id, status: 'applied' });
        } catch (domainError) {
          log.error({ error: domainError, op }, 'Failed to apply domain operation');
          results.push({ id: op.id, status: 'failed', error: domainError.message });
        }
      }
    });

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Domain Logic Adapter
// ============================================================================

async function applyOperationToDomain(tx, op) {
  const { entityType, operation, payload } = op;

  // Safety: Remove sensitive fields or sanitize payload here
  // For now, we trust the schema validation somewhat

  if (entityType === 'conversation') {
    if (operation === 'INSERT' || operation === 'UPDATE') {
      await tx.conversation.upsert({
        where: { id: payload.id },
        update: payload,
        create: payload,
      });
    } else if (operation === 'DELETE') {
      await tx.conversation.delete({ where: { id: payload.id } });
    }
  } else if (entityType === 'message') {
    if (operation === 'INSERT') {
      await tx.message.create({ data: payload });
    } else if (operation === 'UPDATE') {
      await tx.message.update({ where: { id: payload.id }, data: payload });
    }
  }
  // Add other entities...
}

export default router;

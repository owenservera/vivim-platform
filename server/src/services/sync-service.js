import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { HLC } from '../lib/hlc.js';
import crypto from 'crypto';

// In-memory clock state (for POC - in prod should be persisted)
// We use a random node ID for the server if one isn't persisted
const SERVER_NODE_ID = `server_${crypto.randomBytes(4).toString('hex')}`;
const localClock = HLC.now(SERVER_NODE_ID);

/**
 * Record a sync operation
 * @param {Object} op - Operation details
 * @param {Object} tx - Optional transaction client
 */
export async function recordOperation(op, tx = null) {
  const prisma = tx || getPrismaClient();
  
  // Tick the clock
  localClock.tick();
  const timestamp = localClock.toString();

  try {
    const syncOp = await prisma.syncOperation.create({
      data: {
        hlcTimestamp: timestamp,
        entityType: op.entityType,
        entityId: op.entityId,
        operation: op.operation,
        payload: op.payload,
        authorDid: op.authorDid || 'server',
        deviceDid: op.deviceDid || SERVER_NODE_ID,
        tableName: op.tableName,
        recordId: op.recordId,
        isProcessed: true, // Local ops are already processed
        appliedAt: new Date(),
      },
    });

    logger.debug({ 
      id: syncOp.id, 
      op: op.operation, 
      type: op.entityType, 
    }, 'Recorded sync operation');

    return syncOp;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to record sync operation');
    throw error;
  }
}

/**
 * Get operations since a given HLC timestamp
 * @param {string} sinceHlc - HLC timestamp to filter from
 * @param {number} limit - Max operations to return
 */
export async function getOperationsSince(sinceHlc, limit = 100) {
  const prisma = getPrismaClient();
  
  return prisma.syncOperation.findMany({
    where: {
      hlcTimestamp: { gt: sinceHlc },
    },
    orderBy: {
      hlcTimestamp: 'asc',
    },
    take: limit,
  });
}

/**
 * Get the current vector clock (latest HLC per device)
 */
export async function getVectorClock() {
  const prisma = getPrismaClient();
  
  // Group by deviceDid and get max HLC
  const ops = await prisma.syncOperation.groupBy({
    by: ['deviceDid'],
    _max: {
      hlcTimestamp: true,
    },
  });

  const vector = {};
  ops.forEach(op => {
    if (op.deviceDid && op._max.hlcTimestamp) {
      vector[op.deviceDid] = op._max.hlcTimestamp;
    }
  });

  return vector;
}

export default {
  recordOperation,
  getOperationsSince,
  getVectorClock,
};

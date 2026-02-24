import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { fileStorage } from '../lib/file-storage.js';
import { recordOperation } from '../services/sync-service.js';

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a capture attempt record
 * @param {Object} data - Attempt data
 * @param {Object} userClient - Optional user-specific Prisma client
 * @returns {Promise<Object>} Created attempt
 */
export async function createCaptureAttempt(data, userClient = null) {
  const db = userClient || getPrismaClient();

  try {
    const attempt = await db.captureAttempt.create({
      data: {
        sourceUrl: data.sourceUrl,
        provider: data.provider,
        status: data.status,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        startedAt: new Date(data.startedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        duration: data.duration,
        ipAddress: data.ipAddress,
        conversationId: data.conversationId,
      },
    });

    logger.debug({ attemptId: attempt.id, status: attempt.status }, 'Capture attempt recorded');

    return attempt;
  } catch (error) {
    if (error.message.includes("Can't reach database server")) {
      logger.warn('💾 [DATABASE OFFLINE] Saving attempt to local filesystem...');
      const attempt = { id: `offline-${Date.now()}`, ...data };
      await fileStorage.saveAttempt(attempt);
      return attempt;
    }
    logger.error({ error: error.message }, 'Failed to create capture attempt');
    throw error;
  }
}

/**
 * Update capture attempt with completion status
 * @param {string} id - Attempt ID
 * @param {Object} data - Update data
 * @param {Object} userClient - Optional user-specific Prisma client
 * @returns {Promise<Object>} Updated attempt
 */
export async function completeCaptureAttempt(id, data, userClient = null) {
  const db = userClient || getPrismaClient();

  try {
    if (String(id).startsWith('offline-')) {
      logger.debug(
        { attemptId: id, status: data.status },
        'Capture attempt completed (offline mode)'
      );
      return { id, ...data };
    }

    const attempt = await db.captureAttempt.update({
      where: { id },
      data: {
        status: data.status,
        completedAt: new Date(),
        duration: data.duration,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        conversationId: data.conversationId,
      },
    });

    logger.debug({ attemptId: id, status: data.status }, 'Capture attempt completed');

    return attempt;
  } catch (error) {
    if (error.message.includes("Can't reach database server")) {
      logger.warn('💾 [DATABASE OFFLINE] Could not update capture attempt (DB down).');
      return { id, ...data };
    }
    logger.error({ error: error.message, id }, 'Failed to complete capture attempt');
    throw error;
  }
}

// ============================================================================
// QUERY
// ============================================================================

/**
 * Get recent capture attempts
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Capture attempts
 */
export async function getRecentAttempts(options = {}) {
  const { limit = 50, status, ipAddress } = options;

  try {
    const where = {};
    if (status) {
      where.status = status;
    }
    if (ipAddress) {
      where.ipAddress = ipAddress;
    }

    const attempts = await getPrismaClient().captureAttempt.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return attempts;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get recent attempts');
    throw error;
  }
}

/**
 * Get capture statistics
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} Statistics
 */
export async function getCaptureStats(options = {}) {
  const { startDate, endDate, ipAddress } = options;

  try {
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    if (ipAddress) {
      where.ipAddress = ipAddress;
    }

    const [total, successful, failed, avgDuration] = await Promise.all([
      getPrismaClient().captureAttempt.count({ where }),
      getPrismaClient().captureAttempt.count({ where: { ...where, status: 'success' } }),
      getPrismaClient().captureAttempt.count({ where: { ...where, status: 'failed' } }),
      getPrismaClient().captureAttempt.aggregate({
        where: { ...where, duration: { not: null } },
        _avg: { duration: true },
      }),
    ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDuration: avgDuration._avg.duration || 0,
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get capture stats');
    throw error;
  }
}

/**
 * Check if URL was recently captured (cache check)
 * @param {string} sourceUrl - Source URL
 * @param {number} minutes - Minutes to look back
 * @param {Object} userClient - Optional user-specific Prisma client
 * @returns {Promise<Object|null>} Recent successful attempt or null
 */
export async function findRecentSuccessfulAttempt(sourceUrl, minutes = 60, userClient = null) {
  const db = userClient || getPrismaClient();

  try {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const attempt = await db.captureAttempt.findFirst({
      where: {
        sourceUrl,
        status: 'success',
        completedAt: { gte: since },
      },
      orderBy: { completedAt: 'desc' },
    });

    return attempt;
  } catch (error) {
    logger.error({ error: error.message, sourceUrl }, 'Failed to find recent attempt');
    return null;
  }
}

export default {
  createCaptureAttempt,
  completeCaptureAttempt,
  getRecentAttempts,
  getCaptureStats,
  findRecentSuccessfulAttempt,
};

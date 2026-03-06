/**
 * Memory Cleanup Worker
 *
 * Periodic cleanup job that archives expired memories based on TTL.
 * Runs every 24 hours to archive memories past their expiresAt date.
 *
 * TTL Policy:
 * - High importance (>0.8): expires in 1 year
 * - Medium importance (0.5-0.8): expires in 6 months
 * - Low importance (<0.5): expires in 1 month
 */

import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const TTL_CONFIG = {
  HIGH_IMPORTANCE_THRESHOLD: 0.8,
  MEDIUM_IMPORTANCE_THRESHOLD: 0.5,
  HIGH_TTL_DAYS: 365,
  MEDIUM_TTL_DAYS: 180,
  LOW_TTL_DAYS: 30,
};

export class MemoryCleanupWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Calculate expiration date based on memory importance
   */
  static calculateExpiryDate(importance: number, createdAt: Date): Date {
    const now = createdAt;
    let ttlDays: number;

    if (importance >= TTL_CONFIG.HIGH_IMPORTANCE_THRESHOLD) {
      ttlDays = TTL_CONFIG.HIGH_TTL_DAYS;
    } else if (importance >= TTL_CONFIG.MEDIUM_IMPORTANCE_THRESHOLD) {
      ttlDays = TTL_CONFIG.MEDIUM_TTL_DAYS;
    } else {
      ttlDays = TTL_CONFIG.LOW_TTL_DAYS;
    }

    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + ttlDays);
    return expiryDate;
  }

  /**
   * Start the cleanup worker
   */
  public start(intervalMs: number = 24 * 60 * 60 * 1000): void {
    if (this.intervalId) {
      logger.warn('Memory cleanup worker already running');
      return;
    }

    logger.info(
      { intervalHours: intervalMs / (1000 * 60 * 60) },
      'Starting memory cleanup worker'
    );

    // Run immediately on startup
    this.runCleanup().catch(err => {
      logger.error({ error: err.message }, 'Initial memory cleanup failed');
    });

    // Then run on schedule
    this.intervalId = setInterval(() => {
      this.runCleanup().catch(err => {
        logger.error({ error: err.message }, 'Scheduled memory cleanup failed');
      });
    }, intervalMs);
  }

  /**
   * Stop the cleanup worker
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Memory cleanup worker stopped');
    }
  }

  /**
   * Run the cleanup job
   */
  private async runCleanup(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Memory cleanup already running, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting memory cleanup job');

      // Find expired memories that are still active
      const expiredMemories = await prisma.memory.findMany({
        where: {
          isActive: true,
          expiresAt: {
            lt: new Date(),
          },
          isPinned: false, // Don't archive pinned memories
        },
        select: {
          id: true,
          userId: true,
          importance: true,
          expiresAt: true,
        },
        take: 1000, // Batch process
      });

      if (expiredMemories.length === 0) {
        logger.info('No expired memories to clean up');
        return;
      }

      // Archive expired memories
      const memoryIds = expiredMemories.map(m => m.id);
      await prisma.memory.updateMany({
        where: {
          id: { in: memoryIds },
        },
        data: {
          isActive: false,
          isArchived: true,
        },
      });

      const duration = Date.now() - startTime;
      logger.info(
        {
          archived: expiredMemories.length,
          durationMs: duration,
        },
        'Memory cleanup completed'
      );

      // Emit telemetry event (if event bus available)
      try {
        const { getContextEventBus } = await import('../context/index.js');
        const eventBus = getContextEventBus();
        
        // Group by user for batch events
        const byUser = new Map<string, string[]>();
        expiredMemories.forEach(m => {
          if (!byUser.has(m.userId)) {
            byUser.set(m.userId, []);
          }
          byUser.get(m.userId)!.push(m.id);
        });

        for (const [userId, memoryIds] of byUser.entries()) {
          await eventBus.emit('memory:batch_archived', {
            userId,
            memoryIds,
            reason: 'ttl_expired',
            count: memoryIds.length,
          });
        }
      } catch (err) {
        logger.debug({ error: (err as Error).message }, 'Could not emit telemetry events');
      }
    } catch (error) {
      logger.error(
        { error: (error as Error).message, durationMs: Date.now() - startTime },
        'Memory cleanup job failed'
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger cleanup (for admin API)
   */
  public async triggerManualCleanup(): Promise<{ archived: number }> {
    const startTime = Date.now();

    const expiredMemories = await prisma.memory.findMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() },
        isPinned: false,
      },
      select: { id: true },
      take: 1000,
    });

    if (expiredMemories.length === 0) {
      return { archived: 0 };
    }

    const memoryIds = expiredMemories.map(m => m.id);
    await prisma.memory.updateMany({
      where: { id: { in: memoryIds } },
      data: {
        isActive: false,
        isArchived: true,
      },
    });

    return {
      archived: expiredMemories.length,
    };
  }

  /**
   * Get worker status
   */
  public getStatus(): {
    isRunning: boolean;
    isActive: boolean;
  } {
    return {
      isRunning: this.isRunning,
      isActive: this.intervalId !== null,
    };
  }
}

// Singleton instance
let _instance: MemoryCleanupWorker | null = null;

export function getMemoryCleanupWorker(): MemoryCleanupWorker {
  if (!_instance) {
    _instance = new MemoryCleanupWorker();
  }
  return _instance;
}

export function initMemoryCleanupWorker(): MemoryCleanupWorker {
  const worker = getMemoryCleanupWorker();
  worker.start();
  return worker;
}

export default MemoryCleanupWorker;

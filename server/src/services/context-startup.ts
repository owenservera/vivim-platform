/**
 * Context System Startup
 *
 * Boots the full enhanced dynamic context engine at server startup.
 * This is the single place that wires together:
 *   1. Event bus invalidation handlers (wireDefaultInvalidation)
 *   2. Context warmup worker with bundle compiler
 *   3. Context graph manager
 *   4. Periodic cleanup jobs
 *
 * Call `bootContextSystem()` in server.js after all middleware is set up
 * but before accepting requests.
 */

import { logger } from '../lib/logger.js';
import {
  getContextEventBus,
  wireDefaultInvalidation,
  getContextCache,
  BundleCompiler,
  ContextGraphManager,
  createEmbeddingService,
  createLLMService,
} from '../context/index.js';
import { getPrismaClient } from '../lib/database.js';
import { initContextWarmupWorker } from './context-warmup-worker.js';
import { InvalidationService } from './invalidation-service.js';
import { initMemoryCleanupWorker } from '../workers/memory-cleanup-worker.js';

let _booted = false;

/**
 * Boot the full enhanced dynamic context system.
 * Safe to call multiple times – idempotent.
 */
export async function bootContextSystem(): Promise<void> {
  if (_booted) {
    logger.debug('Context system already booted, skipping');
    return;
  }

  try {
    logger.info('🧠 Booting Enhanced Dynamic Context System...');

    const prisma = getPrismaClient();

    // ── 1. Wire event bus → cache invalidation ──────────────────────────
    const eventBus = getContextEventBus();
    const cache = getContextCache();
    wireDefaultInvalidation(eventBus, cache);
    logger.info('✅ Context event bus invalidation handlers wired');

    // ── 1b. Initialize InvalidationService ──────────────────────────────
    const invalidationService = new InvalidationService(eventBus);
    invalidationService.initialize();
    logger.info('✅ InvalidationService initialized');

    // ── 1c. Initialize Memory Cleanup Worker ────────────────────────────
    initMemoryCleanupWorker();
    logger.info('✅ Memory cleanup worker started (24h interval)');

    // ── 2. Initialize bundle compiler + warmup worker ───────────────────
    try {
      const embeddingService = createEmbeddingService();
      const llmService = createLLMService();

      const bundleCompiler = new BundleCompiler({
        prisma,
        embeddingService,
        llmService,
      });

      initContextWarmupWorker(bundleCompiler);
      logger.info('✅ Context warmup worker initialized');
    } catch (err: any) {
      // Z.AI services might not be configured – warmup worker degraded
      logger.warn(
        { error: err.message },
        '⚠️  Context warmup worker degraded (Z.AI services unavailable)'
      );
    }

    // ── 3. Initialize context graph manager ──────────────────────────────
    try {
      const graphManager = new ContextGraphManager(prisma);
      logger.info('✅ Context graph manager initialized');

      // Wire graph invalidation on ACU + memory events
      eventBus.on('acu:processed', async (event) => {
        try {
          await graphManager.invalidateAndRebuild(event.userId);
        } catch (err: any) {
          logger.debug({ error: err.message }, 'Graph rebuild deferred (non-critical)');
        }
      }, { priority: 10 });

      eventBus.on('memory:created', async (event) => {
        try {
          await graphManager.invalidateAndRebuild(event.userId);
        } catch (err: any) {
          logger.debug({ error: err.message }, 'Graph rebuild on memory create deferred');
        }
      }, { priority: 10 });
    } catch (err: any) {
      logger.warn({ error: err.message }, '⚠️  Context graph manager initialization skipped');
    }

    // ── 4. Periodic cleanup: expired bundles every 30 minutes ───────────
    const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
    setInterval(async () => {
      try {
        const deleted = await prisma.contextBundle.deleteMany({
          where: {
            expiresAt: { lt: new Date() },
          },
        });
        if (deleted.count > 0) {
          logger.info({ count: deleted.count }, '🗑  Pruned expired context bundles');
        }
      } catch (err: any) {
        logger.debug({ error: err.message }, 'Bundle cleanup skipped');
      }
    }, CLEANUP_INTERVAL_MS).unref();

    // ── 5. Periodic system:cleanup event ────────────────────────────────
    setInterval(() => {
      eventBus.emit('system:cleanup', 'system', {
        timestamp: Date.now(),
        cacheStats: cache.getAllStats(),
      }).catch(() => {});
    }, 60 * 60 * 1000).unref(); // every hour

    _booted = true;
    logger.info('🚀 Enhanced Dynamic Context System fully operational');
  } catch (error: any) {
    logger.error({ error: error.message }, '❌ Context system boot failed – running degraded');
    // Don't throw – server should still start even if context system fails
  }
}

/**
 * Check if context system is booted
 */
export function isContextSystemBooted(): boolean {
  return _booted;
}

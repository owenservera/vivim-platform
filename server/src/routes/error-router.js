/**
 * Error Routing and Reporting
 * 
 * Handles error ingestion from PWA and Provides debugging status for system components.
 */

import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { cacheService } from '../services/cache-service.js';
import { circuitBreakerService } from '../services/circuit-breaker.js';
import { queueService } from '../services/queue-service.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

const router = Router();

// ============================================================================
// ERROR INGESTION
// ============================================================================

/**
 * POST /api/v1/errors
 * 
 * Receive error reports from PWA/Client
 */
router.post('/', async (req, res) => {
  const { reports } = req.body;

  if (!reports || !Array.isArray(reports)) {
    return res.status(400).json({ error: 'Invalid reports format' });
  }

  for (const report of reports) {
    logger.error({ 
      component: report.component,
      category: report.category,
      message: report.message,
      severity: report.severity,
      context: report.context,
      stack: report.stack
    }, `Client Error Reported: ${report.message}`);

    // If it's a critical client error, we might want to alert or store it specially
    if (report.severity === 'critical') {
      await serverErrorReporter.reportServerError(
        `Critical Client Error: ${report.message}`,
        null,
        report,
        'critical'
      );
    }
  }

  res.status(202).json({ status: 'accepted', count: reports.length });
});

// ============================================================================
// SYSTEM DEBUGGING & STATUS
// ============================================================================

/**
 * GET /api/v1/errors/status
 * 
 * Get a detailed health and debugging status of all server-side components.
 */
router.get('/status', (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    components: {
      cache: {
        connected: cacheService.isConnected,
        type: cacheService.client ? 'redis' : 'memory',
        memoryCacheSize: cacheService.memoryCache.size
      },
      queues: Array.from(queueService.queues.entries()).map(([name, queue]) => ({
        name,
        pending: queue.pending,
        size: queue.size,
        concurrency: queue.concurrency
      })),
      circuitBreakers: Array.from(circuitBreakerService.breakers.entries()).map(([name, breaker]) => ({
        name,
        state: breaker.state,
        stats: breaker.stats,
        enabled: breaker.enabled
      })),
      database: {
        // Simple health check could go here
        status: 'connected' // Placeholder
      }
    }
  };

  res.json(status);
});

export default router;

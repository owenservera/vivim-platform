/**
 * Monitoring Endpoints
 *
 * Exposes internal metrics for Prometheus or external monitoring.
 * Tracks queue sizes, request rates, error counts, and memory usage.
 */

import { Router } from 'express';
import { requireApiKey } from '../../middleware/auth.js';
import { queueService } from '../services/queue-service.js';
import { cacheService } from '../services/cache-service.js';

const router = Router();

// ============================================================================
// METRICS ENDPOINT
// ============================================================================

router.get('/metrics', requireApiKey(), (req, res) => {
  const memoryUsage = process.memoryUsage();

  const queues = ['consolidation', 'extraction', 'capture', 'sync'].reduce((acc, queueName) => {
    acc[queueName] = queueService.getStats(queueName);
    return acc;
  }, {});

  const metrics = {
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    queues: queues,
    cache: {
      isConnected: cacheService.isConnected,
      // Add hit/miss stats if available
    },
    // Add other relevant stats like DB connection pool status if possible
  };

  res.json(metrics);
});

export default router;

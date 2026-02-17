import { Router } from 'express';
import { debugReporter } from '../services/debug-reporter.js';
import { getPrismaClient, getDatabaseStats } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const router = Router();

const requireDevMode = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return res
      .status(403)
      .json({ success: false, error: 'Debug endpoints disabled in production' });
  }
  next();
};

router.use(requireDevMode);

router.get('/status', (req, res) => {
  const status = debugReporter.getStatus();
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.json({
    success: true,
    data: {
      ...status,
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      platform: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    },
  });
});

router.get('/errors', (req, res) => {
  const { category, level, severity, limit = 100 } = req.query;

  const filters = {};
  if (category) filters.category = category;
  if (level) filters.level = parseInt(level);
  if (severity) filters.severity = severity;
  if (limit) filters.limit = parseInt(limit);

  const errors = debugReporter.getErrors(filters);

  res.json({
    success: true,
    data: errors,
    count: errors.length,
    filters,
  });
});

router.get('/performance', (req, res) => {
  const metrics = debugReporter.getPerformanceMetrics();

  res.json({
    success: true,
    data: metrics,
  });
});

router.get('/queries', (req, res) => {
  const { slowOnly = 'false', limit = 100 } = req.query;
  let queries = debugReporter.queries;

  if (slowOnly === 'true') {
    queries = queries.filter((q) => q.isSlow);
  }

  if (limit) {
    queries = queries.slice(-parseInt(limit));
  }

  res.json({
    success: true,
    data: queries,
    count: queries.length,
  });
});

router.get('/external-calls', (req, res) => {
  const { failedOnly = 'false', limit = 100 } = req.query;
  let calls = debugReporter.externalCalls;

  if (failedOnly === 'true') {
    calls = calls.filter((c) => !c.success);
  }

  if (limit) {
    calls = calls.slice(-parseInt(limit));
  }

  res.json({
    success: true,
    data: calls,
    count: calls.length,
  });
});

router.get('/extractions', (req, res) => {
  const { limit = 100 } = req.query;
  let extractions = debugReporter.extractions;

  if (limit) {
    extractions = extractions.slice(-parseInt(limit));
  }

  res.json({
    success: true,
    data: extractions,
    count: extractions.length,
  });
});

router.get('/sync-operations', (req, res) => {
  const { limit = 100 } = req.query;
  let operations = debugReporter.syncOperations;

  if (limit) {
    operations = operations.slice(-parseInt(limit));
  }

  res.json({
    success: true,
    data: operations,
    count: operations.length,
  });
});

router.get('/state-snapshots', (req, res) => {
  const { limit = 50 } = req.query;
  let snapshots = debugReporter.stateSnapshots;

  if (limit) {
    snapshots = snapshots.slice(-parseInt(limit));
  }

  res.json({
    success: true,
    data: snapshots,
    count: snapshots.length,
  });
});

router.get('/state/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;

  try {
    const prisma = getPrismaClient();
    let entity = null;

    switch (entityType.toLowerCase()) {
      case 'user':
        entity = await prisma.user.findUnique({ where: { id: entityId } });
        break;
      case 'conversation':
        entity = await prisma.conversation.findUnique({ where: { id: entityId } });
        break;
      case 'captureattempt':
      case 'capture_attempt':
        entity = await prisma.captureAttempt.findUnique({ where: { id: entityId } });
        break;
      case 'atomicchatunit':
      case 'acu':
        entity = await prisma.atomicChatUnit.findUnique({ where: { id: entityId } });
        break;
      case 'syncoperation':
        entity = await prisma.syncOperation.findUnique({ where: { id: entityId } });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown entity type: ${entityType}`,
        });
    }

    if (!entity) {
      return res.status(404).json({
        success: false,
        error: 'Entity not found',
      });
    }

    res.json({
      success: true,
      data: {
        type: entityType,
        id: entityId,
        entity,
        capturedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error: error.message, entityType, entityId }, 'Failed to get entity state');
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve entity state',
    });
  }
});

router.post('/inspect/:service', (req, res) => {
  const { service } = req.params;

  const serviceInspectors = {
    database: () => {
      const stats = getDatabaseStats();
      return {
        service: 'database',
        status: 'operational',
        stats,
        connectionInfo: {
          host: process.env.DATABASE_HOST || 'localhost',
          database: process.env.DATABASE_NAME || 'vivim',
        },
      };
    },
    debug: () => {
      return {
        service: 'debug',
        status: 'operational',
        bufferSizes: {
          errors: debugReporter.errors.length,
          warnings: debugReporter.warnings.length,
          queries: debugReporter.queries.length,
          externalCalls: debugReporter.externalCalls.length,
          extractions: debugReporter.extractions.length,
          syncOperations: debugReporter.syncOperations.length,
        },
      };
    },
    logger: () => {
      return {
        service: 'logger',
        status: 'operational',
        config: {
          level: process.env.LOG_LEVEL || 'info',
          format: process.env.LOG_FORMAT || 'json',
        },
      };
    },
    memory: () => {
      const mem = process.memoryUsage();
      return {
        service: 'memory',
        status: 'operational',
        usage: {
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          external: mem.external,
          rss: mem.rss,
        },
      };
    },
  };

  const inspector = serviceInspectors[service.toLowerCase()];

  if (!inspector) {
    return res.status(400).json({
      success: false,
      error: `Unknown service: ${service}. Available: ${Object.keys(serviceInspectors).join(', ')}`,
    });
  }

  try {
    const result = inspector();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error: error.message, service }, 'Service inspection failed');
    res.status(500).json({
      success: false,
      error: 'Service inspection failed',
    });
  }
});

router.post('/clear', (req, res) => {
  debugReporter.clear();

  res.json({
    success: true,
    message: 'Debug buffer cleared',
  });
});

router.get('/health', async (req, res) => {
  try {
    const dbHealth = await getPrismaClient().$queryRaw`SELECT 1`;
    const memory = process.memoryUsage();

    res.json({
      success: true,
      data: {
        database: 'healthy',
        memory: {
          status: memory.heapUsed < 1024 * 1024 * 1024 ? 'healthy' : 'warning',
          heapUsed: memory.heapUsed,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      details: error.message,
    });
  }
});

export { router as debugRouter };
export default router;

/**
 * Health Check Routes
 *
 * Public health endpoints (no auth, no rate limiting)
 */

import { Router } from 'express';
import { createRequestLogger } from '../lib/logger.js';
import { healthResponseSchema } from '../validators/schemas.js';
import { checkDatabaseHealth, getDatabaseStats } from '../lib/database.js';

const router = Router();

// ============================================================================
// PACKAGE INFO
// ============================================================================

// Read package.json for version info
let packageInfo;
try {
  packageInfo = await import('../../package.json', { with: { type: 'json' } });
} catch (e) {
  packageInfo = { default: { version: '2.0.0' } };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

router.get('/', (req, res) => {
  const log = createRequestLogger(req);

  const healthData = {
    status: 'ok',
    service: 'OpenScroll Capture API',
    version: packageInfo.default.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Validate response
  const validated = healthResponseSchema.parse(healthData);

  console.log(`\n✅ [HEALTH CHECK] Service status: ${validated.status}`);
  console.log(`   Service: ${validated.service}`);
  console.log(`   Version: ${validated.version}`);
  console.log(`   Environment: ${validated.environment}`);
  console.log(`   Timestamp: ${validated.timestamp}`);
  console.log(`   Uptime: ${Math.round(validated.uptime)}s\n`);

  log.info({ health: validated }, 'Health check');

  res.json(validated);
});

// ============================================================================
// DETAILED HEALTH (WITH DATABASE)
// ============================================================================

router.get('/health/detailed', async (req, res) => {
  const log = createRequestLogger(req);

  // Check database health
  const dbHealthy = await checkDatabaseHealth();
  const dbStats = dbHealthy ? await getDatabaseStats() : null;

  const healthData = {
    status: dbHealthy ? 'ok' : 'degraded',
    service: 'OpenScroll Capture API',
    version: packageInfo.default.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    system: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss,
      },
    },
    database: dbHealthy
      ? {
          status: 'connected',
          stats: dbStats,
        }
      : {
          status: 'disconnected',
        },
  };

  console.log('\n🔍 [DETAILED HEALTH CHECK]');
  console.log(`   Service: ${healthData.service}`);
  console.log(`   Status: ${healthData.status}`);
  console.log(`   Version: ${healthData.version}`);
  console.log(`   Environment: ${healthData.environment}`);
  console.log(`   Database: ${dbHealthy ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
  console.log(`   Node: ${healthData.system.node}`);
  console.log(`   Platform: ${healthData.system.platform}/${healthData.system.arch}`);
  console.log(`   Memory Used: ${(healthData.system.memory.used / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Uptime: ${Math.round(healthData.uptime)}s`);
  console.log(`   Timestamp: ${healthData.timestamp}\n`);

  log.info({ health: healthData }, 'Detailed health check');

  res.status(dbHealthy ? 200 : 503).json(healthData);
});

// ============================================================================
// ADMIN HEALTH CHECK (AUTHENTICATED)
// ============================================================================

import { requireApiKey } from '../middleware/auth.js';

router.get('/health/admin', requireApiKey(), async (req, res) => {
  const log = createRequestLogger(req);

  // Check database health
  const dbHealthy = await checkDatabaseHealth();
  const dbStats = dbHealthy ? await getDatabaseStats() : null;

  // Get additional admin-level metrics
  const adminHealthData = {
    status: dbHealthy ? 'operational' : 'degraded',
    service: 'OpenScroll Capture API',
    version: packageInfo.default.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    authenticatedUser: req.auth?.apiKeyPrefix,
    system: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss,
      },
      uptime: process.uptime(),
      loadAverage: process.platform !== 'win32' ? process.loadavg() : [0, 0, 0],
    },
    database: dbHealthy
      ? {
          status: 'connected',
          stats: dbStats,
        }
      : {
          status: 'disconnected',
        },
    security: {
      corsOrigins: process.env.CORS_ORIGINS?.split(',').length || 0,
      rateLimit: process.env.RATE_LIMIT_MAX || 100,
      sslEnabled: process.env.DATABASE_SSL_REQUIRED === 'true',
    },
  };

  log.info(
    {
      health: adminHealthData.status,
      user: req.auth?.apiKeyPrefix,
    },
    'Admin health check'
  );

  res.status(dbHealthy ? 200 : 503).json(adminHealthData);
});

// ============================================================================
// CAPABILITIES
// ============================================================================

router.get('/capabilities', (req, res) => {
  res.json({
    aiActions: true,
    sharing: true,
    circles: true,
    offlineQueue: true,
    semanticSearch: true,
    lineage: true,
  });
});

export { router as healthRouter };

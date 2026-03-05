/**
 * Admin System Routes
 *
 * System monitoring, logs, and health endpoints
 */

import { Router } from 'express';
import { createRequestLogger } from '../../lib/logger.js';
import { getPrismaClient } from '../../lib/database.js';
import os from 'os';
import { statfs } from 'fs/promises';

const router = Router();
const prisma = getPrismaClient();

/**
 * Get real disk usage for the process working directory.
 * Uses Node's native statfs (>= v19). Falls back to null on older runtimes.
 */
async function getDiskUsage() {
  try {
    const stats = await statfs(process.cwd());
    const total = stats.blocks * stats.bsize;
    const free  = stats.bfree  * stats.bsize;
    const used  = total - free;
    return {
      total,
      used,
      free,
      percentage: total > 0 ? (used / total) * 100 : 0,
    };
  } catch {
    // statfs not available (older Node) — return null; caller decides fallback
    return null;
  }
}

// ============================================================================
// GET SYSTEM STATS
// ============================================================================

/**
 * GET /api/admin/system/stats
 *
 * Get system resource statistics
 */
router.get('/stats', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const disk = await getDiskUsage();

    const stats = {
      cpu: {
        usage: process.cpuUsage().user / 1000000, // microseconds → seconds
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      disk: disk ?? {
        total: null,
        used: null,
        free: null,
        percentage: null,
        error: 'statfs not available on this runtime',
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    log.info('System stats retrieved');
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET USER STATS
// ============================================================================

/**
 * GET /api/admin/system/users/stats
 *
 * Get user statistics
 */
router.get('/users/stats', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [totalUsers, newUsersToday, newUsersWeek] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    ]);

    const stats = {
      totalUsers,
      newUsersToday,
      newUsersWeek,
    };

    log.info('User stats retrieved (real data)');
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET CONVERSATION STATS
// ============================================================================

/**
 * GET /api/admin/system/conversations/stats
 *
 * Get conversation statistics
 */
router.get('/conversations/stats', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const [totalConversations, totalMessages] = await Promise.all([
      prisma.conversation.count(),
      prisma.message.count(),
    ]);

    const avg = totalConversations > 0
      ? (totalMessages / totalConversations).toFixed(1)
      : 0;

    const stats = {
      totalConversations,
      totalMessages,
      avgMessagesPerConversation: Number(avg),
    };

    log.info('Conversation stats retrieved (real data)');
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET STORAGE STATS
// ============================================================================

/**
 * GET /api/admin/system/storage/stats
 *
 * Get storage statistics
 */
router.get('/storage/stats', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const [dbSizeRows, tableCountRows, totalConvos] = await Promise.all([
      prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;
      `,
      prisma.$queryRaw`
        SELECT count(*)::int AS table_count, sum(n_live_tup)::int AS row_count
        FROM pg_stat_user_tables;
      `,
      prisma.conversation.count(),
    ]);

    const stats = {
      database: {
        totalSize: dbSizeRows[0]?.db_size ?? 'unknown',
        tables: tableCountRows[0]?.table_count ?? 0,
        rows: Number(tableCountRows[0]?.row_count ?? 0),
      },
      conversations: {
        total: totalConvos,
      },
      timestamp: new Date().toISOString(),
    };

    log.info('Storage stats retrieved (real data)');
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET SYSTEM LOGS
// ============================================================================

/**
 * GET /api/admin/system/logs
 *
 * Get system logs with filtering
 */
router.get('/logs', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { level, source, limit = 100 } = req.query;

    // TODO: Integrate with actual logging system
    // For now, return mock logs
    const mockLogs = [];

    for (let i = 0; i < parseInt(limit, 10); i++) {
      const levels = ['debug', 'info', 'warn', 'error'];
      const sources = ['server', 'database', 'network', 'api', 'auth'];
      const messages = [
        'Request received',
        'Database query executed',
        'User authenticated',
        'Network node connected',
        'API rate limit checked',
      ];

      mockLogs.push({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        level: level || levels[Math.floor(Math.random() * levels.length)],
        source: source || sources[Math.floor(Math.random() * sources.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        metadata: {
          userId: `user-${Math.floor(Math.random() * 100)}`,
          requestId: `req-${Math.random().toString(36).substring(7)}`,
        },
      });
    }

    log.info({ count: mockLogs.length, filters: { level, source } }, 'System logs retrieved');

    res.json(mockLogs);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET SYSTEM HEALTH
// ============================================================================

/**
 * GET /api/admin/system/health
 *
 * Get system health status
 */
router.get('/health', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    // Check database connection
    let dbStatus = 'up';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'down';
    }

    // Check disk availability
    const disk = await getDiskUsage();
    const diskStatus = disk !== null ? 'up' : 'unknown';

    // Check memory (flag as degraded if >90% used)
    const memPct = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
    const memStatus = memPct < 90 ? 'up' : 'degraded';

    const overallStatus = [dbStatus, memStatus].every(s => s === 'up') ? 'healthy' : 'degraded';

    const health = {
      status: overallStatus,
      services: {
        database: dbStatus,
        memory: memStatus,
        disk: diskStatus,
        api: 'up',
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    log.info('System health retrieved');

    res.json(health);
  } catch (error) {
    next(error);
  }
});

export default router;

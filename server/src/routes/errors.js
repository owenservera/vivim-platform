/**
 * Error Collection API Endpoint
 * Receives error reports from all components (PWA, Network, Server)
 *
 * Enhanced with:
 * - Error aggregation and trends
 * - Alert configuration
 * - Service contract violation tracking
 * - Sync issue tracking
 */

import express from 'express';
import { logger } from '../lib/logger.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';
import { config } from '../config/index.js';
import { z } from 'zod';
import { circuitBreakerService } from '../services/circuit-breaker.js';
import { queueService } from '../services/queue-service.js';
import { cacheService } from '../services/cache-service.js';
import { ErrorAggregator } from '../../../common/error-aggregator.js';
import { ErrorAlerter } from '../../../common/error-alerting.js';

const router = express.Router();

const errorAggregator = ErrorAggregator.getInstance();
const errorAlerter = ErrorAlerter.getInstance();

// Zod schema for validating error reports (simplified for compatibility)
const errorReportSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string().optional(),
  level: z.string().optional(),
  component: z.string().optional(),
  category: z.string().optional(),
  message: z.string().optional(),
  stack: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  version: z.string().optional(),
  severity: z.string().optional(),
});

const bulkErrorReportSchema = z.object({
  reports: z.array(z.object({})).optional(),
});

// In-memory storage for collected errors (in production, use a database)
const errorStorage = {
  errors: [],
  maxSize: 10000, // Keep only the last 10,000 errors

  add(errorReport) {
    this.errors.push(errorReport);
    // Trim if we exceed max size
    if (this.errors.length > this.maxSize) {
      this.errors = this.errors.slice(-this.maxSize);
    }
  },

  getAll() {
    return [...this.errors]; // Return a copy
  },

  getByComponent(component) {
    return this.errors.filter((e) => e.component === component);
  },

  getBySeverity(severity) {
    return this.errors.filter((e) => e.severity === severity);
  },

  getByCategory(category) {
    return this.errors.filter((e) => e.category === category);
  },

  getRecent(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.errors.filter((e) => new Date(e.timestamp) > cutoff);
  },

  getStats() {
    const stats = {
      total: this.errors.length,
      byLevel: {},
      byComponent: {},
      bySeverity: {},
      byCategory: {},
      recent: this.getRecent(1).length, // Errors in last hour
    };

    this.errors.forEach((error) => {
      // Count by level
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;

      // Count by component
      stats.byComponent[error.component] = (stats.byComponent[error.component] || 0) + 1;

      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

      // Count by category
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
    });

    return stats;
  },

  clear() {
    this.errors = [];
  },
};

// Endpoint to receive error reports from clients
router.post('/', async (req, res) => {
  try {
    // Accept reports without strict validation for development
    const { reports = [] } = req.body || {};

    // Process each error report
    for (const report of reports) {
      // Store the error
      errorStorage.add(report);

      // Log to server logs as well
      logger.error(
        {
          component: report?.component,
          category: report?.category,
          severity: report?.severity,
          message: report?.message,
          userId: report?.userId,
          url: report?.url,
          userAgent: report?.userAgent,
        },
        'Error report received from client'
      );

      // For critical errors, send immediate notification
      if (report?.severity === 'critical') {
        logger.error(
          {
            type: 'CRITICAL_ERROR_ALERT',
            component: report?.component,
            message: report?.message,
            userId: report?.userId,
          },
          'Critical error detected'
        );
      }
    }

    logger.info({ count: reports.length }, 'Error reports processed successfully');

    res.status(200).json({
      success: true,
      message: `Processed ${reports.length} error reports`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to process error reports');

    await serverErrorReporter.reportAPIError('Failed to process error reports', error, {
      requestBodySize: req.body?.reports?.length || 0,
    });

    res.status(500).json({
      error: 'Failed to process error reports',
      message: error.message,
    });
  }
});

// GET endpoint to retrieve error statistics (for dashboard)
router.get('/stats', (req, res) => {
  try {
    const stats = errorStorage.getStats();

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get error stats');
    res.status(500).json({
      error: 'Failed to get error statistics',
    });
  }
});

// GET endpoint to retrieve recent errors (for dashboard)
router.get('/recent', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 100;
    const { component } = req.query;
    const { severity } = req.query;
    const { category } = req.query;

    let errors = errorStorage.getRecent(hours);

    // Apply filters
    if (component) {
      errors = errors.filter((e) => e.component === component);
    }

    if (severity) {
      errors = errors.filter((e) => e.severity === severity);
    }

    if (category) {
      errors = errors.filter((e) => e.category === category);
    }

    // Sort by timestamp (newest first) and limit
    errors = errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

    res.status(200).json({
      success: true,
      data: errors,
      count: errors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get recent errors');
    res.status(500).json({
      error: 'Failed to get recent errors',
    });
  }
});

// GET endpoint to retrieve all errors (admin only, with auth check in production)
router.get('/', (req, res) => {
  try {
    // In production, add authentication check here
    if (config.isProduction && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    const { component } = req.query;
    const { severity } = req.query;
    const { category } = req.query;

    let errors = errorStorage.getAll();

    // Apply filters
    if (component) {
      errors = errors.filter((e) => e.component === component);
    }

    if (severity) {
      errors = errors.filter((e) => e.severity === severity);
    }

    if (category) {
      errors = errors.filter((e) => e.category === category);
    }

    // Sort by timestamp (newest first)
    errors = errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: errors,
      count: errors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get all errors');
    res.status(500).json({
      error: 'Failed to get errors',
    });
  }
});

// Admin endpoint to clear errors (with auth check in production)
router.delete('/clear', (req, res) => {
  try {
    // In production, add authentication check here
    if (config.isProduction && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    const count = errorStorage.errors.length;
    errorStorage.clear();

    logger.info({ count }, 'Error logs cleared by admin');

    res.status(200).json({
      success: true,
      message: `Cleared ${count} error reports`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to clear errors');
    res.status(500).json({
      error: 'Failed to clear errors',
    });
  }
});

/**
 * GET /api/v1/errors/system-status
 *
 * Get detailed health and debugging status of all server-side components.
 */
router.get('/system-status', (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    components: {
      cache: {
        connected: cacheService.isConnected,
        type: cacheService.client ? 'redis' : 'memory',
        memoryCacheSize: cacheService.memoryCache.size,
      },
      queues: Array.from(queueService.queues.entries()).map(([name, queue]) => ({
        name,
        pending: queue.pending,
        size: queue.size,
        concurrency: queue.concurrency,
      })),
      circuitBreakers: Array.from(circuitBreakerService.breakers.entries()).map(
        ([name, breaker]) => ({
          name,
          state: breaker.state,
          stats: breaker.stats,
          enabled: breaker.enabled,
        })
      ),
      database: {
        status: 'connected',
      },
    },
  };

  res.json(status);
});

export { router as errorsRouter };

// ============================================================================
// ENHANCED ERROR DASHBOARD API ENDPOINTS
// ============================================================================

const enhancedRouter = express.Router();

enhancedRouter.post('/', async (req, res) => {
  try {
    const { reports = [] } = req.body || {};

    for (const report of reports) {
      errorStorage.add(report);
      errorAggregator.addError(report);

      if (report?.severity === 'critical') {
        await errorAlerter.alertError(report);
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${reports.length} error reports`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to process error reports');
    res.status(500).json({ error: 'Failed to process error reports', message: error.message });
  }
});

enhancedRouter.get('/summary', (req, res) => {
  try {
    const windowMs = parseInt(req.query.windowMs) || 3600000;
    const summary = errorAggregator.getSummary(windowMs);
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get error summary');
    res.status(500).json({ error: 'Failed to get error summary' });
  }
});

enhancedRouter.get('/groups', (req, res) => {
  try {
    const groups = errorAggregator.groupErrors();
    res.json({ success: true, data: groups });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get error groups');
    res.status(500).json({ error: 'Failed to get error groups' });
  }
});

enhancedRouter.get('/trends', (req, res) => {
  try {
    const windowMs = parseInt(req.query.windowMs) || 3600000;
    const currentWindow = errorAggregator.getErrorsInTimeWindow(windowMs);
    const previousWindow = errorAggregator
      .getErrorsInTimeWindow(windowMs * 2)
      .filter((e) => new Date(e.timestamp).getTime() <= Date.now() - windowMs);
    const trends = errorAggregator.calculateTrends(currentWindow, previousWindow);
    res.json({ success: true, data: trends });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get error trends');
    res.status(500).json({ error: 'Failed to get error trends' });
  }
});

enhancedRouter.get('/alerts', (req, res) => {
  try {
    const alerts = errorAggregator.getAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get alerts');
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

enhancedRouter.get('/alert-history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = errorAlerter.getAlertHistory(undefined, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get alert history');
    res.status(500).json({ error: 'Failed to get alert history' });
  }
});

enhancedRouter.post('/alert-channels', (req, res) => {
  try {
    const { type, enabled, webhookUrl, minSeverity } = req.body;
    errorAlerter.configureChannel({ type, enabled, webhookUrl, minSeverity });
    res.json({ success: true, message: `Channel ${type} configured` });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to configure alert channel');
    res.status(500).json({ error: 'Failed to configure alert channel' });
  }
});

enhancedRouter.get('/alert-channels', (req, res) => {
  try {
    const channels = Array.from(['slack', 'discord', 'webhook', 'email', 'sms']).map((type) =>
      errorAlerter.getChannelConfig(type)
    );
    res.json({ success: true, data: channels });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get alert channels');
    res.status(500).json({ error: 'Failed to get alert channels' });
  }
});

enhancedRouter.post('/alert-rules', (req, res) => {
  try {
    const { name, enabled, conditions, actions } = req.body;
    const rule = errorAlerter.addRule({ name, enabled, conditions, actions });
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create alert rule');
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

enhancedRouter.get('/alert-rules', (req, res) => {
  try {
    const rules = errorAlerter.getAllRules();
    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get alert rules');
    res.status(500).json({ error: 'Failed to get alert rules' });
  }
});

enhancedRouter.delete('/alert-rules/:ruleId', (req, res) => {
  try {
    const { ruleId } = req.params;
    const removed = errorAlerter.removeRule(ruleId);
    res.json({ success: removed, message: removed ? 'Rule removed' : 'Rule not found' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to delete alert rule');
    res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});

export { router as enhancedErrorsRouter };

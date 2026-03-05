/**
 * Feed Analytics API
 *
 * Endpoints for tracking and analyzing feed impressions
 * to improve recommendation algorithms.
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Schema for batch impression tracking
const BatchImpressionsSchema = z.object({
  impressions: z.array(z.object({
    contentId: z.string(),
    contentType: z.enum(['conversation', 'acu', 'notebook']),
    position: z.number().int().min(0),
    contextTags: z.array(z.string()).optional().default([]),
    dwellTimeMs: z.number().int().min(0).optional(),
    clicked: z.boolean().optional().default(false),
    shared: z.boolean().optional().default(false),
    dismissed: z.boolean().optional().default(false),
  })),
});

/**
 * POST /api/v2/feed/analytics
 * Track batch of feed impressions
 */
router.post('/analytics', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const validation = BatchImpressionsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.errors,
      });
    }

    const { impressions } = validation.data;

    // Rate limiting check - max 100 impressions per batch
    if (impressions.length > 100) {
      return res.status(400).json({
        error: 'Too many impressions',
        message: 'Maximum 100 impressions per batch',
      });
    }

    // Insert impressions in batch
    const impressionsToCreate = impressions.map(imp => ({
      userId,
      contentId: imp.contentId,
      contentType: imp.contentType,
      position: imp.position,
      contextTags: imp.contextTags,
      dwellTimeMs: imp.dwellTimeMs,
      clicked: imp.clicked,
      shared: imp.shared,
      dismissed: imp.dismissed,
    }));

    await prisma.feedImpression.createMany({
      data: impressionsToCreate,
    });

    logger.info(
      { userId, count: impressions.length },
      'Feed analytics: recorded impressions'
    );

    res.json({
      success: true,
      recorded: impressions.length,
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to record feed analytics');
    res.status(500).json({
      error: 'Failed to record analytics',
    });
  }
});

/**
 * GET /api/v2/feed/analytics/stats
 * Get user's feed analytics summary
 */
router.get('/analytics/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const where: any = { userId };
    if (since) {
      where.viewedAt = { gte: since };
    }

    const [
      totalImpressions,
      clickedCount,
      sharedCount,
      dismissedCount,
      avgDwellTime,
    ] = await Promise.all([
      prisma.feedImpression.count({ where }),
      prisma.feedImpression.count({ where: { ...where, clicked: true } }),
      prisma.feedImpression.count({ where: { ...where, shared: true } }),
      prisma.feedImpression.count({ where: { ...where, dismissed: true } }),
      prisma.feedImpression.aggregate({
        where: { ...where, dwellTimeMs: { not: null } },
        _avg: { dwellTimeMs: true },
      }),
    ]);

    res.json({
      totalImpressions,
      clickedCount,
      sharedCount,
      dismissedCount,
      avgDwellTimeMs: avgDwellTime._avg.dwellTimeMs || 0,
      clickThroughRate: totalImpressions > 0 ? clickedCount / totalImpressions : 0,
      shareRate: totalImpressions > 0 ? sharedCount / totalImpressions : 0,
      dismissalRate: totalImpressions > 0 ? dismissedCount / totalImpressions : 0,
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to fetch feed analytics stats');
    res.status(500).json({
      error: 'Failed to fetch stats',
    });
  }
});

/**
 * DELETE /api/v2/feed/analytics
 * Clear user's feed analytics data (GDPR compliance)
 */
router.delete('/analytics', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const deleted = await prisma.feedImpression.deleteMany({
      where: { userId },
    });

    logger.info(
      { userId, count: deleted.count },
      'Feed analytics: deleted user data'
    );

    res.json({
      success: true,
      deleted: deleted.count,
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to delete feed analytics');
    res.status(500).json({
      error: 'Failed to delete analytics',
    });
  }
});

export { router as feedAnalyticsRouter };

/**
 * Feed & Discovery API Routes - Phase 4 (v2)
 * Base: /api/v2/feed
 */

import { Router } from 'express';
import { z } from 'zod';
import { feedService } from '../services/feed-service.js';
import { generateContextualFeed, processFeedEngagement } from '../services/feed-context-integration.js';
import { authenticateDID } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();
const log = logger.child({ module: 'feed-routes-v2' });

router.get('/', authenticateDID, async (req, res) => {
  try {
    const { limit, offset, refresh } = req.query;

    const result = await feedService.generateFeed(req.user.userId, {
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
      refresh: refresh === 'true'
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: {
        items: result.items,
        fromCache: result.fromCache,
        totalCandidates: result.totalCandidates
      }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get feed failed');
    res.status(500).json({ success: false, error: 'Failed to get feed' });
  }
});

router.get('/discover', authenticateDID, async (req, res) => {
  try {
    const { type, limit } = req.query;

    const result = await feedService.generateDiscovery(req.user.userId, {
      type: type?.toString(),
      limit: limit ? parseInt(limit.toString()) : undefined
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result.recommendations
    });
  } catch (error) {
    log.error({ error: error.message }, 'Discovery failed');
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});

router.get('/explain/:contentId', authenticateDID, async (req, res) => {
  try {
    const result = await feedService.explainRecommendation(
      req.user.userId,
      req.params.contentId
    );

    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result.explanation
    });
  } catch (error) {
    log.error({ error: error.message }, 'Explain recommendation failed');
    res.status(500).json({ success: false, error: 'Failed to generate explanation' });
  }
});

router.get('/preferences', authenticateDID, async (req, res) => {
  try {
    const preferences = await feedService.getFeedPreferences(req.user.userId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    log.error({ error: error.message }, 'Get preferences failed');
    res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
});

router.put('/preferences', authenticateDID, async (req, res) => {
  try {
    const result = await feedService.updateFeedPreferences(req.user.userId, req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, data: result.preferences });
  } catch (error) {
    log.error({ error: error.message }, 'Update preferences failed');
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

router.post('/interact/:contentId', authenticateDID, async (req, res) => {
  try {
    const interactionSchema = z.object({
      action: z.enum(['view', 'like', 'comment', 'share', 'bookmark', 'dismiss', 'hide']),
      duration: z.number().optional(),
      completionRate: z.number().min(0).max(1).optional()
    });

    const parsed = interactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors
      });
    }

    const result = await feedService.trackInteraction(
      req.user.userId,
      req.params.contentId,
      parsed.data.action,
      {
        duration: parsed.data.duration,
        completionRate: parsed.data.completionRate,
        source: 'feed',
        timeOfDay: new Date().getHours()
      }
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    await processFeedEngagement({
      userId: req.user.userId,
      contentId: req.params.contentId,
      contentType: 'acu',
      action: parsed.data.action,
      metadata: parsed.data
    });

    res.json({ success: true });
  } catch (error) {
    log.error({ error: error.message }, 'Track interaction failed');
    res.status(500).json({ success: false, error: 'Failed to track interaction' });
  }
});

router.get('/contextual', authenticateDID, async (req, res) => {
  try {
    const { limit, offset, topics } = req.query;

    const activeTopics = topics ? topics.toString().split(',') : [];
    
    const result = await feedService.generateContextualFeed(req.user.userId, {
      limit: limit ? parseInt(limit.toString()) : 20,
      offset: offset ? parseInt(offset.toString()) : 0,
      activeTopics
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    log.error({ error: error.message }, 'Contextual feed failed');
    res.status(500).json({ success: false, error: 'Failed to get contextual feed' });
  }
});

router.get('/similar/:conversationId', authenticateDID, async (req, res) => {
  try {
    const { limit } = req.query;

    const result = await feedService.getSimilarConversations(
      req.user.userId,
      req.params.conversationId,
      { limit: limit ? parseInt(limit.toString()) : 10 }
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get similar conversations failed');
    res.status(500).json({ success: false, error: 'Failed to get similar conversations' });
  }
});

router.get('/privacy', authenticateDID, async (req, res) => {
  try {
    const preferences = await feedService.getFeedPreferences(req.user.userId);
    const privacy = await feedService.enforcePrivacyBudget(req.user.userId, preferences);
    
    res.json({
      success: true,
      data: {
        privacyBudget: preferences.privacyBudget,
        settings: privacy
      }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get privacy settings failed');
    res.status(500).json({ success: false, error: 'Failed to get privacy settings' });
  }
});

export default router;

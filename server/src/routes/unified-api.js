/**
 * Unified Context-Feed API
 *
 * Single API endpoint that combines context and feed data
 * for seamless AI interactions with awareness of feed content.
 */

import { Router } from 'express';
import {
  feedContextIntegration,
  processFeedEngagement,
} from '../services/feed-context-integration.js';
import { generateContextualFeed } from '../services/feed-context-integration.js';
import { unifiedContextService } from '../services/unified-context-service.js';
import { acuMemoryPipeline } from '../services/acu-memory-pipeline.js';
import { authenticateDID } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();
const log = logger.child({ module: 'unified-api' });

router.get('/context/feed', authenticateDID, async (req, res) => {
  try {
    const { limit, offset, includeContext, includeMemories } = req.query;
    const { userId } = req.user;

    const result = await generateContextualFeed(userId, {
      limit: limit ? parseInt(limit.toString()) : 20,
      offset: offset ? parseInt(offset.toString()) : 0,
      includeContextBoost: includeContext !== 'false',
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    let memories = [];
    if (includeMemories === 'true') {
      const memoryStats = await acuMemoryPipeline.getConversionStats(userId);
      memories = memoryStats;
    }

    res.json({
      success: true,
      data: {
        feedItems: result.items,
        contextBoost: result.contextBoost,
        memories,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Context feed failed');
    res.status(500).json({ success: false, error: 'Failed to get context feed' });
  }
});

router.post('/engagement', authenticateDID, async (req, res) => {
  try {
    const { contentId, contentType, action, metadata } = req.body;
    const { userId } = req.user;

    const result = await processFeedEngagement({
      userId,
      contentId,
      contentType,
      action,
      metadata,
    });

    res.json(result);
  } catch (error) {
    log.error({ error: error.message }, 'Engagement tracking failed');
    res.status(500).json({ success: false, error: 'Failed to track engagement' });
  }
});

router.post('/context/refresh', authenticateDID, async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.body;

    const contextResult = await unifiedContextService.generateContextForChat(
      conversationId || 'new-chat',
      { userId, userMessage: '' }
    );

    res.json({
      success: true,
      data: {
        systemPrompt: contextResult.systemPrompt,
        stats: contextResult.stats,
        layers: contextResult.layers,
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Context refresh failed');
    res.status(500).json({ success: false, error: 'Failed to refresh context' });
  }
});

router.get('/context/state', authenticateDID, async (req, res) => {
  try {
    const { userId } = req.user;
    const state = await feedContextIntegration.getContextState(userId);

    res.json(state);
  } catch (error) {
    log.error({ error: error.message }, 'Get context state failed');
    res.status(500).json({ success: false, error: 'Failed to get context state' });
  }
});

router.post('/memory/convert', authenticateDID, async (req, res) => {
  try {
    const { acuId, category, importance, force } = req.body;
    const result = await acuMemoryPipeline.convertACUToMemory(acuId, {
      category,
      importance,
      force,
    });

    res.json(result);
  } catch (error) {
    log.error({ error: error.message }, 'Memory conversion failed');
    res.status(500).json({ success: false, error: 'Failed to convert to memory' });
  }
});

router.get('/memory/stats', authenticateDID, async (req, res) => {
  try {
    const { userId } = req.user;
    const stats = await acuMemoryPipeline.getConversionStats(userId);

    res.json({ success: true, data: stats });
  } catch (error) {
    log.error({ error: error.message }, 'Get memory stats failed');
    res.status(500).json({ success: false, error: 'Failed to get memory stats' });
  }
});

export default router;

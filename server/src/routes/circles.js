/**
 * Circle API Routes - Phase 2
 * Base: /api/v2/circles
 */

import { Router } from 'express';
import { z } from 'zod';
import { circleService } from '../services/circle-service.js';
import { authenticateDID } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();
const log = logger.child({ module: 'circle-routes' });

// ============================================================================
// Validation Schemas
// ============================================================================

const createCircleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  type: z.enum(['manual', 'smart', 'shared', 'ephemeral', 'interest', 'proximity', 'interaction']).default('manual'),
  visibility: z.enum(['secret', 'private', 'visible']).default('private'),
  smartRules: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional(),
  isShared: z.boolean().default(false),
  autoSuggest: z.boolean().default(true)
});

const updateCircleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  visibility: z.enum(['secret', 'private', 'visible']).optional(),
  autoSuggest: z.boolean().optional(),
  smartRules: z.record(z.any()).optional()
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'member', 'viewer']).default('member')
});

// ============================================================================
// Circle CRUD
// ============================================================================

router.post('/', authenticateDID, async (req, res) => {
  try {
    const parsed = createCircleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors
      });
    }

    const result = await circleService.createCircle(req.user.userId, parsed.data);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.status(201).json({
      success: true,
      data: result.circle
    });
  } catch (error) {
    log.error({ error: error.message }, 'Create circle failed');
    res.status(500).json({ success: false, error: 'Failed to create circle' });
  }
});

router.get('/', authenticateDID, async (req, res) => {
  try {
    const { type } = req.query;
    const result = await circleService.getUserCircles(req.user.userId, {
      type: type?.toString()
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result.circles
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get circles failed');
    res.status(500).json({ success: false, error: 'Failed to get circles' });
  }
});

router.get('/:circleId', authenticateDID, async (req, res) => {
  try {
    const result = await circleService.getCircle(
      req.params.circleId,
      req.user.userId
    );

    if (!result.success) {
      return res.status(result.error === 'Circle not found' ? 404 : 403).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.circle
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get circle failed');
    res.status(500).json({ success: false, error: 'Failed to get circle' });
  }
});

router.put('/:circleId', authenticateDID, async (req, res) => {
  try {
    const parsed = updateCircleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors
      });
    }

    const result = await circleService.updateCircle(
      req.params.circleId,
      req.user.userId,
      parsed.data
    );

    if (!result.success) {
      return res.status(403).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result.circle
    });
  } catch (error) {
    log.error({ error: error.message }, 'Update circle failed');
    res.status(500).json({ success: false, error: 'Failed to update circle' });
  }
});

router.delete('/:circleId', authenticateDID, async (req, res) => {
  try {
    const result = await circleService.deleteCircle(
      req.params.circleId,
      req.user.userId
    );

    if (!result.success) {
      return res.status(403).json({ success: false, error: result.error });
    }

    res.json({ success: true, message: 'Circle deleted' });
  } catch (error) {
    log.error({ error: error.message }, 'Delete circle failed');
    res.status(500).json({ success: false, error: 'Failed to delete circle' });
  }
});

// ============================================================================
// Member Management
// ============================================================================

router.post('/:circleId/members', authenticateDID, async (req, res) => {
  try {
    const parsed = addMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors
      });
    }

    const result = await circleService.addMember(
      req.params.circleId,
      req.user.userId,
      parsed.data.userId,
      parsed.data.role
    );

    if (!result.success) {
      return res.status(403).json({ success: false, error: result.error });
    }

    res.status(201).json({ success: true, message: 'Member added' });
  } catch (error) {
    log.error({ error: error.message }, 'Add member failed');
    res.status(500).json({ success: false, error: 'Failed to add member' });
  }
});

router.delete('/:circleId/members/:memberId', authenticateDID, async (req, res) => {
  try {
    const result = await circleService.removeMember(
      req.params.circleId,
      req.user.userId,
      req.params.memberId
    );

    if (!result.success) {
      return res.status(403).json({ success: false, error: result.error });
    }

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    log.error({ error: error.message }, 'Remove member failed');
    res.status(500).json({ success: false, error: 'Failed to remove member' });
  }
});

// ============================================================================
// Smart Circles
// ============================================================================

router.get('/:circleId/suggestions', authenticateDID, async (req, res) => {
  try {
    const result = await circleService.evaluateSmartCircle(req.params.circleId);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: {
        candidates: result.candidates,
        total: result.totalCandidates
      }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Smart circle evaluation failed');
    res.status(500).json({ success: false, error: 'Evaluation failed' });
  }
});

router.post('/:circleId/auto-populate', authenticateDID, async (req, res) => {
  try {
    const { maxAdditions = 10 } = req.body;
    
    const result = await circleService.autoPopulateSmartCircle(
      req.params.circleId,
      maxAdditions
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: { added: result.added }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Auto-populate failed');
    res.status(500).json({ success: false, error: 'Auto-populate failed' });
  }
});

// ============================================================================
// Circle Suggestions
// ============================================================================

router.get('/suggestions/all', authenticateDID, async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await circleService.getCircleSuggestions(req.user.userId, {
      limit: limit ? parseInt(limit.toString()) : 10
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result.suggestions
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get suggestions failed');
    res.status(500).json({ success: false, error: 'Failed to get suggestions' });
  }
});

router.post('/suggestions/generate', authenticateDID, async (req, res) => {
  try {
    const result = await circleService.generateCircleSuggestions(req.user.userId);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: { generated: result.count }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Generate suggestions failed');
    res.status(500).json({ success: false, error: 'Failed to generate suggestions' });
  }
});

// ============================================================================
// Activity Log
// ============================================================================

router.get('/:circleId/activity', authenticateDID, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const result = await circleService.getCircleActivity(
      req.params.circleId,
      {
        limit: limit ? parseInt(limit.toString()) : 50,
        offset: offset ? parseInt(offset.toString()) : 0
      }
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result.activities
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get activity failed');
    res.status(500).json({ success: false, error: 'Failed to get activity' });
  }
});

export default router;

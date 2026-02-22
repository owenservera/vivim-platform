import { Router } from 'express';
import { z } from 'zod';
import { moderationService } from '../services/moderation-service.js';
import { authenticateDID, requireModerator } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();
const log = logger.child({ module: 'moderation-routes' });

const flagSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['conversation', 'acu', 'memory', 'group_post', 'comment', 'profile']),
  contentOwnerId: z.string().optional(),
  contentText: z.string().optional(),
  reason: z.enum(['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'VIOLENCE', 'SEXUAL', 'DANGEROUS', 'MISINFORMATION', 'PRIVACY', 'COPYRIGHT', 'IMPERSONATION', 'SELF_HARM', 'UNDERAGE', 'OTHER']),
  description: z.string().optional()
});

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REMOVED', 'WARNED', 'BANNED']).optional(),
  resolution: z.string().optional(),
  action: z.enum(['none', 'remove', 'warn', 'ban']).optional(),
  notifyUser: z.boolean().optional()
});

const ruleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  conditionType: z.enum(['keyword', 'pattern', 'threshold', 'ai_score']),
  condition: z.object({}),
  action: z.enum(['flag', 'remove', 'warn', 'ban']),
  actionConfig: z.object({}).optional(),
  contentTypes: z.array(z.string()).optional(),
  appliesTo: z.enum(['all', 'public', 'private']).optional(),
  priority: z.number().optional(),
  maxStrikes: z.number().optional(),
  timeWindow: z.number().optional()
});

router.post('/flag', authenticateDID, async (req, res) => {
  try {
    const parsed = flagSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors
      });
    }

    const result = await moderationService.flagContent(req.user.userId, {
      ...parsed.data,
      contentOwnerId: parsed.data.contentOwnerId || req.user.userId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      data: { flagId: result.flagId }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Flag content failed');
    res.status(500).json({ success: false, error: 'Failed to flag content' });
  }
});

router.get('/flags', requireModerator, async (req, res) => {
  try {
    const { status, reason, priority, contentType, limit, offset } = req.query;
    
    const result = await moderationService.listFlags({
      status,
      reason,
      priority,
      contentType,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    log.error({ error: error.message }, 'List flags failed');
    res.status(500).json({ success: false, error: 'Failed to list flags' });
  }
});

router.get('/flags/:flagId', requireModerator, async (req, res) => {
  try {
    const prisma = (await import('../lib/database.js')).getPrismaClient();
    
    const flag = await prisma.contentFlag.findUnique({
      where: { id: req.params.flagId }
    });

    if (!flag) {
      return res.status(404).json({ success: false, error: 'Flag not found' });
    }

    res.json({
      success: true,
      data: flag
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get flag failed');
    res.status(500).json({ success: false, error: 'Failed to get flag' });
  }
});

router.post('/flags/:flagId/review', requireModerator, async (req, res) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors
      });
    }

    const result = await moderationService.reviewFlag(
      req.params.flagId,
      req.user.userId,
      parsed.data
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result.flag
    });
  } catch (error) {
    log.error({ error: error.message }, 'Review flag failed');
    res.status(500).json({ success: false, error: 'Failed to review flag' });
  }
});

router.post('/flags/:flagId/appeal', authenticateDID, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Appeal reason required'
      });
    }

    const result = await moderationService.appealDecision(
      req.params.flagId,
      req.user.userId,
      reason
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Appeal submitted successfully'
    });
  } catch (error) {
    log.error({ error: error.message }, 'Appeal flag failed');
    res.status(500).json({ success: false, error: 'Failed to appeal flag' });
  }
});

router.post('/rules', requireModerator, async (req, res) => {
  try {
    const parsed = ruleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors
      });
    }

    const result = await moderationService.createModerationRule({
      ...parsed.data,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      data: result.rule
    });
  } catch (error) {
    log.error({ error: error.message }, 'Create rule failed');
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

router.get('/rules', async (req, res) => {
  try {
    const rules = await moderationService.getActiveRules();
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get rules failed');
    res.status(500).json({ success: false, error: 'Failed to get rules' });
  }
});

router.get('/stats', requireModerator, async (req, res) => {
  try {
    const stats = await moderationService.getModerationStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get stats failed');
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

router.get('/user/:userId', requireModerator, async (req, res) => {
  try {
    const record = await moderationService.getUserModerationRecord(req.params.userId);
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get user record failed');
    res.status(500).json({ success: false, error: 'Failed to get user record' });
  }
});

router.post('/notes', requireModerator, async (req, res) => {
  try {
    const { targetType, targetId, content, isInternal, isPublic } = req.body;
    
    if (!targetType || !targetId || !content) {
      return res.status(400).json({
        success: false,
        error: 'targetType, targetId, and content are required'
      });
    }

    const result = await moderationService.addModeratorNote({
      targetType,
      targetId,
      content,
      moderatorId: req.user.userId,
      isInternal,
      isPublic
    });

    res.status(201).json({
      success: true,
      data: result.note
    });
  } catch (error) {
    log.error({ error: error.message }, 'Add note failed');
    res.status(500).json({ success: false, error: 'Failed to add note' });
  }
});

export default router;

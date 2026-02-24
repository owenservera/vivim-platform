/**
 * Sharing Policy API Routes - Phase 3
 * Base: /api/v2/sharing
 */

import { Router } from 'express';
import { z } from 'zod';
import { sharingPolicyService } from '../services/sharing-policy-service.js';
import { authenticateDID } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();
const log = logger.child({ module: 'sharing-routes' });

// ============================================================================
// Validation Schemas
// ============================================================================

const createPolicySchema = z.object({
  contentId: z.string(),
  contentType: z.string().default('conversation'),
  audience: z
    .object({
      circles: z.array(z.string()).optional(),
      specificUsers: z.array(z.string()).optional(),
      exceptions: z.array(z.string()).optional(),
      networkDepth: z.number().min(0).max(3).optional(),
      discoverable: z.boolean().optional(),
      searchable: z.boolean().optional(),
    })
    .optional(),
  permissions: z
    .object({
      canView: z.boolean().optional(),
      canViewMetadata: z.boolean().optional(),
      canReact: z.boolean().optional(),
      canComment: z.boolean().optional(),
      canShare: z.boolean().optional(),
      canQuote: z.boolean().optional(),
      canBookmark: z.boolean().optional(),
      canFork: z.boolean().optional(),
      canRemix: z.boolean().optional(),
      canAnnotate: z.boolean().optional(),
      reactionsVisibleTo: z.enum(['author', 'audience', 'public']).optional(),
      commentsVisibleTo: z.enum(['author', 'audience', 'public']).optional(),
    })
    .optional(),
  temporal: z
    .object({
      availableFrom: z.string().datetime().optional(),
      expiresAt: z.string().datetime().optional(),
      maxViews: z.number().optional(),
      maxViewsPerUser: z.number().optional(),
      phases: z
        .array(
          z.object({
            startTime: z.string().datetime(),
            endTime: z.string().datetime().optional(),
            audience: z.object({}).optional(),
            permissions: z.object({}).optional(),
          })
        )
        .optional(),
    })
    .optional(),
  geographic: z
    .object({
      allowedCountries: z.array(z.string()).optional(),
      blockedCountries: z.array(z.string()).optional(),
      requireVPN: z.boolean().optional(),
    })
    .optional(),
  contextual: z
    .object({
      timeOfDay: z
        .object({
          availableHours: z.array(
            z.object({
              start: z.string(),
              end: z.string(),
            })
          ),
          timezone: z.enum(['viewer', 'author']),
        })
        .optional(),
      deviceContext: z
        .object({
          requireBiometric: z.boolean().optional(),
          requireTrustedDevice: z.boolean().optional(),
          blockScreenshots: z.boolean().optional(),
        })
        .optional(),
      socialContext: z
        .object({
          requireMutualFollow: z.boolean().optional(),
          minAccountAge: z.number().optional(),
          minTrustScore: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  collaborative: z
    .object({
      decisionMode: z
        .enum(['unanimous', 'majority', 'creator_override', 'hierarchical'])
        .optional(),
    })
    .optional(),
});

const updatePolicySchema = createPolicySchema
  .partial()
  .omit({ contentId: true, contentType: true });

const accessGrantSchema = z.object({
  grantedTo: z.string(),
  grantedToType: z.enum(['user', 'circle', 'public']).default('user'),
  accessLevel: z.enum(['view', 'interact', 'full']).default('view'),
  permissions: z.object({}).optional(),
  expiresAt: z.string().datetime().optional(),
  maxViews: z.number().optional(),
});

// ============================================================================
// Policy CRUD
// ============================================================================

router.post('/policies', authenticateDID, async (req, res) => {
  try {
    const parsed = createPolicySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const result = await sharingPolicyService.createSharingPolicy(
      parsed.data.contentId,
      parsed.data.contentType,
      req.user.userId,
      parsed.data
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.status(201).json({
      success: true,
      data: result.policy,
    });
  } catch (error) {
    log.error({ error: error.message }, 'Create policy failed');
    res.status(500).json({ success: false, error: 'Failed to create policy' });
  }
});

router.get('/policies/:contentId', authenticateDID, async (req, res) => {
  try {
    const result = await sharingPolicyService.getSharingPolicy(req.params.contentId);

    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }

    // Check if user has access to view policy
    const access = await sharingPolicyService.checkAccess(
      req.params.contentId,
      req.user.userId,
      'canView'
    );

    if (!access.granted && result.policy.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: result.policy,
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get policy failed');
    res.status(500).json({ success: false, error: 'Failed to get policy' });
  }
});

router.put('/policies/:contentId', authenticateDID, async (req, res) => {
  try {
    const parsed = updatePolicySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const result = await sharingPolicyService.updateSharingPolicy(
      req.params.contentId,
      req.user.userId,
      parsed.data
    );

    if (!result.success) {
      return res.status(403).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result.policy,
    });
  } catch (error) {
    log.error({ error: error.message }, 'Update policy failed');
    res.status(500).json({ success: false, error: 'Failed to update policy' });
  }
});

router.delete('/policies/:contentId', authenticateDID, async (req, res) => {
  try {
    const result = await sharingPolicyService.deleteSharingPolicy(
      req.params.contentId,
      req.user.userId
    );

    if (!result.success) {
      return res.status(403).json({ success: false, error: result.error });
    }

    res.json({ success: true, message: 'Policy deleted' });
  } catch (error) {
    log.error({ error: error.message }, 'Delete policy failed');
    res.status(500).json({ success: false, error: 'Failed to delete policy' });
  }
});

// ============================================================================
// Access Control
// ============================================================================

router.post('/check-access', authenticateDID, async (req, res) => {
  try {
    const { contentId, permission } = req.body;

    const result = await sharingPolicyService.checkAccess(
      contentId,
      req.user.userId,
      permission || 'canView',
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        deviceId: req.user.deviceId,
      }
    );

    // Log the access check
    await sharingPolicyService.logContentAccess(
      contentId,
      req.user.userId,
      permission || 'canView',
      result.granted,
      {
        denialReason: result.reason,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        deviceId: req.user.deviceId,
      }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    log.error({ error: error.message }, 'Check access failed');
    res.status(500).json({ success: false, error: 'Failed to check access' });
  }
});

// ============================================================================
// Collaborative Privacy
// ============================================================================

router.post('/policies/:contentId/stakeholders', authenticateDID, async (req, res) => {
  try {
    const { userId, role, contribution, privacySettings } = req.body;

    const policyResult = await sharingPolicyService.getSharingPolicy(req.params.contentId);
    if (!policyResult.success) {
      return res.status(404).json({ success: false, error: 'Policy not found' });
    }

    // Only owner can add stakeholders
    if (policyResult.policy.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Only owner can add stakeholders' });
    }

    const result = await sharingPolicyService.addStakeholder(
      policyResult.policy.id,
      userId,
      role,
      contribution,
      privacySettings
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.status(201).json({
      success: true,
      data: result.stakeholder,
    });
  } catch (error) {
    log.error({ error: error.message }, 'Add stakeholder failed');
    res.status(500).json({ success: false, error: 'Failed to add stakeholder' });
  }
});

router.post('/policies/:contentId/resolve-conflict', authenticateDID, async (req, res) => {
  try {
    const { proposedChanges, votes } = req.body;

    const result = await sharingPolicyService.resolvePrivacyConflict(
      req.params.contentId,
      proposedChanges,
      votes
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    log.error({ error: error.message }, 'Conflict resolution failed');
    res.status(500).json({ success: false, error: 'Failed to resolve conflict' });
  }
});

// ============================================================================
// Access Grants
// ============================================================================

router.post('/policies/:contentId/grants', authenticateDID, async (req, res) => {
  try {
    const parsed = accessGrantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const policyResult = await sharingPolicyService.getSharingPolicy(req.params.contentId);
    if (!policyResult.success) {
      return res.status(404).json({ success: false, error: 'Policy not found' });
    }

    const result = await sharingPolicyService.createAccessGrant(
      policyResult.policy.id,
      req.user.userId,
      parsed.data.grantedTo,
      parsed.data
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.status(201).json({
      success: true,
      data: result.grant,
    });
  } catch (error) {
    log.error({ error: error.message }, 'Create grant failed');
    res.status(500).json({ success: false, error: 'Failed to create grant' });
  }
});

router.delete('/grants/:grantId', authenticateDID, async (req, res) => {
  try {
    const result = await sharingPolicyService.revokeAccessGrant(req.params.grantId);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, message: 'Grant revoked' });
  } catch (error) {
    log.error({ error: error.message }, 'Revoke grant failed');
    res.status(500).json({ success: false, error: 'Failed to revoke grant' });
  }
});

// ============================================================================
// Access Logging
// ============================================================================

router.get('/policies/:contentId/access-log', authenticateDID, async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const policyResult = await sharingPolicyService.getSharingPolicy(req.params.contentId);
    if (!policyResult.success) {
      return res.status(404).json({ success: false, error: 'Policy not found' });
    }

    // Only owner can view access log
    if (policyResult.policy.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const result = await sharingPolicyService.getContentAccessLog(req.params.contentId, {
      limit: limit ? parseInt(limit.toString()) : 100,
      offset: offset ? parseInt(offset.toString()) : 0,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result.logs,
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get access log failed');
    res.status(500).json({ success: false, error: 'Failed to get access log' });
  }
});

// ============================================================================
// SHARING INTENT API
// ============================================================================

import { sharingIntentService } from '../services/sharing-intent-service.js';

router.post('/intents', authenticateDID, async (req, res) => {
  try {
    const { did } = req.user;
    const intent = await sharingIntentService.createSharingIntent({
      actorDid: did,
      ownerDid: did,
      ...req.body,
    });

    res.json({ success: true, data: intent });
  } catch (error) {
    log.error({ error: error.message }, 'Create intent failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/intents', authenticateDID, async (req, res) => {
  try {
    const { did } = req.user;
    const { status, contentType, audienceType, limit, offset } = req.query;

    const intents = await sharingIntentService.getIntentsByOwner(did, {
      status,
      contentType,
      audienceType,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    res.json({ success: true, data: intents });
  } catch (error) {
    log.error({ error: error.message }, 'Get intents failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/intents/:intentId', authenticateDID, async (req, res) => {
  try {
    const intent = await sharingIntentService.getSharingIntent(req.params.intentId);
    if (!intent) {
      return res.status(404).json({ success: false, error: 'Intent not found' });
    }
    res.json({ success: true, data: intent });
  } catch (error) {
    log.error({ error: error.message }, 'Get intent failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/intents/:intentId', authenticateDID, async (req, res) => {
  try {
    const intent = await sharingIntentService.updateSharingIntent(req.params.intentId, req.body);
    res.json({ success: true, data: intent });
  } catch (error) {
    log.error({ error: error.message }, 'Update intent failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/intents/:intentId/publish', authenticateDID, async (req, res) => {
  try {
    const intent = await sharingIntentService.publishSharingIntent(req.params.intentId);
    res.json({ success: true, data: intent });
  } catch (error) {
    log.error({ error: error.message }, 'Publish intent failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/intents/:intentId/revoke', authenticateDID, async (req, res) => {
  try {
    const { reason } = req.body;
    const intent = await sharingIntentService.revokeSharingIntent(req.params.intentId, reason);
    res.json({ success: true, data: intent });
  } catch (error) {
    log.error({ error: error.message }, 'Revoke intent failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SHARE LINKS API
// ============================================================================

router.post('/links', authenticateDID, async (req, res) => {
  try {
    const { did } = req.user;
    const { intentId, maxUses, expiresAt, password } = req.body;

    const shareLink = await sharingIntentService.createShareLink(intentId, {
      maxUses,
      expiresAt,
      password,
      createdByDid: did,
    });

    const url = `/share/${shareLink.linkCode}`;
    res.json({ success: true, data: { link: shareLink, url } });
  } catch (error) {
    log.error({ error: error.message }, 'Create share link failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/links/:linkCode', async (req, res) => {
  try {
    const shareLink = await sharingIntentService.getShareLink(req.params.linkCode);
    if (!shareLink) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    res.json({ success: true, data: shareLink });
  } catch (error) {
    log.error({ error: error.message }, 'Get share link failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/links/:linkCode/access', async (req, res) => {
  try {
    const { password } = req.body;
    const accessorDid = req.body.did || null;

    const intent = await sharingIntentService.accessShareLink(req.params.linkCode, {
      password,
      accessorDid,
    });

    res.json({ success: true, data: intent });
  } catch (error) {
    log.error({ error: error.message }, 'Access share link failed');
    res.status(403).json({ success: false, error: error.message });
  }
});

import { sharingAnalyticsService } from '../services/sharing-analytics-service.js';

router.get('/analytics/metrics', authenticateDID, async (req, res) => {
  try {
    const { did } = req.user;
    const { startDate, endDate } = req.query;

    const metrics = await sharingAnalyticsService.getUserSharingMetrics(did, {
      startDate,
      endDate,
    });

    res.json({ success: true, data: metrics });
  } catch (error) {
    log.error({ error: error.message }, 'Get metrics failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/activity', authenticateDID, async (req, res) => {
  try {
    const { did } = req.user;
    const { limit, eventTypes, startDate, endDate } = req.query;

    const activity = await sharingAnalyticsService.getUserActivity(did, {
      limit: parseInt(limit) || 50,
      eventTypes: eventTypes?.split(','),
      startDate,
      endDate,
    });

    res.json({ success: true, data: activity });
  } catch (error) {
    log.error({ error: error.message }, 'Get activity failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/insights', authenticateDID, async (req, res) => {
  try {
    const { did } = req.user;
    const { unreadOnly } = req.query;

    const insights = await sharingAnalyticsService.getInsights(did, {
      unreadOnly: unreadOnly === 'true',
    });

    res.json({ success: true, data: insights });
  } catch (error) {
    log.error({ error: error.message }, 'Get insights failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/insights/:insightId/read', authenticateDID, async (req, res) => {
  try {
    const insight = await sharingAnalyticsService.markInsightRead(req.params.insightId);
    res.json({ success: true, data: insight });
  } catch (error) {
    log.error({ error: error.message }, 'Mark insight read failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/insights/:insightId/dismiss', authenticateDID, async (req, res) => {
  try {
    const insight = await sharingAnalyticsService.dismissInsight(req.params.insightId);
    res.json({ success: true, data: insight });
  } catch (error) {
    log.error({ error: error.message }, 'Dismiss insight failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

/**
 * Account Management Routes
 * 
 * User account lifecycle:
 * - GET /me - Get account info
 * - DELETE /me - Request account deletion
 * - POST /me/undelete - Cancel deletion
 * - POST /me/suspend - Self-suspend (not implemented)
 */

import { Router } from 'express';
import { accountLifecycle } from '../services/account-lifecycle-service.js';
import { portabilityService } from '../services/portability-service.js';
import { logger } from '../lib/logger.js';

const router = Router();
const log = logger.child({ module: 'account-routes' });

router.get('/me', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await accountLifecycle.getAccountInfo(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        did: user.did,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        verificationLevel: user.verificationLevel,
        trustScore: user.trustScore,
        createdAt: user.createdAt,
        lastSeenAt: user.lastSeenAt,
        pendingDeletion: user.status === 'DELETING',
        deletionDate: user.deletedAt
      }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get account info failed');
    res.status(500).json({ success: false, error: 'Failed to get account info' });
  }
});

router.delete('/me', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { immediate, exportData } = req.body;
    let exportResult = null;

    if (exportData) {
      exportResult = await portabilityService.requestExport(req.user.userId, {
        exportType: 'full',
        formats: ['json']
      });
    }

    const result = await accountLifecycle.requestAccountDeletion(req.user.userId, {
      immediate: immediate === true
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: {
        scheduledDeletion: result.scheduledDeletion,
        gracePeriodDays: result.gracePeriodDays,
        exportId: exportResult?.exportId
      }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Account deletion request failed');
    res.status(500).json({ success: false, error: 'Failed to request deletion' });
  }
});

router.post('/me/undelete', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const result = await accountLifecycle.cancelAccountDeletion(req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({ success: true });
  } catch (error) {
    log.error({ error: error.message }, 'Cancel deletion failed');
    res.status(500).json({ success: false, error: 'Failed to cancel deletion' });
  }
});

router.get('/me/data/export', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const result = await portabilityService.requestExport(req.user.userId, {
      exportType: 'full',
      formats: ['json']
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(202).json({
      success: true,
      data: {
        exportId: result.exportId,
        status: result.status,
        estimatedTime: result.estimatedTime
      }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Data export failed');
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

export default router;

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
import { apiKeyService } from '../services/api-key-service.js';
import { mfaService } from '../services/mfa-service.js';
import { logger } from '../lib/logger.js';
import { requireAuth } from '../middleware/unified-auth.js';

const router = Router();
const log = logger.child({ module: 'account-routes' });

router.use(requireAuth);

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
        deletionDate: user.deletedAt,
      },
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
        formats: ['json'],
      });
    }

    const result = await accountLifecycle.requestAccountDeletion(req.user.userId, {
      immediate: immediate === true,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: {
        scheduledDeletion: result.scheduledDeletion,
        gracePeriodDays: result.gracePeriodDays,
        exportId: exportResult?.exportId,
      },
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
      formats: ['json'],
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(202).json({
      success: true,
      data: {
        exportId: result.exportId,
        status: result.status,
        estimatedTime: result.estimatedTime,
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Data export failed');
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

// --- API Keys Management ---

router.get('/me/api-keys', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const keys = await apiKeyService.listApiKeys(req.user.userId);
    res.json({ success: true, apiKeys: keys });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to list API keys');
    res.status(500).json({ success: false, error: 'Failed to list API keys' });
  }
});

router.post('/me/api-keys', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { name, expiresInDays } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid name for API key' });
    }

    let expiresAt = null;
    if (expiresInDays && !isNaN(parseInt(expiresInDays))) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
    }

    const { key, apiKey } = await apiKeyService.createApiKey(req.user.userId, name, expiresAt);

    // Return the raw key ONLY once on creation
    res.json({
      success: true,
      apiKey: {
        ...apiKey,
        key,
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to create API key');
    res.status(500).json({ success: false, error: 'Failed to create API key' });
  }
});

router.delete('/me/api-keys/:keyId', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { keyId } = req.params;
    const revoked = await apiKeyService.revokeApiKey(req.user.userId, keyId);

    if (revoked) {
      res.json({ success: true, message: 'API key revoked' });
    } else {
      res.status(404).json({ success: false, error: 'API key not found' });
    }
  } catch (error) {
    log.error({ error: error.message }, 'Failed to revoke API key');
    res.status(500).json({ success: false, error: 'Failed to revoke API key' });
  }
});

// --- MFA Management ---

router.post('/me/mfa/setup', async (req, res) => {
  try {
    if (!req.user?.userId || !req.user?.email) {
      return res.status(401).json({ success: false, error: 'Not authenticated or missing email' });
    }

    const { secret, qrCodeUrl } = await mfaService.generateMfaSecret(req.user.email);
    res.json({ success: true, secret, qrCodeUrl });
  } catch (error) {
    log.error({ error: error.message, stack: error.stack }, 'Failed to setup MFA');
    res.status(500).json({ success: false, error: 'Failed to setup MFA', detail: error.message });
  }
});

router.post('/me/mfa/enable', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { secret, token } = req.body;
    if (!secret || !token) {
      return res.status(400).json({ success: false, error: 'Missing secret or token' });
    }

    const result = await mfaService.enableMfa(req.user.userId, secret, token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    log.error({ error: error.message }, 'Failed to enable MFA');
    res.status(500).json({ success: false, error: 'Failed to enable MFA' });
  }
});

router.post('/me/mfa/disable', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing token' });
    }

    const result = await mfaService.disableMfa(req.user.userId, token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    log.error({ error: error.message }, 'Failed to disable MFA');
    res.status(500).json({ success: false, error: 'Failed to disable MFA' });
  }
});

export default router;

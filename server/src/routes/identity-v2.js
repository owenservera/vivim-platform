/**
 * Identity API Routes v2
 *
 * Complete REST API for identity management
 * Base: /api/v2/identity
 */

import { Router } from 'express';
import { z } from 'zod';
import { identityService } from '../services/identity-service.js';
import { authenticateDID, optionalAuth, requireVerification } from '../middleware/auth.js';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { debugReporter } from '../services/debug-reporter.js';

const router = Router();
const log = logger.child({ module: 'identity-routes-v2' });

// ============================================================================
// Validation Schemas
// ============================================================================

const registerUserSchema = z.object({
  did: z.string().startsWith('did:key:z'),
  publicKey: z.string(),
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});

const registerDeviceSchema = z.object({
  masterDID: z.string().startsWith('did:key:z'),
  deviceId: z.string().uuid(),
  deviceDID: z.string().startsWith('did:key:z'),
  name: z.string().min(1).max(100),
  platform: z.enum(['web', 'ios', 'android', 'desktop']),
  publicKey: z.string(),
  capabilities: z.object({
    canSign: z.boolean(),
    canEncrypt: z.boolean(),
    hasBiometrics: z.boolean(),
    hasSecureEnclave: z.boolean(),
  }),
  delegationProof: z.string(),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
});

const completeVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const verifyPhoneSchema = z.object({
  phoneNumber: z.string().min(6).max(15),
  countryCode: z.string().length(2),
});

// ============================================================================
// User Registration & Profile
// ============================================================================

/**
 * POST /api/v2/identity/users/register
 * Register a new user with DID
 */
router.post('/users/register', async (req, res) => {
  try {
    const parsed = registerUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const result = await identityService.registerUser(
      parsed.data.did,
      parsed.data.publicKey,
      parsed.data.handle,
      {
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        avatarUrl: parsed.data.avatarUrl,
      }
    );

    if (!result.success) {
      return res.status(409).json({
        success: false,
        error: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        userId: result.user.id,
        did: result.user.did,
        handle: result.user.handle,
        verificationLevel: result.user.verificationLevel,
        createdAt: result.user.createdAt,
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'User registration failed');
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

/**
 * GET /api/v2/identity/users/:did
 * Get user profile by DID
 */
router.get('/users/:did', optionalAuth, async (req, res) => {
  try {
    const { did } = req.params;

    if (!identityService.validateDID(did)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid DID format',
      });
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { did },
      select: {
        id: true,
        did: true,
        handle: true,
        displayName: true,
        avatarUrl: true,
        verificationLevel: true,
        verificationBadges: true,
        trustScore: true,
        createdAt: true,
        // Only show email/phone to self
        ...(req.user?.did === did && {
          email: true,
          emailVerified: true,
          phoneNumber: true,
          phoneVerified: true,
        }),
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Log access
    await identityService.logAccess(
      req.user?.did || 'anonymous',
      user.id,
      'profile',
      'view',
      true,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    log.error({ did: req.params.did, error: error.message }, 'Get user failed');
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

/**
 * PUT /api/v2/identity/users/:did
 * Update user profile (requires auth)
 */
router.put('/users/:did', authenticateDID, async (req, res) => {
  try {
    const { did } = req.params;

    // Can only update own profile
    if (req.user.did !== did) {
      return res.status(403).json({
        success: false,
        error: 'Can only update your own profile',
      });
    }

    const updateSchema = z.object({
      displayName: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().url().optional(),
      privacyPreferences: z.record(z.any()).optional(),
    });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.update({
      where: { did },
      data: parsed.data,
    });

    res.json({
      success: true,
      data: {
        did: user.did,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    log.error({ did: req.params.did, error: error.message }, 'Update user failed');
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// ============================================================================
// Device Management
// ============================================================================

/**
 * POST /api/v2/identity/devices
 * Register a new device
 */
router.post('/devices', async (req, res) => {
  try {
    const parsed = registerDeviceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const result = await identityService.registerDevice(parsed.data.masterDID, parsed.data);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        deviceId: result.device.deviceId,
        name: result.device.deviceName,
        platform: result.device.platform,
        registeredAt: result.device.createdAt,
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Device registration failed');
    res.status(500).json({
      success: false,
      error: 'Device registration failed',
    });
  }
});

/**
 * GET /api/v2/identity/devices
 * Get user's devices (requires auth)
 */
router.get('/devices', authenticateDID, async (req, res) => {
  try {
    const devices = await identityService.getUserDevices(req.user.userId);

    res.json({
      success: true,
      data: devices.map((d) => ({
        deviceId: d.deviceId,
        name: d.deviceName,
        platform: d.platform,
        isActive: d.isActive,
        isTrusted: d.isTrusted,
        lastSeenAt: d.lastSeenAt,
        capabilities: d.metadata?.capabilities,
      })),
    });
  } catch (error) {
    log.error({ userId: req.user.userId, error: error.message }, 'Get devices failed');
    res.status(500).json({
      success: false,
      error: 'Failed to get devices',
    });
  }
});

/**
 * DELETE /api/v2/identity/devices/:deviceId
 * Revoke a device (requires auth)
 */
router.delete('/devices/:deviceId', authenticateDID, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { reason } = req.body;

    const success = await identityService.revokeDevice(req.user.userId, deviceId, reason);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    res.json({
      success: true,
      message: 'Device revoked successfully',
    });
  } catch (error) {
    log.error({ deviceId: req.params.deviceId, error: error.message }, 'Revoke device failed');
    res.status(500).json({
      success: false,
      error: 'Failed to revoke device',
    });
  }
});

// ============================================================================
// Verification Flows
// ============================================================================

/**
 * POST /api/v2/identity/verify/email
 * Initiate email verification
 */
router.post('/verify/email', authenticateDID, async (req, res) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const result = await identityService.initiateEmailVerification(
      req.user.userId,
      parsed.data.email
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent',
      // Only return code in development
      ...(process.env.NODE_ENV === 'development' && { code: result.code }),
    });
  } catch (error) {
    debugReporter.trackError(error, {
      operation: 'initiateEmailVerification',
      userId: req.user?.userId,
    });
    log.error(
      { userId: req.user.userId, error: error.message },
      'Email verification initiation failed'
    );
    res.status(500).json({
      success: false,
      error: 'Failed to initiate verification',
    });
  }
});

/**
 * POST /api/v2/identity/verify/email/complete
 * Complete email verification
 */
router.post('/verify/email/complete', authenticateDID, async (req, res) => {
  try {
    const parsed = completeVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const success = await identityService.completeEmailVerification(
      req.user.userId,
      parsed.data.email,
      parsed.data.code
    );

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired code',
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    log.error(
      { userId: req.user.userId, error: error.message },
      'Email verification completion failed'
    );
    res.status(500).json({
      success: false,
      error: 'Failed to complete verification',
    });
  }
});

/**
 * POST /api/v2/identity/verify/phone
 * Initiate phone verification
 */
router.post('/verify/phone', authenticateDID, async (req, res) => {
  try {
    const parsed = verifyPhoneSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const result = await identityService.initiatePhoneVerification(
      req.user.userId,
      `${parsed.data.countryCode}${parsed.data.phoneNumber}`
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Verification SMS sent',
      ...(process.env.NODE_ENV === 'development' && { code: result.code }),
    });
  } catch (error) {
    log.error(
      { userId: req.user.userId, error: error.message },
      'Phone verification initiation failed'
    );
    res.status(500).json({
      success: false,
      error: 'Failed to initiate verification',
    });
  }
});

// ============================================================================
// Transparency & Audit
// ============================================================================

/**
 * GET /api/v2/identity/transparency/access-log
 * Get access audit log for authenticated user
 */
router.get('/transparency/access-log', authenticateDID, async (req, res) => {
  try {
    const { targetType, action, limit = 100, offset = 0 } = req.query;

    const logs = await identityService.getAccessAuditLog(req.user.userId, {
      targetType: targetType?.toString(),
      action: action?.toString(),
      limit: parseInt(limit.toString()),
      offset: parseInt(offset.toString()),
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        limit: parseInt(limit.toString()),
        offset: parseInt(offset.toString()),
        total: logs.length,
      },
    });
  } catch (error) {
    log.error({ userId: req.user.userId, error: error.message }, 'Get access log failed');
    res.status(500).json({
      success: false,
      error: 'Failed to get access log',
    });
  }
});

/**
 * GET /api/v2/identity/consents
 * Get user's consent records
 */
router.get('/consents', authenticateDID, async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const consents = await prisma.consentRecord.findMany({
      where: {
        userId: req.user.userId,
        status: 'active',
      },
      orderBy: { grantedAt: 'desc' },
    });

    res.json({
      success: true,
      data: consents,
    });
  } catch (error) {
    log.error({ userId: req.user.userId, error: error.message }, 'Get consents failed');
    res.status(500).json({
      success: false,
      error: 'Failed to get consents',
    });
  }
});

/**
 * POST /api/v2/identity/consents
 * Record user consent
 */
router.post('/consents', authenticateDID, async (req, res) => {
  try {
    const consentSchema = z.object({
      purpose: z.string(),
      allowed: z.boolean(),
      dataTypes: z.array(z.string()).optional(),
      conditions: z.record(z.any()).optional(),
      expiresAt: z.string().datetime().optional(),
    });

    const parsed = consentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const consent = await identityService.recordConsent(
      req.user.userId,
      parsed.data.purpose,
      parsed.data.allowed,
      {
        dataTypes: parsed.data.dataTypes,
        conditions: parsed.data.conditions,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      }
    );

    res.status(201).json({
      success: true,
      data: consent,
    });
  } catch (error) {
    log.error({ userId: req.user.userId, error: error.message }, 'Record consent failed');
    res.status(500).json({
      success: false,
      error: 'Failed to record consent',
    });
  }
});

/**
 * DELETE /api/v2/identity/consents/:consentId
 * Revoke consent
 */
router.delete('/consents/:consentId', authenticateDID, async (req, res) => {
  try {
    const { consentId } = req.params;
    const prisma = getPrismaClient();

    const consent = await prisma.consentRecord.findFirst({
      where: {
        id: consentId,
        userId: req.user.userId,
      },
    });

    if (!consent) {
      return res.status(404).json({
        success: false,
        error: 'Consent not found',
      });
    }

    await prisma.consentRecord.update({
      where: { id: consentId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Consent revoked',
    });
  } catch (error) {
    log.error({ consentId: req.params.consentId, error: error.message }, 'Revoke consent failed');
    res.status(500).json({
      success: false,
      error: 'Failed to revoke consent',
    });
  }
});

// ============================================================================
// DID Resolution (Public)
// ============================================================================

/**
 * GET /api/v2/identity/did/:did
 * Resolve a DID to its document (public endpoint)
 */
router.get('/did/:did', async (req, res) => {
  try {
    const { did } = req.params;

    const didDocument = await identityService.resolveDID(did);

    if (!didDocument) {
      return res.status(404).json({
        success: false,
        error: 'DID not found or invalid',
      });
    }

    res.json({
      success: true,
      data: didDocument,
    });
  } catch (error) {
    log.error({ did: req.params.did, error: error.message }, 'DID resolution failed');
    res.status(500).json({
      success: false,
      error: 'Failed to resolve DID',
    });
  }
});

export default router;

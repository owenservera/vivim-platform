/**
 * Identity API Routes
 *
 * Backend endpoints for secure P2P identity management:
 * - Device registration and sync
 * - KYC verification integrations
 * - Identity relay (for device-to-device messaging)
 * - Verification credential issuance
 */

import express from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { getPrismaClient } from '../lib/database.js';
import logger from '../lib/logger.js';

const router = express.Router();
const log = logger.child({ module: 'identity' });

// ============================================================================
// Schemas
// ============================================================================

const registerDeviceSchema = z.object({
  masterDID: z.string().startsWith('did:'),
  deviceId: z.string().uuid(),
  deviceDID: z.string().startsWith('did:'),
  name: z.string().min(1).max(100),
  platform: z.enum(['web', 'ios', 'android', 'desktop']),
  publicKey: z.string(),
  delegationProof: z.string(),
  capabilities: z.object({
    canSign: z.boolean(),
    canEncrypt: z.boolean(),
    hasBiometrics: z.boolean(),
    hasSecureEnclave: z.boolean(),
  }),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  did: z.string().startsWith('did:'),
});

const completeEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  did: z.string().startsWith('did:'),
});

const verifyPhoneSchema = z.object({
  phoneNumber: z.string().min(6).max(15),
  countryCode: z.string().length(2),
  did: z.string().startsWith('did:'),
});

// ============================================================================
// In-memory stores (production would use database)
// ============================================================================

const verificationCodes = new Map(); // email/phone -> { code, did, expiresAt }
const registeredDevices = new Map(); // masterDID -> Device[]
const issuedCredentials = new Map(); // did -> Credential[]

// ============================================================================
// Device Management Endpoints
// ============================================================================

/**
 * POST /api/v1/identity/devices/register
 * Register a new device for a DID
 */
router.post('/devices/register', async (req, res) => {
  try {
    const body = registerDeviceSchema.parse(req.body);

    // Verify delegation proof
    // In production: Actually verify the signature
    const isValidDelegation = body.delegationProof.length > 0;
    if (!isValidDelegation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delegation proof',
      });
    }

    // Store device registration
    const devices = registeredDevices.get(body.masterDID) || [];
    devices.push({
      ...body,
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'active',
    });
    registeredDevices.set(body.masterDID, devices);

    log.info({ masterDID: body.masterDID, deviceId: body.deviceId }, 'Device registered');

    res.json({
      success: true,
      data: {
        deviceId: body.deviceId,
        registeredAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    log.error({ error }, 'Device registration failed');
    res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors.map((e) => e.message).join(', ')
          : 'Registration failed',
    });
  }
});

/**
 * GET /api/v1/identity/devices
 * Get all devices for authenticated DID
 */
router.get('/devices', async (req, res) => {
  try {
    const did = req.headers['x-did'];
    if (!did) {
      return res.status(401).json({
        success: false,
        error: 'DID required in X-DID header',
      });
    }

    const devices = registeredDevices.get(did) || [];

    res.json({
      success: true,
      data: devices.map((d) => ({
        deviceId: d.deviceId,
        name: d.name,
        platform: d.platform,
        registeredAt: d.registeredAt,
        lastActiveAt: d.lastActiveAt,
        status: d.status,
      })),
    });
  } catch (error) {
    log.error({ error }, 'Get devices failed');
    res.status(500).json({ success: false, error: 'Failed to get devices' });
  }
});

/**
 * DELETE /api/v1/identity/devices/:deviceId
 * Revoke a device
 */
router.delete('/devices/:deviceId', async (req, res) => {
  try {
    const did = req.headers['x-did'];
    const { deviceId } = req.params;

    if (!did) {
      return res.status(401).json({
        success: false,
        error: 'DID required in X-DID header',
      });
    }

    const devices = registeredDevices.get(did) || [];
    const device = devices.find((d) => d.deviceId === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    device.status = 'revoked';
    log.info({ did, deviceId }, 'Device revoked');

    res.json({
      success: true,
      message: 'Device revoked',
    });
  } catch (error) {
    log.error({ error }, 'Device revocation failed');
    res.status(500).json({ success: false, error: 'Revocation failed' });
  }
});

// ============================================================================
// Email Verification Endpoints
// ============================================================================

/**
 * POST /api/v1/identity/verify/email/start
 * Start email verification
 */
router.post('/verify/email/start', async (req, res) => {
  try {
    const { email, did } = verifyEmailSchema.parse(req.body);

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Store with 10 minute expiry
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    verificationCodes.set(emailHash, {
      code,
      did,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // In production: Send actual email via SendGrid, AWS SES, etc.
    log.info({ emailHash: emailHash.slice(0, 16), did }, 'Email verification started');

    // For development: Log the code
    if (process.env.NODE_ENV !== 'production') {
      log.debug({ code }, 'Verification code (dev only)');
    }

    res.json({
      success: true,
      message: 'Verification code sent',
      expiresIn: 600, // seconds
    });
  } catch (error) {
    log.error({ error }, 'Email verification start failed');
    res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors.map((e) => e.message).join(', ')
          : 'Failed to start verification',
    });
  }
});

/**
 * POST /api/v1/identity/verify/email/complete
 * Complete email verification
 */
router.post('/verify/email/complete', async (req, res) => {
  try {
    const { email, code, did } = completeEmailSchema.parse(req.body);

    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const stored = verificationCodes.get(emailHash);

    if (!stored) {
      return res.status(400).json({
        success: false,
        error: 'No verification pending for this email',
      });
    }

    if (stored.expiresAt < Date.now()) {
      verificationCodes.delete(emailHash);
      return res.status(400).json({
        success: false,
        error: 'Verification code expired',
      });
    }

    if (stored.code !== code) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
      });
    }

    if (stored.did !== did) {
      return res.status(400).json({
        success: false,
        error: 'DID mismatch',
      });
    }

    // Clean up
    verificationCodes.delete(emailHash);

    // Issue credential
    const credential = {
      id: crypto.randomUUID(),
      type: 'email',
      tier: 1,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      proof: emailHash,
      nullifier: crypto.createHash('sha256').update(`email:${emailHash}:verified`).digest('hex'),
      issuerDID: 'did:key:openscroll-server',
      issuerName: 'OpenScroll Verification Service',
      status: 'valid',
    };

    // Store credential
    const credentials = issuedCredentials.get(did) || [];
    credentials.push(credential);
    issuedCredentials.set(did, credentials);

    log.info({ did, credentialId: credential.id }, 'Email verification completed');

    res.json({
      success: true,
      credential,
    });
  } catch (error) {
    log.error({ error }, 'Email verification complete failed');
    res.status(400).json({
      success: false,
      error: 'Verification failed',
    });
  }
});

// ============================================================================
// Phone Verification Endpoints
// ============================================================================

/**
 * POST /api/v1/identity/verify/phone/start
 * Start phone verification
 */
router.post('/verify/phone/start', async (req, res) => {
  try {
    const { phoneNumber, countryCode, did } = verifyPhoneSchema.parse(req.body);

    const fullNumber = `+${countryCode}${phoneNumber.replace(/\D/g, '')}`;
    const code = crypto.randomInt(100000, 999999).toString();

    const phoneHash = crypto.createHash('sha256').update(fullNumber).digest('hex');
    verificationCodes.set(phoneHash, {
      code,
      did,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes for SMS
    });

    // In production: Send SMS via Twilio, AWS SNS, etc.
    log.info({ phoneHash: phoneHash.slice(0, 16), did }, 'Phone verification started');

    if (process.env.NODE_ENV !== 'production') {
      log.debug({ code }, 'SMS code (dev only)');
    }

    res.json({
      success: true,
      message: 'SMS code sent',
      expiresIn: 300,
    });
  } catch (error) {
    log.error({ error }, 'Phone verification start failed');
    res.status(400).json({
      success: false,
      error: 'Failed to start phone verification',
    });
  }
});

// ============================================================================
// Credential Endpoints
// ============================================================================

/**
 * GET /api/v1/identity/credentials
 * Get all credentials for a DID
 */
router.get('/credentials', async (req, res) => {
  try {
    const did = req.headers['x-did'];
    if (!did) {
      return res.status(401).json({
        success: false,
        error: 'DID required in X-DID header',
      });
    }

    const credentials = issuedCredentials.get(did) || [];

    res.json({
      success: true,
      data: credentials.filter((c) => c.status === 'valid'),
      tier: Math.max(0, ...credentials.filter((c) => c.status === 'valid').map((c) => c.tier)),
    });
  } catch (error) {
    log.error({ error }, 'Get credentials failed');
    res.status(500).json({ success: false, error: 'Failed to get credentials' });
  }
});

/**
 * POST /api/v1/identity/credentials/verify
 * Verify a credential
 */
router.post('/credentials/verify', async (req, res) => {
  try {
    const { credentialId, did } = req.body;

    const credentials = issuedCredentials.get(did) || [];
    const credential = credentials.find((c) => c.id === credentialId);

    if (!credential) {
      return res.json({
        success: true,
        valid: false,
        reason: 'Credential not found',
      });
    }

    // Check expiration
    if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
      return res.json({
        success: true,
        valid: false,
        reason: 'Credential expired',
      });
    }

    // Check revocation
    if (credential.status === 'revoked') {
      return res.json({
        success: true,
        valid: false,
        reason: 'Credential revoked',
      });
    }

    res.json({
      success: true,
      valid: true,
      credential: {
        type: credential.type,
        tier: credential.tier,
        issuedAt: credential.issuedAt,
        issuerName: credential.issuerName,
      },
    });
  } catch (error) {
    log.error({ error }, 'Credential verification failed');
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

/**
 * DELETE /api/v1/identity/credentials/:credentialId
 * Revoke a credential
 */
router.delete('/credentials/:credentialId', async (req, res) => {
  try {
    const did = req.headers['x-did'];
    const { credentialId } = req.params;

    if (!did) {
      return res.status(401).json({
        success: false,
        error: 'DID required',
      });
    }

    const credentials = issuedCredentials.get(did) || [];
    const credential = credentials.find((c) => c.id === credentialId);

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found',
      });
    }

    credential.status = 'revoked';
    log.info({ did, credentialId }, 'Credential revoked');

    res.json({
      success: true,
      message: 'Credential revoked',
    });
  } catch (error) {
    log.error({ error }, 'Credential revocation failed');
    res.status(500).json({ success: false, error: 'Revocation failed' });
  }
});

// ============================================================================
// GDPR/Privacy Endpoints
// ============================================================================

/**
 * GET /api/v1/identity/data-export
 * Export all user data (GDPR Article 20)
 */
router.get('/data-export', async (req, res) => {
  try {
    const did = req.headers['x-did'];
    if (!did) {
      return res.status(401).json({
        success: false,
        error: 'DID required',
      });
    }

    const devices = registeredDevices.get(did) || [];
    const credentials = (issuedCredentials.get(did) || []).map((c) => ({
      ...c,
      proof: '[REDACTED]',
      nullifier: '[REDACTED]',
    }));

    const exportData = {
      exportedAt: new Date().toISOString(),
      did,
      devices: devices.map((d) => ({
        deviceId: d.deviceId,
        name: d.name,
        platform: d.platform,
        registeredAt: d.registeredAt,
        status: d.status,
      })),
      credentials,
      verificationTier: Math.max(0, ...credentials.map((c) => c.tier)),
    };

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    log.error({ error }, 'Data export failed');
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

/**
 * DELETE /api/v1/identity/data-erasure
 * Delete all user data (GDPR Article 17)
 */
router.delete('/data-erasure', async (req, res) => {
  try {
    const did = req.headers['x-did'];
    if (!did) {
      return res.status(401).json({
        success: false,
        error: 'DID required',
      });
    }

    // Delete all data
    registeredDevices.delete(did);
    issuedCredentials.delete(did);

    // Clean up any pending verifications
    for (const [key, value] of verificationCodes.entries()) {
      if (value.did === did) {
        verificationCodes.delete(key);
      }
    }

    log.info({ did }, 'All user data erased');

    res.json({
      success: true,
      message: 'All data erased successfully',
    });
  } catch (error) {
    log.error({ error }, 'Data erasure failed');
    res.status(500).json({ success: false, error: 'Erasure failed' });
  }
});

export default router;

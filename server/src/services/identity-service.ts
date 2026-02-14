/**
 * VIVIM Identity Service - Server Side
 * 
 * Complete identity management for Phase 1:
 * - DID resolution and validation
 * - Device registration and management
 * - Verification flows (email, phone, social)
 * - Recovery mechanisms
 * - Access audit logging
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import crypto from 'crypto';
import * as nacl from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';

const log = logger.child({ module: 'identity-service' });

// ============================================================================
// Types
// ============================================================================

export interface DIDDocument {
  id: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  keyAgreement: string[];
  capabilityInvocation: string[];
  capabilityDelegation: string[];
  service?: ServiceEndpoint[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyBase58?: string;
  publicKeyMultibase?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface DeviceCapabilities {
  canSign: boolean;
  canEncrypt: boolean;
  hasBiometrics: boolean;
  hasSecureEnclave: boolean;
}

export interface DeviceRegistration {
  deviceId: string;
  deviceDID: string;
  name: string;
  platform: 'web' | 'ios' | 'android' | 'desktop';
  publicKey: string;
  capabilities: DeviceCapabilities;
  delegationProof: string;
}

// ============================================================================
// DID Operations
// ============================================================================

/**
 * Resolve a DID to its document
 */
export async function resolveDID(did: string): Promise<DIDDocument | null> {
  try {
    // Validate DID format
    if (!did.startsWith('did:key:z')) {
      log.warn({ did }, 'Unsupported DID method');
      return null;
    }

    // Extract public key from DID
    const publicKey = didToPublicKey(did);
    if (!publicKey) {
      log.warn({ did }, 'Failed to extract public key from DID');
      return null;
    }

    // Build DID document
    const keyId = `${did}#${did.split(':')[2].slice(1, 8)}`;
    
    return {
      id: did,
      verificationMethod: [{
        id: keyId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: did.split(':')[2]
      }],
      authentication: [keyId],
      assertionMethod: [keyId],
      keyAgreement: [keyId],
      capabilityInvocation: [keyId],
      capabilityDelegation: [keyId]
    };
  } catch (error) {
    log.error({ did, error: error.message }, 'DID resolution failed');
    return null;
  }
}

/**
 * Validate a DID format
 */
export function validateDID(did: string): boolean {
  if (!did || typeof did !== 'string') return false;
  if (!did.startsWith('did:key:z')) return false;
  
  // Check length (should be reasonable)
  if (did.length < 20 || did.length > 100) return false;
  
  return true;
}

/**
 * Extract public key from did:key
 */
export function didToPublicKey(did: string): Uint8Array | null {
  try {
    const match = did.match(/did:key:z(.+)/);
    if (!match) return null;

    const decoded = base58Decode(match[1]);
    // Skip multicodec prefix (first 2 bytes for Ed25519)
    return decoded.slice(2);
  } catch (error) {
    log.error({ did, error: error.message }, 'Failed to decode DID');
    return null;
  }
}

/**
 * Convert public key to DID
 */
export function publicKeyToDID(publicKey: Uint8Array): string {
  // Multicodec prefix for Ed25519 public key: 0xed01
  const multicodecPrefix = new Uint8Array([0xed, 0x01]);
  const prefixedKey = new Uint8Array(multicodecPrefix.length + publicKey.length);
  prefixedKey.set(multicodecPrefix);
  prefixedKey.set(publicKey, multicodecPrefix.length);

  return `did:key:z${base58Encode(prefixedKey)}`;
}

// ============================================================================
// User Registration
// ============================================================================

/**
 * Register a new user with DID
 */
export async function registerUser(
  did: string,
  publicKey: string,
  handle?: string,
  options: {
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  } = {}
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const prisma = getPrismaClient();

    // Validate DID
    if (!validateDID(did)) {
      return { success: false, error: 'Invalid DID format' };
    }

    // Check if DID already exists
    const existing = await prisma.user.findUnique({
      where: { did }
    });

    if (existing) {
      return { success: false, error: 'DID already registered' };
    }

    // Check handle uniqueness if provided
    if (handle) {
      const handleExists = await prisma.user.findUnique({
        where: { handle }
      });
      if (handleExists) {
        return { success: false, error: 'Handle already taken' };
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        did,
        handle,
        displayName: options.displayName,
        email: options.email,
        publicKey,
        verificationLevel: 0,
        trustScore: 50
      }
    });

    log.info({ did, handle, userId: user.id }, 'New user registered');

    // Log registration
    await logAccess(did, null, 'profile', 'register', true);

    return { success: true, user };
  } catch (error) {
    log.error({ did, error: error.message }, 'User registration failed');
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * Get or create user by DID
 */
export async function getOrCreateUser(
  did: string,
  publicKey: string
): Promise<any> {
  const prisma = getPrismaClient();

  let user = await prisma.user.findUnique({
    where: { did }
  });

  if (!user) {
    // Auto-create user for valid DIDs
    const result = await registerUser(did, publicKey);
    if (result.success) {
      user = result.user;
    }
  }

  return user;
}

// ============================================================================
// Device Management
// ============================================================================

/**
 * Register a new device for a user
 */
export async function registerDevice(
  masterDID: string,
  registration: DeviceRegistration
): Promise<{ success: boolean; device?: any; error?: string }> {
  try {
    const prisma = getPrismaClient();

    // Verify delegation proof
    const isValidDelegation = await verifyDelegation(
      masterDID,
      registration.deviceDID,
      registration.deviceId,
      registration.delegationProof
    );

    if (!isValidDelegation) {
      return { success: false, error: 'Invalid delegation proof' };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { did: masterDID }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check for existing device
    const existing = await prisma.device.findUnique({
      where: { deviceId: registration.deviceId }
    });

    if (existing) {
      // Update existing device
      const device = await prisma.device.update({
        where: { deviceId: registration.deviceId },
        data: {
          deviceName: registration.name,
          platform: registration.platform,
          publicKey: registration.publicKey,
          isActive: true,
          lastSeenAt: new Date(),
          metadata: {
            capabilities: registration.capabilities,
            deviceDID: registration.deviceDID
          }
        }
      });

      log.info({ deviceId: registration.deviceId }, 'Device updated');
      return { success: true, device };
    }

    // Create new device
    const device = await prisma.device.create({
      data: {
        userId: user.id,
        deviceId: registration.deviceId,
        deviceName: registration.name,
        deviceType: registration.platform,
        platform: registration.platform,
        publicKey: registration.publicKey,
        isActive: true,
        isTrusted: false, // Requires additional verification
        lastSeenAt: new Date(),
        metadata: {
          capabilities: registration.capabilities,
          deviceDID: registration.deviceDID,
          delegationProof: registration.delegationProof
        }
      }
    });

    log.info({ 
      deviceId: registration.deviceId, 
      userId: user.id,
      platform: registration.platform 
    }, 'New device registered');

    return { success: true, device };
  } catch (error) {
    log.error({ 
      masterDID, 
      deviceId: registration.deviceId,
      error: error.message 
    }, 'Device registration failed');
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * Get user's devices
 */
export async function getUserDevices(userId: string): Promise<any[]> {
  const prisma = getPrismaClient();

  return prisma.device.findMany({
    where: { userId },
    orderBy: { lastSeenAt: 'desc' }
  });
}

/**
 * Revoke a device
 */
export async function revokeDevice(
  userId: string,
  deviceId: string,
  reason?: string
): Promise<boolean> {
  try {
    const prisma = getPrismaClient();

    const device = await prisma.device.findFirst({
      where: { userId, deviceId }
    });

    if (!device) {
      return false;
    }

    await prisma.device.update({
      where: { id: device.id },
      data: {
        isActive: false,
        metadata: {
          ...device.metadata,
          revokedAt: new Date().toISOString(),
          revokedReason: reason
        }
      }
    });

    log.info({ deviceId, userId, reason }, 'Device revoked');
    return true;
  } catch (error) {
    log.error({ deviceId, userId, error: error.message }, 'Device revocation failed');
    return false;
  }
}

/**
 * Verify device delegation proof
 */
async function verifyDelegation(
  masterDID: string,
  deviceDID: string,
  deviceId: string,
  delegationProof: string
): Promise<boolean> {
  try {
    // Get master public key
    const masterPublicKey = didToPublicKey(masterDID);
    if (!masterPublicKey) return false;

    // Verify signature
    const message = new TextEncoder().encode(
      `delegate:${masterDID}:${deviceDID}:${deviceId}`
    );
    const signature = decodeBase64(delegationProof);

    return nacl.sign.detached.verify(message, signature, masterPublicKey);
  } catch (error) {
    log.error({ error: error.message }, 'Delegation verification failed');
    return false;
  }
}

// ============================================================================
// Verification Flows
// ============================================================================

/**
 * Initiate email verification
 */
export async function initiateEmailVerification(
  userId: string,
  email: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const prisma = getPrismaClient();

    // Generate verification code
    const code = generateVerificationCode();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    // Create verification record
    await prisma.verificationRecord.create({
      data: {
        userId,
        type: 'email',
        status: 'pending',
        value: email,
        codeHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    log.info({ userId, email }, 'Email verification initiated');

    // In production: Send email with code
    // await sendVerificationEmail(email, code);

    return { success: true, code }; // Return code for testing only
  } catch (error) {
    log.error({ userId, email, error: error.message }, 'Email verification initiation failed');
    return { success: false, error: 'Failed to initiate verification' };
  }
}

/**
 * Complete email verification
 */
export async function completeEmailVerification(
  userId: string,
  email: string,
  code: string
): Promise<boolean> {
  try {
    const prisma = getPrismaClient();

    // Find pending verification
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    const verification = await prisma.verificationRecord.findFirst({
      where: {
        userId,
        type: 'email',
        status: 'pending',
        value: email,
        codeHash,
        expiresAt: { gt: new Date() }
      }
    });

    if (!verification) {
      return false;
    }

    // Update verification status
    await prisma.verificationRecord.update({
      where: { id: verification.id },
      data: {
        status: 'verified',
        verifiedAt: new Date()
      }
    });

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        emailVerified: true,
        verificationLevel: {
          increment: 1
        }
      }
    });

    log.info({ userId, email }, 'Email verified');
    return true;
  } catch (error) {
    log.error({ userId, email, error: error.message }, 'Email verification failed');
    return false;
  }
}

/**
 * Initiate phone verification
 */
export async function initiatePhoneVerification(
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const prisma = getPrismaClient();

    const code = generateVerificationCode(6);
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    await prisma.verificationRecord.create({
      data: {
        userId,
        type: 'phone',
        status: 'pending',
        value: phoneNumber,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      }
    });

    log.info({ userId, phoneNumber }, 'Phone verification initiated');

    // In production: Send SMS
    // await sendVerificationSMS(phoneNumber, code);

    return { success: true, code };
  } catch (error) {
    log.error({ userId, phoneNumber, error: error.message }, 'Phone verification initiation failed');
    return { success: false, error: 'Failed to initiate verification' };
  }
}

/**
 * Generate verification code
 */
function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    code += digits[randomBytes[i] % 10];
  }
  
  return code;
}

// ============================================================================
// Access Audit Logging
// ============================================================================

/**
 * Log an access event
 */
export async function logAccess(
  accessorDid: string,
  targetUserId: string | null,
  targetType: string,
  action: string,
  granted: boolean,
  context?: {
    targetContentId?: string;
    viaCircleId?: string;
    viaRelationship?: string;
    denialReason?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  }
): Promise<void> {
  try {
    const prisma = getPrismaClient();

    await prisma.accessAuditLog.create({
      data: {
        accessorDid,
        targetUserId,
        targetType,
        targetContentId: context?.targetContentId,
        action,
        granted,
        denialReason: context?.denialReason,
        viaCircleId: context?.viaCircleId,
        viaRelationship: context?.viaRelationship,
        timestamp: new Date(),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        deviceId: context?.deviceId
      }
    });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to log access');
  }
}

/**
 * Get access audit log for a user
 */
export async function getAccessAuditLog(
  userId: string,
  options: {
    targetType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<any[]> {
  const prisma = getPrismaClient();

  return prisma.accessAuditLog.findMany({
    where: {
      targetUserId: userId,
      ...(options.targetType && { targetType: options.targetType }),
      ...(options.action && { action: options.action }),
      ...(options.startDate && options.endDate && {
        timestamp: {
          gte: options.startDate,
          lte: options.endDate
        }
      })
    },
    orderBy: { timestamp: 'desc' },
    take: options.limit || 100,
    skip: options.offset || 0
  });
}

// ============================================================================
// Consent Management
// ============================================================================

/**
 * Record user consent
 */
export async function recordConsent(
  userId: string,
  purpose: string,
  allowed: boolean,
  options: {
    dataTypes?: string[];
    conditions?: any;
    scope?: any;
    expiresAt?: Date;
    proof?: any;
  } = {}
): Promise<any> {
  const prisma = getPrismaClient();

  return prisma.consentRecord.create({
    data: {
      userId,
      purpose,
      allowed,
      dataTypes: options.dataTypes || [],
      conditions: options.conditions,
      scope: options.scope,
      expiresAt: options.expiresAt,
      proof: options.proof,
      grantedAt: new Date()
    }
  });
}

/**
 * Check if user has consented to a purpose
 */
export async function checkConsent(
  userId: string,
  purpose: string
): Promise<boolean> {
  const prisma = getPrismaClient();

  const consent = await prisma.consentRecord.findFirst({
    where: {
      userId,
      purpose,
      status: 'active',
      allowed: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    orderBy: { grantedAt: 'desc' }
  });

  return !!consent;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Base58 encoding
 */
function base58Encode(data: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  let num = BigInt('0x' + Buffer.from(data).toString('hex'));
  
  while (num > 0) {
    result = ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }

  // Add leading zeros
  for (const byte of data) {
    if (byte === 0) result = '1' + result;
    else break;
  }

  return result;
}

/**
 * Base58 decoding
 */
function base58Decode(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  
  for (const char of str) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Invalid base58 character');
    num = num * 58n + BigInt(index);
  }

  const hex = num.toString(16).padStart(2, '0');
  const paddedHex = hex.length % 2 ? '0' + hex : hex;
  return Buffer.from(paddedHex, 'hex');
}

// ============================================================================
// Export Service
// ============================================================================

export const identityService = {
  resolveDID,
  validateDID,
  didToPublicKey,
  publicKeyToDID,
  registerUser,
  getOrCreateUser,
  registerDevice,
  getUserDevices,
  revokeDevice,
  initiateEmailVerification,
  completeEmailVerification,
  initiatePhoneVerification,
  logAccess,
  getAccessAuditLog,
  recordConsent,
  checkConsent
};

export default identityService;

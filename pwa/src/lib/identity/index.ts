/**
 * OpenScroll Identity Module
 * 
 * Comprehensive identity management for P2P network:
 * - Self-sovereign identity (DID-based)
 * - Multi-device support
 * - Privacy-preserving KYC
 * - Cross-device sync
 */

// Core Services
export { identityService, type MasterIdentity, type IdentityProfile, type DeviceRegistration, type DeviceCapabilities, type RecoveryOptions, type IdentityState } from './identity-service';

export { kycManager, type VerificationCredential, type VerificationTier, type VerificationType, type RegionCode, type RegionalRequirements, type VerificationRequest, type VerificationResult } from './kyc-manager';

export { deviceManager, type DeviceSyncMessage, type SyncState, type DeviceAnnouncement, type SyncConflict } from './device-manager';

// Server API Integration
export {
  registerUserOnServer,
  registerDeviceOnServer,
  getUserProfile,
  initiateEmailVerification,
  completeEmailVerification,
  getAccessLog,
  recordConsent,
  syncIdentityWithServer
} from './server-api';

// ============================================================================
// Convenience Functions
// ============================================================================

import { identityService } from './identity-service';
import { kycManager } from './kyc-manager';
import { deviceManager } from './device-manager';

/**
 * Initialize all identity services
 */
export async function initializeIdentity(): Promise<{
  hasIdentity: boolean;
  verified: boolean;
  tier: number;
}> {
  await identityService.initialize();
  await kycManager.initialize();
  await deviceManager.initialize();

  return {
    hasIdentity: identityService.hasIdentity(),
    verified: kycManager.getCurrentTier() > 0,
    tier: kycManager.getCurrentTier()
  };
}

/**
 * Quick check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return identityService.hasIdentity() && identityService.isUnlocked();
}

/**
 * Get current user's DID
 */
export function getCurrentDID(): string | null {
  return identityService.getDID();
}

/**
 * Get verification status summary
 */
export function getVerificationStatus(): {
  tier: number;
  tierName: string;
  region: string;
  credentials: number;
} {
  const tier = kycManager.getCurrentTier();
  const tierNames = ['Anonymous', 'Email Verified', 'Human Verified', 'KYC Complete'];

  return {
    tier,
    tierName: tierNames[tier],
    region: kycManager.getRegion(),
    credentials: kycManager.getCredentials().length
  };
}

/**
 * Get connected devices
 */
export function getConnectedDevices(): string[] {
  return deviceManager.getSyncState().connectedDevices;
}

// ============================================================================
// React Hooks (for convenience)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for identity state
 */
export function useIdentity() {
  const [identity, setIdentity] = useState(identityService.getIdentity());
  const [isUnlocked, setIsUnlocked] = useState(identityService.isUnlocked());

  useEffect(() => {
    // Check state on mount
    setIdentity(identityService.getIdentity());
    setIsUnlocked(identityService.isUnlocked());
  }, []);

  const unlock = useCallback(async (password: string) => {
    const success = await identityService.unlock(password);
    setIsUnlocked(success);
    return success;
  }, []);

  const lock = useCallback(() => {
    identityService.lock();
    setIsUnlocked(false);
  }, []);

  return { identity, isUnlocked, unlock, lock };
}

/**
 * Hook for verification tier
 */
export function useVerificationTier() {
  const [tier, setTier] = useState(kycManager.getCurrentTier());
  const [region, setRegion] = useState(kycManager.getRegion());

  useEffect(() => {
    setTier(kycManager.getCurrentTier());
    setRegion(kycManager.getRegion());
  }, []);

  return { tier, region, requirements: kycManager.getRequirements() };
}

/**
 * Hook for device sync state
 */
export function useSyncState() {
  const [syncState, setSyncState] = useState(deviceManager.getSyncState());

  useEffect(() => {
    const unsubscribe = deviceManager.onSyncStateChange(setSyncState);
    return unsubscribe;
  }, []);

  return syncState;
}

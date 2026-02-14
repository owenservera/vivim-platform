/**
 * OpenScroll Device Manager
 * 
 * Multi-Device Synchronization and Key Derivation
 * 
 * Features:
 * - Device registration with master key delegation
 * - Cross-device sync via server relay
 * - Device-specific key derivation (HD wallet pattern)
 * - Remote revocation
 * - Conflict resolution
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import type { DID, Hash, ISO8601, Signature } from '../storage-v2/types';
import { asHash, asISO8601, asSignature } from '../storage-v2/types';
import { sha3_256, toHex, fromHex } from '../storage-v2/secure-crypto';
import { identityService, type DeviceRegistration, type DeviceCapabilities } from './identity-service';
import { log } from '../logger';

// ============================================================================
// Types
// ============================================================================

export interface DeviceSyncMessage {
  type: 'device_announce' | 'device_ack' | 'device_revoke' | 'sync_request' | 'sync_data';
  fromDevice: string;
  toDevice?: string;  // null = broadcast
  timestamp: ISO8601;
  signature: Signature;
  payload: unknown;
}

export interface SyncState {
  lastSync: ISO8601 | null;
  pendingChanges: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  connectedDevices: string[];
}

export interface DeviceAnnouncement {
  deviceId: string;
  deviceDID: DID;
  name: string;
  platform: string;
  publicKey: string;
  delegationProof: Signature;
}

export interface SyncConflict {
  id: string;
  type: 'conversation' | 'message' | 'setting';
  localVersion: unknown;
  remoteVersion: unknown;
  localTimestamp: ISO8601;
  remoteTimestamp: ISO8601;
  resolution?: 'local' | 'remote' | 'merged';
}

// ============================================================================
// Device Manager
// ============================================================================

class DeviceManager {
  private syncState: SyncState = {
    lastSync: null,
    pendingChanges: 0,
    syncStatus: 'idle',
    connectedDevices: []
  };

  private deviceKeys: Map<string, Uint8Array> = new Map();
  private syncListeners: ((state: SyncState) => void)[] = [];
  private websocket: WebSocket | null = null;

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(): Promise<void> {
    // Load sync state
    const savedState = localStorage.getItem('openscroll_sync_state');
    if (savedState) {
      this.syncState = JSON.parse(savedState);
    }

    log.identity?.info('Device Manager initialized');
  }

  // ==========================================================================
  // Device Key Derivation
  // ==========================================================================

  /**
   * Derive device-specific keypair from master key
   * Uses HD wallet pattern: master + device_id → device_key
   */
  async deriveDeviceKey(
    masterPrivateKey: Uint8Array,
    deviceId: string
  ): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
    // Derive using SHA-3 of master + deviceId
    const derivationPath = await sha3_256(`${toHex(masterPrivateKey)}:device:${deviceId}`);
    const seed = fromHex(derivationPath).slice(0, 32);

    const keyPair = nacl.sign.keyPair.fromSeed(seed);

    // Cache for this session
    this.deviceKeys.set(deviceId, keyPair.secretKey);

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    };
  }

  /**
   * Get cached device key (if unlocked)
   */
  getDeviceKey(deviceId: string): Uint8Array | null {
    return this.deviceKeys.get(deviceId) || null;
  }

  // ==========================================================================
  // Device Registration
  // ==========================================================================

  /**
   * Add a new device (from this device)
   */
  async addDevice(
    name: string,
    devicePublicKey: string
  ): Promise<DeviceRegistration | null> {
    try {
      if (!identityService.isUnlocked()) {
        throw new Error('Identity must be unlocked to add devices');
      }

      const masterDID = identityService.getDID();
      if (!masterDID) throw new Error('No master identity');

      // Create device registration
      const deviceId = crypto.randomUUID();
      const deviceSeed = await sha3_256(`${deviceId}:${devicePublicKey}`);
      const deviceDID = `did:key:z${deviceSeed.slice(0, 44)}` as DID;

      // Create delegation proof (master signs device)
      const delegationMessage = `delegate:${masterDID}:${deviceDID}:${deviceId}`;
      const delegationProof = identityService.sign(delegationMessage);

      const device: DeviceRegistration = {
        deviceId,
        deviceDID,
        name,
        platform: 'web',
        registeredAt: asISO8601(new Date().toISOString()),
        lastActiveAt: asISO8601(new Date().toISOString()),
        capabilities: {
          canSign: true,
          canEncrypt: true,
          hasBiometrics: false,
          hasSecureEnclave: false
        },
        delegationProof,
        status: 'pending'
      };

      log.identity?.info('Device registration created', { deviceId, name });
      return device;
    } catch (error) {
      log.identity?.error('Failed to add device', error as Error);
      return null;
    }
  }

  /**
   * Verify a device's delegation proof
   */
  async verifyDeviceDelegation(
    device: DeviceRegistration,
    masterDID: DID
  ): Promise<boolean> {
    try {
      const delegationMessage = `delegate:${masterDID}:${device.deviceDID}:${device.deviceId}`;
      return await identityService.verify(
        delegationMessage,
        device.delegationProof,
        masterDID
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate QR code payload for device pairing
   */
  generatePairingPayload(): string {
    const masterDID = identityService.getDID();
    if (!masterDID) throw new Error('No identity');

    const payload = {
      type: 'openscroll_pair',
      version: 1,
      masterDID,
      timestamp: new Date().toISOString(),
      // In production: Include secure pairing token
    };

    return btoa(JSON.stringify(payload));
  }

  /**
   * Complete pairing from scanned QR code
   */
  async completePairing(pairingPayload: string): Promise<boolean> {
    try {
      const decoded = JSON.parse(atob(pairingPayload));

      if (decoded.type !== 'openscroll_pair') {
        throw new Error('Invalid pairing code');
      }

      // Verify timestamp (5 minute window)
      const pairingTime = new Date(decoded.timestamp).getTime();
      if (Date.now() - pairingTime > 5 * 60 * 1000) {
        throw new Error('Pairing code expired');
      }

      log.identity?.info('Pairing completed with', { masterDID: decoded.masterDID });
      return true;
    } catch (error) {
      log.identity?.error('Pairing failed', error as Error);
      return false;
    }
  }

  // ==========================================================================
  // Device Synchronization
  // ==========================================================================

  /**
   * Connect to sync server
   */
  async connectSync(serverUrl: string): Promise<boolean> {
    try {
      if (this.websocket) {
        this.websocket.close();
      }

      return new Promise((resolve) => {
        this.websocket = new WebSocket(serverUrl);

        this.websocket.onopen = () => {
          log.identity?.info('Sync connection established');
          this.updateSyncState({ syncStatus: 'idle' });
          this.announceDevice();
          resolve(true);
        };

        this.websocket.onmessage = (event) => {
          this.handleSyncMessage(JSON.parse(event.data));
        };

        this.websocket.onerror = () => {
          this.updateSyncState({ syncStatus: 'error' });
          resolve(false);
        };

        this.websocket.onclose = () => {
          this.updateSyncState({ syncStatus: 'idle', connectedDevices: [] });
        };
      });
    } catch (error) {
      log.identity?.error('Sync connection failed', error as Error);
      return false;
    }
  }

  /**
   * Disconnect sync
   */
  disconnectSync(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Announce this device to other devices
   */
  private announceDevice(): void {
    const devices = identityService.getDevices();
    const currentDevice = devices.find(d => d.status === 'active');
    if (!currentDevice) return;

    const announcement: DeviceAnnouncement = {
      deviceId: currentDevice.deviceId,
      deviceDID: currentDevice.deviceDID,
      name: currentDevice.name,
      platform: currentDevice.platform,
      publicKey: '', // Would include public key
      delegationProof: currentDevice.delegationProof
    };

    this.sendSyncMessage({
      type: 'device_announce',
      fromDevice: currentDevice.deviceId,
      timestamp: asISO8601(new Date().toISOString()),
      signature: identityService.isUnlocked() 
        ? identityService.sign(JSON.stringify(announcement))
        : asSignature(''),
      payload: announcement
    });
  }

  /**
   * Handle incoming sync message
   */
  private handleSyncMessage(message: DeviceSyncMessage): void {
    switch (message.type) {
      case 'device_announce':
        this.handleDeviceAnnounce(message);
        break;
      case 'device_revoke':
        this.handleDeviceRevoke(message);
        break;
      case 'sync_request':
        this.handleSyncRequest(message);
        break;
      case 'sync_data':
        this.handleSyncData(message);
        break;
    }
  }

  private handleDeviceAnnounce(message: DeviceSyncMessage): void {
    const announcement = message.payload as DeviceAnnouncement;
    log.identity?.info('Device announced', { deviceId: announcement.deviceId });

    // Add to connected devices
    if (!this.syncState.connectedDevices.includes(announcement.deviceId)) {
      this.updateSyncState({
        connectedDevices: [...this.syncState.connectedDevices, announcement.deviceId]
      });
    }

    // Send acknowledgment
    this.sendSyncMessage({
      type: 'device_ack',
      fromDevice: identityService.getDevices()[0]?.deviceId || '',
      toDevice: announcement.deviceId,
      timestamp: asISO8601(new Date().toISOString()),
      signature: asSignature(''),
      payload: { acknowledged: true }
    });
  }

  private handleDeviceRevoke(message: DeviceSyncMessage): void {
    const { deviceId } = message.payload as { deviceId: string };
    log.identity?.warn('Device revocation received', { deviceId });

    // If this device is being revoked, clear data
    const currentDeviceId = localStorage.getItem('openscroll_device_id');
    if (deviceId === currentDeviceId) {
      log.identity?.error('This device has been revoked!');
      // In production: Clear all data and force re-authentication
    }

    // Remove from connected devices
    this.updateSyncState({
      connectedDevices: this.syncState.connectedDevices.filter(id => id !== deviceId)
    });
  }

  private handleSyncRequest(message: DeviceSyncMessage): void {
    log.identity?.info('Sync request from', { device: message.fromDevice });
    // In production: Send relevant data updates
  }

  private handleSyncData(message: DeviceSyncMessage): void {
    log.identity?.info('Sync data received from', { device: message.fromDevice });
    // In production: Merge incoming data with local data
    
    this.updateSyncState({
      lastSync: asISO8601(new Date().toISOString())
    });
  }

  /**
   * Send sync message
   */
  private sendSyncMessage(message: DeviceSyncMessage): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Request sync from other devices
   */
  async requestSync(): Promise<void> {
    this.updateSyncState({ syncStatus: 'syncing' });

    this.sendSyncMessage({
      type: 'sync_request',
      fromDevice: localStorage.getItem('openscroll_device_id') || '',
      timestamp: asISO8601(new Date().toISOString()),
      signature: asSignature(''),
      payload: {
        lastSync: this.syncState.lastSync
      }
    });
  }

  // ==========================================================================
  // Conflict Resolution
  // ==========================================================================

  /**
   * Detect conflicts between local and remote data
   */
  detectConflicts(localData: unknown, remoteData: unknown): SyncConflict[] {
    // Simplified conflict detection
    // In production: Deep compare with version vectors
    return [];
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merged',
    mergedData?: unknown
  ): unknown {
    switch (resolution) {
      case 'local':
        return conflict.localVersion;
      case 'remote':
        return conflict.remoteVersion;
      case 'merged':
        return mergedData;
    }
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  /**
   * Update sync state
   */
  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    localStorage.setItem('openscroll_sync_state', JSON.stringify(this.syncState));
    
    // Notify listeners
    this.syncListeners.forEach(listener => listener(this.syncState));
  }

  /**
   * Subscribe to sync state changes
   */
  onSyncStateChange(listener: (state: SyncState) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current sync state
   */
  getSyncState(): SyncState {
    return this.syncState;
  }

  // ==========================================================================
  // Remote Revocation
  // ==========================================================================

  /**
   * Revoke a device remotely
   */
  async revokeDeviceRemotely(deviceId: string): Promise<boolean> {
    try {
      // Update local device list
      const success = await identityService.revokeDevice(deviceId);
      if (!success) return false;

      // Broadcast revocation to other devices
      this.sendSyncMessage({
        type: 'device_revoke',
        fromDevice: localStorage.getItem('openscroll_device_id') || '',
        timestamp: asISO8601(new Date().toISOString()),
        signature: identityService.isUnlocked()
          ? identityService.sign(`revoke:${deviceId}`)
          : asSignature(''),
        payload: { deviceId }
      });

      log.identity?.info('Device revoked remotely', { deviceId });
      return true;
    } catch (error) {
      log.identity?.error('Remote revocation failed', error as Error);
      return false;
    }
  }
}

// Export singleton
export const deviceManager = new DeviceManager();
export default deviceManager;

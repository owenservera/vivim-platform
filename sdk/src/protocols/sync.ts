/**
 * Sync Protocol
 * 
 * Handles state synchronization between clones and parent nodes.
 * Implements incremental updates and merkle verification.
 * 
 * @packageDocumentation
 */

import { EventEmitter } from 'events';
import type { VivimSDK } from './sdk.js';
import type { StateSnapshot } from './exit-node.js';
import { TrustProof } from './anchor.js';

// Sync protocol constants
export const SYNC_VERSION = '1.0.0';
export const SYNC_TOPIC_PREFIX = '/vivim/sync';

/**
 * Sync endpoint configuration
 */
export interface SyncEndpoints {
  parentPeerId: string;
  parentDid: string;
  syncTopic: string;
  apiEndpoint: string;
}

/**
 * State update types
 */
export type UpdateType = 'identity' | 'content' | 'social' | 'memory' | 'node' | 'app';

/**
 * State update
 */
export interface StateUpdate {
  // Update metadata
  updateId: string;
  type: UpdateType;
  timestamp: number;
  
  // Source
  sourceDid: string;
  sourceCloneId: string;
  
  // Update data
  operation: 'create' | 'update' | 'delete';
  path: string;
  data: unknown;
  
  // Verification
  merkleProof: string;
  signature: string;
}

/**
 * Sync status
 */
export interface SyncStatus {
  connected: boolean;
  parentDid: string | null;
  lastSyncAt: number | null;
  pendingUpdates: number;
  stateHash: string;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  /** Enable automatic sync */
  autoSync: boolean;
  /** Sync interval in milliseconds */
  syncInterval: number;
  /** Maximum updates per batch */
  maxBatchSize: number;
  /** Timeout for sync operations */
  syncTimeout: number;
  /** Enable compression */
  compression: boolean;
}

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  autoSync: true,
  syncInterval: 60000, // 1 minute
  maxBatchSize: 100,
  syncTimeout: 30000,
  compression: false,
};

/**
 * Sync Events
 */
export interface SyncEvents {
  'sync:started': { parentDid: string };
  'sync:completed': { parentDid: string; updatesApplied: number };
  'sync:failed': { parentDid: string; error: Error };
  'update:received': { update: StateUpdate };
  'update:applied': { update: StateUpdate; success: boolean };
  'status:changed': { status: SyncStatus };
  'error': { error: Error };
}

/**
 * Sync Protocol
 * 
 * Handles ongoing synchronization between clones and parent nodes.
 */
export class SyncProtocol extends EventEmitter {
  private sdk: VivimSDK;
  private config: SyncConfig;
  private endpoints: SyncEndpoints | null = null;
  private trustProof: TrustProof | null = null;
  private status: SyncStatus;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private pendingUpdates: StateUpdate[] = [];
  private stateHash: string = '';
  
  constructor(sdk: VivimSDK, config: Partial<SyncConfig> = {}) {
    super();
    this.sdk = sdk;
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.status = {
      connected: false,
      parentDid: null,
      lastSyncAt: null,
      pendingUpdates: 0,
      stateHash: '',
    };
  }
  
  // ============================================
  // LIFECYCLE
  // ============================================
  
  /**
   * Start the sync protocol
   */
  async start(): Promise<void> {
    if (!this.endpoints) {
      console.log('[Sync] No parent configured - skipping sync');
      return;
    }
    
    // Set up periodic sync
    if (this.config.autoSync) {
      this.syncTimer = setInterval(
        () => this.performSync().catch(err => this.emit('error', { error: err })),
        this.config.syncInterval
      );
    }
    
    console.log(`[Sync] Started with parent: ${this.endpoints.parentDid}`);
    this.emit('sync:started', { parentDid: this.endpoints.parentDid });
  }
  
  /**
   * Stop the sync protocol
   */
  async stop(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.status.connected = false;
    this.emit('status:changed', { status: this.status });
    
    console.log('[Sync] Stopped');
  }
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Configure parent endpoints
   */
  configure(endpoints: SyncEndpoints, trustProof: TrustProof): void {
    this.endpoints = endpoints;
    this.trustProof = trustProof;
    this.status.parentDid = endpoints.parentDid;
    this.status.connected = true;
    
    this.emit('status:changed', { status: this.status });
  }
  
  /**
   * Initialize sync with parent node
   */
  async initializeSync(initialState: StateSnapshot): Promise<void> {
    if (!this.endpoints) {
      throw new Error('Sync not configured');
    }
    
    // Verify initial state
    const valid = await this.verifyInitialState(initialState);
    if (!valid) {
      throw new Error('Invalid initial state snapshot');
    }
    
    // Apply initial state
    await this.applyStateSnapshot(initialState);
    
    // Update status
    this.stateHash = initialState.merkleRoot;
    this.status.lastSyncAt = Date.now();
    this.status.stateHash = this.stateHash;
    this.emit('status:changed', { status: this.status });
    
    console.log(`[Sync] Initialized with state: ${initialState.merkleRoot.substring(0, 16)}...`);
  }
  
  // ============================================
  // SYNC OPERATIONS
  // ============================================
  
  /**
   * Perform synchronization with parent
   */
  async performSync(): Promise<void> {
    if (!this.endpoints || !this.status.connected) {
      return;
    }
    
    try {
      // Fetch pending updates from parent
      const updates = await this.fetchUpdates();
      
      if (updates.length === 0) {
        return;
      }
      
      // Apply updates
      let applied = 0;
      for (const update of updates) {
        const success = await this.applyUpdate(update);
        if (success) {
          applied++;
        }
      }
      
      // Update status
      this.status.lastSyncAt = Date.now();
      this.emit('sync:completed', { parentDid: this.endpoints.parentDid, updatesApplied: applied });
      this.emit('status:changed', { status: this.status });
      
    } catch (error) {
      this.emit('sync:failed', { 
        parentDid: this.endpoints.parentDid, 
        error: error as Error 
      });
    }
  }
  
  /**
   * Fetch updates from parent
   */
  private async fetchUpdates(): Promise<StateUpdate[]> {
    if (!this.endpoints) return [];
    
    // In production, this would make an actual network request
    // For now, return empty array (updates would come via pub/sub)
    return [];
  }
  
  /**
   * Handle received update
   */
  async handleUpdate(update: StateUpdate): Promise<void> {
    // Emit received event
    this.emit('update:received', { update });
    
    // Verify update authenticity
    const valid = await this.verifyUpdate(update);
    if (!valid) {
      console.warn(`[Sync] Invalid update rejected: ${update.updateId}`);
      return;
    }
    
    // Apply update
    const success = await this.applyUpdate(update);
    
    this.emit('update:applied', { update, success });
  }
  
  /**
   * Apply state snapshot
   */
  private async applyStateSnapshot(snapshot: StateSnapshot): Promise<void> {
    // Apply identity state
    if (snapshot.state.identity) {
      // In production, update local identity if needed
    }
    
    // Apply node states
    for (const [nodeId, state] of Object.entries(snapshot.state.nodes)) {
      // In production, restore node state
    }
    
    // Apply app states
    for (const [appId, state] of Object.entries(snapshot.state.apps)) {
      // In production, restore app state
    }
    
    // Apply content manifest
    if (snapshot.state.contentManifest) {
      // In production, process content manifest
    }
    
    // Apply social graph
    if (snapshot.state.socialGraph) {
      // In production, restore social graph
    }
    
    // Apply memory index
    if (snapshot.state.memoryIndex) {
      // In production, restore memory index
    }
  }
  
  /**
   * Apply single update
   */
  private async applyUpdate(update: StateUpdate): Promise<boolean> {
    try {
      switch (update.type) {
        case 'identity':
          return await this.applyIdentityUpdate(update);
        case 'content':
          return await this.applyContentUpdate(update);
        case 'social':
          return await this.applySocialUpdate(update);
        case 'memory':
          return await this.applyMemoryUpdate(update);
        case 'node':
          return await this.applyNodeUpdate(update);
        case 'app':
          return await this.applyAppUpdate(update);
        default:
          return false;
      }
    } catch (error) {
      console.error(`[Sync] Failed to apply update: ${error}`);
      return false;
    }
  }
  
  /**
   * Apply identity update
   */
  private async applyIdentityUpdate(update: StateUpdate): Promise<boolean> {
    // In production, update local identity
    return true;
  }
  
  /**
   * Apply content update
   */
  private async applyContentUpdate(update: StateUpdate): Promise<boolean> {
    // In production, update content
    return true;
  }
  
  /**
   * Apply social update
   */
  private async applySocialUpdate(update: StateUpdate): Promise<boolean> {
    // In production, update social graph
    return true;
  }
  
  /**
   * Apply memory update
   */
  private async applyMemoryUpdate(update: StateUpdate): Promise<boolean> {
    // In production, update memory
    return true;
  }
  
  /**
   * Apply node update
   */
  private async applyNodeUpdate(update: StateUpdate): Promise<boolean> {
    // In production, update node state
    return true;
  }
  
  /**
   * Apply app update
   */
  private async applyAppUpdate(update: StateUpdate): Promise<boolean> {
    // In production, update app state
    return true;
  }
  
  // ============================================
  // VERIFICATION
  // ============================================
  
  /**
   * Verify initial state snapshot
   */
  private async verifyInitialState(snapshot: StateSnapshot): Promise<boolean> {
    try {
      // Verify signature
      const signatureValid = await this.sdk.verify(
        {
          merkleRoot: snapshot.merkleRoot,
          snapshotId: snapshot.snapshotId,
        },
        snapshot.signature,
        snapshot.sourceDid
      );
      
      if (!signatureValid) {
        return false;
      }
      
      // Verify merkle root
      const computedRoot = await this.computeMerkleRoot(snapshot.state);
      if (computedRoot !== snapshot.merkleRoot) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Verify state update
   */
  private async verifyUpdate(update: StateUpdate): Promise<boolean> {
    try {
      // Verify signature
      const valid = await this.sdk.verify(
        {
          updateId: update.updateId,
          type: update.type,
          path: update.path,
          timestamp: update.timestamp,
        },
        update.signature,
        update.sourceDid
      );
      
      return valid;
    } catch {
      return false;
    }
  }
  
  /**
   * Compute merkle root from state
   */
  private async computeMerkleRoot(state: StateSnapshot['state']): Promise<string> {
    const stateJson = JSON.stringify(state);
    const encoder = new TextEncoder();
    const data = encoder.encode(stateJson);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
  
  // ============================================
  // STATUS
  // ============================================
  
  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }
  
  /**
   * Get pending updates count
   */
  getPendingCount(): number {
    return this.pendingUpdates.length;
  }
  
  // ============================================
  // UTILITIES
  // ============================================
  
  /**
   * Create a state update
   */
  async createUpdate(
    type: UpdateType,
    operation: 'create' | 'update' | 'delete',
    path: string,
    data: unknown
  ): Promise<StateUpdate> {
    const identity = this.sdk.getIdentity();
    
    const update: StateUpdate = {
      updateId: crypto.randomUUID(),
      type,
      timestamp: Date.now(),
      sourceDid: identity?.did ?? '',
      sourceCloneId: '', // Would be set from anchor
      operation,
      path,
      data,
      merkleProof: '',
      signature: '', // Will be signed below
    };
    
    // Sign update
    update.signature = await this.sdk.sign({
      updateId: update.updateId,
      type: update.type,
      path: update.path,
      timestamp: update.timestamp,
    });
    
    return update;
  }
  
  /**
   * Subscribe to sync topic (for receiving updates)
   */
  async subscribeToUpdates(topic: string): Promise<void> {
    // In production, subscribe to gossipsub topic
    console.log(`[Sync] Subscribed to topic: ${topic}`);
  }
  
  /**
   * Publish update to sync topic
   */
  async publishUpdate(update: StateUpdate): Promise<void> {
    // In production, publish to gossipsub topic
    console.log(`[Sync] Published update: ${update.updateId}`);
  }
}

// Export types
export type {
  SyncEvents,
  SyncConfig,
  SyncEndpoints,
  StateUpdate,
  UpdateType,
};

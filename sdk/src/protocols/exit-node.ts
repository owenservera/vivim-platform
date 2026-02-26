/**
 * Exit Node Protocol
 * 
 * Implements the server-side of the Exit Node Protocol (ENP).
 * Enables clones to discover, register, and synchronize with canonical nodes.
 * 
 * @packageDocumentation
 */

import { EventEmitter } from 'events';
import type { VivimSDK } from './sdk.js';
import { AnchorProtocol, AnchorState, TrustProof, TrustLevel } from './anchor.js';

// Protocol constants
export const EXIT_NODE_PROTOCOL = '/vivim/exit-node/1.0.0';
export const CLONE_PROTOCOL = '/vivim/clone/1.0.0';
export const SYNC_PROTOCOL = '/vivim/sync/1.0.0';

/**
 * Exit Node Advertisement
 * Broadcasted to enable clone discovery
 */
export interface ExitNodeAdvertisement {
  // Node identity
  did: string;
  peerId: string;
  multiaddrs: string[];
  
  // Capabilities
  capabilities: string[];
  supportedCloneVersions: string[];
  
  // Trust
  trustLevel: TrustLevel;
  anchorState: AnchorState;
  
  // Protocol endpoints
  endpoints: {
    clone: string;
    sync: string;
    relay: string;
  };
  
  // Policy
  policy: {
    maxClones: number;
    allowMigration: boolean;
    requireVerification: boolean;
  };
}

/**
 * Clone registration request
 */
export interface CloneRegistrationRequest {
  // Requester identity
  did: string;
  requestedCloneId?: string;
  
  // Intended configuration
  desiredCapabilities: string[];
  preferredNetwork: 'mainnet' | 'testnet' | 'local';
  
  // Proof of identity
  identityProof: string;
  
  // Request timestamp
  timestamp: number;
  
  // Nonce for replay protection
  nonce: string;
  
  // Challenge response
  challengeResponse?: string;
}

/**
 * Clone registration response
 */
export interface CloneRegistrationResponse {
  // Registration status
  approved: boolean;
  cloneId: string;
  
  // Assigned resources
  assignedPeerId?: string;
  endpoints: {
    api: string;
    p2p: string;
    relay?: string;
  };
  
  // Trust delegation
  trustProof?: TrustProof;
  
  // Sync data
  initialState?: StateSnapshot;
  
  // Rejection reason (if denied)
  denialReason?: string;
}

/**
 * State snapshot for clone initialization
 */
export interface StateSnapshot {
  // Metadata
  snapshotId: string;
  createdAt: number;
  sourceDid: string;
  sourceCloneId: string;
  
  // Version info
  sdkVersion: string;
  schemaVersion: string;
  
  // State Merkle Root
  merkleRoot: string;
  
  // State categories
  state: {
    // Identity state
    identity: {
      did: string;
      publicKey: string;
      profile?: unknown;
    };
    
    // Node states
    nodes: Record<string, unknown>;
    
    // App states  
    apps: Record<string, unknown>;
    
    // Content references
    contentManifest: unknown;
    
    // Social graph
    socialGraph: unknown;
    
    // Memory/Knowledge
    memoryIndex: unknown;
  };
  
  // Verification
  signature: string;
}

/**
 * Exit Node Configuration
 */
export interface ExitNodeConfig {
  /** Enable exit node functionality */
  enabled: boolean;
  /** Advertise to network for discovery */
  advertise: boolean;
  /** Maximum number of clones */
  maxClones: number;
  /** Allow clone migration */
  allowMigration: boolean;
  /** Require identity verification */
  requireVerification: boolean;
  /** API port */
  port: number;
  /** P2P listen addresses */
  listenAddresses: string[];
  /** Challenge timeout in ms */
  challengeTimeout: number;
}

/**
 * Default exit node configuration
 */
export const DEFAULT_EXIT_NODE_CONFIG: ExitNodeConfig = {
  enabled: false,
  advertise: true,
  maxClones: 100,
  allowMigration: true,
  requireVerification: true,
  port: 3000,
  listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
  challengeTimeout: 30000,
};

/**
 * Registered clone info
 */
interface RegisteredClone {
  did: string;
  cloneId: string;
  registeredAt: number;
  lastSyncAt: number;
  trustProof: TrustProof;
  response: CloneRegistrationResponse;
}

/**
 * Exit Node Events
 */
export interface ExitNodeEvents {
  'clone:registered': { clone: RegisteredClone; response: CloneRegistrationResponse };
  'clone:rejected': { did: string; reason: string };
  'clone:disconnected': { cloneId: string };
  'advertisement:updated': { advertisement: ExitNodeAdvertisement };
  'error': { error: Error };
}

/**
 * Exit Node Service
 * 
 * Implements the server-side of the Exit Node Protocol.
 * Handles clone discovery, registration, and trust delegation.
 */
export class ExitNodeService extends EventEmitter {
  private sdk: VivimSDK;
  private anchor: AnchorProtocol;
  private config: ExitNodeConfig;
  private advertisement: ExitNodeAdvertisement | null = null;
  private registeredClones: Map<string, RegisteredClone> = new Map();
  private pendingChallenges: Map<string, { challenge: string; expiresAt: number }> = new Map();
  private rateLimiter: Map<string, { count: number; resetAt: number }> = new Map();
  
  constructor(sdk: VivimSDK, anchor: AnchorProtocol, config: Partial<ExitNodeConfig> = {}) {
    super();
    this.sdk = sdk;
    this.anchor = anchor;
    this.config = { ...DEFAULT_EXIT_NODE_CONFIG, ...config };
  }
  
  // ============================================
  // LIFECYCLE
  // ============================================
  
  /**
   * Start the exit node service
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[ExitNode] Disabled - not starting');
      return;
    }
    
    const identity = this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity not initialized');
    }
    
    // Get current anchor state
    const anchorState = this.anchor.getCurrentAnchor();
    if (!anchorState) {
      throw new Error('Anchor not initialized');
    }
    
    // Build advertisement
    this.advertisement = {
      did: identity.did,
      peerId: identity.did, // In production, this would be the libp2p peer ID
      multiaddrs: this.config.listenAddresses,
      capabilities: anchorState.capabilities,
      supportedCloneVersions: ['1.0.0'],
      trustLevel: anchorState.trustLevel,
      anchorState,
      endpoints: {
        clone: `/ip4/0.0.0.0/tcp/${this.config.port}/clone`,
        sync: `/ip4/0.0.0.0/tcp/${this.config.port}/sync`,
        relay: `/ip4/0.0.0.0/tcp/${this.config.port}/relay`,
      },
      policy: {
        maxClones: this.config.maxClones,
        allowMigration: this.config.allowMigration,
        requireVerification: this.config.requireVerification,
      },
    };
    
    // In production: Register with DHT for discovery
    if (this.config.advertise) {
      await this.registerWithDHT(this.advertisement);
    }
    
    console.log(`[ExitNode] Started at ${this.advertisement.multiaddrs[0]}`);
    console.log(`[ExitNode] Max clones: ${this.config.maxClones}`);
    
    this.emit('advertisement:updated', { advertisement: this.advertisement });
  }
  
  /**
   * Stop the exit node service
   */
  async stop(): Promise<void> {
    // In production: Unregister from DHT
    if (this.advertisement) {
      await this.unregisterFromDHT(this.advertisement);
    }
    
    this.registeredClones.clear();
    this.pendingChallenges.clear();
    this.rateLimiter.clear();
    
    console.log('[ExitNode] Stopped');
  }
  
  // ============================================
  // ADVERTISEMENT
  // ============================================
  
  /**
   * Get current advertisement
   */
  getAdvertisement(): ExitNodeAdvertisement | null {
    return this.advertisement;
  }
  
  /**
   * Update advertisement (e.g., after anchor update)
   */
  async updateAdvertisement(): Promise<void> {
    const anchorState = this.anchor.getCurrentAnchor();
    if (!anchorState || !this.advertisement) return;
    
    this.advertisement.anchorState = anchorState;
    this.advertisement.capabilities = anchorState.capabilities;
    
    if (this.config.advertise) {
      await this.registerWithDHT(this.advertisement);
    }
    
    this.emit('advertisement:updated', { advertisement: this.advertisement });
  }
  
  // ============================================
  // CLONE REGISTRATION
  // ============================================
  
  /**
   * Handle clone registration request
   */
  async handleCloneRegistration(
    request: CloneRegistrationRequest
  ): Promise<CloneRegistrationResponse> {
    // Check rate limit
    if (!this.checkRateLimit(request.did)) {
      return {
        approved: false,
        cloneId: '',
        denialReason: 'Rate limit exceeded',
      };
    }
    
    // Verify timestamp (prevent replay)
    if (!this.isTimestampValid(request.timestamp)) {
      return {
        approved: false,
        cloneId: '',
        denialReason: 'Invalid timestamp',
      };
    }
    
    // Verify nonce uniqueness
    if (this.isNonceUsed(request.nonce)) {
      return {
        approved: false,
        cloneId: '',
        denialReason: 'Nonce already used',
      };
    }
    
    // Issue challenge if verification required
    if (this.config.requireVerification && !request.challengeResponse) {
      await this.issueChallenge(request.did, request.nonce);
      return {
        approved: false,
        cloneId: '',
        denialReason: 'Challenge required',
      };
    }
    
    // Verify identity proof
    if (this.config.requireVerification) {
      const identityValid = await this.verifyIdentityProof(request);
      if (!identityValid) {
        return {
          approved: false,
          cloneId: '',
          denialReason: 'Invalid identity proof',
        };
      }
    }
    
    // Check capacity
    if (this.registeredClones.size >= this.config.maxClones) {
      return {
        approved: false,
        cloneId: '',
        denialReason: 'Capacity exceeded',
      };
    }
    
    // Check migration policy
    if (!this.config.allowMigration) {
      return {
        approved: false,
        cloneId: '',
        denialReason: 'Migration not allowed',
      };
    }
    
    // Generate clone ID
    const cloneId = this.generateCloneId(request.did);
    
    // Create trust proof (delegation)
    const trustProof = await this.anchor.delegateTrust(request.did, 'fork');
    
    // Generate initial state snapshot
    const initialState = await this.createStateSnapshot();
    
    // Build response
    const response: CloneRegistrationResponse = {
      approved: true,
      cloneId,
      endpoints: {
        api: `/ip4/0.0.0.0/tcp/${this.config.port}/api`,
        p2p: `/p2p/${request.did}`,
      },
      trustProof,
      initialState,
    };
    
    // Register clone
    const registeredClone: RegisteredClone = {
      did: request.did,
      cloneId,
      registeredAt: Date.now(),
      lastSyncAt: Date.now(),
      trustProof,
      response,
    };
    
    this.registeredClones.set(cloneId, registeredClone);
    
    // Mark nonce as used
    this.markNonceUsed(request.nonce);
    
    this.emit('clone:registered', { clone: registeredClone, response });
    
    return response;
  }
  
  /**
   * Get registered clone by ID
   */
  getClone(cloneId: string): RegisteredClone | undefined {
    return this.registeredClones.get(cloneId);
  }
  
  /**
   * List all registered clones
   */
  listClones(): RegisteredClone[] {
    return Array.from(this.registeredClones.values());
  }
  
  /**
   * Remove a clone registration
   */
  async removeClone(cloneId: string): Promise<void> {
    const clone = this.registeredClones.get(cloneId);
    if (clone) {
      this.registeredClones.delete(cloneId);
      this.emit('clone:disconnected', { cloneId });
    }
  }
  
  // ============================================
  // PRIVATE METHODS
  // ============================================
  
  /**
   * Issue a challenge for identity verification
   */
  private async issueChallenge(did: string, nonce: string): Promise<void> {
    const challenge = crypto.randomUUID();
    const expiresAt = Date.now() + this.config.challengeTimeout;
    
    this.pendingChallenges.set(nonce, { challenge, expiresAt });
    
    // In production, send challenge to the requester via their provided endpoint
    console.log(`[ExitNode] Issued challenge for ${did}: ${challenge}`);
  }
  
  /**
   * Verify identity proof
   */
  private async verifyIdentityProof(request: CloneRegistrationRequest): Promise<boolean> {
    try {
      // Get pending challenge
      const pending = this.pendingChallenges.get(request.nonce);
      if (!pending) {
        return false;
      }
      
      // Check expiration
      if (Date.now() > pending.expiresAt) {
        this.pendingChallenges.delete(request.nonce);
        return false;
      }
      
      // Verify the challenge response
      // In production, verify the signature against the challenge
      const valid = await this.sdk.verify(
        { challenge: pending.challenge, nonce: request.nonce },
        request.identityProof,
        request.did
      );
      
      // Clean up challenge
      this.pendingChallenges.delete(request.nonce);
      
      return valid;
    } catch {
      return false;
    }
  }
  
  /**
   * Create state snapshot for clone
   */
  private async createStateSnapshot(): Promise<StateSnapshot> {
    const identity = this.sdk.getIdentity();
    const anchor = this.anchor.getCurrentAnchor();
    
    // Collect state from nodes
    const nodeStates: Record<string, unknown> = {};
    const loadedNodes = this.sdk.getLoadedNodes();
    for (const node of loadedNodes) {
      nodeStates[node.id] = { status: node.status };
    }
    
    // Build snapshot
    const snapshot: StateSnapshot = {
      snapshotId: crypto.randomUUID(),
      createdAt: Date.now(),
      sourceDid: identity?.did ?? '',
      sourceCloneId: anchor?.cloneId ?? '',
      sdkVersion: '1.0.0',
      schemaVersion: '1.0.0',
      merkleRoot: anchor?.merkleRoot ?? '',
      state: {
        identity: {
          did: identity?.did ?? '',
          publicKey: identity?.publicKey ?? '',
        },
        nodes: nodeStates,
        apps: {},
        contentManifest: null,
        socialGraph: null,
        memoryIndex: null,
      },
      signature: '', // Will be signed below
    };
    
    // Sign snapshot
    snapshot.signature = await this.sdk.sign({
      merkleRoot: snapshot.merkleRoot,
      snapshotId: snapshot.snapshotId,
    });
    
    return snapshot;
  }
  
  /**
   * Generate unique clone ID
   */
  private generateCloneId(did: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${did.substring(0, 16)}-${timestamp}-${random}`;
  }
  
  /**
   * Register with DHT (placeholder)
   */
  private async registerWithDHT(advertisement: ExitNodeAdvertisement): Promise<void> {
    // In production, this would register with the libp2p DHT
    console.log('[ExitNode] Registered with DHT');
  }
  
  /**
   * Unregister from DHT (placeholder)
   */
  private async unregisterFromDHT(advertisement: ExitNodeAdvertisement): Promise<void> {
    // In production, this would unregister from the libp2p DHT
    console.log('[ExitNode] Unregistered from DHT');
  }
  
  /**
   * Check rate limit
   */
  private checkRateLimit(did: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 10;
    
    const record = this.rateLimiter.get(did);
    
    if (!record || now > record.resetAt) {
      this.rateLimiter.set(did, { count: 1, resetAt: now + windowMs });
      return true;
    }
    
    if (record.count >= maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  /**
   * Check timestamp validity
   */
  private isTimestampValid(timestamp: number): boolean {
    const now = Date.now();
    const windowMs = 300000; // 5 minutes
    return Math.abs(now - timestamp) < windowMs;
  }
  
  /**
   * Check if nonce was used
   */
  private isNonceUsed(nonce: string): boolean {
    // In production, store nonces in a more persistent store
    return false;
  }
  
  /**
   * Mark nonce as used
   */
  private markNonceUsed(nonce: string): void {
    // In production, store in Redis or similar
  }
}

// Export types
export type {
  ExitNodeEvents,
  ExitNodeConfig,
  RegisteredClone,
};

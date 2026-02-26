/**
 * Anchor Protocol
 * 
 * Handles on-chain state anchoring for the core primitive node.
 * Provides cryptographic proofs of node state for chain of trust verification.
 * 
 * @packageDocumentation
 */

import { EventEmitter } from 'events';
import type { Identity, VivimSDK } from './sdk.js';
import { SDK_VERSION } from './constants.js';

/**
 * Trust levels in the chain of trust hierarchy
 */
export enum TrustLevel {
  GENESIS = 'genesis',           // Root anchor node
  BOOTSTRAP = 'bootstrap',       // Bootstrap/relay nodes
  PRIMARY = 'primary',           // Primary SDK instances
  SECONDARY = 'secondary',       // Verified clones
  UNVERIFIED = 'unverified',     // New/untrusted nodes
  SUSPENDED = 'suspended'        // Revoked trust
}

/**
 * Trust proof types
 */
export type ProofType = 'attestation' | 'challenge' | 'migration';

/**
 * Trust proof structure
 */
export interface TrustProof {
  type: ProofType;
  issuer: string;
  target: string;
  signature: string;
  timestamp: number;
  payload: {
    trustLevel?: TrustLevel;
    delegatedBy?: string;
    parentCloneId?: string;
    migrationType?: 'fork' | 'mirror' | 'relay';
    [key: string]: unknown;
  };
}

/**
 * Anchor state for the node
 */
export interface AnchorState {
  did: string;
  cloneId: string;
  parentId?: string;
  trustLevel: TrustLevel;
  merkleRoot: string;
  stateCid: string;
  timestamp: number;
  version: string;
  capabilities: string[];
  signature: string;
}

/**
 * State manifest containing all state references
 */
export interface StateManifest {
  identity: {
    did: string;
    publicKey: string;
    createdAt: number;
  };
  nodes: Record<string, unknown>;
  apps: Record<string, unknown>;
  contentManifest: ContentManifest | null;
  socialState: unknown;
  memoryState: unknown;
}

/**
 * Content manifest - references without full duplication
 */
export interface ContentManifest {
  version: string;
  itemCount: number;
  merkleRoot: string;
  createdAt: number;
}

/**
 * Anchor protocol configuration
 */
export interface AnchorConfig {
  /** Enable automatic anchoring */
  autoAnchor: boolean;
  /** Anchor interval in milliseconds */
  anchorInterval: number;
  /** Persist state to IPFS */
  persistToIPFS: boolean;
  /** Require signature verification */
  requireSignature: boolean;
}

/**
 * Default anchor configuration
 */
export const DEFAULT_ANCHOR_CONFIG: AnchorConfig = {
  autoAnchor: true,
  anchorInterval: 3600000, // 1 hour
  persistToIPFS: false,
  requireSignature: true,
};

/**
 * Anchor Protocol Events
 */
export interface AnchorEvents {
  'anchor:created': { anchor: AnchorState };
  'anchor:verified': { anchor: AnchorState; valid: boolean };
  'anchor:updated': { oldAnchor: AnchorState; newAnchor: AnchorState };
  'trust:delegated': { proof: TrustProof };
  'trust:revoked': { targetDid: string };
  'error': { error: Error };
}

/**
 * Anchor Protocol
 * 
 * Provides on-chain state anchoring for the VIVIM chain of trust.
 * Enables verification of node state and trust delegation.
 */
export class AnchorProtocol extends EventEmitter {
  private sdk: VivimSDK;
  private config: AnchorConfig;
  private currentAnchor: AnchorState | null = null;
  private anchorTimer: ReturnType<typeof setInterval> | null = null;
  
  constructor(sdk: VivimSDK, config: Partial<AnchorConfig> = {}) {
    super();
    this.sdk = sdk;
    this.config = { ...DEFAULT_ANCHOR_CONFIG, ...config };
  }
  
  // ============================================
  // ANCHOR LIFECYCLE
  // ============================================
  
  /**
   * Start the anchor protocol
   */
  async start(): Promise<void> {
    // Create initial anchor if needed
    if (!this.currentAnchor) {
      await this.createAnchor();
    }
    
    // Set up auto-anchoring
    if (this.config.autoAnchor) {
      this.anchorTimer = setInterval(
        () => this.createAnchor().catch(err => this.emit('error', { error: err })),
        this.config.anchorInterval
      );
    }
  }
  
  /**
   * Stop the anchor protocol
   */
  async stop(): Promise<void> {
    if (this.anchorTimer) {
      clearInterval(this.anchorTimer);
      this.anchorTimer = null;
    }
  }
  
  /**
   * Create a new anchor state for the node
   */
  async createAnchor(): Promise<AnchorState> {
    const identity = this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity not initialized');
    }
    
    // Collect current state
    const manifest = await this.collectStateManifest();
    
    // Compute merkle root
    const merkleRoot = await this.computeMerkleRoot(manifest);
    
    // Persist state (get CID)
    const stateCid = await this.persistState(manifest);
    
    // Enumerate capabilities
    const capabilities = this.enumerateCapabilities();
    
    // Build anchor state
    const anchor: AnchorState = {
      did: identity.did,
      cloneId: this.generateCloneId(),
      parentId: this.currentAnchor?.cloneId,
      trustLevel: this.currentAnchor?.trustLevel ?? TrustLevel.PRIMARY,
      merkleRoot,
      stateCid,
      timestamp: Date.now(),
      version: SDK_VERSION,
      capabilities,
      signature: '', // Will be set below
    };
    
    // Self-sign the anchor
    anchor.signature = await this.sdk.sign({
      did: anchor.did,
      cloneId: anchor.cloneId,
      merkleRoot: anchor.merkleRoot,
      stateCid: anchor.stateCid,
      timestamp: anchor.timestamp,
    });
    
    // Emit event
    const oldAnchor = this.currentAnchor;
    this.currentAnchor = anchor;
    
    if (oldAnchor) {
      this.emit('anchor:updated', { oldAnchor, newAnchor: anchor });
    } else {
      this.emit('anchor:created', { anchor });
    }
    
    return anchor;
  }
  
  /**
   * Get current anchor state
   */
  getCurrentAnchor(): AnchorState | null {
    return this.currentAnchor;
  }
  
  /**
   * Get current trust level
   */
  getTrustLevel(): TrustLevel {
    return this.currentAnchor?.trustLevel ?? TrustLevel.UNVERIFIED;
  }
  
  // ============================================
  // VERIFICATION
  // ============================================
  
  /**
   * Verify an anchor state
   */
  async verifyAnchor(anchor: AnchorState): Promise<boolean> {
    try {
      // Verify signature if required
      if (this.config.requireSignature) {
        const signatureValid = await this.sdk.verify(
          {
            did: anchor.did,
            cloneId: anchor.cloneId,
            merkleRoot: anchor.merkleRoot,
            stateCid: anchor.stateCid,
            timestamp: anchor.timestamp,
          },
          anchor.signature,
          anchor.did
        );
        
        if (!signatureValid) {
          this.emit('anchor:verified', { anchor, valid: false });
          return false;
        }
      }
      
      // Verify state CID exists
      const stateExists = await this.verifyStateCid(anchor.stateCid);
      if (!stateExists) {
        this.emit('anchor:verified', { anchor, valid: false });
        return false;
      }
      
      // Verify version compatibility
      if (!this.isVersionCompatible(anchor.version)) {
        this.emit('anchor:verified', { anchor, valid: false });
        return false;
      }
      
      this.emit('anchor:verified', { anchor, valid: true });
      return true;
      
    } catch (error) {
      this.emit('error', { error: error as Error });
      return false;
    }
  }
  
  /**
   * Verify a trust proof
   */
  async verifyTrustProof(proof: TrustProof): Promise<boolean> {
    try {
      // Verify issuer signature
      const valid = await this.sdk.verify(
        {
          type: proof.type,
          issuer: proof.issuer,
          target: proof.target,
          timestamp: proof.timestamp,
        },
        proof.signature,
        proof.issuer
      );
      
      return valid;
    } catch {
      return false;
    }
  }
  
  // ============================================
  // TRUST DELEGATION
  // ============================================
  
  /**
   * Delegate trust to a new clone
   */
  async delegateTrust(
    targetDid: string,
    migrationType: 'fork' | 'mirror' | 'relay' = 'fork'
  ): Promise<TrustProof> {
    const identity = this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity not initialized');
    }
    
    const proof: TrustProof = {
      type: 'attestation',
      issuer: identity.did,
      target: targetDid,
      signature: '', // Will be set below
      timestamp: Date.now(),
      payload: {
        trustLevel: TrustLevel.SECONDARY,
        delegatedBy: identity.did,
        parentCloneId: this.currentAnchor?.cloneId,
        migrationType,
      },
    };
    
    // Sign the proof
    proof.signature = await this.sdk.sign({
      type: proof.type,
      issuer: proof.issuer,
      target: proof.target,
      timestamp: proof.timestamp,
    });
    
    this.emit('trust:delegated', { proof });
    return proof;
  }
  
  /**
   * Revoke trust from a target
   */
  async revokeTrust(targetDid: string): Promise<void> {
    // Note: In a full implementation, this would publish a revocation to the network
    // For now, we just emit the event for local tracking
    this.emit('trust:revoked', { targetDid });
  }
  
  // ============================================
  // PRIVATE METHODS
  // ============================================
  
  /**
   * Collect current state manifest from all nodes and apps
   */
  private async collectStateManifest(): Promise<StateManifest> {
    const identity = this.sdk.getIdentity();
    
    // Collect state from nodes
    const nodeStates: Record<string, unknown> = {};
    const loadedNodes = this.sdk.getLoadedNodes();
    for (const node of loadedNodes) {
      // In a full implementation, each node would provide its serializable state
      nodeStates[node.id] = { status: node.status };
    }
    
    // Collect state from apps
    const appStates: Record<string, unknown> = {};
    // Apps would provide their serializable state here
    
    return {
      identity: {
        did: identity?.did ?? '',
        publicKey: identity?.publicKey ?? '',
        createdAt: identity?.createdAt ?? Date.now(),
      },
      nodes: nodeStates,
      apps: appStates,
      contentManifest: null,
      socialState: null,
      memoryState: null,
    };
  }
  
  /**
   * Compute merkle root from state manifest
   */
  private async computeMerkleRoot(manifest: StateManifest): Promise<string> {
    // Simple hash-based merkle root calculation
    // In production, this would use a proper merkle tree implementation
    const stateJson = JSON.stringify(manifest);
    const encoder = new TextEncoder();
    const data = encoder.encode(stateJson);
    
    // Use SHA-256 for hashing (already available in SDK)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
  
  /**
   * Persist state to storage (simulated IPFS)
   */
  private async persistState(manifest: StateManifest): Promise<string> {
    // In production, this would upload to IPFS or equivalent
    // For now, return a simulated CID based on content hash
    const stateJson = JSON.stringify(manifest);
    const encoder = new TextEncoder();
    const data = encoder.encode(stateJson);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `Qm${hashHex.substring(0, 44)}`;
  }
  
  /**
   * Verify state CID exists
   */
  private async verifyStateCid(cid: string): Promise<boolean> {
    // In production, this would check IPFS or equivalent storage
    // For now, assume all CIDs are valid
    return cid.startsWith('Qm') || cid.startsWith('bafy');
  }
  
  /**
   * Enumerate node capabilities
   */
  private enumerateCapabilities(): string[] {
    const capabilities: string[] = [
      'identity',
      'storage',
      'content',
      'social',
      'ai-chat',
      'memory',
    ];
    
    // Add app capabilities
    const loadedNodes = this.sdk.getLoadedNodes();
    for (const node of loadedNodes) {
      if (node.definition.capabilities) {
        capabilities.push(...node.definition.capabilities.map(c => c.id));
      }
    }
    
    return [...new Set(capabilities)];
  }
  
  /**
   * Generate unique clone ID
   */
  private generateCloneId(): string {
    const identity = this.sdk.getIdentity();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    
    return `${identity?.did ?? 'unknown'}-${timestamp}-${random}`;
  }
  
  /**
   * Check version compatibility
   */
  private isVersionCompatible(version: string): boolean {
    const [major] = version.split('.').map(Number);
    const [sdkMajor] = SDK_VERSION.split('.').map(Number);
    
    return major === sdkMajor;
  }
}

// Export types
export type {
  AnchorEvents,
  AnchorConfig,
  StateManifest,
};

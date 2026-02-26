/**
 * VIVIM SDK - Main Entry Point
 * The primary interface for the VIVIM decentralized platform
 */

import { EventEmitter } from 'events';
import type {
  VivimSDKConfig,
  Identity,
  CreateIdentityOptions,
  NodeInfo,
  APINodeDefinition,
  SDKEventMap,
} from './types.js';
import { DEFAULT_CONFIG, SDK_VERSION, SDK_EVENTS, ERROR_CODES } from './constants.js';
import { getLogger, Logger } from '../utils/logger.js';
import { generateKeyPair, publicKeyToDID, signData, verifySignature } from '../utils/crypto.js';
import type { TypedEventEmitter } from './types.js';

// Core Modules
import { OnChainRecordKeeper } from './recordkeeper.js';
import { AnchorProtocol } from './anchor.js';
import { SelfDesignModule } from './self-design.js';
import { VivimAssistantRuntime } from './assistant-runtime.js';

/**
 * VIVIM SDK
 * 
 * The foundation for all nodes and applications.
 * Provides identity management, node loading, and network coordination.
 */
export class VivimSDK extends (EventEmitter as new () => TypedEventEmitter<SDKEventMap>) {
  private config: Required<VivimSDKConfig>;
  private identity: Identity | null = null;
  private privateKey: Uint8Array | null = null;
  private nodes: Map<string, NodeInfo> = new Map();
  private nodeInstances: Map<string, unknown> = new Map();
  private initialized = false;
  private logger: Logger;

  // Core Module Instances
  public readonly recordKeeper: OnChainRecordKeeper;
  public readonly anchor: AnchorProtocol;
  public readonly selfDesign: SelfDesignModule;
  public readonly assistant: VivimAssistantRuntime;

  constructor(config: VivimSDKConfig = {}) {
    super();
    this.config = this.mergeConfig(config);
    this.logger = getLogger().child('SDK');
    
    // Initialize Core Modules
    this.recordKeeper = new OnChainRecordKeeper(this);
    this.anchor = new AnchorProtocol(this);
    this.selfDesign = new SelfDesignModule(this);
    this.assistant = new VivimAssistantRuntime(this);

    this.logger.info('VIVIM SDK initialized', { version: SDK_VERSION });
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  private mergeConfig(config: VivimSDKConfig): Required<VivimSDKConfig> {
    return {
      identity: {
        did: config.identity?.did,
        seed: config.identity?.seed,
        autoCreate: config.identity?.autoCreate ?? DEFAULT_CONFIG.IDENTITY.AUTO_CREATE,
      },
      network: {
        bootstrapNodes: config.network?.bootstrapNodes ?? [],
        relays: config.network?.relays ?? [],
        listenAddresses: config.network?.listenAddresses ?? [],
        enableP2P: config.network?.enableP2P ?? DEFAULT_CONFIG.NETWORK.ENABLE_P2P,
      },
      storage: {
        defaultLocation: config.storage?.defaultLocation ?? DEFAULT_CONFIG.STORAGE.DEFAULT_LOCATION,
        ipfsGateway: config.storage?.ipfsGateway,
        encryption: config.storage?.encryption ?? DEFAULT_CONFIG.STORAGE.ENCRYPTION,
      },
      nodes: {
        autoLoad: config.nodes?.autoLoad ?? DEFAULT_CONFIG.NODES.AUTO_LOAD,
        registries: config.nodes?.registries ?? [],
        trustedPublishers: config.nodes?.trustedPublishers ?? [],
      },
      extensions: {
        autoLoad: config.extensions?.autoLoad ?? DEFAULT_CONFIG.EXTENSIONS.AUTO_LOAD,
        directories: config.extensions?.directories ?? [],
        registries: config.extensions?.registries ?? [],
      },
    };
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize the SDK
   * This must be called before using any SDK functionality
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('SDK already initialized');
      return;
    }

    this.logger.info('Initializing SDK...');

    // Initialize identity
    await this.initializeIdentity();

    // Load auto-load nodes
    if (this.config.nodes.autoLoad) {
      await this.loadBuiltinNodes();
    }

    this.initialized = true;
    
    // Start core protocols
    await this.anchor.start();
    
    this.logger.info('SDK initialized successfully', { did: this.identity?.did });
  }

  /**
   * Get the Record Keeper instance
   */
  getRecordKeeper(): OnChainRecordKeeper {
    return this.recordKeeper;
  }

  /**
   * Get the Anchor Protocol instance
   */
  getAnchorProtocol(): AnchorProtocol {
    return this.anchor;
  }

  /**
   * Get the Self-Design Module instance
   */
  getSelfDesign(): SelfDesignModule {
    return this.selfDesign;
  }

  /**
   * Get the Self-Design Graph (compatible with legacy API if needed)
   */
  getSelfDesignGraph(): SelfDesignModule {
    return this.selfDesign;
  }

  /**
   * Wait for network connection
   */
  async waitForConnection(timeout = 30000): Promise<void> {
    // In standalone mode, this is a no-op
    // When integrated with network engine, this would wait for libp2p connection
    this.logger.debug('waitForConnection called (standalone mode - immediate resolve)');
    await Promise.resolve();
  }

  // ============================================
  // IDENTITY MANAGEMENT
  // ============================================

  private async initializeIdentity(): Promise<void> {
    if (this.config.identity.did && this.config.identity.seed) {
      // Restore existing identity from seed
      const { publicKey, privateKey } = await generateKeyPair(this.config.identity.seed);
      this.privateKey = privateKey;
      
      this.identity = {
        did: this.config.identity.did,
        publicKey: Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
        keyType: 'Ed25519',
        createdAt: Date.now(),
        verificationLevel: 0,
      };
      
      this.emit('identity:loaded', { identity: this.identity });
      this.logger.info('Identity loaded', { did: this.identity.did });
    } else if (this.config.identity.autoCreate) {
      // Create new identity
      await this.createIdentity();
    }
  }

  /**
   * Get current identity
   */
  getIdentity(): Identity | null {
    return this.identity;
  }

  /**
   * Create new identity
   */
  async createIdentity(options: CreateIdentityOptions = {}): Promise<Identity> {
    if (this.identity && !options.seed) {
      return this.identity;
    }

    this.logger.info('Creating new identity');

    const { publicKey, privateKey } = await generateKeyPair(options.seed);
    this.privateKey = privateKey;

    this.identity = {
      did: publicKeyToDID(publicKey),
      publicKey: Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
      keyType: options.keyType || 'Ed25519',
      displayName: options.displayName,
      createdAt: Date.now(),
      verificationLevel: 0,
    };

    this.emit('identity:created', { identity: this.identity });
    this.logger.info('Identity created', { did: this.identity.did });

    return this.identity;
  }

  /**
   * Sign data with current identity
   */
  async sign(data: unknown): Promise<string> {
    if (!this.privateKey) {
      throw new Error(ERROR_CODES.IDENTITY_NOT_INITIALIZED);
    }
    return signData(data, this.privateKey);
  }

  /**
   * Verify signature
   */
  async verify(data: unknown, signature: string, publicKeyOrDID: string): Promise<boolean> {
    return verifySignature(data, signature, publicKeyOrDID);
  }

  // ============================================
  // NODE MANAGEMENT
  // ============================================

  private async loadBuiltinNodes(): Promise<void> {
    this.logger.debug('Loading built-in nodes...');
    // Built-in nodes are loaded lazily when accessed
    // This just validates that they're available
  }

  /**
   * Load a node by ID
   */
  async loadNode<T = unknown>(nodeId: string): Promise<T> {
    // Check if already loaded
    const cached = this.nodeInstances.get(nodeId);
    if (cached) {
      return cached as T;
    }

    // Check if we have the node info
    const nodeInfo = this.nodes.get(nodeId);
    if (nodeInfo) {
      return nodeInfo as T;
    }

    // Try to load built-in node
    const node = await this.loadBuiltinNode<T>(nodeId);
    if (node) {
      this.nodeInstances.set(nodeId, node);
      return node;
    }

    throw new Error(`${ERROR_CODES.NODE_NOT_FOUND}: ${nodeId}`);
  }

  private async loadBuiltinNode<T>(nodeId: string): Promise<T | null> {
    // Import nodes dynamically to avoid circular dependencies
    const { BUILTIN_NODES } = await import('./constants.js');
    
    switch (nodeId) {
      case BUILTIN_NODES.IDENTITY: {
        const { IdentityNode } = await import('../nodes/identity-node.js');
        return new IdentityNode(this) as T;
      }
      case BUILTIN_NODES.STORAGE: {
        const { StorageNode } = await import('../nodes/storage-node.js');
        return new StorageNode(this) as T;
      }
      case BUILTIN_NODES.CONTENT: {
        const { ContentNode } = await import('../nodes/content-node.js');
        return new ContentNode(this) as T;
      }
      case BUILTIN_NODES.SOCIAL: {
        const { SocialNode } = await import('../nodes/social-node.js');
        return new SocialNode(this) as T;
      }
      case BUILTIN_NODES.AI_CHAT: {
        const { AIChatNode } = await import('../nodes/ai-chat-node.js');
        return new AIChatNode(this) as T;
      }
      case BUILTIN_NODES.MEMORY: {
        const { MemoryNode } = await import('../nodes/memory-node.js');
        return new MemoryNode(this) as T;
      }
      default:
        return null;
    }
  }

  /**
   * Register a custom node
   */
  async registerNode(definition: APINodeDefinition): Promise<string> {
    const nodeInfo: NodeInfo = {
      id: definition.id,
      type: 'api',
      definition,
      status: 'ready',
      loadedAt: Date.now(),
    };

    this.nodes.set(definition.id, nodeInfo);
    this.emit('node:loaded', { node: nodeInfo });
    this.logger.info('Node registered', { nodeId: definition.id });

    return definition.id;
  }

  /**
   * Unload a node
   */
  async unloadNode(nodeId: string): Promise<void> {
    this.nodeInstances.delete(nodeId);
    this.nodes.delete(nodeId);
    this.logger.info('Node unloaded', { nodeId });
  }

  /**
   * List all loaded nodes
   */
  getLoadedNodes(): NodeInfo[] {
    return Array.from(this.nodes.values());
  }

  // ============================================
  // STORAGE ACCESS
  // ============================================

  /**
   * Get storage node
   */
  async getStorageNode(): Promise<import('../nodes/storage-node.js').StorageNode> {
    return this.loadNode<import('../nodes/storage-node.js').StorageNode>(
      (await import('./constants.js')).BUILTIN_NODES.STORAGE
    );
  }

  /**
   * Get content node
   */
  async getContentNode(): Promise<import('../nodes/content-node.js').ContentNode> {
    return this.loadNode<import('../nodes/content-node.js').ContentNode>(
      (await import('./constants.js')).BUILTIN_NODES.CONTENT
    );
  }

  // ============================================
  // SOCIAL ACCESS
  // ============================================

  /**
   * Get social node
   */
  async getSocialNode(): Promise<import('../nodes/social-node.js').SocialNode> {
    return this.loadNode<import('../nodes/social-node.js').SocialNode>(
      (await import('./constants.js')).BUILTIN_NODES.SOCIAL
    );
  }

  // ============================================
  // AI ACCESS
  // ============================================

  /**
   * Get AI chat node
   */
  async getAIChatNode(): Promise<import('../nodes/ai-chat-node.js').AIChatNode> {
    return this.loadNode<import('../nodes/ai-chat-node.js').AIChatNode>(
      (await import('./constants.js')).BUILTIN_NODES.AI_CHAT
    );
  }

  /**
   * Get memory node
   */
  async getMemoryNode(): Promise<import('../nodes/memory-node.js').MemoryNode> {
    return this.loadNode<import('../nodes/memory-node.js').MemoryNode>(
      (await import('./constants.js')).BUILTIN_NODES.MEMORY
    );
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Destroy the SDK and clean up resources
   */
  async destroy(): Promise<void> {
    this.logger.info('Destroying SDK...');

    // Clear all nodes
    for (const nodeId of this.nodeInstances.keys()) {
      await this.unloadNode(nodeId);
    }

    // Clear identity
    this.identity = null;
    this.privateKey = null;
    this.initialized = false;

    // Remove all listeners
    this.removeAllListeners();

    this.logger.info('SDK destroyed');
  }
}

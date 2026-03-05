# VIVIM SDK Documentation

## Open-Source E2E Self-Contained Toolkit

This document defines the complete SDK architecture for VIVIM - an extensible, decentralized platform where developers can build, extend, and contribute to a growing network of API nodes and SDK components.

---

# PART 1: SDK OVERVIEW

## 1.1 Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VIVIM SDK ECOSYSTEM                                   │
│                                                                              │
│                         ┌─────────────────┐                                  │
│                         │   CORE SDK      │                                  │
│                         │   (vivim-sdk)   │                                  │
│                         └────────┬────────┘                                  │
│                                  │                                           │
│          ┌───────────────────────┼───────────────────────┐                   │
│          │                       │                       │                   │
│          ▼                       ▼                       ▼                   │
│   ┌──────────────┐       ┌──────────────┐       ┌──────────────┐            │
│   │  API NODES   │       │  SDK NODES   │       │ NETWORK NODES│            │
│   │              │       │              │       │              │            │
│   │ • Identity   │       │ • React Kit  │       │ • Bootstrap  │            │
│   │ • Storage    │       │ • Vue Kit    │       │ • Relay      │            │
│   │ • AI Chat    │       │ • Svelte Kit │       │ • Indexer    │            │
│   │ • Social     │       │ • Flutter    │       │ • Anchor     │            │
│   │ • Memory     │       │ • React Nat. │       │              │            │
│   └──────┬───────┘       └──────┬───────┘       └──────┬───────┘            │
│          │                      │                      │                     │
│          └──────────────────────┴──────────────────────┘                     │
│                                 │                                            │
│                                 ▼                                            │
│                    ┌────────────────────────┐                                │
│                    │    NETWORK GRAPH       │                                │
│                    │    (P2P Mesh)          │                                │
│                    │                        │                                │
│                    │  ○──○──○──○──○         │                                │
│                    │  │  │  │  │  │         │                                │
│                    │  ○──○──○──○──○         │                                │
│                    │  │  │  │  │  │         │                                │
│                    │  ○──○──○──○──○         │                                │
│                    └────────────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Node Types

| Node Type | Description | Can Create | Can Extend |
|-----------|-------------|------------|------------|
| **API Node** | Core functionality module | Anyone | Anyone |
| **SDK Node** | Platform/framework adapter | Anyone | Anyone |
| **Network Node** | Infrastructure component | Anyone | Anyone |
| **Composite Node** | Combination of nodes | Anyone | Anyone |

## 1.3 Design Principles

1. **Modular**: Every feature is an independent node
2. **Extensible**: Users can extend any node
3. **Composable**: Nodes can be combined
4. **Discoverable**: Nodes publish capabilities to network
5. **Versioned**: Semantic versioning with migration paths
6. **Isolated**: Nodes run in isolated contexts
7. **Permissionless**: Anyone can add nodes to the graph

---

# PART 2: SDK ARCHITECTURE

## 2.1 Package Structure

```
@vivim/
├── sdk                          # Core SDK
│   ├── core                     # Core types and utilities
│   ├── client                   # Chain client
│   ├── node-runner              # Node execution runtime
│   └── graph-manager            # Network graph management
│
├── nodes-api                    # Official API Nodes
│   ├── node-identity            # DID/identity management
│   ├── node-storage             # Distributed storage
│   ├── node-content             # Content management
│   ├── node-social              # Social graph
│   ├── node-ai-chat             # AI chat runtime
│   ├── node-memory              # Knowledge/memory
│   ├── node-capture             # Web capture
│   └── node-analytics           # Analytics (optional)
│
├── nodes-sdk                    # Official SDK Nodes
│   ├── sdk-react                # React components
│   ├── sdk-vue                  # Vue components
│   ├── sdk-svelte               # Svelte components
│   ├── sdk-flutter              # Flutter widgets
│   ├── sdk-react-native         # React Native
│   └── sdk-node                 # Node.js server
│
├── nodes-network                # Network Infrastructure
│   ├── node-bootstrap           # Bootstrap/relay server
│   ├── node-indexer             # Content indexer
│   ├── node-anchor              # Blockchain anchor
│   └── node-gateway             # IPFS/HTTP gateway
│
└── cli                          # Developer CLI
    ├── create-app               # Scaffold new app
    ├── create-node              # Scaffold new node
    ├── publish-node             # Publish to registry
    └── dev                      # Local development
```

## 2.2 Core SDK Architecture

```typescript
// @vivim/sdk/core

/**
 * VIVIM SDK Core
 * The foundation for all nodes and applications
 */
export interface VivimSDKConfig {
  // Identity
  identity?: {
    did?: string;
    seed?: Uint8Array;
    autoCreate?: boolean;
  };
  
  // Network
  network?: {
    bootstrapNodes?: string[];
    relays?: string[];
    listenAddresses?: string[];
  };
  
  // Storage
  storage?: {
    defaultLocation?: 'local' | 'ipfs' | 'filecoin';
    ipfsGateway?: string;
    encryption?: boolean;
  };
  
  // Nodes
  nodes?: {
    autoLoad?: boolean;
    registries?: string[];
    trustedPublishers?: string[];
  };
}

export class VivimSDK {
  private config: VivimSDKConfig;
  private graph: NetworkGraph;
  private nodeRegistry: NodeRegistry;
  private identity: IdentityManager;
  
  constructor(config: VivimSDKConfig) {
    this.config = config;
    this.graph = new NetworkGraph();
    this.nodeRegistry = new NodeRegistry();
    this.identity = new IdentityManager(config.identity);
  }
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Initialize the SDK
   */
  async initialize(): Promise<void>;
  
  /**
   * Wait for network connection
   */
  async waitForConnection(): Promise<void>;
  
  // ============================================
  // NODE MANAGEMENT
  // ============================================
  
  /**
   * Load a node by ID
   */
  async loadNode<T extends APINode>(nodeId: string): Promise<T>;
  
  /**
   * Register a custom node
   */
  async registerNode(node: APINodeDefinition): Promise<string>;
  
  /**
   * Unload a node
   */
  async unloadNode(nodeId: string): Promise<void>;
  
  /**
   * List all loaded nodes
   */
  getLoadedNodes(): NodeInfo[];
  
  // ============================================
  // GRAPH OPERATIONS
  // ============================================
  
  /**
   * Get the network graph
   */
  getGraph(): NetworkGraph;
  
  /**
   * Find nodes by capability
   */
  findNodes(capability: string): NodeInfo[];
  
  /**
   * Connect nodes
   */
  connectNodes(nodeA: string, nodeB: string, edge?: EdgeDefinition): Promise<void>;
  
  // ============================================
  // IDENTITY
  // ============================================
  
  /**
   * Get current identity
   */
  getIdentity(): Identity;
  
  /**
   * Create new identity
   */
  async createIdentity(): Promise<Identity>;
  
  // ============================================
  // CLIENT ACCESS
  // ============================================
  
  /**
   * Get chain client
   */
  getChainClient(): ChainClient;
  
  /**
   * Get content client
   */
  getContentClient(): ContentClient;
}
```

---

# PART 3: API NODE SPECIFICATION

## 3.1 Node Definition Schema

```typescript
// @vivim/sdk/core/types

/**
 * API Node Definition
 * The contract that every API node must fulfill
 */
export interface APINodeDefinition {
  // === Identity ===
  id: string;                          // Unique node ID: @scope/node-name
  name: string;                        // Human-readable name
  version: string;                     // Semantic version
  description: string;
  author: string;                      // DID or handle
  license: string;
  
  // === Capabilities ===
  capabilities: NodeCapability[];
  
  // === Dependencies ===
  dependencies: {
    nodes?: string[];                  // Other nodes this depends on
    packages?: string[];               // NPM packages needed
  };
  
  // === Configuration Schema ===
  configSchema: JSONSchema;            // JSON Schema for config validation
  
  // === Events ===
  events: {
    emits: string[];                   // Events this node emits
    listens: string[];                 // Events this node listens to
  };
  
  // === Methods ===
  methods: MethodDefinition[];
  
  // === Lifecycle ===
  lifecycle: {
    init: string;                      // Initialization function
    start: string;                     // Start function
    stop: string;                      // Stop function
    destroy: string;                   // Cleanup function
  };
  
  // === Extension Points ===
  extensionPoints?: ExtensionPoint[];
  
  // === Security ===
  permissions: Permission[];
}

export interface NodeCapability {
  id: string;
  name: string;
  description: string;
  inputSchema?: JSONSchema;
  outputSchema?: JSONSchema;
}

export interface MethodDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
  returns: JSONSchema;
  requiresAuth?: boolean;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

export interface ExtensionPoint {
  id: string;
  name: string;
  description: string;
  interface: string;                   // Interface that extensions must implement
}

export interface Permission {
  type: 'identity' | 'storage' | 'network' | 'memory' | 'social';
  access: 'read' | 'write' | 'admin';
  scope?: string;
}
```

## 3.2 Node Implementation Template

```typescript
// Template for creating a new API node

import { 
  APINode, 
  NodeContext, 
  NodeConfig,
  EventMap 
} from '@vivim/sdk/core';

/**
 * Example API Node: Custom Analytics
 */
export interface AnalyticsNodeConfig extends NodeConfig {
  trackingEnabled: boolean;
  anonymize: boolean;
  retentionDays: number;
}

export interface AnalyticsNodeEvents extends EventMap {
  'analytics:event': { type: string; data: any; timestamp: number };
  'analytics:report': { reportId: string; metrics: any };
}

export class AnalyticsNode extends APINode<AnalyticsNodeConfig, AnalyticsNodeEvents> {
  static definition: APINodeDefinition = {
    id: '@vivim/node-analytics',
    name: 'Analytics Node',
    version: '1.0.0',
    description: 'Privacy-respecting analytics for VIVIM apps',
    author: '@vivim',
    license: 'MIT',
    
    capabilities: [
      {
        id: 'track',
        name: 'Track Event',
        description: 'Track a user interaction event',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            data: { type: 'object' },
          },
          required: ['type'],
        },
      },
      {
        id: 'report',
        name: 'Generate Report',
        description: 'Generate analytics report',
        outputSchema: {
          type: 'object',
          properties: {
            reportId: { type: 'string' },
            metrics: { type: 'object' },
          },
        },
      },
    ],
    
    dependencies: {
      nodes: ['@vivim/node-identity'],
      packages: [],
    },
    
    configSchema: {
      type: 'object',
      properties: {
        trackingEnabled: { type: 'boolean', default: true },
        anonymize: { type: 'boolean', default: true },
        retentionDays: { type: 'number', default: 30 },
      },
    },
    
    events: {
      emits: ['analytics:event', 'analytics:report'],
      listens: ['identity:login', 'identity:logout'],
    },
    
    methods: [
      {
        name: 'track',
        description: 'Track an event',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            data: { type: 'object' },
          },
        },
        returns: { type: 'boolean' },
      },
      {
        name: 'getReport',
        description: 'Get analytics report',
        parameters: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        returns: { type: 'object' },
      },
    ],
    
    lifecycle: {
      init: 'init',
      start: 'start',
      stop: 'stop',
      destroy: 'destroy',
    },
    
    permissions: [
      { type: 'identity', access: 'read' },
      { type: 'storage', access: 'write', scope: 'analytics' },
    ],
  };
  
  // ============================================
  // LIFECYCLE
  // ============================================
  
  async init(context: NodeContext): Promise<void> {
    // Initialize storage
    this.storage = context.getStorage('analytics');
    
    // Subscribe to identity events
    context.on('identity:login', this.handleLogin);
    context.on('identity:logout', this.handleLogout);
  }
  
  async start(): Promise<void> {
    // Start background processing
    this.startAggregation();
  }
  
  async stop(): Promise<void> {
    // Stop background tasks
    this.stopAggregation();
  }
  
  async destroy(): Promise<void> {
    // Cleanup resources
    this.storage = null;
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Track an event
   */
  async track(type: string, data?: any): Promise<boolean> {
    if (!this.config.trackingEnabled) {
      return false;
    }
    
    const event = {
      id: this.generateId(),
      type,
      data: this.config.anonymize ? this.anonymize(data) : data,
      timestamp: Date.now(),
      identity: this.config.anonymize ? null : context.getIdentity().did,
    };
    
    await this.storage.put(`events/${event.id}`, event);
    
    this.emit('analytics:event', event);
    
    return true;
  }
  
  /**
   * Get analytics report
   */
  async getReport(startDate: Date, endDate: Date): Promise<AnalyticsReport> {
    const events = await this.storage.query('events', {
      timestamp: { $gte: startDate.getTime(), $lte: endDate.getTime() },
    });
    
    return this.aggregateReport(events);
  }
  
  // ============================================
  // PRIVATE
  // ============================================
  
  private handleLogin = (event: IdentityEvent): void => {
    this.track('login', { method: event.method });
  };
  
  private handleLogout = (): void => {
    this.track('logout');
  };
  
  private anonymize(data: any): any {
    // Remove PII
    const { ip, userAgent, ...rest } = data || {};
    return rest;
  }
}
```

## 3.3 Built-in API Nodes

### @vivim/node-identity

```typescript
export interface IdentityNodeAPI {
  // Core
  getIdentity(): Promise<Identity | null>;
  createIdentity(options?: CreateIdentityOptions): Promise<Identity>;
  importIdentity(seed: Uint8Array): Promise<Identity>;
  
  // Keys
  getPublicKey(): Promise<string>;
  sign(data: Uint8Array): Promise<Signature>;
  verify(data: Uint8Array, signature: Signature, publicKey: string): Promise<boolean>;
  
  // Profile
  getProfile(): Promise<Profile>;
  updateProfile(updates: Partial<Profile>): Promise<void>;
  
  // Recovery
  generateRecoveryPhrase(): Promise<string>;
  verifyRecoveryPhrase(phrase: string): Promise<boolean>;
  
  // Verification
  linkExternalIdentity(provider: string, token: string): Promise<void>;
  unlinkExternalIdentity(provider: string): Promise<void>;
  getLinkedIdentities(): Promise<LinkedIdentity[]>;
}
```

### @vivim/node-storage

```typescript
export interface StorageNodeAPI {
  // Content
  store(data: Uint8Array | object, options?: StoreOptions): Promise<StorageResult>;
  retrieve(cid: string): Promise<Uint8Array>;
  exists(cid: string): Promise<boolean>;
  
  // Pinning
  pin(cid: string): Promise<void>;
  unpin(cid: string): Promise<void>;
  getPins(): Promise<PinInfo[]>;
  
  // Deals
  createDeal(cid: string, options: DealOptions): Promise<StorageDeal>;
  getDeal(dealId: string): Promise<StorageDeal>;
  listDeals(): Promise<StorageDeal[]>;
  
  // Providers
  findProviders(options?: ProviderSearchOptions): Promise<ProviderInfo[]>;
  getProviderReputation(providerId: string): Promise<ProviderReputation>;
  
  // Status
  getStatus(): Promise<StorageStatus>;
}
```

### @vivim/node-content

```typescript
export interface ContentNodeAPI {
  // CRUD
  create(type: ContentType, data: ContentData, options?: ContentOptions): Promise<ContentObject>;
  get(cid: string): Promise<ContentObject>;
  update(cid: string, updates: Partial<ContentData>): Promise<ContentObject>;
  delete(cid: string): Promise<void>;
  
  // Discovery
  getFeed(options?: FeedOptions): Promise<ContentObject[]>;
  search(query: SearchQuery): Promise<ContentObject[]>;
  getByAuthor(did: string, options?: PaginationOptions): Promise<ContentObject[]>;
  
  // Interactions
  like(cid: string): Promise<void>;
  unlike(cid: string): Promise<void>;
  comment(cid: string, text: string): Promise<ContentObject>;
  share(cid: string, options: ShareOptions): Promise<ContentObject>;
  
  // Visibility
  setVisibility(cid: string, visibility: VisibilitySettings): Promise<void>;
  getVisibility(cid: string): Promise<VisibilitySettings>;
}
```

### @vivim/node-social

```typescript
export interface SocialNodeAPI {
  // Follows
  follow(did: string): Promise<void>;
  unfollow(did: string): Promise<void>;
  getFollowers(did: string): Promise<string[]>;
  getFollowing(did: string): Promise<string[]>;
  
  // Friends
  sendFriendRequest(did: string): Promise<void>;
  acceptFriendRequest(requestId: string): Promise<void>;
  rejectFriendRequest(requestId: string): Promise<void>;
  getFriends(): Promise<FriendInfo[]>;
  getPendingRequests(): Promise<FriendRequest[]>;
  
  // Circles
  createCircle(name: string, options?: CircleOptions): Promise<Circle>;
  getCircle(circleId: string): Promise<Circle>;
  updateCircle(circleId: string, updates: Partial<Circle>): Promise<void>;
  deleteCircle(circleId: string): Promise<void>;
  addCircleMember(circleId: string, did: string): Promise<void>;
  removeCircleMember(circleId: string, did: string): Promise<void>;
  
  // Blocking
  block(did: string): Promise<void>;
  unblock(did: string): Promise<void>;
  getBlocked(): Promise<string[]>;
}
```

### @vivim/node-ai-chat

```typescript
export interface AIChatNodeAPI {
  // Conversations
  createConversation(options?: ConversationOptions): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation>;
  listConversations(): Promise<Conversation[]>;
  deleteConversation(id: string): Promise<void>;
  
  // Messages
  sendMessage(conversationId: string, content: string, options?: MessageOptions): Promise<Message>;
  getMessages(conversationId: string, options?: PaginationOptions): Promise<Message[]>;
  editMessage(messageId: string, newContent: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  
  // Streaming
  streamMessage(conversationId: string, content: string): AsyncIterable<MessageChunk>;
  
  // Context
  setSystemPrompt(conversationId: string, prompt: string): Promise<void>;
  addContext(conversationId: string, context: ContextItem): Promise<void>;
  clearContext(conversationId: string): Promise<void>;
  
  // Models
  listModels(): Promise<ModelInfo[]>;
  setModel(conversationId: string, modelId: string): Promise<void>;
}
```

### @vivim/node-memory

```typescript
export interface MemoryNodeAPI {
  // CRUD
  create(data: MemoryData): Promise<Memory>;
  get(id: string): Promise<Memory>;
  update(id: string, updates: Partial<MemoryData>): Promise<Memory>;
  delete(id: string): Promise<void>;
  
  // Search
  search(query: MemoryQuery): Promise<Memory[]>;
  findSimilar(memoryId: string, limit?: number): Promise<Memory[]>;
  
  // Relationships
  link(sourceId: string, targetId: string, relationType: string): Promise<void>;
  unlink(sourceId: string, targetId: string): Promise<void>;
  getRelated(memoryId: string): Promise<MemoryRelation[]>;
  
  // Knowledge Graph
  getKnowledgeGraph(options?: GraphOptions): Promise<KnowledgeGraph>;
  
  // Extraction
  extractFromConversation(conversationId: string): Promise<Memory[]>;
}
```

---

# PART 4: SDK NODE SPECIFICATION

## 4.1 SDK Node Definition

```typescript
/**
 * SDK Node Definition
 * Platform/framework adapters for VIVIM
 */
export interface SDKNodeDefinition {
  // === Identity ===
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  
  // === Platform ===
  platform: 'react' | 'vue' | 'svelte' | 'flutter' | 'react-native' | 'node' | 'web' | 'custom';
  peerDependencies: Record<string, string>;
  
  // === Components ===
  components: ComponentDefinition[];
  
  // === Hooks/Composables ===
  hooks: HookDefinition[];
  
  // === Providers ===
  providers: ProviderDefinition[];
  
  // === Styling ===
  styling: {
    framework: 'tailwind' | 'css' | 'styled-components' | 'emotion' | 'none';
    themeable: boolean;
  };
  
  // === API Nodes Required ===
  requiredNodes: string[];
  
  // === Extensions ===
  extensionPoints?: SDKExtensionPoint[];
}
```

## 4.2 React SDK Node Example

```typescript
// @vivim/sdk-react

import { SDKNode, ComponentDefinition, HookDefinition } from '@vivim/sdk/core';

export const ReactSDKDefinition: SDKNodeDefinition = {
  id: '@vivim/sdk-react',
  name: 'VIVIM React SDK',
  version: '1.0.0',
  description: 'React components and hooks for VIVIM',
  author: '@vivim',
  license: 'MIT',
  
  platform: 'react',
  peerDependencies: {
    'react': '^18.0.0',
    'react-dom': '^18.0.0',
  },
  
  components: [
    {
      name: 'VivimProvider',
      description: 'Root provider for VIVIM functionality',
      props: {
        config: { type: 'VivimSDKConfig', required: true },
        children: { type: 'ReactNode', required: true },
      },
    },
    {
      name: 'IdentityProvider',
      description: 'Identity context provider',
      props: {},
    },
    {
      name: 'ChatThread',
      description: 'AI chat thread component',
      props: {
        conversationId: { type: 'string', required: false },
        onMessage: { type: 'function', required: false },
      },
    },
    {
      name: 'ContentComposer',
      description: 'Content creation component',
      props: {
        defaultVisibility: { type: 'VisibilityLevel', required: false },
        onPost: { type: 'function', required: false },
      },
    },
    {
      name: 'StorageDashboard',
      description: 'Storage management UI',
      props: {},
    },
    {
      name: 'VisibilitySelector',
      description: 'Visibility/privacy selector',
      props: {
        value: { type: 'VisibilitySettings', required: true },
        onChange: { type: 'function', required: true },
      },
    },
    {
      name: 'MemoryExplorer',
      description: 'AI memory browser',
      props: {
        onSelect: { type: 'function', required: false },
      },
    },
    {
      name: 'CircleManager',
      description: 'Circle/group management',
      props: {},
    },
    {
      name: 'Feed',
      description: 'Content feed display',
      props: {
        type: { type: "'following' | 'discover' | 'circle'", required: false },
        circleId: { type: 'string', required: false },
      },
    },
    {
      name: 'ProfileCard',
      description: 'User profile card',
      props: {
        did: { type: 'string', required: true },
      },
    },
    {
      name: 'NetworkStatus',
      description: 'Network connection status',
      props: {},
    },
    {
      name: 'OfflineIndicator',
      description: 'Offline mode notification',
      props: {},
    },
  ],
  
  hooks: [
    {
      name: 'useVivim',
      description: 'Access SDK instance',
      returns: 'VivimSDK',
    },
    {
      name: 'useIdentity',
      description: 'Identity management',
      returns: '{ identity, createIdentity, signIn, signOut }',
    },
    {
      name: 'useStorage',
      description: 'Storage operations',
      returns: '{ store, retrieve, pin, unpin, status }',
    },
    {
      name: 'useContent',
      description: 'Content operations',
      returns: '{ create, get, update, delete, feed, search }',
    },
    {
      name: 'useChat',
      description: 'AI chat operations',
      returns: '{ conversations, messages, sendMessage, stream }',
    },
    {
      name: 'useMemory',
      description: 'Memory/knowledge operations',
      returns: '{ memories, create, search, link }',
    },
    {
      name: 'useSocial',
      description: 'Social graph operations',
      returns: '{ follow, friends, circles }',
    },
    {
      name: 'useNetwork',
      description: 'Network status and peers',
      returns: '{ status, peers, connect }',
    },
    {
      name: 'useOfflineQueue',
      description: 'Offline operations queue',
      returns: '{ pending, process, clear }',
    },
    {
      name: 'useSync',
      description: 'Synchronization status',
      returns: '{ isSyncing, lastSync, progress, sync }',
    },
  ],
  
  providers: [
    {
      name: 'VivimProvider',
      description: 'Root SDK provider',
      wraps: ['IdentityProvider', 'NetworkProvider', 'StorageProvider'],
    },
    {
      name: 'IdentityProvider',
      description: 'Identity context',
      provides: ['useIdentity'],
    },
    {
      name: 'ThemeProvider',
      description: 'UI theming',
      provides: ['useTheme'],
    },
  ],
  
  styling: {
    framework: 'tailwind',
    themeable: true,
  },
  
  requiredNodes: [
    '@vivim/node-identity',
    '@vivim/node-storage',
  ],
  
  extensionPoints: [
    {
      id: 'chat-message-renderer',
      description: 'Custom message type renderers',
      interface: 'MessageRenderer',
    },
    {
      id: 'content-card',
      description: 'Custom content card variants',
      interface: 'ContentCardRenderer',
    },
    {
      id: 'visibility-preset',
      description: 'Custom visibility presets',
      interface: 'VisibilityPreset',
    },
  ],
};
```

## 4.3 React SDK Usage

```typescript
// App.tsx

import { 
  VivimProvider, 
  IdentityProvider,
  ChatThread,
  ContentComposer,
  Feed,
  StorageDashboard,
  useIdentity,
  useChat,
} from '@vivim/sdk-react';

function App() {
  return (
    <VivimProvider config={{
      network: {
        bootstrapNodes: ['/dns4/bootstrap.vivim.net/tcp/443/wss/p2p/...'],
      },
      storage: {
        defaultLocation: 'ipfs',
        encryption: true,
      },
    }}>
      <IdentityProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/compose" element={<ComposePage />} />
            <Route path="/settings/storage" element={<StorageDashboard />} />
          </Routes>
        </Layout>
      </IdentityProvider>
    </VivimProvider>
  );
}

// pages/ChatPage.tsx
function ChatPage() {
  const { identity } = useIdentity();
  const { conversations, createConversation } = useChat();
  
  if (!identity) {
    return <SignInPrompt />;
  }
  
  return (
    <div className="flex h-screen">
      <aside className="w-80 border-r">
        <ConversationList conversations={conversations} />
        <Button onClick={() => createConversation()}>
          New Chat
        </Button>
      </aside>
      <main className="flex-1">
        <ChatThread />
      </main>
    </div>
  );
}

// hooks/useCustomMemory.ts - Custom extension
import { useVivim } from '@vivim/sdk-react';

export function useCustomMemory() {
  const sdk = useVivim();
  const memoryNode = sdk.loadNode('@vivim/node-memory');
  
  const searchWithRanking = async (query: string) => {
    const results = await memoryNode.search({ text: query });
    
    // Custom ranking logic
    return results.sort((a, b) => {
      const scoreA = calculateRelevance(a, query);
      const scoreB = calculateRelevance(b, query);
      return scoreB - scoreA;
    });
  };
  
  return { searchWithRanking };
}
```

---

# PART 5: NETWORK GRAPH MODEL

## 5.1 Graph Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NETWORK GRAPH MODEL                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         LOCAL NODE                                  │    │
│  │                                                                      │    │
│  │   ┌─────────┐     ┌─────────┐     ┌─────────┐                      │    │
│  │   │ Identity│────▶│ Content │────▶│ Storage │                      │    │
│  │   │   Node  │     │   Node  │     │   Node  │                      │    │
│  │   └────┬────┘     └────┬────┘     └────┬────┘                      │    │
│  │        │               │               │                            │    │
│  │        │    ┌──────────┴──────────┐    │                            │    │
│  │        │    │                     │    │                            │    │
│  │        ▼    ▼                     ▼    ▼                            │    │
│  │   ┌──────────────────────────────────────────┐                      │    │
│  │   │              SDK LAYER                   │                      │    │
│  │   │   (React/Vue/etc components/hooks)      │                      │    │
│  │   └──────────────────────────────────────────┘                      │    │
│  │                                                                      │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 │ libp2p/WebRTC                              │
│                                 │                                            │
│  ┌──────────────────────────────┼──────────────────────────────────────┐    │
│  │                              │                                      │    │
│  │        PEER A                │               PEER B                 │    │
│  │   ┌──────────────────┐       │       ┌──────────────────┐          │    │
│  │   │ Identity         │       │       │ Identity         │          │    │
│  │   │ Content ─────────┼───────┼──────▶│ Content          │          │    │
│  │   │ Storage          │◀──────┼───────│ Storage          │          │    │
│  │   │ AI-Chat          │       │       │ AI-Chat          │          │    │
│  │   │ Memory           │       │       │ Memory           │          │    │
│  │   └──────────────────┘       │       └──────────────────┘          │    │
│  │                              │                                      │    │
│  │        PEER C                │               PEER D                 │    │
│  │   ┌──────────────────┐       │       ┌──────────────────┐          │    │
│  │   │ Identity         │       │       │ Identity         │          │    │
│  │   │ Content          │◀──────┼───────│ Content          │          │    │
│  │   │ Storage ◀────────┼───────┼───────│ Storage          │          │    │
│  │   │ CustomNode       │       │       │ AnalyticsNode    │          │    │
│  │   └──────────────────┘       │       └──────────────────┘          │    │
│  │                              │                                      │    │
│  └──────────────────────────────┴──────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Graph Manager API

```typescript
// @vivim/sdk/core/graph

export interface NetworkGraph {
  // ============================================
  // NODE OPERATIONS
  // ============================================
  
  /**
   * Add node to graph
   */
  addNode(node: NodeInstance): Promise<string>;
  
  /**
   * Remove node from graph
   */
  removeNode(nodeId: string): Promise<void>;
  
  /**
   * Get node by ID
   */
  getNode<T extends NodeInstance>(nodeId: string): T | undefined;
  
  /**
   * Get all nodes
   */
  getNodes(): NodeInstance[];
  
  /**
   * Get nodes by type
   */
  getNodesByType(type: NodeType): NodeInstance[];
  
  // ============================================
  // EDGE OPERATIONS
  // ============================================
  
  /**
   * Connect two nodes
   */
  addEdge(from: string, to: string, edge: EdgeDefinition): Promise<void>;
  
  /**
   * Remove edge
   */
  removeEdge(from: string, to: string): Promise<void>;
  
  /**
   * Get edges for node
   */
  getEdges(nodeId: string): EdgeInstance[];
  
  /**
   * Get dependencies
   */
  getDependencies(nodeId: string): NodeInstance[];
  
  /**
   * Get dependents
   */
  getDependents(nodeId: string): NodeInstance[];
  
  // ============================================
  // GRAPH TRAVERSAL
  // ============================================
  
  /**
   * Traverse graph
   */
  traverse(startId: string, direction: 'upstream' | 'downstream'): NodeInstance[];
  
  /**
   * Find path between nodes
   */
  findPath(from: string, to: string): NodeInstance[] | null;
  
  /**
   * Get subgraph
   */
  getSubgraph(nodeIds: string[]): NetworkGraph;
  
  // ============================================
  // CAPABILITY DISCOVERY
  // ============================================
  
  /**
   * Find nodes with capability
   */
  findByCapability(capabilityId: string): NodeInstance[];
  
  /**
   * Find nodes emitting event
   */
  findByEvent(eventType: string): NodeInstance[];
  
  /**
   * Get all capabilities in graph
   */
  getAllCapabilities(): CapabilityInfo[];
  
  // ============================================
  // GRAPH HEALTH
  // ============================================
  
  /**
   * Validate graph integrity
   */
  validate(): ValidationResult;
  
  /**
   * Check for cycles
   */
  hasCycles(): boolean;
  
  /**
   * Get orphan nodes (no connections)
   */
  getOrphanNodes(): NodeInstance[];
  
  // ============================================
  // SERIALIZATION
  // ============================================
  
  /**
   * Export graph to JSON
   */
  toJSON(): GraphJSON;
  
  /**
   * Import graph from JSON
   */
  static fromJSON(json: GraphJSON): NetworkGraph;
}

export interface EdgeDefinition {
  type: 'dependency' | 'data-flow' | 'event' | 'extension';
  direction: 'unidirectional' | 'bidirectional';
  transform?: (data: any) => any;
  filter?: (data: any) => boolean;
}
```

## 5.3 Node Discovery Protocol

```typescript
// @vivim/sdk/core/discovery

/**
 * Node Discovery Protocol
 * Find and load nodes from the network
 */
export class NodeDiscovery {
  private dht: DHTService;
  private registry: NodeRegistry;
  
  // ============================================
  // LOCAL DISCOVERY
  // ============================================
  
  /**
   * List locally installed nodes
   */
  listLocal(): LocalNodeInfo[];
  
  /**
   * Get node metadata
   */
  getMetadata(nodeId: string): NodeMetadata;
  
  // ============================================
  // NETWORK DISCOVERY
  // ============================================
  
  /**
   * Find nodes on network by capability
   */
  async findByCapability(capability: string): Promise<RemoteNodeInfo[]>;
  
  /**
   * Find nodes by publisher
   */
  async findByPublisher(publisherDid: string): Promise<RemoteNodeInfo[]>;
  
  /**
   * Search nodes
   */
  async search(query: string): Promise<RemoteNodeInfo[]>;
  
  /**
   * Get node from network
   */
  async fetch(nodeId: string): Promise<NodePackage>;
  
  // ============================================
  // REGISTRY OPERATIONS
  // ============================================
  
  /**
   * Publish node to registry
   */
  async publish(node: NodePackage, options: PublishOptions): Promise<void>;
  
  /**
   * Unpublish node
   */
  async unpublish(nodeId: string): Promise<void>;
  
  /**
   * Get node stats
   */
  async getStats(nodeId: string): Promise<NodeStats>;
  
  // ============================================
  // TRUST & VERIFICATION
  // ============================================
  
  /**
   * Verify node signature
   */
  async verify(node: NodePackage): Promise<boolean>;
  
  /**
   * Add trusted publisher
   */
  addTrustedPublisher(did: string): void;
  
  /**
   * Remove trusted publisher
   */
  removeTrustedPublisher(did: string): void;
  
  /**
   * Check if publisher is trusted
   */
  isTrusted(did: string): boolean;
}
```

---

# PART 6: NODE EXTENSION SYSTEM

## 6.1 Extension Points

```typescript
// Extension point definition

export interface ExtensionPoint {
  id: string;
  nodeId: string;
  name: string;
  description: string;
  
  // What extensions must implement
  interface: ExtensionInterface;
  
  // How extensions are invoked
  invocation: 'callback' | 'pipeline' | 'hook' | 'middleware';
  
  // Priority ordering
  priority: 'first-wins' | 'last-wins' | 'ordered';
  
  // Multiple extensions allowed
  allowMultiple: boolean;
}

export interface ExtensionInterface {
  methods: MethodSignature[];
  events?: EventSignature[];
  properties?: PropertySignature[];
}

// Example: Custom content renderer extension
export const ContentRendererExtension: ExtensionPoint = {
  id: 'content-renderer',
  nodeId: '@vivim/node-content',
  name: 'Content Renderer',
  description: 'Render custom content types',
  
  interface: {
    methods: [
      {
        name: 'render',
        params: [{ name: 'content', type: 'ContentObject' }],
        returns: 'ReactNode | HTMLElement',
      },
      {
        name: 'canRender',
        params: [{ name: 'content', type: 'ContentObject' }],
        returns: 'boolean',
      },
    ],
  },
  
  invocation: 'callback',
  priority: 'first-wins',
  allowMultiple: true,
};
```

## 6.2 Creating Extensions

```typescript
// Example: Custom 3D model viewer extension

import { Extension, ExtensionPoint } from '@vivim/sdk/core';

/**
 * 3D Model Viewer Extension
 * Renders .glb/.gltf content types
 */
export const Model3DViewerExtension: Extension = {
  id: '@my-org/ext-3d-viewer',
  name: '3D Model Viewer',
  version: '1.0.0',
  
  // Extension point we're extending
  extends: 'content-renderer',
  
  // Priority (lower = higher priority)
  priority: 10,
  
  // Implementation
  implementation: {
    canRender(content: ContentObject): boolean {
      return content.type === 'model3d' || 
             content.media?.mimeType === 'model/gltf-binary' ||
             content.media?.mimeType === 'model/gltf+json';
    },
    
    async render(content: ContentObject): Promise<ReactNode> {
      const modelUrl = await content.getUrl();
      
      return (
        <ModelViewer
          src={modelUrl}
          cameraControls
          autoRotate
          style={{ width: '100%', height: '400px' }}
        />
      );
    },
  },
  
  // Dependencies
  dependencies: {
    packages: ['@google/model-viewer'],
  },
};

// Register extension
sdk.registerExtension(Model3DViewerExtension);
```

## 6.3 Extension Registration

```typescript
// App startup with extensions

import { VivimSDK } from '@vivim/sdk';
import { Model3DViewerExtension } from '@my-org/ext-3d-viewer';
import { VideoPlayerExtension } from '@my-org/ext-video-player';
import { CodeHighlightExtension } from '@my-org/ext-code-highlight';

const sdk = new VivimSDK({
  extensions: {
    autoLoad: true,
    directories: ['./extensions'],
    registries: ['https://extensions.vivim.net'],
  },
});

// Register extensions manually
sdk.registerExtension(Model3DViewerExtension);
sdk.registerExtension(VideoPlayerExtension);
sdk.registerExtension(CodeHighlightExtension);

// Or load from network
await sdk.loadExtension('@community/ext-markdown-advanced');
await sdk.loadExtension('@community/ext-latex-renderer');
```

---

# PART 7: DEVELOPER CLI

## 7.1 CLI Commands

```bash
# Create new VIVIM app
npx @vivim/cli create-app my-app --template react

# Create new API node
npx @vivim/cli create-node @my-org/node-custom --type api

# Create new SDK node
npx @vivim/cli create-node @my-org/sdk-solid --type sdk

# Create new extension
npx @vivim/cli create-extension @my-org/ext-custom

# Development
npx @vivim/cli dev                    # Start dev server
npx @vivim/cli dev --node @my-org/node-custom  # Dev specific node

# Build
npx @vivim/cli build                  # Build all
npx @vivim/cli build --node @my-org/node-custom

# Test
npx @vivim/cli test                   # Run tests
npx @vivim/cli test --coverage        # With coverage

# Publish
npx @vivim/cli publish                # Publish to registry
npx @vivim/cli publish --dry-run      # Preview publish

# Node management
npx @vivim/cli nodes list             # List installed nodes
npx @vivim/cli nodes search <query>   # Search registry
npx @vivim/cli nodes install <id>     # Install node
npx @vivim/cli nodes update <id>      # Update node
npx @vivim/cli nodes remove <id>      # Remove node

# Network
npx @vivim/cli network status         # Check network status
npx @vivim/cli network peers          # List connected peers
npx @vivim/cli network connect <addr> # Connect to peer

# Graph
npx @vivim/cli graph visualize        # Visualize node graph
npx @vivim/cli graph validate         # Validate graph
npx @vivim/cli graph export           # Export graph JSON
```

## 7.2 Project Templates

```
# From template
npx @vivim/cli create-app my-app --template <template>

Available Templates:
  react          React + Vite + Tailwind
  react-native   React Native + Expo
  vue            Vue 3 + Vite
  svelte         SvelteKit
  flutter        Flutter
  next           Next.js App Router
  full-stack     React PWA + Node Server
  minimal        Minimal SDK setup
```

## 7.3 Node Scaffolding

```bash
# Create API node scaffold
npx @vivim/cli create-node @my-org/node-maps --type api

# Generated structure:
@my-org/node-maps/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Node definition & export
│   ├── MapsNode.ts       # Node implementation
│   ├── types.ts          # Type definitions
│   └── __tests__/
│       └── MapsNode.test.ts
├── README.md
└── vivim-node.json       # Node metadata
```

---

# PART 8: NODE REGISTRY

## 8.1 Registry Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NODE REGISTRY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      REGISTRY NODES                                  │   │
│  │                                                                       │   │
│  │   ┌─────────┐     ┌─────────┐     ┌─────────┐                       │   │
│  │   │Primary  │────▶│Mirror 1 │────▶│Mirror 2 │                       │   │
│  │   │Registry │     │(Region) │     │(Region) │                       │   │
│  │   └────┬────┘     └────┬────┘     └────┬────┘                       │   │
│  │        │               │               │                             │   │
│  │        └───────────────┴───────────────┘                             │   │
│  │                        │                                              │   │
│  │                        ▼                                              │   │
│  │              ┌────────────────┐                                      │   │
│  │              │   IPFS Storage │                                      │   │
│  │              │   (Immutable)  │                                      │   │
│  │              └────────────────┘                                      │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    REGISTRY DATA                                     │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ Node Index  │  │ Publisher   │  │ Version     │                  │   │
│  │  │ (DHT)       │  │ Registry    │  │ History     │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ Dependency  │  │ Trust       │  │ Download    │                  │   │
│  │  │ Graph       │  │ Scores      │  │ Stats       │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8.2 Registry API

```typescript
// @vivim/sdk/registry

export interface NodeRegistryAPI {
  // ============================================
  // SEARCH
  // ============================================
  
  /**
   * Search for nodes
   */
  search(query: {
    text?: string;
    type?: 'api' | 'sdk' | 'network';
    capability?: string;
    platform?: string;
    publisher?: string;
  }): Promise<NodeSearchResult[]>;
  
  /**
   * Get node details
   */
  get(nodeId: string): Promise<NodePackageInfo>;
  
  /**
   * Get node versions
   */
  getVersions(nodeId: string): Promise<VersionInfo[]>;
  
  // ============================================
  // PUBLISH
  // ============================================
  
  /**
   * Publish node
   */
  publish(packagePath: string, options: {
    access: 'public' | 'restricted';
    tag?: string;
  }): Promise<PublishResult>;
  
  /**
   * Deprecate version
   */
  deprecate(nodeId: string, version: string, reason: string): Promise<void>;
  
  // ============================================
  // INSTALL
  // ============================================
  
  /**
   * Install node
   */
  install(nodeId: string, version?: string): Promise<InstallResult>;
  
  /**
   * Update node
   */
  update(nodeId: string): Promise<InstallResult>;
  
  /**
   * Uninstall node
   */
  uninstall(nodeId: string): Promise<void>;
  
  // ============================================
  // TRUST
  // ============================================
  
  /**
   * Verify node authenticity
   */
  verify(nodeId: string, version: string): Promise<VerificationResult>;
  
  /**
   * Get trust score
   */
  getTrustScore(nodeId: string): Promise<TrustScore>;
  
  /**
   * Report issue
   */
  reportIssue(nodeId: string, issue: IssueReport): Promise<void>;
}
```

## 8.3 Node Package Format

```typescript
// vivim-node.json - Node metadata file

{
  "id": "@my-org/node-maps",
  "name": "Maps Node",
  "version": "1.0.0",
  "description": "Location and mapping capabilities for VIVIM",
  "author": {
    "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "name": "My Org",
    "url": "https://myorg.dev"
  },
  "license": "MIT",
  "type": "api",
  
  "capabilities": [
    {
      "id": "geocode",
      "name": "Geocode Address",
      "description": "Convert address to coordinates"
    },
    {
      "id": "reverse-geocode",
      "name": "Reverse Geocode",
      "description": "Convert coordinates to address"
    },
    {
      "id": "search-places",
      "name": "Search Places",
      "description": "Search for places nearby"
    }
  ],
  
  "dependencies": {
    "nodes": [
      "@vivim/node-identity",
      "@vivim/node-storage"
    ],
    "packages": {}
  },
  
  "permissions": [
    { "type": "identity", "access": "read" },
    { "type": "storage", "access": "write", "scope": "maps" }
  ],
  
  "configSchema": {
    "type": "object",
    "properties": {
      "provider": {
        "type": "string",
        "enum": ["osm", "mapbox", "google"],
        "default": "osm"
      },
      "apiKey": {
        "type": "string"
      }
    }
  },
  
  "entrypoint": "./dist/index.js",
  "types": "./dist/index.d.ts",
  
  "repository": {
    "type": "git",
    "url": "https://github.com/my-org/vivim-node-maps"
  },
  
  "keywords": ["maps", "location", "geocoding"],
  "categories": ["location", "utility"],
  
  "signature": "...",  // Signature over package hash
  "cid": "bafy..."     // IPFS CID of package
}
```

---

# PART 9: DOCUMENTATION STRUCTURE

## 9.1 Documentation Overview

```
docs/
├── index.md                          # Landing page
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   ├── your-first-app.md
│   └── concepts.md
│
├── core-sdk/
│   ├── overview.md
│   ├── configuration.md
│   ├── identity.md
│   ├── network.md
│   ├── storage.md
│   └── graph.md
│
├── api-nodes/
│   ├── overview.md
│   ├── identity-node.md
│   ├── storage-node.md
│   ├── content-node.md
│   ├── social-node.md
│   ├── ai-chat-node.md
│   ├── memory-node.md
│   └── capture-node.md
│
├── sdk-nodes/
│   ├── overview.md
│   ├── react-sdk.md
│   ├── vue-sdk.md
│   ├── svelte-sdk.md
│   ├── flutter-sdk.md
│   └── react-native-sdk.md
│
├── extensions/
│   ├── overview.md
│   ├── creating-extensions.md
│   ├── extension-points.md
│   └── publishing-extensions.md
│
├── network/
│   ├── overview.md
│   ├── bootstrap-nodes.md
│   ├── peer-discovery.md
│   └── network-graph.md
│
├── guides/
│   ├── building-a-chat-app.md
│   ├── building-a-social-app.md
│   ├── building-a-content-app.md
│   ├── offline-first.md
│   └── security-best-practices.md
│
├── advanced/
│   ├── custom-nodes.md
│   ├── node-lifecycle.md
│   ├── event-system.md
│   ├── dependency-injection.md
│   └── testing-nodes.md
│
├── registry/
│   ├── overview.md
│   ├── publishing.md
│   ├── versioning.md
│   └── trust-scores.md
│
├── reference/
│   ├── api-reference.md
│   ├── types.md
│   ├── constants.md
│   └── error-codes.md
│
└── examples/
    ├── minimal-app/
    ├── full-stack-app/
    ├── custom-node/
    └── extension/
```

## 9.2 Quick Start Guide

```markdown
# Getting Started with VIVIM SDK

## Installation

```bash
# Create a new VIVIM app
npx @vivim/cli create-app my-vivim-app

# Or add to existing project
npm install @vivim/sdk @vivim/sdk-react
```

## Basic Setup

```tsx
// App.tsx
import { VivimProvider, IdentityProvider, useIdentity } from '@vivim/sdk-react';

function App() {
  return (
    <VivimProvider config={{
      // Optional: connect to specific bootstrap nodes
      network: {
        bootstrapNodes: ['/dns4/bootstrap.vivim.net/tcp/443/wss/p2p/...']
      },
      // Optional: configure storage
      storage: {
        defaultLocation: 'ipfs',
        encryption: true
      }
    }}>
      <IdentityProvider>
        <YourApp />
      </IdentityProvider>
    </VivimProvider>
  );
}

function YourApp() {
  const { identity, createIdentity, signIn } = useIdentity();
  
  if (!identity) {
    return (
      <div>
        <h1>Welcome to VIVIM</h1>
        <button onClick={() => createIdentity()}>
          Create Identity
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Hello, {identity.did}</h1>
      <p>You're connected to the decentralized network!</p>
    </div>
  );
}
```

## Using API Nodes

```tsx
import { useContent, useChat, useStorage } from '@vivim/sdk-react';

function MyComponent() {
  const { create, feed, search } = useContent();
  const { sendMessage, conversations } = useChat();
  const { store, retrieve, pin } = useStorage();
  
  // Create content
  const handlePost = async () => {
    await create('post', {
      text: 'Hello, decentralized world!',
    }, {
      visibility: 'public'
    });
  };
  
  // Store file
  const handleUpload = async (file: File) => {
    const result = await store(file, { encryption: true });
    console.log('Stored at CID:', result.cid);
  };
  
  // Send AI message
  const handleChat = async (message: string) => {
    const response = await sendMessage(conversationId, message);
    console.log('AI replied:', response.content);
  };
  
  return (
    // Your UI
  );
}
```

## Installing Custom Nodes

```tsx
// Install from registry
npx @vivim/cli nodes install @community/node-maps

// Use in your app
import { useMaps } from '@community/node-maps/react';

function MapView() {
  const { searchPlaces, geocode } = useMaps();
  
  const places = await searchPlaces({
    query: 'coffee shops',
    near: { lat: 37.7749, lng: -122.4194 }
  });
}
```
```

---

# PART 10: IMPLEMENTATION CHECKLIST

## Phase 1: Core SDK
- [ ] Implement `VivimSDK` class
- [ ] Create `NetworkGraph` manager
- [ ] Build `NodeRegistry` client
- [ ] Implement node loader/runtime
- [ ] Add identity management

## Phase 2: API Nodes
- [ ] Identity node
- [ ] Storage node
- [ ] Content node
- [ ] Social node
- [ ] AI Chat node
- [ ] Memory node

## Phase 3: SDK Nodes
- [ ] React SDK
- [ ] Vue SDK
- [ ] Svelte SDK
- [ ] Flutter SDK
- [ ] React Native SDK

## Phase 4: Extension System
- [ ] Extension point registry
- [ ] Extension loader
- [ ] Extension lifecycle
- [ ] Extension isolation

## Phase 5: CLI
- [ ] create-app command
- [ ] create-node command
- [ ] dev server
- [ ] publish command
- [ ] node management commands

## Phase 6: Registry
- [ ] Registry server
- [ ] IPFS storage backend
- [ ] Trust scoring
- [ ] Version management

## Phase 7: Documentation
- [ ] Getting started guides
- [ ] API reference
- [ ] Example apps
- [ ] Video tutorials

## Phase 8: Testing
- [ ] Unit tests for all nodes
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance benchmarks

---

*This document provides the complete specification for VIVIM SDK - an open-source, extensible toolkit for building decentralized applications.*

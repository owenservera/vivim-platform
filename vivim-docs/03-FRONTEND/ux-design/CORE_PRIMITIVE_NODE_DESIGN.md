# VIVIM Self-Contained Core Primitive Node Design

## Executive Summary

This document defines the architecture for integrating `@vivim/sdk` as a **self-contained installable core primitive node** within the VIVIM chain of trust. The design enables:

1. **On-Chain Presence**: The SDK serves as the canonical "home base" until network maturity allows fully distributed storage
2. **Self-Contained Application**: Documentation, tooling, APIs, and core apps are all packaged within the node
3. **Exit Node Protocol**: A single exit point enabling clones to connect and synchronize
4. **Chain of Trust**: Cryptographic verification of node authenticity and state

---

## 1. Architectural Overview

### 1.1 The Core Primitive Node Concept

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     VIVIM CORE PRIMITIVE NODE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        ON-CHAIN LAYER                                │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │   Identity  │  │    Trust     │  │   Anchor    │               │    │
│  │  │   Anchor    │  │   Registry  │  │   State     │               │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      SDK CORE LAYER                                 │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │    VivimSDK │  │  Network    │  │    Graph    │               │    │
│  │  │             │  │   Engine    │  │   Manager   │               │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      NODES LAYER                                    │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │    │
│  │  │Identity│ │Storage│ │Content│ │Social│ │AIChat│ │Memory│            │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       APPS LAYER                                    │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │    │
│  │  │    ACU    │ │  OmniFeed │ │  Circle   │ │  AI Doc   │          │    │
│  │  │ Processor │ │           │ │  Engine   │ │           │          │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐                         │    │
│  │  │ Crypto    │ │Assistant  │ │   Tool   │                         │    │
│  │  │ Engine    │ │  Engine   │ │  Engine  │                         │    │
│  │  └───────────┘ └───────────┘ └───────────┘                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    EXIT NODE PROTOCOL                               │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │  • Clone Discovery     • State Synchronization            │   │    │
│  │  │  • Trust Verification   • Migration Protocol               │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

1. **Self-Containment**: Every dependency, configuration, and asset is bundled
2. **Verifiability**: Cryptographic proofs for all state transitions
3. **Migratability**: Smooth transition from centralized to distributed
4. **Composability**: Nodes can be selectively enabled/disabled
5. **Security**: Zero-trust between clones until trust is established

---

## 2. Chain of Trust Integration

### 2.1 Trust Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHAIN OF TRUST HIERARCHY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                            ┌─────────────┐                                  │
│                            │  ROOT ANCHOR │                                 │
│                            │ (Genesis DID)│                                 │
│                            └──────┬──────┘                                  │
│                                   │                                          │
│           ┌──────────────────────┼──────────────────────┐                   │
│           │                      │                      │                   │
│           ▼                      ▼                      ▼                   │
│    ┌─────────────┐        ┌─────────────┐        ┌─────────────┐          │
│    │  Bootstrap  │        │   Primary    │        │  Authority  │          │
│    │    Node     │        │    Node      │        │    Node     │          │
│    └─────────────┘        └─────────────┘        └─────────────┘          │
│           │                      │                      │                     │
│           └──────────────────────┼──────────────────────┘                    │
│                                  │                                            │
│                                  ▼                                            │
│                         ┌─────────────┐                                       │
│                         │   CLONES    │                                       │
│                         │  (children) │                                       │
│                         └─────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Trust State Definition

```typescript
/**
 * Chain of Trust State
 * Represents the trust level of a node in the network
 */
export interface TrustState {
  // Identity
  did: string;                    // Decentralized Identifier
  cloneId: string;                // Unique clone identifier
  parentId?: string;              // Parent clone (if forked)
  
  // Trust Level
  trustLevel: TrustLevel;
  trustScore: number;             // 0-100
  
  // Chain of Custody
  anchorCid: string;              // IPFS CID of anchor state
  anchorTimestamp: number;
  merkleRoot: string;             // State merkle root
  
  // Verification
  signature: string;               // Self-signed attestation
  proofs: TrustProof[];           // External trust proofs
}

export enum TrustLevel {
  GENESIS = 'genesis',           // Root anchor node
  BOOTSTRAP = 'bootstrap',       // Bootstrap/relay nodes
  PRIMARY = 'primary',           // Primary SDK instances
  SECONDARY = 'secondary',       // Verified clones
  UNVERIFIED = 'unverified',     // New/untrusted nodes
  SUSPENDED = 'suspended'         // Revoked trust
}

export interface TrustProof {
  type: 'attestation' | 'challenge' | 'migration';
  issuer: string;
  target: string;
  signature: string;
  timestamp: number;
  payload: unknown;
}
```

### 2.3 Anchor Protocol

```typescript
/**
 * Anchor Protocol
 * Handles on-chain state anchoring for the core primitive node
 */
export class AnchorProtocol {
  private sdk: VivimSDK;
  private identity: Identity;
  
  /**
   * Create anchor state for the node
   */
  async createAnchor(): Promise<AnchorState> {
    const state = await this.collectState();
    const merkleRoot = await this.computeMerkleRoot(state);
    
    const anchor: AnchorState = {
      did: this.identity.did,
      cloneId: this.generateCloneId(),
      merkleRoot,
      stateCid: await this.persistState(state),
      timestamp: Date.now(),
      version: SDK_VERSION,
      capabilities: this.enumerateCapabilities(),
    };
    
    // Self-attest
    anchor.signature = await this.sdk.sign(anchor);
    
    return anchor;
  }
  
  /**
   * Verify a clone's anchor state
   */
  async verifyAnchor(anchor: AnchorState): Promise<boolean> {
    // Verify signature
    const valid = await this.sdk.verify(
      { merkleRoot: anchor.merkleRoot, stateCid: anchor.stateCid },
      anchor.signature,
      anchor.did
    );
    
    if (!valid) return false;
    
    // Verify state exists
    const stateExists = await this.verifyStateCid(anchor.stateCid);
    
    return stateExists;
  }
  
  /**
   * Migrate trust from parent to child clone
   */
  async migrateTrust(
    parentAnchor: AnchorState, 
    childDid: string
  ): Promise<TrustProof> {
    const migration: TrustProof = {
      type: 'migration',
      issuer: parentAnchor.did,
      target: childDid,
      signature: await this.sdk.sign({ 
        parent: parentAnchor.did, 
        child: childDid,
        timestamp: Date.now() 
      }),
      timestamp: Date.now(),
      payload: {
        parentCloneId: parentAnchor.cloneId,
        migrationType: 'fork',
      }
    };
    
    return migration;
  }
}
```

---

## 3. Exit Node Protocol

### 3.1 Protocol Definition

The Exit Node Protocol (ENP) defines how clones discover and connect to the canonical node.

```typescript
/**
 * Exit Node Protocol
 * Enables clones to connect to and synchronize with the canonical node
 */

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
    clone: string;      // Clone registration endpoint
    sync: string;       // State sync endpoint
    relay: string;      // P2P relay endpoint
  };
  
  // Policy
  policy: {
    maxClones: number;
    allowMigration: boolean;
    requireVerification: boolean;
  };
}

/**
 * Clone Registration Request
 */
export interface CloneRegistrationRequest {
  // Requester identity
  did: string;
  requestedCloneId: string;
  
  // Intended configuration
  desiredCapabilities: string[];
  preferredNetwork: 'mainnet' | 'testnet' | 'local';
  
  // Proof of identity
  identityProof: string;
  
  // Request timestamp
  timestamp: number;
  
  // Nonce for replay protection
  nonce: string;
}

/**
 * Clone Registration Response
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
```

### 3.2 Connection Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXIT NODE CONNECTION FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CLONE                                                                    │
│     │                                                                       │
│     │  1. Discovery                                                          │
│     │  ─────────────                                                        │
│     │  • Query DHT for exit nodes                                          │
│     │  • Receive ExitNodeAdvertisement                                      │
│     │                                                                       │
│     ▼                                                                       │
│     │                                                                       │
│     │  2. Handshake                                                          │
│     │  ─────────────                                                        │
│     │  • Verify anchor state                                                │
│     │  • Exchange capabilities                                              │
│     │                                                                       │
│     ▼                                                                       │
│     │                                                                       │
│     │  3. Registration                                                      │
│     │  ─────────────                                                        │
│     │  • CloneRegistrationRequest                                          │
│     │  • Prove identity                                                     │
│     │                                                                       │
│     ▼                                                                       │
│     │                                                                       │
│     │  4. Trust Delegation                                                  │
│     │  ─────────────                                                        │
│     │  • Receive TrustProof                                                 │
│     │  • Establish chain of trust                                           │
│     │                                                                       │
│     ▼                                                                       │
│     │                                                                       │
│     │  5. State Sync                                                        │
│     │  ─────────────                                                        │
│     │  • Receive StateSnapshot                                              │
│     │  • Verify merkle root                                                 │
│     │  • Apply initial state                                                │
│     │                                                                       │
│     ▼                                                                       │
│     │                                                                       │
│     │  6. Operational                                                       │
│     │  ─────────────                                                        │
│     │  • Connect to P2P network                                            │
│     │  • Begin normal operation                                             │
│     │                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Implementation

```typescript
/**
 * Exit Node Service
 * Implements the server-side of the Exit Node Protocol
 */
export class ExitNodeService extends EventEmitter {
  private sdk: VivimSDK;
  private advertisement: ExitNodeAdvertisement;
  private registeredClones: Map<string, CloneRegistrationResponse> = new Map();
  
  /**
   * Start the exit node service
   */
  async start(): Promise<void> {
    // Create anchor state
    const anchor = await this.createAnchor();
    
    // Build advertisement
    this.advertisement = {
      did: this.sdk.getIdentity()!.did,
      peerId: this.getPeerId(),
      multiaddrs: this.getMultiaddrs(),
      capabilities: this.enumerateCapabilities(),
      supportedCloneVersions: [SDK_VERSION],
      trustLevel: TrustLevel.PRIMARY,
      anchorState: anchor,
      endpoints: {
        clone: `${this.getApiUrl()}/clone/register`,
        sync: `${this.getApiUrl()}/sync`,
        relay: this.getP2PRelayAddress(),
      },
      policy: {
        maxClones: 1000,
        allowMigration: true,
        requireVerification: true,
      },
    };
    
    // Register with DHT
    await this.registerWithDHT(this.advertisement);
    
    // Set up protocol handlers
    await this.setupProtocolHandlers();
    
    console.log(`[ExitNode] Started at ${this.advertisement.multiaddrs[0]}`);
  }
  
  /**
   * Handle clone registration request
   */
  async handleCloneRegistration(
    request: CloneRegistrationRequest
  ): Promise<CloneRegistrationResponse> {
    // Verify request timestamp (prevent replay)
    if (!this.isTimestampValid(request.timestamp)) {
      return { approved: false, cloneId: '', denialReason: 'Invalid timestamp' };
    }
    
    // Verify identity proof
    const identityValid = await this.verifyIdentityProof(request);
    if (!identityValid) {
      return { approved: false, cloneId: '', denialReason: 'Invalid identity proof' };
    }
    
    // Check capacity
    if (this.registeredClones.size >= this.advertisement.policy.maxClones) {
      return { approved: false, cloneId: '', denialReason: 'Capacity exceeded' };
    }
    
    // Generate clone ID
    const cloneId = this.generateCloneId(request.did);
    
    // Create trust proof (delegation)
    const trustProof = await this.delegateTrust(request.did, cloneId);
    
    // Generate initial state snapshot
    const initialState = await this.createStateSnapshot();
    
    // Register clone
    const response: CloneRegistrationResponse = {
      approved: true,
      cloneId,
      endpoints: {
        api: `${this.getApiUrl()}/api`,
        p2p: this.getP2PAddress(request.did),
      },
      trustProof,
      initialState,
    };
    
    this.registeredClones.set(cloneId, response);
    
    return response;
  }
  
  /**
   * Delegate trust to a new clone
   */
  private async delegateTrust(
    targetDid: string, 
    cloneId: string
  ): Promise<TrustProof> {
    const proof: TrustProof = {
      type: 'attestation',
      issuer: this.sdk.getIdentity()!.did,
      target: targetDid,
      signature: await this.sdk.sign({
        type: 'attestation',
        issuer: this.sdk.getIdentity()!.did,
        target: targetDid,
        cloneId,
        timestamp: Date.now(),
      }),
      timestamp: Date.now(),
      payload: {
        trustLevel: TrustLevel.SECONDARY,
        delegatedBy: this.advertisement.did,
      },
    };
    
    return proof;
  }
}
```

---

## 4. Self-Containment Strategy

### 4.1 Package Structure

```
@vivim/sdk-core/
├── dist/                          # Compiled output
│   ├── index.js                   # Main entry
│   ├── nodes/                     # All node implementations
│   ├── apps/                      # All app implementations
│   ├── protocols/                 # Exit node, sync protocols
│   └── assets/                    # Bundled assets
│
├── src/
│   ├── core/                      # SDK core
│   │   ├── sdk.ts                 # Main SDK class
│   │   ├── anchor.ts               # Anchor protocol
│   │   ├── trust.ts                # Chain of trust
│   │   └── types.ts               # Core types
│   │
│   ├── nodes/                      # Built-in nodes
│   │   ├── identity-node.ts
│   │   ├── storage-node.ts
│   │   ├── content-node.ts
│   │   ├── social-node.ts
│   │   ├── ai-chat-node.ts
│   │   └── memory-node.ts
│   │
│   ├── apps/                       # Built-in apps
│   │   ├── acu-processor/
│   │   ├── omni-feed/
│   │   ├── circle-engine/
│   │   ├── ai-documentation/
│   │   ├── crypto-engine/
│   │   ├── assistant-engine/
│   │   └── tool-engine/
│   │
│   ├── protocols/                   # Network protocols
│   │   ├── exit-node.ts            # Exit node implementation
│   │   ├── clone.ts                # Clone protocol
│   │   └── sync.ts                 # State sync protocol
│   │
│   ├── network/                    # Network engine (bundled)
│   │   └── [network engine code]
│   │
│   └── docs/                       # Built-in documentation
│       ├── index.md
│       └── api-reference.md
│
└── package.json
```

### 4.2 Installation Profile

```typescript
/**
 * Installation Profile
 * Defines what's included in a self-contained installation
 */
export interface InstallationProfile {
  // Version info
  version: string;
  profile: 'minimal' | 'standard' | 'full';
  
  // Components
  components: {
    // Core
    sdk: boolean;
    identity: boolean;
    
    // Nodes
    nodes: {
      identity: boolean;
      storage: boolean;
      content: boolean;
      social: boolean;
      aiChat: boolean;
      memory: boolean;
    };
    
    // Apps
    apps: {
      acuProcessor: boolean;
      omniFeed: boolean;
      circleEngine: boolean;
      aiDocumentation: boolean;
      cryptoEngine: boolean;
      assistantEngine: boolean;
      toolEngine: boolean;
    };
    
    // Protocols
    protocols: {
      exitNode: boolean;
      clone: boolean;
      sync: boolean;
    };
    
    // Network
    network: {
      p2p: boolean;
      dht: boolean;
      gossipsub: boolean;
    };
    
    // Documentation
    documentation: boolean;
  };
  
  // Storage
  storage: {
    type: 'sqlite' | 'ipfs' | 'both';
    encryption: boolean;
  };
  
  // Exit node settings
  exitNode?: {
    enabled: boolean;
    maxClones: number;
  };
}
```

---

## 5. Clone Synchronization

### 5.1 State Snapshot

```typescript
/**
 * State Snapshot
 * Complete state export for clone initialization
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
      profile?: Profile;
    };
    
    // Node states
    nodes: Record<string, unknown>;
    
    // App states  
    apps: Record<string, unknown>;
    
    // Content references (not full content)
    contentManifest: ContentManifest;
    
    // Social graph
    socialGraph: SocialGraphState;
    
    // Memory/Knowledge
    memoryIndex: MemoryIndex;
  };
  
  // Verification
  signature: string;
  proof: string;
}

/**
 * Content Manifest
 * References to content without full duplication
 */
export interface ContentManifest {
  version: string;
  items: Array<{
    cid: string;
    type: string;
    createdAt: number;
    visibleTo: string[];
  }>;
  merkleRoot: string;
}
```

### 5.2 Sync Protocol

```typescript
/**
 * Sync Protocol
 * Handles ongoing synchronization between clones
 */
export class SyncProtocol {
  private sdk: VivimSDK;
  private connection: PeerConnection;
  
  /**
   * Perform initial sync with parent
   */
  async initialSync(parentEndpoints: SyncEndpoints): Promise<void> {
    // 1. Fetch state snapshot
    const snapshot = await this.fetchSnapshot(parentEndpoints);
    
    // 2. Verify merkle root
    const rootValid = await this.verifyMerkleRoot(snapshot);
    if (!rootValid) {
      throw new Error('Invalid state snapshot: merkle root mismatch');
    }
    
    // 3. Apply state
    await this.applySnapshot(snapshot);
    
    // 4. Subscribe to updates
    await this.subscribeToUpdates(parentEndpoints);
  }
  
  /**
   * Handle incremental updates
   */
  async handleUpdate(update: StateUpdate): Promise<void> {
    // Verify update authenticity
    const valid = await this.verifyUpdate(update);
    if (!valid) {
      throw new Error('Invalid state update');
    }
    
    // Apply update based on type
    switch (update.type) {
      case 'identity':
        await this.applyIdentityUpdate(update);
        break;
      case 'content':
        await this.applyContentUpdate(update);
        break;
      case 'social':
        await this.applySocialUpdate(update);
        break;
      case 'memory':
        await this.applyMemoryUpdate(update);
        break;
    }
  }
  
  /**
   * Subscribe to state changes from parent
   */
  async subscribeToUpdates(endpoints: SyncEndpoints): Promise<void> {
    const stream = await this.connection.openStream(endpoints.syncTopic);
    
    for await (const update of stream) {
      await this.handleUpdate(update);
    }
  }
}
```

---

## 6. Configuration

### 6.1 Core Node Configuration

```typescript
/**
 * Core Primitive Node Configuration
 */
export interface CoreNodeConfig {
  // Identity
  identity: {
    seed?: Uint8Array;
    did?: string;
    autoCreate: boolean;
  };
  
  // Node Type
  nodeType: 'genesis' | 'primary' | 'clone';
  
  // Exit Node
  exitNode?: {
    enabled: boolean;
    advertise: boolean;
    maxClones: number;
    allowMigration: boolean;
    requireVerification: boolean;
  };
  
  // Network
  network: {
    bootstrapNodes: string[];
    relays: string[];
    listenAddresses: string[];
    enableP2P: boolean;
  };
  
  // Storage
  storage: {
    type: 'local' | 'ipfs' | 'hybrid';
    location: string;
    encryption: boolean;
  };
  
  // Sync
  sync?: {
    parentEndpoint?: string;
    autoSync: boolean;
    syncInterval: number;
  };
  
  // Trust
  trust?: {
    parentDid?: string;
    trustProof?: TrustProof;
  };
}

/**
 * Create genesis (first) node config
 */
export function createGenesisConfig(): CoreNodeConfig {
  return {
    identity: { autoCreate: true },
    nodeType: 'genesis',
    exitNode: {
      enabled: true,
      advertise: true,
      maxClones: 1000,
      allowMigration: true,
      requireVerification: true,
    },
    network: {
      bootstrapNodes: [],
      relays: [],
      listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
      enableP2P: true,
    },
    storage: {
      type: 'local',
      location: './vivim-data',
      encryption: true,
    },
  };
}

/**
 * Create clone node config
 */
export function createCloneConfig(
  parentEndpoint: string,
  trustProof: TrustProof
): CoreNodeConfig {
  return {
    identity: { autoCreate: true },
    nodeType: 'clone',
    exitNode: {
      enabled: false, // Clones don't need exit node
    },
    network: {
      bootstrapNodes: [parentEndpoint],
      relays: [],
      listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
      enableP2P: true,
    },
    storage: {
      type: 'hybrid',
      location: './vivim-data',
      encryption: true,
    },
    sync: {
      parentEndpoint,
      autoSync: true,
      syncInterval: 60000,
    },
    trust: {
      parentDid: trustProof.issuer,
      trustProof,
    },
  };
}
```

---

## 7. CLI Integration

### 7.1 Node Commands

```bash
# Initialize a new genesis node
vivim node init --type genesis

# Start as primary node (with exit node)
vivim node start --exit-node

# Clone from parent
vivim node clone --parent <parent-did>

# Check node status
vivim node status

# View connected clones (if exit node)
vivim node clones list

# Manage trust
vivim trust verify <did>
vivim trust delegate <did>
vivim trust revoke <did>
```

### 7.2 Implementation

```typescript
/**
 * Node CLI Commands
 */
export const nodeCommands = {
  init: {
    description: 'Initialize a new core node',
    options: [
      ['--type', { type: 'genesis' | 'primary', default: 'primary' }],
      ['--seed', { description: 'Identity seed (hex)' }],
    ],
    async handler(opts: InitOptions) {
      const config = opts.type === 'genesis' 
        ? createGenesisConfig() 
        : createPrimaryConfig();
      
      if (opts.seed) {
        config.identity.seed = hexToBytes(opts.seed);
      }
      
      const sdk = new VivimSDK(config);
      await sdk.initialize();
      
      console.log(`Node initialized:`);
      console.log(`  DID: ${sdk.getIdentity()?.did}`);
      console.log(`  Type: ${opts.type}`);
    },
  },
  
  start: {
    description: 'Start the core node',
    options: [
      ['--exit-node', { type: 'boolean', default: false }],
      ['--port', { type: 'number', default: 3000 }],
    ],
    async handler(opts: StartOptions) {
      const config = loadConfig();
      
      if (opts.exitNode) {
        config.exitNode = { enabled: true, ... };
      }
      
      const exitNode = new ExitNodeService(sdk, config);
      await exitNode.start();
    },
  },
  
  clone: {
    description: 'Clone from parent node',
    options: [
      ['--parent', { required: true, description: 'Parent DID or endpoint' }],
    ],
    async handler(opts: CloneOptions) {
      // Discover parent
      const parent = await discoverParent(opts.parent);
      
      // Request registration
      const response = await registerWithParent(parent, {
        did: sdk.getIdentity()!.did,
      });
      
      if (!response.approved) {
        throw new Error(`Clone denied: ${response.denialReason}`);
      }
      
      // Initialize sync
      await syncWithParent(parent, response.initialState);
    },
  },
};
```

---

## 8. Security Considerations

### 8.1 Threat Model

1. **Clone Impersonation**: Prevent unauthorized clone registration
2. **State Tampering**: Ensure state integrity through merkle verification
3. **Trust Delegation Abuse**: Prevent trust proof forgery
4. **Replay Attacks**: Protect against stale state imports

### 8.2 Mitigations

```typescript
/**
 * Security mechanisms for the core primitive node
 */
export class SecurityManager {
  /**
   * Clone identity verification
   */
  async verifyCloneIdentity(
    request: CloneRegistrationRequest
  ): Promise<boolean> {
    // 1. Verify DID format
    if (!isValidDID(request.did)) return false;
    
    // 2. Verify identity proof (signed challenge)
    const challenge = await this.issueChallenge(request.did);
    const proofValid = await this.verifySignature(
      request.identityProof,
      challenge,
      request.did
    );
    
    // 3. Check against deny list
    if (this.isDenyListed(request.did)) return false;
    
    return proofValid;
  }
  
  /**
   * State integrity verification
   */
  async verifyStateIntegrity(snapshot: StateSnapshot): Promise<boolean> {
    // 1. Verify snapshot signature
    const sigValid = await this.verifySignature(
      snapshot.signature,
      snapshot.merkleRoot,
      snapshot.sourceDid
    );
    
    // 2. Verify merkle tree
    const rootValid = await this.verifyMerkleTree(snapshot);
    
    // 3. Verify proof
    const proofValid = await this.verifyInclusionProof(snapshot);
    
    return sigValid && rootValid && proofValid;
  }
  
  /**
   * Rate limiting for clone registration
   */
  private rateLimiter = new RateLimiter({
    windowMs: 60000,  // 1 minute
    maxRequests: 10,  // 10 registrations per minute
  });
  
  async checkRateLimit(did: string): Promise<boolean> {
    return this.rateLimiter.check(did);
  }
}
```

---

## 9. Migration Path

### 9.1 Network Maturity Stages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NETWORK MATURITY PROGRESSION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STAGE 1: CENTRALIZED (Current)                                             │
│  ═══════════════════════════                                                │
│  ┌─────────────┐                                                            │
│  │  Genesis    │  ← Single source of truth                                  │
│  │  Node       │  ← Full state stored here                                  │
│  │  (SDK)      │  ← All clones sync from here                               │
│  └─────────────┘                                                            │
│                                                                              │
│  STAGE 2: FEDERATED                                                         │
│  ════════════════                                                           │
│  ┌─────────────┐  ┌─────────────┐                                           │
│  │  Primary    │  │  Secondary  │  ← Multiple primaries                      │
│  │  Node A     │◄─┤  Node B     │  ← State sharding                          │
│  └─────────────┘  └─────────────┘  ← Cross-primary sync                     │
│                                                                              │
│  STAGE 3: DISTRIBUTED                                                       │
│  ══════════════════                                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐                                                   │
│  │ A │ │ B │ │ C │ │ D │  ← Full P2P                                        │
│  │ ○ │─│ ○ │─│ ○ │─│ ○ │  ← No central authority                           │
│  └───┘ └───┘ └───┘ └───┘  ← Distributed state                              │
│                                                                              │
│  STAGE 4: DECENTRALIZED                                                     │
│  ═════════════════════                                                      │
│  ┌───┐                                                                     │
│  │ ○ │  ← Anchor to L1 (optional)                                          │
│  │ □ │  ← IPFS/Filecoin storage                                            │
│  │ □ │  ← Full distribution                                                │
│  └───┘                                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Migration Protocol

```typescript
/**
 * Migration Protocol
 * Handles transition between network maturity stages
 */
export class MigrationProtocol {
  /**
   * Detect current network maturity
   */
  async detectMaturity(): Promise<NetworkMaturity> {
    const primaryCount = await this.countPrimaryNodes();
    const dhtCoverage = await this.measureDHTCoverage();
    
    if (primaryCount === 1 && dhtCoverage < 0.1) {
      return 'centralized';
    } else if (primaryCount > 1 && dhtCoverage < 0.5) {
      return 'federated';
    } else if (dhtCoverage >= 0.5 && !await this.hasL1Anchor()) {
      return 'distributed';
    } else {
      return 'decentralized';
    }
  }
  
  /**
   * Execute migration to next maturity stage
   */
  async migrate(targetMaturity: NetworkMaturity): Promise<void> {
    const current = await this.detectMaturity();
    
    if (this.maturityLevel(current) >= this.maturityLevel(targetMaturity)) {
      throw new Error('Cannot migrate to lower maturity level');
    }
    
    switch (targetMaturity) {
      case 'federated':
        await this.migrateToFederated();
        break;
      case 'distributed':
        await this.migrateToDistributed();
        break;
      case 'decentralized':
        await this.migrateToDecentralized();
        break;
    }
  }
  
  /**
   * Transition from primary to federated
   */
  private async migrateToFederated(): Promise<void> {
    // 1. Enable state sharding
    await this.enableStateSharding();
    
    // 2. Invite additional primary nodes
    await this.invitePrimaryNodes(3);
    
    // 3. Establish cross-primary sync
    await this.setupCrossPrimarySync();
    
    // 4. Reduce exit node dependency
    await this.transitionExitNodeToRelay();
  }
}
```

---

## 10. Summary

This design provides a comprehensive architecture for the `@vivim/sdk` to function as a **self-contained installable core primitive node** within the VIVIM chain of trust:

| Feature | Implementation |
|---------|----------------|
| **Self-Containment** | All nodes, apps, docs, and network bundled in single package |
| **Exit Node** | Full protocol for clone discovery, registration, and trust delegation |
| **Chain of Trust** | Anchor protocol with merkle roots, trust levels, and migration proofs |
| **Clone Sync** | State snapshots with merkle verification, incremental updates |
| **Security** | Identity verification, state integrity, rate limiting |
| **Migration Path** | Progressive decentralization from centralized to fully distributed |

### Next Steps

1. **Implement AnchorProtocol** in `sdk/src/core/anchor.ts`
2. **Implement ExitNodeService** in `sdk/src/protocols/exit-node.ts`
3. **Implement SyncProtocol** in `sdk/src/protocols/sync.ts`
4. **Add CLI commands** for node management
5. **Create migration utilities** for network maturity transitions
6. **Build and test** the self-contained package

---

*Document Version: 1.0.0*
*Last Updated: 2026-02-26*

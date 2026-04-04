# VIVIM Network Architecture Design
## Full Network Topology and Distributed System Architecture

---

## Executive Summary

This document designs a **hybrid federated-P2P network architecture** for VIVIM that combines the reliability of federated Personal Data Servers (PDS) with the privacy and resilience of peer-to-peer mesh networking. The architecture supports:

- **Offline-first operation** via CRDT-based synchronization
- **Real-time P2P communication** via WebRTC mesh
- **Scalable content discovery** via DHT (Kademlia-inspired)
- **Cross-instance federation** via VIVIM Protocol
- **End-to-end encryption** for all communications
- **Self-hosted node support** for full data sovereignty

---

## 1. Network Architecture Overview

### 1.1 Hybrid Federated-P2P Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     VIVIM NETWORK LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   FEDERATED  │  │     P2P      │  │    EDGE      │          │
│  │    LAYER     │  │    LAYER     │  │    LAYER     │          │
│  │              │  │              │  │              │          │
│  │ • PDS Nodes  │  │ • WebRTC     │  │ • Self-Hosted│          │
│  │ • Relays     │  │ • libp2p     │  │ • CDN Nodes  │          │
│  │ • Indexers   │  │ • Mesh       │  │ • Caches     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│              ┌────────────┴────────────┐                       │
│              │    VIVIM PROTOCOL       │                       │
│              │                         │                       │
│              │ • Identity (DID)        │                       │
│              │ • Content Routing       │                       │
│              │ • CRDT Sync             │                       │
│              │ • Encryption            │                       │
│              └─────────────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Network Layers

#### Layer 1: Federated Infrastructure (Reliability Layer)
- **Personal Data Servers (PDS)**: Store user data, provide availability
- **Relays**: Route messages between PDS nodes
- **Indexers**: Content search and discovery
- **Gateways**: Bridge to traditional web

#### Layer 2: P2P Mesh Network (Privacy Layer)
- **WebRTC connections**: Browser-to-browser direct communication
- **libp2p transport**: Universal connectivity protocol
- **Gossipsub**: Efficient message propagation
- **DHT**: Distributed content addressing

#### Layer 3: Edge Network (Performance Layer)
- **Self-hosted nodes**: User-run infrastructure
- **CDN nodes**: Content delivery optimization
- **Cache nodes**: Read replicas for popular content

---

## 2. Node Architecture

### 2.1 Node Types

```typescript
interface VIVIMNode {
  // Identity
  nodeId: string;              // Unique node identifier
  did: DID;                    // Decentralized identity
  publicKey: PublicKey;        // Ed25519 for signatures
  
  // Capabilities
  type: NodeType;
  roles: NodeRole[];
  
  // Network
  addresses: Multiaddr[];      // libp2p multiaddresses
  transports: Transport[];     // Supported transports
  
  // State
  status: NodeStatus;
  lastSeen: Timestamp;
  reputation: ReputationScore;
}

type NodeType = 
  | 'pds'           // Personal Data Server
  | 'relay'         // Message relay
  | 'indexer'       // Search indexer
  | 'edge'          // Edge/cache node
  | 'client'        // Browser/mobile client
  | 'self-hosted';  // User-hosted node

type NodeRole =
  | 'storage'       // Stores user data
  | 'routing'       // Routes messages
  | 'indexing'      // Indexes content
  | 'caching'       // Caches content
  | 'signaling'     // WebRTC signaling
  | 'bootstrap';    // Network bootstrap
```

### 2.2 Node Capabilities Matrix

| Node Type | Storage | Routing | Indexing | P2P | WebRTC | Self-Hosted |
|-----------|---------|---------|----------|-----|--------|-------------|
| PDS | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Relay | ⚠️ | ✅ | ❌ | ✅ | ⚠️ | ❌ |
| Indexer | ⚠️ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edge | ✅ | ⚠️ | ❌ | ✅ | ⚠️ | ✅ |
| Client | ⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 3. P2P Communication Layer

### 3.1 WebRTC Mesh Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                 WEBRTC MESH TOPOLOGY                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│    ┌─────┐         ┌─────┐         ┌─────┐                  │
│    │Alice│◄───────►│ Bob │◄───────►│Carol│                  │
│    └──┬──┘         └──┬──┘         └──┬──┘                  │
│       │               │               │                      │
│       │         ┌─────┴─────┐         │                      │
│       │         │  Relay    │         │                      │
│       │         │  Server   │         │                      │
│       │         └─────┬─────┘         │                      │
│       │               │               │                      │
│    ┌──┴──┐         ┌──┴──┐         ┌──┴──┐                  │
│    │ David│◄──────►│ Eve │◄──────►│Frank │                  │
│    └─────┘         └─────┘         └─────┘                  │
│                                                               │
│  • Direct connections when possible (WebRTC)                 │
│  • Relay through signaling server when NAT blocks            │
│  • Full mesh for small groups (< 10)                         │
│  • Partial mesh with supernodes for larger groups            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Connection Establishment Flow

```typescript
interface ConnectionEstablishment {
  // Step 1: Discovery
  discoverPeers(did: DID): Promise<PeerInfo[]>;
  
  // Step 2: Signaling (via relay if needed)
  exchangeCandidates(
    local: RTCIceCandidate[],
    remoteDid: DID
  ): Promise<RTCIceCandidate[]>;
  
  // Step 3: DTLS handshake
  establishSecureChannel(
    localKey: KeyPair,
    remoteKey: PublicKey
  ): Promise<SecureChannel>;
  
  // Step 4: Protocol negotiation
  negotiateProtocols(
    supported: Protocol[]
  ): Promise<Protocol[]>;
}

// WebRTC with libp2p transport
class VIVIMP2PTransport {
  private node: Libp2pNode;
  private webrtc: WebRTCTransport;
  
  async start() {
    this.node = await createLibp2p({
      transports: [
        webRTC({
          // STUN/TURN servers for NAT traversal
          iceServers: [
            { urls: 'stun:stun.vivim.net:3478' },
            { 
              urls: 'turn:turn.vivim.net:3478',
              username: 'vivim',
              credential: '...'
            }
          ]
        }),
        webSockets(), // Fallback
        tcp() // For Node.js
      ],
      connectionEncryption: [
        noise() // Noise Protocol for encryption
      ],
      streamMuxers: [
        yamux(),
        mplex()
      ],
      peerDiscovery: [
        bootstrap({
          list: [
            '/dns4/bootstrap1.vivim.net/tcp/443/wss/p2p/...',
            '/dns4/bootstrap2.vivim.net/tcp/443/wss/p2p/...'
          ]
        }),
        mdns(), // Local network discovery
        dhtRouting() // DHT-based discovery
      ]
    });
  }
}
```

### 3.3 Message Routing Protocol

```typescript
interface VIVIMMessage {
  // Header
  messageId: string;
  timestamp: Timestamp;
  ttl: number;              // Time-to-live (hops)
  
  // Routing
  from: DID;
  to?: DID;                // Direct message or null for broadcast
  topic?: string;          // Pub/sub topic
  
  // Content
  payload: EncryptedPayload;
  signature: Signature;
  
  // Options
  priority: Priority;
  deliveryGuarantee: 'best-effort' | 'at-least-once' | 'exactly-once';
}

enum Priority {
  CRITICAL = 0,  // System messages, sync
  HIGH = 1,      // User actions
  NORMAL = 2,    // Regular content
  LOW = 3        // Analytics, telemetry
}

// Gossip-based propagation
class GossipRouter {
  private mesh: Map<Topic, Set<PeerId>>;
  private gossip: GossipSub;
  
  async publish(topic: string, message: VIVIMMessage) {
    // Publish to mesh peers
    await this.gossip.publish(topic, message);
    
    // Gossip to random peers outside mesh
    await this.gossip.gossip(topic, message);
  }
  
  async subscribe(topic: string, handler: MessageHandler) {
    await this.gossip.subscribe(topic);
    this.gossip.on('message', (msg) => {
      if (msg.topic === topic) {
        handler(msg);
      }
    });
  }
}
```

---

## 4. Distributed Data Synchronization (CRDTs)

### 4.1 CRDT Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    CRDT SYNCHRONIZATION                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   Node A                    Node B                    Node C │
│   ┌─────┐                  ┌─────┐                  ┌─────┐ │
│   │State│◄──────Sync──────►│State│◄──────Sync──────►│State│ │
│   │ V3  │                  │ V3  │                  │ V2  │ │
│   └──┬──┘                  └──┬──┘                  └──┬──┘ │
│      │                        │                        │     │
│   ┌──┴──┐                  ┌──┴──┐                  ┌──┴──┐ │
│   │CRDT │                  │CRDT │                  │CRDT │ │
│   │Doc  │                  │Doc  │                  │Doc  │ │
│   └─────┘                  └─────┘                  └─────┘ │
│                                                               │
│   • Each node maintains local CRDT state                     │
│   • Changes merged automatically without conflicts           │
│   • Vector clocks track causality                            │
│   • Yjs for document CRDTs, Automerge for JSON               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 CRDT Document Types

```typescript
// Conversation CRDT
interface ConversationCRDT {
  id: string;
  title: Y.Text;              // Collaborative text
  messages: Y.Array<Message>; // Ordered list
  participants: Y.Map<Participant>;
  metadata: Y.Map<Metadata>;
}

// Circle CRDT
interface CircleCRDT {
  id: string;
  name: Y.Text;
  members: Y.Map<MemberState>;
  settings: Y.Map<Settings>;
  content: Y.Array<ContentRef>;
}

// User Profile CRDT
interface ProfileCRDT {
  did: DID;
  displayName: Y.Text;
  bio: Y.Text;
  avatar: Y.Map<AvatarRef>;
  circles: Y.Array<CircleRef>;
}

// Sync protocol
class CRDTSyncManager {
  private docs: Map<string, Y.Doc>;
  private provider: WebsocketProvider | WebrtcProvider;
  
  async syncDocument(docId: string, peers: DID[]) {
    const doc = this.docs.get(docId) || new Y.Doc();
    
    // WebRTC provider for P2P sync
    this.provider = new WebrtcProvider(docId, doc, {
      signaling: ['wss://signaling.vivim.net'],
      password: null,
      awareness: new awarenessProtocol.Awareness(doc)
    });
    
    // Handle sync updates
    this.provider.on('sync', (isSynced) => {
      console.log(`Document ${docId} synced: ${isSynced}`);
    });
    
    // Broadcast local changes
    doc.on('update', (update) => {
      this.broadcastUpdate(docId, update);
    });
    
    return doc;
  }
  
  private broadcastUpdate(docId: string, update: Uint8Array) {
    // Encode update
    const encoded = Y.encodeStateAsUpdate(this.docs.get(docId)!);
    
    // Send via P2P mesh
    this.p2p.publish(`crdt:${docId}`, encoded);
  }
}
```

### 4.3 Vector Clocks for Causality

```typescript
interface VectorClock {
  [nodeId: string]: number;
}

class CausalityTracker {
  private clock: VectorClock = {};
  
  increment(nodeId: string): VectorClock {
    this.clock[nodeId] = (this.clock[nodeId] || 0) + 1;
    return { ...this.clock };
  }
  
  merge(other: VectorClock): VectorClock {
    const merged = { ...this.clock };
    for (const [node, time] of Object.entries(other)) {
      merged[node] = Math.max(merged[node] || 0, time);
    }
    this.clock = merged;
    return merged;
  }
  
  // Happens-before relationship
  compare(a: VectorClock, b: VectorClock): 'before' | 'after' | 'concurrent' {
    let aBeforeB = true;
    let bBeforeA = true;
    
    const allNodes = new Set([...Object.keys(a), ...Object.keys(b)]);
    
    for (const node of allNodes) {
      const aTime = a[node] || 0;
      const bTime = b[node] || 0;
      
      if (aTime > bTime) aBeforeB = false;
      if (bTime > aTime) bBeforeA = false;
    }
    
    if (aBeforeB && !bBeforeA) return 'before';
    if (bBeforeA && !aBeforeB) return 'after';
    return 'concurrent';
  }
}
```

---

## 5. Content Discovery (DHT)

### 5.1 Kademlia-Inspired DHT

```
┌──────────────────────────────────────────────────────────────┐
│              DISTRIBUTED HASH TABLE (DHT)                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Content ID: SHA256("conversation:123")                      │
│  = 0x7a3f...9e2d (160-bit)                                   │
│                                                               │
│  Node A (0x7a2f...) ◄──── closest ────► Content              │
│       │                                                     │
│       │  XOR distance = 0x0001...                            │
│       │                                                     │
│  Node B (0x7b3f...)                                          │
│       │  XOR distance = 0x0100...                            │
│       │                                                     │
│  Node C (0x8a3f...)                                          │
│          XOR distance = 0x1000...                            │
│                                                               │
│  Routing Table (k-buckets):                                   │
│  Bucket 0: nodes with prefix 0                               │
│  Bucket 1: nodes with prefix 1                               │
│  ...                                                          │
│  Bucket n: nodes with prefix n                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Content Addressing

```typescript
// Content addressing with DHT
class VIVIMDHT {
  private dht: KadDHT;
  
  async start() {
    this.dht = new KadDHT({
      // Kademlia parameters
      kBucketSize: 20,        // Max peers per bucket
      alpha: 3,               // Parallel lookup count
      refreshInterval: 3600,  // Bucket refresh (seconds)
      
      // Validation
      validators: {
        // Custom validator for VIVIM records
        '/vivim/content': this.validateContentRecord.bind(this)
      },
      
      // Selectors
      selectors: {
        // Choose best record by timestamp
        '/vivim/content': (a, b) => {
          return a.timestamp > b.timestamp ? 0 : 1;
        }
      }
    });
  }
  
  // Store content reference
  async publishContent(contentId: string, location: ContentLocation) {
    const key = `/vivim/content/${contentId}`;
    const record = {
      location,
      timestamp: Date.now(),
      signature: await this.sign(location)
    };
    
    await this.dht.put(key, JSON.stringify(record));
  }
  
  // Find content
  async findContent(contentId: string): Promise<ContentLocation[]> {
    const key = `/vivim/content/${contentId}`;
    
    // Query DHT
    const providers = await this.dht.getMany(key, 5);
    
    return providers.map(p => JSON.parse(p).location);
  }
  
  // Provide content (announce we're storing it)
  async provideContent(contentId: string) {
    const cid = await this.contentIdToCID(contentId);
    await this.dht.provide(cid);
  }
  
  // Find providers of content
  async findProviders(contentId: string): Promise<PeerId[]> {
    const cid = await this.contentIdToCID(contentId);
    return await this.dht.findProviders(cid, { timeout: 10000 });
  }
}

// Content location record
interface ContentLocation {
  type: 'pds' | 'p2p' | 'edge';
  url?: string;           // For PDS/HTTP
  peerId?: string;        // For P2P
  multiaddrs?: string[];  // Direct connection addresses
  expiresAt: number;      // TTL
}
```

### 5.3 Topic-Based Routing

```typescript
// Gossipsub for topic-based messaging
class TopicRouter {
  private gossip: GossipSub;
  
  async subscribeToTopic(topic: string, handler: MessageHandler) {
    // Join topic mesh
    await this.gossip.subscribe(topic);
    
    // Handle incoming messages
    this.gossip.on('message', (event) => {
      if (event.detail.topic === topic) {
        handler(event.detail.data);
      }
    });
    
    // Publish to topic
    await this.gossip.publish(topic, message);
  }
  
  // Topic hierarchy
  getTopicPath(circleId: string, subtopic?: string): string {
    return subtopic 
      ? `/vivim/circles/${circleId}/${subtopic}`
      : `/vivim/circles/${circleId}`;
  }
}
```

---

## 6. Federation Protocol

### 6.1 VIVIM Federation Protocol

```typescript
// Cross-instance communication
interface FederationMessage {
  // Identity
  sourcePDS: string;        // Origin PDS URL
  sourceDID: DID;
  targetPDS?: string;       // Specific target or broadcast
  
  // Message
  type: FederationMessageType;
  payload: unknown;
  timestamp: Timestamp;
  
  // Security
  signature: Signature;
  proof?: InclusionProof;   // For batch operations
}

type FederationMessageType =
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'follow'
  | 'unfollow'
  | 'circle.invite'
  | 'sync.request'
  | 'sync.response';

// HTTP-based federation (ActivityPub-inspired)
class FederationClient {
  private axios: AxiosInstance;
  
  async sendActivity(
    targetPDS: string,
    activity: FederationMessage
  ) {
    const inbox = `${targetPDS}/api/v1/federation/inbox`;
    
    await this.axios.post(inbox, activity, {
      headers: {
        'Content-Type': 'application/ld+json',
        'Signature': await this.signRequest(activity)
      }
    });
  }
  
  async handleInbox(activity: FederationMessage) {
    // Verify signature
    const isValid = await this.verifySignature(activity);
    if (!isValid) throw new Error('Invalid signature');
    
    // Process based on type
    switch (activity.type) {
      case 'content.create':
        await this.handleRemoteContent(activity);
        break;
      case 'follow':
        await this.handleFollowRequest(activity);
        break;
      // ... etc
    }
  }
}
```

### 6.2 Instance Discovery

```typescript
// Well-known endpoint for instance info
interface InstanceMetadata {
  domain: string;
  did: DID;
  software: {
    name: 'vivim';
    version: string;
  };
  services: {
    pds: string;
    relay?: string;
    indexer?: string;
  };
  protocols: string[];      // Supported protocols
  features: string[];       // Supported features
  limits: {
    maxMessageSize: number;
    maxAttachments: number;
    rateLimit: RateLimit;
  };
}

// Instance directory
class InstanceDirectory {
  private instances: Map<string, InstanceMetadata>;
  
  async registerInstance(metadata: InstanceMetadata) {
    // Validate instance
    await this.validateInstance(metadata);
    
    // Store in directory
    this.instances.set(metadata.domain, metadata);
    
    // Broadcast to network
    await this.broadcastInstance(metadata);
  }
  
  async discoverInstances(): Promise<InstanceMetadata[]> {
    // Query known instances
    return Array.from(this.instances.values());
  }
}
```

---

## 7. Security Architecture

### 7.1 Encryption Layers

```
┌──────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Transport Security                                  │
│  ├── TLS 1.3 for HTTP/WebSocket                              │
│  ├── DTLS for WebRTC data channels                           │
│  └── Noise Protocol for libp2p                               │
│                                                               │
│  Layer 2: Message Security                                    │
│  ├── Ed25519 signatures for authenticity                     │
│  ├── X25519 key exchange for encryption                      │
│  └── Perfect forward secrecy (PFS)                           │
│                                                               │
│  Layer 3: Content Security                                    │
│  ├── AES-256-GCM for content encryption                      │
│  ├── Content-addressed storage (IPFS-style)                  │
│  └── Access control via capabilities                         │
│                                                               │
│  Layer 4: Application Security                                │
│  ├── Capability-based access control                         │
│  ├── Rate limiting and DDoS protection                       │
│  └── Audit logging                                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 End-to-End Encryption

```typescript
// E2E encryption for direct messages
class E2EEncryption {
  private keyStore: KeyStore;
  
  // Generate keypair for user
  async generateKeyPair(): Promise<KeyPair> {
    return await Ed25519.generateKeyPair();
  }
  
  // Encrypt message for recipient
  async encryptMessage(
    plaintext: string,
    recipientPublicKey: PublicKey
  ): Promise<EncryptedMessage> {
    // Generate ephemeral keypair
    const ephemeral = await X25519.generateKeyPair();
    
    // ECDH key exchange
    const sharedSecret = await X25519.sharedSecret(
      ephemeral.privateKey,
      recipientPublicKey
    );
    
    // Derive encryption key
    const encryptionKey = await HKDF.derive(
      sharedSecret,
      'vivim-message-v1'
    );
    
    // Encrypt
    const nonce = crypto.randomBytes(12);
    const ciphertext = await AESGCM.encrypt(
      encryptionKey,
      nonce,
      plaintext
    );
    
    return {
      ephemeralPublicKey: ephemeral.publicKey,
      nonce,
      ciphertext,
      // Include sender signature
      signature: await this.sign(ciphertext)
    };
  }
  
  // Decrypt message
  async decryptMessage(
    encrypted: EncryptedMessage,
    privateKey: PrivateKey
  ): Promise<string> {
    // ECDH to derive shared secret
    const sharedSecret = await X25519.sharedSecret(
      privateKey,
      encrypted.ephemeralPublicKey
    );
    
    // Derive key
    const encryptionKey = await HKDF.derive(
      sharedSecret,
      'vivim-message-v1'
    );
    
    // Decrypt
    return await AESGCM.decrypt(
      encryptionKey,
      encrypted.nonce,
      encrypted.ciphertext
    );
  }
}
```

### 7.3 Capability-Based Access Control

```typescript
// Capability tokens for fine-grained access
interface Capability {
  // Who can use this capability
  subject: DID;
  
  // What resource
  resource: {
    type: 'content' | 'circle' | 'profile';
    id: string;
  };
  
  // What actions
  rights: ('read' | 'write' | 'admin')[];
  
  // Constraints
  constraints?: {
    expiresAt?: Timestamp;
    maxUses?: number;
    allowedIPs?: string[];
    requires2FA?: boolean;
  };
  
  // Proof
  issuer: DID;
  signature: Signature;
}

class CapabilityManager {
  // Issue capability
  async issueCapability(
    resource: Resource,
    subject: DID,
    rights: Right[],
    constraints?: Constraints
  ): Promise<Capability> {
    const capability: Capability = {
      subject,
      resource,
      rights,
      constraints,
      issuer: this.did,
      signature: null as any
    };
    
    capability.signature = await this.sign(capability);
    return capability;
  }
  
  // Verify capability
  async verifyCapability(
    capability: Capability,
    action: Right
  ): Promise<boolean> {
    // Check signature
    const isValid = await this.verifySignature(capability);
    if (!isValid) return false;
    
    // Check expiration
    if (capability.constraints?.expiresAt) {
      if (Date.now() > capability.constraints.expiresAt) {
        return false;
      }
    }
    
    // Check rights
    return capability.rights.includes(action);
  }
}
```

---

## 8. Edge Computing & CDN

### 8.1 Edge Node Architecture

```typescript
// Edge node for content caching and computation
class EdgeNode {
  private cache: LRUCache<string, Content>;
  private compute: EdgeCompute;
  
  constructor(config: EdgeConfig) {
    this.cache = new LRUCache({
      maxSize: config.cacheSize,
      ttl: config.cacheTTL
    });
    
    this.compute = new EdgeCompute({
      sandbox: true,
      maxMemory: '512MB',
      timeout: 5000
    });
  }
  
  // Cache content
  async cacheContent(contentId: string, content: Content) {
    // Store in local cache
    await this.cache.set(contentId, content);
    
    // Announce to network
    await this.dht.provideContent(contentId);
    
    // Replicate to nearby edge nodes
    await this.replicateToNeighbors(contentId, content);
  }
  
  // Serve cached content
  async serveContent(contentId: string): Promise<Content | null> {
    // Check local cache
    let content = await this.cache.get(contentId);
    if (content) return content;
    
    // Fetch from origin
    content = await this.fetchFromOrigin(contentId);
    if (content) {
      await this.cache.set(contentId, content);
      return content;
    }
    
    return null;
  }
  
  // Edge computation
  async runEdgeFunction(
    functionId: string,
    input: unknown
  ): Promise<unknown> {
    // Execute in sandboxed environment
    return await this.compute.execute(functionId, input);
  }
}
```

### 8.2 Geographic Distribution

```typescript
// Geographic load balancing
class GeoDistributor {
  private geoDB: GeoIPDatabase;
  private nodes: Map<Region, EdgeNode[]>;
  
  async routeRequest(
    request: Request,
    contentId: string
  ): Promise<EdgeNode> {
    // Determine user location
    const location = await this.geoDB.lookup(request.ip);
    
    // Find nearest edge nodes
    const nearbyNodes = this.getNodesInRegion(location.region);
    
    // Check which have content cached
    const nodesWithContent = await Promise.all(
      nearbyNodes.map(async node => ({
        node,
        hasContent: await node.hasContent(contentId),
        load: await node.getLoad()
      }))
    );
    
    // Select best node (has content + low load)
    const bestNode = nodesWithContent
      .filter(n => n.hasContent)
      .sort((a, b) => a.load - b.load)[0];
    
    if (bestNode) return bestNode.node;
    
    // Fallback to least loaded node
    return nodesWithContent.sort((a, b) => a.load - b.load)[0].node;
  }
}
```

---

## 9. Network API Specification

### 9.1 REST API Endpoints

```yaml
# Network management API
paths:
  /api/v2/network/peers:
    get:
      summary: List connected peers
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/PeerInfo'

  /api/v2/network/connect:
    post:
      summary: Connect to a peer
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                multiaddr:
                  type: string
                  example: /dns4/peer.vivim.net/tcp/443/wss/p2p/Qm...
      responses:
        200:
          description: Connected successfully

  /api/v2/network/content/{contentId}/providers:
    get:
      summary: Find content providers
      parameters:
        - name: contentId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ContentLocation'

  /api/v2/network/sync/{docId}:
    post:
      summary: Request CRDT sync
      parameters:
        - name: docId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Sync initiated
```

### 9.2 WebSocket Events

```typescript
// Real-time network events
interface NetworkEvents {
  // Peer events
  'peer:connected': { peerId: string; multiaddrs: string[] };
  'peer:disconnected': { peerId: string; reason: string };
  'peer:discovered': { peerId: string; via: string };
  
  // Content events
  'content:available': { contentId: string; providers: string[] };
  'content:requested': { contentId: string; requester: string };
  
  // Sync events
  'sync:start': { docId: string; peers: string[] };
  'sync:progress': { docId: string; progress: number };
  'sync:complete': { docId: string; duration: number };
  
  // Message events
  'message:received': { from: string; topic: string; data: unknown };
  'message:delivered': { messageId: string; to: string };
}
```

---

## 10. Implementation Roadmap

### Phase 1: Core P2P (Months 1-2)
- [ ] libp2p integration
- [ ] WebRTC transport
- [ ] Basic DHT implementation
- [ ] Gossipsub pub/sub
- [ ] Bootstrap node setup

### Phase 2: CRDT Sync (Months 2-3)
- [ ] Yjs integration
- [ ] Document CRDTs
- [ ] Vector clock implementation
- [ ] Conflict resolution
- [ ] Offline support

### Phase 3: Federation (Months 3-4)
- [ ] VIVIM Protocol specification
- [ ] HTTP federation API
- [ ] Instance discovery
- [ ] Cross-instance messaging
- [ ] ActivityPub bridge

### Phase 4: Security (Months 4-5)
- [ ] E2E encryption
- [ ] Noise Protocol implementation
- [ ] Capability system
- [ ] Rate limiting
- [ ] DDoS protection

### Phase 5: Edge Network (Months 5-6)
- [ ] Edge node software
- [ ] CDN integration
- [ ] Geographic routing
- [ ] Cache management
- [ ] Edge computing

---

## 11. Performance Targets

| Metric | Target |
|--------|--------|
| P2P Connection Setup | < 2 seconds |
| Message Propagation (95th percentile) | < 500ms |
| CRDT Sync Latency | < 1 second |
| DHT Lookup Time | < 3 hops |
| Content Discovery | < 5 seconds |
| Edge Cache Hit Rate | > 80% |
| Network Availability | 99.9% |
| Max Concurrent Peers | 1000+ per node |

---

## 12. Comparison with Existing Networks

| Feature | Mastodon | Bluesky | IPFS | VIVIM (Proposed) |
|---------|----------|---------|------|------------------|
| Architecture | Federated | Federated + PDS | Pure P2P | Hybrid Fed-P2P |
| P2P Messaging | ❌ | ⚠️ (Planned) | ✅ | ✅ |
| CRDT Sync | ❌ | ❌ | ⚠️ | ✅ |
| WebRTC Support | ❌ | ❌ | ❌ | ✅ |
| Self-Hosting | ✅ | ✅ | ✅ | ✅ |
| Offline Support | ❌ | ❌ | ✅ | ✅ |
| E2E Encryption | ⚠️ | ⚠️ | ❌ | ✅ |
| DHT Discovery | ❌ | ❌ | ✅ | ✅ |

---

## Conclusion

This network architecture provides VIVIM with:

1. **Scalability** - Federated layer handles growth, P2P handles real-time
2. **Resilience** - No single point of failure, works offline
3. **Privacy** - P2P for sensitive data, E2E encryption
4. **Interoperability** - Federation with existing networks
5. **Sovereignty** - Self-hosted options, data portability
6. **Performance** - Edge computing, geographic distribution

The hybrid approach gives us the best of both worlds: the reliability and discoverability of federated systems, combined with the privacy and resilience of P2P networks.

---

**Status**: Design Complete  
**Next Steps**: Implementation Phase 1 (Core P2P)

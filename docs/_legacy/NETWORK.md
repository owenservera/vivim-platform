# <img src="https://img.icons8.com/color/48/000000/network.png" width="40" align="left" /> VIVIM Network Engine

### P2P Networking, CRDT Synchronization & Federation Layer

[« Back to Main Repository](../README.md) | [« Back to Documentation Index](./README.md)

---

## 📖 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [🏗️ Architecture](#️-architecture)
- [🔌 API Reference](#-api-reference)
- [🧩 CRDT Types](#-crdt-types)
- [🔐 Security](#-security)
- [🤝 Contributing](#-contributing)

---

## ✨ Overview

The **VIVIM Network Engine** is a decentralized networking layer built on LibP2P that enables peer-to-peer communication, CRDT-based data synchronization, and federation between VIVIM instances.

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| LibP2P | 1.x | P2P Networking Framework |
| Yjs | 13.6.x | CRDT Library |
| WebRTC | - | Real-time P2P Communication |
| WebSockets | - | WebSocket Transport |
| @noble/crypto | - | Cryptographic Primitives |
| multiformats | 13.x | Content Addressing |

---

## 🎯 Features

### Core Capabilities

| Feature | Description | Status |
|---------|-------------|--------|
| **P2P Networking** | LibP2P-based peer discovery and communication | ✅ Stable |
| **CRDT Sync** | Conflict-free replicated data types for offline-first sync | ✅ Stable |
| **Federation** | Cross-instance communication and data sharing | 🚧 Beta |
| **E2E Encryption** | End-to-end encrypted communications | ✅ Stable |
| **DHT** | Distributed hash table for content discovery | ✅ Stable |
| **Pub/Sub** | Topic-based publish/subscribe messaging | ✅ Stable |
| **Connection Manager** | Automatic connection management and recovery | ✅ Stable |
| **Peer Discovery** | mDNS and bootstrap-based peer discovery | ✅ Stable |

### Network Protocols

```
┌─────────────────────────────────────────────────────────────────┐
│                   Network Protocol Stack                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Application Layer                                              │
│  ├── CRDT Sync Protocol    (Yjs over LibP2P)                   │
│  ├── Federation Protocol   (ActivityPub-inspired)              │
│  └── Chat Protocol         (Encrypted messaging)               │
│                                                                 │
│  Transport Layer                                                │
│  ├── WebSockets            (ws://, wss://)                     │
│  ├── WebRTC                (rtc://, for browser P2P)           │
│  └── TCP                   (tcp://, for node-to-node)          │
│                                                                 │
│  Routing Layer                                                  │
│  ├── Kademlia DHT          (Content addressing & discovery)    │
│  └── Gossipsub             (Pub/Sub message routing)           │
│                                                                 │
│  Security Layer                                                 │
│  ├── Noise Protocol        (Handshake & encryption)            │
│  ├── TLS                   (Transport security)                │
│  └── E2E Encryption      (Application-layer encryption)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

```bash
# Navigate to network directory
cd network

# Install dependencies
bun install
```

### Dependencies

```json
{
  "dependencies": {
    "libp2p": "^1.0.0",
    "@libp2p/webrtc": "^6.0.0",
    "@libp2p/websockets": "^10.0.0",
    "@libp2p/kad-dht": "^16.0.0",
    "@libp2p/gossipsub": "^15.0.0",
    "yjs": "^13.6.0",
    "y-websocket": "^1.5.0",
    "@noble/hashes": "^1.3.0",
    "multiformats": "^13.0.0",
    "uint8arrays": "^5.0.0"
  }
}
```

---

## 🚀 Quick Start

### Development

```bash
# Start network engine with WebSocket server
bun run dev

# WebSocket server runs at ws://localhost:1235
# P2P listens on /ip4/0.0.0.0/tcp/9000/ws
```

### Basic Usage

```typescript
import { NetworkNode } from '@vivim/network-engine'

// Create a network node
const node = new NetworkNode({
  nodeType: 'peer',
  roles: ['storage', 'compute'],
  listenAddresses: ['/ip4/0.0.0.0/tcp/9000/ws'],
  enableWebRTC: true,
  enableDHT: true,
  enableGossipsub: true,
  minConnections: 5,
  maxConnections: 50
})

// Start the node
await node.start()

console.log(`Peer ID: ${node.getPeerId()}`)
console.log(`Listen Addresses: ${node.getListenAddresses()}`)

// Connect to another peer
await node.connect('/ip4/192.168.1.100/tcp/9000/ws')

// Stop the node
await node.stop()
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Network Engine Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Application Layer                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │   CRDT      │  │ Federation  │  │   Vivim Chat    │  │   │
│  │  │   Sync      │  │   Client    │  │   Runtime       │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                   P2P Layer                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │ Connection  │  │    Peer     │  │   Network       │   │ │
│  │  │  Manager    │  │  Discovery  │  │    Node         │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                  CRDT Layer                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │   CRDT      │  │   LibP2P    │  │   Vector        │   │ │
│  │  │   Sync      │  │   Yjs       │  │   Clock         │   │ │
│  │  │   Service   │  │   Provider  │  │                 │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │Conversation │  │    Circle   │  │     Friend      │   │ │
│  │  │    CRDT     │  │    CRDT     │  │     CRDT        │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │               Discovery Layer                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │     DHT     │  │   Content   │  │    Pub/Sub      │   │ │
│  │  │   Service   │  │  Registry   │  │  Topic Manager  │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │               Federation Layer                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │ Federation  │  │ Federation  │  │   Instance      │   │ │
│  │  │   Client    │  │   Server    │  │   Discovery     │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                Security Layer                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │     E2E     │  │     Key     │  │  Capability     │   │ │
│  │  │ Encryption  │  │  Manager    │  │   Manager       │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Reference

### NetworkNode

```typescript
class NetworkNode {
  constructor(config: NetworkNodeConfig)
  
  // Lifecycle
  start(): Promise<void>
  stop(): Promise<void>
  
  // Information
  getPeerId(): string
  getNodeInfo(): NetworkNodeInfo
  getListenAddresses(): string[]
  getConnections(): Connection[]
  
  // Connections
  connect(multiaddr: string): Promise<void>
  disconnect(peerId: string): Promise<void>
  
  // DHT
  get(key: string): Promise<Uint8Array>
  put(key: string, value: Uint8Array): Promise<void>
  findPeer(peerId: string): Promise<PeerInfo>
  
  // Pub/Sub
  subscribe(topic: string, handler: MessageHandler): void
  unsubscribe(topic: string): void
  publish(topic: string, data: Uint8Array): Promise<void>
}
```

### Configuration

```typescript
interface NetworkNodeConfig {
  nodeType: 'indexer' | 'storage' | 'compute' | 'peer'
  roles: ('indexer' | 'storage' | 'compute')[]
  listenAddresses: string[]
  enableWebRTC: boolean
  enableDHT: boolean
  enableGossipsub: boolean
  minConnections: number
  maxConnections: number
  bootstrapPeers: string[]
}
```

### CRDT Sync Service

```typescript
class CRDTSyncService {
  constructor(config: CRDTSyncConfig)
  
  // Document management
  getDocument(name: string): Y.Doc
  createDocument(name: string): Y.Doc
  
  // Sync
  sync(document: Y.Doc, peerId: string): Promise<void>
  stopSync(document: Y.Doc): void
  
  // Awareness
  setAwareness(field: string, value: any): void
  getAwareness(peerId: string): Record<string, any>
}
```

---

## 🧩 CRDT Types

### Conversation CRDT

```typescript
class ConversationCRDT {
  doc: Y.Doc
  messages: Y.Array<Message>
  participants: Y.Map<Participant>
  metadata: Y.Map<any>
  
  addMessage(message: Message): void
  removeMessage(messageId: string): void
  addParticipant(participant: Participant): void
  updateMetadata(key: string, value: any): void
}
```

### Circle CRDT

```typescript
class CircleCRDT {
  doc: Y.Doc
  members: Y.Map<Member>
  posts: Y.Array<Post>
  settings: Y.Map<CircleSettings>
  
  addMember(member: Member): void
  removeMember(memberId: string): void
  addPost(post: Post): void
  updateSettings(settings: Partial<CircleSettings>): void
}
```

### Friend CRDT

```typescript
class FriendCRDT {
  doc: Y.Doc
  friends: Y.Map<FriendData>
  pendingRequests: Y.Map<PendingRequest>
  
  addFriend(friend: FriendData): void
  removeFriend(friendId: string): void
  sendRequest(request: PendingRequest): void
  acceptRequest(requestId: string): void
}
```

### Vector Clock

```typescript
class VectorClock {
  private clock: Map<string, number>
  
  increment(nodeId: string): void
  merge(other: VectorClock): void
  compare(other: VectorClock): -1 | 0 | 1
  toJSON(): Record<string, number>
}
```

---

## 🔐 Security

### E2E Encryption

```typescript
import { E2EEncryption } from '@vivim/network-engine'

const e2e = new E2EEncryption({
  algorithm: 'x25519',
  cipher: 'aes-256-gcm'
})

// Generate key pair
const keyPair = e2e.generateKeyPair()

// Derive shared secret
const sharedSecret = e2e.deriveSharedSecret(
  keyPair.privateKey,
  recipientPublicKey
)

// Encrypt message
const encrypted = e2e.encrypt(sharedSecret, message)

// Decrypt message
const decrypted = e2e.decrypt(sharedSecret, encrypted)
```

### Key Manager

```typescript
import { KeyManager } from '@vivim/network-engine'

const keyManager = new KeyManager()

// Generate identity key
const identityKey = await keyManager.generateKey('identity')

// Generate encryption key
const encryptionKey = await keyManager.generateKey('encryption')

// Sign data
const signature = await keyManager.sign(identityKey, data)

// Verify signature
const valid = await keyManager.verify(identityKey.publicKey, data, signature)
```

### Capability Manager

```typescript
import { CapabilityManager } from '@vivim/network-engine'

const capabilityManager = new CapabilityManager()

// Issue capability
const capability = capabilityManager.issue({
  issuer: 'did:vivim:alice',
  audience: 'did:vivim:bob',
  action: 'read',
  resource: 'memory:abc123',
  expiresAt: Date.now() + 86400000 // 24 hours
})

// Verify capability
const valid = await capabilityManager.verify(capability)
```

---

## 📁 Project Structure

```
network/
├── src/
│   ├── p2p/                   # P2P networking
│   │   ├── NetworkNode.ts
│   │   ├── ConnectionManager.ts
│   │   └── PeerDiscovery.ts
│   │
│   ├── crdt/                  # CRDT implementations
│   │   ├── CRDTSyncService.ts
│   │   ├── Libp2pYjsProvider.ts
│   │   ├── VectorClock.ts
│   │   ├── ConversationCRDT.ts
│   │   ├── CircleCRDT.ts
│   │   ├── FriendCRDT.ts
│   │   ├── FollowCRDT.ts
│   │   ├── GroupCRDT.ts
│   │   └── TeamCRDT.ts
│   │
│   ├── dht/                   # Distributed hash table
│   │   ├── DHTService.ts
│   │   └── ContentRegistry.ts
│   │
│   ├── pubsub/                # Publish/subscribe
│   │   ├── PubSubService.ts
│   │   └── TopicManager.ts
│   │
│   ├── federation/            # Federation layer
│   │   ├── FederationClient.ts
│   │   ├── FederationServer.ts
│   │   └── InstanceDiscovery.ts
│   │
│   ├── security/              # Security layer
│   │   ├── E2EEncryption.ts
│   │   ├── KeyManager.ts
│   │   └── CapabilityManager.ts
│   │
│   ├── chain/                 # Blockchain integration
│   │   ├── ChainClient.ts
│   │   ├── EventStore.ts
│   │   ├── StateMachine.ts
│   │   ├── EventHandler.ts
│   │   ├── ChainDHT.ts
│   │   ├── GossipSync.ts
│   │   ├── HLClock.ts
│   │   └── utils.ts
│   │
│   ├── storage/               # Distributed storage
│   │   └── DistributedContentClient.ts
│   │
│   ├── api/                   # High-level APIs
│   │   └── VivimChatRuntime.ts
│   │
│   ├── utils/                 # Utilities
│   │   ├── logger.ts
│   │   └── error-reporter.ts
│   │
│   ├── common/                # Shared types
│   │   └── error-reporting.ts
│   │
│   ├── types.ts               # Type definitions
│   └── index.ts               # Main exports
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🤝 Contributing

### Development Setup

```bash
# Clone and navigate
cd network

# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Start development
bun run dev
```

### Testing

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui
```

---

## 📜 License

MIT License - see [LICENSE](../LICENSE) for details.

---

<div align="center">

**Built with ❤️ by the VIVIM Team**

[⬆ Back to top](#vivim-network-engine) | [🏠 Back to Main Repo](../README.md) | [📚 Back to Docs](./README.md)

</div>

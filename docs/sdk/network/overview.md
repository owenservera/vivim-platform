---
sidebar_position: 4
---

# Network

VIVIM Network nodes provide the infrastructure for peer-to-peer communication and decentralized networking.

## Official Network Nodes

| Node | Package | Description |
|------|---------|-------------|
| **Bootstrap** | `@vivim/node-bootstrap` | Bootstrap/Discovery server |
| **Relay** | `@vivim/node-relay` | P2P relay server |
| **Indexer** | `@vivim/node-indexer` | Content indexer |
| **Anchor** | `@vivim/node-anchor` | Blockchain anchor |
| **Gateway** | `@vivim/node-gateway` | IPFS/HTTP gateway |

## Bootstrap Node

Bootstrap nodes help new peers discover and connect to the VIVIM network.

```typescript
import { BootstrapNode } from '@vivim/node-bootstrap';

const bootstrapNode = await sdk.loadNode<BootstrapNode>('bootstrap');

// Get peer list
const peers = await bootstrapNode.getPeers();

// Connect to peers
await bootstrapNode.connect(peers);

// Register as peer
await bootstrapNode.register({
  address: '/ip4/192.168.1.1/tcp/4001',
  protocols: ['storage', 'identity'],
});

// Discover nodes by capability
const storageNodes = await bootstrapNode.discover('storage');
```

### Running a Bootstrap Node

```typescript
import { createBootstrapNode } from '@vivim/node-bootstrap';

const bootstrap = await createBootstrapNode({
  port: 4001,
  host: '0.0.0.0',
  maxPeers: 1000,
  persistence: {
    enabled: true,
    path: './data/bootstrap',
  },
});

bootstrap.start();
console.log(`Bootstrap node running on port ${bootstrap.port}`);
```

### Configuration

```typescript
interface BootstrapConfig {
  port: number;
  host: string;
  maxPeers: number;
  
  // Persistence
  persistence?: {
    enabled: boolean;
    path: string;
  };
  
  // Security
  rateLimit?: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  
  // Bootstrap bootstrap nodes (meta!)
  bootstrapPeers?: string[];
}
```

## Relay Node

Relay nodes facilitate P2P connections when direct connections are not possible.

```typescript
import { RelayNode } from '@vivim/node-relay';

const relayNode = await sdk.loadNode<RelayNode>('relay');

// Reserve relay connection
const reservation = await relayNode.reserve({
  duration: 3600, // seconds
});

// Connect through relay
const connection = await relayNode.connect(
  'did:vivim:...',
  reservation.token,
);

// Send message through relay
await connection.send(data);
```

### Running a Relay Node

```typescript
import { createRelayNode } from '@vivim/node-relay';

const relay = await createRelayNode({
  port: 4002,
  host: '0.0.0.0',
  maxReservations: 100,
  maxConnections: 500,
  
  // Reservation settings
  reservationDuration: 3600, // 1 hour
  maxReservationDuration: 86400, // 24 hours
  
  // Resource limits
  limits: {
    maxDataTransfer: 1024 * 1024 * 100, // 100MB
    maxConnectionsPerPeer: 5,
  },
});

relay.start();
console.log(`Relay node running on port ${relay.port}`);
```

### Circuit Relay

```typescript
// Peer A wants to connect to Peer B through relay
const circuitConnection = await relayNode.circuitConnect({
  source: peerA,
  destination: peerB,
});

// Data flows through relay
circuitConnection.on('data', (data) => {
  console.log('Received:', data);
});

circuitConnection.send(myData);
```

## Indexer Node

Indexer nodes provide content discovery and search capabilities.

```typescript
import { IndexerNode } from '@vivim/node-indexer';

const indexerNode = await sdk.loadNode<IndexerNode>('indexer');

// Index content
await indexerNode.index({
  cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
  type: 'document',
  metadata: {
    title: 'My Document',
    author: 'did:vivim:...',
    tags: ['vivim', 'sdk'],
  },
  vectors: [0.1, 0.2, 0.3, ...], // Optional embeddings
});

// Search content
const results = await indexerNode.search('VIVIM SDK', {
  limit: 10,
  filters: {
    type: 'document',
    author: 'did:vivim:...',
  },
});

// Get content by CID
const content = await indexerNode.get(cid);

// Remove from index
await indexerNode.remove(cid);
```

### Running an Indexer Node

```typescript
import { createIndexerNode } from '@vivim/node-indexer';

const indexer = await createIndexerNode({
  port: 4003,
  host: '0.0.0.0',
  
  // Storage
  storage: {
    path: './data/indexer',
    maxItems: 1000000,
  },
  
  // Indexing
  indexing: {
    enabled: true,
    batchSize: 100,
    interval: 60000, // 1 minute
  },
  
  // Search
  search: {
    maxResults: 100,
    defaultLimit: 10,
  },
});

indexer.start();
console.log(`Indexer node running on port ${indexer.port}`);
```

### Semantic Search

```typescript
// Index with embeddings
await indexerNode.index({
  cid: contentCid,
  text: 'VIVIM is a decentralized AI memory platform',
  embeddings: {
    model: 'all-MiniLM-L6-v2',
    vector: await generateEmbeddings(text),
  },
});

// Semantic search
const results = await indexerNode.semanticSearch(
  'What is VIVIM?',
  {
    limit: 10,
    threshold: 0.7, // Similarity threshold
  },
);
```

## Anchor Node

Anchor nodes provide blockchain anchoring for data integrity and verification.

```typescript
import { AnchorNode } from '@vivim/node-anchor';

const anchorNode = await sdk.loadNode<AnchorNode>('anchor');

// Anchor data to blockchain
const anchor = await anchorNode.anchor({
  data: dataHash,
  chain: 'ethereum', // or 'polygon', 'solana', etc.
  priority: 'standard', // or 'fast', 'slow'
});

// Get anchor status
const status = await anchorNode.getStatus(anchor.id);

// Verify anchored data
const verified = await anchorNode.verify(data, anchor.proof);

// Get anchor history
const history = await anchorNode.getHistory(did);
```

### Supported Chains

| Chain | Package | Description |
|-------|---------|-------------|
| Ethereum | `@vivim/anchor-ethereum` | Mainnet & L2s |
| Polygon | `@vivim/anchor-polygon` | Polygon PoS |
| Solana | `@vivim/anchor-solana` | Solana blockchain |
| IPFS | `@vivim/anchor-ipfs` | IPFS anchoring |
| Arweave | `@vivim/anchor-arweave` | Permanent storage |

### Running an Anchor Node

```typescript
import { createAnchorNode } from '@vivim/node-anchor';

const anchor = await createAnchorNode({
  port: 4004,
  host: '0.0.0.0',
  
  // Chain configuration
  chains: {
    ethereum: {
      rpcUrl: process.env.ETH_RPC_URL,
      contractAddress: '0x...',
      gasLimit: 100000,
    },
    polygon: {
      rpcUrl: process.env.MATIC_RPC_URL,
      contractAddress: '0x...',
    },
  },
  
  // Anchoring settings
  anchoring: {
    batchSize: 100,
    interval: 300000, // 5 minutes
    minFee: 0.001, // ETH
  },
});

anchor.start();
console.log(`Anchor node running on port ${anchor.port}`);
```

## Gateway Node

Gateway nodes provide HTTP/IPFS gateway access to decentralized content.

```typescript
import { GatewayNode } from '@vivim/node-gateway';

const gatewayNode = await sdk.loadNode<GatewayNode>('gateway');

// Get content via CID
const content = await gatewayNode.get(
  'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
);

// Get content via HTTP URL
const httpContent = await gatewayNode.get('https://example.com/data.json');

// Pin content
await gatewayNode.pin(cid);

// Unpin content
await gatewayNode.unpin(cid);

// Get gateway URL
const url = gatewayNode.getUrl(cid);
```

### Running a Gateway Node

```typescript
import { createGatewayNode } from '@vivim/node-gateway';

const gateway = await createGatewayNode({
  httpPort: 8080,
  ipfsPort: 4005,
  host: '0.0.0.0',
  
  // IPFS configuration
  ipfs: {
    enabled: true,
    path: './data/ipfs',
    pinning: {
      enabled: true,
      maxPins: 10000,
    },
  },
  
  // HTTP gateway
  http: {
    enabled: true,
    cache: {
      enabled: true,
      maxSize: '10GB',
      ttl: 3600, // 1 hour
    },
    cors: {
      enabled: true,
      origins: ['*'],
    },
  },
  
  // Rate limiting
  rateLimit: {
    enabled: true,
    requestsPerMinute: 100,
  },
});

gateway.start();
console.log(`HTTP Gateway: http://localhost:${gateway.httpPort}`);
console.log(`IPFS Gateway: http://localhost:${gateway.ipfsPort}`);
```

### HTTP Gateway Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /ipfs/:cid` | Get IPFS content by CID |
| `GET /http/:url` | Get HTTP content (proxied) |
| `POST /pin` | Pin content |
| `DELETE /pin/:cid` | Unpin content |
| `GET /stats` | Gateway statistics |

## P2P Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      VIVIM P2P Network                           │
│                                                                  │
│  ┌─────────────┐                                                │
│  │  Bootstrap  │◄─────── Discovery                              │
│  │    Node     │                                                │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │    Peer     │────►│    Relay    │◄────│    Peer     │        │
│  │      A      │     │    Node     │     │      B      │        │
│  └──────┬──────┘     └─────────────┘     └──────┬──────┘        │
│         │                                       │                │
│         │         ┌─────────────┐               │                │
│         └────────►│   Direct    │◄──────────────┘                │
│                   │ Connection  │                                │
│                   └─────────────┘                                │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   Indexer   │     │   Anchor    │     │   Gateway   │        │
│  │    Node     │     │    Node     │     │    Node     │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Network Security

### Authentication

```typescript
// Sign requests with identity
const signedRequest = await identityNode.sign({
  action: 'storage.save',
  data: { key: 'my-data', value: data },
  timestamp: Date.now(),
});

// Verify on server
const valid = await identityNode.verify(
  signedRequest.data,
  signedRequest.signature,
  signedRequest.publicKey,
);
```

### Encryption

```typescript
// Encrypt data before sending
const encrypted = await crypto.encrypt(data, recipientPublicKey);

// Decrypt received data
const decrypted = await crypto.decrypt(encrypted, myPrivateKey);
```

### Access Control

```typescript
// Set access control list
await storageNode.setACL('my-data', {
  owner: 'did:vivim:...',
  read: ['did:vivim:peer1', 'did:vivim:peer2'],
  write: ['did:vivim:owner'],
  public: false,
});

// Check permissions
const canRead = await storageNode.checkPermission(
  'my-data',
  'read',
  'did:vivim:peer1',
);
```

## Related

- [Core SDK](../core/overview) - Core SDK fundamentals
- [Security](../../security/overview) - Network security
- [Examples](../examples/network) - Network examples

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **Network Nodes Source**: [github.com/vivim/vivim-sdk/tree/main/nodes-network](https://github.com/vivim/vivim-sdk/tree/main/nodes-network)

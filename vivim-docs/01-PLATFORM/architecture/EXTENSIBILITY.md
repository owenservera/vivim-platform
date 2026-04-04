# VIVIM Extensibility Documentation

## Developer Platform & SDK

VIVIM is designed as a platform, not just a product. Our SDK enables developers to build applications on top of VIVIM's capture, context, and sharing infrastructure.

---

## 1. The VIVIM SDK

### 1.1 Overview

The `@vivim/sdk` is a Bun-native TypeScript SDK for building decentralized, AI-driven, local-first applications.

**Key Features:**
- 🌐 P2P Mesh Networking (LibP2P)
- 📦 Decentralized Storage (CRDTs)
- 🆔 Self-Sovereign Identity (DID)
- 🤖 AI Integration (Autonomous agents)
- ⚡ Bun Optimized
- 🔌 Extensible Architecture

### 1.2 Installation

```bash
bun add @vivim/sdk
```

### 1.3 Quick Start

```typescript
import { VivimSDK } from '@vivim/sdk';

// Initialize the decentralized core
const sdk = new VivimSDK({
  identity: {
    did: 'my-node-' + Math.random().toString(36).slice(2, 9),
  },
  storage: {
    encryption: true
  },
  nodes: {
    autoLoad: true
  }
});

await sdk.initialize();

// Connect to the P2P Graph
sdk.on('network:connected', (peerId) => {
  console.log(`Connected to new network peer: ${peerId}`);
});
```

### 1.4 Architecture

```
┌─────────────────┐
│   CORE SDK      │  (Orchestration & Events)
└────────┬────────┘
         │
  ┌───────┼───────┐
  ▼       ▼       ▼
┌────────┐ ┌────────┐ ┌────────┐
│NETWORK │ │STORAGE │ │IDENTITY│
└────────┘ └────────┘ └────────┘
```

---

## 2. Core Modules

### 2.1 Network Module

P2P networking powered by LibP2P.

```typescript
// Connect to network
await sdk.network.connect(peerId);

// Discover peers
const peers = await sdk.network.discover({
  topic: 'ai-conversations'
});

// Send messages
await sdk.network.publish('ai-conversations', {
  type: 'ACU_SHARE',
  payload: acuData
});

// Subscribe to messages
sdk.network.subscribe('ai-conversations', (message) => {
  console.log('Received:', message);
});
```

**Features:**
- WebRTC, WebSockets, GossipSub
- Peer discovery
- Pub/sub messaging
- Stream multiplexing

### 2.2 Storage Module

Local-first storage with CRDT synchronization.

```typescript
// Store data
await sdk.storage.set('conversations', {
  id: 'conv_123',
  title: 'My Chat',
  messages: [...]
});

// Query data
const conversations = await sdk.storage.query('conversations', {
  where: { provider: 'chatgpt' },
  orderBy: { createdAt: 'desc' }
});

// CRDT-powered sync
await sdk.storage.sync(peerId);
```

**Features:**
- Yjs CRDT integration
- IndexedDB persistence
- Conflict resolution
- Offline-first

### 2.3 Identity Module

Self-sovereign identity management.

```typescript
// Create new identity
const identity = await sdk.identity.create({
  displayName: 'My Node'
});

// Sign data
const signature = await sdk.identity.sign('Hello, world!');

// Verify signature
const valid = await sdk.identity.verify('Hello, world!', signature);

// Export identity (portable)
const exported = await sdk.identity.export();
// { did, publicKey, privateKey (encrypted) }
```

**Features:**
- Ed25519 keypairs
- DID generation
- Multi-device support
- Identity export/import

---

## 3. Use Cases

### 3.1 AI Memory Applications

Build applications that leverage VIVIM's memory infrastructure:

```typescript
// Create a personal AI assistant
class MyAssistant {
  constructor(sdk) {
    this.sdk = sdk;
  }

  async ask(question) {
    // Get relevant context
    const memories = await this.sdk.memory.retrieve(question);
    
    // Generate response
    const response = await this.llm.complete({
      prompt: question,
      context: memories
    });
    
    // Store interaction
    await this.sdk.memory.store({
      question,
      response,
      context: memories
    });
    
    return response;
  }
}
```

### 3.2 Collaborative AI Workspaces

Build team collaboration on top of VIVIM:

```typescript
// Create shared workspace
const workspace = await sdk.collaboration.create({
  name: 'Engineering Team',
  members: ['did:key:alice...', 'did:key:bob...']
});

// Share conversation with team
await sdk.sharing.share({
  resourceId: 'conv_123',
  recipients: workspace.members,
  permissions: {
    canView: true,
    canAnnotate: true
  }
});

// Sync workspace state
workspace.on('update', (state) => {
  console.log('Workspace updated:', state);
});
```

### 3.3 Autonomous Agents

Build AI agents that use VIVIM as memory:

```typescript
class ResearchAgent {
  constructor(sdk) {
    this.sdk = sdk;
  }

  async research(topic) {
    // 1. Check existing knowledge
    const existing = await this.sdk.memory.search(topic);
    
    if (existing.length > 0) {
      return existing; // Already researched
    }
    
    // 2. Research using web search
    const results = await this.webSearch(topic);
    
    // 3. Store findings
    await this.sdk.memory.store({
      topic,
      findings: results,
      timestamp: Date.now()
    });
    
    return results;
  }
}
```

### 3.4 Custom UIs

Build custom interfaces using VIVIM data:

```typescript
// Get all conversations
const conversations = await sdk.data.getConversations();

// Subscribe to changes
sdk.data.on('conversation', (event) => {
  if (event.type === 'new') {
    // Update UI
  }
});

// Custom search
const results = await sdk.search.hybrid({
  query: 'vector database optimization',
  filters: {
    provider: ['chatgpt', 'claude'],
    date: { after: '2024-01-01' }
  }
});
```

---

## 4. API Reference

### 4.1 VivimSDK

```typescript
class VivimSDK {
  // Initialize SDK
  async initialize(): Promise<void>;
  
  // Get module
  network: NetworkModule;
  storage: StorageModule;
  identity: IdentityModule;
  capture: CaptureModule;
  memory: MemoryModule;
  sharing: SharingModule;
  search: SearchModule;
}
```

### 4.2 NetworkModule

```typescript
class NetworkModule {
  // Connect to peer
  connect(peerId: string): Promise<Connection>;
  
  // Discover peers
  discover(options?: DiscoverOptions): Promise<PeerId[]>;
  
  // Publish to topic
  publish(topic: string, message: any): Promise<void>;
  
  // Subscribe to topic
  subscribe(topic: string, handler: MessageHandler): void;
  
  // Disconnect
  disconnect(): Promise<void>;
}
```

### 4.3 StorageModule

```typescript
class StorageModule {
  // Set value
  set(key: string, value: any): Promise<void>;
  
  // Get value
  get(key: string): Promise<any>;
  
  // Query with filters
  query(collection: string, options?: QueryOptions): Promise<any[]>;
  
  // Delete
  delete(key: string): Promise<void>;
  
  // Sync with peer
  sync(peerId: string): Promise<SyncResult>;
}
```

### 4.4 IdentityModule

```typescript
class IdentityModule {
  // Create new identity
  create(options?: IdentityOptions): Promise<Identity>;
  
  // Get current identity
  get(): Identity;
  
  // Sign data
  sign(data: string): Promise<Signature>;
  
  // Verify signature
  verify(data: string, signature: Signature): Promise<boolean>;
  
  // Export identity
  export(): Promise<ExportedIdentity>;
  
  // Import identity
  import(identity: ExportedIdentity): Promise<void>;
}
```

### 4.5 CaptureModule

```typescript
class CaptureModule {
  // Capture from provider
  async fromProvider(provider: string, credentials: Credentials): Promise<void>;
  
  // Import from URL
  async fromUrl(url: string): Promise<Conversation>;
  
  // Get capture status
  getStatus(conversationId: string): CaptureStatus;
  
  // Retry failed capture
  retry(conversationId: string): Promise<void>;
}
```

### 4.6 MemoryModule

```typescript
class MemoryModule {
  // Store memory
  store(memory: Memory): Promise<void>;
  
  // Retrieve relevant memories
  retrieve(query: string, options?: RetrieveOptions): Promise<Memory[]>;
  
  // Search memories
  search(query: string): Promise<Memory[]>;
  
  // Consolidate memories
  consolidate(): Promise<ConsolidationResult>;
}
```

---

## 5. Bun Integration

### 5.1 BunSQLiteStore

Bun-native SQLite storage for maximum performance:

```typescript
import { BunVivimServer, BunSQLiteStore } from '@vivim/sdk/bun';

const store = new BunSQLiteStore({ 
  dbPath: './vivim.db' 
});

const server = new BunVivimServer({ 
  port: 8080, 
  sdk 
});

await server.start();
```

**Benefits:**
- Native Bun performance
- SQLite built-in
- Zero configuration
- Memory-mapped I/O

---

## 6. Deployment Options

### 6.1 Embedded SDK

Embed VIVIM in your application:

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({
  storage: { type: 'embedded' }
});
```

### 6.2 Client-Server

Connect to VIVIM cloud:

```typescript
const sdk = new VivimSDK({
  storage: { type: 'remote' },
  server: 'https://api.vivim.app'
});
```

### 6.3 Self-Hosted

Deploy your own VIVIM instance:

```bash
# Using Docker Compose
docker-compose up -d
```

**Services:**
- API Server (Bun + Express)
- PostgreSQL (vector storage)
- Redis (caching)
- P2P Network (optional)

---

## 7. Integration Points

### 7.1 Webhooks

Receive events in your application:

```typescript
// Configure webhooks
sdk.webhooks.register({
  url: 'https://myapp.com/webhooks/vivim',
  events: ['conversation.created', 'memory.extracted']
});
```

### 7.2 REST API

Direct API access:

```bash
# Get conversations
curl -H "Authorization: Bearer $TOKEN" \
  https://api.vivim.app/v1/conversations

# Create share
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"resourceId": "conv_123", "recipients": ["did:key:..."]}' \
  https://api.vivim.app/v1/sharing
```

### 7.3 MCP (Model Context Protocol)

Compatible with Anthropic's MCP:

```typescript
// MCP server
import { VivimMCPServer } from '@vivim/sdk/mcp';

const server = new VivimMCPServer({
  tools: ['memory', 'search', 'capture']
});

await server.start();
```

---

## 8. Plugins

### 8.1 Writing Plugins

Extend VIVIM with custom plugins:

```typescript
import { Plugin } from '@vivim/sdk';

class MyPlugin implements Plugin {
  name = 'my-plugin';
  
  async install(sdk) {
    // Add custom methods
    sdk.myFeature = {
      doSomething: () => console.log('Hello!')
    };
  }
  
  async uninstall(sdk) {
    // Cleanup
  }
}

// Register plugin
sdk.plugins.use(new MyPlugin());
```

### 8.2 Official Plugins

| Plugin | Description |
|--------|-------------|
| `@vivim/plugin-slack` | Slack integration |
| `@vivim/plugin-notion` | Notion sync |
| `@vivim/plugin-github` | GitHub integration |
| `@vivim/plugin-discord` | Discord bot |

---

## 9. Enterprise Features

### 9.1 SSO Integration

```typescript
const sdk = new VivimSDK({
  enterprise: {
    sso: {
      provider: 'okta',
      domain: 'company.com'
    }
  }
});
```

### 9.2 Audit Logging

```typescript
// Enable audit logging
const sdk = new VivimSDK({
  enterprise: {
    auditLog: {
      destination: 's3://my-bucket/audit-logs',
      retention: '7years'
    }
  }
});
```

### 9.3 Data Residency

```typescript
// Deploy to specific region
const sdk = new VivimSDK({
  enterprise: {
    region: 'eu-central-1'
  }
});
```

---

## 10. Resources

### Documentation
- [SDK Reference](https://docs.vivim.app/sdk)
- [API Reference](https://docs.vivim.app/api)
- [Examples](https://github.com/vivim-app/examples)

### Community
- [Discord](https://discord.gg/vivim)
- [GitHub Discussions](https://github.com/vivim-app/vivim-app/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vivim)

### Support
- [Enterprise Support](mailto:enterprise@vivim.app)
- [Developer Support](mailto:dev@vivim.app)

---

*Document Version: 1.0*
*Last Updated: 2026-03-17*

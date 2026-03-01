# 📚 VIVIM Documentation

### Your Complete Guide to the VIVIM Ecosystem

[« Back to Main Repository](../README.md)

---

## 🗺️ Documentation Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIVIM Documentation                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🚀 Getting Started                                             │
│  ├── Quick Start           → Get up and running in 5 minutes   │
│  ├── Architecture          → System design overview            │
│  └── Development Setup     → Configure your environment        │
│                                                                 │
│  📦 Project Documentation                                       │
│  ├── SDK                   → Core developer toolkit            │
│  ├── PWA                   → Frontend application              │
│  ├── Server                → Backend API & services            │
│  ├── Network               → P2P & federation layer            │
│  └── Admin                 → Management dashboard              │
│                                                                 │
│  📖 Deep Dives                                                  │
│  ├── Blockchain            → On-chain integration              │
│  ├── Security              → Encryption & privacy              │
│  ├── CRDT                  → Conflict-free data types          │
│  └── ACU Memory            → AI memory processing              │
│                                                                 │
│  🔧 API Reference                                               │
│  ├── SDK API               → TypeScript API docs               │
│  ├── REST API              → HTTP endpoint docs                │
│  └── Network API           → P2P protocol docs                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### New to VIVIM?

Start here to get up and running quickly:

| Guide | Description | Time |
|-------|-------------|------|
| [⚡ Quick Start](./QUICKSTART.md) | Install and run VIVIM in 5 minutes | 5 min |
| [🏗️ Architecture Overview](./ARCHITECTURE.md) | Understand the system design | 15 min |
| [🔧 Development Setup](./DEVELOPMENT.md) | Set up your dev environment | 10 min |
| [📖 First Steps](./FIRST-STEPS.md) | Your first VIVIM application | 20 min |

### Choose Your Path

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   I want to     │     │   I want to     │     │   I want to     │
│   BUILD APPS    │     │   CONTRIBUTE    │     │   LEARN MORE    │
│                 │     │                 │     │                 │
│   → SDK Docs    │     │   → Contributing│     │   → Architecture│
│   → API Ref     │     │   → Dev Setup   │     │   → Blog        │
│   → Examples    │     │   → Code Style  │     │   → Whitepaper  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 📦 Project Documentation

### Core Packages

<table>
  <tr>
    <td align="center" valign="top" width="50%">
      <h4>🧰 VIVIM SDK</h4>
      <p>Core developer toolkit for building VIVIM-compatible applications</p>
      <ul align="left">
        <li>Identity & Authentication</li>
        <li>Memory & Context System</li>
        <li>Content Management</li>
        <li>Social Graph</li>
      </ul>
      <a href="./SDK.md"><img src="https://img.shields.io/badge/View-SDK-3178C6?style=for-the-badge&logo=typescript" alt="SDK Docs"/></a>
    </td>
    <td align="center" valign="top" width="50%">
      <h4>📱 PWA Frontend</h4>
      <p>Modern React-based progressive web application</p>
      <ul align="left">
        <li>Component Library</li>
        <li>State Management</li>
        <li>Offline Support</li>
        <li>PWA Features</li>
      </ul>
      <a href="./PWA.md"><img src="https://img.shields.io/badge/View-PWA-61DAFB?style=for-the-badge&logo=react" alt="PWA Docs"/></a>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" width="50%">
      <h4>🔧 API Server</h4>
      <p>Backend services, database, and API endpoints</p>
      <ul align="left">
        <li>REST API Reference</li>
        <li>Database Schema</li>
        <li>Authentication</li>
        <li>Rate Limiting</li>
      </ul>
      <a href="./SERVER.md"><img src="https://img.shields.io/badge/View-Server-059669?style=for-the-badge&logo=express" alt="Server Docs"/></a>
    </td>
    <td align="center" valign="top" width="50%">
      <h4>🌐 Network Engine</h4>
      <p>P2P networking, CRDT sync, and federation</p>
      <ul align="left">
        <li>LibP2P Integration</li>
        <li>CRDT Synchronization</li>
        <li>Federation Protocol</li>
        <li>E2E Encryption</li>
      </ul>
      <a href="./NETWORK.md"><img src="https://img.shields.io/badge/View-Network-8B5CF6?style=for-the-badge&logo=webassembly" alt="Network Docs"/></a>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" width="50%">
      <h4>🎛️ Admin Panel</h4>
      <p>Platform management and monitoring dashboard</p>
      <ul align="left">
        <li>User Management</li>
        <li>System Monitoring</li>
        <li>Analytics Dashboard</li>
        <li>Configuration</li>
      </ul>
      <a href="./ADMIN.md"><img src="https://img.shields.io/badge/View-Admin-F59E0B?style=for-the-badge&logo=dashboard" alt="Admin Docs"/></a>
    </td>
    <td align="center" valign="top" width="50%">
      <h4>📚 All Documentation</h4>
      <p>Complete documentation index and guides</p>
      <ul align="left">
        <li>Tutorials</li>
        <li>API Reference</li>
        <li>Contributing Guide</li>
        <li>FAQ</li>
      </ul>
      <a href="../README.md"><img src="https://img.shields.io/badge/View-Repo-10B981?style=for-the-badge&logo=github" alt="Main Repo"/></a>
    </td>
  </tr>
</table>

---

## 📖 Deep Dives

### Advanced Topics

| Topic | Description | Level |
|-------|-------------|-------|
| [🔗 Blockchain Integration](./BLOCKCHAIN.md) | On-chain verification and trust proofs | Advanced |
| [🔐 Security Model](./SECURITY.md) | End-to-end encryption and privacy | Intermediate |
| [🧩 CRDT Implementation](./CRDT.md) | Conflict-free replicated data types | Advanced |
| [🧠 ACU Memory System](./ACU-MEMORY.md) | Attention, Context, Understanding processing | Intermediate |
| [🌐 P2P Architecture](./P2P-ARCH.md) | Decentralized network design | Advanced |
| [📊 Data Flow](./DATA-FLOW.md) | How data moves through VIVIM | Intermediate |

### Technical Whitepapers

| Document | Description |
|----------|-------------|
| [VIVIM Whitepaper](./WHITEPAPER.md) | Technical overview and vision |
| [Trust Protocol](./TRUST-PROTOCOL.md) | Decentralized trust verification |
| [Memory Architecture](./MEMORY-ARCH.md) | AI memory system design |

---

## 🔧 API Reference

### SDK API

```typescript
import { VivimSDK } from '@vivim/sdk'

const sdk = new VivimSDK({ did: 'did:vivim:...' })
await sdk.initialize()

// Identity
const identity = sdk.identity.create({ displayName: 'Alice' })

// Memory
const memory = await sdk.memory.create({ content: '...', type: 'note' })

// Content
const content = await sdk.content.create({ text: '...', type: 'text' })

// Social
await sdk.social.follow('did:vivim:bob...')
```

📖 [Full SDK API Reference](./SDK.md#api-reference)

### REST API

```bash
# Get user profile
curl https://api.vivim.app/users/:did

# Create content
curl -X POST https://api.vivim.app/content \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text": "Hello!", "type": "text"}'

# Query memories
curl https://api.vivim.app/memories?q=vivim&limit=10
```

📖 [Full REST API Reference](./SERVER.md#api-reference)

### Network Protocol

```typescript
import { NetworkNode } from '@vivim/network-engine'

const node = new NetworkNode({
  nodeType: 'peer',
  roles: ['storage', 'compute']
})

await node.start()
await node.connect('/ip4/192.168.1.1/tcp/9000/ws')
```

📖 [Full Network API Reference](./NETWORK.md#api-reference)

---

## 🎯 Quick Reference

### Commands

```bash
# Development
bun run dev              # Start all services
bun run dev:pwa          # Start PWA only
bun run dev:server       # Start server only
bun run dev:network      # Start network only

# Building
bun run build            # Build all packages
bun run build:pwa        # Build PWA only

# Testing
bun run test             # Run all tests
bun run test:unit        # Run unit tests
bun run test:e2e         # Run e2e tests

# Database
bun run db:generate      # Generate Prisma client
bun run db:migrate       # Run migrations
bun run db:studio        # Open Prisma Studio
```

### Ports

| Service | Port | Description |
|---------|------|-------------|
| PWA | 5173 | Frontend development server |
| Server | 3333 | API server |
| Network WS | 1235 | WebSocket server |
| Network P2P | 9000 | P2P connections |
| Admin | 5174 | Admin panel |
| Dashboard | 5175 | Public dashboard |

### Environment Variables

```bash
# Server
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key

# Network
LIBP2P_LISTEN_ADDR=/ip4/0.0.0.0/tcp/9000/ws
BOOTSTRAP_PEERS=/ip4/...

# SDK
VIVIM_DID=did:vivim:...
VIVIM_SEED=...
```

---

## 🤝 Contributing

### Documentation Guidelines

When contributing to documentation:

1. **Write for the audience** - Know who will read this
2. **Use clear structure** - Headings, lists, code blocks
3. **Provide examples** - Show, don't just tell
4. **Keep it updated** - Docs should match current code
5. **Make it scannable** - Use bold, links, and visual breaks

### Documentation Structure

```
docs/
├── README.md              # This file - Documentation index
├── QUICKSTART.md          # Quick start guide
├── ARCHITECTURE.md        # System architecture
├── DEVELOPMENT.md         # Development setup
├── SDK.md                 # SDK documentation
├── PWA.md                 # PWA documentation
├── SERVER.md              # Server documentation
├── NETWORK.md             # Network documentation
├── ADMIN.md               # Admin documentation
├── BLOCKCHAIN.md          # Blockchain integration
├── SECURITY.md            # Security model
├── CRDT.md                # CRDT implementation
├── ACU-MEMORY.md          # ACU memory system
├── P2P-ARCH.md            # P2P architecture
├── DATA-FLOW.md           # Data flow diagrams
├── WHITEPAPER.md          # Technical whitepaper
├── CONTRIBUTING.md        # Contributing guide
└── FAQ.md                 # Frequently asked questions
```

---

## 📊 Documentation Status

| Section | Status | Last Updated |
|---------|--------|--------------|
| Quick Start | ✅ Complete | Jan 2026 |
| Architecture | ✅ Complete | Jan 2026 |
| SDK | ✅ Complete | Jan 2026 |
| PWA | 🚧 In Progress | - |
| Server | 🚧 In Progress | - |
| Network | 🚧 In Progress | - |
| Admin | 🚧 In Progress | - |
| Blockchain | 📝 Planned | - |
| Security | 📝 Planned | - |

---

## 🔗 External Resources

| Resource | Description |
|----------|-------------|
| [VIVIM Website](https://vivim.app) | Official website (coming soon) |
| [npm @vivim/sdk](https://www.npmjs.com/package/@vivim/sdk) | SDK package on npm |
| [GitHub Issues](https://github.com/owenservera/vivim-app/issues) | Report bugs and request features |
| [GitHub Discussions](https://github.com/owenservera/vivim-app/discussions) | Community discussions |

---

<div align="center">

**Built with ❤️ by the VIVIM Team**

[⬆ Back to top](#vivim-documentation) | [🏠 Back to Main Repo](../README.md)

</div>

# Open Source

## Building the AI Memory Layer Together

VIVIM is built on a fundamental belief: **you should own your AI story**. That philosophy extends to our development model. We believe the best technology is built in the open, with communities who care.

---

## Our Open Source Philosophy

### Transparency as Foundation

When you trust VIVIM with your AI conversations, you deserve to see how we build it. That's why we've made transparency a core principle:

- **Code you can inspect** — Every line that processes your data is open for review
- **Security you can verify** — Independent audits, bug bounties, and community scrutiny
- **Freedom to leave** — Export your data anytime, no lock-in

### The Open Core Model

We use a proven open-core strategy that benefits everyone:

| What We Open | What We Keep Proprietary |
|--------------|------------------------|
| SDK & Developer Tools | Advanced AI extraction |
| Network Protocol & CRDT | Enterprise scaling |
| PWA & UI Components | Zero-knowledge encryption |
| Documentation & Examples | Premium features |

This model means:

- **Developers** get powerful tools to build on VIVIM
- **Enterprises** get the security and features they need
- **Community** gets a voice in the platform's future

---

## What We Open Source

### VIVIM SDK

Our TypeScript SDK is the foundation for building VIVIM-compatible applications. Open under Apache 2.0, it's available for anyone to use, extend, or contribute to.

**What's included:**

- Full API client implementation
- Authentication & identity management
- Data synchronization utilities
- TypeScript types and interfaces

```typescript
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK({ 
  identity: { did: 'your-did' } 
});
// Start building
```

[Explore the SDK →](https://github.com/vivim-app/sdk)

### Network Engine

The backbone of VIVIM's P2P synchronization uses LibP2P and CRDTs. By open sourcing this layer, we're contributing to the decentralized web and enabling anyone to run their own nodes.

**What's included:**

- LibP2P integration
- Yjs CRDT implementation
- WebRTC transport
- Gossip protocol

### PWA & Design System

Our React-based frontend is open under MIT license. Teams can customize the interface, contribute improvements, or build their own UIs on top of our design system.

---

## What's Not Open Source

### Memory Extraction Engine

Our proprietary AI extracts meaningful insights from your conversations — memories, relationships, and context. This is our core intellectual property and what makes VIVIM special.

**Why keep it closed:**

- Protects competitive advantage
- Funds continued R&D
- Enables enterprise revenue that supports free tier

### Zero-Knowledge Encryption

The cryptographic implementations that secure your data remain proprietary. This isn't about secrecy — it's about liability. Security-critical code requires careful stewardship and rapid response capabilities.

### Enterprise Infrastructure

Our hosting infrastructure, scaling systems, and enterprise features (SSO, SLA, compliance) are closed. These are how we sustain the business while offering free and Pro tiers.

---

## Community & Governance

### Contributing

We welcome contributions from developers worldwide:

1. **Fork** the repository
2. **Create** a feature branch
3. **Submit** a pull request
4. **Join** the community discussion

[Contributing Guide →](https://github.com/vivim-app/contributing)

### Code of Conduct

Our community is built on respect:

- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

### Security

**For security researchers:**

We appreciate responsible disclosure. Please report vulnerabilities through our security program:

- Email: security@vivim.app
- Bug Bounty: Rewards for qualifying findings

**We never:**
- Compromise user data in the name of "openness"
- Rush security-critical releases
- Ignore community concerns

---

## Enterprise & Commercial

### Building Commercial Products?

Our open core model supports commercial use:

| Use Case | License |
|----------|---------|
| Building on VIVIM SDK | Apache 2.0 (permissive) |
| Running personal nodes | MIT |
| Embedding in commercial product | Contact us |
| Enterprise deployment | Commercial license |

[Contact for Commercial Licensing →](mailto:enterprise@vivim.app)

### Supporting the Project

Open source isn't free — it costs time, infrastructure, and expertise. You can support VIVIM's development:

- **GitHub Sponsors** — Monthly backing
- **Direct support** — Priority assistance
- **Feature sponsorship** — Fund specific capabilities

[Support VIVIM →](https://github.com/sponsors/vivim-app)

---

## The Bigger Picture

### Why Open Source Matters for AI Memory

The AI memory layer is critical infrastructure. Just as we need open protocols for communication, we need open standards for AI memory:

- **Portability** — Your memories should work anywhere
- **Interoperability** — Connect across platforms and providers
- **Privacy** — Verify your data is handled correctly
- **Longevity** — Don't lose memories when companies pivot

VIVIM exists to ensure the AI revolution remembers what matters to *you*.

---

## Get Involved

### Join the Community

- **Discord** — Real-time discussion: [discord.gg/vivim](https://discord.gg/vivim)
- **GitHub** — Code and issues: [github.com/vivim-app](https://github.com/vivim-app)
- **Twitter** — Updates: [@vivim_app](https://twitter.com/vivim_app)

### Start Building

```bash
# Install VIVIM SDK
npm install @vivim/sdk

# Explore the network engine
git clone https://github.com/vivim-app/network-engine

# Read the docs
npm install vivim-docs
```

---

*VIVIM — Your AI story, your terms, open for everyone.*

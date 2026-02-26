# <img src="https://img.icons8.com/color/48/000000/hourglass.png" width="40" align="left" /> VIVIM

### Your Personal AI Memory Platform — Own, Share, Evolve Your AI

[![GitHub stars](https://img.shields.io/github/stars/owenservera/vivim-app?style=for-the-badge&logo=github)](https://github.com/owenservera/vivim-app/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/owenservera/vivim-app?style=for-the-badge&logo=github)](https://github.com/owenservera/vivim-app/network)
[![GitHub issues](https://img.shields.io/github/issues/owenservera/vivim-app?style=for-the-badge&logo=github)](https://github.com/owenservera/vivim-app/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Powered%20by-Bun-f29a2e?style=for-the-badge&logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

---

## 📖 Table of Contents

- [✨ What is VIVIM?](#-what-is-vivim)
- [🎯 Core Principles](#-core-principles)
- [📦 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## ✨ What is VIVIM?

> **VIVIM** is an open-source, decentralized AI memory platform that puts users in control of their AI systems. Built on blockchain technology with P2P networking, CRDT synchronization, and end-to-end encryption.

```
┌─────────────────────────────────────────────────────────────────┐
│                     VIVIM Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   PWA       │  │   Server    │  │   Network Engine        │ │
│  │  (React)    │◄─┤   (Bun)     │◄─┤   (LibP2P + CRDT)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                      │               │
│         └────────────────┴──────────────────────┘               │
│                          │                                      │
│              ┌───────────▼───────────┐                          │
│              │      SDK Core         │                          │
│              │  (TypeScript/Node)    │                          │
│              └───────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Core Principles

| Principle | Description | Status |
|-----------|-------------|--------|
| **🔐 Own Your AI** | Users maintain full control over their AI systems and data | ✅ Active |
| **🔗 Share Your AI** | Enable secure sharing of AI configurations and knowledge | 🚧 In Progress |
| **📈 Evolve Your AI** | Support continuous improvement and adaptation | ✅ Active |

---

## 📦 Project Structure

VIVIM is a **monorepo** containing multiple interconnected projects:

```
vivim-app/
├── 📱 pwa/              # Progressive Web App - Main user interface
├── 🔧 server/           # API Server - Backend services & database
├── 🌐 network/          # Network Engine - P2P & Federation layer
├── 🧰 sdk/              # SDK Core - Developer toolkit
├── 🎛️ admin-panel/      # Admin Dashboard - Platform management
└── 📚 docs/             # Documentation - User & developer guides
```

### 🗺️ Navigate to Project Pages

<table>
  <tr>
    <td align="center" valign="top" width="33%">
      <h4>🧰 VIVIM SDK</h4>
      <p>Core developer toolkit for building VIVIM-compatible applications</p>
      <a href="docs/SDK.md"><img src="https://img.shields.io/badge/View-SDK-3178C6?style=for-the-badge&logo=typescript" alt="SDK Docs"/></a>
    </td>
    <td align="center" valign="top" width="33%">
      <h4>📱 PWA Frontend</h4>
      <p>Modern React-based progressive web application</p>
      <a href="docs/PWA.md"><img src="https://img.shields.io/badge/View-PWA-61DAFB?style=for-the-badge&logo=react" alt="PWA Docs"/></a>
    </td>
    <td align="center" valign="top" width="33%">
      <h4>🔧 API Server</h4>
      <p>Backend services, database, and API endpoints</p>
      <a href="docs/SERVER.md"><img src="https://img.shields.io/badge/View-Server-059669?style=for-the-badge&logo=express" alt="Server Docs"/></a>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" width="33%">
      <h4>🌐 Network Engine</h4>
      <p>P2P networking, CRDT sync, and federation</p>
      <a href="docs/NETWORK.md"><img src="https://img.shields.io/badge/View-Network-8B5CF6?style=for-the-badge&logo=webassembly" alt="Network Docs"/></a>
    </td>
    <td align="center" valign="top" width="33%">
      <h4>🎛️ Admin Panel</h4>
      <p>Platform management and monitoring dashboard</p>
      <a href="docs/ADMIN.md"><img src="https://img.shields.io/badge/View-Admin-F59E0B?style=for-the-badge&logo=dashboard" alt="Admin Docs"/></a>
    </td>
    <td align="center" valign="top" width="33%">
      <h4>📚 All Documentation</h4>
      <p>Complete documentation index and guides</p>
      <a href="docs/README.md"><img src="https://img.shields.io/badge/View-All-Docs-10B981?style=for-the-badge&logo=bookstack" alt="All Docs"/></a>
    </td>
  </tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- [Node.js](https://nodejs.org) >= 20.0.0
- [Git](https://git-scm.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/owenservera/vivim-app.git
cd vivim-app

# Install all dependencies (root + all packages)
bun run setup:deps

# Generate database clients
bun run setup:db
```

### Development

```bash
# Run all services concurrently
bun run dev

# Or run individual services
bun run dev:pwa        # PWA frontend
bun run dev:server     # API server
bun run dev:network    # Network engine
bun run dev:admin      # Admin panel
```

### Build

```bash
# Build all packages
bun run build
```

---

## 📚 Documentation

### Getting Started

| Guide | Description |
|-------|-------------|
| [🏃 Quick Start](docs/QUICKSTART.md) | Get up and running in 5 minutes |
| [📦 Architecture Overview](docs/ARCHITECTURE.md) | Understand the VIVIM system design |
| [🔧 Development Setup](docs/DEVELOPMENT.md) | Set up your development environment |

### Deep Dives

| Guide | Description |
|-------|-------------|
| [🧰 SDK Guide](docs/SDK.md) | Build apps with the VIVIM SDK |
| [🌐 P2P Network](docs/NETWORK.md) | Understand the decentralized network |
| [🔐 Security Model](docs/SECURITY.md) | End-to-end encryption and privacy |
| [📈 Blockchain Integration](docs/BLOCKCHAIN.md) | On-chain verification and trust |

### API Reference

| Package | Documentation |
|---------|---------------|
| `@vivim/sdk` | [SDK API Reference](docs/SDK.md#api-reference) |
| `@vivim/network-engine` | [Network API Reference](docs/NETWORK.md#api-reference) |
| Server API | [REST API Docs](docs/SERVER.md#api-reference) |

---

## 🏗️ Technology Stack

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend Layer                          │
├────────────────────────────────────────────────────────────┤
│  React 19  │  TypeScript  │  TailwindCSS  │  Vite 7       │
│  Framer Motion  │  Zustand  │  TanStack Query              │
└────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                    Backend Layer                           │
├────────────────────────────────────────────────────────────┤
│  Bun Runtime  │  Express 5  │  Prisma ORM  │  PostgreSQL  │
│  Redis  │  Socket.IO  │  AI SDK (OpenAI, Anthropic)       │
└────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                  Decentralized Layer                       │
├────────────────────────────────────────────────────────────┤
│  LibP2P  │  Yjs CRDT  │  WebRTC  │  WebSockets            │
│  @noble/crypto  │  multiformats  │  uint8arrays           │
└────────────────────────────────────────────────────────────┘
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs**: [Open an issue](https://github.com/owenservera/vivim-app/issues)
- 💡 **Suggest Features**: [Start a discussion](https://github.com/owenservera/vivim-app/discussions)
- 📝 **Write Documentation**: Help improve our docs
- 🔧 **Submit Code**: [Pull requests](https://github.com/owenservera/vivim-app/pulls) are welcome

### Development Workflow

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/amazing-feature

# 3. Make your changes and commit
git commit -m "feat: add amazing feature"

# 4. Push and open a Pull Request
git push origin feature/amazing-feature
```

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Follow the [MIT License](LICENSE) terms

---

## 📊 Project Activity

[![Stars](https://img.shields.io/github/stars/owenservera/vivim-app?style=social)](https://github.com/owenservera/vivim-app/stargazers)
[![Watchers](https://img.shields.io/github/watchers/owenservera/vivim-app?style=social)](https://github.com/owenservera/vivim-app/watchers)
[![Forks](https://img.shields.io/github/forks/owenservera/vivim-app?style=social)](https://github.com/owenservera/vivim-app/network)

![GitHub commit activity](https://img.shields.io/github/commit-activity/m/owenservera/vivim-app?label=Commits)
![GitHub contributors](https://img.shields.io/github/contributors/owenservera/vivim-app?label=Contributors)
![GitHub last commit](https://img.shields.io/github/last-commit/owenservera/vivim-app?label=Last%20Commit)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

```
Copyright (c) 2025 VIVIM Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🔗 Links

- **Website**: [vivim.app](https://vivim.app) (coming soon)
- **Documentation**: [docs.vivim.app](https://docs.vivim.app) (coming soon)
- **Discord**: [Join our community](https://discord.gg/vivim) (coming soon)
- **Twitter**: [@vivim_app](https://twitter.com/vivim_app) (coming soon)

---

<div align="center">

**Made with ❤️ by the VIVIM Team**

[⬆ Back to top](#vivim)

</div>

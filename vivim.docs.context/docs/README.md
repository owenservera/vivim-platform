---
sidebar_position: 0
title: Documentation
description: VIVIM Documentation Index
---

# 📚 VIVIM Documentation

Welcome to the VIVIM documentation. This is your complete guide to the VIVIM platform.

---

## 🚀 Quick Start

| Guide | Description | Audience |
|-------|-------------|----------|
| [Getting Started](/docs/user/getting-started) | Set up your account and capture your first conversation | End Users |
| [Quick Start for Developers](/docs/getting-started/introduction) | Technical introduction and architecture | Developers |

---

## 📖 Documentation Sections

### 👤 User Guides

For end users learning how to use VIVIM:

- **[Getting Started](/docs/user/getting-started)** - Begin using VIVIM
- **[Capturing Conversations](/docs/user/capturing-conversations)** - Import AI chats
- **[Searching & Finding](/docs/user/searching-finding)** - Find your memories
- **[Collections & Bookmarks](/docs/user/collections)** - Organize content
- **[AI Chat](/docs/user/ai-chat)** - Chat with AI using your context
- **[BYOK Chat](/docs/user/byok-chat)** - Bring your own API keys
- **[Context Cockpit](/docs/user/context-cockpit)** - Understand context layers
- **[Context Components](/docs/user/context-components)** - Browse ACUs
- **[For You](/docs/user/for-you)** - AI recommendations
- **[Sharing](/docs/user/sharing)** - Share knowledge
- **[Analytics](/docs/user/analytics)** - Usage insights
- **[Error Dashboard](/docs/user/error-dashboard)** - Troubleshooting
- **[Settings & Account](/docs/user/settings-account)** - Configuration

### 🏗️ Architecture

Technical documentation for developers:

- **[Architecture Overview](/docs/architecture/overview)** - System design
- **[Visual Guides](/docs/architecture/visual-guides)** - Architecture diagrams
- **[Server](/docs/architecture/server)** - Backend architecture
- **[Context Engine/context)** - Dynamic](/docs/architecture context system
- **[Pipeline](/docs/architecture/pipeline)** - Processing pipeline
- **[User Context](/docs/architecture/user-context)** - Per-user isolation
- **[Assembler](/docs/architecture/assembler)** - Context assembly
- **[Memory](/docs/architecture/memory)** - Memory system
- **[Sync](/docs/architecture/sync)** - Offline-first sync

### 📱 PWA (Frontend)

React frontend documentation:

- **[PWA Overview](/docs/pwa/overview)** - Frontend architecture
- **[BYOK](/docs/pwa/byok)** - Bring your own keys feature
- **[Storage V2](/docs/pwa/storage-v2)** - Local storage system
- **[Content Renderer](/docs/pwa/content-renderer)** - Message rendering
- **[PWA API](/docs/pwa/api)** - Client-side API
- **[UI Components](/docs/pwa/components)** - Component library
- **[State Management](/docs/pwa/state)** - Zustand stores

### 🌐 Network

Decentralized networking documentation:

- **[Network Overview](/docs/network/overview)** - P2P architecture
- **[Security](/docs/network/security)** - Network security
- **[Protocols](/docs/network/protocols)** - Network protocols
- **[Federation](/docs/network/federation)** - Federated features
- **[CRDT Sync](/docs/network/crdt)** - Conflict-free sync

### 🔌 API

- **[REST API Overview](/docs/api/overview)** - Server API reference
- **[API Reference](/docs/api/reference/)** - Detailed endpoints

### 🔐 Security

- **[Security Overview](/docs/security/overview)** - Security model

### 👥 Social

- **[Social Overview](/docs/social/overview)** - Social features

### 🎛️ Admin

- **[Admin Panel](/docs/admin/overview)** - Management dashboard

---

## 📦 Feature Documentation

| Document | Description |
|----------|-------------|
| [Atomic Feature Inventory](/docs/ATOMIC_FEATURE_INVENTORY) | Complete feature list (930+ features) |
| [Feature Roadmap](/docs/.current/06-ENHANCEMENT-ROADMAP) | Development timeline |

---

## 🔧 Development

### Prerequisites

- Bun >= 1.0.0
- Node.js >= 20.0.0
- PostgreSQL >= 14

### Running Locally

```bash
cd vivim.docs.context
npm run start
```

### Building

```bash
npm run build
```

---

## 📁 Documentation Structure

```
docs/
├── user/              # End-user guides (non-technical)
├── getting-started/   # Intro and quick start
├── architecture/      # Technical architecture
├── pwa/              # Frontend documentation
├── network/          # P2P networking docs
├── api/              # REST API reference
├── security/         # Security documentation
├── social/           # Social features
├── admin/            # Admin panel docs
├── .current/         # Working documents & audits
└── _legacy/          # Archived content (read-only)
```

---

## 🤝 Contributing

When adding new documentation:

1. **User-facing docs**: Add to `docs/user/` with simple language
2. **Technical docs**: Add to appropriate module folder
3. **Working docs**: Add to `docs/.current/`
4. **NEVER edit `_legacy/`** - This is archive only

See [DOCUMENTATION_GUIDE.md](../DOCUMENTATION_GUIDE.md) for full guidelines.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/owenservera/vivim-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/owenservera/vivim-app/discussions)

---

*Last Updated: March 2026*

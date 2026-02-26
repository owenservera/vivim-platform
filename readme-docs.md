# VIVIM Live Documentation

**Official SDK Documentation for VIVIM**

This repository contains the VIVIM SDK documentation, powered by Docusaurus and deployed on Vercel.

🌐 **Live Site**: [vivim.live/docs](https://vivim.live/docs)

## 📦 What's Included

- **SDK Overview** - Introduction to VIVIM SDK architecture
- **Core SDK** - Core types, utilities, and initialization
- **API Nodes** - Identity, Storage, AI Chat, Social, Memory nodes
- **SDK Nodes** - React, Vue, Svelte, Flutter, React Native adapters
- **Network** - P2P networking infrastructure
- **Guides** - Step-by-step tutorials
- **Examples** - Runnable code examples

## 🚀 Quick Start

### Install Dependencies

```bash
bun install
```

### Development

```bash
bun run dev
```

The docs will be available at `http://localhost:3000/docs`.

### Build for Production

```bash
bun run build
```

Output will be in the `build/` directory.

### Preview Production Build

```bash
bun run serve
```

## 📁 Structure

```
vivim-live-docs/
├── docs/               # Documentation source
│   ├── sdk/            # SDK documentation
│   │   ├── overview.md
│   │   ├── core/
│   │   ├── api-nodes/
│   │   ├── sdk-nodes/
│   │   ├── network/
│   │   ├── guides/
│   │   └── examples/
│   └── ...             # Other documentation
├── src/                # Docusaurus custom code
├── static/             # Static assets
├── build/              # Production build output
├── docusaurus.config.ts
├── sidebars.ts
├── package.json
└── vercel.json
```

## 🔗 GitHub Repositories

- **Main Application**: [github.com/owenservera/vivim-app](https://github.com/owenservera/vivim-app)
- **SDK**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **Documentation**: [github.com/owenservera/vivim-live-docs](https://github.com/owenservera/vivim-live-docs)

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

**Built with** [Docusaurus](https://docusaurus.io/) **and deployed on** [Vercel](https://vercel.com/)

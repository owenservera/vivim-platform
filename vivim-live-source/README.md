# VIVIM Live

**Sovereign AI Interface with Documentation**

🌐 **Live Site**: [vivim.live](https://vivim.live) | 📚 **Docs**: [vivim.live/docs](https://vivim.live/docs)

This repository contains the complete VIVIM Live platform:
- **Landing Page**: Stealth-style interface at root (`/`)
- **Documentation**: Docusaurus-powered SDK docs at `/docs`

## Quick Start

```bash
# Install all dependencies
bun run install:all

# Run development servers
bun run dev

# Build for production
bun run build
```

## Structure

```
vivim-live/
├── github-frontend/    # Next.js 15 GitHub-style frontend (optional)
├── docs/               # Docusaurus documentation
│   ├── build/          # Production build output
│   ├── docs/           # Documentation source
│   │   └── sdk/        # SDK documentation
│   └── docusaurus.config.ts
├── index.html          # Landing page
├── vercel.json         # Vercel deployment config
└── package.json        # Root package.json
```

## Deployment (Vercel)

This repository is configured for **automatic deployments** from GitHub to Vercel.

### Auto-Deploy Workflow

| Action | Result |
|--------|--------|
| Push to `main` | Auto-deploy to production |
| Push to feature branch | Auto-deploy to preview URL |
| Create Pull Request | Create preview deployment |

### Vercel Configuration

The `vercel.json` handles:
- **Build Command**: `cd docs && bun run build`
- **Output Directory**: `docs/build`
- **Rewrites**: `/docs/*` → Documentation
- **Root**: Landing page (`index.html`)

### Manual Deploy

```bash
# Build documentation
cd docs
bun run build

# Deploy to Vercel
vercel --prod
```

## Development

### Run Documentation Only

```bash
cd docs
bun install
bun run dev
```

Available at `http://localhost:3000/docs`

### Run Landing Page Only

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

### Run Both (Development)

```bash
# Root terminal - landing page
python -m http.server 3000

# Docs terminal - documentation
cd docs
bun run dev
```

## Documentation Structure

### SDK Documentation (NEW!)

| Document | Path |
|----------|------|
| **SDK Overview** | `/docs/sdk/overview` |
| **Core SDK** | `/docs/sdk/core/overview` |
| **API Nodes** | `/docs/sdk/api-nodes/overview` |
| **SDK Nodes** | `/docs/sdk/sdk-nodes/overview` |
| **Network** | `/docs/sdk/network/overview` |
| **Getting Started** | `/docs/sdk/guides/getting-started` |
| **Examples** | `/docs/sdk/examples/basic` |

### Other Documentation

- Architecture
- API Reference
- PWA Guide
- Network Security
- User Guides

## GitHub Repositories

| Repository | Description |
|------------|-------------|
| **[vivim-live](https://github.com/owenservera/vivim-live)** | 🏠 Main landing site + docs |
| **[vivim-app](https://github.com/owenservera/vivim-app)** | 💻 Full application (PWA, Server, P2P) |
| **[vivim-sdk](https://github.com/vivim/vivim-sdk)** | 📦 SDK package |

## Commands

```bash
# Install all dependencies
bun run install:all

# Development
bun run dev              # Run all dev servers
bun run dev:docs         # Run docs only
bun run dev:web          # Run web frontend only

# Build
bun run build            # Build everything
bun run build:docs       # Build docs only
bun run build:web        # Build web frontend only

# Preview
bun run serve            # Serve production build
```

## License

MIT License - See LICENSE file for details.

---

**Built with** Docusaurus **| Deployed on** Vercel

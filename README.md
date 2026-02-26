# VIVIM

Your Personal AI Memory Platform

[![GitHub stars](https://img.shields.io/github/stars/owenservera/vivim-app)](https://github.com/owenservera/vivim-app/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/owenservera/vivim-app)](https://github.com/owenservera/vivim-app/network)
[![GitHub issues](https://img.shields.io/github/issues/owenservera/vivim-app)](https://github.com/owenservera/vivim-app/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Mission

- **Own Your AI** – Users maintain control over their AI systems
- **Share Your AI** – Enables sharing of AI configurations/knowledge
- **Evolve Your AI** – Supports continuous improvement and adaptation

## 🚀 Quick Start

### GitHub Frontend

The project includes a modern GitHub-style frontend for browsing the repository, issues, pull requests, and more.

```bash
cd github-frontend
bun install
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore.

### Full Stack Development

```bash
# Install all dependencies
bun run setup:deps

# Run all services
bun run dev
```

## Documentation

Documentation is located in `vivim.docs.context/`

### Building Documentation

```bash
cd vivim.docs.context
npm run build
```

### Running Locally

```bash
cd vivim.docs.context
npm run start
```

### IMPORTANT: Documentation Guidelines

See `vivim.docs.context/DOCUMENTATION_GUIDE.md` for detailed instructions on:
- Building and deploying docs
- Adding new documentation
- Fixing broken links
- Writing user-facing content

---

## 📁 Project Structure

```
vivim-app/
├── github-frontend/    # Modern GitHub-style frontend (Next.js 15)
├── pwa/                # React PWA frontend
├── server/             # Express.js API server
├── network/            # P2P network engine
├── admin-panel/        # Admin dashboard
└── vivim.docs.context/ # Documentation site
```

## 🛠️ Tech Stack

### GitHub Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: Radix UI

### Core Application
- **Frontend**: React (PWA)
- **Backend**: Express.js
- **Runtime**: Bun
- **Networking**: Custom P2P engine
- **Language**: TypeScript

## 🌐 GitHub Frontend Features

The `github-frontend` directory contains a fully-featured GitHub-style interface:

- 🏠 **Landing Page** - Hero section, features, and stats
- 📁 **Repository Browser** - File explorer with README viewer
- 🐛 **Issues** - Issue tracking with labels and milestones
- 🔀 **Pull Requests** - PR management with status indicators
- 👥 **Contributors** - Contribution graph and team showcase
- 📦 **Releases** - Version history and downloads
- 📚 **Documentation** - Documentation hub with search
- 🌓 **Dark/Light Theme** - Full theme support

## Development

See individual package READMEs for development instructions.

### Available Commands

```bash
# Root commands
bun run dev              # Run all services
bun run dev:pwa          # Run PWA frontend
bun run dev:server       # Run API server
bun run dev:network      # Run P2P network
bun run dev:admin        # Run admin panel
bun run setup            # Setup dependencies and database

# GitHub frontend
cd github-frontend
bun run dev              # Development server
bun run build            # Production build
bun run start            # Production server
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Good First Issues

Look for issues labeled ["good first issue"](https://github.com/owenservera/vivim-app/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) to get started.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/owenservera/vivim-app)
- [Documentation](https://vivim-docs.vercel.app) (coming soon)
- [Issue Tracker](https://github.com/owenservera/vivim-app/issues)

---

Made with ❤️ by the VIVIM Team

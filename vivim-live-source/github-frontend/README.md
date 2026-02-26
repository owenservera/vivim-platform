# VIVIM GitHub Frontend

A modern, fully-featured GitHub-style frontend for the VIVIM project. Built with Next.js 15, Tailwind CSS, and Framer Motion.

## Features

- 🏠 **Landing Page** - Beautiful hero section with features showcase
- 📁 **Repository Browser** - File explorer with README viewer
- 🐛 **Issues Page** - Issue tracking with labels and filtering
- 🔀 **Pull Requests** - PR management with status indicators
- 👥 **Contributors** - Contribution graph and team showcase
- 📦 **Releases** - Version history and downloads
- 📚 **Documentation** - Documentation hub
- 🌓 **Dark/Light Theme** - Full theme support
- ✨ **Animations** - Smooth animations with Framer Motion
- 📱 **Responsive** - Mobile-friendly design

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: Radix UI primitives
- **Theme**: next-themes

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- npm, yarn, pnpm, or bun

### Installation

1. Navigate to the github-frontend directory:
```bash
cd github-frontend
```

2. Install dependencies:
```bash
# Using bun (recommended)
bun install

# Or using npm
npm install
```

3. Run the development server:
```bash
# Using bun
bun run dev

# Or using npm
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
github-frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css         # Global styles
│   │   ├── repository/         # Repository page
│   │   ├── issues/             # Issues page
│   │   ├── pull-requests/      # Pull requests page
│   │   ├── contributors/       # Contributors page
│   │   ├── releases/           # Releases page
│   │   └── docs/               # Documentation page
│   ├── components/             # React components
│   │   ├── ui/                 # UI components (shadcn/ui style)
│   │   ├── navigation.tsx      # Main navigation
│   │   ├── footer.tsx          # Footer component
│   │   └── theme-*.tsx         # Theme components
│   └── lib/                    # Utilities
│       └── utils.ts            # Helper functions
├── public/                     # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Available Scripts

```bash
# Development
bun run dev          # Start development server

# Production
bun run build        # Build for production
bun run start        # Start production server

# Linting
bun run lint         # Run ESLint
```

## Pages

### Landing Page (`/`)
- Hero section with project overview
- Feature showcase
- Tech stack display
- Call-to-action sections
- Repository stats

### Repository (`/repository`)
- File browser
- README viewer with markdown support
- Commit history
- Language statistics
- Repository metadata

### Issues (`/issues`)
- Issue list with status
- Label system
- Search and filter
- Milestone tracking
- Comment counts

### Pull Requests (`/pull-requests`)
- PR list with status
- Merge status indicators
- Check run status
- Branch information
- Review tracking

### Contributors (`/contributors`)
- Contribution graph (GitHub-style)
- Top contributors list
- Contribution statistics
- Team showcase

### Releases (`/releases`)
- Version history
- Release notes
- Download links
- Release statistics

### Documentation (`/docs`)
- Documentation hub
- Search functionality
- Section navigation
- Recent updates

## Customization

### Theme Colors

Edit `tailwind.config.js` to customize colors:

```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      // ... other colors
    },
  },
}
```

### Repository Data

Update the mock data in each page component to reflect your actual repository data:

- `src/app/repository/page.tsx` - Repository info
- `src/app/issues/page.tsx` - Issues data
- `src/app/pull-requests/page.tsx` - PR data
- `src/app/contributors/page.tsx` - Contributors data
- `src/app/releases/page.tsx` - Releases data

## Integration with GitHub API

To fetch real data from GitHub, you can use the GitHub API:

```typescript
// Example: Fetch repository stats
const response = await fetch('https://api.github.com/repos/owenservera/vivim-app')
const data = await response.json()
```

Consider using:
- [octokit/rest.js](https://github.com/octokit/rest.js) for GitHub API client
- Next.js API routes for server-side fetching
- SWR or React Query for data fetching and caching

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

```bash
# Build
bun run build

# The output will be in the .next directory
# Deploy to your preferred hosting
```

## License

MIT License - same as the main VIVIM project

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Design inspired by GitHub
- UI components based on [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

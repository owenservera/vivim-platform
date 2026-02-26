# VIVIM Live - Unified Deployment Guide

## ✅ Repository Structure Complete

All VIVIM Live content is now in a **single unified repository**:

**https://github.com/owenservera/vivim-live**

---

## Repository Overview

### Active Repositories

| Repository | Purpose | Status |
|------------|---------|--------|
| **[vivim-live](https://github.com/owenservera/vivim-live)** | 🏠 Landing page + Documentation | ✅ **PRIMARY** |
| [vivim-live-docs](https://github.com/owenservera/vivim-live-docs) | (Archived - merged) | ⚠️ Archived |
| [vivim-app](https://github.com/owenservera/vivim-app) | 💻 Full application (PWA, Server, P2P) | ✅ Active |
| [vivim-sdk](https://github.com/vivim/vivim-sdk) | 📦 SDK package | ✅ Active |

---

## Connect Vercel for Auto-Deploy

### Step 1: Disconnect Old Deployments (if any)

If you have existing Vercel deployments:

```bash
cd C:\0-BlackBoxProject-0\vivim-live
vercel unlink
```

### Step 2: Connect to Vercel

**Option A: Via Dashboard (Recommended)**

1. Go to: **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Find and select: **`owenservera/vivim-live`**
4. Click **"Import"**

**Option B: Via CLI**

```bash
cd C:\0-BlackBoxProject-0\vivim-live
vercel link
```

### Step 3: Configure Build Settings

Vercel will auto-detect from `vercel.json`:

| Setting | Value |
|---------|-------|
| **Framework** | Docusaurus (for docs) |
| **Build Command** | `cd docs && bun run build` |
| **Output Directory** | `docs/build` |
| **Install Command** | `bun install && cd docs && bun install` |
| **Root Directory** | Leave empty |

### Step 4: Deploy

Click **"Deploy"** and Vercel will build and deploy your site.

---

## Site Structure

After deployment, your site will have:

| Path | Content |
|------|---------|
| `/` | Landing page (stealth interface) |
| `/docs` | Documentation home |
| `/docs/sdk/overview` | SDK documentation |
| `/docs/sdk/core/overview` | Core SDK API |
| `/docs/sdk/api-nodes/overview` | API Nodes |
| `/docs/sdk/sdk-nodes/overview` | SDK Nodes (React, Vue, etc.) |
| `/docs/sdk/network/overview` | Network infrastructure |
| `/docs/sdk/guides/getting-started` | Getting started guide |
| `/docs/sdk/examples/basic` | Code examples |

---

## Custom Domain Setup

To use `vivim.live`:

### 1. Add Domain in Vercel

1. Go to **Vercel Dashboard** → **Settings** → **Domains**
2. Add: `vivim.live`
3. Add: `www.vivim.live`

### 2. Configure DNS

At your domain provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Verify

Vercel will automatically verify and enable HTTPS.

---

## Auto-Deploy Workflow

Once connected to GitHub:

| Git Action | Vercel Result |
|------------|---------------|
| Push to `main` | Auto-deploy to production |
| Push to feature branch | Auto-deploy to preview URL |
| Create Pull Request | Create preview deployment with comment |
| Merge PR to `main` | Auto-deploy production |

### Test Auto-Deployment

```bash
cd C:\0-BlackBoxProject-0\vivim-live

# Make a small change
echo "# Test" >> docs/docs/sdk/overview.md

# Commit and push
git add .
git commit -m "test: trigger auto-deploy"
git push origin main
```

Then check: **https://vercel.com/owenservera/vivim-live**

---

## Development

### Install Dependencies

```bash
cd C:\0-BlackBoxProject-0\vivim-live
bun run install:all
```

### Run Development Servers

```bash
# Run everything
bun run dev

# Or run individually
bun run dev:docs    # Docs at localhost:3000/docs
bun run dev:web     # Frontend at localhost:3001
```

### Build for Production

```bash
# Build everything
bun run build

# Or build individually
bun run build:docs  # Output: docs/build/
bun run build:web   # Output: github-frontend/.next/
```

---

## Repository Contents

```
vivim-live/
├── docs/                       # Docusaurus documentation
│   ├── docs/                   # Documentation source
│   │   ├── sdk/                # 🆕 SDK Documentation
│   │   │   ├── overview.md
│   │   │   ├── core/
│   │   │   ├── api-nodes/
│   │   │   ├── sdk-nodes/
│   │   │   ├── network/
│   │   │   ├── guides/
│   │   │   └── examples/
│   │   ├── architecture/       # Architecture docs
│   │   ├── api/                # API reference
│   │   ├── pwa/                # PWA guides
│   │   └── ...                 # Other docs
│   ├── src/                    # Custom Docusaurus code
│   ├── static/                 # Static assets
│   ├── build/                  # Production output
│   ├── docusaurus.config.ts    # Configured for /docs
│   ├── sidebars.ts
│   └── package.json
│
├── github-frontend/            # Next.js 15 frontend
│   ├── src/app/
│   │   ├── page.tsx            # Landing page
│   │   └── ...
│   └── package.json
│
├── index.html                  # Stealth landing page
├── vercel.json                 # Vercel deployment config
├── package.json                # Root package with workspaces
└── README.md                   # This guide
```

---

## Environment Variables (Optional)

Add in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NODE_VERSION` | `20` | All |
| `BUN_VERSION` | `1.0.0` | All |

---

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Verify `bun.lock` is committed
3. Test locally: `bun run build`

### Docs Not Accessible at /docs

1. Check `vercel.json` rewrites configuration
2. Verify `docusaurus.config.ts` has `baseUrl: '/docs'`
3. Rebuild: `cd docs && bun run build`

### Landing Page Not Showing

1. Ensure `index.html` exists in root
2. Check Vercel rewrites in `vercel.json`
3. Verify no conflicting redirect rules

---

## Commands Reference

### Git Commands

```bash
# View status
git status

# Add changes
git add .

# Commit
git commit -m "message"

# Push to main
git push origin main

# View remote
git remote -v
```

### Vercel CLI Commands

```bash
# Link project
vercel link

# Unlink project
vercel unlink

# Deploy manually
vercel --prod

# View logs
vercel logs <deployment-url>

# List deployments
vercel ls
```

### Build Commands

```bash
# Install all
bun run install:all

# Development
bun run dev
bun run dev:docs
bun run dev:web

# Build
bun run build
bun run build:docs
bun run build:web

# Serve production
bun run serve
```

---

## Summary

### ✅ What's Done

- [x] Unified repository structure
- [x] SDK documentation added (7 new docs)
- [x] Vercel configuration (`vercel.json`)
- [x] GitHub remote configured
- [x] Auto-deploy ready
- [x] Old docs repo archived

### 🎯 Next Steps

1. **Connect to Vercel**: https://vercel.com/new
2. **Import**: `owenservera/vivim-live`
3. **Deploy**: Click deploy button
4. **Configure Domain**: Add `vivim.live` in Vercel

### 🔗 Important Links

- **GitHub**: https://github.com/owenservera/vivim-live
- **Vercel Dashboard**: https://vercel.com/owenservera/vivim-live
- **Live Site**: (after deployment) https://vivim.live
- **Docs**: (after deployment) https://vivim.live/docs

---

**Ready to deploy!** 🚀

Everything is configured for automatic deployments from GitHub to Vercel.
Just connect the repository and you're done!

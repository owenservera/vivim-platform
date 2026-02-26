# VIVIM Live Docs - Vercel Auto-Deploy Setup

## ✅ Repository Ready!

The `vivim-live-docs` repository has been set up and pushed to GitHub.

**Repository**: https://github.com/owenservera/vivim-live-docs

## What's Included

| File/Folder | Description |
|-------------|-------------|
| `docs/` | All documentation source files |
| `docs/sdk/` | **NEW SDK Documentation** (7 comprehensive docs) |
| `docusaurus.config.ts` | Configured for `/docs` baseUrl |
| `vercel.json` | Vercel deployment configuration |
| `package.json` | Dependencies and scripts |
| `src/` | Custom Docusaurus components |
| `static/` | Static assets |

## Connect to Vercel for Auto-Deploy

### Step 1: Go to Vercel Dashboard
Visit: **https://vercel.com/new**

### Step 2: Import Git Repository
1. Click **"Import Git Repository"**
2. Find and select: **`owenservera/vivim-live-docs`**
3. Click **"Import"**

### Step 3: Configure Build Settings

Vercel will auto-detect from `vercel.json`, but verify these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Docusaurus` |
| **Build Command** | `bun run build` |
| **Output Directory** | `build` |
| **Install Command** | `bun install` |
| **Root Directory** | Leave empty |

### Step 4: Deploy
Click **"Deploy"** and Vercel will build and deploy your site.

## Custom Domain Setup

To serve at `vivim.live/docs`:

### Option A: Root Domain Redirect
1. Go to **Vercel Dashboard** → **Settings** → **Domains**
2. Add domain: `vivim.live`
3. Configure DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```
4. Set up redirect in `vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/docs", "destination": "/" },
       { "source": "/docs/:path*", "destination": "/:path*" }
     ]
   }
   ```

### Option B: Subdomain
1. Use `docs.vivim.live` as the domain
2. Configure DNS:
   ```
   Type: CNAME
   Name: docs
   Value: cname.vercel-dns.com
   ```

## Auto-Deploy Workflow

Once connected to Vercel:

| Action | Result |
|--------|--------|
| Push to `main` | Auto-deploy to production |
| Push to feature branch | Auto-deploy to preview URL |
| Create Pull Request | Create preview deployment |

## Test Auto-Deployment

1. Make a small change to any `.md` file in `docs/`
2. Commit and push:
   ```bash
   cd C:\0-BlackBoxProject-0\vivim-live-docs
   git add .
   git commit -m "test: trigger auto-deploy"
   git push origin main
   ```
3. Check **https://vercel.com/owenservera/vivim-live-docs** for deployment status

## SDK Documentation Structure

The following SDK docs are ready to deploy:

```
docs/sdk/
├── overview.md              # SDK ecosystem overview
├── core/
│   └── overview.md          # Core SDK API reference
├── api-nodes/
│   └── overview.md          # Identity, Storage, AI Chat, etc.
├── sdk-nodes/
│   └── overview.md          # React, Vue, Svelte, Flutter
├── network/
│   └── overview.md          # P2P networking
├── guides/
│   └── getting-started.md   # Quick start guide
└── examples/
    └── basic.md             # Code examples
```

## Environment Variables (Optional)

If needed, add in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `20` |

## Links

- **GitHub Repository**: https://github.com/owenservera/vivim-live-docs
- **Vercel Dashboard**: https://vercel.com/owenservera/vivim-live-docs
- **Main App Repo**: https://github.com/owenservera/vivim-app
- **SDK Repo**: https://github.com/vivim/vivim-sdk

## Commands Reference

```bash
# Local development
cd C:\0-BlackBoxProject-0\vivim-live-docs
bun install
bun run dev

# Build for production
bun run build

# Preview production build
bun run serve

# Git operations
git add .
git commit -m "message"
git push origin main
```

---

**Ready to deploy!** 🚀

Just connect the repository to Vercel and auto-deployments will be enabled.

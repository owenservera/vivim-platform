# ⚠️ Repository Archived

This repository has been **merged** into the main vivim-live repository.

## ➡️ New Home

All VIVIM Live documentation is now in:

**https://github.com/owenservera/vivim-live**

## Why the Change?

We've unified the repository structure to have everything in one place:
- ✅ Landing page (`/`)
- ✅ Documentation (`/docs`)
- ✅ Single source of truth
- ✅ Easier to manage and deploy

## Migration

### For Vercel

1. **Disconnect** this repository from Vercel
2. **Connect** the new repository: `owenservera/vivim-live`
3. **Deploy** - everything is already configured!

### New Structure

```
vivim-live/
├── docs/               # All documentation (moved from here)
│   ├── docs/sdk/       # NEW SDK documentation
│   └── docusaurus.config.ts
├── index.html          # Landing page
├── github-frontend/    # Next.js frontend
├── vercel.json         # Unified deployment config
└── package.json
```

### Vercel Configuration

The new repo has `vercel.json` configured for:
- **Build**: `cd docs && bun run build`
- **Output**: `docs/build`
- **Rewrites**: `/docs/*` → Documentation

## Links

| Repository | Status |
|------------|--------|
| [vivim-live](https://github.com/owenservera/vivim-live) | ✅ **Active** |
| vivim-live-docs | ⚠️ **Archived** |
| [vivim-app](https://github.com/owenservera/vivim-app) | ✅ Active (full app) |
| [vivim-sdk](https://github.com/vivim/vivim-sdk) | ✅ Active (SDK package) |

---

**Thank you for using VIVIM!** 🚀

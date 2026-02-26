# Vercel GitHub Integration Setup Guide

## Current Status
✅ Repository pushed to GitHub: https://github.com/owenservera/vivim-live
✅ vercel.json configured for auto-deployments

## Disconnect Vercel CLI Deployments

### 1. Unlink Local Project from Vercel CLI
```bash
cd C:\0-BlackBoxProject-0\vivim-live
vercel unlink
```

When prompted:
- Select "Yes" to unlink
- This stops CLI-based deployments

## Connect Vercel to GitHub for Auto-Deployments

### Option A: Connect via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard

2. **Add New Project**
   - Click "Add New..." → "Project"
   - Under "Import Git Repository", find and select: `owenservera/vivim-live`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Docusaurus (auto-detected)
   - **Root Directory**: Leave empty (using vercel.json)
   - **Build Command**: `cd docs && bun run build`
   - **Output Directory**: `docs/build`
   - **Install Command**: `cd docs && bun install`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy from GitHub

### Option B: Connect via Vercel CLI

```bash
cd C:\0-BlackBoxProject-0\vivim-live

# Link to existing Vercel project
vercel link

# When prompted:
# - "Set up and deploy"? → Yes
# - "Which scope"? → Select your account
# - "Link to existing project"? → Yes
# - Select: owenservera/vivim-live

# Enable GitHub auto-deployments
vercel github
```

## Enable Automatic Deployments

### In Vercel Dashboard:

1. Go to your project: https://vercel.com/owenservera/vivim-live
2. Navigate to **Settings** → **Git**
3. Under **Connected Git Repository**, ensure `owenservera/vivim-live` is connected
4. Enable these options:
   - ✅ **Deploy Previews**: Create preview deployments for pull requests
   - ✅ **Auto-Expose Comments**: Show deployment status on PRs
   - ✅ **Skip Failed Builds**: Don't deploy if build fails

### Configure Branch Deployments:

1. Go to **Settings** → **Git** → **Ignored Build Step**
2. Set up branch rules:
   - **Production Branch**: `main` (deploys to production)
   - **Preview Branches**: All other branches (deploy to preview URLs)

## Verify Auto-Deployment

### Test the Connection:

1. **Make a small change** to any documentation file:
   ```bash
   # Edit a file
   echo "# Test" >> docs/docs/sdk/overview.md
   
   # Commit and push
   git add .
   git commit -m "test: trigger auto-deployment"
   git push origin main
   ```

2. **Check Vercel Dashboard**:
   - Visit: https://vercel.com/owenservera/vivim-live
   - You should see a new deployment starting automatically
   - Click on the deployment to view build logs

3. **Verify Deployment**:
   - Once complete, visit your production URL
   - Changes should be live at: `https://vivim-live-*.vercel.app`

## Environment Variables (if needed)

If your project needs environment variables:

1. Go to **Settings** → **Environment Variables**
2. Add variables:
   - `NODE_VERSION`: `20` (if using Node.js)
   - Any other required variables

## Custom Domain Setup

To use `www.vivim.live`:

1. Go to **Settings** → **Domains**
2. Add domain: `vivim.live`
3. Add domain: `www.vivim.live`
4. Configure DNS records at your domain provider:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

## Webhook Verification

Vercel automatically creates a webhook in your GitHub repository.

To verify:
1. Go to GitHub: https://github.com/owenservera/vivim-live/settings/hooks
2. Look for "Vercel" webhook
3. It should trigger on: `push` events

## Troubleshooting

### Build Fails:
- Check build logs in Vercel dashboard
- Verify `bun.lock` is committed
- Ensure all paths in vercel.json are correct

### No Auto-Deployment:
- Check webhook is active in GitHub
- Verify Vercel app has repository access
- Check branch protection rules aren't blocking

### Preview Deployments Not Working:
- Ensure PRs are from branches (not main)
- Check "Ignored Build Step" settings

## Commands Reference

```bash
# View deployment status
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Cancel a deployment
vercel rm <deployment-url>

# Relink if needed
vercel link

# Unlink (stop CLI deployments)
vercel unlink
```

## Summary

After setup:
- ✅ Push to `main` → Auto-deploy to production
- ✅ Push to feature branch → Auto-deploy to preview URL
- ✅ Pull Request → Create preview deployment with comment
- ✅ No more manual `vercel deploy` commands needed!

---

**Vercel Project URL**: https://vercel.com/owenservera/vivim-live
**GitHub Repository**: https://github.com/owenservera/vivim-live

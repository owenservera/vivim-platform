# VIVIM PWA - Quick Start Guide

## 🚀 Getting Started (5 minutes)

### Prerequisites
- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Supabase account (free tier works)
- [ ] Bun installed (`npm i -g bun`)

---

## Step 1: Setup Supabase (10 min)

### 1.1 Create Project
1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Choose your organization
4. Set database password (save it!)
5. Choose region closest to your users
6. Click **Create new project**

### 1.2 Get Your Credentials
Go to **Project Settings → API**:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon/public key**: `eyJhbG...`
- **service_role key**: `eyJhbG...` (keep secret!)

### 1.3 Run Database Migration
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**

### 1.4 Enable Realtime
1. Go to **Database → Replication**
2. Toggle **Enable Realtime** for:
   - `conversations`
   - `messages`
   - `captures`

### 1.5 Create Storage Bucket
1. Go to **Storage**
2. Click **New Bucket**
3. Name: `uploads`
4. Public: **No**
5. Click **Create**

### 1.6 Configure Auth
Go to **Authentication → Providers**:
- **Email**: Enabled ✅
- **Google**: Add Client ID & Secret (optional)
- **GitHub**: Add Client ID & Secret (optional)

Go to **Authentication → URL Configuration**:
- **Site URL**: `https://your-vercel-app.vercel.app`
- **Redirect URLs**: 
  - `https://your-vercel-app.vercel.app/auth/callback`
  - `http://localhost:5173/auth/callback` (for dev)

---

## Step 2: Setup Vercel (5 min)

### 2.1 Create Project
1. Go to https://vercel.com/new
2. Click **Continue with GitHub**
3. Import your repository: `vivim-app`
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `cd pwa && bun run build`
   - **Output Directory**: `pwa/dist`
   - **Install Command**: `bun install`

### 2.2 Add Environment Variables
Go to **Settings → Environment Variables** and add:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=https://your-api.com (optional)
VITE_WS_URL=wss://your-websocket.com (optional)
```

Set for **all environments** (Production, Preview, Development)

### 2.3 Deploy
1. Click **Deploy**
2. Wait for build (~2 min)
3. Visit your live URL!

---

## Step 3: Local Development (5 min)

### 3.1 Clone & Install
```bash
git clone https://github.com/yourusername/vivim-app.git
cd vivim-app
bun install
```

### 3.2 Setup Environment
Create `pwa/.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 3.3 Run Development Server
```bash
bun run dev
```

Visit `http://localhost:5173`

---

## Step 4: Setup GitHub Actions (5 min)

### 4.1 Get Vercel Credentials
1. Go to Vercel → Account Settings → **Tokens**
2. Create token: `vivim-ci`
3. Copy the token
4. Go to Project Settings → copy **Project ID**
5. Go to Account Settings → copy **Organization ID**

### 4.2 Add GitHub Secrets
Go to your repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Your Vercel token |
| `VERCEL_ORG_ID` | Your org ID |
| `VERCEL_PROJECT_ID` | Your project ID |
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |

### 4.3 Test CI/CD
1. Create a pull request
2. Watch GitHub Actions run
3. Vercel preview deployment created
4. Merge to main → production deploy!

---

## Step 5: Test PWA (2 min)

### 5.1 Install on Desktop
1. Open your app in Chrome
2. Click install icon in address bar (⊕)
3. Click **Install**
4. App opens in standalone window!

### 5.2 Install on Mobile
1. Open in Safari (iOS) or Chrome (Android)
2. Tap **Share** → **Add to Home Screen**
3. Tap **Add**
4. Icon appears on home screen!

### 5.3 Test Offline
1. Open DevTools → Network tab
2. Set throttling to **Offline**
3. Reload page
4. Should show offline fallback

---

## 🔧 Configuration Files Created

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel deployment config |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `pwa/src/lib/supabase.ts` | Supabase client |
| `pwa/src/components/auth/SupabaseAuthProvider.tsx` | Auth provider |
| `supabase/migrations/001_initial_schema.sql` | Database schema |
| `PWA_PUBLISHING_ARCHITECTURE.md` | Full documentation |

---

## ✅ Verification Checklist

### Supabase
- [ ] Project created
- [ ] Database schema migrated
- [ ] Realtime enabled for tables
- [ ] Storage bucket created
- [ ] Auth providers configured
- [ ] Redirect URLs set

### Vercel
- [ ] Project connected to GitHub
- [ ] Environment variables added
- [ ] Deployed successfully
- [ ] Custom domain (optional)

### GitHub
- [ ] Secrets added
- [ ] Actions workflow runs
- [ ] Preview deploys on PRs
- [ ] Production deploy on main

### PWA
- [ ] Manifest valid
- [ ] Service worker registered
- [ ] Install prompt shows
- [ ] Offline mode works
- [ ] Lighthouse score >90

---

## 🐛 Troubleshooting

### Build fails on Vercel
```bash
# Test build locally
cd pwa && bun run build
```

### Supabase auth not working
- Check redirect URLs match exactly
- Verify environment variables are set
- Check browser console for errors

### PWA doesn't install
- Must be served over HTTPS
- Check `manifest.json` is valid
- Service worker must be registered
- Open Chrome DevTools → Application → Manifest

### Realtime not working
- Enable in Supabase Dashboard
- Check RLS policies allow subscriptions
- Verify WebSocket connection in Network tab

---

## 📊 Monitoring

### Vercel Analytics
- Enable in Dashboard → Analytics
- Track page views & web vitals

### Supabase Logs
- Dashboard → Logs
- Monitor queries & errors

### Sentry (Optional)
```bash
cd pwa
bun add @sentry/react
```

---

## 🎯 Next Steps

1. **Add custom domain** (Vercel → Settings → Domains)
2. **Setup error tracking** (Sentry)
3. **Add analytics** (PostHog, Plausible)
4. **Submit to app stores** (via PWA builders)
5. **Setup A/B testing** (Vercel Edge Config)

---

## 📚 Resources

- [Full Architecture Doc](./PWA_PUBLISHING_ARCHITECTURE.md)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

**Need help?** Check `PWA_PUBLISHING_ARCHITECTURE.md` for detailed explanations!

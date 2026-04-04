# VIVIM PWA Publishing - Implementation Checklist

## 📋 Overview
Track your progress through the complete PWA publishing setup.

---

## Phase 1: Supabase Setup ⚙️

### 1.1 Project Creation
- [ ] Create Supabase account (or login)
- [ ] Create new project: `vivim-production`
- [ ] Save database password securely
- [ ] Note Project ID: `________________________`
- [ ] Choose region: `________________________`

### 1.2 Credentials Collection
- [ ] Copy **Project URL**: `________________________`
- [ ] Copy **anon/public key**: `________________________`
- [ ] Copy **service_role key**: `________________________` (KEEP SECRET!)
- [ ] Store in password manager

### 1.3 Database Setup
- [ ] Open SQL Editor in Supabase Dashboard
- [ ] Run `supabase/migrations/001_initial_schema.sql`
- [ ] Verify tables created:
  - [ ] `profiles`
  - [ ] `conversations`
  - [ ] `messages`
  - [ ] `captures`
  - [ ] `likes`
- [ ] Check indexes created
- [ ] Verify RLS enabled on all tables

### 1.4 Realtime Configuration
- [ ] Go to Database → Replication
- [ ] Enable Realtime for `conversations`
- [ ] Enable Realtime for `messages`
- [ ] Enable Realtime for `captures`
- [ ] Test with Supabase Table Editor (make a change, watch it update)

### 1.5 Storage Setup
- [ ] Create bucket: `uploads`
- [ ] Set to private (not public)
- [ ] Add storage policies (see migration SQL)
- [ ] Test upload in Dashboard

### 1.6 Auth Configuration
- [ ] Enable Email provider ✅
- [ ] (Optional) Setup Google OAuth:
  - [ ] Create Google OAuth credentials
  - [ ] Add Client ID to Supabase
  - [ ] Add Client Secret to Supabase
  - [ ] Add redirect URL
- [ ] (Optional) Setup GitHub OAuth:
  - [ ] Create GitHub OAuth app
  - [ ] Add Client ID to Supabase
  - [ ] Add Client Secret to Supabase
- [ ] Set Site URL to production URL
- [ ] Add redirect URLs:
  - [ ] `https://your-app.vercel.app/auth/callback`
  - [ ] `http://localhost:5173/auth/callback`

### 1.7 Testing
- [ ] Create test user via Dashboard
- [ ] Verify profile auto-created
- [ ] Test login in browser
- [ ] Test RLS policies (try to access other user's data)

---

## Phase 2: Vercel Setup 🌐

### 2.1 Account & Project
- [ ] Login to Vercel (GitHub OAuth recommended)
- [ ] Click **New Project**
- [ ] Import GitHub repo: `vivim-app`
- [ ] Configure build settings:
  - [ ] Framework: Vite
  - [ ] Build Command: `cd pwa && bun run build`
  - [ ] Output Directory: `pwa/dist`
  - [ ] Install Command: `bun install`

### 2.2 Environment Variables
Add in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Production | Preview | Development |
|----------|-------|------------|---------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | ✅ | ✅ | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | ✅ | ✅ | ✅ |
| `VITE_API_BASE_URL` | Your API URL (optional) | ✅ | ✅ | ✅ |
| `VITE_WS_URL` | Your WS URL (optional) | ✅ | ✅ | ✅ |

### 2.3 Domain Setup (Optional)
- [ ] Go to Settings → Domains
- [ ] Add custom domain (e.g., `app.vivim.com`)
- [ ] Configure DNS:
  - [ ] Add CNAME record: `app.vivim.com → cname.vercel-dns.com`
  - [ ] Or A records provided by Vercel
- [ ] Wait for SSL certificate (auto)
- [ ] Update manifest.json `start_url` to custom domain

### 2.4 Deploy Settings
- [ ] Enable Vercel Analytics
- [ ] Enable Vercel Speed Insights
- [ ] Set deployment protection (if needed)
- [ ] Configure preview deployments

### 2.5 First Deployment
- [ ] Click **Deploy**
- [ ] Watch build logs
- [ ] Verify deployment successful
- [ ] Visit production URL
- [ ] Test basic functionality

---

## Phase 3: GitHub Actions CI/CD 🔄

### 3.1 Get Vercel Credentials
- [ ] Go to Vercel → Account Settings → Tokens
- [ ] Create new token: `vivim-github-ci`
- [ ] Copy token: `________________________`
- [ ] Copy **Organization ID** from Account Settings
- [ ] Copy **Project ID** from Project Settings

### 3.2 Add GitHub Secrets
Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Value | Added? |
|-------------|-------|--------|
| `VERCEL_TOKEN` | Vercel API token | [ ] |
| `VERCEL_ORG_ID` | Vercel org ID | [ ] |
| `VERCEL_PROJECT_ID` | Vercel project ID | [ ] |
| `SUPABASE_URL` | Supabase project URL | [ ] |
| `SUPABASE_ANON_KEY` | Supabase anon key | [ ] |

### 3.3 Workflow Verification
- [ ] Open `.github/workflows/deploy.yml`
- [ ] Verify branches configured (`main`, `develop`)
- [ ] Check build commands match your setup
- [ ] Verify environment variables referenced

### 3.4 Test CI/CD Pipeline
- [ ] Create feature branch: `git checkout -b test-ci`
- [ ] Make small change (e.g., update README)
- [ ] Commit and push: `git push -u origin test-ci`
- [ ] Create pull request to `develop`
- [ ] Watch Actions run (repo → Actions tab)
- [ ] Verify tests pass
- [ ] Verify preview deployment created
- [ ] Merge to `main`
- [ ] Verify production deployment

### 3.5 Branch Protection (Recommended)
- [ ] Go to Settings → Branches
- [ ] Add rule for `main`:
  - [ ] Require pull request reviews
  - [ ] Require status checks to pass
  - [ ] Include: `test`, `deploy-production`
  - [ ] Require branches up to date

---

## Phase 4: PWA Integration 🔗

### 4.1 Install Dependencies
```bash
cd pwa
bun add @supabase/supabase-js
```
- [ ] Package installed
- [ ] Added to `package.json`

### 4.2 Supabase Client Setup
- [ ] File created: `pwa/src/lib/supabase.ts`
- [ ] Environment variables referenced
- [ ] Helper functions tested:
  - [ ] `subscribeToConversations()`
  - [ ] `subscribeToMessages()`
  - [ ] `uploadFile()`
  - [ ] `getPublicUrl()`

### 4.3 Auth Provider Setup
- [ ] File created: `pwa/src/components/auth/SupabaseAuthProvider.tsx`
- [ ] Added to `App.tsx` wrapper
- [ ] Test auth flows:
  - [ ] Email signup
  - [ ] Email login
  - [ ] Logout
  - [ ] (Optional) Google OAuth
  - [ ] (Optional) GitHub OAuth
- [ ] Session persists on refresh
- [ ] Auth state updates UI

### 4.4 Environment Variables
Create `pwa/.env.local` (DO NOT COMMIT):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```
- [ ] File created
- [ ] Variables populated
- [ ] Added to `.gitignore`

### 4.5 Manifest & Service Worker
- [ ] `vite.config.ts` has `VitePWA` plugin configured
- [ ] Manifest icons exist in `pwa/public/`
- [ ] Service worker registered
- [ ] Test in Chrome DevTools → Application:
  - [ ] Manifest detected
  - [ ] Service worker active
  - [ ] Cache populated

### 4.6 PWA Features
- [ ] Install prompt shows (desktop)
- [ ] Add to Home Screen works (mobile)
- [ ] App opens in standalone window
- [ ] Offline fallback works
- [ ] Share target works (if configured)

---

## Phase 5: Testing & QA 🧪

### 5.1 Functional Testing
- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Create conversation
- [ ] Add message
- [ ] View conversation list
- [ ] Realtime updates work
- [ ] File upload works (if implemented)

### 5.2 PWA Testing
- [ ] Lighthouse PWA score >90
- [ ] Manifest valid (no errors)
- [ ] Service worker caches assets
- [ ] Offline mode shows fallback
- [ ] Install prompt appears
- [ ] Installed app launches
- [ ] Splash screen shows (mobile)

### 5.3 Performance Testing
- [ ] Lighthouse Performance score >90
- [ ] First Contentful Paint <1.5s
- [ ] Largest Contentful Paint <2.5s
- [ ] Time to Interactive <3.5s
- [ ] Cumulative Layout Shift <0.1
- [ ] Bundle size reasonable (<500KB initial)

### 5.4 Cross-Browser Testing
Test on:
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Chrome (Android)
- [ ] Safari (iOS)
- [ ] Edge (Desktop)

### 5.5 Device Testing
Test on:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Mobile (414x896)

---

## Phase 6: Pre-Launch Checklist 🚀

### 6.1 Security
- [ ] No secrets in code (check `.gitignore`)
- [ ] RLS policies enabled and tested
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] Service_Role key NOT in client
- [ ] Rate limiting configured (if applicable)

### 6.2 Monitoring
- [ ] Vercel Analytics enabled
- [ ] Vercel Speed Insights enabled
- [ ] (Optional) Sentry setup for error tracking
- [ ] Supabase logs monitored
- [ ] Error alerts configured

### 6.3 Documentation
- [ ] README updated with setup instructions
- [ ] API documented (if applicable)
- [ ] Environment variables documented
- [ ] Deployment process documented

### 6.4 Final Checks
- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Build succeeds locally
- [ ] Deploy to preview environment
- [ ] Manual QA on preview
- [ ] Merge to main
- [ ] Verify production deploy

---

## Phase 7: Launch Day 🎉

### 7.1 Pre-Launch (1 hour before)
- [ ] Run full test suite: `bun run test`
- [ ] Build succeeds: `cd pwa && bun run build`
- [ ] Deploy to preview
- [ ] Final manual QA
- [ ] Check all services healthy

### 7.2 Launch
- [ ] Merge to `main` branch
- [ ] Monitor GitHub Actions
- [ ] Monitor Vercel deployment
- [ ] Verify production URL loads
- [ ] Test critical user flows:
  - [ ] Signup
  - [ ] Login
  - [ ] Core feature test
  - [ ] PWA install
  - [ ] Offline mode

### 7.3 Post-Launch (immediate)
- [ ] Monitor Vercel Analytics
- [ ] Check Supabase logs for errors
- [ ] Monitor Sentry (if using)
- [ ] Test on multiple devices
- [ ] Share with team for testing

### 7.4 Post-Launch (24 hours)
- [ ] Review error logs
- [ ] Check user feedback
- [ ] Monitor performance metrics
- [ ] Review analytics
- [ ] Document any issues

---

## Phase 8: Post-Launch Optimization 📈

### 8.1 Performance
- [ ] Analyze bundle size
- [ ] Implement code splitting
- [ ] Optimize images
- [ ] Add lazy loading
- [ ] Monitor Core Web Vitals

### 8.2 SEO & Discoverability
- [ ] Add meta tags
- [ ] Create sitemap
- [ ] Add OpenGraph tags
- [ ] Submit to search engines
- [ ] Create robots.txt

### 8.3 User Experience
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add onboarding flow
- [ ] Implement feature flags
- [ ] A/B test improvements

### 8.4 Advanced Features
- [ ] Push notifications
- [ ] Background sync
- [ ] Periodic sync
- [ ] App shortcuts
- [ ] Badges (notification count)

---

## Resources & References

### Documentation
- [PWA_PUBLISHING_ARCHITECTURE.md](./PWA_PUBLISHING_ARCHITECTURE.md) - Full technical guide
- [PWA_QUICK_START.md](./PWA_QUICK_START.md) - 5-minute setup
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Vite PWA](https://vite-pwa-org.netlify.app/)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Manifest Validator](https://manifest-validator.com/)
- [WebPageTest](https://www.webpagetest.org/)

---

## Notes & Issues

Use this section to track any issues or notes during implementation:

### Issues
| # | Issue | Status | Resolution |
|---|-------|--------|------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Notes
- 
- 
- 

---

**Last Updated:** 2026-04-04  
**Status:** Not Started ☐ / In Progress ☐ / Complete ☐

# VIVIM PWA - Production Auth & Routing Review

## 🚨 Critical Issues Found

### Issue 1: Login Page Uses OLD Server Auth
**File**: `pwa/src/pages/Login.tsx`
- ❌ `loginWithGoogle()` redirects to `http://localhost:3000/api/v1/auth/google` (server auth)
- ❌ No connection to Supabase auth provider
- ❌ Won't work in production (server not deployed)

### Issue 2: Missing `/auth/callback` Route
**File**: `pwa/src/app/routes.tsx`
- ❌ SupabaseAuthProvider sets `redirectTo: /auth/callback` for OAuth
- ❌ No `/auth/callback` route exists in router
- ❌ After OAuth redirect, user hits 404

### Issue 3: No Auth State Integration with Routing
**File**: `pwa/src/App.tsx`
- ❌ No protected routes - everything is public
- ❌ No redirect to `/login` when unauthenticated
- ❌ SupabaseAuthProvider wraps app but auth state is never used

### Issue 4: Environment Variable Loading
**File**: `pwa/src/lib/supabase.ts`
- ✅ Now handles missing env vars gracefully (fixed)
- ⚠️ In production, env vars must be set on Vercel

---

## ✅ What Works
- ✅ Database migrations pushed (profiles, conversations, messages, captures, likes)
- ✅ Realtime enabled for all tables
- ✅ Storage bucket created
- ✅ Supabase env vars set on Vercel (all environments)
- ✅ Supabase client handles missing env vars gracefully

---

## 🔧 Required Fixes

### 1. Create AuthCallback Page
- Create `pwa/src/pages/AuthCallback.tsx`
- Handle Supabase OAuth session exchange
- Redirect to `/` on success or `/login` on error

### 2. Add `/auth/callback` Route
- Add route to `routes.tsx`
- Ensure it renders the callback handler

### 3. Update Login Page to Use Supabase
- Replace `loginWithGoogle()` with `useAuth().signInWithGoogle()`
- Replace device key button with email login
- Add Supabase email/password form

### 4. Create Protected Route Wrapper
- Create `ProtectedRoute` component
- Redirect unauthenticated users to `/login`
- Wrap authenticated routes

### 5. Update Supabase Redirect URLs
- Configure in Supabase Dashboard:
  - `https://vivim-app.vercel.app/auth/callback`
  - `http://localhost:5173/auth/callback`

---

## 📋 Implementation Order
1. Create AuthCallback page (2 min)
2. Add `/auth/callback` route (1 min)
3. Update Login page to use Supabase auth (10 min)
4. Create ProtectedRoute component (5 min)
5. Apply protected routes to appropriate pages (2 min)
6. Commit, push, redeploy (5 min)

**Total: ~25 minutes**

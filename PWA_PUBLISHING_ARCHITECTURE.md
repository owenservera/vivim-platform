# VIVIM PWA Publishing Architecture

## System Overview

**Stack**: Vercel (Hosting/CDN) + Supabase (Auth/DB/Realtime) + GitHub (CI/CD)  
**App**: React PWA with service worker, offline support, and real-time features

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Main Branch │  │ PR/Branches  │  │ GitHub Actions CI/CD │  │
│  │  (Production)│  │ (Development)│  │  • Build & Test      │  │
│  └──────┬───────┘  └──────┬───────┘  │  • Type Check        │  │
│         │                 │          │  • E2E Tests         │  │
└─────────┼─────────────────┼──────────│  • Deploy            │  │
          │                 │          └──────────┬───────────┘  │
          │ Push              │ Preview          │               │
          ▼                 ▼                   ▼               │
┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   Vercel        │  │  Vercel      │  │  Deployment Pipeline │  │
│  Production     │  │  Previews    │  │                      │  │
│  ┌───────────┐  │  │  ┌────────┐  │  │  1. bun install      │  │
│  │ PWA App   │  │  │  │ PWA    │  │  │  2. bun run build    │  │
│  │ Service   │◄─┘  │  │ Preview│◄─┘  │  3. Deploy to Vercel │  │
│  │ Worker    │     │  └────────┘     │  4. Update env vars  │  │
│  └───────────┘                      │  5. Run migrations   │  │
└────────┬─────────────────────────────┴──────────────────────┘  │
         │                                                        │
         │ API Calls                                              │
         ▼                                                        │
┌────────────────────────────────────────────────────────────────┐
│                        Supabase Platform                        │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Auth      │  │ PostgreSQL │  │ Realtime │  │  Storage   │ │
│  │  (Users)   │  │ (Data)     │  │ (WebSocket)│  │ (Files)   │ │
│  └────────────┘  └────────────┘  └──────────┘  └────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Supabase Setup

### 1.1 Create Supabase Project
- Sign in to https://supabase.com
- Create new project: `vivim-production`
- Note your **Project ID** and **API keys**

### 1.2 Environment Variables (Supabase)
Create in Vercel and local `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only!

# Database
DATABASE_URL=postgresql://postgres.<project-id>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.<project-id>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

### 1.3 Database Schema
Run SQL migrations in Supabase SQL Editor:

```sql
-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_conversations_updated ON public.conversations(user_id, updated_at DESC);
```

### 1.4 Enable Realtime
In Supabase Dashboard → Database → Replication:
- Enable Realtime for `conversations` and `messages` tables

### 1.5 Storage Setup
Create storage bucket `uploads`:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', false);

-- Storage policies
CREATE POLICY "Users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Phase 2: Vercel Setup

### 2.1 Connect GitHub Repository
1. Go to https://vercel.com/new
2. Import your GitHub repo: `vivim-app`
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `cd pwa && bun run build`
   - **Output Directory**: `pwa/dist`
   - **Install Command**: `bun install`

### 2.2 Environment Variables (Vercel Dashboard)
Add in **Settings → Environment Variables**:

```env
# Production
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://<your-server>.vercel.app
VITE_WS_URL=wss://<your-server>.vercel.app
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sentry (optional)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

Set for **all environments** (Production, Preview, Development)

### 2.3 Vercel Configuration File
Create `vercel.json` in project root:

```json
{
  "version": 2,
  "buildCommand": "cd pwa && bun run build",
  "outputDirectory": "pwa/dist",
  "installCommand": "bun install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-server-backend.com/api/:path*"
    },
    {
      "source": "/ws/:path*",
      "destination": "https://your-websocket-server.com/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## Phase 3: PWA Integration with Supabase

### 3.1 Install Supabase Client
```bash
cd pwa
bun add @supabase/supabase-js
```

### 3.2 Create Supabase Client
Create `pwa/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Realtime subscriptions
export function subscribeToConversations(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe()
}

export function subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe()
}
```

### 3.3 Generate Database Types
```bash
# Install Supabase CLI
bun add -d supabase

# Login to Supabase
bunx supabase login

# Link to your project
bunx supabase link --project-ref <your-project-id>

# Generate TypeScript types
bunx supabase gen types typescript --project-id <project-id> > pwa/src/lib/database.types.ts
```

### 3.4 Auth Provider
Create `pwa/src/components/auth/SupabaseAuthProvider.tsx`:

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within SupabaseAuthProvider')
  return context
}
```

### 3.5 Update manifest.json
Create `pwa/public/manifest.json`:

```json
{
  "name": "VIVIM - Own Your AI",
  "short_name": "VIVIM",
  "description": "The Sovereign AI Conversation Network",
  "theme_color": "#000000",
  "background_color": "#000000",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "categories": ["productivity", "utilities", "social"],
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "share_target": {
    "action": "/capture",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  },
  "shortcuts": [
    {
      "name": "Capture URL",
      "short_name": "Capture",
      "description": "Capture a new AI conversation",
      "url": "/capture",
      "icons": [{ "src": "/pwa-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "Search",
      "short_name": "Search",
      "description": "Search your conversation library",
      "url": "/search",
      "icons": [{ "src": "/pwa-192x192.png", "sizes": "192x192" }]
    }
  ]
}
```

### 3.6 Update index.html
Add to `pwa/index.html` `<head>`:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#000000" />
<link rel="apple-touch-icon" href="/pwa-192x192.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="VIVIM" />
```

---

## Phase 4: GitHub Actions CI/CD

### 4.1 Create Workflow File
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  NODE_ENV: production
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Type check
        run: cd pwa && bun run typecheck
      
      - name: Lint
        run: cd pwa && bun run lint
      
      - name: Run unit tests
        run: cd pwa && bun run test --run
      
      - name: Run E2E tests
        uses: playwright/test@v1
        with:
          working-directory: pwa
        env:
          CI: true

  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Build PWA
        run: cd pwa && bun run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./pwa
          alias-domains: |
            vivim-pr-{{PR_NUMBER}}.vercel.app

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run database migrations
        run: bunx supabase db push
        env:
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      
      - name: Build PWA
        run: cd pwa && bun run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./pwa
          vercel-args: '--prod'
      
      - name: Run Supabase migrations
        run: bunx supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

### 4.2 GitHub Secrets Configuration
Add these in **GitHub Repository → Settings → Secrets**:

| Secret Name | Description |
|-------------|-------------|
| `VERCEL_TOKEN` | Vercel API token (from Vercel dashboard) |
| `VERCEL_ORG_ID` | Your Vercel organization ID |
| `VERCEL_PROJECT_ID` | Your Vercel project ID |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token |
| `SUPABASE_DB_PASSWORD` | Supabase database password |
| `SUPABASE_PROJECT_ID` | Supabase project reference ID |

### 4.3 Get Vercel Credentials
1. Go to Vercel → Account Settings → Tokens
2. Create token: `vivim-github-ci`
3. Get Org ID from Account Settings
4. Get Project ID from Project Settings

### 4.4 Get Supabase Credentials
1. Supabase Dashboard → Project Settings → API
2. Copy URL and anon key
3. Create personal access token in Account Settings

---

## Phase 5: Production Optimization

### 5.1 Update vite.config.ts for Production

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'VIVIM - Own Your AI',
        short_name: 'VIVIM',
        description: 'The Sovereign AI Conversation Network',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities', 'social'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        share_target: {
          action: '/capture',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
        shortcuts: [
          {
            name: 'Capture URL',
            short_name: 'Capture',
            description: 'Capture a new AI conversation',
            url: '/capture',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Search',
            short_name: 'Search',
            description: 'Search your conversation library',
            url: '/search',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, '../common'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'supabase': ['@supabase/supabase-js'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
})
```

### 5.2 PWA Install Prompt
Create `pwa/src/components/PWAInstallPrompt.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('✅ PWA installed')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for 30 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissal < 30) {
        setShowPrompt(false)
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Install VIVIM</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Install VIVIM for quick access and offline support
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-zinc-400 hover:text-white transition"
              >
                Not now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### 5.3 Offline Fallback Page
Create `pwa/public/offline.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIVIM - Offline</title>
  <style>
    body {
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }
    .container {
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      color: #888;
      margin-bottom: 2rem;
    }
    button {
      background: #fff;
      color: #000;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover {
      background: #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're Offline</h1>
    <p>Check your connection and try again</p>
    <button onclick="window.location.reload()">Retry</button>
  </div>
</body>
</html>
```

---

## Phase 6: Deployment Checklist

### Pre-Launch
- [ ] Supabase project created and configured
- [ ] Database schema migrated
- [ ] RLS policies enabled and tested
- [ ] Storage bucket created
- [ ] Vercel account connected to GitHub
- [ ] Environment variables added to Vercel
- [ ] GitHub Actions workflow configured
- [ ] PWA manifest optimized
- [ ] Service worker tested
- [ ] Auth flow tested (email + OAuth)
- [ ] Realtime subscriptions working
- [ ] Offline mode functional
- [ ] Lighthouse score >90 (Performance, Accessibility, PWA)

### Launch Day
- [ ] Run full test suite: `bun run test`
- [ ] Build succeeds: `cd pwa && bun run build`
- [ ] Deploy to Vercel preview
- [ ] Manual QA on production-like environment
- [ ] Push to main branch
- [ ] Monitor Vercel deployment
- [ ] Verify production URL
- [ ] Test PWA install on mobile
- [ ] Test offline functionality
- [ ] Monitor Supabase logs for errors

### Post-Launch
- [ ] Monitor Vercel Analytics
- [ ] Check Supabase logs
- [ ] Set up Sentry alerts (if using)
- [ ] Monitor error rates
- [ ] Set up uptime monitoring
- [ ] Configure custom domain (if applicable)
- [ ] Submit to app stores (optional via PWA builders)

---

## Environment Variables Reference

### PWA (.env.local)
```env
# Supabase
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API (if using custom backend)
VITE_API_BASE_URL=https://your-api.com
VITE_WS_URL=wss://your-websocket.com

# Feature Flags
VITE_ENABLE_REALTIME=true
VITE_ENABLE_OFFLINE=true
```

### Server (.env)
```env
# Supabase (server-side)
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # NEVER expose to client!

# Database
DATABASE_URL=postgresql://...
```

---

## Monitoring & Analytics

### Vercel Analytics
- Enable in Vercel Dashboard → Analytics
- Track page views, web vitals, errors

### Supabase Logs
- Dashboard → Logs → Database
- Monitor queries, auth events, errors

### Sentry Integration (Optional)
```bash
cd pwa
bun add @sentry/react @sentry/vite-plugin
```

Add to `vite.config.ts`:
```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: 'your-org',
      project: 'vivim-pwa',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
})
```

---

## Custom Domain Setup

### Vercel
1. Project Settings → Domains
2. Add domain: `app.vivim.com`
3. Configure DNS (CNAME or A records)
4. Enable HTTPS (automatic)

### Update manifest.json
```json
{
  "start_url": "https://app.vivim.com/",
  "scope": "https://app.vivim.com/"
}
```

---

## Troubleshooting

### PWA Not Installing
- Check manifest.json is valid (Chrome DevTools → Application → Manifest)
- Ensure HTTPS is enabled
- Verify service worker is registered
- Check `beforeinstallprompt` event fires

### Supabase Auth Issues
- Verify redirect URLs in Supabase Dashboard → Auth → URL Configuration
- Check CORS settings
- Ensure environment variables are correct

### Build Failures
- Check TypeScript errors: `bun run typecheck`
- Verify all dependencies installed
- Check environment variables are set

### Realtime Not Working
- Enable Realtime in Supabase Dashboard
- Check RLS policies allow subscriptions
- Verify WebSocket connection in Network tab

---

## Next Steps

1. **Set up Supabase project**
2. **Configure Vercel deployment**
3. **Add GitHub Actions secrets**
4. **Test deployment pipeline**
5. **Monitor and iterate**

---

## Resources

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [PWA Checklist](https://web.dev/pwa-checklist/)

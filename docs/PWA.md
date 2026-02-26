# <img src="https://img.icons8.com/color/48/000000/mobile-iphone.png" width="40" align="left" /> VIVIM PWA

### Progressive Web Application - Modern User Interface

[« Back to Main Repository](../README.md) | [« Back to Documentation Index](./README.md)

---

## 📖 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [🏗️ Architecture](#️-architecture)
- [🧩 Components](#-components)
- [🎨 Design System](#-design-system)
- [🔧 Configuration](#-configuration)
- [📱 PWA Features](#-pwa-features)
- [🤝 Contributing](#-contributing)

---

## ✨ Overview

The **VIVIM PWA** is a modern, responsive progressive web application built with React 19, TypeScript, and TailwindCSS. It provides the primary user interface for interacting with the VIVIM platform.

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 5.9.x | Type Safety |
| TailwindCSS | 4.x | Styling |
| Vite | 7.x | Build Tool |
| Framer Motion | 12.x | Animations |
| Zustand | 5.x | State Management |
| TanStack Query | 5.x | Data Fetching |
| Dexie | 4.x | IndexedDB Wrapper |
| Yjs | 13.6.x | CRDT Sync |

---

## 🎯 Features

### Core Features

- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Offline Support** - Service worker caching for offline usage
- ✅ **Push Notifications** - Real-time updates and alerts
- ✅ **Installable** - Add to home screen on any device
- ✅ **Dark Mode** - Automatic theme switching
- ✅ **Accessibility** - WCAG 2.1 AA compliant

### Application Features

| Feature | Description | Status |
|---------|-------------|--------|
| **AI Chat** | Conversational AI interface | ✅ Stable |
| **Memory View** | Browse and search memories | ✅ Stable |
| **Content Feed** | Unified content timeline | ✅ Stable |
| **Social Graph** | Friends, circles, follows | 🚧 Beta |
| **Settings** | User preferences | ✅ Stable |
| **Profile** | User profile management | 🚧 Beta |

---

## 📦 Installation

```bash
# Navigate to PWA directory
cd pwa

# Install dependencies
bun install

# Or from root
bun install
```

### Dependencies

```json
{
  "dependencies": {
    "@ai-sdk/openai": "^3.0.34",
    "@assistant-ui/react": "^0.12.12",
    "@radix-ui/react-*": "latest",
    "@tanstack/react-query": "^5.90.21",
    "@vivim/network-engine": "workspace:*",
    "@vivim/sdk": "workspace:*",
    "ai": "^6.0.100",
    "dexie": "^4.0.10",
    "framer-motion": "^12.34.3",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^7.13.0",
    "tailwindcss": "^4.1.18",
    "yjs": "^13.6.29",
    "zod": "^4.3.6",
    "zustand": "^5.0.11"
  }
}
```

---

## 🚀 Quick Start

### Development

```bash
# Start development server
bun run dev

# Server runs at http://localhost:5173
```

### Build

```bash
# Production build
bun run build

# Preview production build
bun run preview
```

### Testing

```bash
# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e

# Run tests with UI
bun run test:ui
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PWA Architecture                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Pages Layer                           │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │   │
│  │  │  Home   │ │   Chat   │ │ Memory  │ │   Settings   │  │   │
│  │  │  Page   │ │   Page   │ │  Page   │ │    Page      │  │   │
│  │  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │   │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                  Components Layer                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │   Common    │  │   Layout    │  │   Feature       │   │ │
│  │  │ Components  │  │ Components  │  │  Components     │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                   State Layer                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │  Zustand    │  │  TanStack   │  │   React Query   │   │ │
│  │  │  Stores     │  │   Query     │  │   Cache         │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                   Data Layer                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │   Dexie     │  │  Service    │  │   WebSocket     │   │ │
│  │  │  (IndexedDB)│  │   Worker    │  │   Connection    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Components

### Component Structure

```
pwa/src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   │
│   ├── layout/                # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   │
│   ├── features/              # Feature-specific components
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── MessageInput.tsx
│   │   ├── memory/
│   │   │   ├── MemoryCard.tsx
│   │   │   ├── MemoryList.tsx
│   │   │   └── MemoryForm.tsx
│   │   └── social/
│   │       ├── FriendCard.tsx
│   │       ├── CircleView.tsx
│   │       └── FollowButton.tsx
│   │
│   └── providers/             # Context providers
│       ├── ThemeProvider.tsx
│       ├── AuthProvider.tsx
│       └── QueryProvider.tsx
│
├── pages/                     # Page components
│   ├── HomePage.tsx
│   ├── ChatPage.tsx
│   ├── MemoryPage.tsx
│   ├── SettingsPage.tsx
│   └── ...
│
├── stores/                    # Zustand stores
│   ├── chatStore.ts
│   ├── memoryStore.ts
│   └── userStore.ts
│
├── hooks/                     # Custom hooks
│   ├── useChat.ts
│   ├── useMemory.ts
│   └── useAuth.ts
│
└── lib/                       # Utilities
    ├── api.ts
    ├── db.ts
    └── utils.ts
```

### Example Component

```tsx
import { useState } from 'react'
import { useMemoryStore } from '@/stores/memoryStore'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface MemoryCardProps {
  memoryId: string
}

export function MemoryCard({ memoryId }: MemoryCardProps) {
  const { memories, deleteMemory } = useMemoryStore()
  const memory = memories.find(m => m.id === memoryId)

  if (!memory) return null

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {memory.memoryType}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMemory(memory.id)}
          >
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg">{memory.content}</p>
        {memory.tags && (
          <div className="flex gap-2 mt-4">
            {memory.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-secondary rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 🎨 Design System

### Color Palette

```
┌─────────────────────────────────────────────────────────┐
│                    Color System                          │
├─────────────────────────────────────────────────────────┤
│  Primary        │  Secondary     │  Accent             │
│  ████ #3B82F6  │  ████ #8B5CF6  │  ████ #10B981       │
│  blue-500       │  violet-500    │  emerald-500        │
├─────────────────────────────────────────────────────────┤
│  Background     │  Surface       │  Border             │
│  ████ #0A0A0A  │  ████ #171717  │  ████ #262626       │
│  (dark)         │  (dark)        │  (dark)             │
├─────────────────────────────────────────────────────────┤
│  Text Primary   │  Text Muted    │  Text Disabled      │
│  ████ #FAFAFA  │  ████ #A3A3A3  │  ████ #525252       │
└─────────────────────────────────────────────────────────┘
```

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 2.5rem | 700 |
| H2 | Inter | 2rem | 600 |
| H3 | Inter | 1.5rem | 600 |
| Body | Inter | 1rem | 400 |
| Small | Inter | 0.875rem | 400 |
| Code | JetBrains Mono | 0.875rem | 400 |

### Spacing Scale

```
0.25rem (4px)   │  0.5rem (8px)    │  0.75rem (12px)
1rem (16px)     │  1.5rem (24px)   │  2rem (32px)
3rem (48px)     │  4rem (64px)     │  6rem (96px)
```

---

## 🔧 Configuration

### Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'VIVIM',
        short_name: 'VIVIM',
        description: 'Your Personal AI Memory Platform',
        theme_color: '#3B82F6',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

### Tailwind Config

```typescript
// tailwind.config.ts
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(217 91% 60%)',
          foreground: 'hsl(0 0% 100%)'
        },
        // ... more colors
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
```

---

## 📱 PWA Features

### Service Worker

```typescript
// Service worker configuration
{
  strategies: 'cacheFirst',
  cacheOptions: {
    cacheName: 'vivim-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    }
  }
}
```

### Offline Support

- ✅ Static assets cached
- ✅ API responses cached
- ✅ IndexedDB for local data
- ✅ Background sync for mutations

### Install Prompt

```tsx
import { useRegisterSW } from 'virtual:pwa-register/react'

export function InstallPrompt() {
  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW()

  if (offlineReady || needRefresh) {
    return (
      <div className="pwa-toast">
        <p>VIVIM is ready to work offline!</p>
        <button onClick={() => updateServiceWorker(true)}>
          Update
        </button>
      </div>
    )
  }

  return null
}
```

---

## 🤝 Contributing

### Development Setup

```bash
# Clone and navigate
cd pwa

# Install dependencies
bun install

# Start development
bun run dev
```

### Code Style

```bash
# Lint
bun run lint

# Format
bun run format

# Type check
bun run typecheck
```

### Testing

```bash
# Unit tests
bun run test

# E2E tests
bun run test:e2e

# Coverage
bun run test:coverage
```

---

## 📜 License

MIT License - see [LICENSE](../LICENSE) for details.

---

<div align="center">

**Built with ❤️ by the VIVIM Team**

[⬆ Back to top](#vivim-pwa) | [🏠 Back to Main Repo](../README.md) | [📚 Back to Docs](./README.md)

</div>

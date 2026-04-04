# VIVIM Frontend Redesign Specification

> **Generated for:** Frontend Developer  
> **Purpose:** Complete UI/UX redesign documentation for new frontend shell  
> **Date:** March 2026  
> **Output Directory:** `.archive.dev/`

---

## 1. Project Overview

### 1.1 What is VIVIM?

VIVIM is an **open-source, decentralized AI memory platform** that allows users to:
- Capture, store, and search AI conversations (ChatGPT, Claude, Gemini, etc.)
- Fork, share, and collaborate on AI conversations
- Own and control their AI data with end-to-end encryption
- Participate in a P2P network for decentralized storage

### 1.2 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React 19 |
| **Language** | TypeScript 5.9 |
| **Build Tool** | Vite 7 |
| **Styling** | TailwindCSS 4 + Custom CSS Design System |
| **State Management** | Zustand |
| **Data Fetching** | TanStack Query |
| **Routing** | React Router DOM 7 |
| **Animations** | Framer Motion 12 |
| **UI Components** | Radix UI (primitives), Custom iOS components |
| **Icons** | Lucide React |
| **Runtime** | Bun |

### 1.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        PWA (Port 5173)                      │
├─────────────────────────────────────────────────────────────┤
│  src/                                                       │
│  ├── pages/           # Route pages (30+ pages)            │
│  ├── components/      # Reusable UI components             │
│  │   ├── ui/         # Base UI (Button, Card, Input...)   │
│  │   ├── ios/        # iOS-specific components            │
│  │   ├── responsive/ # Responsive layout components        │
│  │   └── ...         # Feature-specific components         │
│  ├── stores/          # Zustand state stores               │
│  ├── lib/            # Utilities, services, SDK             │
│  ├── hooks/          # Custom React hooks                  │
│  ├── contexts/       # React context providers             │
│  └── router/         # Route definitions                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Connected Services (Running Locally)                       │
├─────────────────────────────────────────────────────────────┤
│  Server (Port 3000)     │  Network Engine (Port 1235)      │
│  - REST API            │  - LibP2P P2P                     │
│  - PostgreSQL          │  - CRDT Sync (Yjs)               │
│  - Redis               │  - WebRTC                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Current State Analysis

### 2.1 Existing Design System

The project has **three competing design systems**:

1. **`unified-design-system.css`** - Modern CSS custom properties system
   - Colors, typography, spacing, shadows
   - Dark mode support
   - Animations and glass effects
   - Located: `pwa/src/styles/unified-design-system.css`

2. **`ios-design-system.css`** - iOS-specific styling
   - iOS-inspired components
   - Safe area insets
   - iOS navigation patterns

3. **`design-system.css`** - Legacy design system
   - Older styling approach
   - Some unique component styles

4. **`index.css`** - TailwindCSS 4 base
   - CSS-first configuration
   - Custom properties for theming

### 2.2 The Core Problem

**The mobile vs. desktop implementation is fundamentally broken:**

- iOS components (`IOSBottomNav`, `IOSDefaultTopBar`) are hardcoded for mobile
- Desktop sidebar (`SideNav`) coexists with mobile navigation in confusing ways
- Responsive layout uses device detection which is unreliable
- Multiple CSS files with conflicting styles
- No unified approach to responsive behavior

---

## 3. Redesign Requirements

### 3.1 Primary Goals

1. **Unified Responsive Design**
   - Single codebase for mobile and desktop
   - Fluid transitions between breakpoints
   - No separate iOS-specific components

2. **Modern Visual Design**
   - Clean, professional, modern aesthetic
   - Consistent spacing and typography
   - Subtle, purposeful animations

3. **Developer Experience**
   - Clear component API
   - Consistent patterns
   - Easy to extend and maintain

### 3.2 Design Philosophy

- **Mobile-First**: Start with mobile, expand for desktop
- **Progressive Enhancement**: Core functionality works everywhere
- **Native Feel**: Feel like a native app on mobile, native desktop on desktop
- **Performance**: Fast load times, smooth animations, efficient rendering

---

## 4. Application Structure

### 4.1 Routes/Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Main conversation feed with recommendations |
| `/login` | Login | Authentication screen |
| `/search` | Search | Global search |
| `/analytics` | Analytics | Usage statistics |
| `/bookmarks` | Bookmarks | Saved conversations |
| `/capture` | Capture | Import conversations |
| `/simple-capture` | CaptureSimple | Simplified capture |
| `/conversation/:id` | ConversationView | View conversation |
| `/settings` | Settings | App settings |
| `/settings/ai` | ContextRecipes | AI context recipes |
| `/account` | Account | User account |
| `/collections` | Collections | Conversation collections |
| `/archive` | Archive | Archive with sub-routes |
| `/archive/imported` | ArchiveImported | Imported content |
| `/archive/active` | ArchiveActive | Active conversations |
| `/archive/shared` | ArchiveShared | Shared with user |
| `/archive/collections` | ArchiveCollections | Collection list |
| `/archive/collections/:id` | CollectionDetail | Collection view |
| `/archive/search` | ArchiveSearch | Archive search |
| `/chat` | AIChat | AI chat interface |
| `/chain-chat` | BlockchainAIChat | Blockchain chat |
| `/identity` | IdentitySetup | Identity setup |
| `/storage` | StorageDashboard | Storage management |
| `/ai-conversations` | AIConversationsPage | AI conversation list |
| `/for-you` | ForYou | Personalized feed |
| `/byok` | BYOKChat | BYOK chat interface |
| `/context-components` | ContextComponents | Context management |
| `/context-cockpit` | ContextCockpitPage | Context cockpit |
| `/conversation/:id/share` | Share | Share conversation |
| `/receive/:code` | Receive | Receive shared content |
| `/errors` | ErrorDashboard | Error dashboard |
| `/admin` | AdminPanel | Admin interface |
| `*` | 404 | Not found |

### 4.2 Navigation Structure

**Desktop (≥1024px):**
- Fixed left sidebar (260px width)
- Top navigation via sidebar
- Content area with padding

**Mobile/Tablet (<1024px):**
- Bottom navigation bar
- Top bar with app title/actions
- Full-width content area

---

## 5. Key Features to Support

### 5.1 Core Features

1. **Conversation Management**
   - List, filter, search conversations
   - View conversation details
   - Fork, share, archive conversations
   - Pin conversations

2. **AI Chat Interface**
   - Real-time chat with AI
   - Message streaming
   - Code highlighting
   - Markdown rendering

3. **Capture/Import**
   - URL import
   - File import
   - Manual capture

4. **Archive**
   - Multiple view modes (list, grid, timeline, canvas)
   - Collections management
   - Search within archive

5. **Settings**
   - Theme toggle (light/dark)
   - AI provider configuration
   - Storage management
   - Account settings

### 5.2 Advanced Features

1. **Knowledge Graph** - Visual conversation relationships
2. **Context Cockpit** - AI context management
3. **Storage Dashboard** - Local storage visualization
4. **Admin Panel** - System monitoring
5. **Sovereignty Features** - Trust seals, DAG visualization

---

## 6. Integration Points

### 6.1 Required API Integrations

The new frontend must integrate with:

1. **Storage Service** (`conversation-service.ts`)
   - `getAllConversations()`
   - `getConversation(id)`
   - `saveConversation()`
   - `deleteConversation()`

2. **API Client** (`api-client.ts`)
   - REST API calls to backend
   - Authentication headers
   - Error handling

3. **State Management** (Zustand stores)
   - `useHomeUIStore` - UI state
   - `settingsStore` - App settings
   - `archiveStore` - Archive state
   - `identityStore` - User identity

4. **Recommendation Engine** (`recommendation/`)
   - For You feed
   - Similar conversations

### 6.2 Data Types

```typescript
// Core conversation type
interface Conversation {
  id: string;
  title: string;
  provider: string;
  messages: Message[];
  tags: string[];
  state: 'ACTIVE' | 'ARCHIVED';
  stats: ConversationStats;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | Part[];
  parts?: Part[];
}

interface Part {
  type: 'text' | 'image' | 'code' | 'tool-call' | 'tool-result';
  text?: string;
  // ...
}
```

---

## 7. Acceptance Criteria

### 7.1 Visual Checkpoints

- [ ] Mobile view has functional bottom navigation
- [ ] Desktop view has functional sidebar
- [ ] Responsive transitions are smooth
- [ ] Dark mode works throughout
- [ ] Animations are performant (60fps)
- [ ] Loading states are shown appropriately

### 7.2 Functional Checkpoints

- [ ] All routes are accessible
- [ ] Conversations can be viewed
- [ ] Search works
- [ ] Settings persist
- [ ] Theme toggle works
- [ ] Mobile gestures work (swipe, pull-to-refresh)

### 7.3 Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Lighthouse Performance: > 80

---

## 8. Deliverables

The developer should create:

1. **New Frontend Shell** - Complete React application structure
2. **Component Library** - Reusable, well-documented components
3. **Design System** - Unified tokens, patterns, and utilities
4. **Responsive Layout** - Mobile-first responsive implementation
5. **Integration Layer** - Clean API for existing services

---

## Appendix: File Structure Reference

```
pwa/
├── src/
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Tailwind + base styles
│   ├── pages/                       # Route pages
│   │   ├── Home.tsx                 # ~1200 lines - main feed
│   │   ├── Settings.tsx
│   │   ├── Capture.tsx
│   │   └── ... (30+ pages)
│   ├── components/
│   │   ├── ui/                     # Base UI components
│   │   ├── ios/                    # iOS components (to be replaced)
│   │   ├── responsive/             # Responsive components
│   │   └── ...
│   ├── stores/                     # Zustand stores
│   ├── lib/                        # Utilities and services
│   │   ├── service/               # API services
│   │   ├── storage-v2/            # Storage layer
│   │   └── ...
│   └── router/
│       └── routes.tsx              # Route definitions
├── package.json
└── tailwind.config.js
```

---

*This specification provides the foundation for a complete frontend redesign. The developer has full creative freedom to implement modern, consistent UI while maintaining all existing functionality.*

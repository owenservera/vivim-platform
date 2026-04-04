# DOCUMENT D: Frontend Page & Component Inventory

**Date**: 2026-03-05
**Project**: VIVIM — PWA Frontend

---

## Pages (Routes)

### pwa/src/app/routes.tsx

| Route | Component | Description | Status |
|-------|-----------|-------------|--------|
| / | Home.tsx | Main landing/feed | WORKING |
| /login | Login.tsx | Login page | WORKING |
| /search | Search.tsx | Search interface | WORKING |
| /analytics | Analytics.tsx | Analytics dashboard | WORKING |
| /bookmarks | Bookmarks.tsx | Saved items | WORKING |
| /capture | Capture.tsx | Conversation capture | WORKING |
| /simple-capture | CaptureSimple.tsx | Simple capture | WORKING |
| /conversation/:id | ConversationView.tsx | View conversation | WORKING |
| /settings | Settings.tsx | User settings | WORKING |
| /settings/ai | Settings.tsx | AI settings | WORKING |
| /chat | Home.tsx | Chat interface | WORKING |
| /ai-conversations | AIConversationsPage.tsx | AI conv list | WORKING |
| /ai/conversation/:id | AIConversationsPage.tsx | AI conversation | WORKING |
| /conversation/:id/share | Share.tsx | Share dialog | WORKING |
| /receive/:code | Receive.tsx | Receive shared | WORKING |
| /errors | ErrorDashboard.tsx | Error tracking | WORKING |
| /account | Account.tsx | Account management | WORKING |

---

## Pages Detail

### Home.tsx
- **Path**: pwa/src/pages/Home.tsx (59177 bytes)
- **Description**: Main feed with conversation list, AI chat integration
- **API Calls**: /api/v1/feed, /api/v1/conversations, /api/v1/ai-chat
- **State Management**: useHomeUIStore, TanStack Query
- **Status**: WORKING

### Capture.tsx
- **Path**: pwa/src/pages/Capture.tsx (33806 bytes)
- **Description**: Conversation capture with provider detection
- **API Calls**: /api/v1/capture, /api/v1/capture/providers
- **State Management**: React Query
- **Status**: WORKING

### Account.tsx
- **Path**: pwa/src/pages/Account.tsx (9636 bytes)
- **Description**: Account management, profile settings
- **API Calls**: /api/v1/account/me, /api/v1/account/me/api-keys
- **State Management**: Zustand stores
- **Status**: WORKING

### Settings.tsx
- **Path**: pwa/src/pages/Settings.tsx (11165 bytes)
- **Description**: User and AI settings
- **API Calls**: /api/v1/ai-settings, /api/v1/context/settings
- **State Management**: Zustand (settings.store.ts)
- **Status**: WORKING

### Analytics.tsx
- **Path**: pwa/src/pages/Analytics.tsx (10838 bytes)
- **Description**: Usage analytics and insights
- **API Calls**: /api/v1/ai-settings/telemetry
- **Status**: WORKING

### Login.tsx
- **Path**: pwa/src/pages/Login.tsx (4613 bytes)
- **Description**: Authentication page
- **Auth**: Google OAuth
- **Status**: WORKING

---

## Key Components

### ContextCockpit.tsx
- **Path**: pwa/src/components/ContextCockpit.tsx (21845 bytes)
- **Description**: Context engine visualization and control
- **Props**: userId, contextType, budget
- **Wiring**: Real data via /api/v2/context/*
- **Status**: WORKING

### ContextCockpitPage.tsx
- **Path**: pwa/src/pages/ContextCockpitPage.tsx (7420 bytes)
- **Description**: Full page ContextCockpit view
- **Status**: WORKING

### ContextVisualizer.tsx
- **Path**: pwa/src/components/ContextVisualizer.tsx (15687 bytes)
- **Description**: Visual representation of context
- **Status**: WORKING

### AIChat.tsx
- **Path**: pwa/src/components/AIChat.tsx (10783 bytes)
- **Description**: AI chat interface
- **API Calls**: /api/v1/ai-chat, /api/v1/ai/stream
- **Status**: WORKING

### BlockchainAIChat.tsx
- **Path**: pwa/src/components/BlockchainAIChat.tsx (6884 bytes)
- **Description**: AI chat with blockchain features
- **Status**: WORKING

### OmniComposer.tsx
- **Path**: pwa/src/components/OmniComposer.tsx (8481 bytes)
- **Description**: Multi-modal input composer
- **Status**: WORKING

### ShareMenu.tsx
- **Path**: pwa/src/components/ShareMenu.tsx (5952 bytes)
- **Description**: Sharing options menu
- **API Calls**: /api/v2/sharing/*
- **Status**: WORKING

### ForkButton.tsx
- **Path**: pwa/src/components/ForkButton.tsx (2786 bytes)
- **Description**: Fork/derivative button for ACUs
- **API Calls**: /api/v1/acus/:id/remix
- **Status**: WORKING

### RemuxDialog.tsx
- **Path**: pwa/src/components/RemuxDialog.tsx (7920 bytes)
- **Description**: ACU remixing dialog
- **Status**: WORKING

### ACUViewer.tsx
- **Path**: pwa/src/components/ACUViewer.tsx (7111 bytes)
- **Description**: Display individual ACU
- **Status**: WORKING

### ACUSearch.tsx
- **Path**: pwa/src/components/ACUSearch.tsx (6965 bytes)
- **Description**: Search ACUs
- **API Calls**: /api/v1/acus/search
- **Status**: WORKING

### ACUGraph.tsx
- **Path**: pwa/src/components/ACUGraph.tsx (7995 bytes)
- **Description**: ACU relationship graph
- **Status**: WORKING

### Share.tsx
- **Path**: pwa/src/pages/Share.tsx (13981 bytes)
- **Description**: Share creation and management
- **API Calls**: /api/v2/sharing/*
- **Status**: WORKING

### Receive.tsx
- **Path**: pwa/src/pages/Receive.tsx (8488 bytes)
- **Description**: Receive shared content
- **Status**: WORKING

### Collections.tsx
- **Path**: pwa/src/pages/Collections.tsx (10134 bytes)
- **Description**: Collections management
- **API Calls**: /api/v1/collections/*
- **Status**: WORKING

### ForYou.tsx
- **Path**: pwa/src/pages/ForYou.tsx (8656 bytes)
- **Description**: Personalized feed
- **API Calls**: /api/v2/feed
- **Status**: WORKING

### Search.tsx
- **Path**: pwa/src/pages/Search.tsx (3898 bytes)
- **Description**: Global search
- **API Calls**: /api/v1/conversations/search
- **Status**: WORKING

### AdminPanel.tsx
- **Path**: pwa/src/pages/AdminPanel.tsx (17725 bytes)
- **Description**: Admin dashboard
- **API Calls**: /api/admin/*
- **Status**: WORKING

### ErrorDashboard.tsx
- **Path**: pwa/src/pages/ErrorDashboard.tsx (12118 bytes)
- **Description**: Error tracking dashboard
- **Status**: WORKING

### BYOKChat.tsx
- **Path**: pwa/src/pages/BYOKChat.tsx (12636 bytes)
- **Description**: BYOK AI chat
- **API Calls**: /api/v1/ai/*
- **Status**: WORKING

### CaptureSimple.tsx
- **Path**: pwa/src/pages/CaptureSimple.tsx (16288 bytes)
- **Description**: Simple capture flow
- **Status**: WORKING

### ConversationView.tsx
- **Path**: pwa/src/pages/ConversationView.tsx (4205 bytes)
- **Description**: View single conversation
- **Status**: WORKING

---

## State Management

### Zustand Stores (pwa/src/stores/)

| Store | File | Usage |
|-------|------|-------|
| identity.store.ts | identity.store.ts | User identity, DID |
| settings.store.ts | settings.store.ts | User preferences |
| sync.store.ts | sync.store.ts | Sync state |
| ui.store.ts | ui.store.ts | UI state |
| useHomeUIStore.ts | useHomeUIStore.ts | Home page state |

### TanStack Query Keys

- conversations:list
- conversations:detail
- memories:list
- context:bundles
- feed:personalized
- user:profile
- ai:settings
- acus:search

---

## Component Status Summary

| Category | Count | Working |
|----------|-------|---------|
| Pages | 20 | 20 |
| Key Components | 20 | 20 |
| State Stores | 5 | 5 |

**Overall Status**: WORKING

---

## Known Issues

1. Some components may have edge cases not fully tested
2. Error boundary components exist but may need review
3. Some PWA offline capabilities need verification

---

## UI Components Location

- pwa/src/components/ui/ - Basic UI components
- pwa/src/components/ios/ - iOS-specific components
- pwa/src/components/auth/ - Authentication components
- pwa/src/components/admin/ - Admin components

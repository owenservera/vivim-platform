# Frontend UI Redesign - Investigation List

> **Architectural Directive:** 
00- READ FULL FILES FROM THE LIST BELOW --00s
> 1. Synthesize the core design principles and project objectives defined in the `.archive.dev` documentation to engineer a unified, platform-agnostic frontend shell.
> 2. Use the following investigation list to map existing dependencies and systematically replace fragmented responsive logic with a cohesive, CSS-first implementation.
> 3. Ensure the final implementation strictly honors the technical and aesthetic vision of VIVIM without compromising existing data integrity or service integration.

This document lists the key files and directories that must be investigated to implement the full frontend UI redesign, as specified in the [Design Vision](./DEV_FRONTEND_DESIGN.md) and [Executive Summary](./EXECUTIVE_SUMMARY.md).

## 1. Core Configuration & Entry Points
- `pwa/package.json` - Dependencies and scripts (React 19, Tailwind 4).
- `pwa/tailwind.config.js` - Current Tailwind configuration (to be updated with new tokens).
- `pwa/vite.config.ts` - Build configuration and plugins.
- `pwa/index.html` - App shell and PWA meta tags.
- `pwa/src/main.tsx` - Application entry point.
- `pwa/src/App.tsx` - Root component with providers.

## 2. Layout & Navigation (Critical)
- `pwa/src/router/routes.tsx` - Contains the `AppLayout` wrapper and all route definitions. This is where the responsive logic is currently tangled.
- `pwa/src/components/responsive/ResponsiveLayout.tsx` - The JS-based responsive wrapper that needs to be replaced with a CSS-first approach.
- `pwa/src/components/unified/ResponsiveLayout.tsx` - An alternative responsive layout that should be consolidated.
- `pwa/src/components/layout/SideNav.tsx` - The desktop sidebar component.
- `pwa/src/components/ios/BottomNav.tsx` - The iOS-style mobile bottom navigation.
- `pwa/src/components/ios/TopBar.tsx` - The iOS-style mobile top bar.
- `pwa/src/components/BottomNav.tsx` - Generic bottom navigation (check for duplication).
- `pwa/src/components/TopBar.tsx` - Generic top bar (check for duplication).

## 3. Design Systems & Styles
- `pwa/src/index.css` - Main Tailwind entry point.
- `pwa/src/styles/unified-design-system.css` - The primary source of truth for modern CSS variables.
- `pwa/src/styles/ios-design-system.css` - iOS-specific styles (to be phased out).
- `pwa/src/styles/design-system.css` - Legacy styles (to be phased out).

## 4. Base UI Components
- `pwa/src/components/ui/` - Radix-based primitives (Button, Card, Accordion, etc.).
- `pwa/src/components/unified/` - "Unified" versions of common components (Button, Input, Card).
- `pwa/src/components/ios/` - iOS-styled components (to be replaced by platform-agnostic versions).

## 5. Core Pages (Redesign Targets)
- `pwa/src/pages/Home.tsx` - The main feed. Contains the massive inline `FeedItemCard`.
- `pwa/src/pages/Archive/Archive.tsx` - The archive hub.
- `pwa/src/pages/Archive/` - Sub-pages: `Active.tsx`, `AllChats.tsx`, `Collections.tsx`, `Imported.tsx`, `Shared.tsx`.
- `pwa/src/pages/Settings.tsx` - Application settings.
- `pwa/src/pages/Capture.tsx` - Conversation import/capture interface.
- `pwa/src/pages/Search.tsx` - Global search interface.
- `pwa/src/pages/ConversationView.tsx` - Single conversation view.

## 6. Data, Logic & State (The Brain & Nerves)
- `pwa/src/stores/` - Zustand stores for UI state (`useHomeUIStore`, `settingsStore`, `archiveStore`).
- `pwa/src/lib/auth-context.tsx` - Authentication state and logic.
- `pwa/src/lib/device-context.ts` - The JS device detection logic (to be deprecated).
- `pwa/src/contexts/VivimContext.tsx` - Global application context.
- `pwa/src/lib/api.ts` - Base Axios/Fetch client configuration.
- `pwa/src/lib/service/conversation-service.ts` - Primary CRUD interface for conversations.
- `pwa/src/lib/storage-v2/unified-repository.ts` - Dictates how data is persisted locally (IndexedDB).

## 7. Feature-Specific Logic
- `pwa/src/components/AIChat.tsx` - Dictates the entire chat interaction experience.
- `pwa/src/components/sovereignty/KnowledgeGraph.tsx` - Dictates the complex D3/Canvas visualization.

## 8. Infrastructure & Assets
- `pwa/src/lib/utils.ts` - Contains `cn` (class merging) and other core UI logic.
- `pwa/src/types/` - TypeScript interfaces dictating the data "shape."
- `pwa/public/manifest.json` - Dictates PWA behavior (icons, theme colors).
- `pwa/src/assets/` - Static visual assets (icons, images).

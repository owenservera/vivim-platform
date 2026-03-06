# Executive Summary

> **One-Shot Context for Frontend Developer**  
> **Use this document as a standalone prompt to brief a designer or developer**

---

## What is VIVIM?

**VIVIM** is a decentralized AI memory platform — think "Pocket for AI conversations" meets "Dropbox for AI knowledge."

Users can:
- **Capture** conversations from ChatGPT, Claude, Gemini, and other AI assistants
- **Search** and rediscover past conversations instantly
- **Fork** conversations to create variations
- **Share** AI insights with others
- **Own** their data with end-to-end encryption and local-first storage

The app sits at the intersection of **note-taking**, **AI tools**, and **decentralized infrastructure**.

---

## The Problem We're Solving

1. **Conversations disappear** — AI chats are ephemeral; users lose valuable insights
2. **Can't search AI history** — ChatGPT/Claude don't let you search past conversations
3. **Can't share or fork** — No way to build on others' AI work
4. **Not self-sovereign** — Your AI data lives on OpenAI's/Anthropic's servers, not yours

VIVIM solves this by being **local-first** (data lives on user's device) + **decentralized** (optional P2P sync).

---

## Target Users

| User Type | Use Case |
|-----------|----------|
| **AI Power Users** | Developers, researchers, writers who use AI daily |
| **Knowledge Workers** | Anyone who wants to build a "second brain" from AI conversations |
| **Teams** | Share useful AI conversations within an organization |
| **Privacy-Focused** | People who want AI data ownership |

---

## Core Features

### Must-Have (MVP)
1. **Conversation Feed** — List, filter, search conversations
2. **Capture** — Import from URL, manual entry, or paste
3. **View Conversation** — Full message history with markdown/code rendering
4. **Archive** — Organize conversations into collections
5. **Settings** — Theme toggle, AI provider config

### Should-Have
6. **Fork/Share** — Create variants, share via link
7. **Recommendations** — "For You" feed of relevant past conversations
8. **Context Cockpit** — Manage AI context/memory

### Nice-to-Have
9. **Knowledge Graph** — Visual relationship between conversations
10. **P2P Sync** — Decentralized backup via LibP2P
11. **Blockchain Verification** — Trust seals for conversation integrity

---

## Technical Context

### What Already Exists (Backend/Services)

- **Storage layer** — IndexedDB-based local storage with sync queue
- **API client** — REST client for backend communication  
- **Auth system** — Authentication context and guards
- **State stores** — Zustand stores for UI state
- **30+ pages** — Full routing already implemented

### What's Broken (Frontend)

- **Responsive design** — Mobile vs desktop is fundamentally broken
- **Visual design** — Multiple competing design systems, inconsistent styling
- **Component architecture** — Duplicated components, inline code in wrong places
- **Performance** — Large bundle, no code splitting, rendering issues

---

## What You Need to Build

### The Goal

Create a **new frontend shell** that:
1. Works seamlessly on mobile and desktop
2. Has a modern, consistent visual design
3. Connects to the existing services (don't rebuild backend)
4. Can be dropped in to replace the current implementation

### The Approach

**Phase 1: Foundation**
- Unified design system (TailwindCSS 4)
- Single responsive layout (CSS-first, not JS detection)
- Base UI components

**Phase 2: Key Pages**
- Home/Feed redesign
- Archive views
- Settings

**Phase 3: Features**
- Chat interface
- Capture flow
- Search

**Phase 4: Polish**
- Animations
- Loading states
- Performance

---

## Design Direction

### Aesthetic
- Clean, modern, minimal
- Inspired by linear app, Notion, Raycast
- Subtle animations, not flashy

### Responsive Behavior
- **Mobile (< 1024px):** Bottom navigation bar, full-width content
- **Desktop (≥ 1024px):** Fixed left sidebar, centered content max-width 1200px
- Fluid transitions between breakpoints

### Color Scheme
- Primary: Indigo (#6366f1)
- Accent: Violet (#8b5cf6)
- Support light/dark mode

### Typography
- Sans-serif: Inter (or similar)
- Base size: 16px
- Clear hierarchy

---

## Constraints

1. **React 19** — Don't change framework
2. **TailwindCSS 4** — Use for styling
3. **Keep existing services** — Don't rebuild backend
4. **30+ existing routes** — Must maintain all routes
5. **Local-first** — Data stays on device by default

---

## Success Criteria

- [ ] Mobile and desktop work equally well
- [ ] Consistent visual design throughout
- [ ] All existing features accessible
- [ ] Fast load times (< 3s to interactive)
- [ ] Smooth animations (60fps)
- [ ] Easy for another developer to extend

---

## File Locations

All documentation saved to:
```
C:\0-BlackBoxProject-0\vivim-app-og\vivim-app\.archive\.dev\
```

Key files:
- `SPEC.md` — Full project overview
- `UI_COMPONENT_SPEC.md` — What components exist
- `RESPONSIVE_BREAKPOINTS.md` — Layout specs
- `DESIGN_TOKENS.md` — Colors, typography, spacing
- `INTEGRATION_GUIDE.md` — How to connect to services

---

## Ready to Start?

This documentation provides everything needed to:
1. Understand the app conceptually
2. Know what features to build
3. Connect to existing backend services
4. Implement a complete, working frontend

**Next step:** Review the detailed documentation files, then begin Phase 1 (Foundation).

# Frontend Audit

## Pages / Views / Screens
- **Home (`/`)**: Main dashboard showing captured conversations (pinned, recent, archived). Uses `ConversationList`.
- **HomeAssistant (`/ai/conversation/:id`)**: Assistant-focused chat view.
- **Capture (`/capture`) & CaptureSimple (`/simple-capture`)**: Tools to input URLs from AI providers to import chat histories.
- **ConversationView (`/conversation/:id`)**: Detailed view of a captured conversation, rendering chat messages using the `ContentRenderer`.
- **Search (`/search`)**: Search interface for local and server-side conversations/ACUs.
- **AI Chat (`/chat`)**: Interact with AI using captured context. Uses `AIChat` components.
- **BYOK Chat (`/byok`)**: Chat directly with AI using user-provided API keys.
- **Context Cockpit (`/context-cockpit`)**: Visual dashboard displaying token allocations and context layers used in AI prompts.
- **Context Components (`/context-components`)**: Browse and inspect Atomic Chat Units (ACUs).
- **For You (`/for-you`)**: AI-powered recommendations feed.
- **Collections (`/collections`) & Bookmarks (`/bookmarks`)**: Organization tools to group conversations.
- **Analytics (`/analytics`)**: Dashboard showing usage metrics, CTRs, and source distributions.
- **Settings (`/settings`)**: User preferences, AI model selection, dark mode, and context recipes.
- **Account (`/account`)**: Identity management, DID display, and data export/deletion.
- **Login (`/login`)**: Google OAuth and DID-based authentication flow.
- **Share / Receive (`/share`, `/receive/:code`)**: Interfaces to create and consume shared conversation links.
- **Error Dashboard (`/errors`)**: Troubleshooting and error logs display.
- **Admin Panel (`/admin`)**: System health and network telemetry interface.

## Responsive / Mobile Behavior
- The design heavily leverages Tailwind CSS utility classes to be mobile-first.
- Works responsively across desktop, tablet, and mobile.
- Features bottom navigation (`BottomNav`) for iOS-like mobile app experiences.
- PWA is installable with full manifest support and offline caching strategies via Service Workers.
- Currently, horizontal scrolling in the stats banner on the `Home` page lacks visual indicators (e.g., hidden scrollbar making it non-obvious).

## State Management
- **Local State**: Managed with React Hooks (`useState`, `useReducer`).
- **Global State**: Managed with `Zustand` (`appStore`, `chatStore`, `memoryStore`, `userStore`, `authStore`).
- **Server State**: Managed with `@tanstack/react-query` for API fetching, caching, and invalidation.
- **Storage State**: `Dexie` is used for IndexedDB persistence, enabling the offline-first experience alongside `Yjs` for CRDT synchronization.

## Navigation / Routing Architecture
- Powered by `react-router-dom` v7.
- Employs client-side routing with protected routes wrapped by authentication guards.

## External UI Dependencies
- `@assistant-ui/react` & `@assistant-ui/react-ai-sdk` (AI Chat UIs)
- `@radix-ui/react-*` primitives (Accordion, Tooltip, Dropdown, Slot)
- `framer-motion` (Animations)
- `lucide-react` (Icons)
- `tailwindcss` (v4.1.x)
- `react-markdown`, `remark-gfm`, `rehype-katex` (Markdown & Math rendering)
- `mermaid` (Diagrams)
- `shiki` / `react-syntax-highlighter` (Code highlighting)

## Known Gaps & Inconsistencies
- **Visual Bugs**: 
  - `convo.model || convo.metadata?.model` extraction bug in `Home.tsx`.
  - Archived cards apply opacity to action buttons, breaking interaction visibility.
  - The "Continue" button in grid mode uses a hardcoded arrow (`→`) instead of a `lucide-react` icon.
- **Hardcoded Values**: Provider accent strips in `Home.css` use hardcoded hex colors instead of CSS variables.
- **Accessibility**: Missing screen reader labels for stats pills, and cards only support `Enter` key (missing `Space` key support). Missing empty state indicators for unknown dates.
- **Dark Mode**: Missing dark mode variants for provider-specific accents.
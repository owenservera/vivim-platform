# VIVIM UI Components & Design System

## Overview

This document outlines the UI components, design tokens, and patterns used in VIVIM's PWA for maintaining consistency in the cinematic landing page.

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19 | UI Framework |
| **TypeScript** | 5.9 | Type Safety |
| **TailwindCSS** | - | Styling |
| **Vite** | 7 | Build Tool |
| **Framer Motion** | - | Animations |
| **Zustand** | - | State Management |
| **TanStack Query** | - | Data Fetching |

---

## Component Structure

### Directory Layout

```
pwa/src/
├── components/
│   ├── ui/              # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Dropdown.tsx
│   │   └── ...
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   ├── features/        # Feature components
│   │   ├── archive/
│   │   ├── chat/
│   │   ├── graph/
│   │   └── ...
│   └── demo/            # Demo-specific components
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
└── styles/              # Global styles
```

---

## Design Tokens

### Colors

```typescript
// Colors from brand
const colors = {
  // Primary
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Accent (customize for VIVIM)
  accent: {
    50: '#faf5ff',
    500: '#a855f7',
    900: '#581c87',
  },
  
  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Dark mode
  dark: {
    bg: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
  }
};
```

### Typography

```typescript
const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  
  // Font sizes
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};
```

### Spacing

```typescript
const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
};
```

### Border Radius

```typescript
const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};
```

---

## Key Components

### 1. Archive View

```typescript
// Archive timeline
<ArchiveTimeline 
  conversations={conversations}
  onSelect={handleSelect}
  view="timeline" | "grid" | "canvas"
/>

// Archive filters
<ArchiveFilters 
  providers={['openai', 'anthropic', 'gemini']}
  topics={['react', 'typescript']}
  dateRange={{ start, end }}
/>
```

### 2. Knowledge Graph (Canvas)

```typescript
// Force-directed graph
<KnowledgeGraph 
  nodes={acuNodes}
  edges={relationships}
  layout="force"
  onNodeClick={handleNodeClick}
  onZoom={handleZoom}
/>

// Graph controls
<GraphControls 
  onLayoutChange={setLayout}
  onFilter={filterNodes}
  onExport={exportGraph}
/>
```

### 3. Context Cockpit

```typescript
// Context visualization
<ContextCockpit 
  layers={contextLayers}
  budget={12300}
  tokensUsed={8200}
  onLayerToggle={toggleLayer}
/>

// Token breakdown
<TokenMeter 
  layers={tokenAllocation}
  total={12300}
/>
```

### 4. Search

```typescript
// Search input
<SearchInput 
  placeholder="Search your knowledge..."
  onSearch={handleSearch}
  suggestions={suggestions}
/>

// Search results
<SearchResults 
  results={acuResults}
  highlights={highlights}
  onSelect={selectResult}
/>
```

### 5. Chat

```typescript
// Chat interface
<ChatInterface 
  messages={messages}
  onSend={sendMessage}
  context={activeContext}
/>

// Message bubble
<MessageBubble 
  role="user" | "assistant"
  content={text}
  timestamp={date}
  acuLinks={relatedAcus}
/>
```

---

## Animation Patterns

### Using Framer Motion

```typescript
import { motion, AnimatePresence } from 'framer-motion';

// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Component animation
<motion.div
  initial="initial"
  animate="animate"
  variants={pageVariants}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// List animations
<AnimatePresence>
  {items.map(item => (
    <motion.li
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    />
  ))}
</AnimatePresence>
```

### Common Patterns

| Pattern | Use Case |
|---------|----------|
| Fade in | Page loads, modals |
| Slide up | Notifications, toasts |
| Scale | Buttons, cards on hover |
| Spring | Graph nodes, drag interactions |
| Stagger | List items, search results |

---

## State Management (Zustand)

```typescript
// Archive store
interface ArchiveStore {
  conversations: Conversation[];
  view: 'timeline' | 'grid' | 'canvas';
  filters: FilterState;
  
  // Actions
  setView: (view: string) => void;
  setFilters: (filters: FilterState) => void;
  loadConversations: () => Promise<void>;
}

const useArchiveStore = create<ArchiveStore>((set) => ({
  conversations: [],
  view: 'timeline',
  filters: {},
  
  setView: (view) => set({ view }),
  setFilters: (filters) => set({ filters }),
  loadConversations: async () => {
    const data = await fetchConversations();
    set({ conversations: data });
  }
}));
```

---

## Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};

// Tailwind usage
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

---

## Icons

```typescript
// Using lucide-react or heroicons
import { 
  Search, 
  MessageSquare, 
  Share2, 
  Settings,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Zap,
  Brain,
  Globe,
  Lock
} from 'lucide-react';

// Icon sizes
<Search size={16} />  // Small
<Search size={20} />  // Default
<Search size={24} />  // Large
```

---

## Landing Page Component Mapping

| Feature | Components Needed |
|---------|-------------------|
| Hero | `HeroSection`, `CTAButton`, `ProviderGrid` |
| Archive Demo | `ArchiveTimeline`, `ConversationCard` |
| Graph | `KnowledgeGraph`, `GraphControls`, `NodeDetails` |
| Search | `SearchInput`, `SearchResults`, `SearchFilters` |
| Context | `ContextCockpit`, `TokenMeter`, `LayerCard` |
| Privacy | `SecurityBadge`, `KeyIcon`, `ExportButton` |
| Social | `CircleCard`, `ShareModal`, `MemberList` |

---

## Design System Files

| File | Purpose |
|------|---------|
| `pwa/src/styles/globals.css` | Global styles |
| `pwa/tailwind.config.js` | Tailwind configuration |
| `pwa/src/config/` | Theme configuration |

# VIVIM Frontend Documentation

> **Purpose**: Complete reference guide for building the VIVIM frontend from scratch  
> **Version**: 1.0.0  
> **Date**: February 14, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [API Integration](#4-api-integration)
5. [Data Models](#5-data-models)
6. [Design System](#6-design-system)
7. [Components](#7-components)
8. [Pages](#8-pages)
9. [State Management](#9-state-management)
10. [Authentication & Security](#10-authentication--security)
11. [Offline & Sync](#11-offline--sync)
12. [Build & Deployment](#12-build--deployment)

---

## 1. Project Overview

### 1.1 What is VIVIM?

**VIVIM** is a consumer app focused on **capturing, owning, evolving, and sharing AI conversations**. The product has four core pillars:

| Pillar | Description |
|--------|-------------|
| **Feed** | Social network for AI conversations - discovery, inspiration, social proof |
| **Vault** | Personal encrypted knowledge store - ownership, privacy, organization |
| **Capture** | Extract from any AI platform - liberation from walled gardens |
| **Chat** | Continue conversations with your own AI keys - evolve, remix, build on knowledge |

### 1.2 Tagline

**"Own Your AI"**

### 1.3 Target Users

- Developers and power users who frequently use AI chat tools
- Knowledge workers who want to preserve and organize AI conversations
- Content creators who want to share AI-generated insights
- Anyone who wants to own their AI interactions rather than being locked into platform silos

### 1.4 MVP Scope

The MVP (Minimum Viable Product) includes:

- Capture from 9 AI platforms (ChatGPT, Claude, Gemini, Grok, DeepSeek, Kimi, Qwen, z.ai, Mistral)
- Feed with For You, Following, Trending
- Vault with local-first storage and E2E encryption
- ACU System — decompose, share, and compose atomic knowledge units
- BYOK AI Chat — continue conversations with your own API keys
- Social interactions (like, save, fork, follow)
- Search with full-text and filters
- Identity with standard auth and public profiles
- Mobile PWA that installs and works offline

---

## 2. Tech Stack

### 2.1 Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.4 | UI Framework |
| **TypeScript** | ~5.9.3 | Type Safety |
| **Vite** | 7.2.5 | Build Tool |
| **TailwindCSS** | 4.1.18 | Styling |

### 2.2 State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 5.0.11 | Global state management |
| **React Query** | 5.90.20 | Server state, caching, synchronization |

### 2.3 Routing

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Router DOM** | 7.13.0 | Client-side routing |

### 2.4 Content Rendering

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Markdown** | 10.1.0 | Markdown rendering |
| **Mermaid** | 11.12.2 | Diagram rendering |
| **KaTeX** | 0.16.28 | LaTeX/Math rendering |

### 2.5 Storage & Encryption

| Technology | Version | Purpose |
|------------|---------|---------|
| **IndexedDB** (via idb) | 8.0.3 | Local-first storage |
| **TweetNaCl** | 1.0.3 | End-to-end encryption |

### 2.6 PWA & Offline

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite PWA** | 1.2.0 | Progressive Web App support |
| **Yjs** | 13.6.29 | CRDT for real-time collaboration |
| **Y-IndexedDB** | 9.0.12 | IndexedDB adapter for Yjs |
| **Y-Websocket** | 3.0.0 | WebSocket adapter for Yjs |

### 2.7 Real-time Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Socket.io Client** | 4.8.3 | WebSocket communication |

### 2.8 Icons & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Lucide React** | 0.563.0 | Icon library |
| **Feather Icons** | 4.29.2 | Legacy icons |
| **clsx** | 2.1.1 | Conditional class names |
| **tailwind-merge** | 3.4.0 | Tailwind class merging |

### 2.9 Build & Development

| Technology | Version | Purpose |
|------------|---------|---------|
| **Bun** | >=1.0.0 | JavaScript runtime and package manager |
| **ESLint** | 9.39.1 | Linting |
| **Vitest** | 4.0.18 | Testing |
| **PostCSS** | 8.5.6 | CSS processing |

---

## 3. Architecture

### 3.1 Project Structure

```
vivim-app/
├── pwa/                          # Frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── lib/                 # Utilities and services
│   │   │   ├── identity/        # Identity and authentication
│   │   │   ├── storage-v2/      # Local storage with encryption
│   │   │   └── content-renderer/ # Content rendering utilities
│   │   ├── types/               # TypeScript type definitions
│   │   ├── styles/              # CSS files
│   │   ├── config/              # Configuration files
│   │   ├── hooks/               # Custom React hooks
│   │   ├── assets/              # Static assets
│   │   ├── App.tsx              # Main application component
│   │   └── main.tsx             # Application entry point
│   ├── public/                  # Public static assets
│   ├── package.json
│   ├── vite.config.ts           # Vite configuration
│   └── tsconfig.json            # TypeScript configuration
│
├── server/                       # Backend API server
│   ├── src/
│   │   ├── routes/              # API route handlers
│   │   ├── services/            # Business logic
│   │   ├── repositories/        # Data access
│   │   ├── types/               # TypeScript types
│   │   ├── validators/          # Request validation
│   │   └── utils/               # Utilities
│   └── package.json
│
├── network/                      # P2P Network Engine
│   ├── src/
│   └── package.json
│
└── VIVIM.docs/                  # Documentation
    └── FRONTEND/                # This documentation
```

### 3.2 Frontend Architecture Pattern

The frontend follows a **feature-based architecture** with the following principles:

1. **Pages** (`/pages`) - Route-level components that define full-page layouts
2. **Components** (`/components`) - Reusable UI building blocks
3. **Lib/Services** (`/lib`) - Business logic, API calls, and utilities
4. **Hooks** (`/hooks`) - Custom React hooks for shared logic
5. **Types** (`/types`) - TypeScript interfaces and types
6. **Store** - Zustand stores for global state

### 3.3 Rendering Strategy

- **SSR**: Not used - fully client-side rendered (CSR)
- **PWA**: Service workers for offline capability
- **Code Splitting**: Automatic via Vite

---

## 4. API Integration

### 4.1 API Architecture

The frontend communicates with the backend via RESTful APIs:

```
/api/v1/
├── /auth/           # Authentication endpoints
├── /identity/       # User identity management
├── /conversations/ # Conversation CRUD
├── /messages/       # Message operations
├── /acus/           # Atomic Chat Units
├── /capture/        # Content extraction
├── /feed/           # Social feed
├── /circles/        # Sharing circles
├── /ai/             # AI chat integration
├── /context/        # Context engine
└── /sync/           # Data synchronization
```

### 4.2 Core API Service

The main API communication is handled through `lib/core-api.ts`:

```typescript
// Key API functions to implement:
- getConversations(filters: ConversationFilters): Promise<Conversation[]>
- getConversation(id: string): Promise<Conversation>
- createConversation(data: CreateConversationInput): Promise<Conversation>
- updateConversation(id: string, data: UpdateConversationInput): Promise<Conversation>
- deleteConversation(id: string): Promise<void>

- getMessages(conversationId: string): Promise<Message[]>
- createMessage(conversationId: string, data: CreateMessageInput): Promise<Message>

- captureUrl(url: string): Promise<CaptureResult>
- getCaptureStatus(id: string): Promise<CaptureStatus>

- getFeed(type: 'for-you' | 'following' | 'trending'): Promise<FeedItem[]>
- likeItem(id: string, type: 'conversation' | 'acu'): Promise<void>
- saveItem(id: string, type: 'conversation' | 'acu'): Promise<void>
- forkItem(id: string, type: 'conversation' | 'acu'): Promise<ForkResult>

- getAcu(id: string): Promise<AtomicChatUnit>
- searchAcu(query: string, filters?: AcuFilters): Promise<AtomicChatUnit[]>

- getUserProfile(userId: string): Promise<UserProfile>
- updateUserProfile(data: UpdateProfileInput): Promise<UserProfile>

- getCollections(): Promise<Collection[]>
- createCollection(data: CreateCollectionInput): Promise<Collection>

- getSettings(): Promise<UserSettings>
- updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>
```

### 4.3 API Configuration

Located in `config/api-config.ts`:

```typescript
interface APIConfig {
  baseURL: string;           // API server base URL
  timeout: number;           // Request timeout in ms
  retries: number;           // Number of retries on failure
  endpoints: {
    // Define all API endpoint paths
  };
}
```

### 4.4 Data Fetching Strategy

Use **React Query** (`@tanstack/react-query`) for:

- Server state management
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling and retry logic

Example usage pattern:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['conversations', filters],
  queryFn: () => coreApi.getConversations(filters),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => coreApi.createConversation(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  },
});
```

---

## 5. Data Models

### 5.1 Conversation

```typescript
interface Conversation {
  id: string;                    // UUID
  provider: string;              // AI provider (e.g., 'chatgpt', 'claude')
  sourceUrl: string;             // Original source URL
  title: string;                 // Conversation title
  model?: string;                // AI model used
  createdAt: Date;               // Original creation date
  updatedAt: Date;               // Last update date
  capturedAt: Date;              // When captured to VIVIM
  
  messageCount: number;
  userMessageCount: number;
  aiMessageCount: number;
  totalWords: number;
  totalCharacters: number;
  totalTokens?: number;
  totalCodeBlocks: number;
  totalImages: number;
  totalTables: number;
  totalLatexBlocks: number;
  totalMermaidDiagrams: number;
  totalToolCalls: number;
  
  messages: Message[];           // Related messages
  acus: AtomicChatUnit[];        // Atomic units
  metadata: Record<string, any>; // Additional metadata
  ownerId?: string;             // Owner user ID (if private)
}
```

### 5.2 Message

```typescript
interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  author?: string;
  parts: ContentPart[];          // Rich content parts
  createdAt: Date;
  messageIndex: number;
  status: 'completed' | 'streaming' | 'error';
  finishReason?: string;
  tokenCount?: number;
  metadata: Record<string, any>;
}
```

### 5.3 ContentPart

```typescript
type ContentPart = 
  | TextPart
  | CodePart
  | ImagePart
  | LatexPart
  | TablePart
  | MermaidPart
  | ToolCallPart
  | ToolResultPart
  | LinkPart
  | AudioPart
  | VideoPart
  | FilePart
  | HtmlPart
  | QuotePart;

interface BasePart {
  id: string;
  type: string;
}

interface TextPart extends BasePart {
  type: 'text';
  content: string;
  metadata?: {
    format?: 'markdown' | 'plain';
  };
}

interface CodePart extends BasePart {
  type: 'code';
  content: string;
  language?: string;
  metadata?: {
    filename?: string;
    language?: string;
  };
}

interface ImagePart extends BasePart {
  type: 'image';
  content: string;              // URL or base64
  metadata?: {
    alt?: string;
    caption?: string;
  };
}

interface LatexPart extends BasePart {
  type: 'latex' | 'math';
  content: string;               // LaTeX formula
  metadata?: {
    display?: 'inline' | 'block';
  };
}

interface TablePart extends BasePart {
  type: 'table';
  content: {
    headers: string[];
    rows: string[][];
  };
}

interface MermaidPart extends BasePart {
  type: 'mermaid';
  content: string;               // Mermaid diagram definition
}
```

### 5.4 AtomicChatUnit (ACU)

```typescript
interface AtomicChatUnit {
  id: string;
  authorDid: string;             // Decentralized ID
  signature: Uint8Array;         // Cryptographic signature
  content: string;               // Unit content
  language?: string;             // Programming language (if code)
  type: 'question' | 'answer' | 'code' | 'explanation' | 'summary' | 'instruction';
  category: string;
  embedding: number[];           // Vector embedding
  embeddingModel?: string;
  
  conversationId: string;
  messageId: string;
  messageIndex: number;
  provider: string;
  model?: string;
  sourceTimestamp: Date;
  
  // Quality metrics
  qualityOverall?: number;
  contentRichness?: number;
  structuralIntegrity?: number;
  uniqueness?: number;
  
  // Engagement metrics
  viewCount: number;
  shareCount: number;
  quoteCount: number;
  rediscoveryScore?: number;
  
  // Sharing
  sharingPolicy: 'self' | 'public' | 'circle' | 'unlisted';
  sharingCircles: string[];
  canView: boolean;
  canAnnotate: boolean;
  canRemix: boolean;
  canReshare: boolean;
  expiresAt?: Date;
  
  createdAt: Date;
  indexedAt: Date;
  metadata: Record<string, any>;
}
```

### 5.5 User

```typescript
interface User {
  id: string;
  did: string;                   // Decentralized Identifier
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  publicKey: string;
  encryptedPrivateKey?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
  settings: UserSettings;
}
```

### 5.6 UserSettings

```typescript
interface UserSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  
  // Privacy
  encryptionEnabled: boolean;
  localOnlyMode: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  // AI
  defaultProvider: string;
  defaultModel: string;
  
  // Sync
  syncEnabled: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
}
```

### 5.7 FeedItem

```typescript
interface FeedItem {
  id: string;
  type: 'conversation' | 'acu';
  conversationId?: string;
  acuId?: string;
  author: User;
  content: string;
  preview: string;
  provider?: string;
  createdAt: Date;
  
  // Metrics
  viewCount: number;
  likeCount: number;
  forkCount: number;
  commentCount: number;
  
  // User interactions
  isLiked: boolean;
  isSaved: boolean;
  isForked: boolean;
}
```

### 5.8 Collection

```typescript
interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  items: CollectionItem[];
}

interface CollectionItem {
  id: string;
  type: 'conversation' | 'acu';
  itemId: string;
  addedAt: Date;
}
```

---

## 6. Design System

### 6.1 Design Principles

1. **Minimal & Focused**: Clean interfaces that prioritize content
2. **Dark-First**: Optimized for dark mode by default (developer audience)
3. **Responsive**: Works seamlessly on mobile, tablet, and desktop
4. **Accessible**: WCAG 2.1 AA compliant
5. **Native Feel**: PWA with native-like interactions (gestures, haptics)

### 6.2 Color Palette

#### Dark Theme (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0a0a0f` | Main background |
| `--bg-secondary` | `#13131a` | Card backgrounds |
| `--bg-tertiary` | `#1c1c26` | Elevated surfaces |
| `--bg-hover` | `#252532` | Hover states |
| `--border` | `#2a2a3a` | Borders |
| `--border-active` | `#3d3d52` | Active borders |

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#f0f0f5` | Primary text |
| `--text-secondary` | `#a0a0b0` | Secondary text |
| `--text-tertiary` | `#606070` | Muted text |
| `--text-inverse` | `#0a0a0f` | Text on light backgrounds |

#### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary-500` | `#6366f1` | Primary actions |
| `--primary-600` | `#4f46e5` | Primary hover |
| `--primary-700` | `#4338ca` | Primary active |
| `--success-500` | `#22c55e` | Success states |
| `--warning-500` | `#f59e0b` | Warning states |
| `--error-500` | `#ef4444` | Error states |
| `--info-500` | `#3b82f6` | Info states |

### 6.3 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | System | 32px | 700 |
| H2 | System | 24px | 700 |
| H3 | System | 20px | 600 |
| Body | System | 16px | 400 |
| Small | System | 14px | 400 |
| Caption | System | 12px | 400 |
| Code | Monospace | 14px | 400 |

Font family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`  
Monospace: `"SF Mono", Monaco, "Cascadia Code", Consolas, monospace`

### 6.4 Spacing System

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |

### 6.5 Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-2xl` | 24px |
| `--radius-full` | 9999px |

### 6.6 Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.4)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.5)` |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.6)` |
| `--shadow-primary` | `0 0 20px rgba(99,102,241,0.3)` |

### 6.7 Layout

- **Max Content Width**: 1200px
- **Sidebar Width**: 280px
- **Mobile Breakpoint**: 640px
- **Tablet Breakpoint**: 768px
- **Desktop Breakpoint**: 1024px
- **Wide Breakpoint**: 1280px

---

## 7. Components

### 7.1 Core Components

#### Button

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type ButtonState = 'default' | 'hover' | 'active' | 'disabled' | 'loading';

// Usage
<Button variant="primary" size="md">Label</Button>
<Button variant="secondary" size="lg">Label</Button>
<Button variant="ghost" size="sm">Label</Button>
<Button variant="destructive">Delete</Button>
<Button isLoading>Loading...</Button>
```

#### Input

```typescript
type InputVariant = 'default' | 'error' | 'disabled';
type InputType = 'text' | 'email' | 'password' | 'search' | 'url';

// Usage
<Input type="text" placeholder="Enter text" />
<Input type="search" placeholder="Search..." />
<Input type="url" placeholder="https://..." />
<Input error="Invalid input" />
```

#### Card

```typescript
type CardVariant = 'default' | 'interactive' | 'media' | 'stats';

// Usage
<Card>Default content</Card>
<Card variant="interactive" onClick={handler}>Clickable</Card>
<Card variant="media" imageSrc="..." title="...">Content</Card>
<Card variant="stats" icon={...} value={123} change="+12%">Metric</Card>
```

#### Modal

```typescript
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

// Usage
<Modal isOpen={true} onClose={handler} title="Title">
  Content
</Modal>
<Modal size="fullscreen" isOpen={true} onClose={handler}>Full screen</Modal>
```

#### Avatar

```typescript
type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
type AvatarVariant = 'image' | 'initial' | 'group';

// Usage
<Avatar src="url" size="md" />
<Avatar name="John Doe" size="md" />
<AvatarGroup users={[{name: 'A'}, {name: 'B'}]} max={3} />
```

#### Badge

```typescript
type BadgeVariant = 'status' | 'count' | 'tag';

// Usage
<Badge variant="status" color="success">Active</Badge>
<Badge variant="count">3</Badge>
<Badge variant="tag">#tagname</Badge>
```

### 7.2 Navigation Components

#### TopBar

```typescript
interface TopBarProps {
  // Left section
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  
  // Center section
  logo?: boolean;
  
  // Right section
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'syncing';
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  avatar?: UserAvatar;
  onAvatarClick?: () => void;
}

// Usage
<TopBar 
  title="VIVIM" 
  showStatus 
  status="online"
  showNotifications 
  notificationCount={3}
  avatar={{ name: 'John' }}
/>
```

#### BottomNav

```typescript
interface BottomNavItem {
  icon: ReactNode;
  label: string;
  path: string;
  badge?: number;
}

interface BottomNavProps {
  items: BottomNavItem[];
  activePath: string;
  onNavigate: (path: string) => void;
  // Special items
  captureButton?: {
    onClick: () => void;
    isActive?: boolean;
  };
}

// Default navigation items
const defaultNavItems = [
  { icon: HomeIcon, label: 'Home', path: '/' },
  { icon: SearchIcon, label: 'Search', path: '/search' },
  // Capture is handled as floating action button
  { icon: MessageSquareIcon, label: 'AI', path: '/ai-chat' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];
```

### 7.3 Content Components

#### ContentRenderer

The main component for rendering rich content with multiple part types:

```typescript
interface ContentRendererProps {
  content: string | ContentBlock[] | ContentPart[];
  className?: string;
  showMetadata?: boolean;
  maxImageWidth?: number;
  enableCopy?: boolean;
}

// Usage
<ContentRenderer content={message.parts} />
<ContentRenderer content="Markdown content here" />
```

**Supported Content Types:**
- `text` - Markdown rendered text
- `code` - Syntax highlighted code blocks
- `image` - Images with zoom capability
- `latex` / `math` - LaTeX formulas via KaTeX
- `table` - Data tables
- `mermaid` - Diagrams via Mermaid
- `tool_call` - AI tool invocations
- `tool_result` - Tool execution results
- `link` - Hyperlinks with previews
- `audio` - Audio playback
- `video` - Video playback
- `file` - File downloads
- `html` - Raw HTML
- `quote` - Blockquotes

#### ConversationCard

```typescript
interface ConversationCardProps {
  conversation: Conversation;
  onPress?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onMenu?: () => void;
  showProvider?: boolean;
  showTime?: boolean;
  showMetrics?: boolean;
}

// Usage
<ConversationCard 
  conversation={conversation}
  onPress={() => navigate(`/conversation/${id}`)}
/>
```

### 7.4 Form Components

#### SearchInput

```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  suggestions?: string[];
  isLoading?: boolean;
}
```

#### CaptureInput

```typescript
interface CaptureInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isProcessing?: boolean;
  progress?: number;
  status?: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
}
```

#### ChatInput

```typescript
interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isStreaming?: boolean;
  showModelSelector?: boolean;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  onVoiceInput?: () => void;
  onAttachment?: () => void;
}
```

### 7.5 Feedback Components

#### Toast

```typescript
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Usage via hook
const toast = useToast();
toast.success('Saved successfully');
toast.error('Failed to save');
toast.warning('Warning message');
toast.info('Info message');
```

#### Skeleton

```typescript
interface SkeletonProps {
  variant?: 'text' | 'card' | 'list' | 'avatar';
  width?: string | number;
  height?: string | number;
  count?: number;
}
```

#### Progress

```typescript
interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'linear' | 'circular';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

### 7.6 State Components

#### LoadingSpinner

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
}
```

#### EmptyState

```typescript
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

#### ErrorBoundary

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

---

## 8. Pages

### 8.1 Home Page (`/`)

**Purpose**: Main dashboard showing recent conversations and activity

**Features**:
- Pull-to-refresh
- Filter tabs: Recent, Bookmarked, Shared, Trending
- Conversation cards list with infinite scroll
- Skeleton loading states
- FAB for quick capture

**Components**:
- `TopBar` with logo and notifications
- `FilterChips` (Recent, Bookmarked, Shared, Trending)
- `ConversationCard` list
- `InfiniteScroll` loader
- `FAB` (Floating Action Button) for capture

### 8.2 Search Page (`/search`)

**Purpose**: Find conversations and ACUs across vault and feed

**Features**:
- Real-time search suggestions
- Search history
- Filters: All, Provider, Date, Type
- Highlighted search terms in results
- Voice search (mobile)

**Components**:
- `SearchInput` with suggestions
- `FilterChips`
- `SearchResult` list
- `EmptyState` for no results

### 8.3 Capture Page (`/capture`)

**Purpose**: Extract conversations from AI platforms

**States**:
1. **Idle**: URL input field
2. **Processing**: Progress indicator with console output
3. **Success**: Confirmation with actions
4. **Error**: Error message with retry option

**Features**:
- Auto-detect AI provider from URL
- Preview before capture
- Queue multiple captures
- Processing logs

**Components**:
- `CaptureInput` with URL validation
- `ProgressIndicator` (circular)
- `ConsoleLog` for processing details
- `SuccessAnimation` (confetti)
- Action buttons: View, Share, Capture More

### 8.4 Conversation View (`/conversation/:id`)

**Purpose**: Display full conversation with all messages

**Features**:
- Full message thread with expand/collapse
- ACU graph visualization
- Metadata panel
- Related conversations
- Quick actions (bookmark, share, fork)
- Export options

**Components**:
- `MessageList` with `ContentRenderer`
- `ACUGraph` for knowledge visualization
- `MetadataPanel`
- `ActionBar` (bookmark, share, fork, more)

### 8.5 AI Chat Page (`/ai-chat`)

**Purpose**: Continue or start new conversations with AI

**Features**:
- Streaming response animation
- Markdown rendering
- Code syntax highlighting
- Message reactions (thumbs up, copy, regenerate)
- Model selector dropdown
- Voice input button
- Auto-scroll to bottom

**Components**:
- `ChatMessageList`
- `ContentRenderer` for messages
- `ChatInput` with actions
- `ModelSelector`
- `StreamingIndicator`

### 8.6 Settings Page (`/settings`)

**Purpose**: User configuration and preferences

**Sections**:
- Profile (avatar, name, email)
- AI Providers (add/manage API keys)
- Privacy (encryption, device identity)
- Appearance (theme, font size)
- Data & Storage (usage, export, clear)
- About (version, help, privacy)

**Components**:
- `SettingsGroup` with `SettingsItem`
- `ToggleSwitch`
- `AvatarEditor`
- `ApiKeyManager`
- `StorageStats`

### 8.7 Feed Pages

#### For You (`/feed/for-you`)
- Personalized algorithm-driven feed

#### Following (`/feed/following`)
- Content from followed users

#### Trending (`/feed/trending`)
- Popular conversations

### 8.8 Collections Page (`/collections`)

**Purpose**: Organize saved conversations

**Features**:
- Grid/list view toggle
- Create/edit collections
- Drag-and-drop organization
- Sort and filter

### 8.9 Bookmarks Page (`/bookmarks`)

**Purpose**: Quick access to saved items

**Features**:
- Chronological list
- Quick unbookmark
- Move to collection

### 8.10 Analytics Page (`/analytics`)

**Purpose**: View usage statistics

**Features**:
- Total conversations
- Messages captured
- Storage used
- Charts over time
- Top providers

### 8.11 Profile Page (`/profile/:id`)

**Purpose**: View user profiles and public content

**Features**:
- User info (avatar, name, bio)
- Public conversations
- Shared ACUs
- Follow/unfollow

### 8.12 Login/Register Pages (`/login`, `/register`)

**Purpose**: Authentication

**Features**:
- Email/password
- Social login (Google, Apple, GitHub)
- Magic link option
- DID-based authentication

---

## 9. State Management

### 9.1 Global State (Zustand)

Create stores for different domains:

```typescript
// Example: conversation store
interface ConversationStore {
  // State
  conversations: Conversation[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchConversations: (filters?: Filters) => Promise<void>;
  selectConversation: (id: string) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, data: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
}

// Create store
const useConversationStore = create<ConversationStore>((set, get) => ({
  // ... implementation
}));
```

### 9.2 Server State (React Query)

Use React Query for server state:

```typescript
// Query keys
const queryKeys = {
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (convId: string) => ['messages', convId] as const,
  feed: (type: string) => ['feed', type] as const,
  user: (id: string) => ['user', id] as const,
  settings: ['settings'] as const,
};
```

### 9.3 UI State

Local state with `useState` and `useReducer` for:

- Modal visibility
- Form inputs
- UI toggles
- Temporary feedback

### 9.4 Derived State

Use selectors for derived state:

```typescript
// Selector pattern
const useFilteredConversations = () => {
  const conversations = useConversationStore(state => state.conversations);
  const filter = useUIStore(state => state.filter);
  
  return useMemo(() => {
    return conversations.filter(conv => {
      // filter logic
    });
  }, [conversations, filter]);
};
```

---

## 10. Authentication & Security

### 10.1 Authentication Flow

1. **Initial Load**: Check for stored credentials
2. **If Authenticated**: Load user data and sync
3. **If Not Authenticated**: Redirect to login
4. **On Login Success**: Store credentials, redirect to home

### 10.2 Credential Storage

- **Session**: JWT in memory (not stored in localStorage for security)
- **Refresh Token**: HttpOnly cookie (server-side)
- **Device Keys**: Encrypted in IndexedDB

### 10.3 Encryption

All sensitive data is encrypted client-side using **TweetNaCl**:

```typescript
// Encryption utilities (see lib/storage-v2/secure-crypto.ts)
- generateKeyPair(): { publicKey, secretKey }
- encrypt(data: string, key: Uint8Array): EncryptedData
- decrypt(encrypted: EncryptedData, key: Uint8Array): string
- sign(message: string, secretKey: Uint8Array): Signature
- verify(message: string, signature: Signature, publicKey: Uint8Array): boolean
```

### 10.4 Key Management

- **Master Key**: Derived from user password via KDF
- **Device Keys**: Per-device encryption keys
- **API Keys**: Encrypted with master key, never sent to server

### 10.5 Security Best Practices

1. Never store sensitive data in localStorage
2. Use HTTPS only
3. Implement CSRF protection
4. Sanitize all user inputs
5. Use Content Security Policy (CSP)
6. Implement rate limiting

---

## 11. Offline & Sync

### 11.1 Local-First Architecture

- All data stored locally in IndexedDB first
- Background sync when online
- Conflict resolution for concurrent edits

### 11.2 IndexedDB Schema

```typescript
// Object stores (see lib/storage-v2/storage.ts)
- conversations: { key: id, indexes: [provider, capturedAt] }
- messages: { key: id, indexes: [conversationId, createdAt] }
- acus: { key: id, indexes: [conversationId, type, createdAt] }
- users: { key: id }
- settings: { key: 'user' }
- syncQueue: { key: id, indexes: [type, status] }
```

### 11.3 Sync Strategy

1. **On Change**: Queue operation in sync queue
2. **When Online**: Process queue in order
3. **On Conflict**: Use CRDT (Yjs) for mergeable data, last-write-wins for others
4. **On Failure**: Retry with exponential backoff

### 11.4 PWA Features

- Service Worker for caching
- Offline page fallback
- Background sync for data
- Push notifications (optional)

---

## 12. Build & Deployment

### 12.1 Build Commands

```bash
# Development
bun run dev              # Start dev server
bun run dev:vite         # Start Vite dev server

# Build
bun run build            # Production build
bun run build:tsc        # TypeScript compilation only
bun run build:vite       # Vite build

# Linting
bun run lint             # Run ESLint
bun run lint:fix         # Fix ESLint issues

# Testing
bun run test             # Run tests
bun run test:ui          # Run tests with UI
bun run test:coverage    # Run tests with coverage

# Type checking
bun run typecheck        # TypeScript type check
```

### 12.2 Environment Variables

```bash
# .env.example
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001
VITE_PWA_ENABLED=true
VITE_ANALYTICS_ID=
```

### 12.3 Vite Configuration

Key configurations in `vite.config.ts`:

- PWA settings with offline support
- Environment variable handling
- Code splitting
- Build optimization

### 12.4 PWA Manifest

The app should generate a `manifest.json` with:

```json
{
  "name": "VIVIM - Own Your AI",
  "short_name": "VIVIM",
  "description": "Capture, own, evolve, and share AI conversations",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 12.5 Deployment Targets

- **Static Hosting**: Netlify, Vercel, Cloudflare Pages
- **PWA**: Service worker for offline capability
- **CDN**: Cloudflare for global distribution

---

## Appendix A: Key Files Reference

### A.1 API Files

| File | Purpose |
|------|---------|
| `lib/core-api.ts` | Main API client |
| `lib/feed-api.ts` | Feed-related API calls |
| `lib/omni-api.ts` | Omni-service API |
| `lib/user-feed-service.ts` | User feed operations |

### A.2 Storage Files

| File | Purpose |
|------|---------|
| `lib/storage.ts` | Legacy storage |
| `lib/storage-v2/storage.ts` | IndexedDB wrapper |
| `lib/storage-v2/secure-crypto.ts` | Encryption utilities |
| `lib/storage-v2/secure-storage.ts` | Secure storage layer |

### A.3 Identity Files

| File | Purpose |
|------|---------|
| `lib/identity/index.ts` | Identity management |
| `lib/identity/device-manager.ts` | Device key management |
| `lib/identity/identity-service.ts` | Identity operations |

### A.4 Type Files

| File | Purpose |
|------|---------|
| `types/conversation.ts` | Conversation types |
| `types/acu.ts` | ACU types |
| `types/ai.ts` | AI-related types |
| `types/ai-chat.ts` | Chat types |
| `types/index.ts` | All type exports |

---

## Appendix B: External Dependencies

### B.1 Icons

- **Lucide React** (primary): Modern, consistent icon set
- **Feather Icons** (legacy): Some existing usage

### B.2 Rich Content

- **React Markdown**: Markdown rendering
- **Mermaid**: Diagram rendering
- **KaTeX**: LaTeX math rendering
- **qrcode.react**: QR code generation

### B.3 State & Sync

- **Zustand**: Lightweight state management
- **React Query**: Server state caching
- **Yjs**: CRDT for real-time collaboration

### B.4 Utilities

- **clsx**: Conditional class names
- **tailwind-merge**: Tailwind class merging

---

## Appendix C: Implementation Checklist

### C.1 Phase 1: Core Infrastructure

- [ ] Set up project structure
- [ ] Configure TailwindCSS
- [ ] Implement design system tokens
- [ ] Create base components (Button, Input, Card, etc.)
- [ ] Set up routing
- [ ] Implement Zustand stores

### C.2 Phase 2: Data Layer

- [ ] Implement IndexedDB storage
- [ ] Create API client
- [ ] Set up React Query
- [ ] Implement authentication flow

### C.3 Phase 3: Pages & Features

- [ ] Build Home page
- [ ] Build Search page
- [ ] Build Capture page
- [ ] Build Conversation View
- [ ] Build AI Chat page
- [ ] Build Settings page

### C.4 Phase 4: Polish

- [ ] Implement PWA features
- [ ] Add offline support
- [ ] Add animations
- [ ] Optimize performance
- [ ] Add tests

---

**Document Version**: 1.0.0  
**Last Updated**: February 14, 2026  
**Next Review**: Before frontend rebuild begins

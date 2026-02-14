# Frontend Component Library Specification

> **Purpose**: Detailed component specifications for VIVIM frontend rebuild  
> **Related**: FRONTEND.md

---

## Table of Contents

1. [Button](#1-button)
2. [Input Components](#2-input-components)
3. [Navigation](#3-navigation)
4. [Cards](#4-cards)
5. [Modals & Overlays](#5-modals--overlays)
6. [Content Display](#6-content-display)
7. [Feedback](#7-feedback)
8. [Data Display](#8-data 1. Button-display)

---

##

### Variants

| Variant | Background | Border | Use Case |
|---------|------------|--------|----------|
| `primary` | `#6366f1` | none | Main actions |
| `secondary` | transparent | `#374151` | Secondary actions |
| `ghost` | transparent | none | Tertiary actions |
| `destructive` | `#ef4444` | none | Delete/danger |
| `link` | transparent | none | Text links |

### Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 32px | 8px 16px | 14px |
| `md` | 40px | 12px 20px | 14px |
| `lg` | 48px | 16px 24px | 16px |
| `xl` | 56px | 20px 32px | 18px |

### States

- **Default**: Base variant styles
- **Hover**: Darken 10%, add shadow
- **Active**: Darken 20%, scale(0.98)
- **Disabled**: Opacity 0.5, cursor not-allowed
- **Loading**: Spinner icon, disabled interaction

### API

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
}
```

---

## 2. Input Components

### 2.1 TextInput

```typescript
interface TextInputProps {
  type?: 'text' | 'email' | 'password' | 'url' | 'search';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}
```

**Styling**:
- Height: 44px
- Border radius: 12px
- Border: 1px solid `#374151`
- Focus: Border `#6366f1`, ring `rgba(99,102,241,0.2)`

### 2.2 SearchInput

```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  suggestions?: string[];
  isLoading?: boolean;
  recentSearches?: string[];
  onClear?: () => void;
}
```

**Features**:
- Pill-shaped (border-radius: 9999px)
- Search icon on left
- Clear button on right (appears when has value)
- Dropdown for suggestions/recent searches

### 2.3 CaptureInput

```typescript
interface CaptureInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onCapture: () => void;
  isProcessing?: boolean;
  progress?: number;
  status?: 'idle' | 'validating' | 'processing' | 'success' | 'error';
  error?: string;
  logs?: string[];
}
```

### 2.4 ChatInput

```typescript
interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isStreaming?: boolean;
  isDisabled?: boolean;
  maxLength?: number;
  showModelSelector?: boolean;
  selectedModel?: string;
  models?: Array<{ id: string; name: string }>;
  onModelChange?: (modelId: string) => void;
  onAttach?: () => void;
  onVoice?: () => void;
}
```

### 2.5 Toggle

```typescript
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  isDisabled?: boolean;
}
```

**Styling**:
- Track: 44px × 24px
- Thumb: 20px circle
- Animation: 200ms ease

---

## 3. Navigation

### 3.1 TopBar

```typescript
interface TopBarProps {
  // Navigation
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  titleAlign?: 'left' | 'center';
  
  // Branding
  showLogo?: boolean;
  
  // Status
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'syncing';
  
  // Right section
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  rightContent?: ReactNode;
  
  // User
  avatar?: {
    src?: string;
    name?: string;
    onClick?: () => void;
  };
}
```

### 3.2 BottomNav

```typescript
interface BottomNavProps {
  items: Array<{
    icon: ReactNode;
    label: string;
    path: string;
    badge?: number;
  }>;
  activePath: string;
  onNavigate: (path: string) => void;
  
  // Capture FAB
  captureButton?: {
    onClick: () => void;
    isActive?: boolean;
  };
}
```

**Default Items**:
1. Home (`/`)
2. Search (`/search`)
3. Capture (FAB)
4. AI Chat (`/ai-chat`)
5. Settings (`/settings`)

### 3.3 TabBar (Horizontal)

```typescript
interface TabBarProps {
  tabs: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'chips';
}
```

---

## 4. Cards

### 4.1 ConversationCard

```typescript
interface ConversationCardProps {
  conversation: {
    id: string;
    title: string;
    provider: string;
    capturedAt: Date;
    preview?: string;
    messageCount?: number;
    totalWords?: number;
    qualityScore?: number;
  };
  
  // Display options
  showProvider?: boolean;
  showTime?: boolean;
  showMetrics?: boolean;
  showPreview?: boolean;
  layout?: 'compact' | 'default' | 'expanded';
  
  // Interactions
  onPress?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onMenu?: () => void;
  
  // States
  isBookmarked?: boolean;
  isLiked?: boolean;
}
```

### 4.2 FeedItemCard

```typescript
interface FeedItemCardProps {
  item: FeedItem;
  onPress?: () => void;
  onLike?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onFork?: () => void;
  onComment?: () => void;
  onFollow?: () => void;
}
```

### 4.3 UserCard

```typescript
interface UserCardProps {
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    followerCount?: number;
    followingCount?: number;
  };
  onPress?: () => void;
  onFollow?: () => void;
  isFollowing?: boolean;
  variant?: 'default' | 'compact';
}
```

---

## 5. Modals & Overlays

### 5.1 Modal

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}
```

**Sizes**:
- `sm`: 400px
- `md`: 500px
- `lg`: 640px
- `xl`: 800px
- `fullscreen`: 100vw × 100vh

### 5.2 BottomSheet

```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: number[]; // Percentage values
  initialSnapIndex?: number;
  enablePanDownToClose?: boolean;
  children: ReactNode;
}
```

### 5.3 Drawer

```typescript
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  placement?: 'left' | 'right';
  width?: number | string;
  children: ReactNode;
}
```

### 5.4 Popover

```typescript
interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

### 5.5 ContextMenu

```typescript
interface ContextMenuProps {
  trigger: ReactNode;
  items: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    isDisabled?: boolean;
    isDestructive?: boolean;
    divider?: boolean;
  }>;
}
```

---

## 6. Content Display

### 6.1 ContentRenderer

See main FRONTEND.md for full specification.

### 6.2 MessageBubble

```typescript
interface MessageBubbleProps {
  message: Message;
  showAuthor?: boolean;
  showTimestamp?: boolean;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
}
```

### 6.3 CodeBlock

```typescript
interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  isTruncated?: boolean;
  onCopy?: () => void;
}
```

### 6.4 MarkdownRenderer

```typescript
interface MarkdownRendererProps {
  content: string;
  components?: Record<string, React.ComponentType<any>>;
  className?: string;
}
```

---

## 7. Feedback

### 7.1 Toast

```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // ms
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast API
interface ToastAPI {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  custom: (toast: Toast) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}
```

### 7.2 Progress

```typescript
// Linear
interface LinearProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  isIndeterminate?: boolean;
}

// Circular
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}
```

### 7.3 Skeleton

```typescript
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}
```

### 7.4 EmptyState

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

### 7.5 ErrorState

```typescript
interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

## 8. Data Display

### 8.1 Avatar

```typescript
interface AvatarProps {
  src?: string;
  name?: string; // For initials fallback
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  isVerified?: boolean;
}

interface AvatarGroupProps {
  users: Array<{ src?: string; name?: string }>;
  max?: number;
  size?: AvatarProps['size'];
}
```

### 8.2 Badge

```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: ReactNode;
}

interface CountBadgeProps {
  count: number;
  max?: number;
  size?: 'sm' | 'md';
}
```

### 8.3 Chip/Tag

```typescript
interface ChipProps {
  label: string;
  variant?: 'default' | 'outlined' | 'filled';
  color?: string;
  onDelete?: () => void;
  onClick?: () => void;
}
```

### 8.4 List

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  loadMore?: () => void;
  hasMore?: boolean;
  ListEmptyComponent?: ReactNode;
  ListHeaderComponent?: ReactNode;
  ListFooterComponent?: ReactNode;
}
```

### 8.5 Table

```typescript
interface TableProps<T> {
  columns: Array<{
    key: string;
    header: string;
    width?: string;
    render?: (item: T) => ReactNode;
    sortable?: boolean;
  }>;
  data: T[];
  keyExtractor: (item: T) => string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  isLoading?: boolean;
  emptyText?: string;
}
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 14, 2026

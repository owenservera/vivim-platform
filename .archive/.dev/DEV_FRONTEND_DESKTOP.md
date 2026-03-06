# VIVIM Desktop WebApp Specification

> **Version:** 1.0  
> **Date:** March 2026  
> **Output:** `.archive.dev/DEV_FRONTEND_DESKTOP.md`

---

## 1. Desktop Experience Overview

### 1.1 Design Philosophy

| Principle | Description |
|-----------|-------------|
| **WebApp Native** | Feel like a native desktop application |
| **Keyboard First** | Power user shortcuts for everything |
| **Window Awareness** | Respect window size and position |
| **Native Integration** | Clipboard, drag-drop, file handling |
| **Performance** | Fast, snappy, efficient |

### 1.2 Target Platforms

| Platform | Browser | Features |
|----------|---------|----------|
| macOS | Chrome, Firefox, Safari, Edge | Full |
| Windows | Chrome, Firefox, Edge | Full |
| Linux | Chrome, Firefox | Full |

---

## 2. Window Management

### 2.1 Window Configuration

```typescript
// Window configuration
interface WindowConfig {
  minWidth: number;
  minHeight: number;
  defaultWidth: number;
  defaultHeight: number;
  title: string;
  icon: string;
}

// Set minimum window size
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.style.setProperty('--window-min-width', '800px');
  document.documentElement.style.setProperty('--window-min-height', '600px');
});
```

### 2.2 Remember Window State

```typescript
// Save window position/size
function saveWindowState() {
  localStorage.setItem('windowState', JSON.stringify({
    width: window.outerWidth,
    height: window.outerHeight,
    x: window.screenX,
    y: window.screenY,
    isMaximized: window.document.body.classList.contains('maximized'),
  }));
}

// Restore on load
function restoreWindowState() {
  const state = JSON.parse(localStorage.getItem('windowState') || '{}');
  
  if (state.width && state.height) {
    window.resizeTo(state.width, state.height);
  }
  
  if (state.x !== undefined && state.y !== undefined) {
    window.moveTo(state.x, state.y);
  }
  
  if (state.isMaximized) {
    window.document.body.classList.add('maximized');
  }
}

// Save on close
window.addEventListener('beforeunload', saveWindowState);
```

### 2.3 Fullscreen Mode

```tsx
// Toggle fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// Keyboard shortcut: F11
document.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }
});
```

---

## 3. Keyboard Shortcuts

### 3.1 Global Shortcuts

| Shortcut | Action | Priority |
|----------|--------|----------|
| `Cmd/Ctrl + K` | Open command palette | Critical |
| `Cmd/Ctrl + /` | Show shortcuts help | Critical |
| `Cmd/Ctrl + N` | New conversation | Critical |
| `Cmd/Ctrl + Shift + N` | New collection | High |
| `Cmd/Ctrl + F` | Search current page | High |
| `Cmd/Ctrl + Shift + F` | Global search | High |
| `Cmd/Ctrl + \` | Toggle sidebar | High |
| `Cmd/Ctrl + [` | Navigate back | Medium |
| `Cmd/Ctrl + ]` | Navigate forward | Medium |
| `Cmd/Ctrl + R` | Refresh | Low |
| `Cmd/Ctrl + Shift + P` | Toggle dark mode | Medium |
| `Cmd/Ctrl + ,` | Open settings | High |
| `Escape` | Close modal/drawer | Critical |

### 3.2 Context Shortcuts

| Shortcut | Context | Action |
|----------|---------|--------|
| `Enter` | List item | Open item |
| `Space` | List item | Toggle select |
| `J` | List view | Next item |
| `K` | List view | Previous item |
| `X` | List view | Select item |
| `A` | List view | Select all |
| `Delete` | Selected item | Delete |
| `E` | Selected item | Edit |
| `S` | Selected item | Share |
| `P` | Selected item | Pin/Unpin |

### 3.3 Implementation

```typescript
// src/hooks/useKeyboardShortcut.ts
import { useEffect, useCallback } from 'react';

interface ShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;
    
    // Allow some shortcuts in inputs
    const allowedInInput = ['k', 'f', '/'];
    if (isInput && !allowedInInput.includes(key.toLowerCase())) {
      return;
    }
    
    const modifiers = {
      meta: event.metaKey || event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
    };
    
    // Parse shortcut (e.g., "cmd+k", "ctrl+shift+n")
    const [mod, keyPart] = key.toLowerCase().split('+');
    
    const keyMatch = event.key.toLowerCase() === keyPart;
    const modMatch = 
      (mod === 'cmd' || mod === 'ctrl') === modifiers.meta &&
      (mod === 'shift') === modifiers.shift &&
      (mod === 'alt') === modifiers.alt;
    
    if (keyMatch && modMatch) {
      if (preventDefault) {
        event.preventDefault();
      }
      callback();
    }
  }, [key, callback, enabled, preventDefault]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

### 3.4 Shortcuts Help Modal

```tsx
// src/components/ShortcutsModal.tsx
const SHORTCUTS = [
  {
    category: 'Global',
    items: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['⌘', '/'], description: 'Show shortcuts' },
      { keys: ['⌘', 'N'], description: 'New conversation' },
      { keys: ['⌘', '\\'], description: 'Toggle sidebar' },
      { keys: ['⌘', ','], description: 'Open settings' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['⌘', '['], description: 'Go back' },
      { keys: ['⌘', ']'], description: 'Go forward' },
      { keys: ['G', 'H'], description: 'Go to Home' },
      { keys: ['G', 'S'], description: 'Go to Search' },
      { keys: ['G', 'A'], description: 'Go to Archive' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: ['J'], description: 'Next item' },
      { keys: ['K'], description: 'Previous item' },
      { keys: ['X'], description: 'Select item' },
      { keys: ['↵'], description: 'Open selected' },
      { keys: ['⌫'], description: 'Delete selected' },
    ],
  },
];
```

---

## 4. Command Palette

### 4.1 Overview

The command palette is the primary navigation and action interface for desktop users.

### 4.2 Design

```
┌─────────────────────────────────────────────────────────────┐
│  🔍  Type a command or search...                  ⌘K      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Recent                                                    │
│  ├ → Go to Home                              ↵           │
│  ├ → Search Conversations                    ↵           │
│  └ → New Conversation                       ↵           │
│                                                             │
│  Actions                                                   │
│  ├ → Capture Conversation                    ⌘N        │
│  ├ → Create Collection                       ⌘⇧N       │
│  ├ → Import from URL                                    │
│  └ → Export Data                                         │
│                                                             │
│  Navigation                                               │
│  ├ → Settings                               ⌘,        │
│  ├ → Archive                                          │
│  ├ → Collections                                       │
│  └ → Account                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│         ↑↓ Navigate          ↵ Select         Esc Close    │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Implementation

```tsx
// src/components/CommandPalette/CommandPalette.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

interface Command {
  id: string;
  label: string;
  category: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const commands: Command[] = useMemo(() => [
    // Navigation
    { id: 'nav-home', label: 'Go to Home', category: 'Navigation', action: () => navigate('/'), keywords: ['home', 'dashboard'], shortcut: 'G H' },
    { id: 'nav-search', label: 'Search', category: 'Navigation', action: () => navigate('/search'), keywords: ['search', 'find'], shortcut: 'G S' },
    { id: 'nav-archive', label: 'Archive', category: 'Navigation', action: () => navigate('/archive'), keywords: ['archive', 'history'] },
    { id: 'nav-collections', label: 'Collections', category: 'Navigation', action: () => navigate('/collections'), keywords: ['collection', 'folder'] },
    { id: 'nav-settings', label: 'Settings', category: 'Navigation', action: () => navigate('/settings'), shortcut: '⌘,' },
    // Actions
    { id: 'action-new-chat', label: 'New Conversation', category: 'Actions', action: () => navigate('/chat'), shortcut: '⌘N' },
    { id: 'action-capture', label: 'Capture Conversation', category: 'Actions', action: () => navigate('/capture') },
    { id: 'action-new-collection', label: 'Create Collection', category: 'Actions', action: () => createCollection() },
    // Search
    { id: 'search-conversations', label: 'Search Conversations', category: 'Search', action: () => navigate('/search'), shortcut: '⌘⇧F' },
  ], [navigate]);
  
  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.keywords?.some(k => k.includes(lowerQuery))
    );
  }, [commands, query]);
  
  // Open with keyboard
  useKeyboardShortcut('k', () => setIsOpen(true), { enabled: true });
  useKeyboardShortcut('Escape', () => setIsOpen(false), { enabled: isOpen });
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);
  
  if (!isOpen) return null;
  
  return (
    <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-input-wrapper">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            autoFocus
          />
          <kbd>Esc</kbd>
        </div>
        
        <div className="command-list">
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd.id}
              className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => { cmd.action(); setIsOpen(false); }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="command-category">{cmd.category}</span>
              <span className="command-label">{cmd.label}</span>
              {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
            </div>
          ))}
        </div>
        
        <div className="command-footer">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Native Integrations

### 5.1 Clipboard

```typescript
// Copy to clipboard
async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

// Copy conversation as markdown
async function copyConversationAsMarkdown(conversation: Conversation) {
  const markdown = conversationToMarkdown(conversation);
  await copyToClipboard(markdown);
}

// Copy with HTML format
async function copyAsHTML(html: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const textBlob = new Blob([html], { type: 'text/plain' });
  
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': blob,
      'text/plain': textBlob,
    }),
  ]);
}

// Paste handler
document.addEventListener('paste', async (e) => {
  const text = e.clipboardData?.getData('text');
  const html = e.clipboardData?.getData('text/html');
  
  // Handle pasted content
});
```

### 5.2 Drag and Drop

```tsx
// Draggable conversation
function DraggableConversation({ conversation }: { conversation: Conversation }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(conversation));
    e.dataTransfer.effectAllowed = 'move';
    
    // Set drag image
    const img = new Image();
    img.src = '/icons/drag-icon.png';
    e.dataTransfer.setDragImage(img, 0, 0);
  };
  
  return (
    <div draggable onDragStart={handleDragStart}>
      {conversation.title}
    </div>
  );
}

// Drop zone
function DropZone({ onDrop }: { onDrop: (data: any) => void }) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      onDrop(JSON.parse(data));
    }
  };
  
  return (
    <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
      {children}
    </div>
  );
}
```

### 5.3 File System Access

```typescript
// Save to file
async function exportToFile(conversation: Conversation) {
  // Check for File System Access API support
  if ('showSaveFilePicker' in window) {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `${conversation.title}.md`,
      types: [
        {
          description: 'Markdown',
          accept: { 'text/markdown': ['.md'] },
        },
        {
          description: 'JSON',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });
    
    const writable = await handle.createWritable();
    const content = conversationToMarkdown(conversation);
    await writable.write(content);
    await writable.close();
  } else {
    // Fallback to download
    downloadAsFile(conversation.title + '.md', content);
  }
}

// Open file
async function importFromFile() {
  const [handle] = await (window as any).showOpenFilePicker({
    types: [
      {
        description: 'Text files',
        accept: { 'text/*': ['.txt', '.md', '.json'] },
      },
    ],
  });
  
  const file = await handle.getFile();
  const content = await file.text();
  return content;
}
```

---

## 6. Sidebar Behavior

### 6.1 Collapsible Sidebar

```tsx
// Sidebar.tsx
import { useState } from 'react';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  // Expand on hover (optional behavior)
  const isExpanded = !isCollapsed || isHovering;
  
  return (
    <aside
      className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => isCollapsed && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="sidebar-header">
        {isExpanded && <Logo />}
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <NavItem icon={<HomeIcon />} label="Home" to="/" expanded={isExpanded} />
        <NavItem icon={<SearchIcon />} label="Search" to="/search" expanded={isExpanded} />
        <NavItem icon={<ArchiveIcon />} label="Archive" to="/archive" expanded={isExpanded} />
        {/* ... */}
      </nav>
    </aside>
  );
}
```

### 6.2 Sidebar Styles

```css
.sidebar {
  width: 72px;  /* Collapsed */
  transition: width 200ms ease-out;
}

.sidebar.expanded {
  width: 260px;
}

.sidebar .nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 150ms;
}

.sidebar .nav-item .label {
  opacity: 0;
  transition: opacity 150ms;
}

.sidebar.expanded .nav-item .label {
  opacity: 1;
}
```

---

## 7. Context Menu

### 7.1 Right-Click Menu

```tsx
// src/components/ContextMenu.tsx
interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  // Close on click outside
  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [onClose]);
  
  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={e => e.stopPropagation()}
    >
      {items.map((item, index) => (
        item.divider ? (
          <div key={index} className="menu-divider" />
        ) : (
          <button
            key={index}
            className="menu-item"
            disabled={item.disabled}
            onClick={() => { item.action?.(); onClose(); }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </button>
        )
      ))}
    </div>
  );
}

// Usage with conversation
function ConversationItem({ conversation }) {
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };
  
  const menuItems = [
    { label: 'Open', action: () => navigate(`/conversation/${conversation.id}`), shortcut: '↵' },
    { label: 'Edit', action: () => edit(conversation) },
    { label: 'Share', action: () => share(conversation), shortcut: 'S' },
    { divider: true },
    { label: 'Pin', action: () => pin(conversation) },
    { label: 'Archive', action: () => archive(conversation) },
    { divider: true },
    { label: 'Delete', action: () => delete(conversation), shortcut: '⌫' },
  ];
  
  return (
    <div onContextMenu={handleContextMenu}>
      {/* Conversation content */}
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={menuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
```

---

## 8. System Tray (Web)

### 8.1 Badge API

```typescript
// Set badge count
async function setBadgeCount(count: number) {
  if (navigator.setAppBadge) {
    await navigator.setAppBadge(count);
  } else if (navigator.mozSetNotificationBadge) {
    navigator.mozSetNotificationBadge(count);
  } else if (navigator.webkitSetNotificationBadge) {
    navigator.webkitSetNotificationBadge(count);
  }
}

// Clear badge
async function clearBadge() {
  if (navigator.clearAppBadge) {
    await navigator.clearAppBadge();
  }
}
```

---

## 9. Notifications Integration

### 9.1 Desktop Notifications

```typescript
// Request permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Show notification
function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options,
    });
  }
}

// Notify on new shared conversation
function notifySharedConversation(conversation: Conversation) {
  showNotification('New shared conversation', {
    body: `${conversation.ownerName} shared "${conversation.title}" with you`,
    tag: `shared-${conversation.id}`,
    data: { url: `/conversation/${conversation.id}` },
  });
}
```

---

## 10. Performance Optimization

### 10.1 Virtual Scrolling

```tsx
// Use virtualization for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedConversationList({ conversations }: { conversations: Conversation[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });
  
  return (
    <div ref={parentRef} className="virtual-list">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
          >
            <ConversationItem conversation={conversations[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 10.2 Code Splitting

```tsx
// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const ConversationView = lazy(() => import('./pages/ConversationView'));
const Settings = lazy(() => import('./pages/Settings'));

// Lazy load heavy components
const KnowledgeGraph = lazy(() => 
  import('@/components/sovereignty/KnowledgeGraph').then(m => ({ default: m.KnowledgeGraph }))
);
```

---

## 11. Desktop Detection

### 11.1 Responsive Detection Hook

```typescript
// src/hooks/useDesktop.ts
import { useMediaQuery } from './useMediaQuery';

export function useDesktop() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  return { isDesktop, isTablet, isMobile };
}
```

---

## 12. Testing Checklist

### 12.1 Keyboard Testing

- [ ] All shortcuts work in Chrome
- [ ] All shortcuts work in Firefox
- [ ] All shortcuts work in Safari
- [ ] Shortcuts work in input fields appropriately
- [ ] Command palette opens/closes properly
- [ ] Escape closes all modals

### 12.2 Window Testing

- [ ] Window remembers size/position
- [ ] Minimum window size enforced
- [ ] Fullscreen works
- [ ] Resize is smooth

### 12.3 Integration Testing

- [ ] Copy/paste works
- [ ] Drag and drop works
- [ ] File save dialog works
- [ ] Notifications work

---

*This specification provides complete implementation details for making VIVIM feel like a native desktop web application.*

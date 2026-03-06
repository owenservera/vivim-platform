# Integration Guide

> **Purpose:** Guide for integrating new frontend with existing services  
> **Target:** Frontend Developer  
> **Scope:** How to connect new UI to existing data layer

---

## 1. Integration Overview

### 1.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    New Frontend Shell                        │
│  (Your responsibility - React + Tailwind + Components)     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                         │
│  (Hooks, Services, State - Already exists)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  (Storage, API, P2P - Already exists)                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 What Already Exists

| Layer | Location | Status |
|-------|----------|--------|
| Storage Service | `pwa/src/lib/service/conversation-service.ts` | ✅ Ready |
| API Client | `pwa/src/lib/api.ts` | ✅ Ready |
| State Stores | `pwa/src/stores/*.ts` | ✅ Ready |
| Auth Context | `pwa/src/lib/auth-context.tsx` | ✅ Ready |
| SDK | `pwa/src/lib/vivim-sdk.ts` | ✅ Ready |

---

## 2. Services Integration

### 2.1 Conversation Service

**Location:** `pwa/src/lib/service/conversation-service.ts`

**Usage:**
```typescript
import { conversationService } from '@/lib/service/conversation-service';

// Get all conversations
const conversations = await conversationService.getAllConversations();

// Get single conversation
const conversation = await conversationService.getConversation('id');

// Save conversation
await conversationService.saveConversation(conversation);

// Delete conversation
await conversationService.deleteConversation('id');

// Storage status
const status = await conversationService.getStorageStatus();
```

### 2.2 API Client

**Location:** `pwa/src/lib/api.ts`

**Usage:**
```typescript
import { apiClient } from '@/lib/api';

// GET request
const response = await apiClient.get('/conversations', {
  params: { limit: 20, offset: 0 }
});

// POST request
const response = await apiClient.post('/conversations', {
  title: 'New Conversation',
  provider: 'chatgpt',
  messages: []
});

// Headers are automatically handled
// Auth token: Authorization: Bearer <token>
// Content-Type: application/json
```

### 2.3 Storage Layer

**Location:** `pwa/src/lib/storage-v2/`

**Usage:**
```typescript
import { unifiedRepository } from '@/lib/db/unified-repository';

// Conversations
const conversations = await unifiedRepository.getConversations({
  limit: 20,
  offset: 0,
  state: 'ACTIVE'
});

const conversation = await unifiedRepository.getConversation('id');
await unifiedRepository.saveConversation(conversation);

// Metadata
const metadata = await unifiedRepository.getMetadata('id');
await unifiedRepository.saveMetadata('id', { isPinned: true });

// Stats
const stats = await unifiedRepository.getStats();
```

---

## 3. State Management Integration

### 3.1 Using Existing Stores

```typescript
import { useHomeUIStore } from '@/stores/useHomeUIStore';
import { settingsStore } from '@/stores/settings.store';

// In component
const { filterTab, setFilterTab } = useHomeUIStore();
const { theme, setTheme } = settingsStore();
```

### 3.2 Creating New Store

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyFeatureState {
  // State
  items: Item[];
  loading: boolean;
  
  // Actions
  loadItems: () => Promise<void>;
  addItem: (item: Item) => void;
}

export const useMyFeatureStore = create<MyFeatureState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      
      loadItems: async () => {
        set({ loading: true });
        try {
          const items = await fetchItems();
          set({ items, loading: false });
        } catch (error) {
          set({ loading: false });
        }
      },
      
      addItem: (item) => {
        set({ items: [...get().items, item] });
      },
    }),
    {
      name: 'my-feature-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

---

## 4. Authentication Integration

### 4.1 Auth Context

**Location:** `pwa/src/lib/auth-context.tsx`

**Usage:**
```typescript
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { 
    user,              // Current user
    isAuthenticated,  // Boolean
    isLoading,        // Loading state
    login,            // Login function
    logout,           // Logout function
  } = useAuth();
  
  if (isLoading) return <Loading />;
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return <div>Welcome, {user.name}</div>;
}
```

### 4.2 Protected Routes

```typescript
import { AuthGuard } from '@/components/auth/AuthGuard';

// Wrap protected content
<AuthGuard>
  <ProtectedContent />
</AuthGuard>
```

---

## 5. Data Fetching Integration

### 5.1 TanStack Query

**Location:** `pwa/src/lib/query-client.ts`

**Usage:**
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// Query
function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.get('/conversations').then(r => r.data),
  });
}

// Mutation
function useCreateConversation() {
  return useMutation({
    mutationFn: (data) => apiClient.post('/conversations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

---

## 6. Component Integration Patterns

### 6.1 Wrapping Existing Data

```tsx
// New component wrapping existing service
import { conversationService } from '@/lib/service/conversation-service';

function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    conversationService.getAllConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <SkeletonList />;
  
  return (
    <div className="grid gap-4">
      {conversations.map(conv => (
        <ConversationCard 
          key={conv.id} 
          conversation={conv}
        />
      ))}
    </div>
  );
}
```

### 6.2 Using Hooks

```tsx
// Custom hook for data
function useConversations(options = {}) {
  const query = useQuery({
    queryKey: ['conversations', options],
    queryFn: () => conversationService.getAllConversations(options),
  });
  
  return {
    ...query,
    conversations: query.data ?? [],
  };
}

// Usage
function MyPage() {
  const { conversations, isLoading } = useConversations({ 
    limit: 20 
  });
  
  // Render...
}
```

---

## 7. Real-time Updates

### 7.1 Socket Integration

**Location:** `pwa/src/components/GlobalSocketListener.tsx`

**Usage:**
```typescript
import { useSocket } from '@/lib/socket-context';

function MyComponent() {
  const socket = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('conversation:update', (data) => {
      // Handle update
    });
    
    return () => {
      socket.off('conversation:update');
    };
  }, [socket]);
}
```

### 7.2 P2P Sync

```typescript
import { syncEngine } from '@/lib/sync/sync-engine';

// Subscribe to sync events
syncEngine.on('sync:complete', (state) => {
  console.log('Sync complete:', state);
});

syncEngine.on('sync:error', (error) => {
  console.error('Sync error:', error);
});
```

---

## 8. Error Handling

### 8.1 Service Errors

```typescript
try {
  await conversationService.saveConversation(data);
} catch (error) {
  if (error.code === 'STORAGE_FULL') {
    // Handle storage full
  } else if (error.code === 'UNAUTHORIZED') {
    // Handle auth error
  } else {
    // Handle generic error
  }
}
```

### 8.2 Error Boundaries

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function MyPage() {
  return (
    <ErrorBoundary
      fallback={<ErrorDisplay message="Failed to load" />}
    >
      <MyContent />
    </ErrorBoundary>
  );
}
```

---

## 9. Testing Integration Points

### 9.1 Mocking Services

```typescript
// For testing
vi.mock('@/lib/service/conversation-service', () => ({
  conversationService: {
    getAllConversations: vi.fn().mockResolvedValue([]),
    getConversation: vi.fn().mockResolvedValue(null),
    saveConversation: vi.fn().mockResolvedValue({}),
    deleteConversation: vi.fn().mockResolvedValue(undefined),
  },
}));
```

### 9.2 Mocking API

```typescript
// For testing
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
```

---

## 10. Performance Considerations

### 10.1 Code Splitting

```typescript
// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Settings = lazy(() => import('./pages/Settings'));

// Lazy load heavy components
const KnowledgeGraph = lazy(() => 
  import('@/components/sovereignty/KnowledgeGraph')
);
```

### 10.2 Virtualization

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });
  
  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
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
            <Item item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 11. Migration Checklist

### Phase 1: Setup

- [ ] Install dependencies: `bun install`
- [ ] Configure TailwindCSS 4
- [ ] Set up project structure

### Phase 2: Core Components

- [ ] Create design tokens
- [ ] Build base UI components
- [ ] Implement layout system

### Phase 3: Integration

- [ ] Connect to conversation service
- [ ] Connect to API client
- [ ] Integrate auth context
- [ ] Set up state management

### Phase 4: Pages

- [ ] Build home/feed page
- [ ] Build archive pages
- [ ] Build settings page
- [ ] Build remaining pages

### Phase 5: Polish

- [ ] Add animations
- [ ] Test responsive behavior
- [ ] Optimize performance

---

## 12. Common Integration Patterns

### 12.1 Loading State

```tsx
function LoadingWrapper({ 
  isLoading, 
  skeleton: SkeletonComponent,
  children 
}) {
  if (isLoading) {
    return <SkeletonComponent />;
  }
  
  return children;
}

// Usage
<LoadingWrapper 
  isLoading={isLoading} 
  skeleton={<ConversationCardSkeleton />}
>
  <ConversationCard />
</LoadingWrapper>
```

### 12.2 Empty State

```tsx
function EmptyWrapper({ 
  isEmpty, 
  emptyMessage,
  children 
}) {
  if (isEmpty) {
    return (
      <EmptyState 
        icon={<FolderIcon />}
        title="No conversations"
        description={emptyMessage}
      />
    );
  }
  
  return children;
}
```

### 12.3 Error State

```tsx
function ErrorWrapper({ 
  error, 
  onRetry,
  children 
}) {
  if (error) {
    return (
      <ErrorState 
        title="Something went wrong"
        message={error.message}
        action={{
          label: 'Try Again',
          onClick: onRetry
        }}
      />
    );
  }
  
  return children;
}
```

---

## 13. File Locations Reference

### Services
- `pwa/src/lib/service/conversation-service.ts` - Conversation CRUD
- `pwa/src/lib/api.ts` - REST API client
- `pwa/src/lib/db/unified-repository.ts` - Database operations
- `pwa/src/lib/vivim-sdk.ts` - SDK wrapper

### Stores
- `pwa/src/stores/useHomeUIStore.ts` - Home UI state
- `pwa/src/stores/settings.store.ts` - Settings
- `pwa/src/stores/archive.store.ts` - Archive state
- `pwa/src/stores/identity.store.ts` - User identity

### Contexts
- `pwa/src/lib/auth-context.tsx` - Authentication
- `pwa/src/contexts/VivimContext.tsx` - App context

### Hooks
- `pwa/src/hooks/useAI.ts` - AI chat
- `pwa/src/hooks/useBackgroundSync.ts` - Sync

---

## 14. Support

For questions or issues with integration:

1. Check the existing implementations in `pwa/src/pages/`
2. Review the service files in `pwa/src/lib/`
3. Look at store patterns in `pwa/src/stores/`
4. Reference the type definitions in `pwa/src/types/`

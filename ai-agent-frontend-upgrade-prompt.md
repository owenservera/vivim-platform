# AI Agent Prompt: Frontend Upgrade & Standardization

## Mission
Upgrade the VIVIM PWA frontend codebase to modern best practices, establish comprehensive coding standards, and create a unified architecture across all components. Transform the current organic growth codebase into a professional, maintainable, and scalable application.

---

## Current State Analysis

### Project Technology Stack
- **Framework**: React 19.2.4 with TypeScript
- **Build Tool**: Vite 7.2.5 (Rolldown)
- **State Management**: Zustand 5.0.11
- **Data Fetching**: TanStack React Query 5.90.20
- **Routing**: React Router DOM 7.13.0
- **Styling**: TailwindCSS 4.1.18
- **Icons**: Lucide React, Feather Icons
- **Storage**: IndexedDB via `idb` library

### Current Directory Structure
```
pwa/src/
├── components/
│   ├── ios/                          # iOS-style components
│   │   ├── Button.tsx, Card.tsx, Input.tsx, Modal.tsx
│   │   ├── Avatar.tsx, LikeButton.tsx
│   │   ├── Skeleton.tsx, Toast.tsx, SearchBar.tsx
│   │   ├── TopBar.tsx, BottomNav.tsx
│   │   ├── Stories.tsx, Reels.tsx
│   │   ├── ShareSheet.tsx, ShareDialog.tsx
│   │   ├── EmptyState.tsx, ErrorState.tsx
│   │   ├── ChatBubble.tsx, SettingsGroup.tsx
│   │   ├── ConversationCard.tsx, AIActionsPanel.tsx
│   │   └── CircleManager.tsx, FullScreenConversation.tsx
│   ├── recommendation/              # Recommendation components
│   │   ├── RecommendationsList.tsx
│   │   ├── ConversationCard.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── SimilarConversations.tsx, TopicFilter.tsx
│   ├── ErrorBoundary.tsx
│   ├── TopBar.tsx (duplicate)
│   ├── SyncIndicator.tsx
│   ├── ToastContainer.tsx
│   ├── TriggerCheatsheet.tsx
│   ├── SuggestionMenu.tsx, SuggestionMenuEnhanced.tsx
│   ├── ShareMenu.tsx
│   ├── OmniComposer.tsx, OmniComposerTypes.tsx
│   └── RemuxDialog.tsx
├── pages/
│   ├── Home.tsx, Capture.tsx, CaptureSimple.tsx
│   ├── ConversationView.tsx, Search.tsx
│   ├── Settings.tsx, Analytics.tsx, Bookmarks.tsx
│   ├── Collections.tsx, Share.tsx, Receive.tsx
│   ├── Login.tsx, ErrorDashboard.tsx
│   ├── BYOKChat.tsx, AIConversationsPage.tsx
│   └── ForYou.tsx
├── lib/
│   ├── sync/                        # Sync services
│   │   └── sync-engine.ts, sync-engine.test.ts
│   ├── storage-v2/                  # Storage layer
│   │   ├── db-manager/
│   │   │   ├── unified-db.ts, database-manager.ts
│   │   │   ├── sync-queue.ts, integrity-checker.ts
│   │   │   ├── data-validator.ts, conflict-resolver.ts
│   │   │   └── test-utils.ts
│   │   ├── sync/, crypto.ts, object-store.ts
│   │   ├── storage.ts, dag-engine.ts
│   │   ├── merkle.ts, privacy-manager.ts
│   │   └── secure-*.ts (multiple secure storage files)
│   ├── recommendation/              # Recommendation system
│   │   ├── scoring/QualityScore.ts
│   │   ├── ranking/LightRanker.ts, HeavyRanker.ts
│   │   ├── mixer/KnowledgeMixer.ts
│   │   ├── sources/RediscoverySource.ts
│   │   ├── filters/VisibilityFilters.ts
│   │   ├── api.ts, demo.ts, analytics.ts
│   │   └── types.ts, preferences.ts, config.ts
│   ├── service/conversation-service.ts
│   ├── sync-manager.ts, sync-service.ts
│   ├── db-sync.ts, webrtc-manager.ts
│   ├── identity/, feature-service.ts
│   ├── query-client.ts, hooks.ts, utils.ts
│   ├── logger.ts, ui-store.ts
│   └── unified-debug-service.ts
├── hooks/
│   ├── useAI.ts, useAIConversations.ts
│   ├── useSync.ts, useToast.ts
│   └── use-error-reporting.ts
├── types/
│   ├── index.ts, conversation.ts, ai.ts
│   ├── acu.ts, ai-chat.ts, features.ts
│   ├── social.ts
│   └── feather-icons.d.ts
├── test/setup.ts
├── App.tsx, main.tsx, service-worker.ts
└── index.html
```

### Issues Identified

| Issue | Severity | Description |
|-------|----------|-------------|
| **Duplicate Components** | 🔴 High | Duplicate TopBar, LikeButton exist in both `components/` and `components/ios/` |
| **Multiple Storage Files** | 🔴 High | 8+ secure storage variants: `storage.ts`, `secure-storage.ts`, `secure-storage-complete.ts`, `storage-security-patched.ts`, `fallback-00.ts` |
| **Inconsistent Naming** | 🟡 Medium | Mix of camelCase, PascalCase, and underscore naming |
| **Missing Index Exports** | 🟡 Medium | No barrel exports in most directories |
| **No Shared Types** | 🟡 Medium | Types scattered across multiple files |
| **Large Pages** | 🟡 Medium | Home.tsx is 500+ lines |
| **No Error Boundaries** | 🟡 Medium | Limited granular error handling |
| **Console Logging** | 🟢 Low | Direct console.log usage instead of logger |
| **No Loading States** | 🟢 Low | Inconsistent loading/error states |

---

## Objectives

### Phase 1: Architecture Standardization (Priority: Critical)

#### 1.1 Directory Structure Refactoring

**Current Problem:**
- Components scattered across `components/` root and `components/ios/`
- Multiple lib directories with unclear purposes
- No clear separation between features

**Target Structure:**
```
pwa/src/
├── app/
│   ├── App.tsx                      # Root app with providers
│   ├── routes.tsx                   # Route definitions
│   └── providers.tsx                # All providers (Query, Auth, Toast, etc.)
├── pages/
│   ├── Home/
│   │   ├── Home.tsx                 # Page component
│   │   ├── Home.types.ts            # Types specific to page
│   │   └── Home.hooks.ts            # Custom hooks for page
│   ├── Capture/
│   ├── Conversation/
│   └── [other pages as feature folders]
├── components/
│   ├── ui/                          # Base UI components (Button, Input, etc.)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   └── index.ts
│   ├── layout/                      # Layout components
│   │   ├── Header.tsx, Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageContainer.tsx
│   ├── features/                     # Feature-specific components
│   │   ├── recommendation/
│   │   ├── capture/
│   │   ├── conversation/
│   │   └── sync/
│   └── shared/                       # Shared across features
│       ├── ErrorBoundary.tsx
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
├── hooks/                            # Global hooks
│   ├── useAuth.ts
│   ├── useOnlineStatus.ts
│   └── index.ts
├── lib/
│   ├── api/                         # API layer
│   ├── storage/                     # Storage abstraction
│   ├── sync/                        # Sync logic
│   └── utils/                       # Utilities
├── stores/                          # Zustand stores (centralized)
│   ├── auth.store.ts
│   ├── settings.store.ts
│   ├── sync.store.ts
│   └── index.ts
├── types/                           # Global types
│   ├── index.ts
│   ├── conversation.ts
│   └── api.ts
└── config/                         # App configuration
    ├── constants.ts
    └── env.ts
```

#### 1.2 Implement Barrel Exports

**Every directory must have `index.ts`:**

```typescript
// components/ui/Button/index.ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';
```

#### 1.3 Consolidate Duplicate Components

**Action Required:**
- Merge `components/TopBar.tsx` → `components/ios/TopBar.tsx`
- Merge `components/LikeButton.tsx` → `components/ios/LikeButton.tsx`
- Delete duplicates after merge
- Update all imports

---

### Phase 2: Component Standardization (Priority: High)

#### 2.1 Component Template

**Create standardized component template:**

```typescript
// components/ui/ComponentName/ComponentName.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentNameProps } from './ComponentName.types';

/**
 * ComponentName description
 * 
 * @example
 * <ComponentName variant="primary" size="md">
 *   Click me
 * </ComponentName>
 */
export const ComponentName = forwardRef<HTMLButtonElement, ComponentNameProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'base-styles',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ComponentName.displayName = 'ComponentName';

// ComponentName.types.ts
export interface ComponentNameProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// index.ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName.types';
```

#### 2.2 Error Handling Standard

**Every component must handle:**
```typescript
try {
  // Component logic
} catch (error) {
  logger.error('ComponentName:operation', error);
  // Fallback UI or rethrow
}
```

#### 2.3 Loading States

**Standard loading pattern:**
```typescript
// Use skeleton components during loading
{isLoading ? (
  <ComponentNameSkeleton />
) : (
  <ComponentName data={data} />
)}
```

#### 2.4 Accessibility Requirements

**Every interactive element must have:**
- `aria-label` or accessible label
- Keyboard navigation support
- Focus visible styles
- Screen reader announcements for dynamic content

```typescript
// Good example
<button
  aria-label="Close dialog"
  onClick={onClose}
  className="focus:ring-2 focus:ring-offset-2"
>
  <XIcon aria-hidden="true" />
</button>
```

---

### Phase 3: State Management (Priority: High)

#### 3.1 Zustand Store Consolidation

**Current:** Stores scattered in `lib/stores.ts`, `lib/ui-store.ts`

**Target:** Each store in dedicated file under `src/stores/`

```typescript
// stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (credentials) => {
        const user = await authService.login(credentials);
        set({ user, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

#### 3.2 Store Naming Conventions

| Store | File | Hook |
|-------|------|------|
| Auth | `stores/auth.store.ts` | `useAuthStore` |
| Settings | `stores/settings.store.ts` | `useSettingsStore` |
| Sync | `stores/sync.store.ts` | `useSyncStore` |
| UI | `stores/ui.store.ts` | `useUIStore` |

#### 3.3 TanStack Query Integration

**Standardize API calls:**

```typescript
// lib/api/hooks/useConversations.ts
import { useQuery } from '@tanstack/react-query';
import { conversationApi } from '../api';

export function useConversations(options?: UseQueryOptions<Conversation[]>) {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}
```

---

### Phase 4: TypeScript Standards (Priority: High)

#### 4.1 Global Type Definitions

**Create `src/types/index.ts`:**

```typescript
// Re-export all types from one place
export * from './conversation';
export * from './user';
export * from './api';

// Common utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
```

#### 4.2 API Response Types

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: ApiError;
  pagination?: Pagination;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

#### 4.3 Component Prop Types

**Follow this pattern:**
```typescript
// Use specific names
export interface ButtonProps {
  // Avoid: "onClick", "handler"
  // Use: "onSubmit", "onAction"
  
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isDisabled?: boolean;
  isLoading?: boolean;
}
```

---

### Phase 5: Performance Optimization (Priority: Medium)

#### 5.1 Code Splitting

```typescript
// Lazy load pages
const Home = lazy(() => import('@/pages/Home/Home'));
const Capture = lazy(() => import('@/pages/Capture/Capture'));

// With Suspense fallback
<Suspense fallback={<PageSkeleton />}>
  <Home />
</Suspense>
```

#### 5.2 Memoization Guidelines

```typescript
// ✅ Good: Expensive computations
const sortedItems = useMemo(() => 
  items.sort((a, b) => b.score - a.score),
  [items]
);

// ✅ Good: Stable callbacks
const handleSubmit = useCallback(async (data) => {
  await api.submit(data);
}, [api]);

// ❌ Bad: Unnecessary memoization
const value = useMemo(() => 1 + 1, []);
```

#### 5.3 Virtual List for Large Data

**For lists > 100 items:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
});
```

---

### Phase 6: Testing Integration (Priority: Medium)

#### 6.1 Component Testing Requirements

**Every new component must have:**

```typescript
// ComponentName.test.tsx
import { render, screen, userEvent } from '@/test/test-utils';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName>Click me</ComponentName>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle click events', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    
    render(<ComponentName onClick={onClick}>Click me</ComponentName>);
    await user.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be accessible', async () => {
    render(<ComponentName aria-label="Submit form">Submit</ComponentName>);
    expect(screen.getByLabelText('Submit form')).toBeInTheDocument();
  });
});
```

#### 6.2 Test Utilities

```typescript
// test/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export * from '@testing-library/react';
export { render, screen, userEvent } from '@testing-library/react';

export function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
```

---

### Phase 7: Logging & Error Handling (Priority: Medium)

#### 7.1 Logger Configuration

**Standardize logging:**
```typescript
// lib/logger/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: LogContext;
  
  constructor(context: LogContext = {}) {
    this.context = context;
  }
  
  info(message: string, data?: LogContext) {
    console.info(this.format('info', message, data));
  }
  
  error(message: string, error?: Error, data?: LogContext) {
    console.error(this.format('error', message, { 
      ...data, 
      stack: error?.stack,
      message: error?.message 
    }));
  }
  
  private format(level: LogLevel, message: string, data?: LogContext) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    });
  }
}

export const createLogger = (context: LogContext) => new Logger(context);
export const logger = createLogger({ source: 'pwa' });
```

#### 7.2 Error Boundary Strategy

```typescript
// components/shared/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught', error, { errorInfo });
    this.props.onError?.(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

---

### Phase 8: CI/CD & Tooling (Priority: Medium)

#### 8.1 Enhanced ESLint Configuration

```javascript
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import path from 'path';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'build', 'coverage'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    files: ['**/*.{ts,tsx}'],
    rules: {
      // React
      'react/prop-types': 'off', // Use TypeScript
      'react/react-in-jsx-scope': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'error',
      
      // Best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },
  {
    // Test files
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
```

#### 8.2 Pre-commit Hooks

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest --run --passWithNoTests"
    ],
    "*.{css,scss}": [
      "prettier --write"
    ]
  },
  "simple-git-hooks": {
    "pre-commit": "npx lint-staged"
  }
}
```

---

### Phase 9: Documentation Standards (Priority: Low)

#### 9.1 Component Documentation

```typescript
/**
 * Button - Primary interactive element
 * 
 * A versatile button component with multiple variants, sizes, and states.
 * Supports loading states, disabled states, and full keyboard navigation.
 * 
 * @component
 * @example
 * // Primary button
 * <Button variant="primary">Click me</Button>
 * 
 * @example
 * // Loading state
 * <Button isLoading>Processing...</Button>
 * 
 * @example
 * // With icon
 * <Button icon={<SaveIcon />}>Save</Button>
 * 
 * @see {@link https://design.vivim.app/components/button | Design System}
 */
export const Button: React.FC<ButtonProps> = ({ ... }) => { ... };
```

#### 9.2 Hook Documentation

```typescript
/**
 * useOnlineStatus - Monitor network connectivity
 * 
 * Returns current online status and automatically updates when
 * connectivity changes. Useful for offline-first applications.
 * 
 * @returns {boolean} Whether the browser is online
 * 
 * @example
 * const isOnline = useOnlineStatus();
 * 
 * return isOnline ? <App /> : <OfflineBanner />;
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine}
 */
export function useOnlineStatus(): boolean { ... }
```

---

## Implementation Checklist

### Phase 1: Architecture
- [ ] Create new directory structure
- [ ] Move components to proper locations
- [ ] Implement barrel exports (index.ts) for all directories
- [ ] Remove duplicate components
- [ ] Update all import paths

### Phase 2: Components
- [ ] Create component template files
- [ ] Standardize prop naming conventions
- [ ] Add loading states to all async components
- [ ] Implement proper error boundaries
- [ ] Add accessibility attributes

### Phase 3: State
- [ ] Create store directory structure
- [ ] Move/create dedicated store files
- [ ] Implement TanStack Query hooks for all API calls
- [ ] Add query invalidation patterns

### Phase 4: TypeScript
- [ ] Create global type definitions
- [ ] Standardize API response types
- [ ] Enable strict mode in tsconfig
- [ ] Remove any types

### Phase 5: Performance
- [ ] Implement lazy loading for routes
- [ ] Add React.memo where appropriate
- [ ] Optimize bundle size
- [ ] Add virtual scrolling for large lists

### Phase 6: Testing
- [ ] Set up test utilities
- [ ] Create test utilities file
- [ ] Add tests for new components
- [ ] Configure test coverage

### Phase 7: Error Handling
- [ ] Set up global error boundary
- [ ] Implement logger utility
- [ ] Add error handling to API calls
- [ ] Create error page

### Phase 8: Tooling
- [ ] Update ESLint configuration
- [ ] Add pre-commit hooks
- [ ] Configure CI pipeline
- [ ] Add code coverage to CI

### Phase 9: Documentation
- [ ] Add JSDoc to all exported functions
- [ ] Create component story files
- [ ] Update README with standards

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.tsx`, `ConversationCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts`, `useOnlineStatus.ts` |
| Stores | `.store.ts` suffix | `auth.store.ts`, `settings.store.ts` |
| Types | `.types.ts` suffix | `Button.types.ts`, `api.types.ts` |
| Constants | UPPER_SNAKE_CASE | `constants.ts`, `api.ts` |
| Utils | camelCase | `formatDate.ts`, `cn.ts` |
| Tests | `.test.ts` or `.spec.ts` | `Button.test.tsx` |

---

## Import Order (ESLint autofix)

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// 3. Internal absolute imports
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';

// 4. Relative imports
import { MyComponent } from './MyComponent';
import { MyTypes } from './MyComponent.types';

// 5. Styles (if any)
import styles from './MyComponent.module.css';
```

---

## Code Review Checklist

Before submitting PR, verify:

- [ ] No console.log statements (use logger)
- [ ] All components have TypeScript types
- [ ] Error boundaries where needed
- [ ] Loading states for async operations
- [ ] Proper accessibility attributes
- [ ] No unused imports
- [ ] Consistent naming conventions
- [ ] Tests added for new functionality
- [ ] Documentation updated

---

## Migration Strategy

### Step 1: Parallel Development
Work on new structure alongside existing code. Don't break existing functionality.

### Step 2: Incremental Migration
1. Create new directories
2. Move one feature at a time
3. Update imports
4. Verify functionality
5. Remove old files

### Step 3: Final Cleanup
1. Remove all duplicate files
2. Update routing
3. Run full test suite
4. Update documentation

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| ESLint errors | ~50 | 0 |
| TypeScript strict | Off | On |
| Component test coverage | ~10% | 70%+ |
| Bundle size | TBD | <500KB gzipped |
| First contentful paint | TBD | <1.5s |
| Time to interactive | TBD | <3s |

---

*Prompt generated: February 16, 2026*
*Execute incrementally, prioritizing Phase 1 (Architecture) and Phase 2 (Components)*

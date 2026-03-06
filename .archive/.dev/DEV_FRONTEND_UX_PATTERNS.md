# VIVIM UX Patterns Specification

> **Version:** 1.0  
> **Date:** March 2026  
> **Output:** `.archive.dev/DEV_FRONTEND_UX_PATTERNS.md`

---

## 1. UX Philosophy

### 1.1 Core Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Instant Feedback** | Every action has immediate response | Button press, loading state |
| **Progressive Disclosure** | Show complexity when needed | Advanced options in dropdowns |
| **Forgiveness** | Easy to undo, hard to break | Soft delete, undo, confirmation |
| **Consistency** | Same patterns everywhere | Same modals, same transitions |
| **Accessibility** | Works for everyone | Keyboard nav, screen readers |

### 1.2 Interaction Design

- **Touch-first**: All interactions work with touch
- **Mouse-friendly**: Hover states, tooltips
- **Keyboard-complete**: Full keyboard navigation

---

## 2. Animation System

### 2.1 Motion Tokens

```css
:root {
  /* Duration */
  --duration-instant: 0ms;
  --duration-fast: 75ms;
  --duration-quick: 100ms;
  --duration-normal: 150ms;
  --duration-default: 200ms;
  --duration-slow: 300ms;
  
  /* Easing */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Properties */
  --motion-properties: transform, opacity;
}
```

### 2.2 Page Transitions

```tsx
// Framer Motion page transitions
const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

// Usage with React Router
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```

### 2.3 List Animations

```tsx
// Staggered list animation
const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.2,
      ease: 'easeOut',
    },
  }),
};

function ConversationList({ conversations }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {conversations.map((conv, i) => (
        <motion.div
          key={conv.id}
          variants={listItemVariants}
          custom={i}
        >
          <ConversationCard conversation={conv} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 2.4 Micro-interactions

```tsx
// Button press effect
function AnimatedButton({ children, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

// Like/heart animation
function LikeButton({ liked }: { liked: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      animate={liked ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <HeartIcon className={liked ? 'fill-red-500 text-red-500' : ''} />
    </motion.button>
  );
}

// Input focus animation
function AnimatedInput({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className="relative">
      <motion.label
        animate={{
          y: focused || props.value ? -24 : 0,
          scale: focused || props.value ? 0.85 : 1,
          color: focused ? 'var(--color-primary-500)' : 'var(--color-gray-500)',
        }}
        className="absolute left-3 top-3"
      >
        {label}
      </motion.label>
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </div>
  );
}
```

### 2.5 Reduced Motion

```css
/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .animate-pulse,
  .animate-spin,
  .animate-bounce {
    animation: none;
  }
}
```

---

## 3. Loading States

### 3.1 Skeleton Patterns

```tsx
// Conversation list skeleton
function ConversationListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl border p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-2 w-16 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3.2 Progressive Loading

```tsx
// Show skeleton first, then content
function ProgressiveContent() {
  const { data, isLoading } = useQuery(['data']);
  
  if (isLoading) {
    return <ContentSkeleton />;
  }
  
  return <Content data={data} />;
}

// With suspense
<Suspense fallback={<ContentSkeleton />}>
  <AsyncContent />
</Suspense>
```

### 3.3 Inline Loading

```tsx
// Button loading state
function LoadingButton({ loading, children, onClick }) {
  return (
    <button 
      onClick={onClick} 
      disabled={loading}
      className="relative"
    >
      <motion.span
        animate={{ opacity: loading ? 0 : 1 }}
      >
        {children}
      </motion.span>
      {loading && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <SpinnerIcon className="animate-spin h-5 w-5" />
        </motion.span>
      )}
    </button>
  );
}
```

---

## 4. Error Handling

### 4.1 Error Boundaries

```tsx
// Error boundary component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          onReset={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

### 4.2 Error States

```tsx
// Retryable error
function ErrorState({ 
  title = 'Something went wrong',
  message,
  onRetry 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-red-100 p-4 mb-4">
        <AlertCircleIcon className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {message && (
        <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          Try again
        </button>
      )}
    </div>
  );
}
```

---

## 5. Empty States

### 5.1 Design Pattern

```
┌────────────────────────────────────────┐
│                                        │
│           [Icon - 64px]                │
│           64x64, muted color          │
│                                        │
│         Title (H3 - 24px)             │
│         font-semibold                  │
│                                        │
│     Description (Body - 16px)          │
│     text-gray-500, max-w-sm           │
│                                        │
│     ┌────────────────────────┐        │
│     │   Primary Action       │        │
│     └────────────────────────┘        │
│     ┌────────────────────────┐        │
│     │   Secondary Action     │        │
│     └────────────────────────┘        │
│                                        │
└────────────────────────────────────────┘
```

### 5.2 Examples

```tsx
// Empty conversations
function EmptyConversations() {
  return (
    <EmptyState
      icon={<MessageSquareIcon className="h-12 w-12 text-gray-400" />}
      title="No conversations yet"
      description="Capture your first AI conversation to get started"
      action={{
        label: 'Capture Conversation',
        onClick: () => navigate('/capture'),
      }}
    />
  );
}

// Empty search results
function EmptySearchResults({ query }) {
  return (
    <EmptyState
      icon={<SearchIcon className="h-12 w-12 text-gray-400" />}
      title="No results found"
      description={`We couldn't find any conversations matching "${query}"`}
      action={{
        label: 'Clear Search',
        onClick: () => clearSearch(),
      }}
    />
  );
}
```

---

## 6. Data Handling

### 6.1 Optimistic Updates

```tsx
// Optimistic mutation
function useOptimisticMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateConversation,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['conversations']);
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(['conversations']);
      
      // Optimistically update
      queryClient.setQueryData(['conversations'], (old) => 
        old.map(conv => 
          conv.id === newData.id ? { ...conv, ...newData } : conv
        )
      );
      
      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['conversations'], context?.previousData);
      toast.error('Failed to update');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['conversations']);
    },
  });
}
```

### 6.2 Infinite Scroll

```tsx
// Infinite scroll hook
function useInfiniteScroll({ 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage 
}) {
  const observerRef = useRef<IntersectionObserver>();
  
  const lastElementRef = useCallback((node) => {
    if (isFetchingNextPage) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);
  
  return lastElementRef;
}

// Usage
function ConversationList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({...});
  
  const lastRef = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });
  
  return (
    <div>
      {data.pages.map(page => 
        page.conversations.map(conv => (
          <ConversationCard key={conv.id} {...conv} />
        ))
      ))}
      
      <div ref={lastRef}>
        {isFetchingNextPage && <LoadingMore />}
      </div>
    </div>
  );
}
```

---

## 7. Gestures (Mobile)

### 7.1 Swipe Actions

```tsx
// Swipeable list item
function SwipeableItem({ 
  leftActions, 
  rightActions, 
  children 
}) {
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  
  return (
    <div className="relative overflow-hidden">
      {/* Left actions */}
      <div className="absolute inset-y-0 left-0 flex items-center gap-2 px-4 bg-gray-100">
        {leftActions}
      </div>
      
      {/* Right actions */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 bg-red-500 text-white">
        {rightActions}
      </div>
      
      {/* Content */}
      <MotionDiv
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset, velocity }) => {
          const swipe = Math.abs(offset.x) * velocity.x;
          
          if (swipe < -100) {
            setIsSwipeOpen(true);
          } else if (swipe > 100) {
            setIsSwipeOpen(false);
          }
        }}
      >
        {children}
      </MotionDiv>
    </div>
  );
}
```

### 7.2 Pull to Refresh

```tsx
// Pull to refresh hook
function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { y, scrollY } = useScroll();
  
  useEffect(() => {
    if (y.get() < -60 && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh().finally(() => setIsRefreshing(false));
    }
  }, [y.get()]);
  
  return (
    <motion.div
      style={{ 
        height: isRefreshing ? 60 : Math.max(0, -y.get()),
        opacity: Math.min(1, -y.get() / 60),
      }}
    >
      <SpinnerIcon className={isRefreshing ? 'animate-spin' : ''} />
    </motion.div>
  );
}
```

---

## 8. Form Patterns

### 8.1 Field Validation

```tsx
// Form with validation
function CaptureForm() {
  const form = useForm({
    resolver: zodResolver(captureSchema),
    defaultValues: {
      url: '',
      title: '',
    },
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        label="URL"
        error={form.formState.errors.url?.message}
      >
        <Input 
          {...form.register('url')} 
          placeholder="https://chat.openai.com/..."
        />
      </FormField>
      
      <FormField
        label="Title (optional)"
        error={form.formState.errors.title?.message}
      >
        <Input 
          {...form.register('title')} 
          placeholder="Conversation title"
        />
      </FormField>
      
      <Button type="submit" loading={isSubmitting}>
        Capture
      </Button>
    </form>
  );
}
```

### 8.2 Auto-save

```tsx
// Auto-save form
function SettingsForm() {
  const [formState, setFormState] = useState(initialState);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Debounced save
  useEffect(() => {
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      await saveSettings(formState);
      setSaveStatus('saved');
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [formState]);
  
  return (
    <form>
      <Input 
        value={formState.name}
        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
      />
      
      <div className="text-sm text-gray-500">
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && 'Saved'}
      </div>
    </form>
  );
}
```

---

## 9. Accessibility Patterns

### 9.1 Focus Management

```tsx
// Focus trap in modal
function ModalWithFocusTrap({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <Dialog.Panel ref={modalRef} tabIndex={-1}>
        <FocusTrap>
          {children}
        </FocusTrap>
      </Dialog.Panel>
    </Dialog>
  );
}

// Return focus after close
function MenuWithFocus({ isOpen, onClose, triggerRef }) {
  return (
    <Transition>
      {isOpen && (
        <FocusTrap
          onDeactivate={() => {
            onClose();
            triggerRef.current?.focus();
          }}
        >
          {/* Menu content */}
        </FocusTrap>
      )}
    </Transition>
  );
}
```

### 9.2 Live Regions

```tsx
// Announce changes to screen readers
function LiveRegion({ message, politeness = 'polite' }) {
  return (
    <div 
      role="status" 
      aria-live={politeness} 
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Usage
function DeleteAction({ onConfirm }) {
  const [announcement, setAnnouncement] = useState('');
  
  const handleDelete = async () => {
    setAnnouncement('Deleting conversation...');
    await onConfirm();
    setAnnouncement('Conversation deleted');
    setTimeout(() => setAnnouncement(''), 3000);
  };
  
  return (
    <>
      <button onClick={handleDelete}>Delete</button>
      <LiveRegion message={announcement} />
    </>
  );
}
```

---

## 10. Responsive Behavior

### 10.1 Touch vs Click

```tsx
// Unified interaction handler
function UnifiedButton({ onTap, onLongPress, children }) {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => {
        setIsPressed(false);
        onTap?.();
      }}
      onPointerLeave={() => setIsPressed(false)}
    >
      {children}
    </motion.button>
  );
}
```

### 10.2 Adaptive Layout

```tsx
// Adaptive two-column layout
function AdaptiveLayout() {
  const { isDesktop } = useBreakpoint();
  
  return (
    <div className={isDesktop ? 'grid grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
      <div className={isDesktop ? 'col-span-2' : ''}>
        <MainContent />
      </div>
      {isDesktop && (
        <aside>
          <Sidebar />
        </aside>
      )}
    </div>
  );
}
```

---

## 11. Testing Checklist

### 11.1 Animation Testing

- [ ] All animations respect reduced-motion
- [ ] Animations are 60fps
- [ ] No layout thrashing
- [ ] Transitions are smooth

### 11.2 State Testing

- [ ] Loading states show immediately
- [ ] Error states are recoverable
- [ ] Empty states guide user action
- [ ] Optimistic updates feel instant

### 11.3 Interaction Testing

- [ ] Touch targets are 44x44px minimum
- [ ] All interactions work with keyboard
- [ ] Swipe gestures work on mobile
- [ ] Pull to refresh works

---

*This specification provides comprehensive UX patterns for building a delightful, accessible, and performant VIVIM frontend.*

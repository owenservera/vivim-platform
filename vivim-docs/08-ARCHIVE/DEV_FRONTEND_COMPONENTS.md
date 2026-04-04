# VIVIM Component Library Specification

> **Version:** 1.0  
> **Date:** March 2026  
> **Output:** `.archive.dev/DEV_FRONTEND_COMPONENTS.md`

---

## 1. Component Architecture

### 1.1 Design Principles

| Principle | Description |
|-----------|-------------|
| **Composition** | Build complex components from simple ones |
| **Consistency** | Same props produce same results |
| **Accessibility** | Built-in a11y, no afterthought |
| **Performance** | Minimal re-renders, lazy loading |
| **Type Safety** | Full TypeScript support |

### 1.2 Component Structure

```
src/components/
├── ui/                    # Base primitives
│   ├── Button/
│   ├── Input/
│   ├── Card/
│   ├── Modal/
│   ├── Drawer/
│   ├── Select/
│   ├── Dropdown/
│   ├── Checkbox/
│   ├── Radio/
│   ├── Toggle/
│   ├── Badge/
│   ├── Avatar/
│   ├── Skeleton/
│   ├── Spinner/
│   └── ...
├── layout/                 # Layout components
│   ├── Page/
│   ├── Section/
│   ├── Container/
│   ├── Grid/
│   ├── Stack/
│   └── Divider/
├── navigation/            # Navigation
│   ├── Navbar/
│   ├── Sidebar/
│   ├── BottomNav/
│   ├── Breadcrumb/
│   ├── Tabs/
│   └── Pagination/
├── feedback/              # Feedback
│   ├── Alert/
│   ├── Toast/
│   ├── Progress/
│   ├── Skeleton/
│   └── EmptyState/
├── forms/                 # Form components
│   ├── Form/
│   ├── Field/
│   ├── Label/
│   ├── ErrorMessage/
│   └── helpers/
└── index.ts              # Public exports
```

---

## 2. Base Components

### 2.1 Button

```tsx
// src/components/ui/Button/Button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
        outline: "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
        destructive: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
        link: "text-primary-500 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <SpinnerIcon className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**Usage:**
```tsx
<Button variant="primary" size="md">Click me</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon"><TrashIcon /></Button>
<Button variant="destructive" size="lg" loading>Deleting...</Button>
```

### 2.2 Input

```tsx
// src/components/ui/Input/Input.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, type, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### 2.3 Card

```tsx
// src/components/ui/Card/Card.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  "rounded-xl border bg-white dark:bg-gray-800 transition-all duration-150",
  {
    variants: {
      variant: {
        default: "border-gray-200 dark:border-gray-700",
        elevated: "border-transparent shadow-md hover:shadow-lg",
        outline: "border-2 border-gray-200 dark:border-gray-700",
        ghost: "border-transparent",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding }),
          interactive && "cursor-pointer hover:border-primary-200 dark:hover:border-primary-800",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// Sub-components
export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />
  )
);

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
);

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-gray-500 dark:text-gray-400", className)} {...props} />
  )
);

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center pt-4", className)} {...props} />
  )
);
```

### 2.4 Modal/Dialog

```tsx
// src/components/ui/Modal/Modal.tsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export function Modal({ open, onClose, children, size = 'md', showClose = true }: ModalProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  "w-full transform rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all",
                  sizeClasses[size]
                )}
              >
                {showClose && (
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Close"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### 2.5 Drawer

```tsx
// src/components/ui/Drawer/Drawer.tsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: "max-w-xs",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Drawer({ open, onClose, children, side = 'right', size = 'md' }: DrawerProps) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className={cn("absolute inset-y-0 overflow-y-auto", 
            side === 'right' ? "right-0" : "left-0"
          )}>
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom={side === 'right' ? 'translate-x-full' : '-translate-x-full'}
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo={side === 'right' ? 'translate-x-full' : '-translate-x-full'}
            >
              <div className={cn(
                "h-full w-screen max-w-xs p-4",
                sizeClasses[size],
                side === 'right' ? "ml-auto" : "mr-auto"
              )}>
                <div className="h-full rounded-xl bg-white dark:bg-gray-800 shadow-lg p-4">
                  {children}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
```

### 2.6 Select

```tsx
// src/components/ui/Select/Select.tsx
import { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function Select({ options, value, onChange, placeholder = 'Select...', disabled, error }: SelectProps) {
  const selected = options.find(opt => opt.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Listbox.Button
          className={cn(
            "relative w-full cursor-pointer rounded-lg border bg-white dark:bg-gray-800 py-2.5 pl-3 pr-10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:text-sm",
            error ? "border-red-500" : "border-gray-200 dark:border-gray-700"
          )}
        >
          <span className={cn("block truncate", !selected && "text-gray-400")}>
            {selected?.label || placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
          </span>
        </Listbox.Button>
        
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {options.map((option, idx) => (
              <Listbox.Option
                key={idx}
                value={option.value}
                disabled={option.disabled}
                className={({ active, selected }) =>
                  cn(
                    "relative cursor-pointer select-none py-2 pl-10 pr-4",
                    active ? "bg-primary-100 text-primary-900 dark:bg-primary-900/30" : "text-gray-900 dark:text-gray-100",
                    option.disabled && "opacity-50 cursor-not-allowed",
                    selected && "font-medium"
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <span className={cn("block truncate", selected && "font-medium")}>
                      {option.label}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-500">
                        <CheckIcon className="h-5 w-5" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
```

---

## 3. Feedback Components

### 3.1 Toast

```tsx
// src/components/feedback/Toast/Toast.tsx
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = uuidv4();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    
    // Auto remove
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration || 5000);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Toast component
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 rounded-lg p-4 shadow-lg min-w-[320px] max-w-[420px]",
            toast.type === 'success' && "bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-100",
            toast.type === 'error' && "bg-red-50 text-red-900 dark:bg-red-900/30 dark:text-red-100",
            toast.type === 'warning' && "bg-yellow-50 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100",
            toast.type === 'info' && "bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100",
            toast.type === 'loading' && "bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          )}
        >
          <ToastIcon type={toast.type} />
          <div className="flex-1">
            <p className="font-medium">{toast.title}</p>
            {toast.description && (
              <p className="text-sm opacity-80 mt-0.5">{toast.description}</p>
            )}
          </div>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline"
            >
              {toast.action.label}
            </button>
          )}
          <button onClick={() => removeToast(toast.id)}>
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 3.2 Skeleton

```tsx
// src/components/feedback/Skeleton/Skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  width, 
  height,
  ...props 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-700",
        variant === 'text' && "rounded h-4",
        variant === 'circular' && "rounded-full",
        variant === 'rectangular' && "rounded-lg",
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

// Conversation card skeleton
export function ConversationCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="20%" />
      </div>
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="rectangular" width={80} height={24} />
      </div>
    </div>
  );
}
```

### 3.3 Empty State

```tsx
// src/components/feedback/EmptyState/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 rounded-full bg-gray-100 dark:bg-gray-800 p-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

---

## 4. Layout Components

### 4.1 Page Container

```tsx
// src/components/layout/Page/Page.tsx
interface PageProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  back?: () => void;
}

export function Page({ children, title, subtitle, actions, back }: PageProps) {
  return (
    <div className="max-w-content mx-auto px-4 py-6">
      {(title || actions) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {back && (
              <button
                onClick={back}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>
            )}
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
```

---

## 5. Utility Hooks

### 5.1 useMediaQuery

```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

### 5.2 useOnlineStatus

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

---

## 6. Component Patterns

### 6.1 Compound Components

```tsx
// Example: Tabs compound component
function Tabs({ children, defaultValue }: { children: React.ReactNode; defaultValue: string }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex border-b border-gray-200">{children}</div>;
};

Tabs.Trigger = function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
        activeTab === value 
          ? "border-primary-500 text-primary-600" 
          : "border-transparent text-gray-500 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  );
};

Tabs.Content = function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) return null;
  
  return <div className="py-4">{children}</div>;
};
```

### 6.2 Render Props

```tsx
// Example: AsyncData render prop
function AsyncData<T>({ 
  fetchFn, 
  children 
}: { 
  fetchFn: () => Promise<T>; 
  children: (state: { data: T; loading: boolean; error: Error | null }) => React.ReactNode 
}) {
  const [state, setState] = useState<{ data: T; loading: boolean; error: Error | null }>({
    data: null as any,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchFn()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null as any, loading: false, error }));
  }, [fetchFn]);

  return <>{children(state)}</>;
}

// Usage
<AsyncData fetchFn={() => getConversations()}>
  {({ data, loading, error }) => (
    loading ? <Skeleton /> : <ConversationList conversations={data} />
  )}
</AsyncData>
```

---

## 7. Testing

### 7.1 Component Props Tests

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Loading');
  });

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-500');
  });
});
```

---

*This specification provides a complete component library architecture for the VIVIM frontend redesign.*

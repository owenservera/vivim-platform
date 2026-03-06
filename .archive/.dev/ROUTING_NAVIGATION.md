# Routing & Navigation Specification

> **Purpose:** Document page routes and navigation structure  
> **Current:** `pwa/src/router/routes.tsx`  
> **Goal:** Clear navigation pattern for redesign

---

## 1. Route Overview

### 1.1 All Routes

| Path | Component | Auth | Notes |
|------|-----------|------|-------|
| `/` | Home | Yes | Main feed |
| `/login` | Login | No | Authentication |
| `/search` | Search | Yes | Global search |
| `/analytics` | Analytics | Yes | Usage stats |
| `/bookmarks` | Bookmarks | Yes | Saved items |
| `/capture` | Capture | Yes | Import conversations |
| `/simple-capture` | CaptureSimple | Yes | Simplified capture |
| `/conversation/:id` | ConversationView | Yes | View conversation |
| `/settings` | Settings | No | App settings |
| `/settings/ai` | ContextRecipes | No | AI configuration |
| `/account` | Account | Yes | User account |
| `/collections` | Collections | Yes | All collections |
| `/archive` | Archive | Yes | Archive (nested) |
| `/archive/imported` | ArchiveImported | Yes | Imported content |
| `/archive/active` | ArchiveActive | Yes | Active convos |
| `/archive/shared` | ArchiveShared | Yes | Shared with me |
| `/archive/collections` | ArchiveCollections | Yes | Archive collections |
| `/archive/collections/:id` | CollectionDetail | Yes | Collection view |
| `/archive/search` | ArchiveSearch | Yes | Archive search |
| `/chat` | AIChat | Yes | AI chat interface |
| `/chain-chat` | BlockchainAIChat | Yes | Blockchain chat |
| `/identity` | IdentitySetup | No | Identity setup |
| `/storage` | StorageDashboard | Yes | Storage stats |
| `/ai-conversations` | AIConversationsPage | Yes | AI convos list |
| `/ai/conversation/:id` | AIConversationsPage | Yes | AI convo detail |
| `/for-you` | ForYou | Yes | Personalized feed |
| `/byok` | BYOKChat | Yes | BYOK chat |
| `/context-components` | ContextComponents | Yes | Context manager |
| `/context-cockpit` | ContextCockpitPage | Yes | Context cockpit |
| `/conversation/:id/share` | Share | Yes | Share dialog |
| `/receive/:code` | Receive | Yes | Receive content |
| `/errors` | ErrorDashboard | Yes | Error viewer |
| `/admin` | AdminPanel | No | Admin interface |
| `*` | 404 | No | Not found |

### 1.2 Route Groups

**Authenticated Routes:**
- Require auth check via `AuthGuard` component
- Redirect to `/login` if not authenticated

**Public Routes:**
- `/login`
- `/identity`
- `/settings` (partial)
- `/admin` (partial)

---

## 2. Navigation Structure

### 2.1 Mobile Navigation (Bottom Nav)

**Items:**
1. Home (`/`)
2. Search (`/search`)
3. Capture (`/capture`) - **Center, prominent**
4. Archive (`/archive`)
5. Profile (`/account`)

**Visual:**
```
┌───┬───┬───────────┬───┬───┐
│ 🏠 │ 🔍 │    ➕    │ 📁 │ 👤 │
│Home│Search│Capture│Archive│Profile│
└───┴───┴───────────┴───┴───┘
```

**Capture FAB:**
- Large, centered button
- Primary color gradient
- Tap opens capture options

### 2.2 Desktop Navigation (Sidebar)

**Items:**
1. Home (`/`)
2. Search (`/search`)
3. Archive (`/archive`)
4. Collections (`/collections`)
5. For You (`/for-you`)
6. Bookmarks (`/bookmarks`)
7. --- divider ---
8. Context Cockpit (`/context-cockpit`)
9. Storage (`/storage`)
10. --- divider ---
11. Settings (`/settings`)
12. Account (`/account`)

**Visual:**
```
┌────────────────────┐
│       LOGO         │
├────────────────────┤
│ 🏠 Home            │
│ 🔍 Search          │
│ 📁 Archive         │
│ 📚 Collections     │
│ ✨ For You         │
│ 🔖 Bookmarks       │
├────────────────────�
│ 🧠 Context         │
│ 💾 Storage         │
├────────────────────┤
│ ⚙️ Settings        │
│ 👤 Account         │
└────────────────────┘
    (260px width)
```

### 2.3 Navigation Mapping

| Mobile | Desktop | Path | Label |
|--------|---------|------|-------|
| Home | Home | `/` | Home |
| Search | Search | `/search` | Search |
| (FAB) | - | `/capture` | Capture |
| Archive | Archive | `/archive` | Archive |
| Profile | Collections | `/collections` | Collections |
| - | For You | `/for-you` | For You |
| - | Bookmarks | `/bookmarks` | Bookmarks |
| - | Context Cockpit | `/context-cockpit` | Context |
| - | Storage | `/storage` | Storage |
| Settings | Settings | `/settings` | Settings |
| Account | Account | `/account` | Account |

---

## 3. Page Categories

### 3.1 Feed & Discovery

| Page | Path | Purpose |
|------|------|---------|
| Home | `/` | Main conversation feed |
| For You | `/for-you` | Personalized recommendations |
| Search | `/search` | Global search |
| Archive | `/archive/*` | Archived content |

### 3.2 Conversation

| Page | Path | Purpose |
|------|------|---------|
| ConversationView | `/conversation/:id` | View single conversation |
| AIConversationsPage | `/ai-conversations` | List AI conversations |
| AIChat | `/chat` | Chat interface |
| Share | `/conversation/:id/share` | Share dialog |
| Receive | `/receive/:code` | Receive shared |

### 3.3 Capture & Import

| Page | Path | Purpose |
|------|------|---------|
| Capture | `/capture` | Import conversations |
| CaptureSimple | `/simple-capture` | Simple capture |

### 3.4 Collections

| Page | Path | Purpose |
|------|------|---------|
| Collections | `/collections` | All collections |
| CollectionDetail | `/archive/collections/:id` | Single collection |

### 3.5 Context & AI

| Page | Path | Purpose |
|------|------|---------|
| ContextComponents | `/context-components` | Manage contexts |
| ContextCockpitPage | `/context-cockpit` | Context cockpit |
| ContextRecipes | `/settings/ai` | AI recipes |

### 3.6 Settings & Account

| Page | Path | Purpose |
|------|------|---------|
| Settings | `/settings` | App settings |
| Account | `/account` | User account |
| IdentitySetup | `/identity` | Identity setup |

### 3.7 Admin & System

| Page | Path | Purpose |
|------|------|---------|
| AdminPanel | `/admin` | Admin dashboard |
| StorageDashboard | `/storage` | Storage management |
| Analytics | `/analytics` | Usage analytics |
| ErrorDashboard | `/errors` | Error logs |

---

## 4. Layout Patterns

### 4.1 Standard Page Layout

```tsx
// Standard authenticated page
<PageWrapper>
  <PageHeader 
    title="Page Title"
    subtitle="Optional subtitle"
    actions={<ActionButton />}
  />
  <PageContent>
    {/* Main content */}
  </PageContent>
</PageWrapper>
```

### 4.2 List Page Layout

```tsx
// Archive, Collections, Search
<PageWrapper>
  <FilterBar />     // Search, filters, view toggle
  <ContentGrid>    // Cards or list
    {items.map(item => (
      <ItemCard key={item.id} {...item} />
    ))}
  </ContentGrid>
  <Pagination />   // Or infinite scroll
</PageWrapper>
```

### 4.3 Detail Page Layout

```tsx
// ConversationView, CollectionDetail
<DetailPageWrapper>
  <DetailHeader 
    title={title}
    meta={meta}
    actions={actions}
  />
  <DetailContent>
    {children}
  </DetailContent>
  <DetailSidebar>   // Optional
    {sidebar}
  </DetailSidebar>
</DetailPageWrapper>
```

---

## 5. Navigation Components

### 5.1 Required Components

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Root layout with nav |
| `Sidebar` | Desktop navigation |
| `MobileNav` | Mobile bottom navigation |
| `TopBar` | Mobile top bar |
| `Breadcrumb` | Navigation trail |
| `PageHeader` | Page title area |
| `ActionMenu` | Context actions |

### 5.2 Component API

```tsx
// AppLayout
interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showBottomNav?: boolean;
}

// Sidebar
interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  badge?: number;
  divider?: boolean;
  children?: NavItem[];
}

// MobileNav
interface MobileNavProps {
  items: NavItem[];
  activePath: string;
  onNavigate: (path: string) => void;
}
```

---

## 6. Route Transitions

### 6.1 Animation Specs

| Transition | From | To | Duration | Easing |
|------------|------|-----|----------|--------|
| Page forward | Right | Left | 200ms | ease-out |
| Page back | Left | Right | 200ms | ease-out |
| Modal open | Fade + Scale | - | 150ms | ease-out |
| Drawer open | Slide from right | - | 200ms | ease-out |
| Bottom sheet | Slide from bottom | - | 200ms | ease-out |

### 6.2 Implementation

```tsx
// Using Framer Motion
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```

---

## 7. Deep Linking

### 7.1 URL Patterns

| Resource | Pattern | Example |
|----------|---------|---------|
| Conversation | `/conversation/:id` | `/conversation/abc123` |
| AI Conversation | `/ai/conversation/:id` | `/ai/conversation/xyz789` |
| Collection | `/archive/collections/:id` | `/archive/collections/col_456` |
| Shared | `/receive/:code` | `/receive/abc123def` |

### 7.2 External Links

Support for:
- Direct conversation links
- Shared collection links  
- Deep link recovery codes

---

## 8. Auth Flow

### 8.1 Route Protection

```tsx
// AuthGuard component
const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};
```

### 8.2 Login Redirect

```tsx
// After login, redirect to:
const getRedirectPath = () => {
  const from = location.state?.from?.pathname;
  return from || '/';
};
```

---

## 9. Not Found Handling

### 9.1 404 Page

```tsx
const NotFound = () => (
  <EmptyState
    icon={<AlertCircle />}
    title="Page not found"
    description="The page you're looking for doesn't exist."
    action={{
      label: 'Go Home',
      href: '/'
    }}
  />
);
```

### 9.2 404 Routes

```tsx
// Catch-all route
{
  path: '*',
  element: <NotFound />
}
```

---

## 10. Implementation Checklist

### Required Components

- [ ] `AppLayout` - Main layout wrapper
- [ ] `Sidebar` - Desktop navigation
- [ ] `MobileNav` - Bottom navigation
- [ ] `TopBar` - Mobile header
- [ ] `NavItem` - Individual nav item
- [ ] `PageHeader` - Page title section
- [ ] `Breadcrumb` - Navigation trail

### Route Updates

- [ ] Consolidate route definitions
- [ ] Add proper meta tags per route
- [ ] Implement route-based code splitting
- [ ] Add transition animations

### Navigation Updates

- [ ] Remove iOS-specific components
- [ ] Unify mobile/desktop nav
- [ ] Add keyboard navigation
- [ ] Improve active states

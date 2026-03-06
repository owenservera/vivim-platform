# VIVIM PWA Specification

> **Version:** 1.0  
> **Date:** March 2026  
> **Output:** `.archive.dev/DEV_FRONTEND_PWA_SPEC.md`

---

## 1. PWA Overview

### 1.1 Goals

| Goal | Target |
|------|--------|
| Installable | Users can install on any device |
| Offline-first | Works without internet |
| Native feel | Feels like a native app |
| Discoverable | Appears in app stores (optional) |
| Linkable | Shareable via URL |

### 1.2 PWA Features

| Feature | Status | Implementation |
|---------|--------|----------------|
| Web App Manifest | Required | manifest.json |
| Service Worker | Required | sw.js with Workbox |
| Offline Support | Required | Cache-first for shell, network-first for API |
| Install Prompt | Required | beforeinstallprompt |
| Background Sync | Optional | For offline mutations |
| Push Notifications | Optional | Web Push API |
| Share Target | Optional | Web Share Target API |

---

## 2. Web App Manifest

### 2.1 Manifest File

**Location:** `public/manifest.json`

```json
{
  "name": "VIVIM - Your AI Memory",
  "short_name": "VIVIM",
  "description": "Own, search, and share your AI conversations",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#FAFAFA",
  "theme_color": "#6366F1",
  "categories": ["productivity", "utilities"],
  "lang": "en-US",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home-desktop.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "VIVIM Home on Desktop"
    },
    {
      "src": "/screenshots/home-mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "VIVIM Home on Mobile"
    }
  ],
  "shortcuts": [
    {
      "name": "New Conversation",
      "short_name": "New",
      "description": "Start a new conversation",
      "url": "/chat",
      "icons": [
        {
          "src": "/icons/shortcut-new.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Capture",
      "short_name": "Capture",
      "description": "Capture a conversation",
      "url": "/capture",
      "icons": [
        {
          "src": "/icons/shortcut-capture.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Search",
      "short_name": "Search",
      "description": "Search conversations",
      "url": "/search",
      "icons": [
        {
          "src": "/icons/shortcut-search.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false
}
```

### 2.2 Manifest Link

```html
<!-- In index.html <head> -->
<link rel="manifest" href="/manifest.json">
<link rel="icon" type="image/png" href="/icons/icon-192x192.png">
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
<meta name="theme-color" content="#6366F1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="VIVIM">
```

---

## 3. Service Worker

### 3.1 Service Worker Registration

```typescript
// src/lib/service-worker.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        console.log('SW registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    });
  }
}
```

### 3.2 Service Worker Strategy (sw.js)

```javascript
// public/sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { 
  CacheFirst, 
  NetworkFirst, 
  StaleWhileRevalidate 
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// HTML - Network First
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'html-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 }),
    ],
  })
);

// CSS - Stale While Revalidate
registerRoute(
  ({ request }) => request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'css-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 86400 }),
    ],
  })
);

// JS - Cache First
registerRoute(
  ({ request }) => request.destination === 'script',
  new CacheFirst({
    cacheName: 'js-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 31536000 }),
    ],
  })
);

// Images - Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 2592000 }),
    ],
  })
);

// Fonts - Cache First
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 31536000 }),
    ],
  })
);

// API - Network First with offline fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 300 }),
    ],
  })
);

// Handle offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});
```

### 3.3 Offline Page

```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - VIVIM</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #FAFAFA;
      color: #111827;
    }
    .container { text-align: center; padding: 24px; }
    h1 { margin-bottom: 8px; }
    p { color: #6B7280; margin-bottom: 24px; }
    button {
      background: #6366F1;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
    button:hover { background: #4F46E5; }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're offline</h1>
    <p>Check your internet connection and try again.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
```

---

## 4. Offline Data Strategy

### 4.1 IndexedDB for Offline Data

```typescript
// src/lib/storage/offline-store.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VivimDB extends DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: { 'by-date': string; 'by-provider': string };
  };
  messages: {
    key: string;
    value: Message;
    indexes: { 'by-conversation': string };
  };
  pendingMutations: {
    key: string;
    value: Mutation;
  };
  cache: {
    key: string;
    value: { data: any; timestamp: number };
  };
}

let db: IDBPDatabase<VivimDB>;

export async function initDB(): Promise<IDBPDatabase<VivimDB>> {
  if (db) return db;
  
  db = await openDB<VivimDB>('vivim-db', 1, {
    upgrade(database) {
      // Conversations store
      const conversationStore = database.createObjectStore('conversations', {
        keyPath: 'id',
      });
      conversationStore.createIndex('by-date', 'createdAt');
      conversationStore.createIndex('by-provider', 'provider');
      
      // Messages store
      const messageStore = database.createObjectStore('messages', {
        keyPath: 'id',
      });
      messageStore.createIndex('by-conversation', 'conversationId');
      
      // Pending mutations for offline sync
      database.createObjectStore('pendingMutations', {
        keyPath: 'id',
        autoIncrement: true,
      });
      
      // General cache
      database.createObjectStore('cache');
    },
  });
  
  return db;
}
```

### 4.2 Pending Mutations Queue

```typescript
// src/lib/sync/mutation-queue.ts
interface Mutation {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'conversation' | 'message' | 'collection';
  data: any;
  timestamp: number;
  retries: number;
}

export async function queueMutation(mutation: Omit<Mutation, 'id' | 'timestamp' | 'retries'>) {
  const db = await initDB();
  await db.add('pendingMutations', {
    ...mutation,
    timestamp: Date.now(),
    retries: 0,
  });
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    await processMutationQueue();
  }
}

export async function processMutationQueue() {
  const db = await initDB();
  const mutations = await db.getAll('pendingMutations');
  
  for (const mutation of mutations) {
    try {
      await executeMutation(mutation);
      await db.delete('pendingMutations', mutation.id!);
    } catch (error) {
      // Increment retry count
      await db.put('pendingMutations', {
        ...mutation,
        retries: mutation.retries + 1,
      });
      
      // If too many retries, move to failed
      if (mutation.retries >= 3) {
        await markMutationFailed(mutation);
      }
    }
  }
}
```

### 4.3 Sync Status Indicator

```tsx
// src/components/SyncIndicator.tsx
import { useSyncStatus } from '@/hooks/useSyncStatus';

export function SyncIndicator() {
  const { status, pendingCount, lastSynced, error } = useSyncStatus();
  
  if (status === 'synced') {
    return (
      <div className="sync-indicator synced">
        <CheckIcon />
        <span>Synced</span>
      </div>
    );
  }
  
  if (status === 'syncing') {
    return (
      <div className="sync-indicator syncing">
        <SpinnerIcon />
        <span>Syncing...</span>
      </div>
    );
  }
  
  if (status === 'pending') {
    return (
      <div className="sync-indicator pending">
        <CloudOffIcon />
        <span>{pendingCount} pending</span>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="sync-indicator error">
        <AlertIcon />
        <span>Sync error</span>
      </div>
    );
  }
  
  return null;
}
```

---

## 5. Install Experience

### 5.1 Custom Install Prompt

```tsx
// src/components/InstallPrompt.tsx
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  if (!deferredPrompt || dismissed) return null;
  
  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };
  
  return (
    <div className="install-banner">
      <div className="install-content">
        <AppIcon />
        <div>
          <h3>Install VIVIM</h3>
          <p>Add to your home screen for quick access</p>
        </div>
      </div>
      <div className="install-actions">
        <button onClick={() => setDismissed(true)}>Not now</button>
        <button onClick={handleInstall}>Install</button>
      </div>
    </div>
  );
}
```

### 5.2 iOS Install Banner

```tsx
// iOS-specific install prompt
export function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !window.MSStream
    );
  }, []);
  
  if (!isIOS || dismissed) return null;
  
  return (
    <div className="ios-install-banner">
      <div className="ios-install-content">
        <p>
          Tap <ShareIcon /> then <AddIcon /> to add VIVIM to your Home Screen
        </p>
        <button onClick={() => setDismissed(true)}>Got it</button>
      </div>
    </div>
  );
}
```

---

## 6. Background Sync

### 6.1 Register Background Sync

```typescript
// Register for background sync
async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register('sync-mutations');
  }
}

// In mutation function
async function createConversation(data: ConversationData) {
  // Optimistic update
  const tempId = `temp-${Date.now()}`;
  const conversation = { ...data, id: tempId };
  
  // Save locally first
  await saveConversationLocally(conversation);
  
  try {
    // Try API
    const response = await apiClient.post('/conversations', data);
    
    // Update local with real ID
    await updateConversationId(tempId, response.data.id);
  } catch (error) {
    // Queue for later sync
    await queueMutation({
      type: 'CREATE',
      entity: 'conversation',
      data,
    });
    
    // Register background sync
    await registerBackgroundSync();
  }
}
```

### 6.2 Service Worker Sync Handler

```javascript
// sw.js - Background sync handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncMutations());
  }
});

async function syncMutations() {
  const db = await openDB();
  const mutations = await db.getAll('pending-mutations');
  
  for (const mutation of mutations) {
    try {
      await executeMutation(mutation);
      await db.delete('pending-mutations', mutation.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

---

## 7. Push Notifications

### 7.1 Notification Permission

```typescript
// Request notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  
  if (Notification.permission === 'granted') return 'granted';
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
}
```

### 7.2 Push Subscription

```typescript
// Subscribe to push notifications
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  
  await apiClient.post('/push/subscribe', subscription);
}
```

### 7.3 Notification Handling

```typescript
// Service worker - Push event
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'VIVIM', options)
  );
});

// Service worker - Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
```

---

## 8. Web Share Target

### 8.1 Manifest Configuration

```json
{
  "share_target": {
    "action": "/share",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### 8.2 Handle Shared Content

```tsx
// src/pages/Share.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function SharedContentHandler() {
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  
  useEffect(() => {
    const handleSharedContent = async () => {
      const title = searchParams.get('title');
      const text = searchParams.get('text');
      const url = searchParams.get('url');
      
      // Process shared content
      if (title || text || url) {
        await processSharedContent({ title, text, url });
      }
      
      setProcessing(false);
    };
    
    handleSharedContent();
  }, [searchParams]);
  
  if (processing) {
    return <LoadingScreen />;
  }
  
  return <Redirect to="/" />;
}
```

---

## 9. PWA Icons

### 9.1 Required Sizes

| Size | File | Purpose |
|------|------|---------|
| 72x72 | icon-72x72.png | Android small |
| 96x96 | icon-96x96.png | Android |
| 128x128 | icon-128x128.png | Chrome Web Store |
| 144x144 | icon-144x144.png | Windows Tiles |
| 152x152 | icon-152x152.png | iPad |
| 192x192 | icon-192x192.png | Android, PWA |
| 384x384 | icon-384x384.png | Android large |
| 512x512 | icon-512x512.png | PWA, iOS |

### 9.2 Icon Guidelines

- Background: Transparent or match theme_color
- Shape: Rounded square (20-30% radius)
- Minimum visible area: 66% of canvas
- Single color or gradient
- Test at all sizes

---

## 10. Testing Checklist

### 10.1 Chrome Lighthouse

- [ ] PWA Optimized: ✓
- [ ] Installable: ✓
- [ ] PWA meets installability criteria
- [ ] Has a registered service worker
- [ ] Manifest start_url loads offline
- [ ] Has a manifest with all required properties

### 10.2 Manual Testing

- [ ] Install on Android Chrome
- [ ] Install on iOS Safari
- [ ] Install on Desktop Chrome
- [ ] Test offline mode
- [ ] Test offline navigation
- [ ] Test push notifications
- [ ] Test share target

---

*This PWA specification provides complete implementation details for making VIVIM a fully installable, offline-capable web application.*

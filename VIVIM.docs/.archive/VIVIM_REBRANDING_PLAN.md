# VIVIM Rebranding Plan

> **Effective Date:** February 9, 2026  
> **Status:** In Progress  
> **Goal:** Transform OpenScroll → VIVIM across all codebases

---

## 1. Brand Identity

### VIVIM Brand Guidelines

| Element | Value |
|---------|--------|
| **Name** | VIVIM (pronounced "viv-im") |
| **Tagline** | "Own Your AI" |
| **Domain** | vivim.app |
| **Logo Concept** | 🔮 Crystal ball / portal motif |
| **Color Scheme** | Purple/indigo gradient (mystical + technology) |

### Key Messages

1. **Primary:** "Your AI conversations are trapped in ChatGPT, Claude, Gemini. VIVIM sets them free."
2. **Ownership:** "Your data. Your keys. Your AI. Forever."
3. **Knowledge:** "Build your second brain from AI conversations."

---

## 2. File Inventory

### 2.1 PWA Files to Update

#### `apps/pwa/index.html`
```html
<!-- BEFORE -->
<title>openscroll-pwa</title>

<!-- AFTER -->
<title>VIVIM - Own Your AI</title>
<meta name="description" content="Capture, own, and evolve your AI conversations">
```

#### `apps/pwa/package.json`
```json
{
  "name": "vivim-pwa",
  "version": "1.0.0",
  "description": "VIVIM PWA - Own Your AI"
}
```

#### `apps/pwa/src/pages/HomeNew.tsx`
```typescript
// BEFORE
<h1 className="logo">OpenScroll</h1>

// AFTER
<h1 className="logo">VIVIM</h1>
```

#### `apps/pwa/src/lib/identity/identity-service.ts`
```typescript
// BEFORE
const IDENTITY_STORAGE_KEY = 'openscroll_identity_state';
const DEVICE_ID_KEY = 'openscroll_device_id';

// AFTER
const IDENTITY_STORAGE_KEY = 'vivim_identity_state';
const DEVICE_ID_KEY = 'vivim_device_id';
```

#### `apps/pwa/src/lib/storage-v2/`
Check all IndexedDB names:
```typescript
// Before: 'openscroll_secure_keys', 'OpenScrollV2'
// After: 'vivim_secure_keys', 'VIVIM'
```

### 2.2 Server Files to Update

#### `apps/server/package.json`
```json
{
  "name": "vivim-server",
  "version": "1.0.0",
  "description": "VIVIM API - Own Your AI"
}
```

#### `apps/server/src/server.js`
```javascript
// BEFORE
console.log('║  OPENSCROLL SERVER STARTED                 ║');

// AFTER
console.log('║                    VIVIM SERVER STARTED                 ║');
```

#### `apps/server/src/routes/feed.js`
Update any OpenScroll references in logs or responses.

#### `apps/server/prisma/schema.prisma`
Update comments referencing OpenScroll.

### 2.3 Root Files to Update

#### `README.md`
Complete rewrite as VIVIM README (see template below)

---

## 3. Visual Assets

### 3.1 Logo Requirements

| Asset | Size | Format | Location |
|-------|------|--------|----------|
| PWA Icon | 192x192 | SVG | `apps/pwa/public/icon.svg` |
| PWA Icon | 512x512 | SVG | `apps/pwa/public/pwa-192x192.svg` |
| Favicon | 32x32 | ICO/SVG | `apps/pwa/public/vite.svg` |
| Logo Dark | - | SVG | `apps/pwa/src/assets/logo.svg` |
| Logo Light | - | SVG | `apps/pwa/src/assets/logo-light.svg` |

### 3.2 CSS Variables (Tailwind)

Update `apps/pwa/src/index.css`:
```css
@theme {
  --color-primary: #7c3aed;  /* Purple 600 */
  --color-primary-dark: #6d28d9;  /* Purple 700 */
  --color-secondary: #0ea5e9;  /* Sky 500 */
  --color-accent: #f59e0b;  /* Amber 500 */
  
  --font-brand: 'Inter', sans-serif;
}
```

---

## 4. API Changes

### 4.1 Endpoint Prefixes

Currently:
```
/api/v1/capture
/api/v1/feed
/api/v1/acus
```

No change needed—endpoints remain `/api/v1/*`

### 4.2 Response Format

Update API responses to use VIVIM branding:
```javascript
// BEFORE
{
  "app": "OpenScroll",
  "version": "2.0.0"
}

// AFTER
{
  "app": "VIVIM",
  "version": "1.0.0"
}
```

### 4.3 Error Messages

Update error messages in:
- `apps/server/src/middleware/errorHandler.js`
- `apps/server/src/routes/capture.js`
- `apps/server/src/routes/feed.js`

---

## 5. Database Migrations (Optional)

If you want to rename data in existing databases:

```sql
-- Rename IndexedDB stores
-- This is optional; data remains valid

-- Update user settings if they contain "openscroll"
UPDATE users 
SET settings = replace(settings::text, 'openscroll', 'vivim')::jsonb
WHERE settings LIKE '%openscroll%';
```

---

## 6. Implementation Checklist

### Phase 1: Text Changes

- [ ] `apps/pwa/index.html`
- [ ] `apps/pwa/package.json`
- [ ] `apps/server/package.json`
- [ ] `apps/server/src/server.js`
- [ ] `README.md`

### Phase 2: Code Changes

- [ ] `apps/pwa/src/pages/HomeNew.tsx`
- [ ] `apps/pwa/src/lib/identity/identity-service.ts`
- [ ] All IndexedDB key names in `apps/pwa/src/lib/storage-v2/`
- [ ] All `localStorage` keys
- [ ] All log messages

### Phase 3: Visual Assets

- [ ] Update//create logo files
- [ ] Update CSS variables
- [ ] Update PWA manifest
- [ ] Update meta tags

### Phase 4: Documentation

- [ ] Update README.md
- [ ] Update API docs (Swagger)
- [ ] Update any inline docs
- [ ] Create new screenshots

---

## 7. Rollback Plan

If VIVIM branding needs to be reverted:

```bash
# Git revert all changes
git revert --no-commit $(git diff --name-only | head -50)
git commit -m "revert: temporary VIVIM branding"
```

---

## 8. Estimated Effort

| Phase | Time |
|-------|------|
| Text Changes | 1 hour |
| Code Changes | 2-4 hours |
| Visual Assets | 1-2 days |
| Documentation | 4 hours |
| **Total** | **2-3 days** |

---

## Appendix: New README Template

```markdown
# VIVIM

> **Own Your AI**

VIVIM is a sovereign AI knowledge management system that captures, owns, evolves, and shares AI conversations.

## Features

- 🔮 **Capture** - Extract conversations from ChatGPT, Claude, Gemini, and more
- 📦 **Vault** - Personal encrypted knowledge store
- 💬 **BYOK Chat** - Continue conversations with your own API keys
- 🔀 **Fork & Remix** - Build on others' conversations
- 🌐 **Social Feed** - Discover and share AI wisdom

## Quick Start

```bash
# Start server
cd apps/server
bun install
bun run dev

# Start PWA (new terminal)
cd apps/pwa
bun install
bun run dev
```

## Documentation

- [User Journey](./docs/USER_JOURNEY.md)
- [Feature Specs](./docs/VIVIM_V1_FEATURES.md)
- [Gap Analysis](./docs/VIVIM_GAP_ANALYSIS.md)

## License

MIT

---

**Built with ❤️ by the VIVIM team**
```

---

*Document Version: 1.0*  
*Last Updated: February 9, 2026*

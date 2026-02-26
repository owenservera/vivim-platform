# VIVIM Custom Icon Library Specification

> **Purpose:** Comprehensive specification for generating a custom icon library for VIVIM  
> **Scope:** All frontend UI elements, interactive components, and core backend features  
> **Created:** February 9, 2026  
> **Version:** 1.0

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [Icon Categories](#2-icon-categories)
3. [Core Navigation Icons](#3-core-navigation-icons)
4. [Action Buttons](#4-action-buttons)
5. [Social & Engagement Icons](#5-social--engagement-icons)
6. [Content Type Icons](#6-content-type-icons)
7. [AI Provider Icons](#7-ai-provider-icons)
8. [Status & State Icons](#8-status--state-icons)
9. [Settings & Configuration Icons](#9-settings--configuration-icons)
10. [Editor & Input Icons](#10-editor--input-icons)
11. [File & Storage Icons](#11-file--storage-icons)
12. [Security & Privacy Icons](#12-security--privacy-icons)
13. [Backend Feature Icons](#13-backend-feature-icons)
14. [ACU-Specific Icons](#14-acu-specific-icons)
15. [Technical Specifications](#15-technical-specifications)
16. [Naming Conventions](#16-naming-conventions)
17. [Design Guidelines](#17-design-guidelines)
18. [Collaboration & Forking Icons](#18-collaboration--forking-icons)
19. [Knowledge Graph & VaultSense Icons](#19-knowledge-graph--vaultsense-icons)
20. [Personal Knowledgebase Icons](#20-personal-knowledgebase-icons)
21. [ACU Evolution & Lineage Icons](#21-acu-evolution--lineage-icons)
22. [Sync & Realtime Icons](#22-sync--realtime-icons)
23. [Analytics & Metrics Icons](#23-analytics--metrics-icons)

---

## 1. Design System Overview

### Design Philosophy
- **Style:** Premium, modern, light mode, minimal, collaborative
- **Primary Colors:** Soft white (#FAFAFA), Indigo (#6366F1), Violet (#8B5CF6)
- **Typography:** SF Pro Display / Inter
- **Visual Language:** Clean, breathable, generous whitespace

### Icon Design Principles

#### Size Standards
| Size | Pixels | Usage |
|------|--------|-------|
| xs | 12px | Inline text labels, badges |
| sm | 16px | Action buttons, compact UI |
| md | 18px | Standard button icons |
| lg | 20px | Tab icons, prominent actions |
| xl | 24px | Feature icons, cards |
| 2xl | 32px | Section headers, hero icons |
| 3xl | 48px | Empty states, hero sections |

#### Stroke Width
- **Standard:** 1.5px - Primary icons
- **Bold:** 2px - Active states, emphasis
- **Light:** 1px - Subtle, secondary icons

#### Corner Radius
- **Sharp:** 0px - Technical, code-related
- **Small:** 2px - Small action icons
- **Medium:** 4px - Standard rounded
- **Large:** 6px - Featured, prominent icons

---

## 2. Icon Categories

Icons are organized into 14 primary categories:

1. **Navigation** - Primary app navigation
2. **Actions** - User actions and operations
3. **Social** - Engagement and sharing
4. **Content** - Content type indicators
5. **Providers** - AI service logos
6. **Status** - State and feedback
7. **Settings** - Configuration and preferences
8. **Editor** - Text editing operations
9. **Files** - Storage and documents
10. **Security** - Privacy and protection
11. **Backend** - Server-side operations
12. **ACU** - Atomic Chat Unit specific
13. **Sync** - Synchronization states
14. **Miscellaneous** - Utility icons

---

## 3. Core Navigation Icons

### Primary Navigation (Bottom Tab Bar)

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Home/Feed** | Home icon representing main feed | Bottom nav: Feed tab (active) | `home-feed` |
| **Search** | Magnifying glass | Bottom nav: Search tab | `search` |
| **Vault** | Secure storage/archive | Bottom nav: Vault tab | `vault-closed` |
| **Profile** | User avatar/person | Bottom nav: Profile tab | `user-profile` |

### Secondary Navigation

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Back** | Arrow pointing left | Page headers, go back | `arrow-back` |
| **Forward** | Arrow pointing right | Navigation forward | `arrow-forward` |
| **Chevron Down** | Downward chevron | Expand dropdowns, accordions | `chevron-down` |
| **Chevron Up** | Upward chevron | Collapse sections | `chevron-up` |
| **Chevron Right** | Rightward chevron | Navigate deeper, drill-down | `chevron-right` |
| **Chevron Left** | Leftward chevron | Navigate back in hierarchy | `chevron-left` |
| **Menu/Hamburger** | Three horizontal lines | Mobile menu, sidebar | `menu-hamburger` |
| **Close/X** | Cross/close symbol | Modals, panels, search clear | `close-x` |

### Page Headers

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Notifications** | Bell icon | Header action | `bell-notification` |
| **Search** | Magnifying glass | Header search | `search-header` |
| **Settings** | Gear/cog | Header settings | `settings-cog` |
| **Sync Indicator** | Sync arrows | Background sync status | `sync-indicator` |

---

## 4. Action Buttons

### Primary Actions

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Capture** | Download plus symbol | Capture AI conversations | `capture-download` |
| **Add/Plus** | Plus sign | Create new item | `add-plus` |
| **Create** | Plus with circle | Create new collection/conversation | `create-new` |
| **Edit/Pencil** | Pencil tool | Edit content | `edit-pencil` |
| **Save** | Floppy disk | Save changes | `save-floppy` |
| **Delete/Trash** | Trash bin | Delete item | `delete-trash` |
| **Copy** | Duplicate/cloning | Copy to clipboard | `copy-duplicate` |
| **Move** | Arrow between folders | Move item | `move-arrow` |
| **Rename** | Label/pencil | Rename item | `rename-label` |
| **Share** | Share node network | Share item | `share-network` |

### Secondary Actions

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Fork** | Git branch symbol | Fork conversation/ACU | `git-fork-branch` |
| **Merge** | Combined branches | Merge conversations | `git-merge` |
| **Branch** | Git branch | Create branch | `git-branch` |
| **Import** | Import arrow | Import from external | `import-arrow` |
| **Export** | Export arrow | Export data | `export-arrow` |
| **Download** | Downward arrow | Download file | `download-arrow` |
| **Upload** | Upward arrow | Upload file | `upload-arrow` |
| **Refresh** | Circular refresh | Reload, sync | `refresh-circular` |
| **Retry** | Refresh with arrow | Retry failed action | `retry-arrow` |
| **Cancel** | Close with slash | Cancel operation | `cancel-slash` |

---

## 5. Social & Engagement Icons

### Engagement Actions

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Heart/Like** | Heart shape | Like ACU/conversation | `heart-like` |
| **Heart Filled** | Filled heart | Liked state | `heart-filled` |
| **Fork/Remix** | Branching symbol | Fork conversation | `fork-branch` |
| **Bookmark** | Bookmark ribbon | Save/bookmark item | `bookmark-ribbon` |
| **Bookmark Filled** | Filled bookmark | Bookmarked state | `bookmark-filled` |
| **Follow** | User plus | Follow user | `user-follow` |
| **Following** | Users group | Viewing followed | `users-following` |
| **Comment** | Speech bubble | Comment on ACU | `comment-bubble` |
| **View/Eye** | Open eye | View conversation | `eye-view` |
| **Hide/Eye Closed** | Closed eye | Hide from feed | `eye-closed` |

### Sharing

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Share** | Share nodes | Share menu trigger | `share-nodes` |
| **Copy Link** | Link chain | Copy share URL | `link-copy` |
| **QR Code** | QR pattern | Generate QR | `qr-code` |
| **External Link** | External arrow | Open external | `external-link` |
| **Twitter/X** | Twitter logo | Share to X | `social-twitter` |
| **LinkedIn** | LinkedIn logo | Share to LinkedIn | `social-linkedin` |
| **Email** | Envelope | Share via email | `email-envelope` |
| **Feed Share** | Feed broadcast | Share to VIVIM feed | `feed-broadcast` |

---

## 6. Content Type Icons

### ACU (Atomic Chat Unit) Types

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Question** | Help/question mark | Question ACU | `acu-question` |
| **Answer** | Check/verified | Answer ACU | `acu-answer` |
| **Code** | Code brackets | Code snippet ACU | `acu-code` |
| **Statement** | Quote/speech | Statement ACU | `acu-statement` |
| **Formula** | Math symbols | Math/formula ACU | `acu-formula` |
| **Table** | Grid/table | Table ACU | `acu-table` |
| **Image** | Picture/photo | Image ACU | `acu-image` |
| **Tool Call** | Wrench/tool | Tool usage ACU | `acu-tool` |
| **Tool Result** | Checkmark with tools | Tool result ACU | `acu-tool-result` |
| **Explanation** | Lightbulb/idea | Explanation ACU | `acu-explanation` |
| **Summary** | Document/list | Summary ACU | `acu-summary` |
| **Warning** | Triangle alert | Warning/error ACU | `acu-warning` |
| **Error** | X circle | Error ACU | `acu-error` |

### Message Types

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **User Message** | User avatar | User's message | `message-user` |
| **AI Message** | Bot/robot | AI response | `message-ai` |
| **System Message** | Gear/settings | System message | `message-system` |
| **Tool Message** | Wrench | Tool execution | `message-tool` |

---

## 7. AI Provider Icons

### Supported Providers

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **ChatGPT** | OpenAI logo | Provider indicator | `provider-chatgpt` |
| **Claude** | Anthropic logo | Provider indicator | `provider-claude` |
| **Gemini** | Google logo | Provider indicator | `provider-gemini` |
| **Grok** | xAI logo | Provider indicator | `provider-grok` |
| **Qwen** | Alibaba logo | Provider indicator | `provider-qwen` |
| **DeepSeek** | DeepSeek logo | Provider indicator | `provider-deepseek` |
| **Kimi** | Moonshot logo | Provider indicator | `provider-kimi` |
| **Generic AI** | Sparkles/bot | Unknown provider | `provider-generic` |

### Model Indicators

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Model** | Tag/label | Model name indicator | `model-tag` |
| **Version** | Version number | Model version | `version-tag` |
| **Temperature** | Thermometer | Temperature setting | `temperature-dial` |

---

## 8. Status & State Icons

### Loading States

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Loading Spinner** | Circular spinner | Loading state | `loading-spinner` |
| **Loading Dots** | Three animating dots | Loading state | `loading-dots` |
| **Skeleton** | Shimmer effect | Skeleton placeholder | `skeleton-shimmer` |
| **Progress** | Progress bar | Progress indicator | `progress-bar` |
| **Percentage** | Percent symbol | Progress % | `progress-percent` |

### Success/Error States

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Success/Check** | Green checkmark | Success state | `status-success` |
| **Error/Alert** | Red X circle | Error state | `status-error` |
| **Warning** | Yellow triangle | Warning state | `status-warning` |
| **Info** | Blue circle with i | Info state | `status-info` |
| **Verified** | Checkmark with shield | Verified/authenticated | `status-verified` |
| **Pending** | Clock/hourglass | Pending state | `status-pending` |

### Sync States

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Synced** | Check cloud | Fully synced | `sync-synced` |
| **Syncing** | Rotating arrows | Currently syncing | `sync-syncing` |
| **Offline** | Cloud with slash | Offline mode | `sync-offline` |
| **Conflict** | Exclamation cloud | Sync conflict | `sync-conflict` |
| **Upload** | Up arrow cloud | Uploading | `sync-upload` |
| **Download** | Down arrow cloud | Downloading | `sync-download` |

---

## 9. Settings & Configuration Icons

### Privacy Settings

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Privacy** | Shield/lock | Privacy settings | `privacy-shield` |
| **Encryption** | Key/lock | Encryption status | `encryption-key` |
| **Private** | Lock closed | Private item | `privacy-lock` |
| **Public** | Globe/earth | Public item | `privacy-public` |
| **Shared** | Users/group | Shared with others | `privacy-shared` |
| **Visibility** | Eye/visible | Visibility settings | `visibility-eye` |

### Security Settings

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Security** | Shield/badge | Security settings | `security-shield` |
| **Authentication** | Fingerprint | Auth settings | `auth-fingerprint` |
| **API Key** | Key icon | API key management | `api-key` |
| **Signature** | Signature pen | Digital signature | `signature-pen` |
| **Certificate** | Badge/cert | Certificate status | `certificate-badge` |
| **Identity** | DID/identifier | User identity | `identity-did` |

### Preferences

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Analytics** | Bar chart | Analytics settings | `analytics-chart` |
| **Notifications** | Bell | Notification prefs | `pref-notifications` |
| **Appearance** | Palette | Theme settings | `appearance-palette` |
| **Language** | Globe Aa | Language settings | `language-globe` |
| **Storage** | Database | Storage settings | `storage-database` |
| **Export** | Box/export | Export settings | `export-box` |
| **Import** | Box/import | Import settings | `import-box` |
| **Reset** | Refresh | Reset settings | `settings-reset` |

---

## 10. Editor & Input Icons

### Text Editing

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Bold** | Bold B | Bold text | `text-bold` |
| **Italic** | Italic I | Italic text | `text-italic` |
| **Underline** | Underlined U | Underline text | `text-underline` |
| **Strikethrough** | Strikethrough S | Strike text | `text-strikethrough` |
| **Code Inline** | Backticks | Inline code | `code-inline` |
| **Code Block** | Brackets block | Code block | `code-block` |
| **Quote** | Quote marks | Blockquote | `text-quote` |
| **List Bulleted** | Bullet list | Bullet list | `list-bulleted` |
| **List Numbered** | Numbered list | Numbered list | `list-numbered` |
| **Link** | Chain link | Insert link | `editor-link` |

### Input Actions

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Clear** | X circle | Clear input | `input-clear` |
| **Search** | Magnifying glass | Search input | `input-search` |
| **Send** | Paper plane | Send message | `send-plane` |
| **Attach** | Paperclip | Attach file | `attach-paperclip` |
| **Emoji** | Smiley face | Emoji picker | `emoji-smile` |
| **Mention** | @ symbol | Mention user | `mention-at` |
| **Tag/Hash** | # symbol | Add tag | `tag-hash` |

---

## 11. File & Storage Icons

### Collections & Folders

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Folder** | Standard folder | Collection icon | `folder-closed` |
| **Folder Open** | Open folder | Expanded collection | `folder-open` |
| **Folder Plus** | Folder with plus | Create collection | `folder-add` |
| **Folder Settings** | Folder with gear | Collection settings | `folder-settings` |
| **Archive** | Box/archive | Archived items | `archive-box` |
| **Bookmark** | Ribbon | Bookmarks | `bookmark-ribbon` |

### Documents

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Document** | Generic doc | Conversation document | `doc-generic` |
| **Text File** | Document with lines | Text document | `doc-text` |
| **Code File** | Document with bracket | Code file | `doc-code` |
| **Image File** | Picture frame | Image file | `doc-image` |
| **Metadata** | Tags/info | Document metadata | `doc-metadata` |

### Storage

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Database** | Cylinder DB | Database/storage | `storage-database` |
| **Disk** | Hard drive | Local storage | `storage-disk` |
| **Cloud** | Cloud storage | Cloud sync | `storage-cloud` |
| **Cache** | Cache symbol | Cache management | `storage-cache` |
| **Backup** | Shield/backup | Backup settings | `backup-shield` |

---

## 12. Security & Privacy Icons

### Encryption

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Lock** | Padlock | Locked state | `lock-closed` |
| **Unlock** | Open padlock | Unlocked state | `lock-open` |
| **Key** | Key symbol | Encryption key | `security-key` |
| **Shield** | Shield badge | Security protection | `security-shield` |
| **Certificate** | Badge cert | SSL/certificate | `certificate-badge` |
| **Verified** | Checkmark badge | Verified state | `verified-badge` |
| **Secure** | Lock with check | Secure connection | `secure-check` |

### Identity & DID

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Identity** | ID card | User identity | `identity-card` |
| **DID** | Decentralized ID | DID identifier | `did-badge` |
| **Public Key** | Key share | Public key | `key-public` |
| **Private Key** | Key secure | Private key | `key-private` |
| **Fingerprint** | Fingerprint | Identity fingerprint | `fingerprint-scan` |
| **Signature** | Pen/signature | Digital signature | `signature-pen` |

---

## 13. Backend Feature Icons

### Sync Operations

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Sync All** | Sync all data | Full sync | `sync-all` |
| **Sync Conflict** | Conflict icon | Merge conflict | `sync-conflict` |
| **Peer to Peer** | P2P nodes | Direct sync | `p2p-nodes` |
| **WebSocket** | WS symbol | WebSocket connection | `websocket-symbol` |
| **Realtime** | Lightning bolt | Real-time sync | `realtime-bolt` |
| **Queue** | Queue/list | Sync queue | `sync-queue` |

### Capture Operations

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Capture** | Download/import | Capture URL | `capture-url` |
| **Extract** | Magnifying glass | Content extraction | `extract-magnify` |
| **Scrape** | Spider/web | Web scraping | `web-scraper` |
| **Parse** | Document parser | Content parsing | `parse-document` |
| **Transform** | Arrows transformation | Data transformation | `transform-arrows` |

### API & Integration

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **API** | Plug/connector | API endpoint | `api-plug` |
| **Endpoint** | URL node | API endpoint | `endpoint-node` |
| **Webhook** | Hook/anchor | Webhook config | `webhook-anchor` |
| **Rate Limit** | Speed meter | Rate limiting | `rate-limit` |
| **Token** | Access token | Token management | `token-badge` |
| **WebAuthn** | Security key | WebAuthn/FIDO2 | `webauthn-key` |

---

## 14. ACU-Specific Icons

### ACU Operations

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **ACU** | Atom/molecule | ACU indicator | `acu-atom` |
| **Decompose** | Breaking apart | Decompose ACU | `acu-decompose` |
| **Compose** | Combining | Compose ACUs | `acu-compose` |
| **Relate** | Connecting nodes | Link ACUs | `acu-relate` |
| **Quality** | Star/badge | Quality score | `quality-star` |
| **Score** | Number/badge | Relevance score | `score-badge` |

### Collaboration

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Collaborators** | Multiple avatars | Contributor count | `collaborators` |
| **Contributors** | User group | People who contributed | `contributors` |
| **Fork Tree** | Branching tree | Fork history | `fork-tree` |
| **Version History** | Time/menu | Version timeline | `version-history` |
| **Remix** | Combined forks | Remix culture | `remix-combine` |

---

## 15. Technical Specifications

### SVG Requirements

#### ViewBox Standards
- **Standard:** `0 0 24 24` (24x24 grid)
- **Wide:** `0 0 32 24` (for wide icons)
- **Tall:** `0 0 24 32` (for tall icons)

#### Color Handling
```css
/* Stroke-based icons (recommended) */
.icon {
  stroke: currentColor;
  stroke-width: 1.5;
  fill: none;
}

/* Fill-based icons (when appropriate) */
.icon-filled {
  fill: currentColor;
  stroke: none;
}

/* Multi-color icons */
.icon-multi {
  /* Use CSS variables for colors */
  --primary-color: #6366F1;
  --secondary-color: #8B5CF6;
}
```

#### Animation Support
```css
/* Spin animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.icon-spin {
  animation: spin 1s linear infinite;
}

/* Pulse animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.icon-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Hover states */
.icon:hover {
  transform: scale(1.1);
}
```

### Component Usage Examples

```tsx
// Basic usage
import { Icon } from './components/Icon';
import { Home, Search, Bell } from './icons';

// Tab bar
<Tab icon={<Home />} label="Feed" active />

// Button with icon
<Button icon={<Plus />} label="Add New" />

// Status indicator
<Badge icon={<CheckCircle />} status="success" />

// Interactive icon
<IconButton onClick={handleClick} ariaLabel="Settings">
  <Settings />
</IconButton>
```

---

## 16. Naming Conventions

### File Naming
```
# Single icons
icon-name.svg

# Icon sets (Sprite)
icons-navigation.svg
icons-social.svg
icons-status.svg

# Animated icons
icon-name-spin.svg
icon-name-pulse.svg
```

### Component Naming
```
# PascalCase for components
HomeIcon.tsx
SearchIcon.tsx
HeartFilledIcon.tsx

# Descriptive names
VaultClosedIcon.tsx
UserProfileIcon.tsx
GitForkBranchIcon.tsx
```

### CSS Class Naming
```css
/* BEM-style naming */
.icon {}
.icon--active {}
.icon__badge {}
.icon--size-sm {}
.icon--size-lg {}

/* Variant classes */
.icon-primary {}
.icon-secondary {}
.icon-accent {}
```

### Export Naming
```typescript
// Named exports (recommended)
export { default as HomeFeed } from './icons/home-feed';
export { Search } from './icons/search';
export { LockPrivacy } from './icons/privacy-lock';

// Barrel exports
export * from './icons/navigation';
export * from './icons/actions';
export * from './icons/social';
```

---

## 17. Design Guidelines

### Consistency Rules

1. **Stroke Consistency**
   - Use consistent stroke width across all icons
   - Default: 1.5px for standard icons
   - Avoid mixing stroke styles

2. **Corner Radius**
   - Use consistent corner radius
   - Default: 4px for rounded feel
   - Sharp corners for technical icons

3. **Optical Balance**
   - Center icons within viewBox
   - Account for visual weight, not just geometric center
   - Test at actual sizes (12px, 16px, 20px, 24px)

4. **Spacing**
   - Maintain consistent padding within icons
   - Use grid alignment (4px or 8px grid)
   - Avoid touching icon edges

### Accessibility

1. **ARIA Labels**
```tsx
<Icon 
  aria-hidden="false" 
  aria-label="Navigate to home feed"
  role="img"
>
  <HomeFeed />
</Icon>
```

2. **Focus States**
```css
.icon-button:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

3. **Color Contrast**
   - Minimum 4.5:1 contrast ratio
   - Test with color blindness simulators
   - Avoid color-only communication

### Mobile Considerations

1. **Touch Targets**
   - Minimum 44x44px touch target
   - Include spacing around icon
   - Account for finger reachability

2. **Visibility at Small Sizes**
   - Test at 12px, 16px, 20px
   - Simplify details at smaller sizes
   - Avoid thin lines below 1px

3. **Dark Mode Support**
```css
.icon {
  color: var(--icon-primary);
}

@media (prefers-color-scheme: dark) {
  .icon {
    color: var(--icon-primary-dark);
  }
}
```

---

## Appendix A: Complete Icon Inventory

### Total Icon Count by Category

| Category | Count | Priority |
|----------|-------|----------|
| Navigation | 12 | Critical |
| Actions | 25 | Critical |
| Social | 18 | Critical |
| Content (ACU) | 13 | Critical |
| Providers | 8 | High |
| Status | 20 | High |
| Settings | 14 | High |
| Editor | 18 | Medium |
| Files | 12 | Medium |
| Security | 14 | High |
| Backend | 12 | Medium |
| ACU Specific | 8 | High |
| **Total** | **174** | |

### Priority Levels

| Priority | Description | Timeline |
|----------|-------------|----------|
| **Critical** | Must have for MVP | Sprint 1 |
| **High** | Important for launch | Sprint 2 |
| **Medium** | Nice to have | Future |
| **Low** | Future consideration | Backlog |

---

## Appendix B: Icon Mapping Reference

### Current Lucide React Icons → Custom Icons

| Current Icon | Suggested Custom Name | Migration Priority |
|-------------|---------------------|------------------|
| `Home` | `home-feed` | Critical |
| `Compass` | `search` | Critical |
| `PlusCircle` | `vault-add` | Critical |
| `Settings` | `settings-cog` | Critical |
| `Search` | `search-header` | Critical |
| `Bell` | `bell-notification` | Critical |
| `GitFork` | `git-fork-branch` | Critical |
| `Heart` | `heart-like` | Critical |
| `Share2` | `share-nodes` | Critical |
| `Lock` | `privacy-lock` | Critical |
| `Shield` | `security-shield` | Critical |
| `Check` | `status-success` | High |
| `AlertCircle` | `status-error` | High |
| `Copy` | `copy-duplicate` | High |
| `Download` | `download-arrow` | High |
| `Upload` | `upload-arrow` | Medium |
| `RefreshCw` | `refresh-circular` | High |
| `Loader2` | `loading-spinner` | Critical |
| `X` | `close-x` | Critical |
| `ChevronRight` | `chevron-right` | Critical |
| `ChevronDown` | `chevron-down` | Critical |
| `Folder` | `folder-closed` | High |
| `FolderPlus` | `folder-add` | High |
| `Code` | `acu-code` | Critical |
| `Table` | `acu-table` | High |
| `Wrench` | `tool-call` | High |
| `Bot` | `message-ai` | High |
| `Sparkles` | `ai-generic` | Medium |
| `Eye` | `eye-view` | High |
| `EyeOff` | `eye-closed` | Medium |
| `Hash` | `tag-hash` | Medium |
| `Star` | `quality-star` | Medium |
| `Link` | `link-chain` | High |
| `ExternalLink` | `external-link` | High |
| `Trash2` | `delete-trash` | Critical |
| `Edit2` | `edit-pencil` | High |
| `Send` | `send-plane` | High |
| `MessageSquare` | `comment-bubble` | High |
| `Archive` | `archive-box` | Medium |
| `Database` | `storage-database` | Medium |
| `Terminal` | `debug-terminal` | Low |
| `Activity` | `sync-indicator` | Medium |
| `Clock` | `time-clock` | Medium |
| `Calendar` | `date-calendar` | Medium |
| `TrendingUp` | `analytics-chart` | Medium |
| `BarChart2` | `stats-bar` | Medium |
| `Server` | `server-icon` | Low |
| `Zap` | `realtime-bolt` | Medium |
| `Wifi` | `connection-wifi` | Low |
| `Filter` | `filter-funnel` | Low |
| `Sliders` | `settings-sliders` | Medium |
| `PlayCircle` | `play-circle` | Low |
| `FlaskConical` | `experimental-flask` | Low |

---

## 18. Collaboration & Forking Icons

### Forking & Branching

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Fork** | Git-style fork (branching) | Fork conversation/ACU | `fork-git` |
| **Branch** | Active branch indicator | Current branch view | `branch-active` |
| **Merge** | Git merge arrows | Merge branches | `merge-arrows` |
| **Merge Conflict** | Conflict indicator | Merge conflict resolution | `merge-conflict` |
| **Rebase** | Rebase operation | Rebase branches | `rebase-arrows` |
| **Cherry Pick** | Cherry pick symbol | Select specific commits | `cherry-pick` |
| **Fork Tree** | Tree visualization | Fork history view | `fork-tree` |
| **Branch History** | Timeline with branches | Version history | `branch-history` |
| **Head** | HEAD indicator | Current commit reference | `commit-head` |
| **Base** | Base commit marker | Merge base reference | `commit-base` |

### Provenance & Attribution

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Provenance** | Chain of custody | Provenance tracking | `provenance-chain` |
| **Attribution** | Credit/attribution | Contributor credit | `attribution-credit` |
| **Original Author** | Original creator | Original author indicator | `author-original` |
| **Contributor** | Contributor badge | Multiple contributors | `contributor-badge` |
| **Co-Author** | Co-author symbol | Joint authorship | `co-author` |
| **Citation** | Citation format | Reference citation | `citation-format` |
| **License** | License badge | Content license | `license-badge` |
| **Copyright** | Copyright symbol | Copyright info | `copyright-symbol` |

### Real-time Collaboration

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Presence** | User presence indicator | Online users | `presence-online` |
| **Active Users** | Multiple user icons | Active collaborators | `users-active` |
| **Typing** | Typing indicator | User typing | `typing-indicator` |
| **Cursors** | Cursor positions | Live cursor view | `cursors-live` |
| **Locked** | Item locked by user | Edit lock | `edit-lock` |
| **Unlock** | Release edit lock | Unlock item | `edit-unlock` |
| **Suggested Edits** | Pencil with suggestion | Suggested changes | `suggest-edit` |
| **Accept/Reject** | Check/X for suggestions | Accept/reject edits | `accept-reject` |

### Peer Review & Feedback

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Review** | Eye with check | Start review | `review-eye` |
| **Approve** | Checkmark circle | Approve content | `review-approve` |
| **Request Changes** | Change request | Request modifications | `review-request` |
| **Comment** | Comment bubble | Add review comment | `review-comment` |
| **Approve All** | Multi-check | Approve all | `approve-all` |
| **Reject All** | Multi-X | Reject all | `reject-all` |
| **Review Status** | Review badge | Overall review status | `review-status` |

### Contribution Tracking

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Contributions** | Bar chart of contributions | Contribution stats | `contribution-chart` |
| **Activity** | Activity timeline | User activity | `activity-timeline` |
| **Streak** | Fire/streak symbol | Contribution streak | `streak-fire` |
| **Rank** | Trophy/rank | User ranking | `rank-trophy` |
| **Badges** | Badge collection | Achievement badges | `badges-collection` |
| **Level** | Level indicator | User level | `level-indicator` |
| **Reputation** | Star/reputation | Reputation score | `reputation-star` |

---

## 19. Knowledge Graph & VaultSense Icons

### Graph Visualization

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Graph** | Network nodes | Graph view toggle | `graph-network` |
| **Node** | Single node | Node representation | `graph-node` |
| **Edge** | Connection line | Relationship edge | `graph-edge` |
| **Cluster** | Grouped nodes | Node cluster | `graph-cluster` |
| **Hub** | Central hub node | Hub node | `graph-hub` |
| **Leaf** | Leaf node | End node | `graph-leaf` |
| **Directed Edge** | Arrow edge | Directional relationship | `graph-edge-directed` |
| **Weighted Edge** | Thickness variation | Weighted relationship | `graph-edge-weighted` |
| **Filter Graph** | Graph with filter | Filter graph view | `graph-filter` |
| **Expand Graph** | Graph with expand | Expand graph | `graph-expand` |
| **Collapse Graph** | Graph with collapse | Collapse graph | `graph-collapse` |
| **Full Graph** | Full screen graph | Maximize graph | `graph-fullscreen` |
| **Zoom In Graph** | Zoom in for graph | Graph zoom | `graph-zoom-in` |
| **Zoom Out Graph** | Zoom out for graph | Graph zoom | `graph-zoom-out` |
| **Reset Graph** | Reset graph view | Reset zoom/pan | `graph-reset` |

### VaultSense Specific

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **VaultSense** | Vault with radar | VaultSense feature | `vaultsense-radar` |
| **Connections** | Link visualization | Connection strength | `vaultsense-links` |
| **Insights** | Lightbulb/graph | AI insights | `vaultsense-insights` |
| **Suggestions** | Arrow/lightbulb | Feature suggestions | `vaultsense-suggest` |
| **Related** | Related nodes | Related content | `vaultsense-related` |
| **Path** | Path through graph | Knowledge path | `vaultsense-path` |
| **Distance** | Distance indicator | Semantic distance | `vaultsense-distance` |
| **Similarity** | Similar symbol | Content similarity | `vaultsense-similarity` |
| **Discovery** | Compass/graph | New discovery | `vaultsense-discovery` |
| **Trending** | Trending graph | Trending topics | `vaultsense-trending` |

### Graph Analytics

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Centrality** | Central node metric | Node importance | `graph-centrality` |
| **Density** | Density indicator | Graph density | `graph-density` |
| **Components** | Separate components | Graph components | `graph-components` |
| **Paths** | Path visualization | Shortest paths | `graph-paths` |
| **Cycles** | Cycle indicator | Graph cycles | `graph-cycles` |
| **Communities** | Community detection | Graph communities | `graph-communities` |

---

## 20. Personal Knowledgebase Icons

### Collections & Organization

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Collection** | Folder/collection | Collection view | `collection-folder` |
| **Smart Collection** | Collection with AI | Dynamic collection | `collection-smart` |
| **Shared Collection** | Shared folder | Shared collection | `collection-shared` |
| **Private Collection** | Locked folder | Private collection | `collection-private` |
| **Featured** | Star/collection | Featured items | `collection-featured` |
| **Recent** | Clock/folder | Recently accessed | `collection-recent` |
| **All Items** | Grid/collection | All items view | `collection-all` |
| **Trash** | Trash can | Deleted items | `collection-trash` |
| **Restore** | Restore from trash | Restore item | `restore-item` |
| **Empty Collection** | Empty folder | Empty state | `collection-empty` |

### Tagging & Categorization

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Tag** | Price tag style | Add tag | `tag-add` |
| **Tag Remove** | Tag with X | Remove tag | `tag-remove` |
| **Tag Edit** | Tag with pencil | Edit tag | `tag-edit` |
| **Tags** | Multiple tags | View all tags | `tags-view` |
| **Tag Color** | Colored tag | Colored tag indicator | `tag-color` |
| **Tag Category** | Category tag | Category indicator | `tag-category` |
| **Auto Tag** | Tag with AI | Auto-generated tag | `tag-auto` |
| **Tag Cloud** | Cloud of tags | Tag cloud view | `tag-cloud` |
| **Filter Tags** | Tags with filter | Filter by tags | `filter-tags` |

### Search & Discovery

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Advanced Search** | Search with gears | Advanced search | `search-advanced` |
| **Semantic Search** | Brain/search | Semantic search | `search-semantic` |
| **Full Text Search** | Document/search | Full text search | `search-fulltext` |
| **Filter** | Funnel filter | Filter results | `search-filter` |
| **Sort** | Sort arrows | Sort results | `search-sort` |
| **Search History** | Clock/search | Recent searches | `search-history` |
| **Saved Search** | Bookmark/search | Saved search | `search-saved` |
| **Search Suggestions** | Lightbulb/search | Search suggestions | `search-suggest` |
| **No Results** | Search with X | No results | `search-noresults` |
| **Clear Search** | Clear input | Clear search | `search-clear` |

### Hierarchy & Navigation

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Hierarchy** | Tree structure | Hierarchy view | `hierarchy-tree` |
| **Breadcrumb** | Breadcrumb trail | Navigation path | `breadcrumb-nav` |
| **Expand All** | Expand symbols | Expand all | `expand-all` |
| **Collapse All** | Collapse symbols | Collapse all | `collapse-all` |
| **Drill Down** | Chevron/circle | Drill into item | `drill-down` |
| **Drill Up** | Chevron up/circle | Go up hierarchy | `drill-up` |
| **Navigate** | Compass/arrow | Navigate to | `navigate-to` |
| **Backtrack** | Path back | Go back | `backtrack-path` |

### Personalization

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Favorites** | Heart/favorites | Favorite items | `favorites-heart` |
| **Reading List** | Book/list | Reading list | `reading-list` |
| **Watchlist** | Eye/list | Watched items | `watchlist-eye` |
| **Custom View** | View/custom | Custom view | `view-custom` |
| **Default View** | View/default | Reset view | `view-default` |
| **Arrange** | Arrange icons | Arrange items | `arrange-icons` |
| **Grid View** | Grid layout | Grid view | `view-grid` |
| **List View** | List layout | List view | `view-list` |
| **Card View** | Card layout | Card view | `view-card` |

---

## 21. ACU Evolution & Lineage Icons

### Quality & Scoring

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Quality Score** | Meter/badge | ACU quality | `quality-score` |
| **Quality High** | Green check/badge | High quality | `quality-high` |
| **Quality Medium** | Yellow badge | Medium quality | `quality-medium` |
| **Quality Low** | Red badge | Low quality | `quality-low` |
| **Improve Quality** | Up arrow/badge | Improve suggestion | `quality-improve` |
| **Accuracy** | Target/crosshair | Accuracy score | `accuracy-target` |
| **Relevance** | Filter/relevance | Relevance score | `relevance-filter` |
| **Freshness** | Clock/sparkle | Content freshness | `freshness-clock` |

### Composition & Structure

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Compose** | Combine elements | Compose ACUs | `acu-compose` |
| **Decompose** | Break apart | Decompose ACU | `acu-decompose` |
| **Relate** | Connect nodes | Link ACUs | `acu-relate` |
| **Embed** | Nesting icon | Embed ACU | `acu-embed` |
| **Reference** | Link icon | Reference ACU | `acu-reference` |
| **Parent** | Up arrow | Parent ACU | `acu-parent` |
| **Child** | Down arrow | Child ACU | `acu-child` |
| **Sibling** | Side arrows | Sibling ACUs | `acu-sibling` |
| **Ancestry** | Family tree | ACU ancestry | `acu-ancestry` |
| **Descendants** | Tree down | ACU descendants | `acu-descendants` |

### Versioning

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Version** | Tag/badge | Version number | `version-tag` |
| **Version History** | Clock/list | Version timeline | `version-history` |
| **Version Compare** | Side by side | Compare versions | `version-compare` |
| **Version Restore** | Restore arrow | Restore version | `version-restore` |
| **Version Diff** | Changes/arrows | View differences | `version-diff` |
| **Latest Version** | Star/tag | Latest version | `version-latest` |
| **Draft** | Pencil badge | Draft version | `version-draft` |
| **Published** | Check/badge | Published version | `version-published` |
| **Snapshot** | Camera/save | Create snapshot | `snapshot-save` |
| **Rollback** | Back arrow | Rollback changes | `version-rollback` |

### Evolution Metrics

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Evolution** | Growth arrow | ACU evolution | `evolution-growth` |
| **Lifecycle** | Cycle arrows | ACU lifecycle | `lifecycle-cycle` |
| **Milestone** | Flag/milestone | Evolution milestone | `milestone-flag` |
| **Progress** | Progress bar | Evolution progress | `evolution-progress` |
| **Influence** | Waves/rays | ACU influence | `influence-waves` |
| **Impact** | Impact symbol | Impact score | `impact-score` |
| **Adoption** | Uptake arrow | Adoption rate | `adoption-rate` |
| **Duplication** | Copy indicator | Duplicate detection | `duplicate-detect` |

---

## 22. Sync & Realtime Icons

### Synchronization States

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Sync** | Circular arrows | Sync operation | `sync-arrows` |
| **Sync All** | Multiple arrows | Sync all | `sync-all` |
| **Sync Pending** | Clock/sync | Pending sync | `sync-pending` |
| **Sync Progress** | Progress/sync | Sync progress | `sync-progress` |
| **Sync Complete** | Check/sync | Sync done | `sync-complete` |
| **Sync Error** | X/sync | Sync failed | `sync-error` |
| **Sync Conflict** | Exclamation/sync | Conflict detected | `sync-conflict` |
| **Sync Retry** | Refresh/sync | Retry sync | `sync-retry` |
| **Sync Cancel** | X/circle | Cancel sync | `sync-cancel` |
| **Sync Settings** | Gear/sync | Sync configuration | `sync-settings` |

### P2P & Network

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **P2P** | Two nodes connected | Peer-to-peer | `p2p-nodes` |
| **Peer Connected** | Node with check | Peer connected | `peer-connected` |
| **Peer Disconnected** | Node with X | Peer disconnected | `peer-disconnected` |
| **Network** | Mesh network | Network view | `network-mesh` |
| **Node Online** | Green node | Node online | `node-online` |
| **Node Offline** | Gray node | Node offline | `node-offline` |
| **Node Syncing** | Spinning node | Node syncing | `node-syncing` |
| **Discover Peers** | Radar/scan | Discover peers | `peer-discover` |
| **Invite Peer** | User/add | Invite peer | `peer-invite` |
| **Remove Peer** | User/remove | Remove peer | `peer-remove` |

### WebSocket & Realtime

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **WebSocket** | WS symbol | WebSocket active | `websocket-active` |
| **Realtime** | Lightning bolt | Realtime enabled | `realtime-bolt` |
| **Live** | Broadcasting icon | Live connection | `connection-live` |
| **Connected** | Plug/connected | Connected state | `connection-connected` |
| **Disconnected** | Plug/disconnected | Disconnected state | `connection-disconnected` |
| **Reconnecting** | Spinning plug | Reconnecting | `connection-reconnect` |
| **Connection Quality** | Signal bars | Connection strength | `connection-quality` |
| **Ping** | Radar/ping | Latency check | `connection-ping` |
| **Latency** | Clock/speed | Latency indicator | `connection-latency` |
| **Heartbeat** | Pulse/heart | Heartbeat check | `connection-heartbeat` |

### Presence Indicators

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Online** | Green dot | User online | `presence-online` |
| **Away** | Yellow dot | User away | `presence-away` |
| **Busy** | Red dot | User busy | `presence-busy` |
| **Offline** | Gray dot | User offline | `presence-offline` |
| **Invisible** | Hidden eye | Invisible mode | `presence-invisible` |
| **Last Seen** | Clock/dot | Last seen time | `presence-lastseen` |
| **Status Message** | Speech/indicator | Custom status | `presence-status` |
| **Custom Status** | Edit/indicator | Set status | `status-custom` |

### Background Sync

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Background Sync** | Sync/background | Background sync | `sync-background` |
| **Sync Queue** | List/arrows | Sync queue | `sync-queue` |
| **Prioritize Sync** | Star/arrows | Prioritize sync | `sync-prioritize` |
| **Sync Frequency** | Clock/settings | Sync schedule | `sync-frequency` |
| **Sync Now** | Lightning/sync | Trigger sync | `sync-now` |
| **Auto Sync** | Refresh/auto | Auto sync toggle | `sync-auto` |
| **Manual Sync** | Hand/manual | Manual sync | `sync-manual` |
| **Battery Sync** | Battery/sync | Battery-efficient sync | `sync-battery` |
| **Wifi Only** | Wifi/sync | WiFi-only sync | `sync-wifi` |

---

## 23. Analytics & Metrics Icons

### Engagement Metrics

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Views** | Eye/chart | View count | `metric-views` |
| **Likes** | Heart/chart | Like count | `metric-likes` |
| **Comments** | Bubble/chart | Comment count | `metric-comments` |
| **Shares** | Share/chart | Share count | `metric-shares` |
| **Saves** | Bookmark/chart | Save count | `metric-saves` |
| **Clicks** | Cursor/chart | Click count | `metric-clicks` |
| **Impressions** | Eye/network | Impression count | `metric-impressions` |
| **Reach** | Radio waves | Reach count | `metric-reach` |
| **Engagement Rate** | Percent/chart | Engagement rate | `metric-engagement` |
| **Interaction** | Hand/interact | Interaction count | `metric-interactions` |

### Performance Metrics

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Response Time** | Clock/speed | Response time | `metric-response` |
| **Load Time** | Clock/speed | Load time | `metric-loadtime` |
| **Latency** | Graph/line | Latency chart | `metric-latency` |
| **Throughput** | Flow/arrow | Throughput rate | `metric-throughput` |
| **Uptime** | Check/up | Uptime percentage | `metric-uptime` |
| **Errors** | X/chart | Error count | `metric-errors` |
| **Success Rate** | Percent/check | Success rate | `metric-success` |
| **Conversion** | Arrow/conversion | Conversion rate | `metric-conversion` |
| **Retention** | Graph/up | Retention rate | `metric-retention` |
| **Churn** | Graph/down | Churn rate | `metric-churn` |

### User Analytics

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Active Users** | Users/chart | Active user count | `metric-active-users` |
| **New Users** | User/plus | New users | `metric-new-users` |
| **Returning Users** | User/cycle | Returning users | `metric-returning` |
| **Session Duration** | Clock/users | Avg session length | `metric-session` |
| **Pages per Session** | Pages/stack | Pages per session | `metric-pages-session` |
| **Bounce Rate** | Arrow/leave | Bounce rate | `metric-bounce` |
| **Demographics** | Users/pie | User demographics | `metric-demographics` |
| **Device Breakdown** | Phone/tablet | Device stats | `metric-devices` |
| **Location Map** | Globe/pins | Geographic data | `metric-location` |
| **Traffic Source** | Arrow/source | Traffic sources | `metric-traffic` |

### Content Analytics

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Content Growth** | Graph/up | Content growth | `metric-content-growth` |
| **Content Types** | Pie/types | Content distribution | `metric-content-types` |
| **Popular Content** | Star/chart | Popular items | `metric-popular` |
| **Trending** | Trending/up | Trending content | `metric-trending` |
| **Top Contributors** | Trophy/users | Top contributors | `metric-top-contributors` |
| **Content Health** | Heart/health | Content health | `metric-health` |
| **Duplication Rate** | Copy/percent | Duplicate rate | `metric-duplication` |
| **Quality Trend** | Graph/quality | Quality over time | `metric-quality-trend` |

### Dashboard & Visualization

| Icon Name | Description | Context | Recommended SVG Name |
|-----------|-------------|---------|---------------------|
| **Dashboard** | Grid/dashboard | Analytics dashboard | `analytics-dashboard` |
| **Charts** | Bar/line/pie | Chart types | `analytics-charts` |
| **Table** | Grid/table | Data table | `analytics-table` |
| **Export Data** | Download/data | Export analytics | `analytics-export` |
| **Date Range** | Calendar/range | Date picker | `analytics-date-range` |
| **Custom Report** | Document/report | Custom reports | `analytics-report` |
| **Scheduled Report** | Clock/report | Scheduled reports | `analytics-scheduled` |
| **Alerts** | Bell/alert | Analytics alerts | `analytics-alerts` |
| **Insights** | Lightbulb | AI insights | `analytics-insights` |
| **Anomalies** | Exclamation/graph | Anomaly detection | `analytics-anomalies` |

---

## Appendix C: Implementation Checklist

- [ ] Create icon component library structure
- [ ] Design critical navigation icons (Sprint 1)
- [ ] Design action buttons (Sprint 1)
- [ ] Design social engagement icons (Sprint 1)
- [ ] Design ACU type icons (Sprint 1)
- [ ] Design provider icons (Sprint 1)
- [ ] Design status icons (Sprint 1)
- [ ] Create SVG sprite system
- [ ] Implement Icon component with variants
- [ ] Add animation utilities
- [ ] Implement dark mode support
- [ ] Create documentation website
- [ ] Design high priority remaining icons (Sprint 2)
- [ ] Design editor icons (Sprint 2)
- [ ] Design security icons (Sprint 2)
- [ ] Design backend icons (Sprint 2)
- [ ] Design collaboration icons (Sprint 2)
- [ ] Design knowledge graph icons (Sprint 3)
- [ ] Design knowledgebase icons (Sprint 3)
- [ ] Design sync/realtime icons (Sprint 3)
- [ ] Design analytics icons (Sprint 3)
- [ ] Create Figma/Sketch design files
- [ ] Export icon set for design tools

---

## Appendix D: Complete Icon Inventory (Updated)

### Total Icon Count by Category

| Category | Count | Priority |
|----------|-------|----------|
| Navigation | 12 | Critical |
| Actions | 25 | Critical |
| Social | 18 | Critical |
| Content (ACU) | 13 | Critical |
| Providers | 8 | High |
| Status | 20 | High |
| Settings | 14 | High |
| Editor | 18 | Medium |
| Files | 12 | Medium |
| Security | 14 | High |
| Backend | 12 | Medium |
| ACU Specific | 8 | High |
| **Collaboration & Forking** | **42** | High |
| **Knowledge Graph & VaultSense** | **36** | High |
| **Personal Knowledgebase** | **44** | High |
| **ACU Evolution & Lineage** | **34** | High |
| **Sync & Realtime** | **44** | High |
| **Analytics & Metrics** | **44** | High |
| **Total** | **430** | |

### Priority Levels

| Priority | Description | Timeline |
|----------|-------------|----------|
| **Critical** | Must have for MVP | Sprint 1 |
| **High** | Important for launch | Sprint 2-3 |
| **Medium** | Nice to have | Future |
| **Low** | Future consideration | Backlog |

---

## Appendix E: Feature-to-Icon Mapping

### 218 Features → Icons Coverage

| Feature Category | Features Count | Icons Required | Coverage |
|------------------|----------------|----------------|----------|
| Capture & Import | 12 | 8 | ✅ 100% |
| Storage & Organization | 24 | 28 | ✅ 100% |
| Social Features | 32 | 36 | ✅ 100% |
| ACU Management | 28 | 30 | ✅ 100% |
| AI & Automation | 18 | 12 | ✅ 100% |
| Collaboration | 24 | 42 | ✅ 100% |
| Knowledge Graph | 16 | 36 | ✅ 100% |
| Personal Knowledgebase | 20 | 44 | ✅ 100% |
| Sync & Realtime | 12 | 44 | ✅ 100% |
| Analytics | 18 | 44 | ✅ 100% |
| Security & Privacy | 8 | 14 | ✅ 100% |
| Settings & Config | 6 | 12 | ✅ 100% |
| **Total** | **218** | **430** | **100%** |

---

*Document Version: 2.0*  
*Created: February 9, 2026*  
*Updated: February 9, 2026*  
*For: VIVIM Custom Icon Library Generation*

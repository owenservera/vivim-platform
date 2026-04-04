# Home Panel Visual Design Enhancements - TODO List

## Overview
This document contains the complete, atomic list of visual design enhancements for the VIVIM Home Panel. Each item is independent and can be implemented separately.

---

## Phase 1: Critical Bug Fixes (High Priority)

### 1.1 Fix Model Name Extraction
- **File**: `pwa/src/pages/Home.tsx`
- **Issue**: Line uses `convo.model || convo.metadata?.model` but `model` doesn't exist at root
- **Fix**: Change to `convo.metadata?.model`
- **Status**: NOT STARTED

### 1.2 Fix Archived Card Opacity Affecting Actions
- **File**: `pwa/src/pages/Home.css`
- **Issue**: `.is-archived { opacity: 0.6 }` affects ALL content including action buttons
- **Fix**: Apply opacity only to `.conv-card-body` content, keep actions visible
- **Status**: NOT STARTED

---

## Phase 2: Visual Indicators & UX (High Priority)

### 2.1 Add Visual Indicators for Missing Data
- **File**: `pwa/src/pages/Home.tsx`
- **Issue**: `formatDate()` returns empty string for missing dates
- **Fix**: Return "Unknown" instead of empty string
- **Status**: NOT STARTED
- **Affected Lines**: Around line 53-65

### 2.2 Add Pinned Badge Icon to Card Title
- **File**: `pwa/src/pages/Home.tsx`
- **Issue**: Pinned indicator only shows as left border
- **Fix**: Add Pin icon badge after conversation title
- **Status**: NOT STARTED
- **Affected Lines**: Around title rendering

### 2.3 Add Archived Badge Icon to Card Title
- **File**: `pwa/src/pages/Home.tsx`
- **Issue**: Archived state not visually prominent
- **Fix**: Add Archive icon badge after conversation title
- **Status**: NOT STARTED
- **Affected Lines**: Around title rendering

---

## Phase 3: Design System Consistency (Medium Priority)

### 3.1 Replace Hardcoded Provider Colors with CSS Variables
- **File**: `pwa/src/pages/Home.css`
- **Issue**: Provider accent strips use hardcoded hex colors (lines 368-377)
- **Fix**: Convert to CSS custom properties with fallback
- **Example**:
  ```css
  .conv-card-accent.chatgpt {
    background: linear-gradient(90deg, var(--provider-chatgpt-start, #10b981), var(--provider-chatgpt-end, #059669));
  }
  ```
- **Status**: NOT STARTED

### 3.2 Add Dark Mode Provider Colors
- **File**: `pwa/src/pages/Home.css`
- **Issue**: No dark mode variants for provider accents
- **Fix**: Add `@media (prefers-color-scheme: dark)` block for all providers
- **Status**: NOT STARTED
- **Depends on**: 3.1

### 3.3 Replace Hardcoded Arrow Character with Icon
- **File**: `pwa/src/pages/Home.tsx`
- **Issue**: Grid mode continue button uses hardcoded `→` character
- **Fix**: Import and use `<ArrowRight />` from lucide-react
- **Status**: NOT STARTED
- **Affected Lines**: Around line 349

---

## Phase 4: Error State Improvements (Medium Priority)

### 4.1 Differentiate Error Types with Icons
- **File**: `pwa/src/pages/Home.tsx`
- **Issue**: All errors show same WifiOff icon
- **Fix**: Add conditional icons based on error type:
  - Storage/database errors → Database icon
  - Timeout errors → Clock icon
  - Network errors → WifiOff icon
  - Generic errors → AlertCircle icon
- **Status**: NOT STARTED
- **Affected Lines**: Around line 986-1002

### 4.2 Add Contextual Error Messages
- **File**: `pwa/src/pages/Home.tsx`
- **Issue**: Generic error messages don't help user understand issue
- **Fix**: Add specific messages:
  - Storage: "Database is initializing. Please wait a moment..."
  - Timeout: "The request took too long. Check your connection and try again."
  - Network: "Check your internet connection and try again."
- **Status**: NOT STARTED
- **Affected Lines**: Around line 994

---

## Phase 5: Accessibility & Polish (Low Priority)

### 5.1 Improve Keyboard Navigation
- **File**: `pwa/src/pages/Home.tsx`
- **Issue**: Cards only support Enter key
- **Fix**: Add Space key support, add aria-expanded states
- **Status**: NOT STARTED

### 5.2 Add Screen Reader Support for Stats
- **File**: `pwa/src/pages/Home.tsx`
- **Issue**: Stats pills not accessible to screen readers
- **Fix**: Add sr-only text or aria-labels
- **Status**: NOT STARTED

### 5.3 Add Horizontal Scroll Hint for Stats Banner
- **File**: `pwa/src/pages/Home.css`
- **Issue**: Hidden scrollbar makes horizontal scrollability non-obvious
- **Fix**: Add subtle gradient fade or scroll indicator
- **Status**: NOT STARTED

---

## Implementation Notes

### Files Modified
- `pwa/src/pages/Home.tsx` - Main component
- `pwa/src/pages/Home.css` - Styles

### Imports Needed (lucide-react)
```typescript
import {
  // Existing imports...
  ArrowRight,  // For item 3.3
  Database,    // For item 4.1
  Clock,       // For item 4.1
  AlertCircle, // For item 4.1
  Pin,         // For item 2.2
  Archive      // For item 2.3
} from 'lucide-react';
```

### Testing Checklist
- [ ] Build passes without errors
- [ ] TypeScript compiles cleanly
- [ ] Dark mode renders correctly
- [ ] All icons render properly
- [ ] Error states display correctly for each type
- [ ] Cards render with proper opacity in archived state

---

## Quick Start

To implement all items, start with Phase 1, then Phase 2, then Phase 3, then Phase 4. Phase 5 can be done anytime.

Each item is atomic and can be tested independently.

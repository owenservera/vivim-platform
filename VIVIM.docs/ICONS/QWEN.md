# VIVIM Icon Library - Development Context

## Project Overview

The VIVIM Icon Library is a comprehensive collection of custom SVG icons designed specifically for the VIVIM application. This library includes over 400+ icons covering all aspects of the application's UI needs, organized into logical categories.

**Project Type:** React TypeScript Icon Library
**Main Technology Stack:** React, TypeScript, SVG
**Architecture:** Categorized icon components with barrel exports

## Directory Structure

The library is organized into the following category directories:
- `actions/` - Common action buttons (Add, Edit, Delete, etc.)
- `acu/` - Atomic Chat Unit specific icons
- `acu-evolution/` - ACU management icons
- `analytics/` - Metrics and analytics icons
- `backend/` - Server-side operations icons
- `collaboration/` - Forking and collaboration icons
- `content/` - ACU type indicators
- `editor/` - Text editing operations
- `files/` - Storage and document icons
- `knowledge-graph/` - VaultSense features
- `knowledgebase/` - Personal knowledgebase icons
- `navigation/` - Core app navigation icons
- `providers/` - AI service logos
- `security/` - Privacy and protection icons
- `settings/` - Configuration icons
- `social/` - Engagement and sharing icons
- `status/` - State and feedback icons
- `sync/` - Synchronization states

## Key Files

- `Icon.tsx` - Generic Icon component that accepts a name prop
- `index.ts` - Main barrel export file that aggregates all icons
- Category `index.ts` files - Export individual icons from each category

## Component Structure

Each icon is implemented as a React functional component with the following characteristics:
- Default size of 24px
- Support for customizable props (size, color, strokeWidth)
- Forwarded refs for accessibility
- Consistent SVG attributes (viewBox, stroke properties)

Example icon component structure:
```tsx
import React from 'react';

const IconName = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* SVG path elements */}
  </svg>
);

export default IconName;
```

## Generic Icon Component

The library provides a generic `Icon` component that accepts a name prop to dynamically render icons:

```tsx
import { Icon } from '@vivim/icons';

<Icon name="home-feed" size={24} />
<Icon name="heart-like" size="lg" filled={true} />
```

## Props Interface

### Individual Icon Components
- `size`: number - Icon size in pixels (default: 24)
- `color`: string - Icon color (default: currentColor)
- `strokeWidth`: number - Stroke width (default: 1.5)
- `className`: string - Additional CSS classes
- `style`: object - Additional inline styles
- `...rest`: All other props are spread to the SVG element

### Generic Icon Component
- `name`: string - Icon name to display
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number - Size preset or pixel value
- `filled`: boolean - Whether to use filled variant
- `color`: string - Icon color
- `strokeWidth`: number - Stroke width
- `onClick`: () => void - Click handler
- `ariaLabel`: string - Accessibility label
- `className`: string - Additional CSS classes
- `style`: object - Additional inline styles

## Size Reference

- `xs`: 12px
- `sm`: 16px
- `md`: 18px (default)
- `lg`: 20px
- `xl`: 24px
- `2xl`: 32px
- `3xl`: 48px

## Export System

The library uses barrel exports to make all icons easily accessible:
- Each category directory has its own index.ts file exporting all icons in that category
- The main index.ts file aggregates all category exports
- Icons are named exports following PascalCase convention

## Development Conventions

- All icons are SVG-based React components
- Consistent stroke width of 1.5
- Round line caps and joins for visual consistency
- Proper accessibility attributes (role, aria-label, tabIndex, keyboard handlers)
- Forwarded refs for DOM access when needed
- Consistent naming conventions following kebab-case for file names and PascalCase for component names

## Usage Patterns

Icons can be imported individually from their respective categories:
```tsx
import { HomeFeed, Search, VaultClosed, UserProfile } from '@vivim/icons/navigation';
import { AddPlus, EditPencil, DeleteTrash, CopyDuplicate } from '@vivim/icons/actions';
```

Or use the generic Icon component:
```tsx
import { Icon } from '@vivim/icons';
<Icon name="home-feed" size={24} />
```

## Contributing Guidelines

To add new icons:
1. Create the SVG component in the appropriate category directory
2. Add the export to the category's index.ts file
3. Follow the naming conventions and component structure
4. Ensure proper accessibility attributes are included
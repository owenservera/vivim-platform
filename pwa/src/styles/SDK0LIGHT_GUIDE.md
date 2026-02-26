# SDK0Light - VIVIM Frontend Styling Guide

## Overview
SDK0Light is the official styling guide for VIVIM frontend applications.

## Design Philosophy
- **Premium & Modern**: Clean, sophisticated interface with attention to detail
- **Light Mode First**: Optimized for light-themed experiences with accessibility in mind
- **Minimalist**: Uncluttered interface that focuses on content
- **Collaborative**: Designed to support team workflows and knowledge sharing

## Color System

### Primary Colors (Indigo/Purple Gradient)
```css
--primary-50:  #eef2ff;   /* Lightest indigo */
--primary-100: #e0e7ff;   /* Very light indigo */
--primary-200: #c7d2fe;   /* Light indigo */
--primary-300: #a5b4fc;   /* Medium-light indigo */
--primary-400: #818cf8;   /* Medium indigo */
--primary-500: #6366f1;   /* Base indigo (most commonly used) */
--primary-600: #4f46e5;   /* Medium-dark indigo */
--primary-700: #4338ca;   /* Dark indigo */
--primary-800: #3730a3;   /* Very dark indigo */
--primary-900: #312e81;   /* Darkest indigo */
```

### Accent Colors (Violet)
```css
--accent-50:   #f5f3ff;  /* Lightest violet */
--accent-100:  #ede9fe;  /* Very light violet */
--accent-200: #ddd6fe;   /* Light violet */
--accent-300: #c4b5fd;   /* Medium-light violet */
--accent-400: #a78bfa;   /* Medium violet */
--accent-500: #8b5cf6;   /* Base violet (most commonly used) */
--accent-600: #7c3aed;   /* Medium-dark violet */
--accent-700: #6d28d9;   /* Dark violet */
--accent-800: #5b21b6;   /* Very dark violet */
--accent-900: #4c1d95;   /* Darkest violet */
```

### Background Colors
```css
--bg-primary:   #FAFAFA;  /* Soft white background */
--bg-secondary:  #FFFFFF;  /* Pure white background */
--bg-tertiary:   #F5F5F5;  /* Light gray background */
```

### Text Colors
```css
--text-primary:   #111827;  /* Dark text */
--text-secondary: #4B5563;  /* Medium gray text */
--text-tertiary:  #9CA3AF;  /* Light gray text */
--text-inverse:   #FFFFFF;  /* White text */
```

### Neutral Grays
```css
--gray-50:  #FAFAFA;  /* Lightest gray */
--gray-100: #F5F5F5;  /* Very light gray */
--gray-200: #E5E7EB;  /* Light gray */
--gray-300: #D1D5DB;  /* Medium-light gray */
--gray-400: #9CA3AF;  /* Medium gray */
--gray-500: #6B7280;  /* Medium-dark gray */
--gray-600: #4B5563;  /* Dark gray */
--gray-700: #374151;  /* Darker gray */
--gray-800: #1F2937;  /* Very dark gray */
--gray-900: #111827;  /* Darkest gray */
```

### Semantic Colors
```css
/* Success */
--success-50:  #ecfdf5;  /* Light success */
--success-500: #10b981;  /* Base success green */
--success-700: #047857;  /* Dark success green */

/* Warning */
--warning-50:  #fffbeb;  /* Light warning */
--warning-500: #f59e0b;  /* Base warning amber */
--warning-700: #b45309;  /* Dark warning amber */

/* Error */
--error-50:  #fef2f2;   /* Light error */
--error-500: #ef4444;   /* Base error red */
--error-700: #b91c1c;   /* Dark error red */

/* Info */
--info-50:  #eff6ff;    /* Light info */
--info-500: #3b82f6;    /* Base info blue */
--info-700: #1d4ed8;    /* Dark info blue */
```

### ACU Type Colors
```css
--acu-statement:   #6366f1;  /* Indigo */
--acu-question:    #8b5cf6;  /* Violet */
--acu-answer:      #10b981;  /* Green */
--acu-code:        #f59e0b;  /* Amber */
--acu-formula:     #ec4899;  /* Pink */
--acu-table:       #06b6d4;  /* Cyan */
--acu-image:       #8b5cf6;  /* Violet */
--acu-tool:        #4f46e5;  /* Indigo */
```

## Typography

### Font Families
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Fira Code', 'SF Mono', 'Consolas', monospace;
```

### Font Sizes
```css
--text-xs:   0.75rem;    /* 12px */
--text-sm:   0.875rem;   /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg:   1.125rem;   /* 18px */
--text-xl:   1.25rem;    /* 20px */
--text-2xl:  1.5rem;     /* 24px */
--text-3xl:  1.875rem;   /* 30px */
--text-4xl:  2.25rem;    /* 36px */
--text-5xl:  3rem;       /* 48px */
```

### Font Weights
```css
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

### Line Heights
```css
--leading-tight:  1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## Spacing System
Spacing follows an 8-point grid system with proportional smaller units:

```css
--space-0:  0;           /* 0px */
--space-1:  0.25rem;     /* 4px */
--space-2:  0.5rem;      /* 8px */
--space-3:  0.75rem;     /* 12px */
--space-4:  1rem;        /* 16px */
--space-5:  1.25rem;     /* 20px */
--space-6:  1.5rem;      /* 24px */
--space-8:  2rem;        /* 32px */
--space-10: 2.5rem;      /* 40px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
--space-20: 5rem;        /* 80px */
--space-24: 6rem;        /* 96px */
```

## Border Radius
```css
--radius-none: 0;        /* Square */
--radius-sm:   0.25rem;  /* 4px */
--radius-md:   0.5rem;   /* 8px */
--radius-lg:   0.75rem;  /* 12px */
--radius-xl:   1rem;     /* 16px */
--radius-2xl:  1.5rem;   /* 24px */
--radius-full: 9999px;   /* Circle */
```

## Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

## Z-Index Scale
```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-fixed: 30;
--z-modal-backdrop: 40;
--z-modal: 50;
--z-popover: 60;
--z-tooltip: 70;
```

## Transitions
```css
--transition-fast: 150ms ease-out;
--transition-base: 200ms ease-out;
--transition-slow: 300ms ease-out;

--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

## Component Styling Patterns

### Buttons
#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-600), var(--accent-600));
  transform: translateY(-1px);
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background-color: var(--gray-100);
}
```

### Cards
Cards should have consistent padding, borders, and shadows:
```css
.card {
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Badges
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
}

.badge-primary {
  background-color: var(--primary-100);
  color: var(--primary-700);
}

.badge-success {
  background-color: var(--success-50);
  color: var(--success-700);
}

.badge-warning {
  background-color: var(--warning-50);
  color: var(--warning-700);
}
```

### Forms
Form elements should have consistent styling:
```css
.form-input {
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  color: var(--text-primary);
  outline: none;
  transition: all var(--transition-fast);
}

.form-input:focus {
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input::placeholder {
  color: var(--gray-400);
}
```

## Accessibility Standards

### Focus States
All interactive elements must have visible focus states:
```css
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### Reduced Motion
Respect user preferences for reduced motion:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Color Contrast
Ensure sufficient contrast ratios:
- Normal text: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interface components: Minimum 3:1 ratio

## Responsive Breakpoints
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## Component-Specific Guidelines

### App Header
- Background: `var(--bg-secondary)` with 95% opacity and backdrop blur
- Border: Bottom border with `var(--gray-200)`
- Height: 56px (h-14)
- Shadow: Subtle shadow for depth
- Text: `var(--text-primary)` for title

### Bottom Navigation
- Fixed position at bottom
- Background: `var(--bg-secondary)` with 95% opacity and backdrop blur
- Border: Top border with `var(--gray-200)`
- Active items: `var(--primary-600)` color
- Inactive items: `var(--gray-500)` color

### Feed Cards
- Background: `var(--bg-secondary)` (white)
- Border: `var(--border-width)` solid `var(--gray-200)`
- Border radius: `var(--radius-lg)`
- Padding: `var(--space-4)`
- Shadow: `var(--shadow-sm)` with transition to `var(--shadow-md)` on hover
- Hover effect: Slight upward movement (`transform: translateY(-2px)`)

### Quality Badges
- Gold: `var(--quality-gold)` - 90%+ quality
- Silver: `var(--quality-silver)` - 75-89% quality
- Bronze: `var(--quality-bronze)` - 60-74% quality
- Low: `var(--quality-low)` - Below 60% quality

## Dark Mode Support
The system supports automatic dark mode through `prefers-color-scheme` media queries. The design system includes dark mode overrides that invert the color palette appropriately.

## CSS Utility Classes
The system includes utility classes that map to design tokens:
- `.text-primary` → `var(--primary-500)`
- `.text-secondary` → `var(--text-secondary)`
- `.bg-primary` → `var(--primary-500)`
- `.bg-secondary` → `var(--bg-secondary)`
- And many more for consistent styling

## Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Follow the spacing scale** for consistent padding/margin
3. **Maintain accessibility** with proper contrast and focus states
4. **Use semantic color names** rather than literal color values
5. **Keep animations subtle** and respect user preferences
6. **Design mobile-first** with responsive considerations
7. **Test across devices** and screen sizes
8. **Consider performance** - minimize heavy shadows and animations

## Common Mistakes to Avoid

- Using hardcoded hex values instead of CSS variables
- Inconsistent border-radius values across components
- Ignoring focus states for keyboard navigation
- Overusing shadows or animations
- Mixing different font families or sizes inconsistently
- Not considering reduced motion preferences
- Inadequate color contrast ratios
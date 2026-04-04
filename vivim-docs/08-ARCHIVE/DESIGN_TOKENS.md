# Design Tokens Specification

> **Purpose:** Define complete design tokens for the new frontend  
> **Based on:** Analysis of existing `unified-design-system.css` and `index.css`  
> **Recommendation:** Migrate to TailwindCSS 4 theme configuration

---

## 1. Color Palette

### 1.1 Primary Colors (Indigo)

Primary brand color - used for main actions, links, and highlights.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary-50` | `#eef2ff` | Lightest backgrounds |
| `--color-primary-100` | `#e0e7ff` | Hover backgrounds |
| `--color-primary-200` | `#c7d2fe` | Active backgrounds |
| `--color-primary-300` | `#a5b4fc` | Borders, dividers |
| `--color-primary-400` | `#818cf8` | Secondary emphasis |
| `--color-primary-500` | `#6366f1` | **Primary brand** |
| `--color-primary-600` | `#4f46e5` | Primary hover |
| `--color-primary-700` | `#4338ca` | Primary active |
| `--color-primary-800` | `#3730a3` | Dark backgrounds |
| `--color-primary-900` | `#312e81` | Darkest backgrounds |

### 1.2 Accent Colors (Violet)

Secondary accent - used for special elements and variety.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-accent-50` | `#f5f3ff` | Lightest backgrounds |
| `--color-accent-100` | `#ede9fe` | Hover backgrounds |
| `--color-accent-200` | `#ddd6fe` | Active backgrounds |
| `--color-accent-300` | `#c4b5fd` | Borders |
| `--color-accent-400` | `#a78bfa` | Secondary emphasis |
| `--color-accent-500` | `#8b5cf6` | **Accent brand** |
| `--color-accent-600` | `#7c3aed` | Accent hover |
| `--color-accent-700` | `#6d28d9` | Accent active |
| `--color-accent-800` | `#5b21b6` | Dark backgrounds |
| `--color-accent-900` | `#4c1d95` | Darkest backgrounds |

### 1.3 Neutral Colors (Gray)

Base grays for text, backgrounds, and borders.

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-gray-50` | `#fafafa` | `#1c1c1e` | Page backgrounds |
| `--color-gray-100` | `#f5f5f7` | `#2c2c2e` | Card backgrounds |
| `--color-gray-200` | `#e5e7eb` | `#3a3a3c` | Borders |
| `--color-gray-300` | `#d1d5db` | `#48484a` | Input borders |
| `--color-gray-400` | `#9ca3af` | `#636366` | Placeholder |
| `--color-gray-500` | `#6b7280` | `#8e8e93` | Disabled text |
| `--color-gray-600` | `#4b5563` | `#aeaeb2` | Secondary text |
| `--color-gray-700` | `#374151` | `#c7c7cc` | Body text |
| `--color-gray-800` | `#1f2937` | `#d1d1d6` | Headings |
| `--color-gray-900` | `#111827` | `#f2f2f7` | Primary text |
| `--color-gray-950` | `#0a0a0a` | `#000000` | Deep dark |

### 1.4 Semantic Colors

| Token | Light BG | Light Text | Dark BG | Dark Text | Usage |
|-------|----------|------------|---------|-----------|-------|
| `--color-success-50` | `#ecfdf5` | `#047857` | `#064e3b` | `#34d399` | Success states |
| `--color-warning-50` | `#fffbeb` | `#b45309` | `#78350f` | `#fbbf24` | Warning states |
| `--color-error-50` | `#fef2f2` | `#b91c1c` | `#7f1d1d` | `#f87171` | Error states |
| `--color-info-50` | `#eff6ff` | `#1d4ed8` | `#1e3a8a` | `#60a5fa` | Info states |

### 1.5 Background Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--bg-primary` | `#fafafa` | `#0f0f0f` | Page background |
| `--bg-secondary` | `#ffffff` | `#1c1c1e` | Card/surface |
| `--bg-tertiary` | `#f5f5f5` | `#2c2c2e` | Elevated surface |
| `--bg-elevated` | `#ffffff` | `#2c2c2e` | Modals, dropdowns |
| `--bg-surface` | `#f9fafb` | `#1c1c1e` | Input backgrounds |

### 1.6 Text Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--text-primary` | `#111827` | `#ffffff` | Main text |
| `--text-secondary` | `#4b5563` | `#a1a1a6` | Secondary text |
| `--text-tertiary` | `#9ca3af` | `#8e8e93` | Tertiary text |
| `--text-disabled` | `#d1d5db` | `#636366` | Disabled text |
| `--text-inverse` | `#ffffff` | `#000000` | Text on dark |

### 1.7 Brand Gradient

```css
--gradient-brand: linear-gradient(135deg, #6366f1, #8b5cf6);
--gradient-instagram: linear-gradient(45deg, #833ab4, #e1306c, #f77737);
```

---

## 2. Typography

### 2.1 Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Body text |
| `--font-mono` | `'Fira Code', 'SF Mono', 'Consolas', monospace` | Code |

### 2.2 Font Sizes

| Token | Value | px | Usage |
|-------|-------|-----|-------|
| `--text-xs` | 0.75rem | 12px | Labels, captions |
| `--text-sm` | 0.875rem | 14px | Secondary text |
| `--text-base` | 1rem | 16px | Body text |
| `--text-lg` | 1.125rem | 18px | Large body |
| `--text-xl` | 1.25rem | 20px | Small headings |
| `--text-2xl` | 1.5rem | 24px | Headings |
| `--text-3xl` | 1.875rem | 30px | Large headings |
| `--text-4xl` | 2.25rem | 36px | Hero text |
| `--text-5xl` | 3rem | 48px | Display |

### 2.3 Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-light` | 300 | Decorative |
| `--font-normal` | 400 | Body text |
| `--font-medium` | 500 | Emphasis |
| `--font-semibold` | 600 | Headings |
| `--font-bold` | 700 | Strong emphasis |
| `--font-black` | 900 | Display |

### 2.4 Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--leading-none` | 1 | Tight headings |
| `--leading-tight` | 1.25 | Headings |
| `--leading-snug` | 1.375 | Card titles |
| `--leading-normal` | 1.5 | Body text |
| `--leading-relaxed` | 1.75 | Long text |
| `--leading-loose` | 2 | Display |

### 2.5 Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tighter` | -0.05em | Large text |
| `--tracking-tight` | -0.025em | Headings |
| `--tracking-normal` | 0 | Body |
| `--tracking-wide` | 0.025em | Small caps |
| `--tracking-wider` | 0.05em | Labels |

---

## 3. Spacing

### 3.1 Base Scale

| Token | Value | px | Usage |
|-------|-------|-----|-------|
| `--space-0` | 0 | 0 | No space |
| `--space-1` | 0.25rem | 4px | Tight |
| `--space-2` | 0.5rem | 8px | Small |
| `--space-3` | 0.75rem | 12px | Default |
| `--space-4` | 1rem | 16px | Medium |
| `--space-5` | 1.25rem | 20px | Large |
| `--space-6` | 1.5rem | 24px | XL |
| `--space-8` | 2rem | 32px | 2XL |
| `--space-10` | 2.5rem | 40px | 3XL |
| `--space-12` | 3rem | 48px | 4XL |
| `--space-16` | 4rem | 64px | Section |
| `--space-20` | 5rem | 80px | Page |
| `--space-24` | 6rem | 96px | Hero |

---

## 4. Borders

### 4.1 Border Widths

| Token | Value | Usage |
|-------|-------|-------|
| `--border-0` | 0 | No border |
| `--border` | 1px | Default |
| `--border-2` | 2px | Emphasis |
| `--border-4` | 4px | Strong |

### 4.2 Border Radius

| Token | Value | px | Usage |
|-------|-------|-----|-------|
| `--radius-none` | 0 | 0 | None |
| `--radius-sm` | 0.125rem | 2px | Inputs |
| `--radius` | 0.25rem | 4px | Small |
| `--radius-md` | 0.5rem | 8px | Buttons |
| `--radius-lg` | 0.75rem | 12px | Cards |
| `--radius-xl` | 1rem | 16px | Modals |
| `--radius-2xl` | 1.5rem | 24px | Large |
| `--radius-3xl` | 2rem | 32px | Special |
| `--radius-full` | 9999px | - | Pills |

---

## 5. Shadows

### 5.1 Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | none | None |
| `--shadow-xs` | 0 1px 2px 0 rgb(0 0 0 / 0.05) | Subtle |
| `--shadow-sm` | 0 1px 2px 0 rgb(0 0 0 / 0.05) | Cards |
| `--shadow` | 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) | Dropdowns |
| `--shadow-md` | 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) | Modals |
| `--shadow-lg` | 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) | Popovers |
| `--shadow-xl` | 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) | Overlays |
| `--shadow-2xl` | 0 25px 50px -12px rgb(0 0 0 / 0.25) | Fullscreen |
| `--shadow-inner` | inset 0 2px 4px 0 rgb(0 0 0 / 0.05) | Inner |

### 5.2 Special Shadows

```css
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
--shadow-glow-accent: 0 0 20px rgba(139, 92, 246, 0.3);
```

---

## 6. Transitions

### 6.1 Timing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Entering |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Leaving |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Both |
| `--ease-spring` | cubic-bezier(0.25, 0.46, 0.45, 0.94) | Spring |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | Bounce |

### 6.2 Durations

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-0` | 0ms | Instant |
| `--duration-75` | 75ms | Fast |
| `--duration-100` | 100ms | Quick |
| `--duration-150` | 150ms | Normal |
| `--duration-200` | 200ms | Default |
| `--duration-300` | 300ms | Slow |
| `--duration-500` | 500ms | Slower |

### 6.3 Combined Transitions

```css
--transition-fast: 150ms ease-out;
--transition-base: 200ms ease-out;
--transition-slow: 300ms ease-out;
```

---

## 7. Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-0` | 0 | Base |
| `--z-10` | 10 | Dropdowns |
| `--z-20` | 20 | Sticky |
| `--z-30` | 30 | Fixed |
| `--z-40` | 40 | Modal backdrop |
| `--z-50` | 50 | Modals |
| `--z-60` | 60 | Popovers |
| `--z-70` | 70 | Tooltips |
| `--z-80` | 80 | Toast |
| `--z-90` | 90 | Debug |
| `--z-100` | 100 | Max |

---

## 8. Layout Tokens

### 8.1 Navigation Heights

```css
--height-topbar: 56px;
--height-bottom-nav: 64px;
--height-sidebar: 100vh;
--height-sidebar-collapsed: 72px;
```

### 8.2 Layout Widths

```css
--width-sidebar: 260px;
--width-sidebar-collapsed: 72px;
--width-content-max: 1200px;
--width-card-max: 720px;
```

---

## 9. Recommended TailwindCSS 4 Configuration

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // ... semantic colors
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
    }
  }
}
```

---

## 10. Dark Mode Implementation

```css
/* Use TailwindCSS 4's built-in dark mode */
@custom-variant dark (&:is(.dark *));

/* Automatic dark mode based on system preference */
@media (prefers-color-scheme: dark) {
  :root.dark-auto {
    /* Dark tokens */
  }
}

/* Manual dark mode toggle */
.dark {
  /* Dark tokens override */
}
```

---

## 11. Usage Examples

### 11.1 Button Component

```tsx
const buttonVariants = cva(
  // Base
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### 11.2 Card Component

```tsx
const cardVariants = cva(
  "rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 dark:border-gray-700",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-md hover:shadow-lg",
        outline: "border-2 border-gray-200 dark:border-gray-700 shadow-none",
      },
      padding: {
        none: "",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);
```

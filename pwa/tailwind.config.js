/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@assistant-ui/react/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors (Indigo/Purple Gradient)
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',  // Base indigo
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        
        // Accent Colors (Violet)
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',  // Base violet
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        
        // Background Colors
        bg: {
          primary: '#FAFAFA',   // Soft white
          secondary: '#FFFFFF', // Pure white
          tertiary: '#F5F5F5',  // Light gray
        },
        
        // Text Colors
        text: {
          primary: '#111827',   // Dark text
          secondary: '#4B5563', // Medium gray text
          tertiary: '#9CA3AF',  // Light gray text
          inverse: '#FFFFFF',   // White text
        },
        
        // Neutral Grays
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        
        // Semantic Colors
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
        
        // ACU Type Colors
        acu: {
          statement: '#6366f1',  // Indigo
          question: '#8b5cf6',   // Violet
          answer: '#10b981',     // Green
          code: '#f59e0b',       // Amber
          formula: '#ec4899',    // Pink
          table: '#06b6d4',      // Cyan
          image: '#8b5cf6',      // Violet
          tool: '#4f46e5',       // Indigo
        }
      },
      
      // Spacing System
      spacing: {
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.25rem',   // 20px
        6: '1.5rem',    // 24px
        8: '2rem',      // 32px
        10: '2.5rem',   // 40px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
        20: '5rem',     // 80px
        24: '6rem',     // 96px
      },
      
      // Border Radius
      borderRadius: {
        sm: '0.25rem',  // 4px
        md: '0.5rem',   // 8px
        lg: '0.75rem',  // 12px
        xl: '1rem',     // 16px
        '2xl': '1.5rem', // 24px
        full: '9999px',  // Circle
      },
      
      // Shadows
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      
      // Z-index
      zIndex: {
        base: '0',
        dropdown: '10',
        sticky: '20',
        fixed: '30',
        'modal-backdrop': '40',
        modal: '50',
        popover: '60',
        tooltip: '70',
      },
      
      // Transitions
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      
      // Typography
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],   // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
      },
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['Fira Code', 'SF Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

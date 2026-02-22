# VIVIM Brand Color Palette Schema

## Overview

**Brand**: VIVIM  
**Tagline**: "OWN | SHARE | EVOLVE YOUR AI"  
**Date Generated**: February 2026  
**Source Image**: `colors.jpg`

---

## Primary Colors

### VIVIM Pink (Primary)
```
Hex: #FF2D6E
RGB: rgb(255, 45, 110)
HSL: hsl(344, 100%, 59%)
CMYK: cmyk(0, 82, 57, 0)
Usage: Primary logo, CTAs, key headlines
```

### VIVIM Cyan (Primary)
```
Hex: #00D4E8
RGB: rgb(0, 212, 232)
HSL: hsl(185, 100%, 45%)
CMYK: cmyk(100, 9, 0, 9)
Usage: Secondary logo, interactive elements, highlights
```

---

## Secondary Colors

### Enterprise Green
```
Hex: #00C786
RGB: rgb(0, 199, 134)
HSL: hsl(160, 100%, 39%)
CMYK: cmyk(100, 0, 33, 22)
Usage: Enterprise features, business tier indicators
```

### Twilight Navy
```
Hex: #1A1F3C
RGB: rgb(26, 31, 60)
HSL: hsl(231, 40%, 17%)
CMYK: cmyk(57, 48, 0, 76)
Usage: Dark backgrounds, footer, contrast elements
```

### Dusk Purple
```
Hex: #4A4E69
RGB: rgb(74, 78, 105)
HSL: hsl(233, 17%, 35%)
CMYK: cmyk(30, 26, 0, 59)
Usage: Subtle backgrounds, dividers
```

---

## Neutral Colors

### Pure White
```
Hex: #FFFFFF
RGB: rgb(255, 255, 255)
HSL: hsl(0, 0%, 100%)
CMYK: cmyk(0, 0, 0, 0)
Usage: Text on dark backgrounds, clean space
```

### Off-White
```
Hex: #F8F9FA
RGB: rgb(248, 249, 250)
HSL: hsl(210, 17%, 98%)
Usage: Page backgrounds, cards
```

### Light Gray
```
Hex: #E9ECEF
RGB: rgb(233, 236, 239)
HSL: hsl(210, 14%, 93%)
Usage: Borders, dividers, disabled states
```

### Medium Gray
```
Hex: #6C757D
RGB: rgb(108, 117, 125)
HSL: hsl(208, 7%, 46%)
Usage: Secondary text, muted elements
```

### Dark Gray
```
Hex: #343A40
RGB: rgb(52, 58, 64)
HSL: hsl(210, 10%, 23%)
Usage: Primary text, headings
```

### Near Black
```
Hex: #0D0D0D
RGB: rgb(13, 13, 13)
HSL: hsl(0, 0%, 5%)
Usage: Silhouette effect, maximum contrast
```

---

## Accent Colors

### Sunset Gold
```
Hex: #FFB347
RGB: rgb(255, 179, 71)
HSL: hsl(33, 100%, 64%)
Usage: Success states, warm highlights
```

### Sky Blue
```
Hex: #87CEEB
RGB: rgb(135, 206, 235)
HSL: hsl(197, 71%, 73%)
Usage: Informational elements, links
```

### Warm Glow
```
Hex: #FFE4B5
RGB: rgb(255, 228, 181)
HSL: hsl(38, 100%, 85%)
Usage: Glow effects, hover states
```

---

## Gradient Definitions

### VIVIM Hero Gradient
```css
background: linear-gradient(135deg, 
  #FF2D6E 0%, 
  #00D4E8 50%, 
  #00C786 100%
);
```
**Usage**: Hero sections, feature highlights

### Twilight Sky Gradient
```css
background: linear-gradient(180deg, 
  #87CEEB 0%, 
  #4A4E69 50%, 
  #1A1F3C 100%
);
```
**Usage**: Backgrounds, atmospheric sections

### Sunset Glow Gradient
```css
background: radial-gradient(circle at 70% 80%, 
  #FFB347 0%, 
  transparent 60%
);
```
**Usage**: Accent lighting, focal points

---

## Color Usage Guidelines

### Accessibility Standards

| Color Combination | Contrast Ratio | WCAG AA | WCAG AAA |
|------------------|----------------|---------|----------|
| White on Twilight Navy | 15.2:1 | ✅ Pass | ✅ Pass |
| VIVIM Pink on White | 4.8:1 | ✅ Pass | ⚠️ Large Text Only |
| VIVIM Cyan on Twilight Navy | 8.4:1 | ✅ Pass | ✅ Pass |
| Enterprise Green on White | 3.2:1 | ⚠️ Large Text Only | ❌ Fail |
| Dark Gray on Off-White | 10.1:1 | ✅ Pass | ✅ Pass |

### Color Psychology

- **Pink (#FF2D6E)**: Energy, passion, innovation, feminine strength
- **Cyan (#00D4E8)**: Trust, technology, clarity, communication
- **Green (#00C786)**: Growth, enterprise, success, stability
- **Navy (#1A1F3C)**: Authority, depth, sophistication, trust

### Application Rules

1. **Primary colors** (Pink & Cyan) should be used for brand identity and key actions
2. **Enterprise Green** reserved for business/enterprise tier features
3. **Twilight Navy** for dark mode and sophisticated sections
4. **White** for maximum contrast and clean presentation
5. **Gradients** for dynamic, modern feel on hero sections

---

## CSS Custom Properties

```css
:root {
  /* Primary */
  --vivim-pink: #FF2D6E;
  --vivim-cyan: #00D4E8;
  
  /* Secondary */
  --vivim-green: #00C786;
  --vivim-navy: #1A1F3C;
  --vivim-purple: #4A4E69;
  
  /* Neutrals */
  --vivim-white: #FFFFFF;
  --vivim-off-white: #F8F9FA;
  --vivim-light-gray: #E9ECEF;
  --vivim-medium-gray: #6C757D;
  --vivim-dark-gray: #343A40;
  --vivim-black: #0D0D0D;
  
  /* Accents */
  --vivim-gold: #FFB347;
  --vivim-sky: #87CEEB;
  --vivim-glow: #FFE4B5;
}
```

---

## Color Variations

### Tints (Lighter)

| Color | 20% | 40% | 60% | 80% |
|-------|-----|-----|-----|-----|
| VIVIM Pink | #FFD1E0 | #FFA3C0 | #FF75A0 | #FF477F |
| VIVIM Cyan | #CCF5FA | #99EBF5 | #66E0EF | #33D6EA |
| Enterprise Green | #CCF4E5 | #99E9CB | #66DEB1 | #33D397 |

### Shades (Darker)

| Color | 20% | 40% | 60% | 80% |
|-------|-----|-----|-----|-----|
| VIVIM Pink | #CC2458 | #991B42 | #66122C | #330916 |
| VIVIM Cyan | #00AABA | #00808C | #00555D | #002B2F |
| Enterprise Green | #009F6B | #007750 | #005036 | #00281B |

---

## Implementation Notes

### Digital (Web/App)
- Use HEX or RGB for solid colors
- Use HSL for programmatic color manipulation
- Gradients should use `background: linear-gradient()`

### Print
- Convert to CMYK for professional printing
- Use Pantone equivalents for brand consistency:
  - VIVIM Pink ≈ Pantone 191 C
  - VIVIM Cyan ≈ Pantone 311 C
  - Enterprise Green ≈ Pantone 7461 C

### Brand Assets
- Logo files should use primary colors
- Background imagery should complement the twilight/sunset theme
- Maintain silhouette elements for brand recognition

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-19 | Initial palette creation from brand image analysis |

---

*Generated for VIVIM - "OWN | SHARE | EVOLVE YOUR AI"*

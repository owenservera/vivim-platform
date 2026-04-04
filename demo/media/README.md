# VIVIM Demo Media

**Generated:** March 19, 2026  
**Status:** ✅ Ready for Investor Presentations

---

## Quick Start

```bash
# Generate all media assets
bun run demo/scripts/generate-media.ts

# Open pitch deck
open demo/media/pitch-deck.html

# View generated SVGs
open demo/media/screenshots/knowledge-graph.svg
```

---

## Directory Structure

```
demo/media/
├── screenshots/          # SVG mockups of key screens
│   ├── knowledge-graph.svg
│   ├── for-you-feed.svg
│   ├── context-cockpit.svg
│   └── archive-timeline.svg
│
├── videos/               # Video scripts and storyboards
│   ├── 90-second-pitch.md
│   └── feature-exploration.md
│
├── gifs/                 # Animated GIFs (to be generated)
│
├── slides/               # Individual pitch deck slides
│   ├── slide-01-problem.svg
│   ├── slide-02-solution.svg
│   ├── slide-03-archive.svg
│   ├── slide-04-graph.svg
│   ├── slide-05-context.svg
│   └── slide-06-vision.svg
│
├── social/               # Social media assets
│   ├── twitter-card.svg
│   └── linkedin-banner.svg
│
└── pitch-deck.html       # Interactive pitch deck
```

---

## Generated Assets

### 1. Screen Mockups (SVG)

| File | Description | Dimensions |
|------|-------------|------------|
| `knowledge-graph.svg` | Force-directed graph visualization | 1920x1080 |
| `for-you-feed.svg` | Personalized feed with cards | 1920x1080 |
| `context-cockpit.svg` | Context assembly dashboard | 1920x1080 |
| `archive-timeline.svg` | Conversation timeline | 1920x1080 |

**Features:**
- Scalable vector graphics (crisp at any size)
- Brand colors (#EF9F27 orange, #0a0a0f dark)
- Realistic data (320 conversations, 2,161 ACUs)
- Ready for conversion to PNG

**Convert to PNG:**
```bash
# Using Inkscape (recommended)
inkscape --export-filename=knowledge-graph.png --export-width=1920 knowledge-graph.svg

# Using online converter
https://cloudconvert.com/svg-to-png
```

---

### 2. Video Scripts

#### 90-Second Investor Pitch

**File:** `videos/90-second-pitch.md`

**Structure:**
- 0-15s: The Hook (problem)
- 15-20s: The Reveal (VIVIM)
- 20-35s: Magic #1 (Capture)
- 35-60s: Magic #2 (Knowledge Graph) ⭐
- 55-70s: Magic #3 (Context Engine)
- 70-80s: The Payoff
- 80-90s: The Close

**Includes:**
- Exact timing for each scene
- Voiceover script
- Visual descriptions
- On-screen text
- Sound effect cues
- Backup plan

#### Feature Exploration (3 min)

**File:** `videos/feature-exploration.md`

**Sections:**
1. Core Capture (30s)
2. Knowledge Graph (45s)
3. Context Engine (40s)
4. For You Feed (30s)
5. Social Sharing (35s)

---

### 3. Pitch Deck Slides (SVG)

| Slide | File | Content |
|-------|------|---------|
| 1 | `slide-01-problem.svg` | The Problem |
| 2 | `slide-02-solution.svg` | VIVIM Solution |
| 3 | `slide-03-archive.svg` | The Archive |
| 4 | `slide-04-graph.svg` | Knowledge Graph |
| 5 | `slide-05-context.svg` | Context Engine |
| 6 | `slide-06-vision.svg` | The Vision |

**Usage:**
1. Import into Keynote / PowerPoint
2. Use as-is for web presentations
3. Convert to PDF for email

---

### 4. Social Media Assets

| File | Platform | Dimensions |
|------|----------|------------|
| `twitter-card.svg` | Twitter/X | 1200x630 |
| `linkedin-banner.svg` | LinkedIn | 1584x396 |

**Includes:**
- VIVIM branding
- Tagline: "Own Your AI Brain"
- Brand colors

---

### 5. Interactive Pitch Deck (HTML)

**File:** `pitch-deck.html`

**Features:**
- 8 slides with smooth transitions
- Keyboard navigation (← → arrows)
- Touch support (swipe on mobile)
- Animated slide elements
- Progress indicator
- Responsive design

**Usage:**
```bash
# Open in browser
open demo/media/pitch-deck.html

# Or drag into Chrome/Safari
```

**Controls:**
- `→` or `Space` — Next slide
- `←` — Previous slide
- `Home` — First slide
- `End` — Last slide
- Click — Next slide
- Swipe — Mobile navigation

---

## How to Use in Presentations

### Investor Meeting (Live Demo)

1. **Open pitch deck:** `pitch-deck.html`
2. **Present slides 1-4** (2 minutes)
3. **Switch to live demo** (3 minutes)
4. **Return to slides 5-8** (2 minutes)
5. **Q&A** (remaining time)

### Email Pitch

1. Export pitch deck to PDF
2. Include 2-3 key mockups as attachments
3. Link to interactive deck: `pitch-deck.html`

### Social Media

1. Convert SVG assets to PNG
2. Post with caption:
   > "Your AI conversations from ChatGPT, Claude, Gemini — unified. Own your AI brain with VIVIM. #AI #Productivity"
3. Link to: `vivim.app`

### Website / Landing Page

1. Use `for-you-feed.svg` as hero image
2. Embed `pitch-deck.html` in iframe
3. Use video script to record demo video

---

## Customization

### Change Brand Colors

Edit `demo/scripts/generate-media.ts`:

```typescript
const CONFIG = {
  colors: {
    primary: '#EF9F27',      // Change this
    background: '#0a0a0f',   // Change this
    // ...
  },
};
```

Then re-run:
```bash
bun run demo/scripts/generate-media.ts
```

### Update Stats

Edit the SVG files directly or update the generator script.

### Add Your Logo

Replace logo references in:
- `pitch-deck.html`
- Individual slide SVGs
- Social media assets

---

## Recording the 90-Second Pitch

### Equipment Needed

- Screen recording software (Loom, OBS, QuickTime)
- Microphone (USB mic or laptop built-in)
- Quiet room

### Steps

1. **Open PWA** in browser (or use SVG mockups)
2. **Start recording** (1080p, 30fps)
3. **Follow script** in `videos/90-second-pitch.md`
4. **Record voiceover** simultaneously or add later
5. **Edit** (optional): Add music, sound effects
6. **Export:** MP4, 1080p, H.264

### Recommended Tools

| Tool | Purpose | Cost |
|------|---------|------|
| Loom | Screen recording | Free |
| OBS Studio | Advanced recording | Free |
| Descript | Editing + voiceover | $12/mo |
| Epidemic Sound | Background music | $15/mo |

---

## File Sizes

| Asset Type | Approximate Size |
|------------|------------------|
| SVG mockup | 10-30 KB |
| PNG (exported) | 500 KB - 2 MB |
| Video script | 10 KB |
| HTML deck | 20 KB |
| Social asset | 5-15 KB |

---

## Troubleshooting

### SVG Not Displaying

**Problem:** SVG shows blank or broken

**Solution:**
1. Open in browser directly
2. Check for XML syntax errors
3. Ensure all color values are valid hex

### Pitch Deck Not Navigating

**Problem:** Arrow keys don't work

**Solution:**
1. Click on deck first (give it focus)
2. Try spacebar or click to advance
3. Check browser console for errors

### Colors Look Wrong

**Problem:** Brand colors don't match

**Solution:**
1. Check monitor color calibration
2. Verify hex values in SVG files
3. Re-run generator with correct colors

---

## Next Steps

### Immediate

1. ✅ Review generated assets
2. ✅ Test pitch deck navigation
3. ✅ Convert SVGs to PNGs (if needed)
4. ⏳ Record 90-second pitch video

### Short-term

1. Customize with real metrics
2. Add company logo
3. Create animated GIFs
4. Record feature exploration video

### Long-term

1. Professional video production
2. Animated logo intro
3. Customer testimonial clips
4. Product demo GIFs

---

## Related Documentation

- [Journey System README](../JOURNEY_SYSTEM_README.md)
- [Automated Capture Design](../AUTOMATED_CAPTURE_SYSTEM_DESIGN.md)
- [User Journey Scripts](../scripts/user-journey-scripts.md)
- [Execution Summary](../EXECUTION_SUMMARY.md)

---

**Last Updated:** March 19, 2026  
**Status:** ✅ Production Ready

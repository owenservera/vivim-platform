# Demo Assets

Additional assets for investor presentations.

## Contents

```
assets/
├── device-mockups/     # Device frames (phones, laptops)
├── gifs/               # Animated demos
├── icons/              # Custom icons
└── logos/              # Brand assets
```

## Device Mockups

Use `appshots` for device framing:
```bash
npx appshots frame screenshot.png \
  --device macbook-13 \
  --background "linear-gradient(135deg, #667eea, #764ba2)"
```

## GIF Generation

For animated demos:
```bash
# Use LConvert or similar
gifgen -o demo.gif frame1.png frame2.png frame3.png
```

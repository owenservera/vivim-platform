# Screenshots

Captured screenshots for investor presentations and slides.

## Directory Structure

```
screenshots/
├── onboarding/          # First-run experience
├── core-features/       # Main feature demos
├── knowledge-graph/     # Knowledge graph canvas
├── sharing/            # Circles and sharing
└── social/             # Friends and groups
```

## Capture Flows

Run screenshot capture:
```bash
bun run demo:capture --flow=<name>
```

Available flows:
- `onboarding` - First-run experience
- `core-features` - Main features
- `knowledge-graph` - Canvas view
- `sharing` - Circles
- `social` - Friends/groups

## Device Presets

Use `appshots` for device framing:
```bash
npx appshots frame screenshot.png --device macbook-13 --background "#0a0a0f"
```

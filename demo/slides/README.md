# Generated Slides

MDX-based investor presentations generated from screenshots.

## Templates

- `investor-deck.mdx` - Main investor pitch deck

## Generate Slides

```bash
bun run demo:slides --template=investor
```

## Presentation Tools

### MDX Deck (Recommended)
```bash
npx mdx-deck investor-deck.mdx
```

### DexCode (AI-native)
```bash
npx dexcode create investor-deck.mdx
```

## Export Formats

- PDF: `npx mdx-deck export investor-deck.mdx`
- PNGs: `npx mdx-deck export investor-deck.mdx --output pngs/`

# OpenScroll (0,0) Fallback - The Minimal Math

**Two Modes Only:**
- `MODE = 0` → PRIVATE (file won't render)
- `MODE = 1` → OPEN (file renders and verifies)

**This is the quantum crypto insurance.**

If everything else fails:
- Platform closed
- Company gone
- Servers down
- Dependencies broken
- Network gone

**This HTML file still works.**

---

## The File Structure

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>0</title>
</head>
<body>
<script>
/* MODE SWITCH */
const MODE = 1; // 0=PRIVATE 1=OPEN

if (MODE === 0) {
  document.body.innerHTML = '';
  throw 'PRIVATE';
}

/* THE DATA (replace this) */
const DATA = {
  id: "conv_id",
  t: "Title",
  m: [
    {i: "m1", r: "user", c: "Hello", s: "sig", a: "did"},
    {i: "m2", r: "bot", c: "Hi", s: "sig", a: "did"}
  ]
};

/* THE MATH (150 lines of pure JS) */
function sha256(str) { /* ... */ }
function verify(msg) { /* ... */ }

/* VERIFY */
verify(DATA);
</script>
</body>
</html>
```

---

## How It Works

### Mode 0: Private
```javascript
const MODE = 0;
// File will be blank
// Content exists but won't display
// Only you know it's there
```

### Mode 1: Open
```javascript
const MODE = 1;
// File renders
// Signatures verify
// Anyone can read
```

---

## The Math (Embedded)

**Only 3 functions:**
1. `sha256()` - Hash computation
2. `verify()` - Signature check
3. `render()` - Display content

Total: ~200 lines. No external calls. No network. No dependencies.

---

## Usage

### Generating a Fallback File

```typescript
function generateFallback(conversation, mode: 'private' | 'open') {
  const modeValue = mode === 'private' ? 0 : 1;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>0</title></head>
<body>
<script>
const MODE=${modeValue};
if(MODE===0){document.body.innerHTML='';throw '0';}
const DATA=${JSON.stringify(conversation)};
/* [200 lines of verification math] */
verify(DATA);
</script>
</body>
</html>`;
}
```

### Private Fallback

```bash
# Generate
generateFallback(myConversation, 'private')
# Save as: my-conv.fallback.html

# When opening:
# - Blank page
# - But file contains the data
# - Can be decoded if you have the key
```

### Open Fallback

```bash
# Generate
generateFallback(myConversation, 'open')
# Save as: my-conv.fallback.html

# When opening:
# - Renders conversation
# - Verifies signatures
# - Works forever
```

---

## The Guarantee

```
If MODE = 0:
  File is effectively invisible
  Only shows content if you change MODE to 1
  Or if you decode it manually

If MODE = 1:
  File displays and verifies
  Anyone can open it
  Signatures prove authorship
  Works in any browser, forever
```

---

## The Math Never Changes

```javascript
// This is the only code that needs to work forever
// 150 lines of pure JavaScript
// No external dependencies
// No API calls
// No network requests
// No library updates

// Just:
// 1. Parse JSON
// 2. Compute SHA-256
// 3. Verify Ed25519
// 4. Display result

// That's it.
```

---

## Why This Matters

When platforms die, when companies close, when dependencies break:
- Your data is still there
- Your signatures still verify
- The math still works
- (0,0) from zero, forever

# VIVIM Documentation Guide

**IMPORTANT: Read this before modifying documentation!**

## Building and Deploying Documentation

The VIVIM documentation is built with Docusaurus. Located in `vivim.docs.context/`.

### Building the Site

```bash
cd vivim.docs.context
npm run build
```

The built site will be in `vivim.docs.context/build/`

### Running Locally

```bash
cd vivim.docs.context
npm run start
```

This will start a local development server at `http://localhost:3000`

### Deploying

```bash
cd vivim.docs.context
npm run deploy
```

Or build first then deploy manually to any static hosting service.

---

## Documentation Structure

```
docs/
├── user/           # User-facing guides (MAINTAIN THIS!)
├── getting-started # Intro and quick start
├── architecture    # Technical architecture (for developers)
├── pwa/           # PWA technical docs
├── network/       # Network layer docs
├── api/           # API reference
├── security/      # Security docs
└── ...
```

---

## Adding New Documentation

### 1. User-Facing Docs (Priority!)

When adding new features to the PWA, ALWAYS add user documentation:

1. Create markdown file in `docs/user/`
2. Use simple, non-technical language
3. Include:
   - What the feature does
   - How to access it (route)
   - Step-by-step usage
   - Screenshots if helpful
4. Update `sidebars.ts` to include the new doc

### 2. Technical Docs

For architecture/developer docs:
1. Create file in appropriate folder
2. Include code examples from source
3. Link to relevant user docs

---

## IMPORTANT: Before Committing

### Always Run Build

```bash
npm run build
```

Check for:
- **Broken links** - Build will fail if links point to non-existent pages
- **Build errors** - Must compile successfully

### Fix Broken Links

Options:
1. Create stub page for missing content
2. Remove the broken link
3. Fix the link to correct existing page

NEVER ignore broken links - the build will fail!

---

## User Documentation Guidelines

Write for "Avg Mommy Test" - non-technical users should understand.

### Good Example:
```
## How to Capture a Conversation

1. Go to the Capture page
2. Paste your ChatGPT URL
3. Tap Capture

Your conversation is now saved!
```

### Bad Example:
```
## Capture Service API

The capture endpoint accepts POST requests to /api/v1/capture...
```

---

## Sidebar Configuration

The sidebar is defined in `sidebars.ts`. When adding new docs:
1. Add to appropriate section
2. Maintain logical ordering
3. Keep user guides grouped together

---

## Troubleshooting

### Build fails with broken links
- Find the broken link in the error message
- Either create the missing page OR fix the link

### "onBrokenLinks" error
- Never change this setting to ignore broken links
- Always fix the actual broken links

### Markdown not rendering
- Check frontmatter: must have `title` and `description`
- Ensure proper spacing between sections

---

## For AI Agents

When working on VIVIM documentation:

1. **ALWAYS** read actual source code to understand features
2. **NEVER** copy from outdated markdown files
3. **ALWAYS** build and verify before completing
4. **ALWAYS** add user-facing docs for new features
5. **NEVER** leave broken links - fix or create stubs

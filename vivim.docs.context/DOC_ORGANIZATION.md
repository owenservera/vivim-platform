# 📋 VIVIM Documentation Organization Guide

This document defines the structure and organization of the VIVIM documentation system.

---

## Folder Structure

```
vivim.docs.context/
├── docs/                    # Main documentation content
│   ├── user/               # End-user guides (non-technical)
│   ├── getting-started/    # Introduction & setup
│   ├── architecture/       # Technical architecture
│   ├── pwa/               # Frontend/PWA docs
│   ├── network/           # P2P networking
│   ├── api/               # REST API reference
│   ├── security/          # Security documentation
│   ├── social/             # Social features
│   ├── admin/              # Admin panel docs
│   ├── .current/           # Working documents (internal)
│   └── _legacy/            # Archived content (read-only)
├── blog/                   # Blog posts (empty)
├── src/                    # Docusaurus theme customization
├── static/                 # Static assets
├── docusaurus.config.ts    # Docusaurus configuration
├── sidebars.ts             # Navigation sidebar
└── DOCUMENTATION_GUIDE.md # Writing guidelines
```

---

## Documentation Categories

### 1. User Guides (`docs/user/`)

**Audience**: End users who want to use VIVIM

**Characteristics**:
- Non-technical language
- Step-by-step instructions
- Screenshots encouraged
- Focus on "what" and "how"

**Examples**:
- `getting-started.md` - First-time setup
- `capturing-conversations.md` - Importing chats
- `searching-finding.md` - Finding content

### 2. Architecture Docs (`docs/architecture/`)

**Audience**: Developers who need to understand system design

**Characteristics**:
- Technical depth
- Code examples
- Diagrams
- Focus on "why" and "how it works"

**Examples**:
- `overview.md` - System overview
- `server.md` - Backend architecture
- `context.md` - Context engine

### 3. Module Docs (`docs/{module}/`)

**Audience**: Developers working on specific modules

**Characteristics**:
- API references
- Implementation details
- Configuration options

**Examples**:
- `docs/pwa/` - Frontend documentation
- `docs/network/` - P2P networking
- `docs/api/` - REST API

### 4. Working Docs (`docs/.current/`)

**Audience**: Development team only

**Characteristics**:
- In-progress content
- Internal research
- Audits and assessments

**Examples**:
- `01-PROJECT-OVERVIEW.md`
- `02-FRONTEND-AUDIT.md`

### 5. Archived Docs (`docs/_legacy/`)

**Purpose**: Historical reference only

**Characteristics**:
- Read-only
- Superseded by current docs
- Not maintained

---

## Naming Conventions

### Files

- Use kebab-case: `getting-started.md`, `context-cockpit.md`
- Use descriptive names: `capturing-conversations.md` not `cap.md`
- Include README.md in each folder

### Frontmatter

All docs must include:

```yaml
---
id: unique-id
title: Human Readable Title
description: Brief description (150 chars max)
sidebar_position: 1
---
```

---

## Sidebar Organization

The sidebar is configured in `sidebars.ts`. Categories:

1. **Getting Started** - Introduction & setup
2. **User Guides** - End-user documentation
3. **Architecture** - System design
4. **SDK** - Developer toolkit
5. **PWA** - Frontend
6. **Network** - P2P
7. **API** - REST API
8. **Security** - Security
9. **Social** - Social features
10. **Admin** - Admin panel

---

## Adding New Documentation

### Step 1: Choose the Right Location

| Type of Doc | Location |
|-------------|----------|
| User guide | `docs/user/` |
| Architecture | `docs/architecture/` |
| Module reference | `docs/{module}/` |
| Working draft | `docs/.current/` |
| Old version | Leave in `_legacy/` |

### Step 2: Create the File

```markdown
---
id: my-new-feature
title: My New Feature
description: What this feature does
sidebar_position: 5
---

# My New Feature

## Overview

Brief description...

## Usage

Step-by-step guide...
```

### Step 3: Update Sidebar

Add to appropriate section in `sidebars.ts`:

```typescript
{
  type: 'doc',
  id: 'user/my-new-feature',
  label: 'My New Feature',
},
```

### Step 4: Test

```bash
npm run build
npm run start
```

---

## Maintenance

### Regular Tasks

- [ ] Review `.current/` for items ready to promote
- [ ] Check for broken links
- [ ] Update outdated content
- [ ] Verify builds pass

### Cleanup Tasks

- [ ] Archive superseded docs to `_legacy/`
- [ ] Remove duplicate content
- [ ] Consolidate related docs

---

## Anti-Patterns

### DON'T

- Add new content to `_legacy/`
- Create deep nesting (max 2 levels)
- Use vague filenames (`doc1.md`)
- Leave orphaned docs (unlinked)

### DO

- Use descriptive names
- Keep user/technical docs separate
- Link related docs
- Test builds before committing

---

*Last Updated: March 2026*

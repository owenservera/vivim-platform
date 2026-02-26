# VIVIM Context Documentation Generation Workflow

> **Purpose:** Generate and maintain VIVIM's AI identity context
> **Output:** `VIVIM_IDENTITY_PROMPT.md` and JSON context for the runtime
> **Trigger:** Manual or CI/CD on VIVIM platform enhancements

---

## Overview

This workflow regenerates VIVIM's identity context when:
1. New features are added to VIVIM
2. Capabilities change
3. Pricing/terms update
4. New AI providers are supported
5. Quarterly refresh

---

## Source Files

The VIVIM identity is compiled from multiple sources:

```
VIVIM.docs/
├── VIVIM_IDENTITY_PROMPT.md    ← MAIN OUTPUT (this gets regenerated)
├── VIVIM_V1_FEATURES.md         ← Feature list source
├── CONTEXT/
│   └── dynamic-context-design.md ← Context pipeline design
├── DATABASES/
│   └── SCHEMA.prod/
│       └── VIVIM_DATABASE_MASTER_SPEC_V1.md ← Data model
└── [other docs]
```

---

## Generation Process

### Step 1: Aggregate Feature Data

Pull from `VIVIM_V1_FEATURES.md`:
- All P0 (MVP) features
- Provider support list
- Core capabilities

### Step 2: Extract Architecture Updates

From `CONTEXT/dynamic-context-design.md`:
- Context layer definitions
- Pipeline changes

### Step 3: Update Capabilities

From recent PRDs/designs:
- New AI providers
- New integrations
- Limitations/changes

### Step 4: Regenerate Output

```bash
# Generate VIVIM identity context
cd VIVIM.docs/CONTEXT
node generate-vivim-context.js
```

This produces:
1. `VIVIM_IDENTITY_PROMPT.md` - Human-readable identity
2. `vivim-identity-context.json` - Machine-readable for runtime

---

## Machine-Readable Format

The JSON output (`vivim-identity-context.json`) is used by the runtime:

```json
{
  "version": "1.0.0",
  "updatedAt": "2026-02-13T00:00:00Z",
  "identity": {
    "name": "VIVIM",
    "tagline": "Own Your AI",
    "pillars": ["Feed", "Vault", "Capture", "Chat"],
    "description": "Consumer app for capturing, owning, evolving, and sharing AI conversations"
  },
  "capabilities": {
    "supportedProviders": ["openai", "anthropic", "google", "mistral", "deepseek", "grok", "kimi", "qwen", "z"],
    "features": {
      "capture": true,
      "vault": true,
      "byok": true,
      "social": true,
      "acu": true
    }
  },
  "limitations": {
    "noRealtimeGeneration": true,
    "noBuiltinModels": true,
    "noP2PSync": true
  },
  "privacy": {
    "e2eEncryption": true,
    "zeroKnowledgeSync": true,
    "localFirst": true,
    "noAITraining": true
  },
  "layers": [
    {"id": "L0", "name": "VIVIM Identity", "description": "Who VIVIM is"},
    {"id": "L1", "name": "User Identity", "description": "Facts about the user"},
    {"id": "L2", "name": "Preferences", "description": "How to respond"},
    {"id": "L3", "name": "Topic Context", "description": "Current topic"},
    {"id": "L4", "name": "Entity Context", "description": "People/projects"},
    {"id": "L5", "name": "Conversation", "description": "History"},
    {"id": "L6", "name": "JIT Knowledge", "description": "Retrieved ACUs"}
  ],
  "faq": [
    {"q": "What is VIVIM?", "a": "..."},
    {"q": "Is my data safe?", "a": "..."}
  ]
}
```

---

## Integration with Context Pipeline

The VIVIM identity is loaded at **L0** (before user context):

```typescript
// server/src/context/vivim-identity-service.ts
import vivimIdentity from './vivim-identity-context.json';

export function getVIVIMIdentity(): string {
  return vivimIdentity.markdown;
}

export function getVIVIMContext(): VIVIMContext {
  return {
    version: vivimIdentity.version,
    updatedAt: vivimIdentity.updatedAt,
    layers: vivimIdentity.layers,
    capabilities: vivimIdentity.capabilities
  };
}
```

---

## Running the Workflow

### Manual Run

```bash
# From apps root
npm run generate:vivim-context

# Or from VIVIM.docs
cd VIVIM.docs
npm run generate
```

### CI/CD Trigger

The workflow should run when:
- New feature merged to `main`
- Weekly on schedule
- Manual dispatch

```yaml
# .github/workflows/generate-vivim-context.yml
name: Generate VIVIM Context
on:
  push:
    paths:
      - 'VIVIM.docs/**/*.md'
      - '!VIVIM.docs/CONTEXT/VIVIM_IDENTITY_PROMPT.md'
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * 0'  # Weekly Sunday
```

---

## Verification

After generation, verify:

1. ✅ Version incremented
2. ✅ All supported providers listed
3. ✅ New features included
4. ✅ Limitations accurate
5. ✅ JSON parses correctly
6. ✅ Context pipeline integration works

---

## Future: Friends/Network Context

This workflow will expand to include:

```typescript
interface NetworkContext {
  // L7: Friends context
  friends: {
    recentInteractions: string[];
    sharedACUs: ACU[];
    circles: Circle[];
  };
  
  // L8: Network context  
  network: {
    trendingTopics: string[];
    popularACUs: ACU[];
    recommendations: string[];
  };
}
```

---

*Last Updated: February 13, 2026*

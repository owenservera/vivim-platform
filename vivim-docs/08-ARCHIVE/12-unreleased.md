# VIVIM Unreleased & Hidden Features

## Overview

This document catalogs features that exist in code but are not yet shipped. These could be exciting teasers for the cinematic landing page.

---

## Search Methodology

Features were identified by:
1. Searching for TODO/FIXME comments
2. Looking for feature flags
3. Checking for WIP/in-progress files
4. Reviewing roadmap documentation
5. Analyzing commented code blocks

---

## Unreleased Features

### 1. Publishing Agent

| Attribute | Details |
|-----------|---------|
| **Status** | Beta |
| **Location** | `sdk/apps/publishing-agent/` |
| **Description** | Automated content publishing powered by VIVIM memory |
| **Teaser Potential** | **Y** - High |

**Features**:
- Schedule AI-generated content
- Multi-platform publishing
- Content optimization based on memory

---

### 2. Public Dashboard

| Attribute | Details |
|-----------|---------|
| **Status** | Beta |
| **Location** | `sdk/apps/public-dashboard/` |
| **Description** | Analytics and monitoring dashboard |
| **Teaser Potential** | Y - Medium |

**Features**:
- Usage analytics
- Conversation metrics
- Memory insights
- Cost tracking

---

### 3. Blockchain Integration

| Attribute | Details |
|-----------|---------|
| **Status** | Development |
| **Location** | `server/src/blockchain/` |
| **Description** | On-chain verification and trust |
| **Teaser Potential** | Y - High |

**Features**:
- On-chain ACU verification
- Trust scoring
- Immutable audit trail
- Decentralized reputation

---

### 4. Agent Mode (Autonomous Agents)

| Attribute | Details |
|-----------|---------|
| **Status** | Research/Dev |
| **Location** | Research phase |
| **Description** | Full autonomous agents powered by VIVIM memory |
| **Teaser Potential** | **Y** - Very High |

**Vision**:
- AI agents that remember everything
- Autonomous research agents
- Continuous learning from user feedback

---

### 5. Advanced Network Features

| Attribute | Details |
|-----------|---------|
| **Status** | In Progress |
| **Location** | `network/src/` |
| **Description** | Enhanced P2P capabilities |

**Features**:
- Improved peer discovery
- Better CRDT sync
- Offline-first enhancements

---

## Feature Flags

### Active Feature Flags

```typescript
// Example feature flags in codebase
const featureFlags = {
  // Shipping
  capture: true,
  contextEngine: true,
  knowledgeGraph: true,
  circles: true,
  
  // Beta
  publishingAgent: true,     // Beta
  publicDashboard: true,    // Beta
  
  // Development
  blockchainIntegration: false,
  agentMode: false,
  advancedSharing: false,
  
  // Experimental
  voiceCapture: false,
  imageAnalysis: false,
};
```

---

## TODO Items Found

### High Priority TODOs

| Feature | Location | Description |
|---------|----------|-------------|
| Advanced search filters | `server/src/routes/acus.js` | Multi-facet search |
| Real-time collaboration | `pwa/src/components/graph/` | Live graph editing |
| Mobile app | `mobile/` | React Native app |
| Offline mode | `network/src/` | Full offline support |

### Medium Priority TODOs

| Feature | Location | Description |
|---------|----------|-------------|
| Voice capture | `capture/` | Voice-to-ACU |
| Image analysis | `extractors/` | Screenshot extraction |
| Export formats | `server/src/services/portability-service.js` | More export options |
| Webhooks | `server/src/routes/webhooks.js` | Event notifications |

---

## Roadmap Hints

### From Documentation

```markdown
## Phase 2 (In Progress)
- [ ] Advanced sharing permissions
- [ ] Team workspaces
- [ ] API access
- [ ] Mobile notifications

## Phase 3 (Planned)
- [ ] Blockchain verification
- [ ] Autonomous agents
- [ ] Marketplace for agents
- [ ] Enterprise SSO
```

---

## Commented Code

### Areas with Commented Features

| Area | Commented Feature |
|------|------------------|
| Graph visualization | 3D graph view |
| Search | Voice search |
| Sharing | Time-limited shares |
| Import | More provider support |

---

## Teaser Recommendations

### High-Impact Teasers

1. **Autonomous Agents**
   - Teaser: "Your AI, working while you sleep"
   - Status: Research
   - Excitement: Very High

2. **Blockchain Verification**
   - Teaser: "Verify, trust, audit"
   - Status: Development
   - Excitement: High

3. **Publishing Agent**
   - Teaser: "AI that publishes for you"
   - Status: Beta
   - Excitement: High

### Medium-Impact Teasers

4. **Public Dashboard**
   - Teaser: "See your knowledge grow"
   - Status: Beta

5. **Offline Mode**
   - Teaser: "Your brain, even without WiFi"
   - Status: In Progress

---

## What NOT to Promise

Features that exist in research but aren't close:

| Feature | Reality |
|---------|---------|
| Complete decentralization | P2P in early stages |
| Full offline | Partial offline only |
| Voice capture | Not started |
| Mobile app | Not started |
| Marketplace | Not started |

---

## Summary Table

| Feature | Status | Teaser-Ready | Timeline |
|---------|--------|--------------|----------|
| Publishing Agent | Beta | ✅ Yes | Q2 2026 |
| Public Dashboard | Beta | ✅ Yes | Q2 2026 |
| Blockchain | Dev | ✅ Yes | Q3 2026 |
| Agent Mode | Research | ✅ Yes | Q4 2026+ |
| Advanced Search | Dev | Maybe | Q2 2026 |
| Real-time Collab | Dev | Maybe | Q3 2026 |
| Mobile App | Not Started | ❌ No | TBD |
| Voice Capture | Not Started | ❌ No | TBD |

---

## Recommendations for Landing Page

### Include as Teasers (with "Coming Soon")

1. Publishing Agent - "AI that works for you"
2. Autonomous Agents - "Your AI never stops learning"
3. Blockchain - "Verified, trustworthy knowledge"

### Don't Mention

- Mobile app (not started)
- Voice capture (not started)
- Full decentralization (early stages)

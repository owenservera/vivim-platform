# VIVIM Feature Inventory

## Overview

This document provides a comprehensive inventory of all VIVIM features identified from the codebase, demos, and documentation. Features are categorized by their current status and demo-worthiness for the cinematic landing page.

---

## Core Platform Features

### 1. Multi-Provider AI Capture

| Feature | Description | Status | Demo-Worthy | Location |
|---------|-------------|--------|--------------|----------|
| **Browser Extension Capture** | One-click capture from 9+ AI providers | Live | Y | `server/src/routes/capture.js` |
| **Multi-Provider Support** | ChatGPT, Claude, Gemini, DeepSeek, Grok, Mistral | Live | Y | `server/src/providers/` |
| **Auto-Extraction** | Extracts knowledge from conversations (not just text) | Live | Y | `server/src/services/acu-generator.js` |
| **Import Sources View** | Grid view organized by provider | Live | Y | `/archive/imported` |
| **Archive Timeline** | Chronological view of all conversations | Live | Y | `/archive` |

**Demo Narrative**: "One tap. Nine providers. Your entire AI history, archived."

---

### 2. Knowledge Graph

| Feature | Description | Status | Demo-Worthy | Location |
|---------|-------------|--------|--------------|----------|
| **Canvas View** | Force-directed graph visualization | Live | **Y (Money Shot)** | `/archive?view=canvas` |
| **ACU Relationships** | Node edges showing relationships | Live | Y | `/conversation/:acu-id` |
| **Concept Mapping** | Maps relationships between concepts | Live | Y | Graph engine |
| **Search with Graph** | Visual search results | Live | Y | `/archive/search` |
| **Entity Discovery** | Find what follows/contradicts | Live | Y | Graph traversal |

**Demo Narrative**: "This isn't just a search tool. It's a second brain that actually understands your AI thinking."

---

### 3. Context Engine (8-Layer System)

| Feature | Description | Status | Demo-Worthy | Location |
|---------|-------------|--------|--------------|----------|
| **Context Cockpit** | Visual display of context assembly | Live | **Y** | `/context-cockpit` |
| **Token Budget Display** | Shows 12,300 token allocation | Live | Y | Cockpit UI |
| **Memory Retrieval Visual** | Shows what's retrieved per layer | Live | Y | Context service |
| **Topic Detection** | Automatic topic identification | Live | Y | L3 layer |
| **Entity Extraction** | People/projects mentioned | Live | Y | L4 layer |
| **JIT Retrieval** | Just-in-time knowledge fetching | Live | Y | L6 layer |
| **Context Recipes** | Configurable context presets | Beta | Y | `/settings/context` |
| **Compound Intelligence** | Context accumulates over time | Live | Y | Full system |

**Demo Narrative**: "This is the moat. It's not just storage. It's a context layer that makes every AI interaction smarter than the last."

---

### 4. ACU (Atomic Chat Units) System

| Feature | Description | Status | Demo-Worthy | Location |
|---------|-------------|--------|--------------|----------|
| **ACU Extraction** | Break conversations into atomic units | Live | Y | `server/src/services/acu-generator.js` |
| **ACU Types** | Code, Fact, Reasoning, Decision, etc. | Live | Y | ACU schema |
| **Semantic Search** | Find ACUs by meaning, not keywords | Live | Y | `server/src/routes/acus.js` |
| **ACU Detail View** | Individual ACU with links | Live | Y | `/conversation/:acu-id` |
| **ACU Relationships** | explains, follows_up, related_to | Live | Y | Graph edges |
| **Deduplication** | Detect identical ACUs across chats | Live | Y | `server/src/services/acu-deduplication-service.ts` |

---

### 5. For You Feed

| Feature | Description | Status | Demo-Worthy | Location |
|---------|-------------|--------|--------------|----------|
| **Personalized Feed** | AI-curated relevant past thinking | Live | Y | `/for-you` |
| **Topic Filters** | Filter by React, TypeScript, etc. | Live | Y | `/for-you?topic=react` |
| **Usage Analytics** | Track conversation patterns | Live | Y | `/analytics` |
| **Never Ask Twice** | Surface answers you already have | Live | Y | Feed algorithm |

**Demo Narrative**: "It's like having a research assistant who read everything you ever wrote and knows exactly what you need."

---

### 6. Identity & Storage

| Feature | Description | Status | Demo-Worthy | Location |
|---------|-------------|--------|--------------|----------|
| **DID Identity** | Decentralized Identity setup | Live | Y | `/identity` |
| **Storage Dashboard** | Shows what's stored where | Live | Y | `/storage` |
| **Full Export** | Export all data anytime | Live | Y | `/account` |
| **Data Sovereignty** | Your data, your keys | Live | Y | Security layer |
| **Zero-Knowledge** | Encryption architecture | Live | Y | `server/src/security/` |

**Demo Narrative**: "No vendor lock-in. Export everything. Migrate anytime. Your AI brain, portable."

---

### 7. Social & Sharing

| Feature | Description | Status | Demo-Worthy | Location |
|---------|-------------|--------|--------------|----------|
| **Circles** | Private groups for teams/projects | Live | Y | `/circles` |
| **Groups** | Public communities around topics | Live | Y | `/groups` |
| **One-Tap Sharing** | Share with full attribution | Live | Y | `/archive/shared` |
| **Network Effects** | Share knowledge, get smarter | Beta | Y | Social engine |
| **Sharing Settings** | Fine-grained access control | Live | Y | `/settings/advanced` |

**Demo Narrative**: "Network effects for AI knowledge. The more people share, the smarter everyone gets."

---

### 8. VIVIM AI (Native AI)

| Feature | Description | Status | Demo-Worthy | Location |
|---------|-------------|--------|--------------|----------|
| **Memory-Grounded Answers** | AI that uses your archive | Live | Y | `/chat` |
| **BYOK Support** | Bring your own API key | Live | Y | `/byok` |
| **Provider Switching** | Toggle between providers | Live | Y | `/settings/providers` |
| **Multi-Provider Access** | 9+ AI providers via unified API | Live | Y | SDK layer |

**Demo Narrative**: "Not another AI. An AI that knows you."

---

## Demo Focus Areas (Investor-Ready)

Based on the FOCUS_AREAS.ts, these are the proven demo flows:

| Focus Area | Tagline | Time | Demo-Worthy |
|------------|---------|------|-------------|
| **Knowledge Graph** | "See your AI thinking become a living map" | 30-40s | **Y (Weapon)** |
| **Core Capture** | "One tap. Nine providers. Your entire AI history." | 20-25s | Y |
| **Context Engine** | "AI that actually knows who you are" | 25-30s | Y (Technical) |
| **For You Feed** | "Your AI thinking, curated for what matters today" | 20-25s | Y (Product) |
| **Identity & Storage** | "Your data. Your keys. Decentralized by design." | 20-25s | Y (Technical) |
| **Social Sharing** | "Share your AI brain. Learn from your circle." | 20-25s | Y (Business) |
| **AI Native** | "Built on your memory, not just your prompt" | 25-30s | Y (Product) |
| **Full Journey** | "The complete VIVIM experience" | 90-120s | Y |

---

## SDK Features

| Feature | Description | Status | Demo-Worthy |
|---------|-------------|--------|--------------|
| **P2P Mesh Networking** | WebRTC, GossipSub, peer discovery | Live | N (Backend) |
| **Decentralized Storage** | CRDT-based local-first | Live | N (Backend) |
| **Self-Sovereign Identity** | DID-based authentication | Live | N (Backend) |
| **AI Agent Loops** | Autonomous memory-powered agents | Beta | Maybe |
| **Bun-Native** | Ultra-fast SQLite storage | Live | N (Dev-focused) |
| **Modular Nodes** | Extensible architecture | Live | N (Dev-focused) |

---

## Unreleased / Beta Features

| Feature | Description | Status | Location | Teaser Potential |
|---------|-------------|--------|----------|-----------------|
| **Publishing Agent** | Automated content publishing | Beta | `sdk/apps/publishing-agent` | Y |
| **Public Dashboard** | Analytics/monitoring | Beta | `sdk/apps/public-dashboard` | Y |
| **Blockchain Integration** | On-chain verification | Dev | `server/src/blockchain/` | Y |
| **Agent Mode** | Full autonomous agents | Dev | Research | Y |

---

## Data Models for Demos

### Seed Data Structure (for Demo)
```typescript
{
  conversations: 320,      // Total conversations
  topics: ['react', 'typescript', 'architecture', 'postgres', 'system_design'],
  providers: ['chatgpt', 'claude', 'gemini', 'deepseek'],
  memoryDepth: 'heavy',   // light | medium | heavy
  circles: 3,
  groups: 4,
  friendships: 5,
  notebooks: 3
}
```

### Demo Search Queries (Verified to Return Results)
- `react hooks architecture`
- `postgres indexing`
- `typescript generics`
- `react best practices`
- `startup advice`
- `career growth`
- `context window optimization`

---

## Demo Pages & Routes

| Path | Description | Key Feature |
|------|-------------|-------------|
| `/archive` | Archive timeline view | Core navigation |
| `/archive?view=canvas` | Knowledge graph canvas | **Money shot** |
| `/archive?view=grid` | Grid by provider | Multi-provider |
| `/archive/imported` | Imported sources | Capture UI |
| `/archive/search?q=...` | Search with results | Search UI |
| `/for-you` | Personalized feed | AI curation |
| `/for-you?topic=react` | Topic filtered | Filtering |
| `/context-cockpit` | Context visualizer | Technical demo |
| `/chat` | VIVIM AI chat | Native AI |
| `/identity` | DID setup | Security |
| `/storage` | Storage dashboard | Transparency |
| `/account` | Account settings | Control |
| `/settings/context` | Context recipes | Customization |
| `/settings/providers` | AI providers | Multi-provider |
| `/settings/advanced` | Sharing settings | Social |
| `/analytics` | Usage analytics | Insights |
| `/circles` | Team circles | Social |
| `/groups` | Topic groups | Community |
| `/archive/shared` | Shared items | Sharing |

---

## Key Differentiators for Landing Page

1. **Multi-Provider Capture** - "One tap. Nine providers."
2. **Knowledge Graph** - Visual, interactive, impressive
3. **Context Engine** - Technical moat, compound intelligence
4. **ACU System** - Granular, searchable, shareable
5. **Privacy First** - Zero-knowledge, self-sovereign
6. **Decentralized** - No vendor lock-in

---

## Recommended Landing Page Sections

Based on feature inventory:

1. **Hero**: Knowledge Graph visualization (the money shot)
2. **Capture**: Multi-provider support showcase
3. **Context**: Context Engine visualization
4. **Search**: Instant search demonstration
5. **Social**: Circles and sharing
6. **Security**: Privacy/encryption
7. **SDK**: Developer-focused section

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **Live** | Production-ready, fully functional |
| **Beta** | Available but may have minor issues |
| **Dev** | In development, not fully ready |
| **Unreleased** | Planned but not available |

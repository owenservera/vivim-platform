# VIVIM - Frontend Developer Reference Guide

> Compact reference for building the stealth landing page. Under 1000 lines of essential info.

---

## 1. Project Overview

**What is VIVIM?**
VIVIM is the open-source, decentralized AI memory platform — your personal knowledge graph that captures, connects, and amplifies every conversation you've ever had with AI.

**The Problem**
- 100M+ people use AI daily
- 95% of AI intelligence disappears forever
- ChatGPT deletes after 30 days, Claude buries in endless scroll
- Each provider is a walled garden — no cross-pollination

**The Solution**
Unify every AI conversation into one searchable, shareable knowledge graph that gets smarter with every chat.

---

## 2. Taglines & Messaging

### Primary Headline
> **Own Your Intelligence**

### Alternative Headlines
| For | Headline |
|-----|----------|
| Investors | The Operating System for AI-Powered Minds |
| Developers | Build on Top of Your Users' AI Conversations |
| Power Users | Your AI Conversations, Unified |
| General | Your AI Chats, Searchable Forever |

### Subheadline
VIVIM unifies every conversation from ChatGPT, Claude, Gemini, and more — turning scattered AI interactions into one searchable, shareable knowledge graph that gets smarter with every chat.

### Value Propositions (5 Key Points)

1. **Unify Every AI Conversation**
   - Import from 9 providers: ChatGPT, Claude, Gemini, DeepSeek, Grok, Kimi, Mistral, Qwen, Z.AI
   - One unified archive — no scattered history

2. **Search Across Everything**
   - Semantic search finds concepts, not just keywords
   - Cross-provider discovery

3. **Knowledge That Compounds**
   - 8-layer Context Engine learns who you are
   - Topic tracking, entity recognition, memory extraction

4. **Share Without Compromise**
   - Share specific insights, not entire histories
   - Granular permissions, cryptographic signatures

5. **True Data Ownership**
   - Zero-trust architecture: your data, your keys
   - Quantum-resistant encryption (Ed25519, ML-KEM-1024)
   - DID-based identity — self-sovereign, no email required

---

## 3. Key Differentiators

| Differentiator | Description |
|----------------|-------------|
| **9-Provider Capture** | Unmatched — import from all major AI providers |
| **8-Layer Context Engine** | Unique IP — adaptive personalization system |
| **ACU Segmentation** | Atomic Chat Units with quality scoring |
| **Quantum-Resistant Crypto** | ML-KEM-1024, Ed25519, DID identity |
| **Open Source** | MIT-licensed, self-hostable |

---

## 4. Features

### For Individual Users

| Feature | Description |
|---------|-------------|
| **Universal Import** | One-click connection to 9 providers via Playwright |
| **Semantic Search** | Search by meaning, not keywords |
| **Context Engine** | 8-layer personalization (identity, topics, entities, memories, JIT) |
| **Memory Extraction** | LLM-powered automatic insight capture |
| **4 Views** | List, Grid, Canvas (knowledge graph), Timeline |
| **Collections** | Organize conversations, AI-suggested groupings |
| **Sharing** | Granular permissions, fork & remix with attribution |
| **Privacy** | End-to-end encryption, DID identity, full export |

### For Teams
- Shared collections, team circles, permission controls
- Team knowledge graph, cross-user semantic search

### For Developers
- `@vivim/sdk` — Bun-native TypeScript SDK
- P2P networking (LibP2P), CRDT sync (Yjs)
- REST API, webhooks, MCP compatible
- Docker Compose self-hosting

### Feature Comparison

| Feature | Free | Pro ($9.99/mo) | Team ($29.99/user) |
|---------|------|----------------|---------------------|
| Provider captures | 1 | 9 | 9 |
| Conversations | 50 | Unlimited | Unlimited |
| Semantic search | Basic | Advanced | Advanced |
| Context layers | 4 | 8 | 8 |
| Collections | 3 | Unlimited | Unlimited |
| Sharing | Limited | Full | Full |
| API access | ❌ | ❌ | ✅ |
| SSO | ❌ | ❌ | ❌ |
| Self-host | ❌ | ❌ | ❌ |

---

## 5. Technical Stack

### Frontend (PWA)
| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Language | TypeScript |
| State | Zustand |
| Data | TanStack Query |
| Local Storage | Dexie (IndexedDB) |
| Styling | TailwindCSS |
| Animation | Framer Motion |
| Routing | React Router |

### Backend
| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Framework | Express 5 |
| ORM | Prisma 7 |
| Database | PostgreSQL + pgvector |
| Cache | Redis |
| Real-time | Socket.IO |
| AI SDK | Vercel AI SDK |
| Browser | Playwright |

### Key Technical Innovations
1. **Universal Conversation Extraction** — Playwright-based cross-provider capture
2. **ACU Segmentation** — Conversation decomposition with quality scoring
3. **8-Layer Context Engine** — Adaptive personalization (L0-L7)
4. **Per-User Databases** — Complete data isolation
5. **Quantum-Resistant Crypto** — ML-KEM-1024 key exchange
6. **DID Identity** — Self-sovereign, email-free
7. **CRDT Sync** — Conflict-free multi-device via Yjs

---

## 6. Target Audience

| Segment | Primary Need | VIVIM Value |
|---------|--------------|-------------|
| **Individual Power Users** | Search, organization, persistence | Unified archive, semantic search |
| **Developers** | Extensibility, data portability | Open SDK, self-hosting |
| **Teams** | Collaboration, knowledge sharing | Shared collections, permissions |
| **Enterprises** | Compliance, control | Self-hosted, audit trails |

---

## 7. Pricing Tiers

| Tier | Price | What's Included |
|------|-------|-----------------|
| **Free** | $0 | 50 conversations, basic search, 1 user |
| **Pro** | $9.99/mo | Unlimited captures, advanced semantic search, 8-layer context, priority support |
| **Team** | $29.99/user/mo | Everything in Pro + shared collections, team circles, admin controls, SSO ready |
| **Enterprise** | Custom | Self-hosted, custom integrations, dedicated support, SLA |

---

## 8. Visual Guidelines

### Color Palette
| Role | Color | Usage |
|------|-------|-------|
| Primary | Deep Navy `#0A0E1A` | Backgrounds, depth |
| Accent | Electric Blue `#3B82F6` | CTAs, links, highlights |
| Surface | Clean White `#FFFFFF` | Cards, content areas |
| Text Primary | White/Navy | Headings, body |
| Text Secondary | Gray | Muted content |

### Typography
- **Font**: Inter or Geist (modern sans-serif)
- **Style**: Clean, readable, premium

### Imagery
- Abstract knowledge graphs
- Connected nodes
- Clean UI mockups
- Subtle reveals, smooth transitions

### Key Visual Metaphors
- **Knowledge graph**: Connected nodes showing conversation relationships
- **Layers**: 8-layer context engine visualization
- **Privacy shield**: Encryption/ownership iconography
- **Compounding**: Knowledge growing over time

### Mobile Considerations
- Hero must work at 375px width
- Feature grid collapses to single column
- CTA always visible (sticky bottom on mobile)

---

## 9. Social Proof

### Testimonials
> "I was losing hours every week searching for insights I'd already paid for. VIVIM changed that. Now everything is searchable, connected, and mine."
> — **Alex Chen**, Senior Developer

> "The semantic search is magical. I searched 'attention mechanisms' and it found relevant conversations across ChatGPT, Claude, and Gemini that I'd completely forgotten about."
> — **Sarah Park**, ML Engineer

> "Finally, a product that respects user privacy while delivering incredible functionality. The encryption and DID identity are the real deal."
> — **Marcus Webb**, Security Researcher

### Short Quotes (for hero)
- "Finally, all my AI chats in one place" — Developer, San Francisco
- "It's like Spotify for my AI conversations" — Product Manager, London

---

## 10. Call to Action

### Primary CTA
> **[Get Early Access]** — No credit card required

### Alternative CTAs (A/B Test)
- "Join the Waitlist"
- "Start Free"
- "Get Started"

### CTA Section Copy
> Ready to Own Your Intelligence?
> Join thousands of AI power users building their second brain.

---

## 11. Section Structure (Recommended)

```
┌─────────────────────────────────────┐
│ HERO                                │
│ • Headline: "Own Your Intelligence"│
│ • Subheadline                      │
│ • CTA: [Get Early Access]          │
│ • Social proof (2 quotes)          │
├─────────────────────────────────────┤
│ PROBLEM                             │
│ • The gap in your AI workflow      │
│ • Stats: 95% lost, 15+ hrs/week   │
├─────────────────────────────────────┤
│ SOLUTION                            │
│ • Your AI Memory, Unified          │
│ • One archive, infinite possibilities│
├─────────────────────────────────────┤
│ FEATURE GRID (6 items)             │
│ • 🔌 Universal Import               │
│ • 🔍 Semantic Search                │
│ • 🧠 Context Engine                 │
│ • 🔐 True Ownership                │
│ • 👥 Social Intelligence           │
│ • 🛠 Developer Platform            │
├─────────────────────────────────────┤
│ HOW IT WORKS (3 steps)              │
│ 1. Connect Your AIs                 │
│ 2. We Capture Everything           │
│ 3. Search, Discover, Share        │
├─────────────────────────────────────┤
│ SOCIAL PROOF                        │
│ • 3 detailed testimonials          │
├─────────────────────────────────────┤
│ PRICING                             │
│ • Free / Pro / Team / Enterprise   │
├─────────────────────────────────────┤
│ FINAL CTA                           │
│ • "Ready to Own Your Intelligence?"│
│ • [Get Early Access]               │
├─────────────────────────────────────┤
│ FOOTER                              │
│ • GitHub, Discord, Twitter         │
│ • Privacy, Terms, Security         │
└─────────────────────────────────────┘
```

---

## 12. Links

| Resource | URL |
|----------|-----|
| Website | https://vivim.app |
| GitHub | https://github.com/vivim-app |
| Discord | https://discord.gg/vivim |
| Docs | https://docs.vivim.app |

---

## 13. Brand Voice

- **Confident, not arrogant** — We're building something new and can be bold
- **Technically credible** — We speak with precision
- **User-aligned** — We're on the user's side

### Key Messages by Audience

| Audience | Message |
|----------|---------|
| General | Own Your Intelligence |
| Investors | The Operating System for AI-Powered Minds |
| Developers | Build on Top of Your Users' AI Conversations |
| Power Users | Your AI Conversations, Unified |

---

## 14. Investor Hooks (for positioning)

- Category creation in AI memory
- Unmatched 9-provider capture
- Unique 8-layer context engine (IP)
- Privacy-first + open source
- Platform play potential

---

## 15. Traction & Status

### Production Ready ✅
- Conversation capture from all 9 providers
- ACU generation with quality scoring
- 8-layer Context Engine
- Social sharing with granular permissions
- Memory extraction and consolidation
- Data portability (5 export formats)

### In Progress ⚠️
- P2P sync — infrastructure ready, rollout in progress
- Onboarding — core works, edge cases in progress

---

## 16. Technical Numbers

- **60+** database models in Prisma schema
- **40+** API route domains
- **9** provider extractors (and growing)
- **8** context layers in personalization engine
- **Full** encryption stack implemented

---

*Document compiled: 2026-03-17*
*Purpose: Stealth startup landing page development*
*Total lines: ~350*

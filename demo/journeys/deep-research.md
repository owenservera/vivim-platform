---
title: Deep Research Session
description: Comprehensive knowledge management for researchers and analysts
duration: 120s
target: Researchers, analysts, students, power users
---

## Pre-Conditions

- [ ] 3 notebooks with 15 entries
- [ ] 10 topic profiles
- [ ] 5 entity profiles
- [ ] 8 memories with relationships
- [ ] Context bundles pre-computed

## Steps

| Step | Action | URL | Wait | Screenshot | Notes |
|------|--------|-----|------|------------|-------|
| 1 | Navigate | /notebooks | 2000 | ✅ | Notebooks list |
| 2 | Navigate | /notebooks/architecture | 2000 | ✅ | Architecture Patterns detail |
| 3 | Navigate | /context-cockpit | 3000 | ✅ | Context cockpit - 8 layers |
| 4 | Scroll | scroll | 2000 | ✅ | Scroll through memories panel |
| 5 | Navigate | /chat | 2000 | ✅ | VIVIM AI chat interface |
| 6 | Type | Should I use microservices | 3000 | ✅ | Type question |
| 7 | Wait-for | .ai-response | 5000 | ✅ | Wait for AI response |
| 8 | Scroll | scroll | 2000 | ✅ | Show citations in response |
| 9 | Navigate | /analytics | 2000 | ✅ | Analytics dashboard |
| 10 | Scroll | scroll | 2000 | ✅ | Topic distribution chart |

## Narration Script

**[0-10s]** "You're researching microservices vs monoliths. Let's organize your findings."

**[10-25s]** "15 curated ACUs. System design references, decision records, code snippets."

**[25-40s]** "Before you start a new chat, VIVIM assembles context. 8 layers loading..."

**[40-55s]** "8 memories loaded. You prefer TypeScript. You're skeptical of microservices for early-stage."

**[55-70s]** "Ask a question. VIVIM AI uses your archive, not just the prompt."

**[70-85s]** "It knows your context. Answers grounded in your past thinking."

**[85-100s]** "Cites 3 past conversations. Your monolith discussion from February. Jordan's architecture review."

**[100-110s]** "Track your AI usage. 320 conversations. 2161 insights extracted."

**[110-120s]** "React: 30 conversations. System Design: 20. This is your knowledge footprint."

## Context Layers

| Layer | Count | Example |
|-------|-------|---------|
| User Facts | 10 | "Alex prefers TypeScript" |
| Memories | 8 | "Skeptical of microservices" |
| Topic Profiles | 10 | React, TypeScript, AI |
| Entity Profiles | 5 | Stripe, Jordan Lee |
| Past Conversations | 3 | Cited in response |

## Success Criteria

- Notebook shows 15 entries
- Context cockpit loads in <1s
- AI response includes citations
- Analytics shows real metrics
- All panels render correctly

## Technical Notes

- Notebooks use `notebooks` and `notebook_entries` tables
- Context cockpit fetches from `/api/v1/context/bundle`
- VIVIM AI uses `/api/v1/chat/completions`
- Analytics aggregates from `topic_profiles` and `provider_stats`

## AI Response Structure

```json
{
  "response": "...",
  "citations": [
    {
      "conversationId": "...",
      "acuId": "...",
      "excerpt": "...",
      "relevance": 0.95
    }
  ],
  "contextUsed": {
    "memories": 8,
    "topics": 5,
    "entities": 3
  }
}
```

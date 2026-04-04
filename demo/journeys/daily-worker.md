---
title: Daily Knowledge Worker
description: Show daily workflow and knowledge resurfacing for individual contributors
duration: 60s
target: Developers, researchers, knowledge workers
---

## Pre-Conditions

- [ ] 250+ conversations seeded
- [ ] 6+ months of activity
- [ ] Multiple providers connected
- [ ] Topic profiles populated
- [ ] Rediscovery scores computed

## Steps

| Step | Action | URL | Wait | Screenshot | Notes |
|------|--------|-----|------|------------|-------|
| 1 | Navigate | /for-you | 3000 | ✅ | For You feed - ranked recommendations |
| 2 | Scroll | scroll | 1000 | ✅ | Scroll through 3-4 cards |
| 3 | Navigate | /for-you?topic=react | 2000 | ✅ | React topic filter applied |
| 4 | Navigate | /conversation/:id | 2000 | ✅ | Full conversation detail |
| 5 | Navigate | /archive | 2000 | ✅ | Archive timeline view |
| 6 | Navigate | /archive?view=canvas | 5000 | ✅ | Canvas force-directed graph |
| 7 | Navigate | /for-you | 2000 | ✅ | Return to feed |

## Narration Script

**[0-5s]** "Every morning, your For You feed surfaces what matters today."

**[5-15s]** "Three months ago, you solved this exact Postgres problem. Here's the solution."

**[15-25s]** "Zoom in by topic. React patterns from the past 6 weeks."

**[25-35s]** "Full context preserved. Every message, every code snippet."

**[35-45s]** "Your entire AI history. 320 conversations. Fully searchable."

**[45-55s]** "See connections. This cluster is your React architecture thinking."

**[55-60s]** "Stop asking the same questions. Start finding answers you already have."

## Search Queries to Demo

1. "react hooks architecture" → Should return 12+ results
2. "postgres indexing" → Should return 8+ results
3. "startup advice" → Should return 15+ results

## Success Criteria

- Feed shows 10+ relevant cards
- Topic filter returns 20+ conversations
- Conversation loads in <1s
- Canvas shows 50+ nodes
- Graph renders in <3s

## Key Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Feed relevance score | >0.7 | - |
| Topic filter results | 20+ | - |
| Canvas node count | 50+ | - |
| Total duration | 60s | - |

## Technical Notes

- Ensure `rediscoveryScore` is set on ACUs
- Topic filter uses `?topic=` query param
- Canvas view uses `?view=canvas` param
- Conversation ID resolved from API

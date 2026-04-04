---
title: Problem Solver Journey
description: Debugging complex issues with knowledge graph and cross-conversation discovery
duration: 90s
target: Engineers debugging complex issues
---

## Pre-Conditions

- [ ] Knowledge graph seeded with 700+ ACU links
- [ ] Multiple related conversations exist
- [ ] Search indexed
- [ ] Graph pre-computed
- [ ] Embeddings calculated

## Steps

| Step | Action | URL | Wait | Screenshot | Notes |
|------|--------|-----|------|------------|-------|
| 1 | Navigate | /archive | 2000 | ✅ | Archive home - starting point |
| 2 | Navigate | /archive/search?q=vector+database+performance | 3000 | ✅ | Semantic search across providers |
| 3 | Navigate | /conversation/:id | 2000 | ✅ | Open top result - full context |
| 4 | Navigate | /archive?view=canvas | 5000 | ✅ | Switch to graph view - animation |
| 5 | Scroll | scroll | 2000 | ✅ | Zoom into largest cluster |
| 6 | Navigate | /conversation/:acu-id | 2000 | ✅ | Click node - ACU detail |
| 7 | Scroll | scroll | 2000 | ✅ | Show relationship edges |
| 8 | Navigate | /archive/search?q=react+hooks+architecture | 3000 | ✅ | Second search query |
| 9 | Navigate | /archive/search?q=typescript+generics | 3000 | ✅ | Third search query |

## Narration Script

**[0-10s]** "You're debugging a Postgres query planner issue. Let's find what you've learned before."

**[10-20s]** "Semantic search across all providers. 8 conversations match."

**[20-30s]** "This Claude conversation from 4 months ago has the exact answer."

**[30-45s]** "Switch to graph view. Watch how concepts connect."

**[45-60s]** "This cluster is your database optimization thinking. 47 conversations, 312 insights."

**[60-75s]** "This atomic unit links to 3 other conversations. Your knowledge, networked."

**[75-85s]** "Explains, follows_up, contradicts — VIVIM maps how your thinking evolves."

**[85-90s]** "That's VIVIM. Your AI brain, visible and connected."

## Search Queries

| Query | Expected Results | Purpose |
|-------|-----------------|---------|
| "vector database performance" | 8+ | Cross-provider search |
| "react hooks architecture" | 12+ | Technical depth |
| "typescript generics" | 10+ | Type system knowledge |

## Graph Metrics to Highlight

- **Total Nodes:** 2161 ACUs
- **Total Edges:** 734 relationships
- **Largest Cluster:** Database optimization (47 conversations)
- **Relationship Types:** explains, follows_up, related_to, supports, contrasts

## Success Criteria

- Search returns in <300ms
- Graph renders in <3s
- 50+ nodes visible in viewport
- ACU links display correctly
- Relationship edges visible

## Technical Notes

- Canvas uses force-directed layout
- ACU relationships loaded from `acu_links` table
- Search uses semantic similarity
- Graph camera should focus on largest cluster

## Fallback Plan

If graph fails to render:
1. Refresh page once
2. If still broken, show pre-recorded Loom backup
3. Say: "Demo gods being difficult - here's a recording"

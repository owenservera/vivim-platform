---
title: Team Collaboration Flow
description: Show social features and knowledge sharing for startup teams
duration: 75s
target: Startup founders, team leads, engineering managers
---

## Pre-Conditions

- [ ] 2 circles seeded (Founders Circle, SF Engineering)
- [ ] 20 circle memberships
- [ ] 24 group posts
- [ ] 16 friendships
- [ ] Shared conversations visible

## Steps

| Step | Action | URL | Wait | Screenshot | Notes |
|------|--------|-----|------|------------|-------|
| 1 | Navigate | /circles | 2000 | ✅ | Circles list - private groups |
| 2 | Navigate | /circles/founders | 2000 | ✅ | Founders Circle detail |
| 3 | Navigate | /circles/founders/shared | 2000 | ✅ | Shared conversations |
| 4 | Navigate | /groups | 2000 | ✅ | Groups list - public communities |
| 5 | Navigate | /groups/pgvector-users | 2000 | ✅ | Group feed with posts |
| 6 | Navigate | /archive/shared | 2000 | ✅ | All shared conversations |
| 7 | Navigate | /settings/advanced | 2000 | ✅ | Sharing settings |

## Narration Script

**[0-10s]** "Your startup's best AI learnings shouldn't die in one person's head."

**[10-20s]** "Private circle for stealth founders. 12 members sharing curated knowledge."

**[20-30s]** "Jordan shared this architecture review. Full attribution, one click to adopt."

**[30-45s]** "Public communities. 567 PGVector users. 234 Build In Public founders."

**[45-60s]** "Real-time knowledge sharing. Questions, solutions, war stories."

**[60-70s]** "Control what's shared. Private by default, share with attribution."

**[70-75s]** "Network effects for AI knowledge. The more your team shares, the smarter everyone gets."

## Social Proof Metrics

| Circle | Members | Shared Conversations |
|--------|---------|---------------------|
| Founders Circle | 12 | 47 |
| SF Engineering | 45 | 156 |

| Group | Members | Posts |
|-------|---------|-------|
| Build In Public | 234 | 89 |
| PGVector Users | 567 | 234 |
| Startup Founders SF | 89 | 45 |

## Success Criteria

- Circles show member counts
- Shared conversations display with attribution
- Group feed shows recent activity
- Sharing settings clearly visible
- No broken images or links

## Technical Notes

- Circles are private (require membership)
- Groups are public (anyone can view)
- Sharing policies control visibility
- Attribution preserved through `sharing_policies` table

## Key Features to Highlight

1. **Attribution** - Original author always credited
2. **Privacy** - Private by default, share explicitly
3. **Circles** - For teams, projects, close collaborators
4. **Groups** - Public communities around topics
5. **One-tap adopt** - Use shared knowledge instantly

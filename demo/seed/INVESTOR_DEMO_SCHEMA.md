# Investor Demo Seed Data Schema

## Persona: Alex Chen

### User Profile
```json
{
  "did": "did:key:demo-alex-chen",
  "displayName": "Alex Chen",
  "handle": "alexchen",
  "email": "alex@vivimdemo.io",
  "avatarUrl": "https://i.pravatar.cc/150?u=alex-chen-dev",
  "trustScore": 92,
  "settings": {
    "theme": "dark",
    "developerMode": true,
    "defaultView": "timeline"
  },
  "verificationLevel": 2
}
```

### Target Metrics
| Metric | Target | Notes |
|--------|--------|-------|
| Total conversations | 250-400 | Enough to feel alive |
| AI providers | 5+ | ChatGPT, Claude, Gemini, DeepSeek, Grok |
| Time span | 6+ months | Realistic usage pattern |
| ACUs | 1000+ | Knowledge graph density |
| Topics | 50+ | Diverse interests |
| Entities | 30+ | People, projects, companies |

---

## Conversation Distribution

### By Provider

| Provider | Count | Topics | Date Range |
|----------|-------|--------|------------|
| ChatGPT | 90 | Code reviews, architecture, debugging | 3mo ago → today |
| Claude | 80 | Writing, strategy, long-form thinking | 4mo ago → today |
| Gemini | 50 | Research, data analysis, multimodal | 2mo ago → today |
| DeepSeek | 40 | Low-level, Rust, performance | 5mo ago → today |
| Grok | 30 | Tech news, opinions, real-time | 1mo ago → today |
| Mistral | 30 | European market, multilingual | 3mo ago → today |

### By Month (for Timeline)
```
Month -6: ████████░░ 80 convos (early exploration)
Month -5: ████████████ 120 convos (peak usage)
Month -4: ██████████ 100 convos
Month -3: ████████░░ 80 convos
Month -2: ████████████ 120 convos (recent)
Month -1: ██████████ 100 convos (current)
```

---

## Scripted Search Results

These searches must return specific, impressive results:

### 1. "vector database performance"
- **Expected:** 8+ conversations across ChatGPT + Claude + Gemini
- **Shows:** Cross-provider semantic search
- **Narrative:** "What if your AI conversations could remember each other?"

### 2. "hiring senior engineers"
- **Expected:** Mix of strategy (Claude) + job descriptions (ChatGPT)
- **Shows:** Semantic variety in results

### 3. "last month"
- **Expected:** 100 conversations from past 30 days
- **Shows:** Temporal filtering works

### 4. "postgres schema"
- **Expected:** Deep technical conversation with code
- **Shows:** Code snippet retrieval

### 5. "startup idea"
- **Expected:** Multiple conversations spanning months
- **Shows:** Long-term project tracking

---

## Topic Categories

### Technical (60%)
```
- React / Next.js (30 conversations)
- TypeScript patterns (25 conversations)
- System architecture (20 conversations)
- Postgres / databases (20 conversations)
- Python / data science (15 conversations)
- Rust / performance (10 conversations)
- DevOps / deployment (10 conversations)
```

### Business (25%)
```
- Startup strategy (15 conversations)
- Hiring / recruiting (12 conversations)
- Product roadmap (10 conversations)
- Fundraising (8 conversations)
- Marketing (5 conversations)
```

### Personal/Learning (15%)
```
- AI/ML concepts (12 conversations)
- Writing / communication (8 conversations)
- Productivity (5 conversations)
- Career growth (5 conversations)
```

---

## Memory Pre-loads

These memories should surface in the context cockpit:

```json
{
  "facts": [
    "Alex prefers TypeScript over JavaScript",
    "Alex is building a B2B SaaS startup (stealth mode)",
    "Alex has interviewed at Google and Stripe",
    "Alex is skeptical of microservices for early-stage products",
    "Alex uses Postgres + pgvector for production workloads",
    "Alex lives in San Francisco",
    "Alex's startup is in the AI infrastructure space",
    "Alex has a background in distributed systems"
  ],
  "preferences": [
    "Prefers concise, code-heavy responses",
    "Uses dark mode exclusively",
    "Keyboard shortcuts over mouse",
    "Values correctness over speed"
  ],
  "relationships": [
    "Co-founder: Jordan (design background)",
    "Investor: First Close Ventures",
    "Advisor: Former Stripe eng manager"
  ]
}
```

---

## Social Proof

### Circles
```json
[
  { "name": "Founders Circle", "members": 12, "description": "Stealth founders" },
  { "name": "SF Engineering", "members": 45, "description": "Bay Area tech" }
]
```

### Friends
```json
[
  { "name": "Jordan Lee", "status": "collaborator" },
  { "name": "Sam Rivera", "status": "co-founder" },
  { "name": "Morgan Chen", "status": "friend" }
]
```

### Groups
```json
[
  { "name": "Build In Public", "type": "startup" },
  { "name": "PGVector Users", "type": "technical" }
]
```

---

## Seed Generation Prompts

Use AI to generate realistic fake conversations:

### Code Review Conversation
```
Write a realistic ChatGPT conversation (~600 words) where a senior 
engineer discusses debugging a Postgres query planner issue. Include:
- A specific query that's running slow
- EXPLAIN ANALYZE output
- Root cause analysis
- The fix with before/after performance numbers
```

### Architecture Discussion
```
Write a realistic Claude conversation (~800 words) where someone is 
planning a microservices architecture. Include:
- Pros/cons debate
- Specific tool recommendations
- Cost considerations
- Timeline estimates
```

### Research Session
```
Write a realistic Gemini conversation (~500 words) about comparing 
vector databases (Pinecone vs pgvector vs Weaviate). Include:
- Feature comparison table
- Use case fit analysis
- Pricing breakdown
```

---

## Technical Requirements

### Pre-computed Embeddings
All seed ACUs must have embeddings pre-computed so:
- Graph renders in <3 seconds
- Search returns results in <300ms

### Conversation Realism
- Timestamps spread across 6 months
- Realistic gaps (weekends, holidays)
- Varying conversation lengths
- Mix of completed/in-progress

### Data Integrity
- No Lorem Ipsum
- Real code snippets that would compile
- Real company names (Google, Stripe, etc.)
- Believable user history

---

## Reset Script Requirements

```typescript
// Must complete in under 30 seconds
async function resetInvestorDemo() {
  // 1. Truncate tables (5s)
  await prisma.$executeRaw`TRUNCATE ... CASCADE`
  
  // 2. Seed new data (15s)
  await seedInvestorDemo()
  
  // 3. Compute embeddings (10s)
  await precomputeEmbeddings()
  
  // 4. Clear caches
  await redis.flushall()
}
```

---

## File Locations

| Purpose | File |
|---------|------|
| Main seed script | `server/prisma/seed-investor.ts` |
| Conversation generator | `scripts/demo/generate-conversations.ts` |
| ACU generator | `scripts/demo/generate-acus.ts` |
| Memory seeder | `scripts/demo/seed-memories.ts` |
| Reset script | `scripts/demo/reset-demo.ts` |

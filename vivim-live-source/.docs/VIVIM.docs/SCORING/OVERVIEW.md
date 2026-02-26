# VIVIM Scoring System: Overview

The VIVIM Scoring System is a multi-stage pipeline designed to identify, rank, and surface high-value knowledge captured from AI conversations. It moves beyond simple chronological lists to prioritize content that is dense, well-structured, and interconnected.

## 1. Multi-Stage Pipeline

The system operates in two distinct phases:

### Phase A: Extraction-Time Scoring (Static)
When a conversation is captured, each Atomic Chat Unit (ACU) is immediately analyzed. This generates static metrics that are stored in the database:
- **Quality Overall**: A composite 0-100 score.
- **Content Richness**: Measure of information density and formatting diversity.
- **Structural Integrity**: Measure of grammatical and technical coherence.

### Phase B: Feed-Time Ranking (Dynamic)
When a user opens their "For You" feed, the system applies a dynamic algorithm to calculate a **Recommendation Score**. This combines static quality with context-sensitive factors:
- **Recency Decay**: Fresh knowledge is prioritized but decays over time.
- **Network Density**: Content that links to other insights is boosted.
- **Topic Relevance**: (Coming Soon) Alignment with user interests.

## 2. Core Philosophy

The "Signal-to-Noise" ratio is the primary KPI. VIVIM is designed to filter out "chitchat" (e.g., "Hello", "Thanks!") and surface "Deep Knowledge" (e.g., complex code, mathematical formulas, structured explanations).

## 3. Data Structure

Scoring data is persisted in the `AtomicChatUnit` table:

| Field | Type | Description |
|-------|------|-------------|
| `qualityOverall` | Float | The primary "Value" metric. |
| `contentRichness` | Float | Diversity of formatting and density. |
| `structuralIntegrity`| Float | Formatting validaty and readability. |
| `rediscoveryScore` | Float | Likelihood of being useful in the future. |

---
*Next: See [EXTRACTION_QUALITY.md](./EXTRACTION_QUALITY.md) for calculation details.*

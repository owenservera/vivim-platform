# VIVIM Scoring: Feed Ranking Algorithm

The Feed Ranking Algorithm (calculated in `feed.js`) determines the final `score` shown in the "For You" feed. It balances intrinsic value with current relevance.

## 1. The Scoring Formula

The final score is a weighted summation of three components:

$$Score = (Quality 	imes 0.02) + RecencyBonus + NetworkBoost$$

### A. Quality Weight (Intrinsic)
Calculated as `qualityOverall * 0.02`. 
- An ACU with 100% quality contributes **2.0 points**.
- An ACU with 50% quality contributes **1.0 points**.

### B. Recency Bonus (Decay)
VIVIM uses a linear decay over a 5-day window.
- **Formula**: `Max(0, 5 - ageInHours / 24)`
- **Impact**: 
    - 0 hours old: **+5.0 points**
    - 24 hours old: **+4.0 points**
    - 5 days old: **0.0 points**
- **Purpose**: Ensures the feed stays fresh while allowing exceptionally high-quality older content to remain visible.

### C. Network Boost (Density)
Content that is "well-cited" within your own knowledge graph is surfaced.
- **Formula**: `Min(relatedCount * 0.1, 2.0)`
- **Impact**: 
    - 0 links: **+0.0 points**
    - 10 links: **+1.0 points**
    - 20+ links: **+2.0 points** (Capped)
- **Purpose**: Identifies "Hub" insights that connect multiple conversations.

---

## 2. Order of Operations

1. **Candidate Selection**: Fetch ACUs from the database.
2. **Fallback Generation**: If no ACUs exist, generate them on-the-fly from raw conversations.
3. **Filtering**: Remove any ACU below `minQuality` (Default: 60).
4. **Scoring**: Apply the formula above.
5. **Diversity**: Limit the number of ACUs from the same conversation (Default: Max 2 per convo) to prevent "clumping."
6. **Final Sort**:
    - **Primary**: `createdAt` Descending (Recency).
    - **Secondary**: `score` Descending (Relevance).

## 3. Interaction Influencers (Coming Soon)
Interaction weights defined in `feed.js` for future implementation:
- `bookmark`: +3.0
- `share`: +5.0
- `hide`: -5.0
- `not_interested`: -10.0

---

## Implementation Reference
Location: `server/src/routes/feed.js`
Function: `calculateACUScore()`
Weights: `ENGAGEMENT_WEIGHTS`

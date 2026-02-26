# VIVIM Recommendation System

**X-Algorithm Based Personalization** - Phase 1 (Light Algorithm)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `feather-icons` - Icon library (no emojis)
- `vitest` - Testing framework
- `@testing-library/react` - React testing utilities
- `happy-dom` - DOM environment for tests

### 2. Run Tests

```bash
npm test
```

**Expected output:**
```
✓ QualityScoreCalculator
  ✓ should score code-heavy conversations highly
  ✓ should penalize low-quality conversations
  ✓ should boost interacted conversations
  ✓ should return correct quality bands
  ✓ should return correct colors
  ✓ should provide detailed breakdown

Test Files  1 passed (1)
```

### 3. Start Dev Server

```bash
npm run dev
```

### 4. Open "For You" Feed

Navigate to: http://localhost:5173/for-you

---

## 📖 Usage Guide

### Basic Usage

```typescript
import {
  knowledgeMixer,
  qualityCalculator,
  generateTestConversations
} from './lib/recommendation';

// Generate test data (for testing without real conversations)
const conversations = generateTestConversations(25);

// Calculate quality score for a conversation
const score = qualityCalculator.calculate(conversation);
console.log(`Quality: ${score}/100`);

// Generate "For You" feed
const userPrefs = {
  rankWeights: { quality: 0.35, recency: 0.20, topicMatch: 0.30, interaction: 0.15 },
  providerBoost: { claude: 1.1, chatgpt: 1.0, gemini: 0.9 },
  codeBoost: true,
  longFormBoost: false,
  recentBoost: true,
  dismissed: [],
  dislikedTopics: []
};

const feed = await knowledgeMixer.generateFeed(
  conversations,
  userPrefs
);

console.log(`Generated ${feed.length} recommendations`);
```

### Using Analytics

```typescript
import { useRecommendationAnalytics } from './lib/recommendation';

function MyComponent() {
  const analytics = useRecommendationAnalytics();

  useEffect(() => {
    // Track feed generation
    analytics.trackFeedGenerated({
      feedSize: recommendations.length,
      sourceDistribution: { rediscovery: 20, semantic: 0, graph: 0 },
      diversityMetrics: { topicSpread: 5, timeSpread: 3, providerSpread: 3 }
    });

    // Track impressions
    analytics.trackImpressions(recommendations);
  }, [recommendations]);

  const handleClick = (item) => {
    analytics.trackClick(item, rank);
  };
}
```

### Using Test Data Generator

```typescript
import {
  generateTestConversations,
  generateHighQualityConversations,
  generateLowQualityConversations,
  generateConversationsByTimePeriod
} from './lib/recommendation';

// Generate 25 random test conversations
const testConversations = generateTestConversations(25);

// Generate only high-quality conversations
const highQuality = generateHighQualityConversations(5);

// Generate only low-quality conversations
const lowQuality = generateLowQualityConversations(5);

// Generate conversations from specific time periods
const byTime = generateConversationsByTimePeriod();
console.log({
  yesterday: byTime.yesterday.length,
  lastWeek: byTime.lastWeek.length,
  lastMonth: byTime.lastMonth.length,
  older: byTime.older.length
});
```

---

## 🏗️ Architecture

```
User opens /for-you
    ↓
Load conversations (from storage or test data)
    ↓
RediscoverySource.fetch()
  - Gets conversations from 1d, 1w, 1m, 3m, 1y ago
  - Calculates base scores with time decay
    ↓
LightRanker.rank()
  - Removes dismissed items
  - Filters by quality threshold (>20)
  - Apply boosts (code, recency)
    ↓
HeavyRanker.rank()
  - Extract features (quality, recency, topic, interaction)
  - Calculate weighted score
  - Sort by relevance
    ↓
VisibilityFilters.apply()
  - Deduplicate
  - Filter by privacy
  - Balance sources (max 10 per source)
    ↓
Display top 20 with Feather Icons
```

---

## 📊 API Reference

### KnowledgeMixer

```typescript
class KnowledgeMixer {
  async generateFeed(
    conversations: Conversation[],
    userPrefs: UserPreferences,
    context?: {
      currentConversation?: Conversation;
      searchQuery?: string;
    }
  ): Promise<RecommendationItem[]>
}
```

### QualityScoreCalculator

```typescript
class QualityScoreCalculator {
  calculate(conversation: Conversation): number
  getQualityBand(score: number): 'excellent' | 'good' | 'fair' | 'low'
  getQualityColor(score: number): string
  getBreakdown(conversation: Conversation): QualityScoreBreakdown
}
```

### RediscoverySource

```typescript
class RediscoverySource {
  async fetch(limit: number): Promise<Candidate[]>
}
```

### Analytics

```typescript
class RecommendationAnalytics {
  trackFeedGenerated(metadata: FeedMetadata): void
  trackRecommendationImpression(item: RecommendationItem, rank: number): void
  trackRecommendationClicked(conversationId: string, metadata: ClickMetadata): void
  trackRecommendationDismissed(conversationId: string, metadata: DismissMetadata): void
}

function useRecommendationAnalytics(): {
  trackFeedGenerated: (metadata) => void
  trackImpressions: (items) => void
  trackClick: (item, rank) => void
  trackDismiss: (item, rank) => void
  resetImpressions: () => void
}
```

---

## 🎨 UI Components

### ForYou Page

**Location:** `src/pages/ForYou.tsx`

**Features:**
- Automatic feed generation
- Test mode toggle (no conversations needed)
- Loading states
- Error handling
- Analytics tracking

**Usage:**
```typescript
import { ForYou } from './pages/ForYou';

<Route path="/for-you" element={<ForYou />} />
```

### ConversationCard

**Location:** `src/components/recommendation/ConversationCard.tsx`

**Features:**
- Rank badge (#1, #2, etc.)
- Score display
- Reason with Feather Icon
- Quality badge with color coding
- Stats (code blocks, words, diagrams)
- "Read" and "Not interested" buttons
- Expandable breakdown ("Why am I seeing this?")

**Usage:**
```typescript
<ConversationCard
  item={recommendationItem}
  rank={1}
  onClick={(id) => navigate(`/conversation/${id}`)}
  onDismiss={(id) => setRecommendations(prev => prev.filter(r => r.id !== id))}
/>
```

---

## 🔧 Configuration

### Default User Preferences

```typescript
const defaultPrefs: UserPreferences = {
  rankWeights: {
    quality: 0.35,      // Quality matters most
    recency: 0.20,      // Some preference for fresh
    topicMatch: 0.30,   // Relevance important
    interaction: 0.15   // User engagement signal
  },
  providerBoost: {
    'claude': 1.1,      // Slight boost for Claude
    'chatgpt': 1.0,
    'gemini': 0.9
  },
  codeBoost: true,      // Prefer code-heavy
  longFormBoost: false,
  recentBoost: true,    // Prefer recent content
  dismissed: [],        // User's dismissed items
  dislikedTopics: []    // User's disliked topics
};
```

### Customizing Quality Weights

```typescript
import { QualityScoreCalculator } from './lib/recommendation/scoring/QualityScore';

const customCalculator = new QualityScoreCalculator({
  contentRichness: 0.50,  // More weight on content
  structuralDepth: 0.15,
  interaction: 0.25,
  provider: 0.10
});
```

---

## 📈 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in UI Mode

```bash
npm run test:ui
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test src/lib/recommendation/__tests__/QualityScore.test.ts
```

---

## 🐛 Troubleshooting

### "Module not found: feather-icons"

**Solution:**
```bash
npm install
```

### "Tests fail with 'cannot find module'"

**Solution:** Make sure vitest.config.ts is in root

### "Feather icons not rendering"

**Solution:** Icons are initialized automatically after render. If they don't appear:
```typescript
import feather from 'feather-icons';
useEffect(() => { feather.replace(); }, []);
```

### "No conversations showing"

**Solution:** Two options:
1. Capture real conversations at `/capture`
2. Click "Use Test Data" button on empty state

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [PHASE_1_COMPLETE_FINAL_SUMMARY.md](../PHASE_1_COMPLETE_FINAL_SUMMARY.md) | Complete implementation summary |
| [X_ALGORITHM_TECHNICAL_IMPLEMENTATION.md](../X_ALGORITHM_TECHNICAL_IMPLEMENTATION.md) | Full technical guide |
| [ADAMW_OPTIMIZATION_STRATEGY.md](../ADAMW_OPTIMIZATION_STRATEGY.md) | Neural network training (Phase 2+) |
| [NESTED_TUPLE_ALGORITHM_INTEGRATION.md](../NESTED_TUPLE_ALGORITHM_INTEGRATION.md) | Hierarchical ranking |

---

## 🎯 Success Metrics

### Phase 1 Goals

- [ ] Feed generates without errors
- [ ] Recommendations display correctly
- [ ] Quality scores show (0-100)
- [ ] Feather Icons render
- [ ] Test mode works
- [ ] Unit tests pass (7/7)
- [ ] Load time <500ms

### Phase 2 Goals

- [ ] Feed CTR >25%
- [ ] Session depth >3 conversations
- [ ] Serendipity >15% (old content)
- [ ] Quality perception >4.0/5.0

---

## 🚀 Next Steps

1. **Test Phase 1** (This week)
   - Install dependencies
   - Run tests
   - Test UI with test data
   - Test with real conversations

2. **Collect Metrics** (Next week)
   - Add analytics backend
   - Track CTR, session depth
   - Calculate serendipity score

3. **Phase 2 Planning** (Month 2)
   - Semantic embeddings
   - Vector similarity search
   - "Related conversations" feature

---

## 💬 Feedback

Found a bug? Have a suggestion?

Create an issue or check the existing documentation.

---

**Built with ❤️ using X-algorithm architecture**

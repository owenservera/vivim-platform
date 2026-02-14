# VIVIM Scoring: Semantic Weights

Content type classification directly impacts how the system handles knowledge nodes. Different types of information have different "half-lives" and value propositions.

## 1. Type Classification

The `classifyACUType()` logic identifies the nature of the content:

| Type | Detection Logic | Scoring Implication |
|------|-----------------|---------------------|
| `code_snippet` | Triple backticks or keywords | High Intrinsic Quality (+15) |
| `question` | Ends with `?` | High Discovery Value (+10) |
| `formula` | LaTeX delimiters `$$` | High Density Boost (+5) |
| `table` | Markdown pipes `\|` | Structural Bonus (+5) |
| `statement` | Fallback | Base value |

## 2. Categorization

The `categorizeACU()` logic maps information into four high-level buckets:

1. **Technical**: Code, API, Database, Server logic.
2. **Procedural**: Steps, Guides, Tutorials, "How-to".
3. **Personal**: Opinions, feelings, personal experiences ("I think", "I feel").
4. **Conceptual**: Definitions, theory, high-level abstract ideas.

## 3. The "Discovery" Value

VIVIM distinguishes between **Utility** and **Inspiration**:

- **Utility (Technical/Procedural)**: Highly ranked when using Search.
- **Inspiration (Conceptual/Question)**: Weighted higher in the "For You" feed to encourage lateral thinking and rediscovery.

## 4. Quality Thresholds

- **Gold (>90%)**: Dense, well-formatted, technical content.
- **Silver (>75%)**: Clear, multi-sentence explanations.
- **Bronze (>60%)**: Minimum bar for the "For You" feed.
- **Low (<60%)**: Usually filtered out of the feed; accessible via specific search only.

---

## Implementation Reference
Location: `server/src/services/acu-generator.js`
Functions: 
- `classifyACUType()`
- `categorizeACU()`
- `detectLanguage()`

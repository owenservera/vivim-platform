# VIVIM Scoring: Extraction Quality Heuristics

During the extraction phase, the `acu-generator.js` service applies deterministic heuristics to evaluate the "Intrinsic Value" of a piece of content.

## 1. Overall Quality Score (`qualityOverall`)

**Base Score: 50**
The score starts at 50 and is adjusted up to a maximum of 100 based on the following:

### Length & Density
- **Word Count**: `+ (wordCount / 10)`, capped at `+20`.
- **Length Bonus**: 
    - `+10` if content > 200 characters.
    - `+5` if content > 100 characters.

### Technical Depth
- **Code Detection**: `+15` if the content contains triple-backtick code blocks or standard programming keywords (`function`, `class`, `def`, `const`).
- **Mathematical content**: `+5` if LaTeX delimiters (`$$`) are detected.
- **Structured Data**: `+5` if Markdown table syntax (`|---|`) is detected.

### Semantic Value
- **Inquiry**: `+10` if the content contains a question mark `?`. Surfacing questions encourages later reflection.

---

## 2. Content Richness (`contentRichness`)

**Base Score: 30**
Focuses on "Information Diversity."

### Informational Blocks
- `+20` for > 50 words.
- `+15` for > 100 words.
- `+10` for > 200 words.

### Formatting Diversity
- **Code Blocks**: `+10`
- **Bold/Emphasis**: `+5`
- **Inline Code**: `+5`
- **Hyperlinks**: `+5`

---

## 3. Structural Integrity (`structuralIntegrity`)

**Base Score: 70**
Focuses on "Technical Cleanliness."

### Penalties
- **Brevity**: `-20` if content < 20 characters (likely chitchat).
- **Garbage Detection**: `-15` if the special character ratio (non-alphanumeric) exceeds 30%. This filters out UI artifacts or scraping errors.

### Bonuses
- **Complexity**: `+10` if the content contains more than 2 distinct sentences.

---

## Implementation Reference
Location: `server/src/services/acu-generator.js`
Functions: 
- `calculateQualityScore()`
- `calculateContentRichness()`
- `calculateStructuralIntegrity()`

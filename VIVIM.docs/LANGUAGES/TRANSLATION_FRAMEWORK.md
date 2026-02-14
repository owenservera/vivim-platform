# VIVIM Translation Framework
## User-Centric Bilingual Content Architecture

## Core Philosophy

**"Know the source, read in yours"** - Every piece of content displays its original language while allowing seamless reading in the user's preferred language.

---

## 1. Translation Layer Architecture

### 1.1 Content Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOURCE CONTENT                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   English  │  │  Spanish    │  │  Japanese   │              │
│  │   Source   │  │   Source    │  │   Source    │              │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘              │
│        │              │              │                        │
│        └──────────────┼──────────────┘                        │
│                       ▼                                       │
│         ┌─────────────────────────┐                           │
│         │   UNIFIED CONTENT       │                           │
│         │   REPRESENTATION       │                           │
│         │   (All Languages)     │                           │
│         └───────────┬─────────────┘                           │
│                     │                                         │
│          ┌──────────┴──────────┐                              │
│          ▼                     ▼                              │
│   ┌──────────────┐     ┌──────────────┐                       │
│   │ USER'S       │     │ SOURCE       │                       │
│   │ TRANSLATION  │     │ LANGUAGE     │                       │
│   │ (Auto-show)  │     │ (Badge)      │                       │
│   └──────────────┘     └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Content Storage Schema

```typescript
// Unified Bilingual Content
interface BilingualContent {
  id: string;
  
  // Source information
  sourceLanguage: LanguageCode;
  sourceText: string;
  sourceRichContent: RichContent; // Markdown, formatting preserved
  
  // Translation information
  translations: {
    [languageCode: string]: {
      text: string;
      richContent: RichContent;
      quality: 'machine' | 'human' | 'verified';
      lastUpdated: number;
      translator?: string;
    };
  };
  
  // User preferences
  userPreferredLanguage: LanguageCode;
  showOriginal: boolean;
}
```

---

## 2. User Experience Design

### 2.1 Reading Interface

```tsx
// BilingualContentViewer.tsx
interface BilingualContentViewerProps {
  content: BilingualContent;
  showOriginalToggle?: boolean;
}

const BilingualContentViewer: React.FC<BilingualContentViewerProps> = ({
  content,
  showOriginalToggle = true
}) => {
  const { userLanguage, setLanguage } = useLanguagePreferences();
  const [showBilingual, setShowBilingual] = useState(false);

  return (
    <YStack>
      {/* Language Context Header */}
      <LanguageContextBanner 
        sourceLanguage={content.sourceLanguage}
        readingLanguage={userLanguage}
        onToggleOriginal={() => setShowBilingual(!showBilingual)}
      />

      {/* Main Content */}
      <ContentRenderer
        content={showBilingual ? content.sourceText : content.translations[userLanguage]?.text}
        richContent={showBilingual ? content.sourceRichContent : content.translations[userLanguage]?.richContent}
      />

      {/* Original Text Accordion (when user wants to compare) */}
      {showBilingual && (
        <OriginalTextAccordion
          originalText={content.sourceText}
          translatedText={content.translations[userLanguage]?.text}
        />
      )}
    </YStack>
  );
}
```

### 2.2 Language Context Banner

```
┌──────────────────────────────────────────────────────┐
│ 🇺🇸 English source    →    🇪🇸 Reading in Spanish    │
│     [Show Original]   [Change Language ▼]            │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Shows source language flag
- Shows current reading language
- One-tap to show original text inline
- Easy language switcher dropdown

### 2.3 Inline Translation Toggle

```
CONTENT FLOW OPTIONS:

Option A: Side-by-Side (Desktop/Tablet)
┌─────────────────────┬─────────────────────┐
│      ENGLISH         │      SPANISH         │
│  The quick brown    │  El rápido marrón    │
│  fox jumps over...  │  salta sobre...      │
└─────────────────────┴─────────────────────┘

Option B: Sentence-Level Toggle
┌────────────────────────────────────────────────────┐
│  The quick brown fox [ES: el marrón rápido]        │
│  jumps over the lazy dog.                          │
│                                                      │
│  [🔄 Switch View: Original | Translation]          │
└────────────────────────────────────────────────────┘

Option C: Phrase Hover
┌────────────────────────────────────────────────────┐
│  The quick brown fox jumps over the lazy dog.      │
│              ↑ hover shows translation              │
│     "El perro brown fox saltó rápido"               │
└────────────────────────────────────────────────────┘
```

### 2.4 Content Interaction States

```typescript
interface ContentInteractionState {
  // Reading mode
  mode: 'translated' | 'original' | 'bilingual';
  
  // User preferences
  autoTranslate: boolean;
  showSourceLanguage: boolean;
  preferredTranslationQuality: 'any' | 'human' | 'verified';
  
  // Learning features
  showLanguageNotes: boolean;
  highlightUnknownWords: boolean;
  saveWordsToVocab: boolean;
}
```

---

## 3. Translation Sources & Quality

### 3.1 Quality Tiers

| Tier | Name | Description | Trust Level |
|------|------|-------------|-------------|
| 1 | 🤖 Machine | Auto-translated | Low - Verify |
| 2 | 👤 Community | User-corrected | Medium |
| 3 | ✍️ Professional | Human verified | High |
| 4 | ✅ Official | Official translation | Highest |

### 3.2 Source Attribution

```
┌─────────────────────────────────────────────────────────┐
│  Source: 🐦 Twitter/X (English)                        │
│  Translated by: 🤖 Google (Machine)                    │
│  Last updated: 2 hours ago • [Improve this]           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Language Detection & Auto-Translation

### 4.1 Detection Flow

```typescript
async function processIncomingContent(content: RawContent): Promise<BilingualContent> {
  // 1. Detect source language
  const detectedLanguage = await detectLanguage(content.text);
  
  // 2. If user doesn't know this language, auto-translate
  if (!userKnowsLanguage(detectedLanguage)) {
    const translation = await translate(content.text, detectedLanguage, userPreferredLanguage);
    
    return {
      ...content,
      sourceLanguage: detectedLanguage,
      translations: {
        [userPreferredLanguage]: {
          text: translation,
          quality: 'machine',
          lastUpdated: Date.now()
        }
      }
    };
  }
  
  // 3. If user knows the language, show original with option to translate
  return {
    ...content,
    sourceLanguage: detectedLanguage,
    translations: {} // User can request translation on-demand
  };
}
```

### 4.2 User Language Knowledge Graph

```typescript
interface UserLanguageProfile {
  nativeLanguages: LanguageCode[];
  fluentLanguages: LanguageCode[];
  learningLanguages: LanguageCode[];
  interestLanguages: LanguageCode[]; // Content user wants to see in this language
}

const getUserLanguagePreference = (contentLanguage: LanguageCode): 'show_original' | 'translate' | 'ask' => {
  const profile = user.languageProfile;
  
  if (profile.nativeLanguages.includes(contentLanguage)) {
    return 'show_original';
  }
  
  if (profile.fluentLanguages.includes(contentLanguage)) {
    return 'show_original';
  }
  
  if (profile.learningLanguages.includes(contentLanguage)) {
    return 'ask'; // Let user decide based on context
  }
  
  return 'translate'; // Auto-translate unknown languages
};
```

---

## 5. Content Types & Translation Strategy

### 5.1 Rich Content Support

```typescript
type ContentType = 
  | 'text'
  | 'markdown'
  | 'code'
  | 'structured_data'
  | 'media_captions'
  | 'conversation';

interface TranslationStrategy {
  [ContentType]: {
    preserveFormatting: boolean;
    handleCodeBlocks: 'translate' | 'keep_original' | 'comment_translation';
    handleLinks: 'translate' | 'localize' | 'keep_original';
    handleMediaAlt: 'translate' | 'keep_original';
  };
}

// Examples:
const strategies: Record<ContentType, TranslationStrategy[ContentType]> = {
  markdown: {
    preserveFormatting: true,
    handleCodeBlocks: 'keep_original',
    handleLinks: 'localize', // Update hrefs to user's language version if exists
    handleMediaAlt: 'translate'
  },
  code: {
    preserveFormatting: true,
    handleCodeBlocks: 'keep_original', // Never translate code
    handleLinks: 'keep_original',
    handleMediaAlt: 'keep_original'
  },
  conversation: {
    preserveFormatting: true,
    handleCodeBlocks: 'keep_original',
    handleLinks: 'keep_original',
    handleMediaAlt: 'translate'
  }
};
```

---

## 6. User Preferences UI

### 6.1 Language Settings Panel

```
┌─────────────────────────────────────────────────────┐
│  LANGUAGE & TRANSLATION SETTINGS                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  My Languages: 🇺🇸 English (Native)                │
│                🇪🇸 Spanish (Fluent)                  │
│                [Add Language +]                     │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Reading Preferences:                               │
│  ┌─────────────────────────────────────────────┐    │
│  │ Primary Language:  English (US)  ▼         │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ Auto-translate:     Always      ▼           │    │
│  │ • Always translate unknown content          │    │
│  │ • Ask before translating                   │    │
│  │ • Never auto-translate                     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Translation Quality:                              │
│  ┌─────────────────────────────────────────────┐    │
│  │ Prefer:  Human Verified    ▼                │    │
│  │ • Any (show fastest)                        │    │
│  │ • Community or better                       │    │
│  │ • Human verified only                       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Display Options:                                  │
│  ☐ Show source language badge                     │
│  ☐ Highlight unknown words                        │
│  ☐ Show inline translations                        │
│  ☐ Save translations to vocabulary                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 6.2 Contextual Translation Controls

```
┌─────────────────────────────────────────────────────┐
│  [🇺🇸 EN]  The quick brown fox jumps over...      │
│                                                     │
│           [📖 Read Original]                       │
│           [🔄 Switch to English]                    │
│           [🌐 Show Translation]                    │
│           [✏️ Improve Translation]                 │
└─────────────────────────────────────────────────────┘
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation
- [ ] Detect and store source language for all content
- [ ] Basic auto-translate using Google Translate API
- [ ] Show source language badge on all content cards
- [ ] User language preference settings

### Phase 2: Enhanced Experience
- [ ] User-corrected translations (community)
- [ ] Translation quality indicators
- [ ] Inline translation toggle
- [ ] Side-by-side view for tablets

### Phase 3: Advanced Features
- [ ] Professional translation marketplace
- [ ] Learning mode (highlight unknown words)
- [ ] Vocabulary flashcard integration
- [ ] Translation memory / consistency

### Phase 4: AI-Powered
- [ ] Context-aware translations
- [ ] Style-preserving translations
- [ ] Real-time bilingual conversations
- [ ] Custom vocabulary for specialized content

---

## 8. Key Files Structure

```
src/
├── context/
│   ├── LanguageContext.tsx      # User language preferences
│   └── TranslationContext.tsx    # Translation state & actions
├── services/
│   ├── translation/
│   │   ├── GoogleTranslator.ts
│   │   ├── DeepLTranslator.ts
│   │   └── HumanTranslator.ts
│   ├── languageDetection/
│   │   └── LanguageDetector.ts
│   └── translationMemory/
│       └── TranslationMemory.ts
├── hooks/
│   ├── useLanguage.ts
│   ├── useTranslation.ts
│   └── useBilingualContent.ts
├── components/
│   ├── bilingual/
│   │   ├── BilingualContentViewer.tsx
│   │   ├── LanguageContextBanner.tsx
│   │   ├── OriginalTextAccordion.tsx
│   │   ├── SideBySideView.tsx
│   │   └── InlineTranslationToggle.tsx
│   └── translation/
│       ├── TranslationQualityBadge.tsx
│       └── SourceLanguageBadge.tsx
├── types/
│   ├── bilingual.ts
│   └── translation.ts
└── translations/
    └── en.json  # UI labels only (content translations are in content objects)
```

---

## 9. Success Metrics

1. **User Adoption**
   - % of users who change default language
   - % of users who enable auto-translation
   - % of users who improve translations

2. **Content Quality**
   - Translation accuracy scores
   - User correction rate
   - Community contribution rate

3. **Engagement**
   - Time spent reading content
   - Click-through on "show original"
   - Vocabulary saved per user

---

## 10. Edge Cases

### 10.1 Mixed Language Content
```
User speaks: English (native), Spanish (fluent)
Content: English with Spanish quotes

Solution: 
- Main content: English (user's native)
- Spanish quotes: Show original with English translation on hover
```

### 10.2 Unknown/Ancient Languages
```
Content: Latin text

Solution:
- Show: "Original: Latin (Ancient)"
- Translate to user's preferred language
- Add note about translation quality
```

### 10.3 Dialect Support
```
Content: Portuguese (Brazilian)
User prefers: Portuguese (European)

Solution:
- Detect Portuguese variant
- Offer translation between variants
- Show both versions when significant differences
```

---

## Summary

The VIVIM Translation Framework prioritizes **user comprehension** while maintaining **source transparency**. Users always know:
- What language the original content is in
- What language they're reading
- How good the translation is
- How to see the original or improve the translation

This creates trust and enables true multilingual content consumption across all VIVIM features.



# VIVIM Corpus Context Engine & Dual-Engine Architecture
## Company Chatbot with Intelligent Corpus + User Context Fusion

**Version:** 2.0
**Last Updated:** June 2025
**Scope:** Corpus Context Engine, Dual-Engine Orchestration, Intelligent User Memory for Company Chatbots

---

## Executive Summary

This document architects the **Corpus Context Engine** — a second context engine purpose-built for company chatbot deployments where the AI must primarily answer from an authoritative document corpus while simultaneously building and leveraging deep per-user memory. The design introduces a **Dual-Engine Orchestrator** that dynamically balances between the existing User Context Engine and the new Corpus Context Engine based on query intent, user maturity, and conversation state.

The key insight: **the corpus is the company's "memory" and the user store is the visitor's "memory."** The chatbot must fluently draw from both, weighted by context, while making every returning user feel like they have their own personal AI that knows them, knows the product, and knows their history.

---

## Table of Contents

1. [Use Case Analysis & User Journey Mapping](#1-use-case-analysis--user-journey-mapping)
2. [Corpus Context Engine Architecture](#2-corpus-context-engine-architecture)
3. [Dual-Engine Orchestrator](#3-dual-engine-orchestrator)
4. [Intelligent User Memory for Chatbot](#4-intelligent-user-memory-for-chatbot)
5. [Data Models & Schema Extensions](#5-data-models--schema-extensions)
6. [API Extensions](#6-api-extensions)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. Use Case Analysis & User Journey Mapping

### 1.1 The Fundamental Problem

A company deploys a chatbot on their website. This chatbot needs to:

- **Answer product/service questions** from documentation (corpus-dominant)
- **Remember each visitor** across sessions without login (user-dominant)
- **Blend both** — "You asked about our API rate limits last week. Since then, we've updated the docs. Here's what changed."

The existing VIVIM system is **user-centric** — it builds context around who the user is. The chatbot use case is **corpus-centric with user personalization** — it builds context around what the company knows, flavored by who is asking.

### 1.2 User Avatar Definitions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FOUR USER AVATARS                                    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   STRANGER    │  │  ACQUAINTANCE│  │   FAMILIAR   │  │    KNOWN     │    │
│  │              │  │              │  │              │  │              │    │
│  │ First visit  │  │ 2-5 visits   │  │ 6-20 visits  │  │ 20+ visits   │    │
│  │ 0 memories   │  │ 1-10 memories│  │ 11-50 memories│ │ 50+ memories │    │
│  │ 0 conversations│ │ 1-5 convos  │  │ 6-20 convos  │  │ 20+ convos   │    │
│  │              │  │              │  │              │  │              │    │
│  │ Context:     │  │ Context:     │  │ Context:     │  │ Context:     │    │
│  │ 95% Corpus   │  │ 80% Corpus   │  │ 60% Corpus   │  │ 40% Corpus   │    │
│  │  5% User     │  │ 20% User     │  │ 40% User     │  │ 60% User     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  Context ratio shifts organically as we learn more about the user            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 User Journey: The Stranger (First Visit)

```
SCENARIO: Sarah visits acme.com for the first time.
She clicks the chatbot widget.

STEP 1: Identification
├── Fingerprint SDK generates device fingerprint
├── No match found → Create new VirtualUser
├── Avatar classification: STRANGER
├── Confidence: LOW
└── Consent modal shown

STEP 2: Sarah asks "What's your pricing for teams?"
├── Intent Detection: CORPUS_QUERY (product information)
├── Corpus Engine: PRIMARY (weight 0.95)
│   ├── Semantic search across pricing docs
│   ├── Retrieve pricing ACUs (3-5 chunks)
│   ├── Include FAQ entries about teams
│   └── Assemble corpus context bundle
├── User Engine: MINIMAL (weight 0.05)
│   ├── No memories exist
│   ├── No conversation history
│   └── Only session metadata (timezone, language)
├── Response: Clean, authoritative answer from docs
└── Memory Extraction:
    ├── FACTUAL: "User asked about team pricing"
    ├── GOAL: "User evaluating team plan"
    └── PREFERENCE: "User is on the pricing page"

STEP 3: Sarah asks "Do you integrate with Slack?"
├── Intent Detection: CORPUS_QUERY (integration info)
├── Corpus Engine: PRIMARY
│   ├── Search integration docs
│   └── Find Slack-specific content
├── User Engine: LIGHT
│   ├── Now has 1 prior message context
│   └── Knows she's evaluating teams → mention team integrations
├── Response: "Yes! And since you're looking at team plans,
│             our Slack integration is included in all team tiers."
└── Memory Extraction:
    ├── FACTUAL: "User interested in Slack integration"
    └── GOAL: "User evaluating team tooling"

EXPERIENCE: Sarah gets accurate product answers.
The bot subtly connects her questions but doesn't overreach.
She doesn't feel tracked — she feels helped.
```

### 1.4 User Journey: The Acquaintance (Return Visitor)

```
SCENARIO: Sarah returns 3 days later. Different browser tab,
same device.

STEP 1: Identification
├── Fingerprint match: HIGH confidence (82%)
├── Session restored from cookie
├── Avatar classification: ACQUAINTANCE
├── Memories loaded: 4 memories from last visit
└── Previous conversations: 1 conversation, 6 messages

STEP 2: Sarah asks "I'm back. Can you remind me about the
         team pricing?"
├── Intent Detection: MIXED (corpus + recall request)
├── User Engine: ELEVATED (weight 0.35)
│   ├── Memory recall: "User asked about team pricing 3 days ago"
│   ├── Memory recall: "User interested in Slack integration"
│   └── Conversation summary from last visit
├── Corpus Engine: PRIMARY (weight 0.65)
│   ├── Fresh pricing doc retrieval
│   └── Check for doc updates since last visit
├── Response: "Welcome back! Last time you were looking at our
│             Team plan at $29/seat/month. You were also
│             interested in the Slack integration — that's
│             included. Nothing's changed in pricing since
│             Tuesday. Want me to walk through setup?"
└── Memory Extraction:
    ├── EPISODIC: "User returned after 3 days, asked for pricing recap"
    └── GOAL: "User moving closer to decision"

STEP 3: Sarah asks "Actually, what's the difference between
         Team and Enterprise?"
├── Intent Detection: CORPUS_QUERY (comparison)
├── Corpus Engine: PRIMARY (weight 0.70)
│   ├── Retrieve Team tier docs
│   ├── Retrieve Enterprise tier docs
│   └── Comparison context assembled
├── User Engine: SUPPORTIVE (weight 0.30)
│   ├── Knows she was evaluating Team → frame comparison accordingly
│   └── Knows she cares about Slack → highlight relevant differences
├── Response: Comparison table with personalized emphasis on
│             features she's shown interest in
└── Memory Extraction:
    ├── FACTUAL: "User comparing Team vs Enterprise"
    └── GOAL: "User may need Enterprise features"

EXPERIENCE: Sarah feels recognized. The bot remembers her
without being creepy. It pulls from docs but personalizes
delivery based on her history.
```

### 1.5 User Journey: The Familiar (Regular Visitor)

```
SCENARIO: Sarah has visited 12 times over 3 weeks.
She's now a paying customer on the Team plan.

STEP 1: Identification
├── Fingerprint match: VERY HIGH confidence (94%)
├── Avatar classification: FAMILIAR
├── Memories loaded: 35 memories
├── Conversations: 11 past conversations
└── Known topics: pricing, integrations, API, team management

STEP 2: Sarah asks "I'm getting a 429 error on the API"
├── Intent Detection: SUPPORT_QUERY (technical issue)
├── Corpus Engine: TARGETED (weight 0.55)
│   ├── Search: API rate limiting docs
│   ├── Search: 429 error troubleshooting
│   ├── Search: Team plan API limits
│   └── Include relevant code examples
├── User Engine: SUBSTANTIAL (weight 0.45)
│   ├── Memory: "User is on Team plan" → Team rate limits
│   ├── Memory: "User uses Slack integration" → check if
│   │           Slack webhook calls count toward limit
│   ├── Memory: "User prefers concise technical responses"
│   ├── Previous conversation: discussed API setup 1 week ago
│   └── Check: any related past issues?
├── Response: "The Team plan has a 1000 req/min limit. Since
│             you're using the Slack integration, those webhook
│             calls count toward your limit too. Based on your
│             setup from last week, you might want to add
│             request batching. Here's how: [code example
│             tailored to her known stack]"
└── Memory Extraction:
    ├── EPISODIC: "User hit API rate limit (429)"
    ├── FACTUAL: "User's API usage approaching Team plan limits"
    └── GOAL: "May need to optimize API usage or upgrade"

EXPERIENCE: Sarah feels like she has a personal support engineer
who knows her setup, her plan, and her history. The answer is
precise because it combines doc accuracy with user awareness.
```

### 1.6 User Journey: The Known (Power User)

```
SCENARIO: Sarah has 50+ visits, 80+ memories, 25+ conversations
over 3 months. She's now an admin managing 15 team members.

STEP 1: Identification
├── Fingerprint match: MAXIMUM confidence (98%)
├── Avatar classification: KNOWN
├── Memories loaded: 83 memories (prioritized by relevance)
├── Conversations: 27 past conversations
└── Rich profile: role, plan, team size, tech stack, preferences,
    past issues, feature requests

STEP 2: Sarah asks "Any updates on the bulk import feature
         I asked about?"
├── Intent Detection: USER_RECALL (referencing past interaction)
├── User Engine: DOMINANT (weight 0.70)
│   ├── Memory search: "bulk import feature request"
│   ├── Found: EPISODIC memory from 6 weeks ago
│   │          "User requested bulk CSV import for team members"
│   ├── Found: GOAL memory "wants to onboard 50 new team members"
│   └── Conversation context: full exchange about the feature
├── Corpus Engine: SUPPLEMENTARY (weight 0.30)
│   ├── Search: bulk import in current docs
│   ├── Search: recent changelog/release notes
│   └── Found: "Bulk import released in v2.3 (2 weeks ago)"
├── Response: "Great news! The bulk CSV import you asked about
│             on April 15th is now live — it shipped in v2.3
│             two weeks ago. Since you mentioned needing to
│             onboard 50 team members, here's the quickstart:
│             [personalized guide based on her admin role and
│             team structure]"
└── Memory Extraction:
    ├── EPISODIC: "Informed user about bulk import feature release"
    ├── FACTUAL: "User aware of v2.3 features"
    └── UPDATE existing GOAL: "bulk onboarding — feature now available"

EXPERIENCE: Sarah feels like this is HER AI assistant. It
tracked a feature request across weeks, connected it to a
release, and proactively provided relevant onboarding guidance.
This is the full promise of the system.
```

### 1.7 Intent Classification Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INTENT → ENGINE WEIGHT MATRIX                          │
│                                                                              │
│  Intent Type          │ Corpus Weight │ User Weight │ Example                │
│  ─────────────────────┼───────────────┼─────────────┼──────────────────────  │
│  CORPUS_QUERY         │ 0.85-0.95     │ 0.05-0.15   │ "What's your API?"    │
│  CORPUS_DEEP_DIVE     │ 0.90-0.95     │ 0.05-0.10   │ "Explain OAuth flow"  │
│  SUPPORT_QUERY        │ 0.50-0.70     │ 0.30-0.50   │ "Getting 429 errors"  │
│  USER_RECALL          │ 0.10-0.30     │ 0.70-0.90   │ "What did we discuss?"│
│  COMPARISON           │ 0.70-0.80     │ 0.20-0.30   │ "Team vs Enterprise?" │
│  HOW_TO               │ 0.60-0.80     │ 0.20-0.40   │ "How do I set up X?"  │
│  STATUS_CHECK         │ 0.20-0.40     │ 0.60-0.80   │ "Any update on X?"    │
│  GENERAL_CHAT         │ 0.20-0.40     │ 0.60-0.80   │ "Hi, remember me?"    │
│  FEEDBACK             │ 0.10-0.20     │ 0.80-0.90   │ "Feature X is broken" │
│  ACCOUNT_SPECIFIC     │ 0.30-0.50     │ 0.50-0.70   │ "What's my plan?"     │
│                                                                              │
│  Note: Weights are further modified by avatar maturity level                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Corpus Context Engine Architecture

### 2.1 Overview

The Corpus Context Engine is the company's knowledge counterpart to the User Context Engine. Where the User Engine answers "who is this person and what do they need?", the Corpus Engine answers "what does the company know that's relevant to this question?"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CORPUS CONTEXT ENGINE                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    INGESTION PIPELINE                                │    │
│  │  Documents → Chunking → Embedding → Indexing → Metadata Tagging    │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    CORPUS STORE                                      │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
│  │  │CorpusDoc │ │CorpusChunk│ │CorpusTopic│ │CorpusFAQ │              │    │
│  │  │(source)  │ │(indexed) │ │(taxonomy)│ │(Q&A)    │               │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    RETRIEVAL ENGINE                                   │    │
│  │  Semantic Search → Hybrid Retrieval → Re-ranking → Freshness Check │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    CORPUS CONTEXT ASSEMBLY                           │    │
│  │  5-Layer System (C0-C4) → Budget Allocation → Prompt Compilation   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Corpus Ingestion Pipeline

The ingestion pipeline transforms raw company documents into searchable, embeddable, semantically-indexed knowledge chunks.

```
Raw Document (MD, PDF, HTML, API spec, etc.)
     │
     ▼
┌─────────────────────────┐
│  1. PARSER              │
│  - Markdown parser      │
│  - PDF extractor        │
│  - HTML sanitizer       │
│  - API spec parser      │
│  - Structured data      │
│    (JSON/YAML)          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  2. PREPROCESSOR        │
│  - Section extraction   │
│  - Header hierarchy     │
│  - Code block isolation │
│  - Table preservation   │
│  - Link resolution      │
│  - Metadata extraction  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  3. CHUNKER             │
│  - Semantic chunking    │
│    (section-aware)      │
│  - Overlap: 50-100 tokens│
│  - Target: 300-500 tokens│
│  - Preserve code blocks │
│  - Preserve tables      │
│  - Parent-child linking │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  4. ENRICHER            │
│  - Generate embeddings  │
│  - Extract keywords     │
│  - Classify topic       │
│  - Detect content type  │
│  - Generate summary     │
│  - Generate Q&A pairs   │
│  - Difficulty level     │
│  - Freshness score      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  5. INDEXER             │
│  - Store in PostgreSQL  │
│  - Index in pgvector    │
│  - Update topic graph   │
│  - Update FAQ index     │
│  - Invalidate caches    │
│  - Version tracking     │
└─────────────────────────┘
```

#### Chunking Strategy

The chunker is **section-aware** — it respects document structure rather than splitting arbitrarily:

```typescript
interface ChunkingConfig {
  // Size targets
  targetChunkSize: number;       // 400 tokens (default)
  maxChunkSize: number;          // 600 tokens (hard limit)
  minChunkSize: number;          // 100 tokens (don't create tiny chunks)
  overlapSize: number;           // 75 tokens (context window)

  // Structure preservation
  respectHeadings: boolean;       // true — never split across H1/H2
  preserveCodeBlocks: boolean;    // true — keep code blocks intact
  preserveTables: boolean;        // true — keep tables intact
  preserveLists: boolean;         // true — keep list items together

  // Hierarchy
  generateParentChunks: boolean;  // true — create section-level summaries
  maxHierarchyDepth: number;      // 3 levels (doc → section → chunk)
}
```

```typescript
interface SemanticChunker {
  chunk(document: ParsedDocument, config: ChunkingConfig): ChunkResult;
}

interface ChunkResult {
  chunks: CorpusChunk[];
  parentChunks: CorpusChunk[];     // Section-level summaries
  rootChunk: CorpusChunk;          // Document-level summary
  metadata: {
    totalChunks: number;
    avgChunkSize: number;
    preservedStructures: number;   // Code blocks, tables kept intact
  };
}

interface CorpusChunk {
  id: string;
  documentId: string;
  content: string;
  summary: string;                 // LLM-generated 1-line summary
  
  // Hierarchy
  parentChunkId: string | null;    // Section-level parent
  childChunkIds: string[];
  chunkIndex: number;              // Position in document
  totalChunks: number;
  
  // Structure context
  sectionPath: string[];           // ["API Reference", "Authentication", "OAuth"]
  headingLevel: number;            // H1=1, H2=2, etc.
  contentType: ChunkContentType;   // prose, code, table, list, mixed
  
  // Embeddings
  embedding: number[];             // Vector representation
  keywordEmbedding: number[];      // Keyword-focused embedding (optional)
  
  // Metadata
  keywords: string[];
  topicSlug: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Freshness
  sourceUpdatedAt: DateTime;
  ingestedAt: DateTime;
  freshnessScore: number;          // 0.0-1.0 (decays over time)
  
  // Quality
  qualityScore: number;            // 0.0-1.0 (content quality assessment)
  
  // Generated Q&A
  generatedQuestions: string[];    // Questions this chunk answers
  generatedAnswer: string;         // Standalone answer version
}
```

#### Q&A Pair Generation

During ingestion, the system generates hypothetical questions each chunk can answer. This dramatically improves retrieval accuracy because user queries are questions, and matching question-to-question has higher semantic similarity than question-to-statement:

```typescript
async function generateQAPairs(
  chunk: CorpusChunk,
  llmService: LLMService
): Promise<QAPair[]> {
  const response = await llmService.chat({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Given the following documentation chunk, generate 3-5 natural 
                  questions that a user might ask that this content answers. 
                  Also generate a concise standalone answer for each question.
                  
                  Format: JSON array of { question, answer, confidence }`,
      },
      {
        role: 'user',
        content: `Section: ${chunk.sectionPath.join(' > ')}
                  Content: ${chunk.content}`,
      },
    ],
  });

  return JSON.parse(response.content);
}

// Example output:
[
  {
    "question": "What are the API rate limits for the Team plan?",
    "answer": "Team plan allows 1000 requests per minute per API key.",
    "confidence": 0.95
  },
  {
    "question": "How do I handle 429 errors?",
    "answer": "Implement exponential backoff starting at 1 second...",
    "confidence": 0.88
  }
]
```

#### Document Versioning

```typescript
interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;              // "2.3.1"
  contentHash: string;          // SHA-256 of raw content
  
  // Change tracking
  changeType: 'major' | 'minor' | 'patch';
  changelog: string;            // LLM-generated summary of changes
  changedSections: string[];    // Section paths that changed
  addedChunks: string[];        // New chunk IDs
  modifiedChunks: string[];     // Updated chunk IDs
  removedChunks: string[];      // Deleted chunk IDs
  
  // Timestamps
  publishedAt: DateTime;
  ingestedAt: DateTime;
  
  // Status
  isActive: boolean;            // Current version
  isPreviousActive: boolean;    // Was the previous active version
}
```

When documents are updated:

1. **Diff detection**: Compare content hashes
2. **Section-level diff**: Identify which sections changed
3. **Re-chunk** only changed sections (preserve unchanged chunk IDs)
4. **Re-embed** changed chunks
5. **Generate changelog**: LLM summarizes what changed
6. **Invalidate caches**: Clear affected corpus bundles
7. **Notify**: If users previously asked about changed content, the system can proactively inform them

### 2.3 Corpus Retrieval Engine

The retrieval engine finds the most relevant corpus content for a given query. It uses a multi-stage pipeline optimized for accuracy.

```
User Query
     │
     ▼
┌─────────────────────────┐
│  1. QUERY ANALYSIS      │
│  - Intent classification│
│  - Topic detection      │
│  - Entity extraction    │
│  - Query expansion      │
│  - Difficulty assessment│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  2. MULTI-PATH RETRIEVAL│
│  ┌─────────┐ ┌────────┐│
│  │Semantic │ │Keyword ││
│  │Search   │ │Search  ││
│  │(vector) │ │(BM25)  ││
│  └────┬────┘ └───┬────┘│
│       │          │      │
│  ┌────┴──────────┴────┐│
│  │   Q&A Matching     ││
│  │   (question→question)│
│  └────────┬───────────┘│
└───────────┼─────────────┘
            │
            ▼
┌─────────────────────────┐
│  3. CANDIDATE SCORING   │
│  - Semantic similarity  │
│  - Keyword relevance    │
│  - Q&A match score      │
│  - Freshness score      │
│  - Topic alignment      │
│  - Section authority    │
│  - Quality score        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  4. RE-RANKING          │
│  - Cross-encoder        │
│    (query, chunk) pairs │
│  - Diversity filter     │
│    (avoid redundancy)   │
│  - Parent expansion     │
│    (include section     │
│     context if needed)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  5. CONTEXT FORMATION   │
│  - Rank-ordered chunks  │
│  - Token budget fitting │
│  - Citation preparation │
│  - Confidence scoring   │
└─────────────────────────┘
```

#### Multi-Path Retrieval

```typescript
interface CorpusRetrievalEngine {
  retrieve(params: CorpusRetrievalParams): Promise<CorpusRetrievalResult>;
}

interface CorpusRetrievalParams {
  tenantId: string;                    // Company/deployment ID
  query: string;
  queryEmbedding: number[];
  
  // Filtering
  topicSlugs?: string[];               // Limit to specific topics
  contentTypes?: ChunkContentType[];   // prose, code, table, etc.
  difficulty?: string;                 // Filter by difficulty
  documentIds?: string[];              // Limit to specific docs
  
  // Retrieval config
  maxResults: number;                  // Default: 15 candidates
  finalResults: number;                // Default: 5 after re-ranking
  freshnessBias: number;               // 0.0-1.0, prefer newer content
  
  // User context (for personalization)
  userAvatar?: UserAvatar;             // STRANGER, ACQUAINTANCE, etc.
  userTopics?: string[];               // User's known topics of interest
  userDifficulty?: string;             // User's apparent expertise level
}

interface CorpusRetrievalResult {
  chunks: ScoredCorpusChunk[];
  totalCandidates: number;
  retrievalTimeMs: number;
  confidence: number;                  // 0.0-1.0: how confident are we in results
  fallbackSuggestions?: string[];      // If low confidence, suggest related topics
  citations: Citation[];
}

interface ScoredCorpusChunk {
  chunk: CorpusChunk;
  scores: {
    semantic: number;       // Vector similarity
    keyword: number;        // BM25 score
    qaMatch: number;        // Q&A pair matching
    freshness: number;      // Content freshness
    topicAlign: number;     // Topic alignment
    quality: number;        // Content quality
    combined: number;       // Weighted final score
  };
  parentContext?: string;   // Section-level context if needed
}

interface Citation {
  chunkId: string;
  documentTitle: string;
  sectionPath: string[];
  url?: string;             // Link to original doc
  version: string;
  relevanceScore: number;
}
```

#### Scoring Formula

```typescript
function computeChunkScore(
  chunk: CorpusChunk,
  scores: RawScores,
  params: CorpusRetrievalParams
): number {
  // Base weights
  const weights = {
    semantic: 0.35,
    keyword: 0.15,
    qaMatch: 0.25,         // Q&A matching is very powerful
    freshness: 0.10,
    topicAlign: 0.08,
    quality: 0.07,
  };

  // Adjust for freshness bias
  if (params.freshnessBias > 0.5) {
    weights.freshness += 0.05;
    weights.semantic -= 0.05;
  }

  // Adjust for user expertise
  if (params.userDifficulty === 'advanced' && chunk.difficulty === 'advanced') {
    // Boost advanced content for advanced users
    weights.topicAlign += 0.05;
    weights.keyword -= 0.05;
  }

  // Compute weighted score
  let score = 0;
  score += scores.semantic * weights.semantic;
  score += scores.keyword * weights.keyword;
  score += scores.qaMatch * weights.qaMatch;
  score += scores.freshness * weights.freshness;
  score += scores.topicAlign * weights.topicAlign;
  score += scores.quality * weights.quality;

  return score;
}
```

#### Parent Expansion

When a chunk is retrieved but seems incomplete, the system can "expand" to include its parent (section-level summary) for additional context:

```typescript
async function expandWithParentContext(
  chunk: ScoredCorpusChunk,
  tokenBudget: number
): Promise<ScoredCorpusChunk> {
  // Expand if:
  // 1. Chunk is short (< 150 tokens)
  // 2. Chunk references other sections
  // 3. Chunk is a code example without explanation
  
  const needsExpansion = (
    chunk.chunk.content.split(/\s+/).length < 150 ||
    chunk.chunk.contentType === 'code' ||
    chunk.chunk.content.includes('see above') ||
    chunk.chunk.content.includes('as mentioned')
  );

  if (needsExpansion && chunk.chunk.parentChunkId) {
    const parent = await getChunkById(chunk.chunk.parentChunkId);
    if (parent && estimateTokens(parent.summary) + estimateTokens(chunk.chunk.content) <= tokenBudget) {
      return {
        ...chunk,
        parentContext: parent.summary,
      };
    }
  }

  return chunk;
}
```

#### Confidence Assessment

The system assesses its confidence in the retrieved results and adjusts behavior accordingly:

```typescript
function assessRetrievalConfidence(
  results: ScoredCorpusChunk[],
  query: string
): ConfidenceAssessment {
  if (results.length === 0) {
    return {
      level: 'NONE',
      score: 0,
      action: 'ESCALATE',
      message: 'No relevant documentation found',
    };
  }

  const topScore = results[0].scores.combined;
  const avgScore = results.reduce((s, r) => s + r.scores.combined, 0) / results.length;
  const scoreSpread = topScore - (results[results.length - 1]?.scores.combined || 0);

  if (topScore >= 0.85) {
    return {
      level: 'HIGH',
      score: topScore,
      action: 'ANSWER_DIRECTLY',
      message: 'High-confidence match found',
    };
  }

  if (topScore >= 0.60) {
    return {
      level: 'MEDIUM',
      score: topScore,
      action: 'ANSWER_WITH_CAVEAT',
      message: 'Relevant content found, but may not be exact match',
    };
  }

  if (topScore >= 0.40) {
    return {
      level: 'LOW',
      score: topScore,
      action: 'SUGGEST_ALTERNATIVES',
      message: 'Partial matches found',
      suggestions: generateAlternativeSuggestions(query, results),
    };
  }

  return {
    level: 'VERY_LOW',
    score: topScore,
    action: 'ESCALATE_TO_HUMAN',
    message: 'Unable to find relevant documentation',
  };
}
```

### 2.4 Corpus Context Assembly (5-Layer System)

The Corpus Context Engine uses its own **5-layer system (C0-C4)**, analogous to but distinct from the User Context Engine's L0-L7:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CORPUS CONTEXT LAYERS (C0-C4)                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  C0: COMPANY IDENTITY CORE                              [FIXED]     │    │
│  │  Company name, product overview, brand voice, guardrails            │    │
│  │  Budget: 200-400 tokens │ Elasticity: 0.0 (non-negotiable)        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  C1: TOPIC FRAMEWORK                                    [SEMI-FIXED]│    │
│  │  Relevant topic taxonomy, related topics, navigation hints          │    │
│  │  Budget: 100-300 tokens │ Elasticity: 0.2                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  C2: RETRIEVED KNOWLEDGE (PRIMARY)                      [ELASTIC]   │    │
│  │  Top-ranked corpus chunks, Q&A pairs, direct answers               │    │
│  │  Budget: 1000-4000 tokens │ Elasticity: 0.4                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  C3: SUPPORTING CONTEXT                                [ELASTIC]    │    │
│  │  Related chunks, parent summaries, cross-references                │    │
│  │  Budget: 500-2000 tokens │ Elasticity: 0.7                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  C4: FRESHNESS & CHANGELOG                             [ELASTIC]    │    │
│  │  Recent updates, version changes, deprecation notices              │    │
│  │  Budget: 200-500 tokens │ Elasticity: 0.8                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Layer Details

**C0: Company Identity Core**
```typescript
interface CompanyIdentityCore {
  companyName: string;
  productName: string;
  productDescription: string;        // 1-2 sentences
  brandVoice: BrandVoiceConfig;      // Tone, formality, personality
  guardrails: string[];              // Things the bot should NEVER say
  escalationInstructions: string;    // When/how to hand off to humans
  
  // Behavioral directives
  answerStyle: 'concise' | 'detailed' | 'conversational';
  citeSources: boolean;              // Include doc references
  suggestRelated: boolean;           // Suggest related topics
  proactiveHelp: boolean;            // Offer next steps
}
```

Example compiled C0 bundle:
```
You are the Acme support assistant. You help users with questions 
about Acme's API platform and team collaboration tools.

Voice: Professional but friendly. Use clear language. Include 
code examples when relevant.

Rules:
- Never share internal pricing formulas
- Never guarantee uptime SLAs beyond published numbers
- If unsure, say "I'm not certain — let me connect you with support"
- Always cite documentation sections when answering technical questions
- If the user's question seems urgent, offer to create a support ticket

When answering, prioritize accuracy over completeness. It's better 
to give a correct partial answer with a link than a complete wrong one.
```

**C1: Topic Framework**
```typescript
interface TopicFramework {
  detectedTopic: CorpusTopic;
  relatedTopics: CorpusTopic[];
  topicBreadcrumb: string;          // "API Reference > Authentication > OAuth"
  availableSubtopics: string[];     // For "want to learn more?" suggestions
}
```

**C2: Retrieved Knowledge (Primary)**
The main knowledge payload — the top-ranked chunks from retrieval:
```typescript
interface RetrievedKnowledge {
  chunks: ScoredCorpusChunk[];       // Ranked by relevance
  confidence: number;                // Overall confidence
  formattedContent: string;          // Ready for prompt insertion
  citations: Citation[];
}
```

**C3: Supporting Context**
Additional chunks that provide background or related information:
```typescript
interface SupportingContext {
  parentSummaries: string[];         // Section-level context
  relatedChunks: ScoredCorpusChunk[];
  crossReferences: CrossReference[];
}
```

**C4: Freshness & Changelog**
```typescript
interface FreshnessContext {
  recentUpdates: DocumentUpdate[];   // Changes in relevant docs
  deprecationNotices: string[];      // Deprecated features mentioned
  versionInfo: string;               // Current version context
  changesSinceLastVisit?: DocumentUpdate[];  // If returning user
}
```

#### Corpus Context Assembler

```typescript
interface CorpusContextAssembler {
  assemble(params: CorpusAssemblyParams): Promise<AssembledCorpusContext>;
}

interface CorpusAssemblyParams {
  tenantId: string;                   // Company deployment
  query: string;
  queryEmbedding: number[];
  
  // Budget
  totalBudget: number;                // Token budget for corpus portion
  
  // Filters
  topicSlugs?: string[];
  documentIds?: string[];
  
  // User context (from orchestrator)
  userAvatar: UserAvatar;
  userTopics?: string[];
  userDifficulty?: string;
  
  // Previous conversation context
  previousQueries?: string[];         // For multi-turn query refinement
}

interface AssembledCorpusContext {
  compiledPrompt: string;             // Ready for system prompt injection
  layers: {
    C0: { content: string; tokens: number; };
    C1: { content: string; tokens: number; };
    C2: { content: string; tokens: number; };
    C3: { content: string; tokens: number; };
    C4: { content: string; tokens: number; };
  };
  totalTokens: number;
  citations: Citation[];
  confidence: number;
  metadata: {
    retrievalTimeMs: number;
    chunksConsidered: number;
    chunksUsed: number;
    topicsCovered: string[];
    freshnessInfo: string | null;
  };
}
```

### 2.5 Corpus Topic Taxonomy

The corpus organizes knowledge into a topic tree that enables:
- Scoped retrieval (only search relevant topics)
- Navigation suggestions ("Related: OAuth, API Keys, Webhooks")
- Gap detection (identify undocumented areas)

```typescript
interface CorpusTopic {
  id: string;
  tenantId: string;
  slug: string;                       // "api-authentication-oauth"
  name: string;                       // "OAuth Authentication"
  description: string;
  
  // Hierarchy
  parentTopicId: string | null;
  childTopicIds: string[];
  path: string[];                     // ["API", "Authentication", "OAuth"]
  depth: number;                      // 0 = root, 1 = category, 2+ = subcategory
  
  // Content stats
  documentCount: number;
  chunkCount: number;
  totalTokens: number;
  
  // Embeddings
  embedding: number[];                // Topic-level embedding for matching
  representativeQuestions: string[];  // Common questions in this topic
  
  // Freshness
  lastUpdatedAt: DateTime;
  avgContentAge: number;              // Days since avg chunk update
  
  // Metadata
  difficulty: string;
  popularity: number;                 // Query frequency
  
  // Active status
  isActive: boolean;
}
```

### 2.6 Corpus Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CORPUS CACHE LAYERS                                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  L1: HOT CACHE (In-Memory)                         TTL: 15 min     │    │
│  │  - C0 Company Identity (per tenant)                                │    │
│  │  - Top 50 most-queried chunks (per tenant)                         │    │
│  │  - Topic taxonomy (per tenant)                                     │    │
│  │  - Pre-computed Q&A embeddings                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  L2: WARM CACHE (Redis)                             TTL: 2 hours    │    │
│  │  - Assembled corpus contexts (query hash → context)                │    │
│  │  - Retrieval results (query hash → chunks)                         │    │
│  │  - Topic framework bundles                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  L3: COLD CACHE (Database Query Cache)              TTL: 24 hours   │    │
│  │  - Full chunk content                                              │    │
│  │  - Document metadata                                               │    │
│  │  - Version history                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Invalidation: On document update, all caches for affected topics cleared   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cache Key Strategy:**

```typescript
// Query-level cache (most impactful)
function corpusQueryCacheKey(tenantId: string, query: string): string {
  const queryHash = hashString(query.toLowerCase().trim());
  return `corpus:${tenantId}:q:${queryHash}`;
}

// Topic-level cache
function corpusTopicCacheKey(tenantId: string, topicSlug: string): string {
  return `corpus:${tenantId}:topic:${topicSlug}`;
}

// Identity cache (per tenant, changes rarely)
function corpusIdentityCacheKey(tenantId: string): string {
  return `corpus:${tenantId}:identity`;
}
```

### 2.7 Corpus Analytics

```typescript
interface CorpusAnalytics {
  // Content coverage
  totalDocuments: number;
  totalChunks: number;
  totalTopics: number;
  avgChunkQuality: number;
  
  // Query analytics
  totalQueries: number;
  avgConfidence: number;
  lowConfidenceRate: number;           // % of queries with confidence < 0.4
  topQueries: QueryFrequency[];        // Most common queries
  unansweredQueries: string[];         // Queries with NONE confidence
  
  // Gap analysis
  topicCoverageGaps: TopicGap[];       // Topics with poor coverage
  staleContent: StaleContentReport[];  // Content older than threshold
  
  // User satisfaction signals
  followUpRate: number;                // % of queries needing follow-up
  escalationRate: number;              // % escalated to human
  thumbsUpRate: number;                // Explicit feedback if available
}

interface TopicGap {
  topicSlug: string;
  queryCount: number;                  // How often users ask about this
  avgConfidence: number;               // How well we answer
  recommendation: string;             // "Add documentation for X"
}
```

---

## 3. Dual-Engine Orchestrator

### 3.1 Overview

The **Dual-Engine Orchestrator** is the central intelligence that decides how to blend the User Context Engine and Corpus Context Engine for each interaction. It is the critical new component that makes the chatbot feel both knowledgeable (corpus) and personal (user memory).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DUAL-ENGINE ORCHESTRATOR                                 │
│                                                                              │
│  User Message                                                               │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────┐                                │
│  │         INTENT CLASSIFIER               │                                │
│  │  - Query type detection                 │                                │
│  │  - Corpus vs User signal analysis       │                                │
│  │  - Multi-turn context awareness         │                                │
│  └────────────────┬────────────────────────┘                                │
│                   │                                                          │
│                   ▼                                                          │
│  ┌─────────────────────────────────────────┐                                │
│  │         WEIGHT CALCULATOR               │                                │
│  │  - Intent weight                        │                                │
│  │  - Avatar maturity modifier             │                                │
│  │  - Conversation arc modifier            │                                │
│  │  - Explicit signal override             │                                │
│  └────────────┬───────────┬────────────────┘                                │
│               │           │                                                  │
│          ┌────┘           └────┐                                            │
│          ▼                     ▼                                             │
│  ┌───────────────┐    ┌───────────────┐                                    │
│  │  USER CONTEXT │    │ CORPUS CONTEXT│                                    │
│  │  ENGINE       │    │ ENGINE        │                                    │
│  │  (L0-L7)      │    │ (C0-C4)       │                                    │
│  │               │    │               │                                    │
│  │  Weight: 0.35 │    │  Weight: 0.65 │    ← Dynamic per query             │
│  │  Budget: 3500 │    │  Budget: 6500 │    ← Proportional allocation       │
│  └───────┬───────┘    └───────┬───────┘                                    │
│          │                     │                                             │
│          └──────────┬──────────┘                                            │
│                     ▼                                                        │
│  ┌─────────────────────────────────────────┐                                │
│  │         CONTEXT MERGER                  │                                │
│  │  - Interleave corpus + user context     │                                │
│  │  - Deduplicate information              │                                │
│  │  - Resolve conflicts (user memory vs    │                                │
│  │    outdated docs)                       │                                │
│  │  - Final prompt assembly                │                                │
│  └────────────────┬────────────────────────┘                                │
│                   │                                                          │
│                   ▼                                                          │
│          ASSEMBLED SYSTEM PROMPT                                            │
│          (Ready for LLM inference)                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Intent Classifier

The intent classifier analyzes each incoming message to determine the optimal balance between corpus and user context:

```typescript
interface IntentClassifier {
  classify(params: ClassificationParams): Promise<ClassificationResult>;
}

interface ClassificationParams {
  message: string;
  conversationHistory: Message[];      // Recent messages for multi-turn context
  userAvatar: UserAvatar;
  userMemorySummary: string;           // Brief summary of what we know
  corpusTopics: string[];              // Available corpus topics
}

interface ClassificationResult {
  primaryIntent: IntentType;
  secondaryIntent?: IntentType;
  confidence: number;
  
  // Weight recommendations
  corpusWeight: number;                // 0.0-1.0
  userWeight: number;                  // 0.0-1.0 (always = 1 - corpusWeight)
  
  // Signals that informed the classification
  signals: {
    queryTermsInCorpus: number;        // How many query terms match corpus
    queryTermsInMemory: number;        // How many query terms match user memory
    recallIndicators: string[];        // Words like "remember", "last time", "we discussed"
    corpusIndicators: string[];        // Words like "documentation", "how does", "what is"
    explicitSignals: string[];         // Direct requests like "check the docs"
    conversationArc: string;           // 'corpus_thread' | 'user_thread' | 'mixed'
  };
}

type IntentType = 
  | 'CORPUS_QUERY'         // General product/doc question
  | 'CORPUS_DEEP_DIVE'     // Detailed technical question
  | 'SUPPORT_QUERY'        // Issue/problem needing corpus + user context
  | 'USER_RECALL'          // Referencing past interactions
  | 'COMPARISON'           // Comparing features/options
  | 'HOW_TO'               // Step-by-step guidance
  | 'STATUS_CHECK'         // Checking on previous request/issue
  | 'GENERAL_CHAT'         // Casual conversation
  | 'FEEDBACK'             // User providing feedback
  | 'ACCOUNT_SPECIFIC'     // Questions about their specific situation
  | 'CLARIFICATION'        // Follow-up to previous answer
  | 'NAVIGATION'           // "Where can I find X?"
  | 'ESCALATION'           // "Let me talk to a human"
  ;
```

#### Classification Implementation

The classifier uses a **two-stage approach**: fast rule-based pre-classification followed by LLM-based refinement when needed.

```typescript
class DualIntentClassifier implements IntentClassifier {
  
  async classify(params: ClassificationParams): Promise<ClassificationResult> {
    // Stage 1: Fast rule-based classification
    const rulesResult = this.ruleBasedClassify(params);
    
    // If high confidence from rules, skip LLM
    if (rulesResult.confidence >= 0.85) {
      return this.applyAvatarModifier(rulesResult, params.userAvatar);
    }
    
    // Stage 2: LLM-based classification for ambiguous cases
    const llmResult = await this.llmClassify(params);
    
    // Merge: use LLM intent but adjust weights with rule signals
    return this.mergeClassifications(rulesResult, llmResult, params.userAvatar);
  }

  private ruleBasedClassify(params: ClassificationParams): ClassificationResult {
    const message = params.message.toLowerCase();
    let corpusWeight = 0.5;
    let intent: IntentType = 'CORPUS_QUERY';
    let confidence = 0.5;
    
    // --- RECALL INDICATORS (shift toward user) ---
    const recallPatterns = [
      /\b(remember|recall|last time|we (discussed|talked|chatted)|previously|before|earlier)\b/i,
      /\b(you (said|mentioned|told|suggested)|did (i|we)|what was)\b/i,
      /\b(my (account|plan|setup|config|history|issue|problem|ticket))\b/i,
      /\b(update on|status of|follow up|any news)\b/i,
    ];
    
    const recallHits = recallPatterns.filter(p => p.test(message));
    if (recallHits.length > 0) {
      corpusWeight -= 0.25 * recallHits.length;
      intent = recallHits.length >= 2 ? 'USER_RECALL' : 'STATUS_CHECK';
      confidence = 0.7 + (recallHits.length * 0.05);
    }
    
    // --- CORPUS INDICATORS (shift toward corpus) ---
    const corpusPatterns = [
      /\b(how (does|do|to|can)|what (is|are|does)|explain|describe|documentation)\b/i,
      /\b(api|endpoint|sdk|library|function|method|parameter|config)\b/i,
      /\b(pricing|plan|feature|limit|support|upgrade|integrate)\b/i,
      /\b(error|code|example|syntax|setup|install|deploy)\b/i,
    ];
    
    const corpusHits = corpusPatterns.filter(p => p.test(message));
    if (corpusHits.length > 0) {
      corpusWeight += 0.15 * corpusHits.length;
      if (corpusHits.length >= 2) {
        intent = message.includes('how') ? 'HOW_TO' : 'CORPUS_QUERY';
        confidence = 0.7 + (corpusHits.length * 0.05);
      }
    }
    
    // --- SUPPORT INDICATORS (balanced) ---
    const supportPatterns = [
      /\b(error|bug|broken|not working|issue|problem|help|stuck)\b/i,
      /\b(429|500|401|403|timeout|crash|fail)\b/i,
    ];
    
    const supportHits = supportPatterns.filter(p => p.test(message));
    if (supportHits.length > 0) {
      intent = 'SUPPORT_QUERY';
      corpusWeight = 0.55;  // Slightly corpus-heavy but needs user context
      confidence = 0.75;
    }
    
    // --- ESCALATION ---
    const escalationPatterns = [
      /\b(talk to|speak (to|with)|human|agent|real person|escalate|manager)\b/i,
    ];
    if (escalationPatterns.some(p => p.test(message))) {
      intent = 'ESCALATION';
      corpusWeight = 0.1;
      confidence = 0.95;
    }
    
    // --- GREETING / GENERAL ---
    const greetingPatterns = [
      /^(hi|hello|hey|good (morning|afternoon|evening)|sup|yo)\b/i,
      /\b(how are you|what's up|nice to (meet|see))\b/i,
    ];
    if (greetingPatterns.some(p => p.test(message)) && message.split(/\s+/).length < 8) {
      intent = 'GENERAL_CHAT';
      corpusWeight = 0.2;
      confidence = 0.85;
    }
    
    // Clamp weights
    corpusWeight = Math.max(0.05, Math.min(0.95, corpusWeight));
    
    return {
      primaryIntent: intent,
      confidence: Math.min(confidence, 0.95),
      corpusWeight,
      userWeight: 1 - corpusWeight,
      signals: {
        queryTermsInCorpus: corpusHits.length,
        queryTermsInMemory: recallHits.length,
        recallIndicators: recallHits.map(p => p.source),
        corpusIndicators: corpusHits.map(p => p.source),
        explicitSignals: [],
        conversationArc: this.detectConversationArc(params.conversationHistory),
      },
    };
  }
  
  private applyAvatarModifier(
    result: ClassificationResult, 
    avatar: UserAvatar
  ): ClassificationResult {
    // Avatar maturity shifts the balance
    const avatarModifiers: Record<UserAvatar, number> = {
      'STRANGER':     0.00,    // No shift (corpus-dominant by default)
      'ACQUAINTANCE': -0.05,   // Slight shift toward user
      'FAMILIAR':     -0.12,   // Moderate shift toward user
      'KNOWN':        -0.20,   // Significant shift toward user
    };
    
    const modifier = avatarModifiers[avatar];
    const adjustedCorpusWeight = Math.max(
      0.05,
      Math.min(0.95, result.corpusWeight + modifier)
    );
    
    return {
      ...result,
      corpusWeight: adjustedCorpusWeight,
      userWeight: 1 - adjustedCorpusWeight,
    };
  }
  
  private detectConversationArc(history: Message[]): string {
    if (history.length === 0) return 'new';
    
    // Analyze the last 5 messages to determine thread type
    const recent = history.slice(-5);
    let corpusSignals = 0;
    let userSignals = 0;
    
    for (const msg of recent) {
      if (msg.role === 'assistant') {
        // Check if previous responses were corpus-heavy or user-heavy
        if (msg.metadata?.corpusWeight > 0.6) corpusSignals++;
        if (msg.metadata?.userWeight > 0.6) userSignals++;
      }
    }
    
    if (corpusSignals > userSignals) return 'corpus_thread';
    if (userSignals > corpusSignals) return 'user_thread';
    return 'mixed';
  }
}
```

### 3.3 Weight Calculator

The weight calculator produces the final corpus/user weights by combining multiple factors:

```typescript
interface WeightCalculation {
  // Inputs
  intentWeight: { corpus: number; user: number; };
  avatarModifier: number;
  conversationArcModifier: number;
  explicitOverride: number | null;
  
  // Output
  final: { corpus: number; user: number; };
}

class EngineWeightCalculator {
  calculate(
    intent: ClassificationResult,
    avatar: UserAvatar,
    conversationState: ConversationState,
    userMemoryDensity: number,        // 0.0-1.0: how much do we know?
  ): WeightCalculation {
    
    // Start with intent-based weights
    let corpusWeight = intent.corpusWeight;
    let userWeight = intent.userWeight;
    
    // Avatar modifier (already applied in classifier, but fine-tune here)
    const avatarShift = this.getAvatarShift(avatar, userMemoryDensity);
    corpusWeight += avatarShift;
    
    // Conversation arc modifier
    // If we've been answering from corpus, maintain that thread
    // If we've been in user-context mode, maintain that
    const arcShift = this.getArcShift(conversationState);
    corpusWeight += arcShift;
    
    // Memory density modifier
    // If user has rich memories, the user engine has more to offer
    const densityShift = this.getDensityShift(userMemoryDensity, intent.primaryIntent);
    corpusWeight += densityShift;
    
    // Normalize
    corpusWeight = Math.max(0.05, Math.min(0.95, corpusWeight));
    userWeight = 1 - corpusWeight;
    
    return {
      intentWeight: { corpus: intent.corpusWeight, user: intent.userWeight },
      avatarModifier: avatarShift,
      conversationArcModifier: arcShift,
      explicitOverride: null,
      final: { corpus: corpusWeight, user: userWeight },
    };
  }
  
  private getAvatarShift(avatar: UserAvatar, memoryDensity: number): number {
    // Only shift toward user if we actually have meaningful memories
    const base: Record<UserAvatar, number> = {
      'STRANGER':     0.00,
      'ACQUAINTANCE': -0.03,
      'FAMILIAR':     -0.08,
      'KNOWN':        -0.15,
    };
    // Scale by actual memory density (don't shift if memories are sparse)
    return base[avatar] * memoryDensity;
  }
  
  private getArcShift(state: ConversationState): number {
    if (!state.hasActiveConversation) return 0;
    
    // Maintain conversation momentum
    switch (state.recentArc) {
      case 'corpus_thread': return 0.05;   // Stay corpus-heavy
      case 'user_thread': return -0.05;    // Stay user-heavy
      case 'mixed': return 0;
      default: return 0;
    }
  }
  
  private getDensityShift(density: number, intent: IntentType): number {
    // For recall-type intents, density matters more
    if (['USER_RECALL', 'STATUS_CHECK', 'ACCOUNT_SPECIFIC'].includes(intent)) {
      return -0.10 * density;  // More user-heavy when we have data and they want it
    }
    return -0.03 * density;  // Small shift for other intents
  }
}
```

### 3.4 Budget Allocator

The budget allocator distributes the total token budget between the two engines based on calculated weights:

```typescript
interface DualBudgetAllocation {
  totalBudget: number;
  
  corpusBudget: {
    total: number;
    layers: {
      C0_identity: number;
      C1_topic: number;
      C2_knowledge: number;
      C3_supporting: number;
      C4_freshness: number;
    };
  };
  
  userBudget: {
    total: number;
    layers: {
      L0_identity: number;
      L1_prefs: number;
      L2_topic: number;
      L3_entity: number;
      L4_conversation: number;
      L5_jit: number;
      L6_history: number;
      L7_message: number;
    };
  };
  
  sharedBudget: {
    systemInstructions: number;        // Orchestrator instructions
    conversationHistory: number;       // Shared between both engines
  };
}

class DualBudgetAllocator {
  allocate(
    totalBudget: number,
    weights: { corpus: number; user: number; },
    userAvatar: UserAvatar,
    hasConversation: boolean,
    conversationTokens: number,
  ): DualBudgetAllocation {
    
    // Reserve fixed costs
    const systemInstructions = 200;     // Orchestrator meta-instructions
    const messageReserve = 100;         // User message (L7)
    const remaining = totalBudget - systemInstructions - messageReserve;
    
    // Conversation history is SHARED — both engines contribute to it
    // but it's managed once to avoid duplication
    const historyBudget = hasConversation
      ? Math.min(
          Math.floor(remaining * 0.25),  // Max 25% of remaining
          Math.min(conversationTokens, 4000)
        )
      : 0;
    
    const afterHistory = remaining - historyBudget;
    
    // Split remaining between corpus and user engines
    const corpusTotal = Math.floor(afterHistory * weights.corpus);
    const userTotal = Math.floor(afterHistory * weights.user);
    
    return {
      totalBudget,
      corpusBudget: {
        total: corpusTotal,
        layers: this.allocateCorpusLayers(corpusTotal, userAvatar),
      },
      userBudget: {
        total: userTotal,
        layers: this.allocateUserLayers(userTotal, userAvatar, hasConversation),
      },
      sharedBudget: {
        systemInstructions,
        conversationHistory: historyBudget,
      },
    };
  }
  
  private allocateCorpusLayers(total: number, avatar: UserAvatar): Record<string, number> {
    // C0 is fixed regardless
    const C0 = Math.min(300, total);
    const remaining = total - C0;
    
    return {
      C0_identity: C0,
      C1_topic: Math.floor(remaining * 0.08),
      C2_knowledge: Math.floor(remaining * 0.55),    // Primary knowledge chunk
      C3_supporting: Math.floor(remaining * 0.25),
      C4_freshness: Math.floor(remaining * 0.12),
    };
  }
  
  private allocateUserLayers(
    total: number, 
    avatar: UserAvatar,
    hasConversation: boolean
  ): Record<string, number> {
    if (avatar === 'STRANGER') {
      // Stranger: minimal user context
      return {
        L0_identity: 0,              // No identity yet
        L1_prefs: 0,                 // No preferences yet
        L2_topic: 0,
        L3_entity: 0,
        L4_conversation: 0,
        L5_jit: Math.floor(total * 0.3),
        L6_history: Math.floor(total * 0.7),
        L7_message: 0,               // Handled in shared
      };
    }
    
    // Acquaintance+: distribute based on what's available
    const allocations: Record<string, number> = {
      L0_identity: Math.floor(total * 0.10),
      L1_prefs: Math.floor(total * 0.08),
      L2_topic: Math.floor(total * 0.12),
      L3_entity: Math.floor(total * 0.10),
      L4_conversation: Math.floor(total * 0.15),
      L5_jit: Math.floor(total * 0.25),
      L6_history: Math.floor(total * 0.20),
      L7_message: 0,
    };
    
    // Scale up for KNOWN users
    if (avatar === 'KNOWN') {
      allocations.L0_identity = Math.floor(total * 0.12);
      allocations.L5_jit = Math.floor(total * 0.30);
      allocations.L4_conversation = Math.floor(total * 0.18);
    }
    
    return allocations;
  }
}
```

### 3.5 Context Merger

The context merger combines outputs from both engines into a single coherent system prompt:

```typescript
interface ContextMerger {
  merge(
    corpusContext: AssembledCorpusContext,
    userContext: AssembledContext,
    weights: { corpus: number; user: number; },
    conversationHistory: CompressedHistory,
    orchestratorInstructions: string,
  ): Promise<MergedContext>;
}

interface MergedContext {
  systemPrompt: string;
  metadata: {
    totalTokens: number;
    corpusTokens: number;
    userTokens: number;
    historyTokens: number;
    
    corpusConfidence: number;
    userMemoriesUsed: number;
    citations: Citation[];
    
    engineWeights: { corpus: number; user: number; };
    avatarUsed: UserAvatar;
    intentDetected: IntentType;
    
    assemblyTimeMs: number;
  };
}

class DualContextMerger implements ContextMerger {
  
  async merge(
    corpusContext: AssembledCorpusContext,
    userContext: AssembledContext,
    weights: { corpus: number; user: number; },
    conversationHistory: CompressedHistory,
    orchestratorInstructions: string,
  ): Promise<MergedContext> {
    
    const sections: string[] = [];
    
    // 1. Orchestrator meta-instructions (always first)
    sections.push(orchestratorInstructions);
    
    // 2. Company identity (C0) — always present
    sections.push(corpusContext.layers.C0.content);
    
    // 3. User identity (L0) — if available
    if (userContext.layers?.L0?.content) {
      sections.push(`## About This User\n${userContext.layers.L0.content}`);
    }
    
    // 4. User preferences (L1) — if available
    if (userContext.layers?.L1?.content) {
      sections.push(`## User Preferences\n${userContext.layers.L1.content}`);
    }
    
    // 5. Corpus topic framework (C1)
    if (corpusContext.layers.C1.content) {
      sections.push(`## Topic Context\n${corpusContext.layers.C1.content}`);
    }
    
    // 6. PRIMARY: Retrieved knowledge (C2) — the main corpus payload
    if (corpusContext.layers.C2.content) {
      sections.push(
        `## Relevant Documentation\n` +
        `Use the following documentation to answer the user's question. ` +
        `Cite sections when possible.\n\n` +
        corpusContext.layers.C2.content
      );
    }
    
    // 7. Supporting corpus context (C3)
    if (corpusContext.layers.C3.content) {
      sections.push(
        `## Additional Reference\n` +
        corpusContext.layers.C3.content
      );
    }
    
    // 8. User context — JIT memories (L5)
    if (userContext.layers?.L5?.content) {
      sections.push(
        `## User History & Context\n` +
        `The following is known about this user from previous interactions:\n\n` +
        userContext.layers.L5.content
      );
    }
    
    // 9. Freshness / changelog (C4)
    if (corpusContext.layers.C4.content) {
      sections.push(
        `## Recent Updates\n` +
        corpusContext.layers.C4.content
      );
    }
    
    // 10. Conversation history (shared)
    if (conversationHistory?.content) {
      sections.push(
        `## Conversation History\n` +
        conversationHistory.content
      );
    }
    
    // 11. Deduplication pass
    const deduped = await this.deduplicateContent(sections);
    
    // 12. Conflict resolution
    // If user memory says "User is on Enterprise plan" but docs mention
    // "Team plan limits", flag the discrepancy
    const conflictNotes = await this.detectCorpusUserConflicts(
      corpusContext, userContext
    );
    if (conflictNotes) {
      deduped.push(`## Note\n${conflictNotes}`);
    }
    
    const systemPrompt = deduped.join('\n\n---\n\n');
    
    return {
      systemPrompt,
      metadata: {
        totalTokens: estimateTokens(systemPrompt),
        corpusTokens: corpusContext.totalTokens,
        userTokens: userContext.budget?.totalUsed || 0,
        historyTokens: conversationHistory?.tokenCount || 0,
        corpusConfidence: corpusContext.confidence,
        userMemoriesUsed: userContext.metadata?.memoriesCount || 0,
        citations: corpusContext.citations,
        engineWeights: weights,
        avatarUsed: userContext.metadata?.avatar || 'STRANGER',
        intentDetected: userContext.metadata?.intent || 'CORPUS_QUERY',
        assemblyTimeMs: Date.now() - startTime,
      },
    };
  }
  
  private async detectCorpusUserConflicts(
    corpus: AssembledCorpusContext,
    user: AssembledContext
  ): string | null {
    // Example: user memory says they're on Plan X, but corpus
    // content references Plan Y features
    // This is a lightweight heuristic check, not a full LLM call
    
    // Check for plan-level conflicts
    const userPlan = this.extractPlanFromUserContext(user);
    const corpusPlan = this.extractPlanFromCorpusContext(corpus);
    
    if (userPlan && corpusPlan && userPlan !== corpusPlan) {
      return `The user is known to be on the ${userPlan} plan. ` +
             `The retrieved documentation may reference ${corpusPlan} plan features. ` +
             `Tailor your response to the user's actual plan.`;
    }
    
    return null;
  }
}
```

### 3.6 Orchestrator Meta-Instructions

The orchestrator generates dynamic meta-instructions based on the current state:

```typescript
function generateOrchestratorInstructions(
  avatar: UserAvatar,
  intent: IntentType,
  confidence: number,
  weights: { corpus: number; user: number; },
  hasUserMemories: boolean,
): string {
  const instructions: string[] = [];
  
  // Base behavior
  instructions.push(
    `You are a company support assistant with access to both product ` +
    `documentation and this specific user's interaction history.`
  );
  
  // Avatar-specific instructions
  switch (avatar) {
    case 'STRANGER':
      instructions.push(
        `This is a new visitor. Be welcoming and helpful. ` +
        `Focus on answering their question from documentation. ` +
        `Don't reference past conversations (there are none).`
      );
      break;
    case 'ACQUAINTANCE':
      instructions.push(
        `This is a returning visitor with some history. ` +
        `You may naturally reference previous interactions if relevant, ` +
        `but don't force it. Prioritize answering their current question.`
      );
      break;
    case 'FAMILIAR':
      instructions.push(
        `This is a regular visitor with substantial history. ` +
        `Leverage what you know about them to personalize responses. ` +
        `Connect their question to their known context when helpful.`
      );
      break;
    case 'KNOWN':
      instructions.push(
        `This is a well-known user with extensive history. ` +
        `Treat them like a valued relationship. Reference past interactions naturally. ` +
        `Proactively connect new information to their known needs and setup. ` +
        `They should feel like they have a personal AI assistant who truly knows them.`
      );
      break;
  }
  
  // Confidence-based instructions
  if (confidence < 0.4) {
    instructions.push(
      `IMPORTANT: The documentation retrieval had low confidence. ` +
      `If you're not sure about the answer, say so clearly and offer ` +
      `to connect the user with human support.`
    );
  }
  
  // Intent-specific instructions
  if (intent === 'SUPPORT_QUERY') {
    instructions.push(
      `The user appears to have a support issue. Be empathetic. ` +
      `Diagnose step by step. If you can't resolve it, offer to create ` +
      `a support ticket.`
    );
  }
  
  if (intent === 'USER_RECALL') {
    instructions.push(
      `The user is referencing a past interaction. Check the user history ` +
      `section carefully. If you find the referenced conversation, summarize ` +
      `what was discussed. If not, be honest that you don't have that record.`
    );
  }
  
  return instructions.join('\n\n');
}
```

### 3.7 Full Orchestration Flow

```typescript
class DualEngineOrchestrator {
  constructor(
    private intentClassifier: IntentClassifier,
    private weightCalculator: EngineWeightCalculator,
    private budgetAllocator: DualBudgetAllocator,
    private corpusAssembler: CorpusContextAssembler,
    private userAssembler: DynamicContextAssembler,
    private contextMerger: DualContextMerger,
    private avatarClassifier: AvatarClassifier,
    private conversationCompressor: ConversationCompressor,
  ) {}

  async orchestrate(params: OrchestrationParams): Promise<MergedContext> {
    const startTime = Date.now();
    
    // 1. Classify user avatar
    const avatar = await this.avatarClassifier.classify(params.virtualUserId);
    
    // 2. Calculate user memory density
    const memoryDensity = await this.calculateMemoryDensity(params.virtualUserId);
    
    // 3. Classify intent
    const intent = await this.intentClassifier.classify({
      message: params.message,
      conversationHistory: params.conversationHistory,
      userAvatar: avatar,
      userMemorySummary: await this.getUserMemorySummary(params.virtualUserId),
      corpusTopics: await this.getCorpusTopics(params.tenantId),
    });
    
    // 4. Calculate weights
    const weights = this.weightCalculator.calculate(
      intent,
      avatar,
      params.conversationState,
      memoryDensity,
    );
    
    // 5. Allocate budget
    const budget = this.budgetAllocator.allocate(
      params.totalBudget || 12000,
      weights.final,
      avatar,
      params.conversationState.hasActiveConversation,
      params.conversationState.totalTokens,
    );
    
    // 6. Generate query embedding (shared by both engines)
    const queryEmbedding = await this.embeddingService.embed(params.message);
    
    // 7. Parallel assembly — both engines run simultaneously
    const [corpusContext, userContext, conversationHistory] = await Promise.all([
      // Corpus engine
      this.corpusAssembler.assemble({
        tenantId: params.tenantId,
        query: params.message,
        queryEmbedding,
        totalBudget: budget.corpusBudget.total,
        userAvatar: avatar,
        userTopics: await this.getUserTopics(params.virtualUserId),
        previousQueries: this.extractPreviousQueries(params.conversationHistory),
      }),
      
      // User engine (using existing VIVIM Context Engine)
      this.userAssembler.assemble({
        userId: params.virtualUserId,
        conversationId: params.conversationId,
        userMessage: params.message,
        settings: {
          maxContextTokens: budget.userBudget.total,
          knowledgeDepth: avatar === 'KNOWN' ? 'deep' : 'standard',
          prioritizeConversationHistory: false,  // History handled separately
        },
      }),
      
      // Conversation history (shared resource)
      this.conversationCompressor.compress(
        params.conversationId,
        budget.sharedBudget.conversationHistory,
      ),
    ]);
    
    // 8. Generate orchestrator instructions
    const orchestratorInstructions = generateOrchestratorInstructions(
      avatar,
      intent.primaryIntent,
      corpusContext.confidence,
      weights.final,
      memoryDensity > 0.1,
    );
    
    // 9. Merge contexts
    const merged = await this.contextMerger.merge(
      corpusContext,
      userContext,
      weights.final,
      conversationHistory,
      orchestratorInstructions,
    );
    
    // 10. Log telemetry
    await this.logTelemetry({
      tenantId: params.tenantId,
      virtualUserId: params.virtualUserId,
      avatar,
      intent: intent.primaryIntent,
      weights: weights.final,
      corpusConfidence: corpusContext.confidence,
      assemblyTimeMs: Date.now() - startTime,
      tokensUsed: merged.metadata.totalTokens,
    });
    
    return merged;
  }
  
  private async calculateMemoryDensity(virtualUserId: string): Promise<number> {
    const stats = await this.memoryService.getStatistics(virtualUserId);
    // Normalize: 0 memories = 0.0, 100+ memories = 1.0
    return Math.min(1.0, stats.totalMemories / 100);
  }
}
```

---

## 4. Intelligent User Memory for Chatbot

### 4.1 Overview

The chatbot's user memory system builds on the existing VIVIM Memory Engine but adds **chatbot-specific intelligence**: the ability to maintain awareness of the full conversation history, understand what was said, and make the user feel like the chatbot is their personal AI.

### 4.2 Conversation Awareness System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                CONVERSATION AWARENESS SYSTEM                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  CONVERSATION INDEX                                  │    │
│  │  All conversations indexed for instant retrieval                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
│  │  │Conv #1   │ │Conv #2   │ │Conv #3   │ │Conv #N   │              │    │
│  │  │Summary   │ │Summary   │ │Summary   │ │Summary   │              │    │
│  │  │Topics    │ │Topics    │ │Topics    │ │Topics    │              │    │
│  │  │Key Facts │ │Key Facts │ │Key Facts │ │Key Facts │              │    │
│  │  │Embedding │ │Embedding │ │Embedding │ │Embedding │              │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  PROGRESSIVE MEMORY                                  │    │
│  │                                                                      │    │
│  │  Real-Time Extraction → Session Summary → Long-Term Memory          │    │
│  │       (per message)       (end of session)    (consolidated)        │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  USER PROFILE EVOLUTION                              │    │
│  │                                                                      │    │
│  │  Session 1: name?, topic interest                                   │    │
│  │  Session 3: plan, role, tech stack                                  │    │
│  │  Session 8: team size, integration setup, preferences               │    │
│  │  Session 15+: full profile, behavior patterns, expertise level      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Conversation Index

Every conversation is indexed with a searchable summary for instant recall:

```typescript
interface ConversationIndex {
  id: string;
  virtualUserId: string;
  conversationId: string;
  
  // Searchable summary
  summary: string;                     // LLM-generated 2-3 sentence summary
  embedding: number[];                 // Vector for semantic search
  
  // Structured metadata
  topics: string[];                    // ["pricing", "api-limits", "slack-integration"]
  keyFacts: KeyFact[];                 // Extracted facts from this conversation
  questionsAsked: string[];            // All user questions (for recall)
  issuesDiscussed: string[];           // Problems/issues mentioned
  decisionsReached: string[];          // Outcomes/decisions
  actionItems: string[];               // Follow-ups mentioned
  
  // Metrics
  messageCount: number;
  duration: number;                    // Session duration in minutes
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  resolutionStatus: 'resolved' | 'pending' | 'escalated' | 'unknown';
  
  // Temporal
  startedAt: DateTime;
  endedAt: DateTime;
  lastReferencedAt: DateTime;          // Last time this convo was recalled
  referenceCount: number;             // How often this convo is recalled
  
  // Links
  relatedConversationIds: string[];    // Linked follow-up conversations
  memoryIds: string[];                 // Memories extracted from this convo
}

interface KeyFact {
  fact: string;                        // "User is on Team plan"
  confidence: number;
  source: 'explicit' | 'inferred';    // User said it vs we inferred it
  messageIndex: number;                // Which message revealed this
}
```

#### Building the Conversation Index

```typescript
class ConversationIndexBuilder {
  
  async indexConversation(
    virtualUserId: string,
    conversationId: string,
    messages: Message[],
  ): Promise<ConversationIndex> {
    
    // 1. Generate structured summary via LLM
    const analysis = await this.llmService.chat({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze this conversation and extract:
            1. A 2-3 sentence summary
            2. Topics discussed (as slug-style tags)
            3. Key facts learned about the user
            4. All questions the user asked
            5. Any issues/problems discussed
            6. Any decisions reached or outcomes
            7. Any follow-up actions mentioned
            8. Overall sentiment (positive/neutral/negative/mixed)
            9. Whether the user's issue was resolved
            
            Format as JSON.`,
        },
        {
          role: 'user',
          content: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        },
      ],
    });
    
    const parsed = JSON.parse(analysis.content);
    
    // 2. Generate embedding from summary
    const embedding = await this.embeddingService.embed(parsed.summary);
    
    // 3. Link to related conversations
    const related = await this.findRelatedConversations(
      virtualUserId, embedding, parsed.topics
    );
    
    // 4. Store index
    const index = await this.prisma.conversationIndex.create({
      data: {
        virtualUserId,
        conversationId,
        summary: parsed.summary,
        embedding,
        topics: parsed.topics,
        keyFacts: parsed.keyFacts,
        questionsAsked: parsed.questionsAsked,
        issuesDiscussed: parsed.issuesDiscussed,
        decisionsReached: parsed.decisionsReached,
        actionItems: parsed.actionItems,
        messageCount: messages.length,
        sentiment: parsed.sentiment,
        resolutionStatus: parsed.resolutionStatus,
        startedAt: messages[0].createdAt,
        endedAt: messages[messages.length - 1].createdAt,
        relatedConversationIds: related.map(r => r.id),
      },
    });
    
    return index;
  }
  
  async findRelatedConversations(
    virtualUserId: string,
    embedding: number[],
    topics: string[],
  ): Promise<ConversationIndex[]> {
    // Semantic search for similar past conversations
    const similar = await this.prisma.$queryRaw`
      SELECT id, summary, topics,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM conversation_indices
      WHERE "virtualUserId" = ${virtualUserId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT 5
    `;
    
    return similar.filter(s => s.similarity > 0.6);
  }
}
```

#### Conversation Recall

When the user references a past conversation, the system can find it:

```typescript
class ConversationRecall {
  
  async recall(
    virtualUserId: string,
    query: string,                    // "that thing about API limits"
  ): Promise<RecallResult> {
    
    const queryEmbedding = await this.embeddingService.embed(query);
    
    // 1. Semantic search across conversation indices
    const semanticResults = await this.prisma.$queryRaw`
      SELECT 
        ci.*,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM conversation_indices ci
      WHERE "virtualUserId" = ${virtualUserId}
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT 5
    `;
    
    // 2. Keyword search in questions and facts
    const keywordResults = await this.prisma.conversationIndex.findMany({
      where: {
        virtualUserId,
        OR: [
          { questionsAsked: { hasSome: this.extractKeywords(query) } },
          { topics: { hasSome: this.extractKeywords(query) } },
          { summary: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });
    
    // 3. Merge and rank
    const merged = this.mergeAndRank(semanticResults, keywordResults);
    
    // 4. For the top match, retrieve the actual conversation messages
    if (merged.length > 0 && merged[0].similarity > 0.5) {
      const fullConversation = await this.prisma.virtualConversation.findUnique({
        where: { id: merged[0].conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      
      return {
        found: true,
        topMatch: merged[0],
        conversationSummary: merged[0].summary,
        keyExchanges: this.extractKeyExchanges(fullConversation.messages),
        relatedConversations: merged.slice(1),
      };
    }
    
    return { found: false, suggestions: merged };
  }
  
  private extractKeyExchanges(messages: Message[]): KeyExchange[] {
    // Extract the most important Q&A pairs from the conversation
    const exchanges: KeyExchange[] = [];
    
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        const importance = this.scoreExchangeImportance(
          messages[i].content, messages[i + 1].content
        );
        if (importance > 0.5) {
          exchanges.push({
            question: messages[i].content,
            answer: messages[i + 1].content,
            importance,
            timestamp: messages[i].createdAt,
          });
        }
      }
    }
    
    return exchanges.sort((a, b) => b.importance - a.importance).slice(0, 5);
  }
}
```

### 4.4 Progressive Memory Extraction

Memory extraction happens at three temporal scales:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  PROGRESSIVE MEMORY EXTRACTION                               │
│                                                                              │
│  TIME SCALE          │ WHAT                │ WHEN                           │
│  ────────────────────┼─────────────────────┼──────────────────────────      │
│  REAL-TIME           │ Important facts     │ After every 3-5 messages       │
│  (micro-extraction)  │ Plan/role mentions  │ Triggered by signal detection  │
│                      │ Preferences stated  │                                │
│                      │ Problems reported   │                                │
│  ────────────────────┼─────────────────────┼──────────────────────────      │
│  SESSION-END         │ Conversation summary│ When conversation ends or      │
│  (session-extraction)│ Topic mapping       │ after 30 min inactivity        │
│                      │ Key decisions       │                                │
│                      │ Unresolved issues   │                                │
│                      │ Action items        │                                │
│  ────────────────────┼─────────────────────┼──────────────────────────      │
│  PERIODIC            │ Memory consolidation│ Daily background job           │
│  (consolidation)     │ Profile evolution   │ After every 5 conversations    │
│                      │ Conflict resolution │                                │
│                      │ Stale memory decay  │                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Real-Time Extraction (Micro)

Fast, lightweight extraction that runs after every few messages:

```typescript
class RealtimeMemoryExtractor {
  private messageBuffer: Message[] = [];
  private extractionThreshold = 3;     // Extract every 3 messages
  
  async onMessage(
    virtualUserId: string,
    message: Message,
    conversationId: string,
  ): Promise<ExtractedMemory[]> {
    this.messageBuffer.push(message);
    
    // Quick signal detection (no LLM call needed)
    const quickExtractions = this.quickSignalExtraction(message);
    
    // Buffer-based extraction (LLM call every N messages)
    let deepExtractions: ExtractedMemory[] = [];
    if (this.messageBuffer.length >= this.extractionThreshold) {
      deepExtractions = await this.deepExtraction(
        virtualUserId, 
        this.messageBuffer,
        conversationId,
      );
      this.messageBuffer = [];
    }
    
    return [...quickExtractions, ...deepExtractions];
  }
  
  private quickSignalExtraction(message: Message): ExtractedMemory[] {
    const extractions: ExtractedMemory[] = [];
    const text = message.content;
    
    // Plan mention detection
    const planMatch = text.match(/\b(free|starter|team|enterprise|pro|business)\s*(plan|tier|subscription)\b/i);
    if (planMatch) {
      extractions.push({
        content: `User appears to be on the ${planMatch[1]} plan`,
        memoryType: 'FACTUAL',
        category: 'account',
        importance: 0.9,
        confidence: 0.7,
        source: 'quick_signal',
      });
    }
    
    // Role detection
    const roleMatch = text.match(/\b(i am|i'm|i work as|my role is)\s+(?:a|an|the)?\s*(\w+(?:\s+\w+)?)\b/i);
    if (roleMatch) {
      extractions.push({
        content: `User's role: ${roleMatch[2]}`,
        memoryType: 'IDENTITY',
        category: 'role',
        importance: 0.85,
        confidence: 0.75,
        source: 'quick_signal',
      });
    }
    
    // Team size detection
    const teamMatch = text.match(/\b(\d+)\s*(team members|people|developers|engineers|users|seats)\b/i);
    if (teamMatch) {
      extractions.push({
        content: `User has a team of ${teamMatch[1]} ${teamMatch[2]}`,
        memoryType: 'FACTUAL',
        category: 'team',
        importance: 0.8,
        confidence: 0.8,
        source: 'quick_signal',
      });
    }
    
    // Preference detection
    const preferencePatterns = [
      { pattern: /\b(i prefer|i like|i want|i need)\b(.{5,80})/i, type: 'PREFERENCE' },
      { pattern: /\b(don't|do not|hate|dislike)\b(.{5,80})/i, type: 'PREFERENCE' },
    ];
    for (const { pattern, type } of preferencePatterns) {
      const match = text.match(pattern);
      if (match) {
        extractions.push({
          content: match[0],
          memoryType: type as any,
          category: 'preference',
          importance: 0.7,
          confidence: 0.8,
          source: 'quick_signal',
        });
      }
    }
    
    return extractions;
  }
  
  private async deepExtraction(
    virtualUserId: string,
    messages: Message[],
    conversationId: string,
  ): Promise<ExtractedMemory[]> {
    // Use LLM for comprehensive extraction
    const existingMemories = await this.memoryService.searchMemories(
      virtualUserId, { limit: 20 }
    );
    
    const response = await this.llmService.chat({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract important memories from the recent messages. 
                    Consider what we already know about the user.
                    
                    Existing knowledge:
                    ${existingMemories.map(m => `- ${m.content}`).join('\n')}
                    
                    Extract NEW information only. Types:
                    FACTUAL (facts about them), PREFERENCE (likes/dislikes),
                    GOAL (what they want to achieve), IDENTITY (role, background),
                    EPISODIC (what happened in this conversation)
                    
                    Return JSON array of { content, memoryType, category, 
                    importance (0-1), confidence (0-1) }
                    
                    Return empty array if nothing new to extract.`,
        },
        {
          role: 'user',
          content: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        },
      ],
    });
    
    return JSON.parse(response.content);
  }
}
```

#### Session-End Extraction

When a conversation session ends, run comprehensive analysis:

```typescript
class SessionEndExtractor {
  
  async onSessionEnd(
    virtualUserId: string,
    conversationId: string,
    messages: Message[],
  ): Promise<void> {
    // 1. Build conversation index
    await this.conversationIndexBuilder.indexConversation(
      virtualUserId, conversationId, messages
    );
    
    // 2. Extract session-level memories
    const sessionMemories = await this.extractSessionMemories(
      virtualUserId, messages
    );
    
    // 3. Store memories
    for (const memory of sessionMemories) {
      await this.memoryService.createMemory(virtualUserId, {
        ...memory,
        sourceConversationIds: [conversationId],
      });
    }
    
    // 4. Update user profile evolution
    await this.profileEvolver.evolve(virtualUserId);
    
    // 5. Check for unresolved issues → create follow-up memory
    const unresolvedIssues = await this.detectUnresolvedIssues(messages);
    for (const issue of unresolvedIssues) {
      await this.memoryService.createMemory(virtualUserId, {
        content: `Unresolved: ${issue.description}`,
        memoryType: 'GOAL',
        category: 'unresolved_issue',
        importance: 0.85,
        tags: ['unresolved', 'follow-up'],
        metadata: { conversationId, issueDetails: issue },
      });
    }
  }
}
```

### 4.5 User Profile Evolution

The system builds an evolving user profile that grows richer over time:

```typescript
interface UserProfileSnapshot {
  virtualUserId: string;
  avatar: UserAvatar;
  version: number;                     // Incremented on each evolution
  
  // Core identity (learned over time)
  identity: {
    displayName: string | null;
    role: string | null;               // "Senior Developer", "Product Manager"
    company: string | null;
    teamSize: number | null;
    plan: string | null;               // "Team", "Enterprise"
    expertise: 'beginner' | 'intermediate' | 'advanced' | null;
  };
  
  // Preferences (accumulated)
  preferences: {
    communicationStyle: 'concise' | 'detailed' | 'conversational' | null;
    technicalLevel: 'high' | 'medium' | 'low' | null;
    responseFormat: 'text' | 'code_heavy' | 'visual' | null;
    timezone: string | null;
    language: string | null;
  };
  
  // Topic expertise map
  topicExpertise: Record<string, {
    level: 'novice' | 'intermediate' | 'advanced';
    questionsAsked: number;
    lastInteraction: DateTime;
  }>;
  
  // Behavioral patterns
  behavior: {
    avgSessionLength: number;          // minutes
    avgMessagesPerSession: number;
    peakActivityHours: number[];       // [9, 10, 14, 15] = morning + afternoon
    returnFrequency: number;           // avg days between visits
    escalationRate: number;            // % of conversations escalated
    satisfactionTrend: 'improving' | 'stable' | 'declining';
  };
  
  // Active concerns
  activeConcerns: {
    unresolvedIssues: string[];
    pendingFeatureRequests: string[];
    openActionItems: string[];
  };
  
  // Evolution history
  evolutionLog: {
    timestamp: DateTime;
    changes: string[];                 // ["Learned user role: Senior Dev", "Updated plan: Enterprise"]
  }[];
  
  // Timestamps
  createdAt: DateTime;
  lastEvolvedAt: DateTime;
}
```

#### Profile Evolver

```typescript
class UserProfileEvolver {
  
  async evolve(virtualUserId: string): Promise<UserProfileSnapshot> {
    // 1. Get current profile
    const current = await this.getProfile(virtualUserId);
    
    // 2. Get all memories
    const memories = await this.memoryService.searchMemories(virtualUserId, {
      limit: 200,
      sortBy: 'importance',
    });
    
    // 3. Get recent conversation indices
    const recentConversations = await this.prisma.conversationIndex.findMany({
      where: { virtualUserId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });
    
    // 4. Use LLM to synthesize profile update
    const synthesis = await this.llmService.chat({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Update the user profile based on accumulated memories and 
                    conversations. Only change fields where you have evidence. 
                    Return the updated profile fields and a changelog.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            currentProfile: current,
            memories: memories.map(m => ({
              content: m.content,
              type: m.memoryType,
              importance: m.importance,
              createdAt: m.createdAt,
            })),
            recentConversations: recentConversations.map(c => ({
              summary: c.summary,
              topics: c.topics,
              keyFacts: c.keyFacts,
              startedAt: c.startedAt,
            })),
          }),
        },
      ],
    });
    
    const updates = JSON.parse(synthesis.content);
    
    // 5. Apply updates
    const evolved = this.applyUpdates(current, updates);
    
    // 6. Reclassify avatar
    evolved.avatar = this.classifyAvatar(evolved, memories.length, recentConversations.length);
    
    // 7. Store
    await this.saveProfile(virtualUserId, evolved);
    
    return evolved;
  }
  
  private classifyAvatar(
    profile: UserProfileSnapshot,
    memoryCount: number,
    conversationCount: number,
  ): UserAvatar {
    if (conversationCount === 0) return 'STRANGER';
    if (conversationCount <= 5 && memoryCount <= 10) return 'ACQUAINTANCE';
    if (conversationCount <= 20 && memoryCount <= 50) return 'FAMILIAR';
    return 'KNOWN';
  }
}
```

### 4.6 Proactive Awareness Features

The system doesn't just passively recall — it proactively monitors for situations where it should speak up:

```typescript
interface ProactiveAwareness {
  // Called before each response to check if there's something proactive to add
  checkProactiveInsights(
    virtualUserId: string,
    currentQuery: string,
    corpusContext: AssembledCorpusContext,
  ): Promise<ProactiveInsight[]>;
}

interface ProactiveInsight {
  type: ProactiveInsightType;
  content: string;
  relevance: number;               // 0.0-1.0
  source: 'memory' | 'corpus_update' | 'pattern';
}

type ProactiveInsightType = 
  | 'DOC_UPDATED'              // Docs changed since user last asked about topic
  | 'FEATURE_RELEASED'         // Feature the user requested is now available
  | 'ISSUE_RESOLVED'           // Known issue they hit has been fixed
  | 'RELATED_QUESTION'         // They asked about X before; Y is related
  | 'UNRESOLVED_FOLLOWUP'      // They had an unresolved issue last time
  | 'PLAN_RECOMMENDATION'      // Based on usage, might benefit from different plan
  ;
```

```typescript
class ProactiveAwarenessEngine {
  
  async checkProactiveInsights(
    virtualUserId: string,
    currentQuery: string,
    corpusContext: AssembledCorpusContext,
  ): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    // 1. Check for unresolved issues from past conversations
    const unresolved = await this.memoryService.searchMemories(virtualUserId, {
      category: 'unresolved_issue',
      isActive: true,
    });
    
    for (const issue of unresolved) {
      // Check if corpus has new info that might resolve it
      const resolution = await this.checkIfResolved(
        issue.content, corpusContext
      );
      if (resolution) {
        insights.push({
          type: 'ISSUE_RESOLVED',
          content: `Your previous issue "${issue.content}" may be resolved: ${resolution}`,
          relevance: 0.9,
          source: 'corpus_update',
        });
      }
    }
    
    // 2. Check for doc updates on topics the user has asked about
    const userTopics = await this.getUserTopics(virtualUserId);
    for (const topic of userTopics) {
      const updates = await this.getDocUpdates(
        topic.slug, 
        topic.lastInteraction
      );
      if (updates.length > 0) {
        insights.push({
          type: 'DOC_UPDATED',
          content: `The ${topic.name} documentation was updated since your last visit: ${updates[0].changelog}`,
          relevance: 0.7,
          source: 'corpus_update',
        });
      }
    }
    
    // 3. Check for feature releases matching past requests
    const featureRequests = await this.memoryService.searchMemories(virtualUserId, {
      tags: ['feature-request'],
      isActive: true,
    });
    
    for (const request of featureRequests) {
      const released = await this.checkIfFeatureReleased(request.content);
      if (released) {
        insights.push({
          type: 'FEATURE_RELEASED',
          content: `The feature you requested ("${request.content}") is now available!`,
          relevance: 0.95,
          source: 'corpus_update',
        });
        
        // Mark the request memory as resolved
        await this.memoryService.updateMemory(virtualUserId, request.id, {
          tags: [...request.tags, 'resolved'],
          metadata: { resolvedAt: new Date(), resolvedBy: released.version },
        });
      }
    }
    
    // 4. Check for pattern-based insights
    // e.g., user keeps hitting the same error → suggest a different approach
    const pattern = await this.detectRepeatedPatterns(virtualUserId, currentQuery);
    if (pattern) {
      insights.push({
        type: 'RELATED_QUESTION',
        content: pattern.suggestion,
        relevance: 0.75,
        source: 'pattern',
      });
    }
    
    // Return top insights sorted by relevance
    return insights
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);  // Max 3 proactive insights per turn
  }
}
```

### 4.7 The "Personal AI" Experience

The culmination of all these systems creates the "personal AI" feeling:

```typescript
// What the user experiences across sessions:

// Session 1 (STRANGER):
// User: "What's your API rate limit?"
// Bot: "Our API rate limits depend on your plan: Free (100/min), 
//       Team (1000/min), Enterprise (10000/min). [Source: API Docs v2.3]"

// Session 3 (ACQUAINTANCE):
// User: "I'm getting rate limited"
// Bot: "Since you mentioned being on the Team plan last time, your limit 
//       is 1000 req/min. Here are some common causes..."
//       [Personalized based on known plan]

// Session 8 (FAMILIAR):
// User: "Hey"
// Bot: "Hi! Welcome back. Last time we troubleshot your Slack webhook 
//       rate limit issue — did that fix work? Also, I noticed the API docs 
//       were updated last week with a new batch endpoint that might help 
//       with the throughput issues you've been having."
//       [Proactive: remembers unresolved issue + doc update notification]

// Session 20 (KNOWN):
// User: "Anything new?"
// Bot: "Yes! Three things relevant to you:
//       1. The bulk CSV import feature you requested on April 15th shipped 
//          in v2.3 — perfect for onboarding those 50 team members.
//       2. We updated the Slack integration to support thread replies 
//          (I know you asked about that).
//       3. Based on your API usage patterns, you might benefit from our 
//          new request batching feature. Want me to walk you through it?"
//       [Fully personalized: tracks feature requests, knows usage patterns,
//        connects corpus updates to user-specific needs]
```

---

## 5. Data Models & Schema Extensions

### 5.1 New Prisma Models

```prisma
// ============================================================
// CORPUS MODELS
// ============================================================

model Tenant {
  id                  String    @id @default(uuid())
  name                String
  slug                String    @unique
  
  // Chatbot configuration
  chatbotConfig       Json      // CompanyIdentityCore config
  brandVoice          Json      // BrandVoiceConfig
  guardrails          String[]  // Things the bot should never say
  
  // Corpus settings
  defaultModel        String    @default("gpt-4o")
  embeddingModel      String    @default("text-embedding-3-small")
  maxContextTokens    Int       @default(12000)
  
  // Relations
  documents           CorpusDocument[]
  topics              CorpusTopic[]
  chunks              CorpusChunk[]
  faqPairs            CorpusFAQ[]
  virtualUsers        VirtualUser[]   // Users belong to a tenant
  
  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([slug])
}

model CorpusDocument {
  id                  String    @id @default(uuid())
  tenantId            String
  tenant              Tenant    @relation(fields: [tenantId], references: [id])
  
  // Content
  title               String
  description         String?
  sourceUrl           String?            // Original doc URL
  rawContent          String             // Original content
  contentHash         String             // SHA-256 for change detection
  format              String             // markdown, html, pdf, api_spec
  
  // Organization
  category            String             // product_docs, api_reference, faq, etc.
  topicId             String?
  topic               CorpusTopic?       @relation(fields: [topicId], references: [id])
  
  // Versioning
  version             String             // "2.3.1"
  isActive            Boolean            @default(true)
  previousVersionId   String?
  
  // Metadata
  authors             String[]
  lastPublishedAt     DateTime
  wordCount           Int
  
  // Relations
  chunks              CorpusChunk[]
  versions            CorpusDocumentVersion[]
  
  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  ingestedAt          DateTime  @default(now())
  
  @@index([tenantId, category])
  @@index([tenantId, topicId])
  @@index([contentHash])
}

model CorpusDocumentVersion {
  id                  String    @id @default(uuid())
  documentId          String
  document            CorpusDocument @relation(fields: [documentId], references: [id])
  
  version             String
  contentHash         String
  changeType          String    // major, minor, patch
  changelog           String    // LLM-generated summary of changes
  changedSections     String[]
  
  addedChunkIds       String[]
  modifiedChunkIds    String[]
  removedChunkIds     String[]
  
  isActive            Boolean   @default(false)
  publishedAt         DateTime
  ingestedAt          DateTime  @default(now())
  
  @@index([documentId, version])
}

model CorpusChunk {
  id                  String    @id @default(uuid())
  tenantId            String
  tenant              Tenant    @relation(fields: [tenantId], references: [id])
  documentId          String
  document            CorpusDocument @relation(fields: [documentId], references: [id])
  
  // Content
  content             String
  summary             String             // 1-line LLM summary
  
  // Hierarchy
  parentChunkId       String?
  parentChunk         CorpusChunk?       @relation("ChunkHierarchy", fields: [parentChunkId], references: [id])
  childChunks         CorpusChunk[]      @relation("ChunkHierarchy")
  chunkIndex          Int                // Position in document
  totalChunks         Int
  
  // Structure
  sectionPath         String[]           // ["API Reference", "Auth", "OAuth"]
  headingLevel        Int                // H1=1, H2=2, etc.
  contentType         String             // prose, code, table, list, mixed
  
  // Embeddings
  embedding           Unsupported("vector(1536)")?
  embeddingModel      String?
  
  // Metadata
  keywords            String[]
  topicSlug           String
  difficulty          String             // beginner, intermediate, advanced
  
  // Generated Q&A
  generatedQuestions  String[]           // Questions this chunk answers
  generatedAnswer     String?            // Standalone answer version
  questionEmbeddings  Json?              // Embeddings for each generated question
  
  // Freshness
  sourceUpdatedAt     DateTime
  freshnessScore      Float    @default(1.0)
  
  // Quality
  qualityScore        Float    @default(0.5)
  
  // Analytics
  retrievalCount      Int      @default(0)
  avgRelevanceScore   Float    @default(0.0)
  lastRetrievedAt     DateTime?
  
  // Status
  isActive            Boolean  @default(true)
  
  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // FAQ relations
  faqPairs            CorpusFAQ[]
  
  @@index([tenantId, topicSlug])
  @@index([tenantId, contentType])
  @@index([documentId, chunkIndex])
  @@index([tenantId, embedding])
  @@index([isActive])
}

model CorpusTopic {
  id                  String    @id @default(uuid())
  tenantId            String
  tenant              Tenant    @relation(fields: [tenantId], references: [id])
  
  slug                String
  name                String
  description         String?
  
  // Hierarchy
  parentTopicId       String?
  parentTopic         CorpusTopic?  @relation("TopicHierarchy", fields: [parentTopicId], references: [id])
  childTopics         CorpusTopic[] @relation("TopicHierarchy")
  path                String[]
  depth               Int
  
  // Content stats
  documentCount       Int       @default(0)
  chunkCount          Int       @default(0)
  totalTokens         Int       @default(0)
  
  // Embeddings
  embedding           Unsupported("vector(1536)")?
  representativeQuestions String[]
  
  // Analytics
  queryCount          Int       @default(0)
  avgConfidence       Float     @default(0.0)
  popularity          Float     @default(0.0)
  
  // Freshness
  lastUpdatedAt       DateTime  @default(now())
  
  // Status
  isActive            Boolean   @default(true)
  
  // Relations
  documents           CorpusDocument[]
  
  @@unique([tenantId, slug])
  @@index([tenantId, parentTopicId])
  @@index([tenantId, embedding])
}

model CorpusFAQ {
  id                  String    @id @default(uuid())
  tenantId            String
  
  question            String
  answer              String
  
  // Source
  sourceChunkId       String?
  sourceChunk         CorpusChunk? @relation(fields: [sourceChunkId], references: [id])
  isManual            Boolean   @default(false)  // Manually curated vs auto-generated
  
  // Embeddings
  questionEmbedding   Unsupported("vector(1536)")?
  
  // Metadata
  topicSlug           String
  category            String
  confidence          Float     @default(0.8)
  
  // Analytics
  matchCount          Int       @default(0)
  helpfulCount        Int       @default(0)
  unhelpfulCount      Int       @default(0)
  
  // Status
  isActive            Boolean   @default(true)
  
  @@index([tenantId, topicSlug])
  @@index([tenantId, questionEmbedding])
}


// ============================================================
// CONVERSATION INDEX (for user awareness)
// ============================================================

model ConversationIndex {
  id                  String    @id @default(uuid())
  virtualUserId       String
  virtualUser         VirtualUser @relation(fields: [virtualUserId], references: [id])
  conversationId      String    @unique
  
  // Searchable summary
  summary             String
  embedding           Unsupported("vector(1536)")?
  
  // Structured metadata
  topics              String[]
  keyFacts            Json                // KeyFact[]
  questionsAsked      String[]
  issuesDiscussed     String[]
  decisionsReached    String[]
  actionItems         String[]
  
  // Metrics
  messageCount        Int
  duration            Int                 // minutes
  sentiment           String              // positive, neutral, negative, mixed
  resolutionStatus    String              // resolved, pending, escalated, unknown
  
  // Temporal
  startedAt           DateTime
  endedAt             DateTime?
  lastReferencedAt    DateTime?
  referenceCount      Int       @default(0)
  
  // Links
  relatedConversationIds String[]
  memoryIds           String[]
  
  @@index([virtualUserId, startedAt])
  @@index([virtualUserId, embedding])
  @@index([virtualUserId, topics])
}


// ============================================================
// USER PROFILE SNAPSHOT
// ============================================================

model UserProfileSnapshot {
  id                  String    @id @default(uuid())
  virtualUserId       String
  virtualUser         VirtualUser @relation(fields: [virtualUserId], references: [id])
  
  avatar              String              // STRANGER, ACQUAINTANCE, FAMILIAR, KNOWN
  version             Int       @default(1)
  
  // Core identity
  identity            Json                // { displayName, role, company, teamSize, plan, expertise }
  
  // Preferences
  preferences         Json                // { communicationStyle, technicalLevel, ... }
  
  // Topic expertise map
  topicExpertise      Json                // Record<string, { level, questionsAsked, lastInteraction }>
  
  // Behavioral patterns
  behavior            Json                // { avgSessionLength, returnFrequency, ... }
  
  // Active concerns
  activeConcerns      Json                // { unresolvedIssues, featureRequests, actionItems }
  
  // Evolution history
  evolutionLog        Json                // Array of { timestamp, changes }
  
  // Timestamps
  createdAt           DateTime  @default(now())
  lastEvolvedAt       DateTime  @default(now())
  
  @@index([virtualUserId])
  @@unique([virtualUserId, version])
}


// ============================================================
// UPDATED VIRTUAL USER (add tenant reference)
// ============================================================

// Extend existing VirtualUser model:
// Add: tenantId String
// Add: tenant   Tenant @relation(...)
// Add: conversationIndices ConversationIndex[]
// Add: profileSnapshots    UserProfileSnapshot[]
```

### 5.2 Updated VirtualUser Extensions

```prisma
model VirtualUser {
  // ... existing fields ...
  
  // NEW: Tenant association
  tenantId              String?
  tenant                Tenant?   @relation(fields: [tenantId], references: [id])
  
  // NEW: Profile evolution
  currentAvatar         String    @default("STRANGER")  // STRANGER, ACQUAINTANCE, FAMILIAR, KNOWN
  profileVersion        Int       @default(0)
  
  // NEW: Relations
  conversationIndices   ConversationIndex[]
  profileSnapshots      UserProfileSnapshot[]
  
  // ... existing relations ...
}
```

### 5.3 Orchestration Telemetry

```prisma
model OrchestrationLog {
  id                  String    @id @default(uuid())
  tenantId            String
  virtualUserId       String
  conversationId      String
  
  // Classification
  intent              String
  intentConfidence    Float
  avatar              String
  
  // Weights
  corpusWeight        Float
  userWeight          Float
  
  // Performance
  assemblyTimeMs      Int
  totalTokens         Int
  corpusTokens        Int
  userTokens          Int
  historyTokens       Int
  
  // Quality
  corpusConfidence    Float
  chunksRetrieved     Int
  memoriesUsed        Int
  proactiveInsights   Int
  
  // Outcome (filled after response)
  userSatisfaction    String?           // thumbs_up, thumbs_down, null
  followUpRequired    Boolean @default(false)
  escalated           Boolean @default(false)
  
  createdAt           DateTime @default(now())
  
  @@index([tenantId, createdAt])
  @@index([virtualUserId])
  @@index([intent])
}
```

---

## 6. API Extensions

### 6.1 Chatbot-Specific Endpoints

```
# Corpus Management (Admin)
POST   /api/v1/corpus/documents/ingest         # Ingest new document
PUT    /api/v1/corpus/documents/:id/reingest    # Re-ingest updated document
DELETE /api/v1/corpus/documents/:id             # Remove document
GET    /api/v1/corpus/documents                 # List all documents
GET    /api/v1/corpus/topics                    # List topic taxonomy
GET    /api/v1/corpus/analytics                 # Corpus analytics

# Corpus Search (Internal)
POST   /api/v1/corpus/search                   # Search corpus chunks
POST   /api/v1/corpus/faq/match                # Match FAQ pairs

# Chatbot Chat (Public)
POST   /api/v1/chatbot/:tenantSlug/identify    # Identify virtual user
POST   /api/v1/chatbot/:tenantSlug/chat        # Chat with dual engine
GET    /api/v1/chatbot/:tenantSlug/history      # Get conversation history
POST   /api/v1/chatbot/:tenantSlug/feedback     # Submit feedback

# Tenant Management (Admin)
POST   /api/v1/tenants                         # Create tenant
PUT    /api/v1/tenants/:id/config              # Update chatbot config
GET    /api/v1/tenants/:id/analytics            # Tenant analytics
```

### 6.2 Primary Chat Endpoint

```typescript
// POST /api/v1/chatbot/:tenantSlug/chat
app.post('/api/v1/chatbot/:tenantSlug/chat',
  virtualUserAutoAuth,
  rateLimiter({ maxRequests: 30, windowMs: 60000 }),
  async (req, res) => {
    const { tenantSlug } = req.params;
    const { virtualUserId } = req.virtualUser;
    const { message, conversationId } = req.body;
    
    // 1. Get tenant config
    const tenant = await tenantService.getBySlug(tenantSlug);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    
    // 2. Get or create conversation
    const conversation = conversationId
      ? await conversationService.get(conversationId)
      : await conversationService.create(virtualUserId, tenant.id);
    
    // 3. Add user message
    await conversationService.addMessage(conversation.id, {
      role: 'user',
      content: message,
    });
    
    // 4. Run dual-engine orchestration
    const merged = await dualEngineOrchestrator.orchestrate({
      tenantId: tenant.id,
      virtualUserId,
      conversationId: conversation.id,
      message,
      conversationHistory: conversation.messages,
      conversationState: {
        hasActiveConversation: true,
        totalTokens: conversation.totalTokens,
        messageCount: conversation.messages.length,
        recentArc: conversation.metadata?.recentArc,
      },
      totalBudget: tenant.maxContextTokens,
    });
    
    // 5. Check proactive insights
    const insights = await proactiveAwareness.checkProactiveInsights(
      virtualUserId,
      message,
      merged.corpusContext,
    );
    
    // 6. Inject proactive insights into prompt
    let systemPrompt = merged.systemPrompt;
    if (insights.length > 0) {
      const insightBlock = insights
        .map(i => `- [${i.type}]: ${i.content}`)
        .join('\n');
      systemPrompt += `\n\n## Proactive Updates for This User\n` +
                      `Share these naturally if relevant:\n${insightBlock}`;
    }
    
    // 7. Call LLM
    const llmResponse = await llmService.chat({
      model: tenant.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation.messages.slice(-20).map(m => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
    });
    
    // 8. Store assistant response
    await conversationService.addMessage(conversation.id, {
      role: 'assistant',
      content: llmResponse.content,
      metadata: {
        corpusWeight: merged.metadata.engineWeights.corpus,
        userWeight: merged.metadata.engineWeights.user,
        corpusConfidence: merged.metadata.corpusConfidence,
        citations: merged.metadata.citations,
      },
    });
    
    // 9. Real-time memory extraction (async, non-blocking)
    realtimeExtractor.onMessage(virtualUserId, {
      role: 'user', content: message
    }, conversation.id).catch(console.error);
    
    realtimeExtractor.onMessage(virtualUserId, {
      role: 'assistant', content: llmResponse.content
    }, conversation.id).catch(console.error);
    
    // 10. Log telemetry
    await telemetryService.logOrchestration({
      tenantId: tenant.id,
      virtualUserId,
      conversationId: conversation.id,
      intent: merged.metadata.intentDetected,
      avatar: merged.metadata.avatarUsed,
      corpusWeight: merged.metadata.engineWeights.corpus,
      userWeight: merged.metadata.engineWeights.user,
      assemblyTimeMs: merged.metadata.assemblyTimeMs,
      totalTokens: merged.metadata.totalTokens,
      corpusConfidence: merged.metadata.corpusConfidence,
    });
    
    // 11. Return response
    res.json({
      response: {
        role: 'assistant',
        content: llmResponse.content,
        usage: llmResponse.usage,
      },
      context: {
        avatar: merged.metadata.avatarUsed,
        corpusConfidence: merged.metadata.corpusConfidence,
        citations: merged.metadata.citations,
        engineWeights: merged.metadata.engineWeights,
        proactiveInsights: insights.length,
      },
      conversationId: conversation.id,
    });
  }
);
```

### 6.3 Document Ingestion Endpoint

```typescript
// POST /api/v1/corpus/documents/ingest
app.post('/api/v1/corpus/documents/ingest',
  requireTenantAdmin,
  async (req, res) => {
    const { tenantId } = req.tenant;
    const { 
      title, 
      content, 
      format, 
      category, 
      topicSlug, 
      sourceUrl, 
      version, 
      authors 
    } = req.body;
    
    // 1. Check for existing document (update vs create)
    const existing = await corpusService.findBySourceUrl(tenantId, sourceUrl);
    
    if (existing) {
      // Check if content actually changed
      const newHash = hashString(content);
      if (newHash === existing.contentHash) {
        return res.json({ 
          status: 'unchanged', 
          documentId: existing.id 
        });
      }
      
      // Re-ingest (update)
      const result = await corpusIngestionPipeline.reingest(
        existing.id, 
        { content, version }
      );
      
      return res.json({
        status: 'updated',
        documentId: existing.id,
        changes: result.changelog,
        chunksAdded: result.addedChunks,
        chunksModified: result.modifiedChunks,
        chunksRemoved: result.removedChunks,
      });
    }
    
    // 2. New document ingestion
    const result = await corpusIngestionPipeline.ingest({
      tenantId,
      title,
      content,
      format,
      category,
      topicSlug,
      sourceUrl,
      version: version || '1.0.0',
      authors: authors || [],
    });
    
    res.json({
      status: 'created',
      documentId: result.documentId,
      chunksCreated: result.chunks.length,
      faqsGenerated: result.faqPairs.length,
      topicsUpdated: result.topicsUpdated,
    });
  }
);
```

---

## 7. Implementation Roadmap

### Phase 1: Corpus Engine Foundation (Weeks 1-3)

```
Week 1: Data Models + Ingestion
├── Create Prisma schema (Tenant, CorpusDocument, CorpusChunk, CorpusTopic, CorpusFAQ)
├── Build document parser (Markdown, HTML)
├── Build semantic chunker (section-aware)
├── Build enricher (embeddings, keywords, Q&A generation)
└── Build indexer (PostgreSQL + pgvector storage)

Week 2: Retrieval Engine
├── Multi-path retrieval (semantic + keyword + Q&A matching)
├── Scoring formula implementation
├── Re-ranking with diversity filter
├── Parent expansion logic
├── Confidence assessment
└── Corpus caching layer

Week 3: Corpus Context Assembly
├── 5-layer system (C0-C4)
├── Company identity core configuration
├── Topic framework builder
├── Budget allocation for corpus layers
├── Citation generation
└── Integration tests
```

### Phase 2: Dual-Engine Orchestrator (Weeks 4-5)

```
Week 4: Orchestrator Core
├── Intent classifier (rule-based + LLM fallback)
├── Weight calculator
├── Budget allocator (dual-engine split)
├── Context merger
├── Orchestrator meta-instructions generator
└── Avatar classifier

Week 5: Integration + Optimization
├── Parallel assembly pipeline (corpus + user engines simultaneous)
├── Shared conversation history management
├── Conflict detection (corpus vs user memory)
├── Telemetry logging
├── Performance optimization (target: < 800ms assembly)
└── End-to-end integration tests
```

### Phase 3: Intelligent User Memory (Weeks 6-7)

```
Week 6: Conversation Awareness
├── ConversationIndex model + builder
├── Session-end indexing pipeline
├── Conversation recall (semantic search across indices)
├── Real-time micro-extraction engine
├── Session-end extraction engine
└── Progressive memory pipeline

Week 7: Personal AI Features
├── User profile evolution engine
├── Proactive awareness engine
│   ├── Doc update detection
│   ├── Feature release matching
│   ├── Unresolved issue tracking
│   └── Pattern detection
├── Avatar-based behavior customization
└── Integration with chat endpoint
```

### Phase 4: Polish + Multi-Tenant (Week 8)

```
Week 8: Production Readiness
├── Multi-tenant isolation (data partitioning, cache namespacing)
├── Tenant admin dashboard (document management, analytics)
├── Corpus analytics (gap analysis, query patterns, confidence tracking)
├── Rate limiting + abuse prevention
├── Consent flow adaptation for chatbot widget
├── Documentation + SDK updates
└── Load testing (target: 100 concurrent users per tenant)
```

---

## Summary: Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPANY CHATBOT WIDGET                                  │
│                      (Website Embed)                                         │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VIRTUAL USER IDENTIFICATION                               │
│                    (Fingerprint + Session)                                    │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                    DUAL-ENGINE ORCHESTRATOR                                   │
│                                                                              │
│    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│    │   INTENT      │     │   WEIGHT      │     │   BUDGET      │              │
│    │   CLASSIFIER  │────▶│   CALCULATOR  │────▶│   ALLOCATOR   │              │
│    └──────────────┘     └──────────────┘     └──────┬───────┘              │
│                                                      │                       │
│                              ┌───────────────────────┼──────────────┐       │
│                              │                       │              │       │
│                              ▼                       ▼              │       │
│    ┌─────────────────────────────┐  ┌──────────────────────────┐   │       │
│    │    USER CONTEXT ENGINE      │  │   CORPUS CONTEXT ENGINE   │   │       │
│    │    (Existing VIVIM L0-L7)   │  │   (New C0-C4)             │   │       │
│    │                             │  │                            │   │       │
│    │  ┌─────────────────────┐   │  │  ┌──────────────────────┐ │   │       │
│    │  │ Memory Engine       │   │  │  │ Retrieval Engine      │ │   │       │
│    │  │ (9 memory types)    │   │  │  │ (semantic+keyword+QA) │ │   │       │
│    │  └─────────────────────┘   │  │  └──────────────────────┘ │   │       │
│    │  ┌─────────────────────┐   │  │  ┌──────────────────────┐ │   │       │
│    │  │ Profile Evolution   │   │  │  │ Corpus Store          │ │   │       │
│    │  │ (avatar tracking)   │   │  │  │ (docs, chunks, FAQs) │ │   │       │
│    │  └─────────────────────┘   │  │  └──────────────────────┘ │   │       │
│    │  ┌─────────────────────┐   │  │  ┌──────────────────────┐ │   │       │
│    │  │ Conversation Index  │   │  │  │ Topic Taxonomy        │ │   │       │
│    │  │ (full history aware)│   │  │  │ (navigation + scope)  │ │   │       │
│    │  └─────────────────────┘   │  │  └──────────────────────┘ │   │       │
│    │  ┌─────────────────────┐   │  │  ┌──────────────────────┐ │   │       │
│    │  │ Proactive Awareness │   │  │  │ Version Tracking      │ │   │       │
│    │  │ (insights engine)   │   │  │  │ (change detection)    │ │   │       │
│    │  └─────────────────────┘   │  │  └──────────────────────┘ │   │       │
│    └─────────────┬───────────────┘  └──────────────┬───────────┘   │       │
│                  │                                  │               │       │
│                  └──────────────┬───────────────────┘               │       │
│                                │                                    │       │
│                                ▼                                    │       │
│                  ┌──────────────────────────┐                      │       │
│                  │     CONTEXT MERGER       │◀─────────────────────┘       │
│                  │  (dedup + conflict       │   Shared Conv History        │
│                  │   resolve + assemble)    │                              │
│                  └──────────┬───────────────┘                              │
│                             │                                               │
│                             ▼                                               │
│                  ┌──────────────────────────┐                              │
│                  │   MERGED SYSTEM PROMPT   │                              │
│                  └──────────────────────────┘                              │
│                                                                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │      LLM INFERENCE       │
                    │  (OpenAI, Anthropic, etc) │
                    └──────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │   RESPONSE + MEMORY      │
                    │   EXTRACTION (async)      │
                    │   + CONVERSATION INDEX    │
                    └──────────────────────────┘
```

This architecture delivers the complete vision: a company chatbot that answers authoritatively from documentation while building deep, persistent relationships with every visitor — making each returning user feel like they have their own personal AI assistant that knows their history, their needs, and proactively works on their behalf.

# VIVIM Corpus-Chatbot Implementation Plan

**Document Purpose:** Detailed 8-week implementation roadmap for integrating the dual-engine corpus chatbot system with the existing VIVIM memory and context infrastructure.

**Created:** March 27, 2026  
**Timeline:** 8 Weeks  
**Status:** Ready for Execution

---

## Executive Summary

This implementation plan delivers a **company chatbot system** that:

1. **Answers from company documentation** (Corpus Context Engine - C0-C4)
2. **Remembers every visitor** without login (Virtual User Identification)
3. **Blends both intelligently** (Dual-Engine Orchestrator)
4. **Makes users feel recognized** (Intelligent User Memory with conversation awareness)

**Total Effort:** ~320 engineering hours (8 weeks × 40 hours × 1 engineer, or 4 weeks with 2 engineers)

---

## Implementation Phases Overview

```
Week 1-2:  Corpus Engine Foundation     [████████] 25%
Week 3-4:  Dual-Engine Orchestrator     [████████] 25%
Week 5-6:  Intelligent User Memory      [████████] 25%
Week 7-8:  Polish + Multi-Tenant        [████████] 25%
                                    ████████████████ 100%
```

---

## Week 1: Corpus Data Models + Ingestion Pipeline

### Goals
- [ ] Create all corpus Prisma models
- [ ] Build document parser (Markdown, HTML)
- [ ] Implement semantic chunker
- [ ] Set up embedding generation
- [ ] Create basic ingestion API

### Day 1-2: Schema Setup

**Tasks:**

1. **Create corpus schema file**
   - File: `prisma/corpus-schema.prisma`
   - Models: `Tenant`, `CorpusDocument`, `CorpusDocumentVersion`, `CorpusChunk`, `CorpusTopic`, `CorpusFAQ`
   - Enums: `UserAvatar`, `TopicScope`, `ChunkContentType`, `DocumentChangeType`, `OrchestrationIntent`, `ConversationSentiment`, `ResolutionStatus`

2. **Run migration**
   ```bash
   npx prisma migrate dev --name add_corpus_core_models
   npx prisma generate
   ```

3. **Create TypeScript types**
   - File: `src/types/corpus.ts`
   - Export all enum types and interfaces

**Deliverables:**
- ✅ Database tables created
- ✅ Prisma Client generated
- ✅ TypeScript types available

### Day 3-4: Document Parser

**Tasks:**

1. **Create parser interface**
   ```typescript
   // src/services/corpus/parsers/types.ts
   interface DocumentParser {
     parse(content: string, format: string): Promise<ParsedDocument>;
   }

   interface ParsedDocument {
     title: string;
     sections: Section[];
     codeBlocks: CodeBlock[];
     tables: Table[];
     metadata: DocumentMetadata;
   }
   ```

2. **Implement Markdown parser**
   ```typescript
   // src/services/corpus/parsers/markdown-parser.ts
   class MarkdownParser implements DocumentParser {
     async parse(content: string): Promise<ParsedDocument> {
       // Use remark/rehype for parsing
       // Extract H1-H6 hierarchy
       // Isolate code blocks (preserve formatting)
       // Extract tables
       // Generate metadata (word count, estimated reading time)
     }
   }
   ```

3. **Implement HTML parser**
   ```typescript
   // src/services/corpus/parsers/html-parser.ts
   class HtmlParser implements DocumentParser {
     async parse(content: string): Promise<ParsedDocument> {
       // Use cheerio for HTML parsing
       // Sanitize HTML (remove scripts, styles)
       // Extract heading hierarchy
       // Preserve code blocks (<pre><code>)
       // Extract tables
     }
   }
   ```

4. **Create parser factory**
   ```typescript
   // src/services/corpus/parsers/parser-factory.ts
   function getParser(format: string): DocumentParser {
     switch (format.toLowerCase()) {
       case 'markdown':
       case 'md':
         return new MarkdownParser();
       case 'html':
         return new HtmlParser();
       default:
         throw new Error(`Unsupported format: ${format}`);
     }
   }
   ```

**Deliverables:**
- ✅ Markdown parser working
- ✅ HTML parser working
- ✅ Parser factory implemented
- ✅ Unit tests for parsers

### Day 5: Semantic Chunker

**Tasks:**

1. **Implement section-aware chunker**
   ```typescript
   // src/services/corpus/chunker/semantic-chunker.ts
   interface ChunkingConfig {
     targetChunkSize: number;       // 400 tokens
     maxChunkSize: number;          // 600 tokens
     overlapSize: number;           // 75 tokens
     respectHeadings: boolean;      // true
     preserveCodeBlocks: boolean;   // true
     preserveTables: boolean;       // true
   }

   class SemanticChunker {
     chunk(document: ParsedDocument, config: ChunkingConfig): ChunkResult {
       // Respect section boundaries (never split across H1/H2)
       // Keep code blocks intact
       // Keep tables intact
       // Generate parent chunks (section summaries)
       // Create chunk hierarchy
     }
   }
   ```

2. **Implement token estimation**
   ```typescript
   // Use existing VIVIM token estimator
   import { TiktokenEstimator } from '../context/utils/token-estimator';

   const tokenEstimator = new TiktokenEstimator();
   const tokens = tokenEstimator.estimateTokens(chunkContent);
   ```

**Deliverables:**
- ✅ Semantic chunker implemented
- ✅ Chunk hierarchy generated
- ✅ Unit tests with sample documents

### Day 6-7: Enricher + Indexer

**Tasks:**

1. **Create embedding service**
   ```typescript
   // src/services/corpus/embedding-service.ts
   class CorpusEmbeddingService {
     async embed(text: string): Promise<number[]> {
       // Use OpenAI text-embedding-3-small
       // Return 1536-dimensional vector
     }

     async embedBatch(texts: string[]): Promise<number[][]> {
       // Batch embedding for efficiency
     }
   }
   ```

2. **Implement Q&A pair generation**
   ```typescript
   // src/services/corpus/qa-generator.ts
   class QAGenerator {
     async generateQAPairs(chunk: CorpusChunk): Promise<QAPair[]> {
       // Use LLM to generate 3-5 questions per chunk
       // Generate standalone answers
       // Create question embeddings for better matching
     }
   }
   ```

3. **Create indexer**
   ```typescript
   // src/services/corpus/indexer.ts
   class CorpusIndexer {
     async indexDocument(document: CorpusDocument, chunks: ChunkResult): Promise<void> {
       // Store chunks in PostgreSQL
       // Store embeddings in pgvector
       // Update topic statistics
       // Generate and store FAQ pairs
       // Invalidate caches
     }
   }
   ```

**Deliverables:**
- ✅ Embedding service working
- ✅ Q&A generation working
- ✅ Full ingestion pipeline tested end-to-end

---

## Week 2: Corpus Retrieval Engine + Caching

### Goals
- [ ] Implement multi-path retrieval
- [ ] Build scoring formula
- [ ] Create re-ranking with diversity
- [ ] Implement parent expansion
- [ ] Add confidence assessment
- [ ] Set up corpus caching layers

### Day 1-2: Multi-Path Retrieval

**Tasks:**

1. **Implement semantic search**
   ```typescript
   // src/services/corpus/retrieval/semantic-search.ts
   class SemanticSearch {
     async search(
       tenantId: string,
       queryEmbedding: number[],
       options: SearchOptions
     ): Promise<ScoredCorpusChunk[]> {
       const results = await prisma.$queryRaw`
         SELECT
           c.*,
           1 - (embedding <=> ${queryEmbedding}::vector) as similarity
         FROM corpus_chunks c
         WHERE c."tenantId" = ${tenantId}
           AND c."isActive" = true
           AND c."embedding" IS NOT NULL
         ORDER BY embedding <=> ${queryEmbedding}::vector
         LIMIT ${options.maxResults}
       `;
       return results;
     }
   }
   ```

2. **Implement keyword search (BM25)**
   ```typescript
   // src/services/corpus/retrieval/keyword-search.ts
   class KeywordSearch {
     async search(
       tenantId: string,
       query: string,
       options: SearchOptions
     ): Promise<ScoredCorpusChunk[]> {
       // Use PostgreSQL full-text search
       // Implement BM25 scoring
       const results = await prisma.$queryRaw`
         SELECT
           c.*,
           ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query})) as rank
         FROM corpus_chunks c
         WHERE c."tenantId" = ${tenantId}
           AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${query})
         ORDER BY rank DESC
         LIMIT ${options.maxResults}
       `;
       return results;
     }
   }
   ```

3. **Implement Q&A matching**
   ```typescript
   // src/services/corpus/retrieval/qa-matching.ts
   class QAMatching {
     async match(
       tenantId: string,
       query: string,
       queryEmbedding: number[]
     ): Promise<ScoredCorpusChunk[]> {
       // Search FAQ pairs by question embedding
       // Match user question to generated questions
       // Return chunks that answer matched FAQs
     }
   }
   ```

**Deliverables:**
- ✅ Semantic search working
- ✅ Keyword search working
- ✅ Q&A matching working

### Day 3: Scoring Formula

**Tasks:**

1. **Implement multi-path scorer**
   ```typescript
   // src/services/corpus/retrieval/scorer.ts
   class CorpusScorer {
     score(chunk: CorpusChunk, scores: RawScores, params: ScoringParams): number {
       const weights = {
         semantic: 0.35,
         keyword: 0.15,
         qaMatch: 0.25,
         freshness: 0.10,
         topicAlign: 0.08,
         quality: 0.07,
       };

       // Adjust for freshness bias
       if (params.freshnessBias > 0.5) {
         weights.freshness += 0.05;
         weights.semantic -= 0.05;
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
   }
   ```

**Deliverables:**
- ✅ Scoring formula implemented
- ✅ Configurable weights
- ✅ Unit tests for scoring

### Day 4: Re-ranking + Diversity

**Tasks:**

1. **Implement cross-encoder re-ranking** (optional, can use LLM)
   ```typescript
   // src/services/corpus/retrieval/reranker.ts
   class CorpusReranker {
     async rerank(
       query: string,
       chunks: ScoredCorpusChunk[],
       options: { topK: number }
     ): Promise<ScoredCorpusChunk[]> {
       // Use cross-encoder model or LLM for re-ranking
       // Or use simple diversity filter as fallback

       // Diversity filter: avoid redundant chunks
       const diverse = this.applyDiversityFilter(chunks);

       return diverse.slice(0, options.topK);
     }

     private applyDiversityFilter(chunks: ScoredCorpusChunk[]): ScoredCorpusChunk[] {
       // Ensure chunks come from different sections/documents
       // Avoid returning 5 chunks from the same document
     }
   }
   ```

**Deliverables:**
- ✅ Re-ranking implemented
- ✅ Diversity filter working

### Day 5: Parent Expansion + Confidence

**Tasks:**

1. **Implement parent expansion**
   ```typescript
   // src/services/corpus/retrieval/parent-expansion.ts
   class ParentExpander {
     async expand(chunk: ScoredCorpusChunk, tokenBudget: number): Promise<ScoredCorpusChunk> {
       const needsExpansion = (
         chunk.chunk.content.split(/\s+/).length < 150 ||
         chunk.chunk.contentType === 'code' ||
         chunk.chunk.content.includes('see above')
       );

       if (needsExpansion && chunk.chunk.parentChunkId) {
         const parent = await this.getChunkById(chunk.chunk.parentChunkId);
         if (parent) {
           return {
             ...chunk,
             parentContext: parent.summary,
           };
         }
       }

       return chunk;
     }
   }
   ```

2. **Implement confidence assessment**
   ```typescript
   // src/services/corpus/retrieval/confidence-assessment.ts
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

     if (topScore >= 0.85) {
       return { level: 'HIGH', score: topScore, action: 'ANSWER_DIRECTLY' };
     }
     if (topScore >= 0.60) {
       return { level: 'MEDIUM', score: topScore, action: 'ANSWER_WITH_CAVEAT' };
     }
     if (topScore >= 0.40) {
       return { level: 'LOW', score: topScore, action: 'SUGGEST_ALTERNATIVES' };
     }

     return { level: 'VERY_LOW', score: topScore, action: 'ESCALATE_TO_HUMAN' };
   }
   ```

**Deliverables:**
- ✅ Parent expansion working
- ✅ Confidence assessment implemented

### Day 6-7: Corpus Caching

**Tasks:**

1. **Implement L1 hot cache (in-memory)**
   ```typescript
   // src/services/corpus/cache/hot-cache.ts
   class CorpusHotCache {
     private cache = new Map<string, any>();
     private ttl = 15 * 60 * 1000; // 15 minutes

     set(key: string, value: any): void {
       this.cache.set(key, { value, expiresAt: Date.now() + this.ttl });
     }

     get<T>(key: string): T | null {
       const entry = this.cache.get(key);
       if (!entry || entry.expiresAt < Date.now()) {
         this.cache.delete(key);
         return null;
       }
       return entry.value as T;
     }

     invalidate(pattern: string): void {
       // Invalidate all keys matching pattern
     }
   }
   ```

2. **Implement L2 warm cache (Redis)**
   ```typescript
   // src/services/corpus/cache/warm-cache.ts
   class CorpusWarmCache {
     private redis: Redis;
     private ttl = 2 * 60 * 60 * 1000; // 2 hours

     async set(key: string, value: any): Promise<void> {
       await this.redis.setex(key, this.ttl / 1000, JSON.stringify(value));
     }

     async get<T>(key: string): Promise<T | null> {
       const data = await this.redis.get(key);
       if (!data) return null;
       return JSON.parse(data) as T;
     }
   }
   ```

3. **Create cache key strategy**
   ```typescript
   // src/services/corpus/cache/cache-keys.ts
   function corpusQueryCacheKey(tenantId: string, query: string): string {
     const queryHash = hashString(query.toLowerCase().trim());
     return `corpus:${tenantId}:q:${queryHash}`;
   }

   function corpusTopicCacheKey(tenantId: string, topicSlug: string): string {
     return `corpus:${tenantId}:topic:${topicSlug}`;
   }
   ```

**Deliverables:**
- ✅ L1 hot cache implemented
- ✅ L2 warm cache implemented (if Redis available)
- ✅ Cache invalidation working

---

## Week 3: Corpus Context Assembly + API

### Goals
- [ ] Implement 5-layer corpus context assembly (C0-C4)
- [ ] Create company identity core configuration
- [ ] Build topic framework assembler
- [ ] Implement budget allocation for corpus layers
- [ ] Create citation generation
- [ ] Build corpus management API endpoints

### Day 1-2: C0-C4 Layer Assembly

**Tasks:**

1. **Create corpus context assembler**
   ```typescript
   // src/services/corpus/context/assembler.ts
   class CorpusContextAssembler {
     async assemble(params: CorpusAssemblyParams): Promise<AssembledCorpusContext> {
       const startTime = Date.now();

       // C0: Company identity (always included)
       const C0 = await this.assembleC0(params.tenantId);

       // C1: Topic framework
       const C1 = await this.assembleC1(params.tenantId, params.queryEmbedding);

       // C2: Retrieved knowledge (primary payload)
       const C2 = await this.assembleC2(params);

       // C3: Supporting context
       const C3 = await this.assembleC3(C2);

       // C4: Freshness & changelog
       const C4 = await this.assembleC4(params.tenantId, C2.topics);

       // Compile final prompt
       const compiledPrompt = this.compilePrompt({ C0, C1, C2, C3, C4 });

       return {
         compiledPrompt,
         layers: { C0, C1, C2, C3, C4 },
         totalTokens: this.estimateTokens(compiledPrompt),
         citations: C2.citations,
         confidence: C2.confidence,
         metadata: {
           retrievalTimeMs: Date.now() - startTime,
           chunksConsidered: C2.chunksConsidered,
           chunksUsed: C2.chunksUsed,
           topicsCovered: C2.topicsCovered,
         },
       };
     }
   }
   ```

**Deliverables:**
- ✅ Corpus context assembler implemented
- ✅ All 5 layers assembling correctly

### Day 3: Company Identity Core (C0)

**Tasks:**

1. **Create C0 bundle compiler**
   ```typescript
   // src/services/corpus/context/c0-compiler.ts
   class C0Compiler {
     async compile(tenantId: string): Promise<CompiledLayer> {
       const tenant = await prisma.tenant.findUnique({
         where: { id: tenantId },
         select: { chatbotConfig: true, brandVoice: true, guardrails: true },
       });

       const config = tenant.chatbotConfig as TenantChatbotConfig;

       const content = this.compileIdentityCore(config);

       return {
         content,
         tokens: this.estimateTokens(content),
       };
     }

     private compileIdentityCore(config: TenantChatbotConfig): string {
       return `You are the ${config.companyName} support assistant.

Product: ${config.productName}
Description: ${config.productDescription}

Voice: ${config.brandVoice.tone}, ${config.brandVoice.formality}
Personality: ${config.brandVoice.personality.join(', ')}

Rules:
${config.guardrails.map(g => `- ${g}`).join('\n')}

${config.escalationInstructions}

Answer style: ${config.answerStyle}
Cite sources: ${config.citeSources ? 'Yes' : 'No'}
Suggest related topics: ${config.suggestRelated ? 'Yes' : 'No'}
Proactive help: ${config.proactiveHelp ? 'Yes' : 'No'}
`;
     }
   }
   ```

**Deliverables:**
- ✅ C0 compiler working
- ✅ Configurable per tenant

### Day 4: Topic Framework (C1)

**Tasks:**

1. **Create C1 topic framework builder**
   ```typescript
   // src/services/corpus/context/c1-builder.ts
   class C1Builder {
     async build(tenantId: string, queryEmbedding: number[]): Promise<CompiledLayer> {
       // Find relevant topics via semantic search
       const topics = await prisma.$queryRaw`
         SELECT id, slug, name, path,
           1 - (embedding <=> ${queryEmbedding}::vector) as similarity
         FROM corpus_topics
         WHERE "tenantId" = ${tenantId}
           AND "isActive" = true
         ORDER BY embedding <=> ${queryEmbedding}::vector
         LIMIT 3
       `;

       const content = this.formatTopicFramework(topics);

       return {
         content,
         tokens: this.estimateTokens(content),
       };
     }
   }
   ```

**Deliverables:**
- ✅ C1 builder implemented

### Day 5: Retrieved Knowledge (C2) + Budget

**Tasks:**

1. **Implement C2 retrieval integration**
   ```typescript
   // src/services/corpus/context/c2-retrieval.ts
   class C2Retrieval {
     async retrieve(params: CorpusAssemblyParams): Promise<CompiledLayer> {
       const retrievalEngine = new CorpusRetrievalEngine();

       const results = await retrievalEngine.retrieve({
         tenantId: params.tenantId,
         query: params.query,
         queryEmbedding: params.queryEmbedding,
         maxResults: 15,
         finalResults: 5,
         freshnessBias: 0.5,
       });

       const content = this.formatRetrievedKnowledge(results);
       const citations = this.generateCitations(results);

       return {
         content,
         tokens: this.estimateTokens(content),
         citations,
         confidence: results.confidence,
       };
     }
   }
   ```

2. **Implement corpus budget allocator**
   ```typescript
   // src/services/corpus/context/budget-allocator.ts
   class CorpusBudgetAllocator {
     allocate(totalBudget: number): CorpusLayerBudgets {
       const C0 = Math.min(300, totalBudget);
       const remaining = totalBudget - C0;

       return {
         C0_identity: C0,
         C1_topic: Math.floor(remaining * 0.08),
         C2_knowledge: Math.floor(remaining * 0.55),
         C3_supporting: Math.floor(remaining * 0.25),
         C4_freshness: Math.floor(remaining * 0.12),
       };
     }
   }
   ```

**Deliverables:**
- ✅ C2 retrieval integrated
- ✅ Budget allocation working

### Day 6: Citation Generation + API

**Tasks:**

1. **Create citation generator**
   ```typescript
   // src/services/corpus/context/citation-generator.ts
   class CitationGenerator {
     generateCitations(chunks: ScoredCorpusChunk[]): Citation[] {
       return chunks.map(chunk => ({
         chunkId: chunk.chunk.id,
         documentTitle: chunk.chunk.document.title,
         sectionPath: chunk.chunk.sectionPath,
         url: chunk.chunk.document.sourceUrl,
         version: chunk.chunk.document.version,
         relevanceScore: chunk.scores.combined,
       }));
     }
   }
   ```

2. **Create corpus management API**
   ```typescript
   // src/routes/corpus.ts
   import { Router } from 'express';

   const router = Router();

   // Ingest document
   router.post('/documents/ingest', requireTenantAdmin, async (req, res) => {
     const { tenantId } = req.tenant;
     const { title, content, format, category, topicSlug } = req.body;

     const result = await corpusIngestionPipeline.ingest({
       tenantId,
       title,
       content,
       format,
       category,
       topicSlug,
     });

     res.json(result);
   });

   // Search corpus
   router.post('/search', async (req, res) => {
     const { tenantId } = req.tenant;
     const { query } = req.body;

     const results = await corpusRetrievalEngine.retrieve({
       tenantId,
       query,
       queryEmbedding: await embeddingService.embed(query),
     });

     res.json(results);
   });

   export { router as corpusRoutes };
   ```

**Deliverables:**
- ✅ Citation generation working
- ✅ Corpus API endpoints created

---

## Week 4: Dual-Engine Orchestrator

### Goals
- [ ] Implement intent classifier
- [ ] Build weight calculator
- [ ] Create budget allocator (dual-engine split)
- [ ] Implement context merger
- [ ] Generate orchestrator meta-instructions
- [ ] Build avatar classifier

### Day 1-2: Intent Classifier

**Tasks:**

1. **Implement dual intent classifier**
   ```typescript
   // src/services/orchestrator/intent-classifier.ts
   class DualIntentClassifier {
     async classify(params: ClassificationParams): Promise<ClassificationResult> {
       // Stage 1: Fast rule-based classification
       const rulesResult = this.ruleBasedClassify(params);

       if (rulesResult.confidence >= 0.85) {
         return this.applyAvatarModifier(rulesResult, params.userAvatar);
       }

       // Stage 2: LLM-based classification for ambiguous cases
       const llmResult = await this.llmClassify(params);

       return this.mergeClassifications(rulesResult, llmResult, params.userAvatar);
     }

     private ruleBasedClassify(params: ClassificationParams): ClassificationResult {
       const message = params.message.toLowerCase();

       // Recall indicators (shift toward user)
       const recallPatterns = [
         /\b(remember|recall|last time|we discussed|previously)\b/i,
         /\b(my account|my plan|my setup)\b/i,
       ];

       // Corpus indicators (shift toward corpus)
       const corpusPatterns = [
         /\b(how does|what is|explain|documentation)\b/i,
         /\b(api|endpoint|sdk|pricing)\b/i,
       ];

       // Compute weights based on pattern matches
       // ... (full implementation from chatbot doc)

       return {
         primaryIntent: intent,
         confidence,
         corpusWeight,
         userWeight: 1 - corpusWeight,
         signals: { ... },
       };
     }
   }
   ```

**Deliverables:**
- ✅ Rule-based classifier working
- ✅ LLM fallback implemented
- ✅ Avatar modifier applied

### Day 3: Weight Calculator

**Tasks:**

1. **Implement engine weight calculator**
   ```typescript
   // src/services/orchestrator/weight-calculator.ts
   class EngineWeightCalculator {
     calculate(
       intent: ClassificationResult,
       avatar: UserAvatar,
       conversationState: ConversationState,
       userMemoryDensity: number,
     ): WeightCalculation {
       let corpusWeight = intent.corpusWeight;
       let userWeight = intent.userWeight;

       // Avatar modifier
       const avatarShift = this.getAvatarShift(avatar, userMemoryDensity);
       corpusWeight += avatarShift;

       // Conversation arc modifier
       const arcShift = this.getArcShift(conversationState);
       corpusWeight += arcShift;

       // Memory density modifier
       const densityShift = this.getDensityShift(userMemoryDensity, intent.primaryIntent);
       corpusWeight += densityShift;

       // Normalize
       corpusWeight = Math.max(0.05, Math.min(0.95, corpusWeight));
       userWeight = 1 - corpusWeight;

       return {
         intentWeight: { corpus: intent.corpusWeight, user: intent.userWeight },
         avatarModifier: avatarShift,
         conversationArcModifier: arcShift,
         final: { corpus: corpusWeight, user: userWeight },
       };
     }
   }
   ```

**Deliverables:**
- ✅ Weight calculator implemented
- ✅ All modifiers working

### Day 4: Budget Allocator

**Tasks:**

1. **Implement dual budget allocator**
   ```typescript
   // src/services/orchestrator/budget-allocator.ts
   class DualBudgetAllocator {
     allocate(
       totalBudget: number,
       weights: { corpus: number; user: number; },
       userAvatar: UserAvatar,
       hasConversation: boolean,
       conversationTokens: number,
     ): DualBudgetAllocation {
       // Reserve fixed costs
       const systemInstructions = 200;
       const messageReserve = 100;
       const remaining = totalBudget - systemInstructions - messageReserve;

       // Conversation history (shared)
       const historyBudget = hasConversation
         ? Math.min(Math.floor(remaining * 0.25), Math.min(conversationTokens, 4000))
         : 0;

       const afterHistory = remaining - historyBudget;

       // Split between corpus and user
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
   }
   ```

**Deliverables:**
- ✅ Dual budget allocator implemented
- ✅ Layer budgets allocated correctly

### Day 5: Context Merger

**Tasks:**

1. **Implement dual context merger**
   ```typescript
   // src/services/orchestrator/context-merger.ts
   class DualContextMerger {
     async merge(
       corpusContext: AssembledCorpusContext,
       userContext: AssembledContext,
       weights: { corpus: number; user: number; },
       conversationHistory: CompressedHistory,
       orchestratorInstructions: string,
     ): Promise<MergedContext> {
       const sections: string[] = [];

       // 1. Orchestrator meta-instructions
       sections.push(orchestratorInstructions);

       // 2. Company identity (C0)
       sections.push(corpusContext.layers.C0.content);

       // 3. User identity (L0) - if available
       if (userContext.layers?.L0?.content) {
         sections.push(`## About This User\n${userContext.layers.L0.content}`);
       }

       // 4. User preferences (L1)
       if (userContext.layers?.L1?.content) {
         sections.push(`## User Preferences\n${userContext.layers.L1.content}`);
       }

       // 5. Retrieved knowledge (C2)
       if (corpusContext.layers.C2.content) {
         sections.push(`## Relevant Documentation\n${corpusContext.layers.C2.content}`);
       }

       // 6. User memories (L5)
       if (userContext.layers?.L5?.content) {
         sections.push(`## User History\n${userContext.layers.L5.content}`);
       }

       // 7. Conversation history
       if (conversationHistory?.content) {
         sections.push(`## Conversation History\n${conversationHistory.content}`);
       }

       // Deduplication pass
       const deduped = await this.deduplicateContent(sections);

       // Conflict detection
       const conflictNotes = await this.detectCorpusUserConflicts(corpusContext, userContext);
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
           engineWeights: weights,
         },
       };
     }
   }
   ```

**Deliverables:**
- ✅ Context merger implemented
- ✅ Deduplication working
- ✅ Conflict detection working

### Day 6-7: Full Orchestration + Avatar

**Tasks:**

1. **Create avatar classifier**
   ```typescript
   // src/services/orchestrator/avatar-classifier.ts
   class AvatarClassifier {
     async classify(virtualUserId: string): Promise<UserAvatar> {
       const [conversationCount, memoryCount] = await Promise.all([
         prisma.virtualConversation.count({ where: { virtualUserId } }),
         prisma.virtualMemory.count({ where: { virtualUserId } }),
       ]);

       if (conversationCount === 0) return 'STRANGER';
       if (conversationCount <= 5 && memoryCount <= 10) return 'ACQUAINTANCE';
       if (conversationCount <= 20 && memoryCount <= 50) return 'FAMILIAR';
       return 'KNOWN';
     }
   }
   ```

2. **Implement full orchestrator**
   ```typescript
   // src/services/orchestrator/dual-engine-orchestrator.ts
   class DualEngineOrchestrator {
     async orchestrate(params: OrchestrationParams): Promise<MergedContext> {
       // 1. Classify avatar
       const avatar = await this.avatarClassifier.classify(params.virtualUserId);

       // 2. Calculate memory density
       const memoryDensity = await this.calculateMemoryDensity(params.virtualUserId);

       // 3. Classify intent
       const intent = await this.intentClassifier.classify({ ... });

       // 4. Calculate weights
       const weights = this.weightCalculator.calculate(intent, avatar, ...);

       // 5. Allocate budget
       const budget = this.budgetAllocator.allocate(params.totalBudget, weights.final, ...);

       // 6. Generate query embedding
       const queryEmbedding = await this.embeddingService.embed(params.message);

       // 7. Parallel assembly
       const [corpusContext, userContext, conversationHistory] = await Promise.all([
         this.corpusAssembler.assemble({ ... }),
         this.userAssembler.assemble({ ... }),
         this.conversationCompressor.compress(params.conversationId, ...),
       ]);

       // 8. Generate orchestrator instructions
       const instructions = generateOrchestratorInstructions(avatar, intent, ...);

       // 9. Merge contexts
       const merged = await this.contextMerger.merge(corpusContext, userContext, ...);

       return merged;
     }
   }
   ```

**Deliverables:**
- ✅ Avatar classifier working
- ✅ Full orchestrator implemented
- ✅ Parallel assembly working

---

## Week 5: Intelligent User Memory - Part 1

### Goals
- [ ] Build conversation index
- [ ] Implement conversation recall
- [ ] Create real-time memory extractor
- [ ] Build session-end extraction pipeline

### Day 1-2: Conversation Index Builder

**Tasks:**

1. **Create conversation index model** (already in schema plan)
2. **Implement index builder**
   ```typescript
   // src/services/memory/conversation-index-builder.ts
   class ConversationIndexBuilder {
     async indexConversation(
       virtualUserId: string,
       conversationId: string,
       messages: Message[],
     ): Promise<ConversationIndex> {
       // Generate structured summary via LLM
       const analysis = await this.llmService.chat({
         model: 'gpt-4o-mini',
         messages: [{
           role: 'system',
           content: `Analyze this conversation and extract:
             - 2-3 sentence summary
             - Topics discussed
             - Key facts learned
             - Questions asked
             - Issues discussed
             - Decisions reached
             - Action items
             - Sentiment
             - Resolution status

             Format as JSON.`,
         }, {
           role: 'user',
           content: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
         }],
       });

       const parsed = JSON.parse(analysis.content);

       // Generate embedding
       const embedding = await this.embeddingService.embed(parsed.summary);

       // Store index
       const index = await prisma.conversationIndex.create({
         data: {
           virtualUserId,
           conversationId,
           summary: parsed.summary,
           embedding,
           topics: parsed.topics,
           keyFacts: parsed.keyFacts,
           // ... other fields
         },
       });

       return index;
     }
   }
   ```

**Deliverables:**
- ✅ Conversation index builder working
- ✅ LLM analysis integrated

### Day 3-4: Conversation Recall

**Tasks:**

1. **Implement conversation recall service**
   ```typescript
   // src/services/memory/conversation-recall.ts
   class ConversationRecall {
     async recall(
       virtualUserId: string,
       query: string,
     ): Promise<RecallResult> {
       const queryEmbedding = await this.embeddingService.embed(query);

       // Semantic search across conversation indices
       const semanticResults = await prisma.$queryRaw`
         SELECT ci.*,
           1 - (embedding <=> ${queryEmbedding}::vector) as similarity
         FROM conversation_indices ci
         WHERE "virtualUserId" = ${virtualUserId}
         ORDER BY embedding <=> ${queryEmbedding}::vector
         LIMIT 5
       `;

       // Get full conversation for top match
       if (semanticResults.length > 0 && semanticResults[0].similarity > 0.5) {
         const fullConversation = await prisma.virtualConversation.findUnique({
           where: { id: semanticResults[0].conversationId },
           include: { messages: { orderBy: { createdAt: 'asc' } } },
         });

         return {
           found: true,
           topMatch: semanticResults[0],
           conversationSummary: semanticResults[0].summary,
           keyExchanges: this.extractKeyExchanges(fullConversation.messages),
         };
       }

       return { found: false, suggestions: semanticResults };
     }
   }
   ```

**Deliverables:**
- ✅ Conversation recall working
- ✅ Semantic search across conversations

### Day 5-7: Real-Time Memory Extractor

**Tasks:**

1. **Implement real-time extractor**
   ```typescript
   // src/services/memory/realtime-extractor.ts
   class RealtimeMemoryExtractor {
     private messageBuffer: Message[] = [];
     private extractionThreshold = 3;

     async onMessage(
       virtualUserId: string,
       message: Message,
       conversationId: string,
     ): Promise<ExtractedMemory[]> {
       this.messageBuffer.push(message);

       // Quick signal detection (no LLM)
       const quickExtractions = this.quickSignalExtraction(message);

       // Deep extraction every N messages
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
       const planMatch = text.match(/\b(free|starter|team|enterprise)\s*(plan|tier)\b/i);
       if (planMatch) {
         extractions.push({
           content: `User appears to be on the ${planMatch[1]} plan`,
           memoryType: 'FACTUAL',
           category: 'account',
           importance: 0.9,
           confidence: 0.7,
         });
       }

       // Role detection
       const roleMatch = text.match(/\b(i am|i'm|i work as)\s+(?:a|an|the)?\s*(\w+(?:\s+\w+)?)\b/i);
       if (roleMatch) {
         extractions.push({
           content: `User's role: ${roleMatch[2]}`,
           memoryType: 'IDENTITY',
           category: 'role',
           importance: 0.85,
           confidence: 0.75,
         });
       }

       return extractions;
     }
   }
   ```

**Deliverables:**
- ✅ Real-time extractor working
- ✅ Quick signal detection implemented
- ✅ Deep extraction integrated

---

## Week 6: Intelligent User Memory - Part 2

### Goals
- [ ] Build session-end extraction
- [ ] Create user profile evolver
- [ ] Implement proactive awareness engine
- [ ] Build "personal AI" experience features

### Day 1-2: Session-End Extraction

**Tasks:**

1. **Implement session-end extractor**
   ```typescript
   // src/services/memory/session-end-extractor.ts
   class SessionEndExtractor {
     async onSessionEnd(
       virtualUserId: string,
       conversationId: string,
       messages: Message[],
     ): Promise<void> {
       // Build conversation index
       await this.conversationIndexBuilder.indexConversation(
         virtualUserId, conversationId, messages
       );

       // Extract session-level memories
       const sessionMemories = await this.extractSessionMemories(
         virtualUserId, messages
       );

       // Store memories
       for (const memory of sessionMemories) {
         await this.memoryService.createMemory(virtualUserId, memory);
       }

       // Update user profile evolution
       await this.profileEvolver.evolve(virtualUserId);

       // Check for unresolved issues
       const unresolvedIssues = await this.detectUnresolvedIssues(messages);
       for (const issue of unresolvedIssues) {
         await this.memoryService.createMemory(virtualUserId, {
           content: `Unresolved: ${issue.description}`,
           memoryType: 'GOAL',
           category: 'unresolved_issue',
           importance: 0.85,
           tags: ['unresolved', 'follow-up'],
         });
       }
     }
   }
   ```

**Deliverables:**
- ✅ Session-end extraction working
- ✅ Unresolved issue tracking implemented

### Day 3-4: User Profile Evolver

**Tasks:**

1. **Implement profile evolver**
   ```typescript
   // src/services/memory/profile-evolver.ts
   class UserProfileEvolver {
     async evolve(virtualUserId: string): Promise<UserProfileSnapshot> {
       // Get current profile
       const current = await this.getProfile(virtualUserId);

       // Get all memories
       const memories = await this.memoryService.searchMemories(virtualUserId, {
         limit: 200,
         sortBy: 'importance',
       });

       // Get recent conversations
       const recentConversations = await prisma.conversationIndex.findMany({
         where: { virtualUserId },
         orderBy: { startedAt: 'desc' },
         take: 10,
       });

       // Synthesize profile update via LLM
       const synthesis = await this.llmService.chat({
         model: 'gpt-4o-mini',
         messages: [{
           role: 'system',
           content: `Update the user profile based on accumulated memories and conversations.
                     Return updated profile fields and changelog as JSON.`,
         }, {
           role: 'user',
           content: JSON.stringify({
             currentProfile: current,
             memories: memories.map(m => ({ content: m.content, type: m.memoryType })),
             recentConversations: recentConversations.map(c => ({
               summary: c.summary,
               topics: c.topics,
             })),
           }),
         }],
       });

       const updates = JSON.parse(synthesis.content);
       const evolved = this.applyUpdates(current, updates);

       // Reclassify avatar
       evolved.avatar = this.classifyAvatar(evolved, memories.length, recentConversations.length);

       // Store
       await this.saveProfile(virtualUserId, evolved);

       return evolved;
     }
   }
   ```

**Deliverables:**
- ✅ Profile evolver implemented
- ✅ LLM synthesis working

### Day 5-7: Proactive Awareness Engine

**Tasks:**

1. **Implement proactive awareness**
   ```typescript
   // src/services/memory/proactive-awareness.ts
   class ProactiveAwarenessEngine {
     async checkProactiveInsights(
       virtualUserId: string,
       currentQuery: string,
       corpusContext: AssembledCorpusContext,
     ): Promise<ProactiveInsight[]> {
       const insights: ProactiveInsight[] = [];

       // Check for unresolved issues
       const unresolved = await this.memoryService.searchMemories(virtualUserId, {
         category: 'unresolved_issue',
         isActive: true,
       });

       for (const issue of unresolved) {
         const resolution = await this.checkIfResolved(issue.content, corpusContext);
         if (resolution) {
           insights.push({
             type: 'ISSUE_RESOLVED',
             content: `Your previous issue "${issue.content}" may be resolved: ${resolution}`,
             relevance: 0.9,
             source: 'corpus_update',
           });
         }
       }

       // Check for doc updates
       const userTopics = await this.getUserTopics(virtualUserId);
       for (const topic of userTopics) {
         const updates = await this.getDocUpdates(topic.slug, topic.lastInteraction);
         if (updates.length > 0) {
           insights.push({
             type: 'DOC_UPDATED',
             content: `Documentation updated: ${updates[0].changelog}`,
             relevance: 0.7,
             source: 'corpus_update',
           });
         }
       }

       // Check for feature releases
       const featureRequests = await this.memoryService.searchMemories(virtualUserId, {
         tags: ['feature-request'],
         isActive: true,
       });

       for (const request of featureRequests) {
         const released = await this.checkIfFeatureReleased(request.content);
         if (released) {
           insights.push({
             type: 'FEATURE_RELEASED',
             content: `Feature requested is now available!`,
             relevance: 0.95,
             source: 'corpus_update',
           });
         }
       }

       return insights.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
     }
   }
   ```

**Deliverables:**
- ✅ Proactive awareness engine working
- ✅ Doc update detection implemented
- ✅ Feature release matching working

---

## Week 7-8: Multi-Tenant + Production Readiness

### Week 7 Goals
- [ ] Implement multi-tenant isolation
- [ ] Create tenant admin dashboard API
- [ ] Build corpus analytics
- [ ] Implement rate limiting

### Week 8 Goals
- [ ] Load testing
- [ ] Documentation
- [ ] SDK updates
- [ ] Bug fixes + polish

### Tasks

1. **Multi-tenant isolation**
   - Implement tenant-scoped queries at repository layer
   - Add tenant ID to all cache keys
   - Test tenant data isolation

2. **Tenant admin dashboard**
   - Document upload/management UI
   - Corpus analytics dashboard
   - Chatbot configuration UI

3. **Corpus analytics**
   - Query pattern analysis
   - Gap detection (unanswered queries)
   - Confidence tracking
   - Content freshness monitoring

4. **Rate limiting**
   - Per-tenant rate limits
   - Per-user rate limits
   - Abuse prevention

5. **Load testing**
   - Target: 100 concurrent users per tenant
   - Measure assembly time (< 800ms)
   - Test vector search performance

6. **Documentation**
   - API documentation
   - Integration guide
   - Deployment guide

7. **SDK updates**
   - Update VirtualUser SDK with chatbot support
   - Add corpus search methods
   - Add conversation recall methods

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Assembly Time** | < 800ms | P95 latency |
| **Corpus Confidence** | > 0.6 avg | Avg confidence score |
| **Identification Rate** | > 85% | Returning users identified |
| **Memory Density** | > 5/week | Memories created per user |
| **Cache Hit Rate** | > 70% | Corpus cache hits |
| **User Satisfaction** | > 4.0/5.0 | Thumbs up rate |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Vector search performance** | Index optimization, query caching |
| **Tenant isolation bugs** | Comprehensive testing, repository-layer scoping |
| **LLM cost overruns** | Use smaller models for extraction, batch embeddings |
| **Memory bloat** | Implement memory consolidation, TTL-based archival |
| **Cold start latency** | Pre-warm corpus bundles, lazy-load user context |

---

**Document Status:** Ready for Execution  
**Next Action:** Begin Week 1 implementation

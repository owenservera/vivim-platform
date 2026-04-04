/**
 * VIVIM Corpus Service
 * 
 * Main entry point for the corpus-chatbot system.
 * Provides document ingestion, retrieval, and context assembly.
 * 
 * @created March 27, 2026
 */

export { CorpusIngestionService } from './ingestion-service';
export { CorpusRetrievalService } from './retrieval-service';
export { CorpusContextService } from './context-service';
export { CorpusCacheService } from './cache/cache-service';

// Types
export * from '../../types/corpus';

// Parsers
export { MarkdownParser } from './parsers/markdown-parser';
export { HtmlParser } from './parsers/html-parser';
export { getParser } from './parsers/parser-factory';

// Chunker
export { SemanticChunker } from './chunker/semantic-chunker';

// Retrieval
export { SemanticSearch } from './retrieval/semantic-search';
export { KeywordSearch } from './retrieval/keyword-search';
export { QAMatching } from './retrieval/qa-matching';
export { CorpusScorer } from './retrieval/scorer';
export { CorpusReranker } from './retrieval/reranker';

// Context
export { CorpusContextAssembler } from './context/assembler';
export { C0Compiler } from './context/c0-compiler';
export { C1Builder } from './context/c1-builder';
export { C2Retrieval } from './context/c2-retrieval';
export { CorpusBudgetAllocator } from './context/budget-allocator';

// Orchestrator (dual-engine)
export { DualEngineOrchestrator } from '../orchestrator/dual-engine-orchestrator';
export { DualIntentClassifier } from '../orchestrator/intent-classifier';
export { EngineWeightCalculator } from '../orchestrator/weight-calculator';
export { DualBudgetAllocator } from '../orchestrator/budget-allocator';
export { DualContextMerger } from '../orchestrator/context-merger';
export { AvatarClassifier } from '../orchestrator/avatar-classifier';

// Memory (conversation awareness)
export { ConversationIndexBuilder } from '../memory/conversation-index-builder';
export { ConversationRecall } from '../memory/conversation-recall';
export { RealtimeMemoryExtractor } from '../memory/realtime-extractor';
export { SessionEndExtractor } from '../memory/session-end-extractor';
export { UserProfileEvolver } from '../memory/profile-evolver';
export { ProactiveAwarenessEngine } from '../memory/proactive-awareness';

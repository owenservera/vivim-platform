// ============================================================================
// VIVIM Dynamic Context Engine - Enhanced Module Exports
// ============================================================================

// --- Core Types ---
export * from './types';
export * from './settings-types';

// --- Original Modules ---
export { BudgetAlgorithm } from './budget-algorithm';
export { BundleCompiler } from './bundle-compiler';
export { ConversationContextEngine } from './conversation-context-engine';
export { PredictionEngine } from './prediction-engine';
export { DynamicContextAssembler } from './context-assembler';
export { ContextOrchestrator } from './context-orchestrator';
export { ContextSettingsService } from './settings-service';
export { LibrarianWorker } from './librarian-worker';
export { HybridRetrievalService } from './hybrid-retrieval';

// --- Enhancement 1: In-Memory Cache Layer ---
export { ContextCache, getContextCache, resetContextCache } from './context-cache';

// --- Enhancement 2: Event-Driven Invalidation Bus ---
export {
  ContextEventBus,
  getContextEventBus,
  resetContextEventBus,
  wireDefaultInvalidation,
} from './context-event-bus';
export type { ContextEvent, ContextEventType } from './context-event-bus';

// --- Enhancement 3: Parallel Pipeline & Streaming ---
export {
  ParallelContextPipeline,
  ConcurrencyLimiter,
} from './context-pipeline';
export type { PipelineMetrics, StreamingContextChunk } from './context-pipeline';

// --- Enhancement 4: Adaptive Prediction Engine ---
export { AdaptivePredictionEngine } from './adaptive-prediction';

// --- Enhancement 5: Context Telemetry & Quality Scoring ---
export {
  ContextTelemetry,
  getContextTelemetry,
} from './context-telemetry';
export type { AssemblyTelemetry, QualityReport, AnomalyAlert } from './context-telemetry';

// --- Enhancement 6: Bundle Differ & Delta Compression ---
export { BundleDiffer } from './bundle-differ';
export type { BundleDelta, DiffOperation, DiffStats } from './bundle-differ';

// --- Enhancement 7: Query Optimizer ---
export {
  ContextQueryOptimizer,
  DataLoader,
  QueryCoalescer,
} from './query-optimizer';

// --- Enhancement 8: Prefetch Engine ---
export { PrefetchEngine } from './prefetch-engine';

// --- Enhancement 9: Context Graph ---
export {
  ContextGraph,
  ContextGraphManager,
} from './context-graph';
export type { GraphNode, GraphEdge, SubGraph, GraphMetrics } from './context-graph';

// --- Enhancement 10: Memory System (Second Brain) ---
export * from './memory';

// --- Utilities ---
export { SimpleTokenEstimator } from './utils/token-estimator';
export { EmbeddingService, MockEmbeddingService } from './utils/embedding-service';
export { ZAIEmbeddingService, ZAILLMService, createEmbeddingService, createLLMService } from './utils/zai-service';

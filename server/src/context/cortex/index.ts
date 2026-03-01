/**
 * VIVIM Cortex — Phase 1 POC Module Index
 *
 * Exports the three core Cortex engines:
 * 1. SituationDetector — classifies conversations into business archetypes
 * 2. AdaptiveContextAssembler — reshapes token budgets based on situation
 * 3. MemoryCompressionService — 4-tier storage optimization
 */

// ── Situation Detection ───────────────────────────────────────
export {
  SituationDetector,
  SITUATION_ARCHETYPES,
  type SituationArchetype,
  type DetectedSituation,
  type SituationSignal,
  type ContextOverride,
  type SituationDetectorConfig,
} from './situation-detector';

// ── Adaptive Context Assembly ─────────────────────────────────
export {
  AdaptiveContextAssembler,
  type AdaptiveAssemblerConfig,
  type AdaptiveAssemblyResult,
  type ModelProfile,
} from './adaptive-assembler';

// ── Memory Compression ───────────────────────────────────────
export {
  MemoryCompressionService,
  quantizeToInt8,
  dequantizeFromInt8,
  binaryQuantize,
  hammingDistance,
  simHash,
  type CompressionTier,
  type CompressedMemory,
  type MemoryEmbedding,
  type CompressedMemoryMeta,
  type TierStats,
  type CompressionConfig,
} from './memory-compression';

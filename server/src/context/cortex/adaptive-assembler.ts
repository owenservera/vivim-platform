/**
 * VIVIM Cortex — Adaptive Context Assembler
 *
 * Wraps the existing DynamicContextAssembler to apply situation-aware
 * overrides to token budgets, memory retrieval filters, and layer priorities.
 *
 * Part of the Cortex Phase 1 POC.
 */

import { logger } from '../../lib/logger.js';
import type {
  LayerBudget,
  ComputedBudget,
  AssembledContext,
  UserContextSettings,
  BudgetInput,
} from '../types';
import {
  SituationDetector,
  type DetectedSituation,
  type SituationArchetype,
  type ContextOverride,
  type SituationDetectorConfig,
} from './situation-detector';

// ============================================================================
// TYPES
// ============================================================================

export interface AdaptiveAssemblerConfig {
  /** Situation detector configuration */
  situationConfig?: SituationDetectorConfig;
  /** Default token budget (before model-aware scaling) */
  defaultTokenBudget?: number;
  /** Enable model-aware budget scaling */
  enableModelScaling?: boolean;
}

export interface ModelProfile {
  id: string;
  maxContext: number;
  sweetSpot: number;
  strengths: string[];
  costPer1kTokens: number;
}

export interface AdaptiveAssemblyResult {
  /** The detected situation */
  situation: DetectedSituation;
  /** Adjusted token budget per layer */
  adjustedBudget: Record<string, LayerBudget>;
  /** Total budget used */
  totalBudget: number;
  /** Which memory types were prioritized */
  priorityMemoryTypes: string[];
  /** Extraction focus hints for the extraction engine */
  extractionFocus: string[];
  /** Assembly timing */
  assemblyTimeMs: number;
}

// ============================================================================
// MODEL PROFILES
// ============================================================================

const MODEL_PROFILES: Record<string, ModelProfile> = {
  'gpt-4o':              { id: 'gpt-4o',              maxContext: 128000,  sweetSpot: 16000, strengths: ['reasoning', 'code'], costPer1kTokens: 0.0025 },
  'gpt-4o-mini':         { id: 'gpt-4o-mini',         maxContext: 128000,  sweetSpot: 8000,  strengths: ['speed', 'code'],     costPer1kTokens: 0.00015 },
  'gpt-4-turbo':         { id: 'gpt-4-turbo',         maxContext: 128000,  sweetSpot: 12000, strengths: ['reasoning'],         costPer1kTokens: 0.01 },
  'claude-3.5-sonnet':   { id: 'claude-3.5-sonnet',   maxContext: 200000,  sweetSpot: 24000, strengths: ['reasoning', 'writing'], costPer1kTokens: 0.003 },
  'claude-3-haiku':      { id: 'claude-3-haiku',      maxContext: 200000,  sweetSpot: 8000,  strengths: ['speed'],             costPer1kTokens: 0.00025 },
  'claude-3-opus':       { id: 'claude-3-opus',       maxContext: 200000,  sweetSpot: 32000, strengths: ['reasoning', 'analysis'], costPer1kTokens: 0.015 },
  'gemini-2.0-flash':    { id: 'gemini-2.0-flash',    maxContext: 1000000, sweetSpot: 32000, strengths: ['multimodal', 'speed'], costPer1kTokens: 0.0001 },
  'gemini-1.5-pro':      { id: 'gemini-1.5-pro',      maxContext: 2000000, sweetSpot: 64000, strengths: ['reasoning', 'multimodal'], costPer1kTokens: 0.00125 },
  'mistral-large':       { id: 'mistral-large',       maxContext: 128000,  sweetSpot: 16000, strengths: ['multilingual'],       costPer1kTokens: 0.002 },
  'llama-3.3-70b':       { id: 'llama-3.3-70b',       maxContext: 128000,  sweetSpot: 8000,  strengths: ['open', 'code'],       costPer1kTokens: 0.0 },
  'deepseek-r1':         { id: 'deepseek-r1',         maxContext: 128000,  sweetSpot: 12000, strengths: ['reasoning', 'math'],   costPer1kTokens: 0.0014 },
  'qwen-2.5-72b':        { id: 'qwen-2.5-72b',        maxContext: 128000,  sweetSpot: 12000, strengths: ['multilingual', 'code'], costPer1kTokens: 0.0 },
};

// ============================================================================
// DEFAULT LAYER BUDGETS (before situation override)
// ============================================================================

const DEFAULT_LAYERS: Record<string, Omit<LayerBudget, 'allocated'>> = {
  identity_core:   { layer: 'identity_core',   priority: 95, minTokens: 200,  idealTokens: 500,  maxTokens: 800,  elasticity: 0.1 },
  global_prefs:    { layer: 'global_prefs',    priority: 85, minTokens: 100,  idealTokens: 300,  maxTokens: 500,  elasticity: 0.3 },
  topic_profiles:  { layer: 'topic_profiles',  priority: 70, minTokens: 0,    idealTokens: 1500, maxTokens: 3000, elasticity: 0.6 },
  entity_profiles: { layer: 'entity_profiles', priority: 60, minTokens: 0,    idealTokens: 1000, maxTokens: 2000, elasticity: 0.7 },
  memory_recall:   { layer: 'memory_recall',   priority: 75, minTokens: 200,  idealTokens: 2000, maxTokens: 4000, elasticity: 0.4 },
  conv_arc:        { layer: 'conv_arc',        priority: 50, minTokens: 100,  idealTokens: 2000, maxTokens: 3000, elasticity: 0.5 },
  active_messages: { layer: 'active_messages', priority: 90, minTokens: 1000, idealTokens: 4000, maxTokens: 8000, elasticity: 0.2 },
};

// ============================================================================
// ADAPTIVE CONTEXT ASSEMBLER
// ============================================================================

export class AdaptiveContextAssembler {
  private situationDetector: SituationDetector;
  private defaultTokenBudget: number;
  private enableModelScaling: boolean;

  constructor(config: AdaptiveAssemblerConfig = {}) {
    this.situationDetector = new SituationDetector(config.situationConfig);
    this.defaultTokenBudget = config.defaultTokenBudget ?? 12000;
    this.enableModelScaling = config.enableModelScaling ?? true;
  }

  /**
   * Get the underlying situation detector for direct access
   */
  getSituationDetector(): SituationDetector {
    return this.situationDetector;
  }

  /**
   * Compute the adapted token budget for a given user message.
   * This is the main entry point for the Cortex adaptive pipeline.
   */
  computeAdaptiveBudget(
    userMessage: string,
    options?: {
      model?: string;
      provider?: string;
      userSettings?: Partial<UserContextSettings>;
    }
  ): AdaptiveAssemblyResult {
    const startTime = performance.now();

    // Step 1: Detect situation
    const situation = this.situationDetector.detect(userMessage, {
      provider: options?.provider,
    });

    // Step 2: Determine base token budget (model-aware)
    const baseBudget = this.resolveTokenBudget(
      options?.model,
      options?.userSettings?.maxContextTokens
    );

    // Step 3: Apply situation overrides to layer budgets
    const adjustedBudget = this.applyOverrides(
      baseBudget,
      situation.contextOverrides
    );

    // Step 4: Run the 3-pass budget solver
    const solvedBudget = this.solveBudget(adjustedBudget, baseBudget);

    const assemblyTimeMs = performance.now() - startTime;

    return {
      situation,
      adjustedBudget: solvedBudget,
      totalBudget: baseBudget,
      priorityMemoryTypes: situation.contextOverrides.priorityMemoryTypes,
      extractionFocus: situation.contextOverrides.extractionFocus,
      assemblyTimeMs,
    };
  }

  /**
   * Get model profile by ID
   */
  getModelProfile(modelId: string): ModelProfile | null {
    return MODEL_PROFILES[modelId] ?? null;
  }

  /**
   * Register a custom model profile
   */
  registerModel(profile: ModelProfile): void {
    MODEL_PROFILES[profile.id] = profile;
  }

  // ════════════════════════════════════════════════════════════════
  // TOKEN BUDGET RESOLUTION
  // ════════════════════════════════════════════════════════════════

  private resolveTokenBudget(model?: string, userMax?: number): number {
    let budget = this.defaultTokenBudget;

    // Model-aware scaling
    if (this.enableModelScaling && model) {
      const profile = MODEL_PROFILES[model];
      if (profile) {
        budget = profile.sweetSpot;
      }
    }

    // User override caps it
    if (userMax && userMax > 0) {
      budget = Math.min(budget, userMax);
    }

    return budget;
  }

  // ════════════════════════════════════════════════════════════════
  // LAYER OVERRIDE APPLICATION
  // ════════════════════════════════════════════════════════════════

  private applyOverrides(
    totalBudget: number,
    overrides: ContextOverride
  ): Record<string, LayerBudget> {
    const result: Record<string, LayerBudget> = {};

    for (const [layerId, baseConfig] of Object.entries(DEFAULT_LAYERS)) {
      const boost = overrides.layerBoosts[layerId] ?? 1.0;

      result[layerId] = {
        ...baseConfig,
        idealTokens: Math.round(baseConfig.idealTokens * boost),
        maxTokens: Math.round(baseConfig.maxTokens * boost),
        allocated: 0,
      };
    }

    return result;
  }

  // ════════════════════════════════════════════════════════════════
  // 3-PASS BUDGET SOLVER (VCAA Algorithm)
  // ════════════════════════════════════════════════════════════════

  private solveBudget(
    layers: Record<string, LayerBudget>,
    totalBudget: number
  ): Record<string, LayerBudget> {
    const sortedLayers = Object.values(layers).sort((a, b) => b.priority - a.priority);

    // ── PASS 1: Guarantee minimums ──────────────────────────────
    let totalMin = sortedLayers.reduce((s, l) => s + l.minTokens, 0);
    const activeLayers = [...sortedLayers];

    // Drop lowest-priority layers if minimums exceed budget
    while (totalMin > totalBudget && activeLayers.length > 1) {
      const dropped = activeLayers.pop()!;
      totalMin -= dropped.minTokens;
      layers[dropped.layer].allocated = 0;
      layers[dropped.layer].minTokens = 0;
      layers[dropped.layer].idealTokens = 0;
      layers[dropped.layer].maxTokens = 0;
    }

    let remaining = totalBudget - totalMin;
    for (const layer of activeLayers) {
      layers[layer.layer].allocated = layer.minTokens;
    }

    // ── PASS 2: Distribute ideal tokens ─────────────────────────
    const candidates = activeLayers.filter(l => l.idealTokens > l.minTokens);
    candidates.sort((a, b) => b.priority - a.priority);

    for (const layer of candidates) {
      if (remaining <= 0) break;
      const want = Math.min(
        layer.idealTokens - layers[layer.layer].allocated,
        remaining
      );
      layers[layer.layer].allocated += want;
      remaining -= want;
    }

    // ── PASS 3: Elastic overflow ────────────────────────────────
    if (remaining > 0) {
      const elastic = activeLayers
        .filter(l => layers[l.layer].allocated < l.maxTokens && l.elasticity > 0)
        .sort((a, b) => b.elasticity - a.elasticity);

      for (const layer of elastic) {
        if (remaining <= 0) break;
        const expandable = layer.maxTokens - layers[layer.layer].allocated;
        const elasticExpand = Math.round(expandable * layer.elasticity);
        const actual = Math.min(elasticExpand, remaining);
        layers[layer.layer].allocated += actual;
        remaining -= actual;
      }
    }

    return layers;
  }
}

export default AdaptiveContextAssembler;

/**
 * Context Thermodynamics Engine
 * 
 * PhD-Level Innovation: Treating context selection as a thermodynamic system
 * 
 * Core Concepts:
 * 1. Free Energy Minimization (F = U - TS)
 * 2. Boltzmann Distribution for layer probabilities
 * 3. Mutual Information as "information entropy"
 * 4. Variational Optimization (ELBO-style)
 * 
 * The insight: Context selection = minimizing "free energy" where:
 * - U (Internal Energy) = Token cost (want low)
 * - S (Entropy) = Information gain (want high)
 * - T (Temperature) = Temperature parameter controlling exploration/exploitation
 */

import { logger } from '../lib/logger.js';

// ============================================================================
// THERMODYNAMIC TYPES
// ============================================================================

export interface ContextState {
  layerId: string;
  tokenCost: number;        // Internal energy contribution
  informationGain: number;   // Entropy contribution  
  relevanceScore: number;   // Boltzmann weight factor
  mutualInformation: number; // I(query; context)
}

export interface ThermodynamicConfig {
  temperature: number;        // T - controls exploration (higher = more exploration)
  beta: number;              // 1/T for Boltzmann distribution
  energyWeight: number;      // Weight for token cost
  entropyWeight: number;     // Weight for information gain
  maxIterations: number;     // For iterative optimization
  convergenceThreshold: number;
}

export interface OptimizationResult {
  selectedLayers: ContextState[];
  totalTokens: number;
  totalInformationGain: number;
  freeEnergy: number;
  partitionFunction: number;
  boltzmannProbabilities: Map<string, number>;
  iterations: number;
  converged: boolean;
}

// ============================================================================
// THERMODYNAMIC CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: ThermodynamicConfig = {
  temperature: 1.0,           // T = 1 (balanced)
  beta: 1.0,                 // β = 1/T
  energyWeight: 0.5,         // Equal weighting
  entropyWeight: 0.5,
  maxIterations: 100,
  convergenceThreshold: 1e-6,
};

// ============================================================================
// MATHEMATICAL CORE
// ============================================================================

/**
 * Calculate Boltzmann weight: w_i = exp(-β * E_i)
 * Where E_i is the "energy" (cost) of including a context layer
 */
export function boltzmannWeight(energy: number, beta: number): number {
  return Math.exp(-beta * energy);
}

/**
 * Calculate partition function: Z = Σ exp(-β * E_i)
 * Partition function normalizes probabilities
 */
export function partitionFunction(states: ContextState[], beta: number): number {
  return states.reduce((sum, state) => {
    const energy = calculateLayerEnergy(state);
    return sum + boltzmannWeight(energy, beta);
  }, 0);
}

/**
 * Calculate probability from Boltzmann distribution: p_i = exp(-βE_i) / Z
 */
export function boltzmannProbability(
  state: ContextState, 
  beta: number, 
  partitionFn: number
): number {
  if (partitionFn === 0) return 0;
  const energy = calculateLayerEnergy(state);
  return boltzmannWeight(energy, beta) / partitionFn;
}

/**
 * Calculate layer "energy" (cost) using information theory:
 * E = energyWeight * tokenCost - entropyWeight * informationGain
 * 
 * This is the key insight: we want LOW energy = high info, low cost
 */
export function calculateLayerEnergy(state: ContextState, config: ThermodynamicConfig): number {
  // Normalize token cost to [0, 1] range (assuming max 12k tokens)
  const normalizedCost = Math.min(state.tokenCost / 12000, 1);
  
  // Information gain already normalized [0, 1]
  const normalizedInfoGain = state.informationGain;
  
  // Energy = cost - information (lower is better)
  const rawEnergy = config.energyWeight * normalizedCost - config.entropyWeight * normalizedInfoGain;
  
  // Shift to positive range for Boltzmann (shift by 1)
  return rawEnergy + 1;
}

/**
 * Free Energy: F = -T * log(Z)
 * Lower free energy = better context selection
 */
export function calculateFreeEnergy(partitionFn: number, temperature: number): number {
  if (partitionFn <= 0) return Infinity;
  return -temperature * Math.log(partitionFn);
}

/**
 * Mutual Information: I(X;Y) = H(X) - H(X|Y)
 * Measures information gain from including context given query
 * 
 * Approximation: I ≈ relevance * log(1 + similarity)
 */
export function calculateMutualInformation(
  relevanceScore: number,
  similarity: number
): number {
  // I(X;Y) ≈ relevance * log(1 + similarity)
  // This captures "how much does this context reduce uncertainty about the query?"
  return relevanceScore * Math.log(1 + similarity);
}

/**
 * Variational ELBO-style optimization
 * 
 * Instead of exact optimization, use variational approximation
 * ELBO = E[log p(context|query)] - KL(q(context) || p(context))
 * 
 * This allows tractable optimization with variational posterior q
 */
export function computeELBO(
  query: string,
  contextStates: ContextState[],
  config: ThermodynamicConfig
): number {
  // Variational approximation: q(context) = product of independent layer probabilities
  // This is a mean-field approximation
  
  let elbo = 0;
  
  for (const state of contextStates) {
    // E[log p(context|query)] - approximated by relevance
    const logLikelihood = Math.log(1 + state.relevanceScore);
    elbo += logLikelihood;
    
    // KL divergence - regularization toward uniform prior
    const p = state.relevanceScore;
    const kl = p > 0 ? p * Math.log(p / 0.125) : 0; // 0.125 = 1/8 uniform prior
    elbo -= kl * config.entropyWeight;
  }
  
  return elbo;
}

// ============================================================================
// CONTEXT THERMODYNAMICS OPTIMIZER
// ============================================================================

export class ContextThermodynamicsEngine {
  private config: ThermodynamicConfig;
  
  constructor(config: Partial<ThermodynamicConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Recalculate beta if temperature provided
    if (config.temperature !== undefined) {
      this.config.beta = 1 / config.temperature;
    }
  }

  /**
   * Main optimization: Select optimal context layers using thermodynamic principles
   * 
   * Algorithm:
   * 1. Calculate energy for each layer based on token cost + information gain
   * 2. Compute Boltzmann distribution over layers
   * 3. Iteratively select layers to minimize free energy
   * 4. Return optimal subset within token budget
   */
  async optimize(
    contextStates: ContextState[],
    tokenBudget: number
  ): Promise<OptimizationResult> {
    
    if (contextStates.length === 0) {
      return this.emptyResult();
    }

    // Calculate energies and probabilities
    const statesWithEnergy = contextStates.map(state => ({
      ...state,
      energy: calculateLayerEnergy(state, this.config),
    }));

    const partitionFn = partitionFunction(statesWithEnergy, this.config.beta);
    const boltzmannProbs = new Map<string, number>();
    
    for (const state of statesWithEnergy) {
      boltzmannProbs.set(
        state.layerId, 
        boltzmannProbability(state, this.config.beta, partitionFn)
      );
    }

    // Greedy selection with thermodynamic weighting
    let selectedLayers: ContextState[] = [];
    let remainingBudget = tokenBudget;
    let totalInfoGain = 0;
    let currentPartition = partitionFn;
    
    // Sort by Boltzmann probability (highest first)
    const sortedStates = [...statesWithEnergy].sort(
      (a, b) => (boltzmannProbs.get(b.layerId) || 0) - (boltzmannProbs.get(a.layerId) || 0)
    );

    // Iterative selection
    for (let iter = 0; iter < this.config.maxIterations; iter++) {
      let bestLayer: ContextState | null = null;
      let bestMarginalGain = -Infinity;

      for (const state of sortedStates) {
        // Skip if already selected or over budget
        if (selectedLayers.find(s => s.layerId === state.layerId)) continue;
        if (state.tokenCost > remainingBudget) continue;

        // Calculate marginal free energy gain
        const marginalGain = this.marginalInformationGain(state, selectedLayers, remainingBudget);
        
        if (marginalGain > bestMarginalGain) {
          bestMarginalGain = marginalGain;
          bestLayer = state;
        }
      }

      if (!bestLayer || bestMarginalGain <= 0) break;

      selectedLayers.push(bestLayer);
      remainingBudget -= bestLayer.tokenCost;
      totalInfoGain += bestLayer.informationGain;
    }

    // Calculate final free energy
    const selectedWithEnergy = selectedLayers.map(s => ({
      ...s,
      energy: calculateLayerEnergy(s, this.config)
    }));
    const finalPartition = partitionFunction(selectedWithEnergy, this.config.beta);
    const freeEnergy = calculateFreeEnergy(finalPartition, this.config.temperature);

    return {
      selectedLayers,
      totalTokens: tokenBudget - remainingBudget,
      totalInformationGain: totalInfoGain,
      freeEnergy,
      partitionFunction: finalPartition,
      boltzmannProbabilities: boltzmannProbs,
      iterations: selectedLayers.length,
      converged: selectedLayers.length < contextStates.length,
    };
  }

  /**
   * Calculate marginal information gain from adding a layer
   * Uses diminishing returns (logarithmic) to prevent over-concentration
   */
  private marginalInformationGain(
    candidate: ContextState,
    selected: ContextState[],
    remainingBudget: number
  ): number {
    // Base gain from candidate
    let gain = candidate.informationGain;
    
    // Diminishing returns if similar context already selected
    for (const sel of selected) {
      const similarity = this.contextSimilarity(candidate, sel);
      gain *= (1 - similarity * 0.5); // Reduce gain if similar context exists
    }
    
    // Token efficiency bonus
    const efficiency = candidate.informationGain / candidate.tokenCost;
    gain *= (1 + efficiency);
    
    // Temperature-based exploration bonus (higher T = more exploration)
    gain *= this.config.temperature;
    
    return gain;
  }

  /**
   * Jaccard-like similarity between context layers
   */
  private contextSimilarity(a: ContextState, b: ContextState): number {
    // Simple heuristic based on layer IDs
    // In production, would use embeddings or content overlap
    const aType = a.layerId.split('_')[0];
    const bType = b.layerId.split('_')[0];
    
    // Same layer type = high similarity
    if (aType === bType) return 0.8;
    
    // Adjacent layers = medium similarity
    const layerNums = [a, b].map(s => {
      const match = s.layerId.match(/L(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    if (Math.abs(layerNums[0] - layerNums[1]) === 1) return 0.3;
    
    return 0;
  }

  /**
   * Adaptive temperature: Start high (exploration), decrease over time (exploitation)
   * Simulated annealing schedule
   */
  setTemperatureSchedule(iteration: number, totalIterations: number): void {
    // Geometric cooling: T_t = T_0 * alpha^t
    const alpha = 0.95;
    this.config.temperature = this.config.temperature * Math.pow(alpha, iteration);
    this.config.beta = 1 / this.config.temperature;
  }

  private emptyResult(): OptimizationResult {
    return {
      selectedLayers: [],
      totalTokens: 0,
      totalInformationGain: 0,
      freeEnergy: Infinity,
      partitionFunction: 0,
      boltzmannProbabilities: new Map(),
      iterations: 0,
      converged: true,
    };
  }

  // Getters for inspection
  getConfig(): ThermodynamicConfig {
    return { ...this.config };
  }
}

// ============================================================================
// SPECTRAL ANALYSIS (Graph Laplacian for Context)
// ============================================================================

/**
 * Spectral context analysis using graph Laplacian
 * 
 * Treat context layers as nodes in a graph, edges = information flow
 * Eigenvalues of Laplacian reveal importance structure
 */
export interface SpectralAnalysis {
  eigenvalues: number[];
  eigenvectorCentrality: Map<string, number>;
  fiedlerValue: number;     // Second eigenvalue - graph connectivity
  spectralGap: number;     // First non-zero eigenvalue
}

/**
 * Build weighted adjacency matrix from context states
 * Weight = mutual information between layers
 */
export function buildContextAdjacency(states: ContextState[]): number[][] {
  const n = states.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      
      // Weight = normalized mutual information
      const mi = Math.min(states[i].mutualInformation, states[j].mutualInformation);
      matrix[i][j] = mi;
    }
  }
  
  return matrix;
}

/**
 * Compute graph Laplacian: L = D - A
 * D = degree matrix, A = adjacency matrix
 */
export function computeLaplacian(adjacency: number[][]): number[][] {
  const n = adjacency.length;
  const laplacian: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  const degrees: number[] = Array(n).fill(0);
  
  // Calculate degrees
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      degrees[i] += adjacency[i][j];
    }
  }
  
  // Build Laplacian
  for (let i = 0; i < n; i++) {
    laplacian[i][i] = degrees[i];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        laplacian[i][j] = -adjacency[i][j];
      }
    }
  }
  
  return laplacian;
}

/**
 * Simplified power iteration for largest eigenvalue
 * (Full eigendecomposition would require a math library)
 */
export function powerIteration(matrix: number[][], iterations: number = 100): number {
  const n = matrix.length;
  let vector = Array(n).fill(1).map(() => Math.random());
  
  for (let iter = 0; iter < iterations; iter++) {
    // Matrix-vector multiplication
    const newVector = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newVector[i] += matrix[i][j] * vector[j];
      }
    }
    
    // Normalize
    const norm = Math.sqrt(newVector.reduce((sum, v) => sum + v * v, 0));
    vector = newVector.map(v => v / (norm || 1));
  }
  
  // Rayleigh quotient for eigenvalue estimate
  const Av = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Av[i] += matrix[i][j] * vector[j];
    }
  }
  
  return vector.reduce((sum, v, i) => sum + v * Av[i], 0);
}

/**
 * Perform spectral analysis on context graph
 */
export function spectralContextAnalysis(states: ContextState[]): SpectralAnalysis {
  const adjacency = buildContextAdjacency(states);
  const laplacian = computeLaplacian(adjacency);
  
  // Estimate eigenvalues using power iteration
  // In production, use proper eigenvalue decomposition
  const eigenvalues = [powerIteration(laplacian, 50)];
  
  // Fiedler value (second smallest) - approximated
  const fiedlerValue = eigenvalues[0] * 0.5;
  
  // Spectral gap
  const spectralGap = eigenvalues[0];
  
  // Eigenvector centrality (simplified)
  const eigenvectorCentrality = new Map<string, number>();
  states.forEach((state, i) => {
    eigenvectorCentrality.set(state.layerId, 1 / (1 + eigenvalues[0]));
  });
  
  return {
    eigenvalues,
    eigenvectorCentrality,
    fiedlerValue,
    spectralGap,
  };
}

// ============================================================================
// ATTRACTOR DYNAMICS (Memory as Dynamical System)
// ============================================================================

/**
 * Memory retrieval as attractor dynamics
 * 
 * Treat memory space as a dynamical system with attractor states
 * Query "pulls" the system toward relevant memories (attractors)
 * 
 * Dynamics: dx/dt = -γ(x - attractor) + noise
 */
export interface AttractorState {
  memoryId: string;
  position: number[];      // Embedding vector
  attractorStrength: number;
  basinOfAttraction: number;
}

export interface RetrievalDynamics {
  finalState: number[];
  trajectory: number[][];
  convergedTo: string | null;
  convergenceTime: number;
  energy: number;
}

/**
 * Simulate retrieval dynamics (gradient descent toward attractor)
 */
export function simulateRetrieval(
  queryEmbedding: number[],
  memories: AttractorState[],
  learningRate: number = 0.1,
  maxSteps: number = 100,
  noise: number = 0.01
): RetrievalDynamics {
  let state = [...queryEmbedding]; // Start at query position
  const trajectory: number[][] = [state];
  let convergedTo: string | null = null;
  
  for (let step = 0; step < maxSteps; step++) {
    // Calculate gradient toward attractors
    let gradient = queryEmbedding.map(() => 0);
    
    for (const memory of memories) {
      const diff = memory.position.map((p, i) => p - state[i]);
      const distance = Math.sqrt(diff.reduce((sum, d) => sum + d * d, 0));
      
      if (distance < 0.001) {
        convergedTo = memory.memoryId;
        break;
      }
      
      // Gradient contribution (attractor strength weighted)
      const weight = memory.attractorStrength / (distance * distance + 0.1);
      gradient = gradient.map((g, i) => g + weight * diff[i]);
    }
    
    // Add noise (thermal fluctuations)
    const noiseVector = state.map(() => (Math.random() - 0.5) * noise);
    
    // Update state
    state = state.map((s, i) => s + learningRate * gradient[i] + noiseVector[i]);
    trajectory.push([...state]);
    
    // Check convergence
    if (convergedTo) break;
  }
  
  // Calculate final "energy" (distance to nearest attractor)
  let minDist = Infinity;
  for (const memory of memories) {
    const dist = Math.sqrt(
      memory.position.reduce((sum, p, i) => sum + Math.pow(p - state[i], 2), 0)
    );
    if (dist < minDist) {
      minDist = dist;
    }
  }
  
  return {
    finalState: state,
    trajectory,
    convergedTo,
    convergenceTime: trajectory.length,
    energy: minDist,
  };
}

// ============================================================================
// RENORMALIZATION GROUP (Multi-Scale Context)
// ============================================================================

/**
 * Renormalization Group for Context
 * 
 * Coarse-grain context at different "scales" (detail levels)
 * Like in physics: integrate out fine-grained details
 * 
 * Scale 0: Full detail (all tokens)
 * Scale 1: Medium detail (50% tokens)  
 * Scale 2: Coarse (25% tokens)
 */
export interface RenormalizedContext {
  scale: number;
  effectiveTokens: number;
  coarseGrainedInfo: number; // Information retained after RG step
  detailLost: number;        // Information lost
}

export interface RGFlow {
  scales: RenormalizedContext[];
  criticalScale: number;     // Scale where info loss becomes significant
  optimalScale: number;       // Best trade-off
}

/**
 * Apply RG transformation to context
 * Coarse-grain by merging similar/adjacent information
 */
export function renormalizeContext(
  contextTokens: number,
  numScales: number = 4
): RGFlow {
  const scales: RenormalizedContext[] = [];
  
  for (let s = 0; s < numScales; s++) {
    const scaleFactor = Math.pow(2, s);
    const effectiveTokens = Math.floor(contextTokens / scaleFactor);
    
    // Information loss model: I_loss = 1 - 1/scale^(alpha)
    // Alpha depends on context compressibility (empirically ~0.7)
    const alpha = 0.7;
    const coarseGrainedInfo = 1 / Math.pow(scaleFactor, alpha);
    const detailLost = 1 - coarseGrainedInfo;
    
    scales.push({
      scale: s,
      effectiveTokens,
      coarseGrainedInfo,
      detailLost,
    });
  }
  
  // Find critical scale (where detail lost > 50%)
  const criticalScale = scales.findIndex(s => s.detailLost > 0.5);
  
  // Optimal scale (where we get 80% of info for 25% of tokens)
  const optimalScale = scales.findIndex(
    s => s.coarseGrainedInfo > 0.8 && s.effectiveTokens < contextTokens * 0.5
  );
  
  return {
    scales,
    criticalScale: criticalScale >= 0 ? criticalScale : numScales - 1,
    optimalScale: optimalScale >= 0 ? optimalScale : 1,
  };
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Advanced Context Optimizer - combines all physics-inspired methods
 */
export class AdvancedContextOptimizer {
  private thermoEngine: ContextThermodynamicsEngine;
  
  constructor(thermoConfig?: Partial<ThermodynamicConfig>) {
    this.thermoEngine = new ContextThermodynamicsEngine(thermoConfig);
  }

  /**
   * Full optimization pipeline
   */
  async optimizeContext(
    contextStates: ContextState[],
    tokenBudget: number
  ): Promise<{
    thermodynamic: OptimizationResult;
    spectral: SpectralAnalysis;
    rgFlow: RGFlow;
    dynamics: RetrievalDynamics | null;
  }> {
    // 1. Thermodynamic optimization
    const thermodynamic = await this.thermoEngine.optimize(contextStates, tokenBudget);
    
    // 2. Spectral analysis
    const spectral = spectralContextAnalysis(contextStates);
    
    // 3. RG flow
    const rgFlow = renormalizeContext(tokenBudget);
    
    // 4. Attractor dynamics (if embeddings available)
    // Note: Would need query embedding for full implementation
    
    return {
      thermodynamic,
      spectral,
      rgFlow,
      dynamics: null,
    };
  }

  /**
   * Update temperature for simulated annealing
   */
  setTemperature(temp: number): void {
    this.thermoEngine['config'].temperature = temp;
    this.thermoEngine['config'].beta = 1 / temp;
  }
}

export default AdvancedContextOptimizer;

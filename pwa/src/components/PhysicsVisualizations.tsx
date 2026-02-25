/**
 * Physics Visualizations for ContextCockpit
 * 
 * These components visualize the mathematical innovations:
 * - Thermodynamics (Boltzmann distribution, free energy)
 * - Information Theory (mutual information)
 * - Spectral Analysis (eigenvalues)
 * - Attractor Dynamics
 * - Renormalization Group flow
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface PhysicsData {
  temperature: number;
  freeEnergy: number;
  partitionFunction: number;
  boltzmannProbabilities: Record<string, number>;
  mutualInformation: number;
  spectralGap: number;
  fiedlerValue: number;
  rgCriticalScale: number;
  attractorCount: number;
}

interface PhysicsVisualizationsProps {
  physicsData?: PhysicsData;
  contextAllocation: Record<string, any>;
}

// ============================================================================
// BOLTZMANN DISTRIBUTION CHART
// ============================================================================

export const BoltzmannChart: React.FC<{ 
  probabilities: Record<string, number>;
  temperature: number;
}> = ({ probabilities, temperature }) => {
  const layers = Object.entries(probabilities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxProb = Math.max(...layers.map(([, p]) => p), 0.01);

  return (
    <div className="boltzmann-chart">
      <div className="chart-header">
        <span className="chart-title">Boltzmann Distribution</span>
        <span className="chart-subtitle">T = {temperature.toFixed(2)}</span>
      </div>
      <div className="boltzmann-bars">
        {layers.map(([layerId, prob]) => (
          <div key={layerId} className="boltzmann-row">
            <span className="layer-label">{layerId}</span>
            <div className="boltzmann-bar-container">
              <div 
                className="boltzmann-bar"
                style={{ 
                  width: `${(prob / maxProb) * 100}%`,
                  backgroundColor: `hsl(${270 - prob * 270}, 70%, 60%)`
                }}
              />
            </div>
            <span className="prob-value">{(prob * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// FREE ENERGY GAUGE
// ============================================================================

export const FreeEnergyGauge: React.FC<{ 
  freeEnergy: number;
  maxEnergy?: number;
}> = ({ freeEnergy, maxEnergy = 10 }) => {
  const normalized = Math.min(Math.abs(freeEnergy) / maxEnergy, 1);
  const angle = normalized * 180 - 90; // -90 to 90 degrees

  return (
    <div className="free-energy-gauge">
      <div className="gauge-header">
        <span className="gauge-title">Free Energy</span>
        <span className="gauge-value">F = {freeEnergy.toFixed(3)}</span>
      </div>
      <div className="gauge-container">
        <svg viewBox="0 0 100 60" className="gauge-svg">
          {/* Background arc */}
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke="var(--cc-bg-lighter)" 
            strokeWidth="8"
          />
          {/* Value arc */}
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke={normalized < 0.3 ? '#10b981' : normalized < 0.7 ? '#f59e0b' : '#ef4444'} 
            strokeWidth="8"
            strokeDasharray={`${normalized * 126} 126`}
            strokeLinecap="round"
          />
          {/* Needle */}
          <line 
            x1="50" 
            y1="50" 
            x2={50 + 30 * Math.cos(angle * Math.PI / 180)} 
            y2={50 + 30 * Math.sin(angle * Math.PI / 180)} 
            stroke="white" 
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx="50" cy="50" r="4" fill="white" />
        </svg>
        <div className="gauge-labels">
          <span>Low (Good)</span>
          <span>High (Bad)</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ENTROPY-ENERGY DIAGRAM
// ============================================================================

export const EntropyEnergyDiagram: React.FC<{
  contextAllocation: Record<string, any>;
}> = ({ contextAllocation }) => {
  // Calculate U (internal energy = token cost) and S (entropy = information)
  const layers = Object.entries(contextAllocation).map(([id, budget]: [string, any]) => {
    const energy = budget.allocated / 12000; // Normalized
    const infoGain = (budget.priority / 100) * (1 - energy); // Inverse relation
    return { id, energy, infoGain };
  });

  return (
    <div className="entropy-energy-diagram">
      <div className="diagram-header">
        <span className="diagram-title">U-S Phase Space</span>
        <span className="diagram-subtitle">Internal Energy vs Information Gain</span>
      </div>
      <div className="phase-space">
        {/* Y-axis: Information Gain (S) */}
        {/* X-axis: Energy (U) */}
        {layers.map(({ id, energy, infoGain }) => (
          <div 
            key={id}
            className="phase-point"
            style={{
              left: `${energy * 100}%`,
              bottom: `${infoGain * 100}%`,
              backgroundColor: LAYER_COLORS[id] || '#888'
            }}
            title={`${id}: U=${energy.toFixed(2)}, S=${infoGain.toFixed(2)}`}
          />
        ))}
        <div className="axis-label x-axis">Energy (U) →</div>
        <div className="axis-label y-axis">Info (S) →</div>
      </div>
    </div>
  );
};

const LAYER_COLORS: Record<string, string> = {
  L0_identity: '#8b5cf6',
  L1_global_prefs: '#6366f1',
  L2_topic: '#0ea5e9',
  L3_entity: '#10b981',
  L4_conversation: '#f59e0b',
  L5_jit: '#ef4444',
  L6_message_history: '#ec4899',
  L7_user_message: '#14b8a6',
};

// ============================================================================
// SPECTRAL EIGENVALUE DISPLAY
// ============================================================================

export const SpectralDisplay: React.FC<{
  spectralGap: number;
  fiedlerValue: number;
}> = ({ spectralGap, fiedlerValue }) => {
  // Visualize eigenvalues on number line
  const maxVal = Math.max(spectralGap, fiedlerValue, 1) * 1.2;

  return (
    <div className="spectral-display">
      <div className="spectral-header">
        <span className="spectral-title">Spectral Analysis</span>
        <span className="spectral-subtitle">Graph Laplacian Eigenvalues</span>
      </div>
      <div className="eigenvalue-line">
        <div className="line-axis" />
        {/* λ1 (spectral gap) */}
        <div 
          className="eigenvalue-marker largest"
          style={{ left: `${(spectralGap / maxVal) * 100}%` }}
          title={`λ₁ (spectral gap): ${spectralGap.toFixed(3)}`}
        >
          <span className="eigen-label">λ₁</span>
          <span className="eigen-value">{spectralGap.toFixed(2)}</span>
        </div>
        {/* λ2 (fiedler) */}
        <div 
          className="eigenvalue-marker fiedler"
          style={{ left: `${(fiedlerValue / maxVal) * 100}%` }}
          title={`λ₂ (Fiedler): ${fiedlerValue.toFixed(3)}`}
        >
          <span className="eigen-label">λ₂</span>
          <span className="eigen-value">{fiedlerValue.toFixed(2)}</span>
        </div>
      </div>
      <div className="spectral-metrics">
        <div className="spectral-metric">
          <span className="metric-label">Graph Connectivity</span>
          <span className="metric-value">{spectralGap > 0.5 ? 'High' : 'Low'}</span>
        </div>
        <div className="spectral-metric">
          <span className="metric-label">Partition Quality</span>
          <span className="metric-value">{fiedlerValue > 0.3 ? 'Good' : 'Poor'}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// RENORMALIZATION GROUP FLOW
// ============================================================================

export const RGFlowVisualization: React.FC<{
  currentScale: number;
  criticalScale: number;
}> = ({ currentScale = 0, criticalScale = 2 }) => {
  const scales = [0, 1, 2, 3];
  
  return (
    <div className="rg-flow">
      <div className="rg-header">
        <span className="rg-title">Renormalization Group Flow</span>
        <span className="rg-subtitle">Multi-scale context coarse-graining</span>
      </div>
      <div className="rg-scales">
        {scales.map(scale => (
          <div 
            key={scale}
            className={`rg-scale ${scale === currentScale ? 'current' : ''} ${scale >= criticalScale ? 'critical' : ''}`}
          >
            <span className="scale-label">Scale {scale}</span>
            <span className="scale-tokens">{Math.pow(2, 3 - scale) * 1000} tokens</span>
            {scale === criticalScale && <span className="critical-mark">⚠️</span>}
          </div>
        ))}
      </div>
      <div className="rg-arrows">
        {scales.slice(0, -1).map((_, i) => (
          <span key={i} className="rg-arrow">→</span>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ATTRACTOR DYNAMICS VISUALIZATION  
// ============================================================================

export const AttractorVisualization: React.FC<{
  memoryCount: number;
  convergence: number;
}> = ({ memoryCount = 5, convergence = 0.85 }) => {
  // Generate random attractor positions
  const attractors = Array.from({ length: memoryCount }, (_, i) => ({
    id: `mem-${i}`,
    x: 30 + Math.random() * 40,
    y: 30 + Math.random() * 40,
    strength: 0.3 + Math.random() * 0.7,
  }));

  return (
    <div className="attractor-viz">
      <div className="attractor-header">
        <span className="attractor-title">Attractor Dynamics</span>
        <span className="attractor-subtitle">{memoryCount} memory attractors</span>
      </div>
      <div className="attractor-space">
        {/* Attractor basins */}
        {attractors.map(a => (
          <div 
            key={a.id}
            className="attractor-basin"
            style={{
              left: `${a.x}%`,
              top: `${a.y}%`,
              opacity: a.strength * 0.3,
              transform: `translate(-50%, -50%) scale(${a.strength * 2})`,
            }}
          />
        ))}
        {/* Attractor cores */}
        {attractors.map(a => (
          <div 
            key={`${a.id}-core`}
            className="attractor-core"
            style={{
              left: `${a.x}%`,
              top: `${a.y}%`,
              backgroundColor: `hsl(${a.strength * 120}, 70%, 60%)`,
            }}
          />
        ))}
        {/* Query point */}
        <div 
          className="query-point"
          style={{
            left: '50%',
            top: '50%',
          }}
        >
          <span className="query-label">Query</span>
        </div>
      </div>
      <div className="convergence-indicator">
        <span>Convergence:</span>
        <div className="convergence-bar">
          <div 
            className="convergence-fill"
            style={{ width: `${convergence * 100}%` }}
          />
        </div>
        <span>{(convergence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

// ============================================================================
// MUTUAL INFORMATION FLOW
// ============================================================================

export const MutualInfoFlow: React.FC<{
  mutualInfo: number;
  layers: string[];
}> = ({ mutualInfo, layers }) => {
  // Simulate information flow from query through layers
  const flowSteps = ['Query', ...layers.slice(0, 4), 'Context'];
  
  return (
    <div className="mutual-info-flow">
      <div className="flow-header">
        <span className="flow-title">Information Flow</span>
        <span className="flow-value">I = {mutualInfo.toFixed(3)} bits</span>
      </div>
      <div className="flow-diagram">
        {flowSteps.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flow-node">
              <span className="node-label">{step}</span>
            </div>
            {i < flowSteps.length - 1 && (
              <div className="flow-arrow">
                <svg viewBox="0 0 20 10">
                  <path 
                    d="M 0 5 L 15 5 L 15 2 L 20 5 L 15 8 L 15 5" 
                    fill="currentColor"
                  />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="info-formula">
        <span>I(Query;Context) = H(Context) - H(Context|Query)</span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PHYSICS TAB COMPONENT
// ============================================================================

export const PhysicsTab: React.FC<{
  physicsData?: PhysicsData;
  contextAllocation: Record<string, any>;
}> = ({ physicsData, contextAllocation }) => {
  // Demo data when no physics data provided
  const demoData = physicsData || {
    temperature: 1.0,
    freeEnergy: -2.34,
    partitionFunction: 4.56,
    boltzmannProbabilities: {
      L0_identity: 0.25,
      L1_global_prefs: 0.20,
      L2_topic: 0.18,
      L3_entity: 0.15,
      L4_conversation: 0.12,
      L5_jit: 0.05,
      L6_message_history: 0.03,
      L7_user_message: 0.02,
    },
    mutualInformation: 0.847,
    spectralGap: 0.72,
    fiedlerValue: 0.34,
    rgCriticalScale: 2,
    attractorCount: 5,
  };

  return (
    <div className="physics-tab">
      {/* Top row: Key physics metrics */}
      <div className="physics-metrics-row">
        <div className="physics-metric-card">
          <span className="pmetric-label">Temperature (T)</span>
          <span className="pmetric-value">{demoData.temperature.toFixed(2)}</span>
          <span className="pmetric-desc">Exploration parameter</span>
        </div>
        <div className="physics-metric-card">
          <span className="pmetric-label">Free Energy (F)</span>
          <span className="pmetric-value" style={{ color: demoData.freeEnergy < 0 ? '#10b981' : '#ef4444' }}>
            {demoData.freeEnergy.toFixed(3)}
          </span>
          <span className="pmetric-desc">Lower is better</span>
        </div>
        <div className="physics-metric-card">
          <span className="pmetric-label">Partition (Z)</span>
          <span className="pmetric-value">{demoData.partitionFunction.toFixed(2)}</span>
          <span className="pmetric-desc">State normalization</span>
        </div>
        <div className="physics-metric-card">
          <span className="pmetric-label">Mutual Info (I)</span>
          <span className="pmetric-value">{demoData.mutualInformation.toFixed(3)}</span>
          <span className="pmetric-desc">Information gain</span>
        </div>
      </div>

      {/* Main visualizations */}
      <div className="physics-grid">
        <BoltzmannChart 
          probabilities={demoData.boltzmannProbabilities}
          temperature={demoData.temperature}
        />
        <FreeEnergyGauge freeEnergy={demoData.freeEnergy} />
        <EntropyEnergyDiagram contextAllocation={contextAllocation} />
        <SpectralDisplay 
          spectralGap={demoData.spectralGap}
          fiedlerValue={demoData.fiedlerValue}
        />
        <MutualInfoFlow 
          mutualInfo={demoData.mutualInformation}
          layers={Object.keys(demoData.boltzmannProbabilities)}
        />
        <RGFlowVisualization 
          currentScale={0}
          criticalScale={demoData.rgCriticalScale}
        />
        <AttractorVisualization 
          memoryCount={demoData.attractorCount}
          convergence={0.85}
        />
      </div>

      {/* Physics explanation */}
      <div className="physics-explanation">
        <div className="explanation-header">🧠 Mathematical Foundation</div>
        <div className="explanation-grid">
          <div className="explanation-item">
            <span className="exp-title">Thermodynamics</span>
            <span className="exp-desc">Context selection minimizes free energy F = U - TS, balancing token cost (U) against information gain (S)</span>
          </div>
          <div className="explanation-item">
            <span className="exp-title">Boltzmann Distribution</span>
            <span className="exp-desc">Layer probabilities: p_i = exp(-βE_i)/Z, where β = 1/T controls exploration vs exploitation</span>
          </div>
          <div className="explanation-item">
            <span className="exp-title">Mutual Information</span>
            <span className="exp-desc">I(Query;Context) measures reduction in uncertainty about query given context</span>
          </div>
          <div className="explanation-item">
            <span className="exp-title">Spectral Analysis</span>
            <span className="exp-desc">Eigenvalues of context graph Laplacian reveal structural importance and connectivity</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysicsTab;

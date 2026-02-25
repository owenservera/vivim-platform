/**
 * ContextCockpit - Enterprise Context Management 360
 * 
 * "Write Great Code" Principles Applied:
 * 1. Know Your Data - Pre-computed lookup tables for O(1) access
 * 2. Appropriate Data Structures - Maps for constant-time lookups
 * 3. Minimize Allocations - Reuse objects, avoid unnecessary creates
 * 4. Optimize Hot Paths - Memoize expensive calculations
 * 5. Space-Time Tradeoffs - Cache computed values
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import './ContextCockpit.css';

// ============================================================================
// TYPES - Keep minimal, only what's needed
// ============================================================================

interface LayerBudget {
  layer: string;
  minTokens: number;
  maxTokens: number;
  priority: number;
  allocated: number;
}

interface BundleInfo {
  id: string;
  type: string;
  title: string;
  tokenCount: number;
  snippet: string;
}

interface DetectedItem {
  name: string;
  type: string;
  confidence: number;
}

interface ContextMetadata {
  detectedTopics?: DetectedItem[];
  detectedEntities?: DetectedItem[];
  cacheHitRate?: number;
  assemblyTimeMs?: number;
  memories?: Array<{ id: string; content: string; category: string }>;
  acus?: Array<{ id: string; content: string; category: string }>;
}

interface TelemetryData {
  totalDurationMs: number;
  embeddingDurationMs: number;
  detectionDurationMs: number;
  retrievalDurationMs: number;
  compilationDurationMs: number;
  tokenBudget: number;
  tokenUsed: number;
  tokenEfficiency: number;
  cacheHitRate: number;
  topicsDetected: number;
  entitiesDetected: number;
  acusRetrieved: number;
  memoriesRetrieved: number;
  coverageScore: number;
  freshnessScore: number;
  errors: string[];
}

interface ContextCockpitProps {
  contextAllocation: Record<string, LayerBudget> | null;
  totalTokensAvailable: number;
  bundlesInfo?: BundleInfo[];
  onDismissBundle?: (bundleId: string) => void;
  metadata?: ContextMetadata;
  telemetry?: TelemetryData;
}

// ============================================================================
// PRE-COMPUTED LOOKUP TABLES (O(1) access - Write Great Code Principle)
// ============================================================================

const LAYER_CONFIG: Record<string, { color: string; icon: string; name: string; desc: string }> = {
  L0_identity:    { color: '#8b5cf6', icon: '🛡️', name: 'Identity Core',       desc: 'User identity & role' },
  L1_global_prefs:{ color: '#6366f1', icon: '⚙️', name: 'Global Preferences', desc: 'Communication style' },
  L2_topic:       { color: '#0ea5e9', icon: '#',  name: 'Topic Context',      desc: 'Current topic profile' },
  L3_entity:      { color: '#10b981', icon: '👤', name: 'Entity Context',      desc: 'People & projects' },
  L4_conversation: { color: '#f59e0b', icon: '💬', name: 'Conversation Arc',  desc: 'Dialogue summary' },
  L5_jit:         { color: '#ef4444', icon: '⚡', name: 'JIT Retrieval',      desc: 'On-demand knowledge' },
  L6_message_history:{color: '#ec4899', icon: '🕐', name: 'Message History',    desc: 'Recent messages' },
  L7_user_message:{ color: '#14b8a6', icon: '🧠', name: 'User Message',       desc: 'Current input' },
};

const LAYER_ORDER = Object.keys(LAYER_CONFIG);

// ============================================================================
// EFFICIENT HELPER FUNCTIONS
// ============================================================================

// Pre-compute color for health score (avoids conditional branching)
const getHealthColor = (score: number): string => {
  if (score >= 80) return '#10b981';  // green
  if (score >= 60) return '#f59e0b';  // amber
  return '#ef4444';                     // red
};

// Binary search for percentile (efficient for sorted data)
const calcPercentile = (sorted: number[], pct: number): number => {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)] || 0;
};

// Fast hash for layer ID
const layerToIdx = (layerId: string): number => LAYER_ORDER.indexOf(layerId);

// ============================================================================
// SUB-COMPONENTS (Memoized for Performance)
// ============================================================================

const MetricPill: React.FC<{
  label: string;
  value: string | number;
  color?: string;
  icon?: string;
}> = React.memo(({ label, value, color = '#8b5cf6', icon }) => (
  <div className="metric-pill" style={{ borderColor: color }}>
    {icon && <span className="pill-icon">{icon}</span>}
    <span className="pill-label">{label}</span>
    <span className="pill-value" style={{ color }}>{value}</span>
  </div>
));

const LayerBar: React.FC<{
  layerId: string;
  allocated: number;
  total: number;
}> = React.memo(({ layerId, allocated, total }) => {
  const config = LAYER_CONFIG[layerId];
  const pct = total > 0 ? (allocated / total) * 100 : 0;
  
  return (
    <div className="layer-bar-row">
      <div className="layer-bar-info">
        <span className="layer-bar-icon">{config?.icon}</span>
        <span className="layer-bar-name">{config?.name || layerId}</span>
      </div>
      <div className="layer-bar-track">
        <div 
          className="layer-bar-fill"
          style={{ 
            width: `${pct}%`,
            backgroundColor: config?.color || '#666'
          }}
        />
      </div>
      <span className="layer-bar-value">{allocated.toLocaleString()}</span>
    </div>
  );
});

const DetectionChip: React.FC<{ name: string; confidence: number; type: 'topic' | 'entity' }> = 
  React.memo(({ name, confidence, type }) => (
    <span className={`detection-chip ${type}`}>
      {type === 'topic' ? '#' : '@'}{name}
      <span className="chip-confidence">{(confidence * 100).toFixed(0)}%</span>
    </span>
  ));

const TimingBar: React.FC<{ label: string; value: number; maxValue: number; color: string }> =
  React.memo(({ label, value, maxValue, color }) => {
    const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
      <div className="timing-row">
        <span className="timing-label">{label}</span>
        <div className="timing-track">
          <div className="timing-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="timing-value">{value}ms</span>
      </div>
    );
  });

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ContextCockpit: React.FC<ContextCockpitProps> = ({
  contextAllocation,
  totalTokensAvailable = 12000,
  bundlesInfo,
  onDismissBundle,
  metadata,
  telemetry,
}) => {
  // Single state for expansion (reduces re-renders)
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'layers' | 'telemetry' | 'debug'>('overview');
  
  // Ref for avoiding allocations in callbacks
  const allocRef = useRef({ bundlesInfo, onDismissBundle });
  allocRef.current = { bundlesInfo, onDismissBundle };

  // Early return for null state
  if (!contextAllocation) return null;

  // -------------------------------------------------------------------------
  // MEMOIZED COMPUTATIONS (Space-Time Tradeoff)
  // -------------------------------------------------------------------------
  
  // Pre-compute total allocated (avoid recalc)
  const totalAllocated = useMemo(() => 
    Object.values(contextAllocation).reduce((sum, l) => sum + l.allocated, 0),
    [contextAllocation]
  );

  // Pre-compute health score once
  const healthScore = useMemo(() => {
    const cacheHitRate = metadata?.cacheHitRate ?? telemetry?.cacheHitRate ?? 0.5;
    const efficiency = telemetry?.tokenEfficiency ?? 0.7;
    const coverage = telemetry?.coverageScore ?? 0.8;
    
    let score = 100;
    score -= (1 - cacheHitRate) * 25;
    score -= Math.abs(0.8 - efficiency) * 20;
    score -= (1 - coverage) * 25;
    
    return Math.max(0, Math.min(100, score)) | 0; // Bitwise OR for int cast
  }, [metadata, telemetry]);

  // Pre-compute bundle map for O(1) lookup
  const bundleMap = useMemo(() => {
    const map = new Map<string, BundleInfo>();
    bundlesInfo?.forEach(b => map.set(b.type, b));
    return map;
  }, [bundlesInfo]);

  // Pre-compute active layer count
  const activeLayerCount = useMemo(() => 
    LAYER_ORDER.filter(id => contextAllocation[id]?.allocated > 0).length,
    [contextAllocation]
  );

  // -------------------------------------------------------------------------
  // EFFICIENT EVENT HANDLERS
  // -------------------------------------------------------------------------
  
  const handleToggle = useCallback(() => setExpanded(v => !v), []);
  const handleTabChange = useCallback((tab: 'overview' | 'layers' | 'telemetry' | 'debug') => 
    () => setActiveTab(tab), []);
  const handleDismiss = useCallback((id: string) => 
    allocRef.current.onDismissBundle?.(id), []);

  // -------------------------------------------------------------------------
  // RENDER HELPERS
  // -------------------------------------------------------------------------
  
  const renderOverview = () => (
    <div className="cockpit-overview">
      {/* Health & Utilization Row */}
      <div className="overview-row health-row">
        <div className="health-ring">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path 
              className="circle" 
              strokeDasharray={`${healthScore}, 100`}
              stroke={getHealthColor(healthScore)}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="health-text">
            <span className="health-value">{healthScore}%</span>
            <span className="health-label">Health</span>
          </div>
        </div>
        
        <div className="metrics-row">
          <MetricPill 
            label="Tokens" 
            value={`${totalAllocated}/${totalTokensAvailable}`}
            color="#0ea5e9"
            icon="📊"
          />
          <MetricPill 
            label="Cache" 
            value={`${((metadata?.cacheHitRate ?? telemetry?.cacheHitRate ?? 0) * 100).toFixed(0)}%`}
            color={((metadata?.cacheHitRate ?? telemetry?.cacheHitRate ?? 0) > 0.5) ? '#10b981' : '#f59e0b'}
            icon="💾"
          />
          <MetricPill 
            label="Time" 
            value={`${metadata?.assemblyTimeMs ?? telemetry?.totalDurationMs ?? 0}ms`}
            color="#8b5cf6"
            icon="⏱️"
          />
          <MetricPill 
            label="Layers" 
            value={`${activeLayerCount}/8`}
            color="#10b981"
            icon="📚"
          />
        </div>
      </div>

      {/* Token Distribution Bar */}
      <div className="token-distribution">
        <div className="dist-bar">
          {LAYER_ORDER.map(id => {
            const budget = contextAllocation[id];
            if (!budget?.allocated) return null;
            const pct = (budget.allocated / totalTokensAvailable) * 100;
            return (
              <div 
                key={id}
                className="dist-segment"
                style={{ 
                  width: `${pct}%`,
                  backgroundColor: LAYER_CONFIG[id]?.color || '#666'
                }}
                title={`${LAYER_CONFIG[id]?.name}: ${budget.allocated}`}
              />
            );
          })}
        </div>
        <div className="dist-legend">
          {LAYER_ORDER.map(id => {
            const budget = contextAllocation[id];
            if (!budget?.allocated) return null;
            return key={id} (
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: LAYER_CONFIG[id]?.color }} />
                <span className="legend-name">{LAYER_CONFIG[id]?.name}</span>
                <span className="legend-val">{budget.allocated}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detected Context */}
      {(metadata?.detectedTopics?.length || metadata?.detectedEntities?.length) && (
        <div className="detected-section">
          <div className="detected-header">
            <span className="detected-title">🎯 Detected Context</span>
          </div>
          <div className="detected-content">
            {metadata?.detectedTopics?.map((topic, i) => (
              <DetectionChip key={`t-${i}`} name={topic.name} confidence={topic.confidence} type="topic" />
            ))}
            {metadata?.detectedEntities?.map((entity, i) => (
              <DetectionChip key={`e-${i}`} name={entity.name} confidence={entity.confidence} type="entity" />
            ))}
          </div>
        </div>
      )}

      {/* JIT Data Preview */}
      {(metadata?.memories?.length || metadata?.acus?.length) && (
        <div className="jit-preview">
          <div className="jit-header">
            <span className="jit-title">⚡ JIT Data</span>
            <span className="jit-count">
              {metadata?.memories?.length || 0} memories, {metadata?.acus?.length || 0} ACUs
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderLayers = () => (
    <div className="cockpit-layers">
      {LAYER_ORDER.map(id => {
        const budget = contextAllocation[id];
        if (!budget) return null;
        
        const config = LAYER_CONFIG[id];
        const bundle = bundleMap.get(id === 'L0_identity' ? 'identity_core' : 
                                   id === 'L1_global_prefs' ? 'global_prefs' :
                                   id === 'L2_topic' ? 'topic' :
                                   id === 'L3_entity' ? 'entity' :
                                   id === 'L4_conversation' ? 'conversation' : '');
        
        return (
          <div key={id} className="layer-card" style={{ borderLeftColor: config?.color }}>
            <div className="layer-card-header">
              <span className="layer-card-icon">{config?.icon}</span>
              <div className="layer-card-info">
                <span className="layer-card-name">{config?.name}</span>
                <span className="layer-card-desc">{config?.desc}</span>
              </div>
              <div className="layer-card-stats">
                <span className="layer-card-tokens">{budget.allocated.toLocaleString()}</span>
                <span className="layer-card-priority">P{budget.priority}</span>
              </div>
            </div>
            {bundle && (
              <div className="layer-card-bundle">
                <span className="bundle-title">{bundle.title}</span>
                <span className="bundle-tokens">{bundle.tokenCount} tk</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTelemetry = () => {
    if (!telemetry) {
      return <div className="no-data">📡 Waiting for telemetry data...</div>;
    }

    const maxTime = Math.max(
      telemetry.embeddingDurationMs,
      telemetry.detectionDurationMs,
      telemetry.retrievalDurationMs,
      telemetry.compilationDurationMs
    );

    return (
      <div className="cockpit-telemetry">
        {/* Pipeline Timing */}
        <div className="telemetry-section">
          <div className="telemetry-title">⏱️ Pipeline Timing</div>
          <TimingBar label="Embedding" value={telemetry.embeddingDurationMs} maxValue={maxTime} color="#8b5cf6" />
          <TimingBar label="Detection" value={telemetry.detectionDurationMs} maxValue={maxTime} color="#6366f1" />
          <TimingBar label="Retrieval" value={telemetry.retrievalDurationMs} maxValue={maxTime} color="#0ea5e9" />
          <TimingBar label="Compilation" value={telemetry.compilationDurationMs} maxValue={maxTime} color="#10b981" />
        </div>

        {/* Efficiency Bars */}
        <div className="telemetry-section">
          <div className="telemetry-title">📈 Efficiency</div>
          <div className="eff-row">
            <span className="eff-label">Token Efficiency</span>
            <div className="eff-bar"><div style={{ width: `${telemetry.tokenEfficiency * 100}%`, background: telemetry.tokenEfficiency > 0.8 ? '#10b981' : '#f59e0b' }} /></div>
            <span className="eff-val">{(telemetry.tokenEfficiency * 100).toFixed(1)}%</span>
          </div>
          <div className="eff-row">
            <span className="eff-label">Cache Hit</span>
            <div className="eff-bar"><div style={{ width: `${telemetry.cacheHitRate * 100}%`, background: telemetry.cacheHitRate > 0.5 ? '#10b981' : '#ef4444' }} /></div>
            <span className="eff-val">{(telemetry.cacheHitRate * 100).toFixed(1)}%</span>
          </div>
          <div className="eff-row">
            <span className="eff-label">Coverage</span>
            <div className="eff-bar"><div style={{ width: `${telemetry.coverageScore * 100}%`, background: '#8b5cf6' }} /></div>
            <span className="eff-val">{(telemetry.coverageScore * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Context Richness */}
        <div className="telemetry-section">
          <div className="telemetry-title">🎯 Context Richness</div>
          <div className="richness-grid">
            <div className="richness-item">📌<span className="rich-val">{telemetry.topicsDetected}</span><span className="rich-lbl">Topics</span></div>
            <div className="richness-item">👤<span className="rich-val">{telemetry.entitiesDetected}</span><span className="rich-lbl">Entities</span></div>
            <div className="richness-item">📖<span className="rich-val">{telemetry.acusRetrieved}</span><span className="rich-lbl">ACUs</span></div>
            <div className="richness-item">🧠<span className="rich-val">{telemetry.memoriesRetrieved}</span><span className="rich-lbl">Memories</span></div>
          </div>
        </div>

        {/* Errors */}
        {telemetry.errors?.length > 0 && (
          <div className="telemetry-section errors">
            <div className="telemetry-title">⚠️ Errors</div>
            {telemetry.errors.map((err, i) => (
              <div key={i} className="error-item">❌ {err}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDebug = () => (
    <div className="cockpit-debug">
      {/* Bundle List */}
      <div className="debug-section">
        <div className="debug-title">📦 Active Bundles</div>
        {bundlesInfo && bundlesInfo.length > 0 ? (
          <div className="bundles-list">
            {bundlesInfo.map((bundle, i) => (
              <div key={i} className="bundle-row">
                <span className="bundle-name" style={{ color: LAYER_CONFIG[bundle.type]?.color }}>{bundle.title}</span>
                <span className="bundle-tk">{bundle.tokenCount} tk</span>
                <button className="dismiss-btn" onClick={() => handleDismiss(bundle.id)}>🗑️</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No active bundles</div>
        )}
      </div>

      {/* Raw JSON */}
      <div className="debug-section">
        <div className="debug-title">🔧 Raw Data</div>
        <pre className="raw-json">
{JSON.stringify({ allocation: contextAllocation, metadata: { ...metadata, memories: metadata?.memories?.length, acus: metadata?.acus?.length } }, null, 2)}
        </pre>
      </div>
    </div>
  );

  // -------------------------------------------------------------------------
  // MAIN RENDER
  // -------------------------------------------------------------------------

  return (
    <div className={`context-cockpit ${expanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="cockpit-header" onClick={handleToggle}>
        <div className="header-left">
          <span className="header-icon">🎛️</span>
          <span className="header-title">Context Command Center</span>
          <span className="header-badge">360°</span>
        </div>
        <div className="header-right">
          <span className="header-stat">{totalAllocated.toLocaleString()}/{totalTokensAvailable.toLocaleString()}</span>
          <span className="header-health" style={{ color: getHealthColor(healthScore) }}>{healthScore}%</span>
          <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <>
          {/* Tab Bar */}
          <div className="cockpit-tabs">
            {(['overview', 'layers', 'telemetry', 'debug'] as const).map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={handleTabChange(tab)}
              >
                {tab === 'overview' && '📊'}
                {tab === 'layers' && '📚'}
                {tab === 'telemetry' && '📡'}
                {tab === 'debug' && '🔧'}
                <span className="tab-label">{tab}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="cockpit-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'layers' && renderLayers()}
            {activeTab === 'telemetry' && renderTelemetry()}
            {activeTab === 'debug' && renderDebug()}
          </div>
        </>
      )}
    </div>
  );
};

export default ContextCockpit;

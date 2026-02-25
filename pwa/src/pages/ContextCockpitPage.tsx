import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Settings, ChevronRight } from 'lucide-react';
import { ContextCockpit } from '../components/ContextCockpit';

// ============================================================================
// TYPES - Mirror the component props
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

// ============================================================================
// PAGE COMPONENT
// ============================================================================

const ContextCockpitPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // Parse query params for context data
  const [contextData, setContextData] = useState<{
    contextAllocation: Record<string, LayerBudget> | null;
    totalTokensAvailable: number;
    bundlesInfo?: BundleInfo[];
    metadata?: ContextMetadata;
    telemetry?: TelemetryData;
  } | null>(null);

  useEffect(() => {
    // Try to parse context data from URL params
    const allocation = searchParams.get('allocation');
    const metadata = searchParams.get('metadata');
    const telemetry = searchParams.get('telemetry');
    
    if (allocation) {
      try {
        setContextData({
          contextAllocation: JSON.parse(decodeURIComponent(allocation)),
          totalTokensAvailable: 12000,
          metadata: metadata ? JSON.parse(decodeURIComponent(metadata)) : undefined,
          telemetry: telemetry ? JSON.parse(decodeURIComponent(telemetry)) : undefined,
        });
      } catch (e) {
        console.error('Failed to parse context data:', e);
      }
    }
  }, [searchParams]);

  // Demo mode - show sample data when no real data
  const demoData = {
    contextAllocation: {
      L0_identity: { layer: 'L0_identity', minTokens: 100, maxTokens: 500, priority: 100, allocated: 312 },
      L1_global_prefs: { layer: 'L1_global_prefs', minTokens: 100, maxTokens: 400, priority: 95, allocated: 187 },
      L2_topic: { layer: 'L2_topic', minTokens: 500, maxTokens: 3000, priority: 80, allocated: 1456 },
      L3_entity: { layer: 'L3_entity', minTokens: 200, maxTokens: 1500, priority: 70, allocated: 823 },
      L4_conversation: { layer: 'L4_conversation', minTokens: 500, maxTokens: 3000, priority: 85, allocated: 2100 },
      L5_jit: { layer: 'L5_jit', minTokens: 300, maxTokens: 2000, priority: 75, allocated: 1342 },
      L6_message_history: { layer: 'L6_message_history', minTokens: 1000, maxTokens: 8000, priority: 90, allocated: 4200 },
      L7_user_message: { layer: 'L7_user_message', minTokens: 50, maxTokens: 500, priority: 100, allocated: 256 },
    } as Record<string, LayerBudget>,
    totalTokensAvailable: 12000,
    bundlesInfo: [
      { id: '1', type: 'identity_core', title: '[IDENTITY_CORE] Layer', tokenCount: 312, snippet: 'User: Developer, Role: Full-stack engineer, Experience: 5+ years...' },
      { id: '2', type: 'global_prefs', title: '[GLOBAL_PREFS] Layer', tokenCount: 187, snippet: 'Communication: Direct, Technical depth: Advanced, Tone: Professional...' },
      { id: '3', type: 'topic', title: '[TOPIC] Layer', tokenCount: 1456, snippet: 'Topic: React Performance Optimization, Key concepts: memoization, virtualization...' },
      { id: '4', type: 'entity', title: '[ENTITY] Layer', tokenCount: 823, snippet: 'Entities: vivim-app (project), context-pipeline (component)...' },
      { id: '5', type: 'conversation', title: '[CONVERSATION] Layer', tokenCount: 2100, snippet: 'User asking about context optimization, mentioned memory management...' },
    ] as BundleInfo[],
    metadata: {
      detectedTopics: [
        { name: 'react-performance', type: 'topic', confidence: 0.92 },
        { name: 'context-optimization', type: 'topic', confidence: 0.87 },
      ],
      detectedEntities: [
        { name: 'vivim-app', type: 'project', confidence: 0.95 },
        { name: 'ContextPipeline', type: 'component', confidence: 0.88 },
      ],
      cacheHitRate: 0.72,
      assemblyTimeMs: 234,
    } as ContextMetadata,
    telemetry: {
      totalDurationMs: 234,
      embeddingDurationMs: 45,
      detectionDurationMs: 28,
      retrievalDurationMs: 89,
      compilationDurationMs: 72,
      tokenBudget: 12000,
      tokenUsed: 10776,
      tokenEfficiency: 0.898,
      cacheHitRate: 0.72,
      topicsDetected: 2,
      entitiesDetected: 2,
      acusRetrieved: 4,
      memoriesRetrieved: 3,
      coverageScore: 0.875,
      freshnessScore: 0.92,
      errors: [],
    } as TelemetryData,
  };

  const displayData = contextData || demoData;

  return (
    <div className="min-h-screen bg-ui-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-ui-950/80 backdrop-blur-xl border-b border-ui-800">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary-500" />
            <div>
              <h1 className="text-xl font-bold text-ui-100">Context Command Center</h1>
              <p className="text-xs text-ui-400">Enterprise 360° Context Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="/settings/context" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-ui-400 hover:text-ui-200 bg-ui-800 hover:bg-ui-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configure
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto">
        <ContextCockpit 
          contextAllocation={displayData.contextAllocation}
          totalTokensAvailable={displayData.totalTokensAvailable}
          bundlesInfo={displayData.bundlesInfo}
          metadata={displayData.metadata}
          telemetry={displayData.telemetry}
        />
      </div>

      {/* Info Footer */}
      <div className="p-6 text-center text-xs text-ui-500">
        ContextCockpit provides real-time visibility into the dynamic context pipeline. 
        Data refreshes on each AI request.
      </div>
    </div>
  );
};

export default ContextCockpitPage;

import React, { useState } from 'react';
import './ContextVisualizer.css';
import { ChevronDown, ChevronUp, Layers, Info, Database, Brain, MessageSquare, BookOpen, Hash, User, Clock, Zap, CheckCircle, XCircle } from 'lucide-react';

interface LayerBudget {
  layer: string;
  minTokens: number;
  idealTokens: number;
  maxTokens: number;
  priority: number;
  allocated: number;
  elasticity: number;
}

export interface BundleInfo {
  id: string;
  type: string;
  title: string;
  tokenCount: number;
  snippet: string;
}

export interface DetectedItem {
  name: string;
  type: string;
  confidence: number;
  source?: string;
}

export interface ContextMetadata {
  detectedTopics?: DetectedItem[];
  detectedEntities?: DetectedItem[];
  memories?: Array<{ id: string; content: string; category: string; importance: number }>;
  acus?: Array<{ id: string; content: string; category: string; similarity: number }>;
  cacheHitRate?: number;
  assemblyTimeMs?: number;
  conversationStats?: {
    messageCount: number;
    totalTokens: number;
    hasConversation: boolean;
  };
}

interface ContextVisualizerProps {
  contextAllocation: Record<string, LayerBudget> | null;
  totalTokensAvailable: number;
  bundlesInfo?: BundleInfo[];
  onDismissBundle?: (bundleId: string) => void;
  metadata?: ContextMetadata;
}

const LAYER_COLORS: Record<string, string> = {
  'L0_identity': '#8b5cf6', // Violet
  'L1_global_prefs': '#6366f1', // Indigo
  'L2_topic': '#0ea5e9', // Light Blue
  'L3_entity': '#10b981', // Emerald
  'L4_conversation': '#f59e0b', // Amber
  'L5_jit': '#ef4444', // Red
  'L6_message_history': '#ec4899', // Pink
  'L7_user_message': '#14b8a6', // Teal
};

const LAYER_NAMES: Record<string, string> = {
  'L0_identity': 'Identity Core',
  'L1_global_prefs': 'Global Prefs',
  'L2_topic': 'Topic Context',
  'L3_entity': 'Entity Context',
  'L4_conversation': 'Conversation Arc',
  'L5_jit': 'JIT Retrieval',
  'L6_message_history': 'Message History',
  'L7_user_message': 'User Message',
};

export const ContextVisualizer: React.FC<ContextVisualizerProps> = ({
  contextAllocation,
  totalTokensAvailable = 12000,
  bundlesInfo,
  onDismissBundle,
  metadata,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showXAI, setShowXAI] = useState(false);
  const [showRealData, setShowRealData] = useState(true);

  if (!contextAllocation) return null;

  const layers = [
    'L0_identity',
    'L1_global_prefs',
    'L2_topic',
    'L3_entity',
    'L4_conversation',
    'L5_jit',
    'L6_message_history',
    'L7_user_message',
  ];

  const totalAllocated = Object.values(contextAllocation).reduce(
    (sum, layer) => sum + layer.allocated,
    0
  );

  return (
    <div className={`context-visualizer ${isExpanded ? 'expanded' : ''}`}>
      <div 
        className="context-visualizer-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-medium">Glass Box Inspector</span>
          <span className="text-xs text-ui-500 ml-2">
            {totalAllocated.toLocaleString()} / {totalTokensAvailable.toLocaleString()} tokens
          </span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      <div className="context-visualizer-bar-container">
        <div className="context-visualizer-stacked-bar">
          {layers.map((layerKey) => {
            const layer = contextAllocation[layerKey];
            if (!layer || layer.allocated === 0) return null;

            const percentage = (layer.allocated / totalTokensAvailable) * 100;

            return (
              <div
                key={layerKey}
                className="context-visualizer-segment"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: LAYER_COLORS[layerKey] || '#888',
                }}
                title={`${LAYER_NAMES[layerKey]}: ${layer.allocated} tokens`}
              />
            );
          })}
        </div>
      </div>

      {isExpanded && (
        <div className="context-visualizer-details">
          <div className="text-xs text-ui-400 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Showing dynamic budget allocation across 8 context layers
            </div>
            {bundlesInfo && bundlesInfo.length > 0 && (
              <button 
                className="text-primary-500 hover:text-primary-400 text-[10px] uppercase font-bold tracking-wider"
                onClick={(e) => { e.stopPropagation(); setShowXAI(!showXAI); }}
              >
                {showXAI ? 'Hide XAI Details' : 'View XAI Details'}
              </button>
            )}
          </div>
          <div className="context-visualizer-grid">
            {layers.map((layerKey) => {
              const layer = contextAllocation[layerKey];
              if (!layer) return null;
              
              const isZero = layer.allocated === 0;

              return (
                <div key={layerKey} className={`layer-row ${isZero ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="layer-color-dot" 
                      style={{ backgroundColor: LAYER_COLORS[layerKey] || '#888' }} 
                    />
                    <span className="layer-name">{LAYER_NAMES[layerKey]}</span>
                  </div>
                  <div className="layer-tokens text-right">
                    {layer.allocated.toLocaleString()} tks
                  </div>
                </div>
              );
            })}
          </div>

          {/* XAI Attribution Dropdown */}
          {showXAI && bundlesInfo && (
            <div className="mt-4 pt-3 border-t border-ui-800 animate-slide-down">
              <div className="text-[10px] uppercase font-bold text-ui-500 mb-2 tracking-widest">
                Inline Attributions (XAI Sources)
              </div>
              <div className="space-y-2">
                {bundlesInfo.map(bundle => (
                  <div key={bundle.id} className="bg-ui-950 border border-ui-800 rounded-md p-2 relative group hover:border-primary-500/50 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-ui-200" style={{ color: LAYER_COLORS[bundle.type] || '#ccc' }}>
                        {bundle.title}
                      </span>
                      <span className="text-[10px] text-ui-500 font-mono">
                        {bundle.tokenCount} tk
                      </span>
                    </div>
                    <p className="text-[10px] text-ui-400 line-clamp-2 pr-6">
                      {bundle.snippet}
                    </p>
                    {onDismissBundle && (
                      <button 
                        onClick={() => onDismissBundle(bundle.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                        title="Dismiss this context block (teach AI)"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real Data Visualization Section */}
          {showRealData && metadata && (
            <div className="mt-4 pt-3 border-t border-ui-800">
              <button 
                onClick={() => setShowRealData(!showRealData)}
                className="text-[10px] uppercase font-bold text-ui-500 mb-3 tracking-widest flex items-center gap-1 hover:text-primary-400"
              >
                <Database className="w-3 h-3" />
                Live Context Data ({showRealData ? 'Hide' : 'Show'})
              </button>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Detected Topics */}
                {metadata.detectedTopics && metadata.detectedTopics.length > 0 && (
                  <div className="bg-ui-950 border border-ui-800 rounded-md p-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Hash className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] font-medium text-blue-300 uppercase">Detected Topics</span>
                      <span className="text-[10px] text-ui-500">({metadata.detectedTopics.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {metadata.detectedTopics.map((topic, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] text-blue-200"
                        >
                          {topic.name}
                          <span className="text-blue-400/60">{Math.round(topic.confidence * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detected Entities */}
                {metadata.detectedEntities && metadata.detectedEntities.length > 0 && (
                  <div className="bg-ui-950 border border-ui-800 rounded-md p-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <User className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-medium text-emerald-300 uppercase">Detected Entities</span>
                      <span className="text-[10px] text-ui-500">({metadata.detectedEntities.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {metadata.detectedEntities.map((entity, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[10px] text-emerald-200"
                        >
                          {entity.name}
                          <span className="text-emerald-400/60">{entity.type}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* JIT Memories */}
                {metadata.memories && metadata.memories.length > 0 && (
                  <div className="bg-ui-950 border border-ui-800 rounded-md p-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] font-medium text-red-300 uppercase">Retrieved Memories</span>
                      <span className="text-[10px] text-ui-500">({metadata.memories.length})</span>
                    </div>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                      {metadata.memories.slice(0, 3).map((mem, idx) => (
                        <div key={idx} className="text-[10px] text-ui-400 bg-ui-900 rounded p-1.5">
                          <span className="text-red-400/70">[{mem.category}]</span> {mem.content.substring(0, 80)}...
                        </div>
                      ))}
                      {metadata.memories.length > 3 && (
                        <div className="text-[10px] text-ui-500">+{metadata.memories.length - 3} more memories</div>
                      )}
                    </div>
                  </div>
                )}

                {/* JIT ACUs (Knowledge Units) */}
                {metadata.acus && metadata.acus.length > 0 && (
                  <div className="bg-ui-950 border border-ui-800 rounded-md p-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BookOpen className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] font-medium text-purple-300 uppercase">Knowledge Units (ACUs)</span>
                      <span className="text-[10px] text-ui-500">({metadata.acus.length})</span>
                    </div>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                      {metadata.acus.slice(0, 3).map((acu, idx) => (
                        <div key={idx} className="text-[10px] text-ui-400 bg-ui-900 rounded p-1.5">
                          <span className="text-purple-400/70">[{acu.category}]</span> {acu.content.substring(0, 80)}...
                        </div>
                      ))}
                      {metadata.acus.length > 3 && (
                        <div className="text-[10px] text-ui-500">+{metadata.acus.length - 3} more ACUs</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assembly Metadata */}
                <div className="flex items-center gap-4 text-[10px] text-ui-500">
                  {metadata.cacheHitRate !== undefined && (
                    <div className="flex items-center gap-1">
                      {metadata.cacheHitRate > 0.5 ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-yellow-500" />
                      )}
                      Cache: {Math.round(metadata.cacheHitRate * 100)}%
                    </div>
                  )}
                  {metadata.assemblyTimeMs && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      Assembly: {metadata.assemblyTimeMs}ms
                    </div>
                  )}
                  {metadata.conversationStats && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-blue-500" />
                      {metadata.conversationStats.messageCount} msgs
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-ui-800 flex justify-between">
            <a href="/settings/ai" className="text-xs text-primary-500 hover:text-primary-400">
              Configure Context Recipes
            </a>
            <a href="/synapse" className="text-xs text-primary-500 hover:text-primary-400">
              View Synapse Graph
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

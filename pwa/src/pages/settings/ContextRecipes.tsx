import React, { useState, useEffect } from 'react';
import { useIOSToast, toast } from '../../components/ios';
import { Layers, Brain, Database, Save, History, Users, RefreshCw, ChevronDown, ChevronUp, Plus, Trash2, Eye, EyeOff, Settings2, MessageSquare, Hash, User, BookOpen, Clock, Zap, Shield } from 'lucide-react';
import { ContextVisualizer } from '../../components/ContextVisualizer';

const Switch = ({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-ui-700'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

interface LayerConfig {
  enabled: boolean;
  priority: number;
  minTokens: number;
  maxTokens: number;
  manualContent?: string;
}

interface LayerDefinitions {
  L0_identity: { name: string; description: string; icon: React.ReactNode; color: string };
  L1_global_prefs: { name: string; description: string; icon: React.ReactNode; color: string };
  L2_topic: { name: string; description: string; icon: React.ReactNode; color: string };
  L3_entity: { name: string; description: string; icon: React.ReactNode; color: string };
  L4_conversation: { name: string; description: string; icon: React.ReactNode; color: string };
  L5_jit: { name: string; description: string; icon: React.ReactNode; color: string };
  L6_message_history: { name: string; description: string; icon: React.ReactNode; color: string };
  L7_user_message: { name: string; description: string; icon: React.ReactNode; color: string };
}

const LAYER_DEFINITIONS: LayerDefinitions = {
  'L0_identity': { 
    name: 'Identity Core', 
    description: 'Your fundamental identity, role, and core characteristics',
    icon: <Shield className="w-4 h-4" />,
    color: '#8b5cf6'
  },
  'L1_global_prefs': { 
    name: 'Global Preferences', 
    description: 'Communication style, tone, and interaction preferences',
    icon: <Settings2 className="w-4 h-4" />,
    color: '#6366f1'
  },
  'L2_topic': { 
    name: 'Topic Context', 
    description: 'Current topic profile and domain knowledge',
    icon: <Hash className="w-4 h-4" />,
    color: '#0ea5e9'
  },
  'L3_entity': { 
    name: 'Entity Context', 
    description: 'People, projects, and entities mentioned',
    icon: <User className="w-4 h-4" />,
    color: '#10b981'
  },
  'L4_conversation': { 
    name: 'Conversation Arc', 
    description: 'Summary of conversation flow and key points',
    icon: <MessageSquare className="w-4 h-4" />,
    color: '#f59e0b'
  },
  'L5_jit': { 
    name: 'JIT Retrieval', 
    description: 'On-demand memories and knowledge units',
    icon: <Zap className="w-4 h-4" />,
    color: '#ef4444'
  },
  'L6_message_history': { 
    name: 'Message History', 
    description: 'Recent dialogue history in context window',
    icon: <Clock className="w-4 h-4" />,
    color: '#ec4899'
  },
  'L7_user_message': { 
    name: 'User Message', 
    description: 'Current user input being processed',
    icon: <Brain className="w-4 h-4" />,
    color: '#14b8a6'
  },
};

const DEFAULT_LAYER_CONFIG: Record<string, LayerConfig> = {
  'L0_identity': { enabled: true, priority: 100, minTokens: 100, maxTokens: 500 },
  'L1_global_prefs': { enabled: true, priority: 95, minTokens: 100, maxTokens: 400 },
  'L2_topic': { enabled: true, priority: 80, minTokens: 500, maxTokens: 3000 },
  'L3_entity': { enabled: true, priority: 70, minTokens: 200, maxTokens: 1500 },
  'L4_conversation': { enabled: true, priority: 85, minTokens: 500, maxTokens: 3000 },
  'L5_jit': { enabled: true, priority: 75, minTokens: 300, maxTokens: 2000 },
  'L6_message_history': { enabled: true, priority: 90, minTokens: 1000, maxTokens: 8000 },
  'L7_user_message': { enabled: true, priority: 100, minTokens: 50, maxTokens: 500 },
};

export const ContextRecipes: React.FC = () => {
  const { toast: showToast } = useIOSToast();
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  // Global settings
  const [maxContextTokens, setMaxContextTokens] = useState(12000);
  const [knowledgeDepth, setKnowledgeDepth] = useState<'minimal' | 'standard' | 'deep'>('standard');
  const [prioritizeHistory, setPrioritizeHistory] = useState(true);
  const [includeEntityContext, setIncludeEntityContext] = useState(true);

  // Per-layer configurations
  const [layerConfigs, setLayerConfigs] = useState<Record<string, LayerConfig>>(DEFAULT_LAYER_CONFIG);
  
  // Manual context inputs
  const [manualContexts, setManualContexts] = useState<Record<string, string>>({});

  // Preview budget
  const [previewBudget, setPreviewBudget] = useState<Record<string, any>>({});

  // Show/hide manual inputs
  const [showManualInputs, setShowManualInputs] = useState(false);

  useEffect(() => {
    const multiplier = 
      knowledgeDepth === 'deep' ? 1.5 : 
      knowledgeDepth === 'minimal' ? 0.5 : 1;
      
    const totalAllocatable = maxContextTokens - 250; // Reserve for user message
    
    const budget: Record<string, any> = {};
    let allocated = 0;
    
    Object.entries(layerConfigs).forEach(([layerId, config]) => {
      if (!config.enabled) {
        budget[layerId] = { allocated: 0, priority: config.priority };
        return;
      }
      
      // Calculate allocation based on priority and depth
      const baseAllocation = Math.floor((config.minTokens + config.maxTokens) / 2 * multiplier);
      const isHistory = layerId === 'L6_message_history';
      const isConversation = layerId === 'L4_conversation';
      
      let finalAllocation = baseAllocation;
      if (isHistory && prioritizeHistory) {
        finalAllocation = Math.floor(maxContextTokens * 0.4);
      } else if (isConversation && prioritizeHistory) {
        finalAllocation = 2000;
      }
      
      budget[layerId] = { 
        allocated: Math.min(finalAllocation, config.maxTokens), 
        priority: config.priority 
      };
      allocated += budget[layerId].allocated;
    });

    // Add user message
    budget['L7_user_message'] = { allocated: 250, priority: 100 };
    
    // Normalize to fit within max tokens
    if (allocated + 250 > maxContextTokens) {
      const scale = (maxContextTokens - 250) / allocated;
      Object.keys(budget).forEach(key => {
        if (key !== 'L7_user_message') {
          budget[key].allocated = Math.floor(budget[key].allocated * scale);
        }
      });
    }

    setPreviewBudget(budget);
  }, [maxContextTokens, knowledgeDepth, prioritizeHistory, layerConfigs]);

  const handleLayerConfigChange = (layerId: string, updates: Partial<LayerConfig>) => {
    setLayerConfigs(prev => ({
      ...prev,
      [layerId]: { ...prev[layerId], ...updates }
    }));
  };

  const handleManualContextChange = (layerId: string, content: string) => {
    setManualContexts(prev => ({
      ...prev,
      [layerId]: content
    }));
    handleLayerConfigChange(layerId, { manualContent: content });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast(toast.success('Context constraints updated safely'));
    } catch (e) {
      showToast(toast.error('Failed to update context settings'));
    } finally {
      setIsLoading(false);
    }
  };

  const layerIds = Object.keys(LAYER_DEFINITIONS);

  return (
    <div className="flex-1 overflow-y-auto bg-ui-950 ios-scrollbar-hide rounded-tl-[2rem] border-l border-ui-800/30">
      <div className="sticky top-0 z-20 bg-ui-950/80 backdrop-blur-xl border-b border-ui-800">
        <div className="flex items-center justify-between px-6 h-16">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-ui-100 to-ui-400">
            Context Recipes & Allocations
          </h2>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-full font-medium transition-colors text-white disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Constraints
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div>
          <h3 className="text-lg font-medium text-ui-200 mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-500" /> Let Your Context Engine Think
          </h3>
          <p className="text-sm text-ui-400">
            Customize how VIVIM retrieves and allocates tokens dynamically. Configure each layer and optionally inject manual context.
          </p>
        </div>

        {/* Visualizer Preview */}
        <div className="bg-ui-900 border border-ui-800 rounded-xl p-4 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-ui-400 uppercase tracking-widest">Live Budget Preview</p>
            <button 
              onClick={() => setShowManualInputs(!showManualInputs)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                showManualInputs ? 'bg-primary-500/20 text-primary-400' : 'bg-ui-800 text-ui-400 hover:text-ui-200'
              }`}
            >
              {showManualInputs ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showManualInputs ? 'Hide' : 'Show'} Manual Inputs
            </button>
          </div>
          <ContextVisualizer 
            contextAllocation={previewBudget as any} 
            totalTokensAvailable={maxContextTokens} 
          />
        </div>

        {/* Global Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-ui-900 border border-ui-800 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-ui-400" />
              <div className="flex-1">
                <h4 className="font-medium text-ui-200">Max Token Budget</h4>
                <p className="text-xs text-ui-500">Maximum cost/length allowed per prompt</p>
              </div>
              <span className="font-mono text-sm text-primary-400">{maxContextTokens.toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              className="w-full accent-primary-500" 
              min="4000" 
              max="64000" 
              step="1000"
              value={maxContextTokens}
              onChange={(e) => setMaxContextTokens(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-ui-500 mt-2 font-mono">
              <span>Fast (4K)</span>
              <span>Balanced (16K)</span>
              <span>Deep (64K)</span>
            </div>
          </div>

          <div className="bg-ui-900 border border-ui-800 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5 text-ui-400" />
              <div className="flex-1">
                <h4 className="font-medium text-ui-200">Knowledge Depth</h4>
                <p className="text-xs text-ui-500">How deep to delve into Topic Profiles</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['minimal', 'standard', 'deep'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setKnowledgeDepth(level)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium capitalize border transition-all ${
                    knowledgeDepth === level 
                      ? 'bg-primary-600/20 border-primary-500 text-primary-400' 
                      : 'bg-ui-800 border-ui-700 text-ui-400 hover:border-ui-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-ui-900 border border-ui-800 p-5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-ui-400" />
              <div>
                <h4 className="font-medium text-ui-200">Prioritize Chat History</h4>
                <p className="text-xs text-ui-500 max-w-[200px]">Keep the context window biased heavily towards recent dialogue</p>
              </div>
            </div>
            <Switch checked={prioritizeHistory} onChange={setPrioritizeHistory} />
          </div>

          <div className="bg-ui-900 border border-ui-800 p-5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-ui-400" />
              <div>
                <h4 className="font-medium text-ui-200">Include Entity Data</h4>
                <p className="text-xs text-ui-500 max-w-[200px]">Always include specific profiles of users and projects connected to the topic</p>
              </div>
            </div>
            <Switch checked={includeEntityContext} onChange={setIncludeEntityContext} />
          </div>
        </div>

        {/* Layer-Specific Controls */}
        <div>
          <h4 className="text-md font-medium text-ui-200 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" /> Layer-Specific Configuration
          </h4>
          <div className="space-y-3">
            {layerIds.map((layerId) => {
              const layer = LAYER_DEFINITIONS[layerId as keyof LayerDefinitions];
              const config = layerConfigs[layerId];
              const isExpanded = expandedLayer === layerId;
              
              return (
                <div 
                  key={layerId} 
                  className="bg-ui-900 border border-ui-800 rounded-xl overflow-hidden transition-all"
                  style={{ 
                    borderColor: config.enabled ? layer.color + '40' : undefined,
                    opacity: config.enabled ? 1 : 0.6
                  }}
                >
                  {/* Layer Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-ui-800/50 transition-colors"
                    onClick={() => setExpandedLayer(isExpanded ? null : layerId)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: layer.color + '20', color: layer.color }}
                      >
                        {layer.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ui-200">{layer.name}</span>
                          <span 
                            className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                            style={{ backgroundColor: layer.color + '30', color: layer.color }}
                          >
                            {layerId}
                          </span>
                        </div>
                        <p className="text-xs text-ui-500">{layer.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-2">
                        <div className="text-sm font-mono text-ui-300">
                          {previewBudget[layerId]?.allocated?.toLocaleString() || 0} tk
                        </div>
                      </div>
                      <Switch 
                        checked={config.enabled} 
                        onChange={(checked) => handleLayerConfigChange(layerId, { enabled: checked })} 
                      />
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-ui-400" /> : <ChevronDown className="w-4 h-4 text-ui-400" />}
                    </div>
                  </div>

                  {/* Expanded Layer Controls */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-ui-800 pt-4 space-y-4">
                      {/* Priority Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-ui-400">Priority</span>
                          <span className="text-primary-400 font-mono">{config.priority}</span>
                        </div>
                        <input 
                          type="range" 
                          className="w-full accent-primary-500 h-1.5 bg-ui-700 rounded-lg appearance-none cursor-pointer"
                          min="0" 
                          max="100" 
                          step="5"
                          value={config.priority}
                          onChange={(e) => handleLayerConfigChange(layerId, { priority: Number(e.target.value) })}
                        />
                        <div className="flex justify-between text-[10px] text-ui-500 mt-1">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>

                      {/* Token Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-ui-400">Min Tokens</span>
                            <span className="text-primary-400 font-mono">{config.minTokens}</span>
                          </div>
                          <input 
                            type="range" 
                            className="w-full accent-primary-500 h-1.5 bg-ui-700 rounded-lg appearance-none cursor-pointer"
                            min="0" 
                            max={config.maxTokens} 
                            step="100"
                            value={config.minTokens}
                            onChange={(e) => handleLayerConfigChange(layerId, { minTokens: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-ui-400">Max Tokens</span>
                            <span className="text-primary-400 font-mono">{config.maxTokens}</span>
                          </div>
                          <input 
                            type="range" 
                            className="w-full accent-primary-500 h-1.5 bg-ui-700 rounded-lg appearance-none cursor-pointer"
                            min={config.minTokens} 
                            max="10000" 
                            step="100"
                            value={config.maxTokens}
                            onChange={(e) => handleLayerConfigChange(layerId, { maxTokens: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* Manual Context Input */}
                      {showManualInputs && (
                        <div className="pt-2 border-t border-ui-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-ui-400 flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Manual Context Injection
                            </span>
                            {manualContexts[layerId] && (
                              <button 
                                onClick={() => handleManualContextChange(layerId, '')}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Clear
                              </button>
                            )}
                          </div>
                          <textarea
                            className="w-full h-20 bg-ui-950 border border-ui-700 rounded-lg p-3 text-sm text-ui-200 placeholder-ui-500 focus:border-primary-500 focus:outline-none resize-none font-mono"
                            placeholder={`Add custom context for ${layer.name}... (optional)`}
                            value={manualContexts[layerId] || ''}
                            onChange={(e) => handleManualContextChange(layerId, e.target.value)}
                          />
                          <p className="text-[10px] text-ui-500 mt-1">
                            This content will be injected directly into this layer when enabled
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContextRecipes;

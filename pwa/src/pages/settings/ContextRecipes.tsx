import React, { useState, useEffect } from 'react';
import { IOSTopBar, IOSSwitch, useIOSToast, toast } from '../../components/ios';
import { Layers, Brain, Database, ArrowRight, Save, History, Users, RefreshCw } from 'lucide-react';
import { ContextVisualizer } from '../../components/ContextVisualizer';
import { useAIStore } from '../../lib/ai-store';
import { getApiBaseUrl, getHeaders } from '../../lib/api-utils';

export const ContextRecipes: React.FC = () => {
  const { toast: showToast } = useIOSToast();
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [maxContextTokens, setMaxContextTokens] = useState(12000);
  const [knowledgeDepth, setKnowledgeDepth] = useState<'minimal' | 'standard' | 'deep'>('standard');
  const [prioritizeHistory, setPrioritizeHistory] = useState(true);
  const [includeEntityContext, setIncludeEntityContext] = useState(true);

  // Dummy prediction of budget given current settings
  const [previewBudget, setPreviewBudget] = useState<Record<string, any>>({});

  useEffect(() => {
    // Generate a simulated preview budget based on sliders
    const multiplier = 
      knowledgeDepth === 'deep' ? 1.5 : 
      knowledgeDepth === 'minimal' ? 0.5 : 1;
      
    const budget = {
      'L0_identity': { allocated: 300, priority: 100 },
      'L1_global_prefs': { allocated: 200, priority: 95 },
      'L2_topic': { allocated: Math.floor(1500 * multiplier), priority: 80 },
      'L3_entity': { allocated: includeEntityContext ? Math.floor(800 * multiplier) : 0, priority: 70 },
      'L4_conversation': { allocated: prioritizeHistory ? 2000 : 800, priority: 85 },
      'L5_jit': { allocated: Math.floor(1200 * multiplier), priority: 75 },
      'L6_message_history': { allocated: prioritizeHistory ? Math.floor((maxContextTokens * 0.4) * multiplier) : Math.floor((maxContextTokens * 0.2)), priority: 90 },
      'L7_user_message': { allocated: 250, priority: 100 },
    };

    setPreviewBudget(budget);
  }, [maxContextTokens, knowledgeDepth, prioritizeHistory, includeEntityContext]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Intentionally simulating saving for the sake of frontend demonstration
      // A backend endpoint /api/v1/context/settings would receive this
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast(toast.success('Context constraints updated safely'));
    } catch (e) {
      showToast(toast.error('Failed to update context settings'));
    } finally {
      setIsLoading(false);
    }
  };

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
            Customize how VIVIM retrieves and allocates tokens dynamically based on your constraints and interaction preferences.
          </p>
        </div>

        {/* Visualizer Preview */}
        <div className="bg-ui-900 border border-ui-800 rounded-xl p-4 shadow-xl shadow-black/20">
          <p className="text-xs font-medium text-ui-400 mb-4 uppercase tracking-widest">Live Budget Preview</p>
          <ContextVisualizer 
            contextAllocation={previewBudget as any} 
            totalTokensAvailable={maxContextTokens} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Tokens Slider */}
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

          {/* Knowledge Depth Select */}
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

          {/* History Priorities Toggle */}
          <div className="bg-ui-900 border border-ui-800 p-5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-ui-400" />
              <div>
                <h4 className="font-medium text-ui-200">Prioritize Chat History</h4>
                <p className="text-xs text-ui-500 max-w-[200px]">Keep the context window biased heavily towards recent dialogue</p>
              </div>
            </div>
            <IOSSwitch checked={prioritizeHistory} onChange={setPrioritizeHistory} />
          </div>

          {/* Include Entities Toggle */}
          <div className="bg-ui-900 border border-ui-800 p-5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-ui-400" />
              <div>
                <h4 className="font-medium text-ui-200">Include Entity Data</h4>
                <p className="text-xs text-ui-500 max-w-[200px]">Always include specific profiles of users and projects connected to the topic</p>
              </div>
            </div>
            <IOSSwitch checked={includeEntityContext} onChange={setIncludeEntityContext} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContextRecipes;

import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, PenTool, Hash, Info, ChevronRight, X, User as UserIcon, BookOpen, Clock, ArrowLeft } from 'lucide-react';
import { IOSToastProvider, useIOSToast } from '../components/ios';
import { getStorage } from '../lib/storage-v2';

interface ContextBundle {
  id: string;
  bundleType: string;
  compiledPrompt: string;
  tokenCount: number;
  version: number;
  compiledAt: string;
}

export const ContextComponentsPage: React.FC = () => {
  const [bundles, setBundles] = useState<ContextBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<ContextBundle | null>(null);
  const { toast } = useIOSToast();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Ignore toast variable
    console.log(toast);
  };

  const fetchBundles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const storage = getStorage();
      const identity = await storage.getIdentity();
      
      if (!identity) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/context-v2/bundles', {
        headers: {
          'Authorization': `Bearer ${identity}`,
          'X-DID': identity,
        }
      });

      if (!response.ok) {
        const fbResponse = await fetch('/api/context/bundles', {
           headers: { 'Authorization': `Bearer ${identity}`, 'X-DID': identity }
        });
        if (!fbResponse.ok) {
           throw new Error('Failed to fetch bundles');
        }
        const fbData = await fbResponse.json();
        setBundles(fbData.bundles || fbData.data?.bundles || []);
        return;
      }

      const data = await response.json();
      setBundles(data.bundles || []);
    } catch (err: any) {
      console.error('Error fetching bundles:', err);
      setError(err.message || 'Failed to load context components.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  const getBundleIcon = (type: string) => {
    switch(type) {
      case 'identity_core': return <UserIcon className="w-5 h-5" />;
      case 'global_prefs': return <PenTool className="w-5 h-5" />;
      case 'topic': return <BookOpen className="w-5 h-5" />;
      case 'entity': return <Hash className="w-5 h-5" />;
      case 'conversation': return <Clock className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const formatBundleType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans min-h-screen">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 w-full mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Context Components</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Active Components</h2>
            <p className="text-sm text-gray-500">View and manage dynamic AI context</p>
          </div>
          <button 
            onClick={fetchBundles}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <RefreshCw className={`w-5 h-5 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Bundles Found</h3>
            <p className="text-gray-500 text-sm mt-1">Context will be generated as you chat.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {bundles.map((bundle) => (
              <button
                key={bundle.id}
                onClick={() => setSelectedBundle(bundle)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition duration-150"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg">
                    {getBundleIcon(bundle.bundleType)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {formatBundleType(bundle.bundleType)}
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                        v{bundle.version}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {bundle.tokenCount} tokens • Updated {new Date(bundle.compiledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing bundle content */}
      {selectedBundle && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedBundle(null)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md">
                  {getBundleIcon(selectedBundle.bundleType)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {formatBundleType(selectedBundle.bundleType)}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedBundle.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBundle(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a] flex-1">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Compiled Prompt</h4>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const newPrompt = prompt('Edit compiled prompt:', selectedBundle.compiledPrompt);
                      if (newPrompt !== null) {
                         // In a full implementation, this would call PUT /api/context-v2/bundles/:id
                         // For now we'll just optimistically update the UI
                         setSelectedBundle({...selectedBundle, compiledPrompt: newPrompt});
                         setBundles(bundles.map(b => b.id === selectedBundle.id ? {...b, compiledPrompt: newPrompt} : b));
                         handleCopy('Edited locally - backend PUT required for persistence');
                      }
                    }}
                    className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md font-medium hover:bg-blue-100 transition"
                  >
                    Edit
                  </button>
                  <div className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md font-medium">
                    {selectedBundle.tokenCount} Tokens
                  </div>
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-sm bg-white dark:bg-black p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-300 shadow-inner">
                {selectedBundle.compiledPrompt}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ContextComponents() {
  return (
    <IOSToastProvider>
      <ContextComponentsPage />
    </IOSToastProvider>
  );
}

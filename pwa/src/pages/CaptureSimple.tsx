import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  Shield, 
  Zap,
  Download,
  Fingerprint,
  Lock,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { 
  IOSTopBar, 
  IOSCard, 
  IOSButton, 
  IOSErrorState,
  useIOSToast,
  toast
} from '../components/ios';
import { cn } from '../lib/utils';

interface CapturedData {
  id: string;
  title: string;
  provider: string;
  messageCount: number;
  wordCount: number;
  contentHash: string;
}

type CaptureStatus = 'idle' | 'capturing' | 'success' | 'error';

export const CaptureSimple: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast: showToast } = useIOSToast();
  
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<CapturedData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    const urlParam = searchParams.get('url');
    const textParam = searchParams.get('text');
    
    if (urlParam) {
      setUrl(urlParam);
      addLog(`URL detected: ${urlParam}`);
    } else if (textParam) {
      const urlMatch = textParam.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        setUrl(urlMatch[0]);
        addLog(`URL extracted: ${urlMatch[0]}`);
      }
    }
  }, [searchParams, addLog]);

  const captureUrl = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      showToast(toast.error('URL Required'));
      return;
    }

    setStatus('capturing');
    setError(null);
    setCaptured(null);
    setLogs([]);
    addLog(`Initiating materialization: ${targetUrl}`);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      
      // Step 1: Handshake
      addLog('Synchronizing neural handshake...');
      const handshakeRes = await fetch(`${apiBaseUrl}/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const { publicKey } = await handshakeRes.json();

      // Step 2: Encrypt
      addLog('Encrypting intelligence nodes...');
      const { kyberEncapsulate, symmetricEncrypt } = await import('../lib/storage-v2/crypto');
      const { ciphertext, sharedSecret } = await kyberEncapsulate(publicKey);
      const encrypted = symmetricEncrypt(JSON.stringify({ url: targetUrl }), sharedSecret);

      // Step 3: Materialize
      addLog('Materializing knowledge graph...');
      const apiKey = import.meta.env.VITE_API_KEY || 'sk-openscroll-dev-key-123456789';
      
      const captureRes = await fetch(`${apiBaseUrl}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          pqcCiphertext: ciphertext,
          pqcPayload: encrypted.ciphertext,
          pqcNonce: encrypted.nonce
        })
      });

      if (!captureRes.ok) {
        const errData = await captureRes.json();
        throw new Error(errData.message || `HTTP ${captureRes.status}`);
      }

      const result = await captureRes.json();
      addLog(`Success! Materialized ${result.data?.messages?.length || 0} nodes.`);

      const messages = result.data?.messages || [];
      const wordCount = messages.reduce((acc: number, msg: any) => {
        const content = msg.content || '';
        return acc + (typeof content === 'string' ? content.split(/\s+/).length : 0);
      }, 0);

      setCaptured({
        id: result.data?.id || crypto.randomUUID(),
        title: result.data?.title || 'Untitled',
        provider: result.data?.provider || 'unknown',
        messageCount: messages.length,
        wordCount,
        contentHash: result.data?.metadata?.contentHash || ''
      });
      setStatus('success');
      showToast(toast.success('Capture Complete'));

    } catch (err: any) {
      addLog(`Critical Failure: ${err.message}`);
      setError(err.message);
      setStatus('error');
      showToast(toast.error('Materialization Failed'));
    }
  }, [addLog, showToast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    captureUrl(url);
  };

  const handleBack = () => navigate(-1);

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar title="Rapid Materialization" showBackButton onBack={handleBack} />

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <IOSCard variant="elevated" padding="lg" className="max-w-md w-full">
          {status === 'idle' && (
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sync Intelligence</h2>
                <p className="text-sm text-gray-500 px-4">Fast-track capture for shared AI conversation links.</p>
              </div>

              <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Quantum Secured Protocol</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Multi-Engine Extraction</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Source URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://chatgpt.com/share/..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <IOSButton variant="primary" fullWidth icon={<Zap className="w-4 h-4" />}>
                  Initialize Capture
                </IOSButton>
              </form>
            </div>
          )}

          {status === 'capturing' && (
            <div className="flex flex-col items-center text-center py-6 space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xl relative border border-blue-500/20">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Materializing...</h2>
                <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">Synchronizing Nodes</p>
              </div>

              <div className="w-full bg-black/90 rounded-2xl p-4 text-left border border-white/5 shadow-inner">
                <div className="space-y-1.5 max-h-40 overflow-y-auto ios-scrollbar-hide font-mono">
                  {logs.map((log, i) => (
                    <div key={i} className="text-[10px] text-green-400/80 leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {status === 'success' && captured && (
            <div className="flex flex-col items-center text-center py-4 space-y-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center shadow-xl shadow-green-500/10">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Materialized!</h2>
                <p className="text-sm text-gray-500 px-4 line-clamp-2">"{captured.title}"</p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-lg font-black text-gray-900 dark:text-white">{captured.messageCount}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Nodes</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-lg font-black text-gray-900 dark:text-white">{(captured.wordCount/1000).toFixed(1)}k</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Tokens</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <IOSButton variant="primary" fullWidth onClick={() => navigate(`/conversation/${captured.id}`)}>
                  Open Intelligence
                </IOSButton>
                <button onClick={() => setStatus('idle')} className="text-xs font-bold text-gray-400 uppercase tracking-widest py-2">
                  Capture Another
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4">
              <IOSErrorState 
                type="generic"
                title="Capture Interrupted"
                description={error || 'An unexpected protocol error occurred'}
                action={{ label: 'Retry Attempt', onClick: () => captureUrl(url) }}
              />
              <button onClick={() => setStatus('idle')} className="w-full mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                Abort
              </button>
            </div>
          )}
        </IOSCard>
      </div>
    </div>
  );
};

export default CaptureSimple;

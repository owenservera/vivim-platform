import './Capture.css';
import { cn } from '../lib/utils';
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { captureUrlStream } from '../lib/api';
import { captureQueue } from '../lib/capture-queue';
import { getStorage, type Hash } from '../lib/storage-v2';
import { log, logger, type LogEntry } from '../lib/logger';
import {
  IOSCard,
  IOSButton,
  IOSInput,
  IOSToastProvider,
  useIOSToast,
} from '../components/ios';
import { Loader2, CheckCircle, Download, Shield, Fingerprint, Activity, Clock, Zap, AlertCircle } from 'lucide-react';

type CaptureStatus = 'idle' | 'extracting' | 'signing' | 'saving' | 'success' | 'error';

interface CapturedData {
  title: string;
  provider: string;
  messageCount: number;
  wordCount: number;
  conversationId: Hash;
  contentHash: Hash;
}

export const Capture: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<CapturedData | null>(null);

  const [manualUrl, setManualUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Connect to global logger for "In-Page" console
  const [sessionLogs, setSessionLogs] = useState<LogEntry[]>([]);
  useIOSToast();

  useEffect(() => {
    const handleLog = (entry: LogEntry) => {
      // Only capture logs relevant to this page's operations
      if (['CAPTURE', 'API', 'STORAGE', 'DAG', 'CRYPTO'].includes(entry.module)) {
        setSessionLogs((prev) => [entry, ...prev].slice(0, 50));
      }
    };
    logger.addListener(handleLog);
    return () => logger.removeListener(handleLog);
  }, []);

  // Extract URL from share intent
  const getTargetUrl = useCallback((): string | null => {
    const urlParam = searchParams.get('url');
    const textParam = searchParams.get('text');

    log.capture.debug('getTargetUrl called', { urlParam, textParam });

    // Direct URL parameter
    if (urlParam) {
      log.capture.info('URL found in url param', { url: urlParam });
      return urlParam;
    }

    // Try to extract URL from text (common on Android)
    if (textParam) {
      const urlMatch = textParam.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        log.capture.info('URL extracted from text param', { url: urlMatch[0] });
        return urlMatch[0];
      }
    }

    log.capture.warn('No URL found in params');
    return null;
  }, [searchParams]);

  const processCapture = useCallback(
    async (urlOverride?: string) => {
      const url = urlOverride || getTargetUrl();

      if (!url) {
        log.capture.info('No target URL, setting idle state');
        setStatus('idle');
        return;
      }

      // Connect to server logs for this session
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      logger.connectToServer(apiBaseUrl);

      setTargetUrl(url);
      setProgress(5);
      log.capture.info(`Initiating Intelligence Sync for: ${url}`);
      setStatus('extracting');
      setError(null);

      try {
        // Step 1: High-fidelity synchronized extraction (Inside Quantum Tunnel)
        const data = await captureUrlStream(url, (update) => {
          setProgress(15 + update.percent * 0.7); // Stream goes up to 85%
          log.capture.info(`Engine Progress [${update.percent}%]: ${update.message}`);
        });

        log.capture.info(`✓ Extraction Complete: ${data.provider.toUpperCase()}`);
        setProgress(85);

        // Step 2: Zero-Trust Local Witness
        setStatus('signing');
        setProgress(90);

        const storage = getStorage();
        const did = await storage.getIdentity();
        log.crypto.info(`Identity confirmed: ${did.slice(0, 15)}...`);

        // Import using full DAG/CRDT system with crypto signing
        log.dag.info('Committing content-addressed nodes to IndexedDB...');
        const conversationId = await storage.importFromExtraction({
          title: data.title,
          provider: data.provider,
          sourceUrl: data.sourceUrl || url,
          messages: data.messages,
          metadata: {
            model: data.metadata?.model,
            exportedAt: data.exportedAt,
          },
        });

        log.storage.info(`✓ Materialized: ${conversationId.slice(0, 20)}...`);
        setProgress(95);

        // Verify storage
        log.storage.debug('Verifying local persistence...');
        await storage.getConversation(conversationId);
        const messages = await storage.getMessages(conversationId);
        log.storage.info(`Verification Success: Found ${messages.length} messages in local DAG.`);

        // Calculate stats
        const wordCount = data.messages.reduce((sum, msg) => {
          const content = typeof msg.content === 'string' ? msg.content : '';
          return sum + content.split(/\s+/).length;
        }, 0);

        const firstMessageHash = messages.length > 0 ? messages[0].id : conversationId;

        setStatus('saving');
        setProgress(100);

        setCaptured({
          title: data.title,
          provider: data.provider,
          messageCount: messages.length,
          wordCount,
          conversationId,
          contentHash: firstMessageHash,
        });

        setStatus('success');

        // Disconnect server logs - mission accomplished
        logger.disconnectFromServer();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';

        // OFFLINE FAILSAFE: Save link if server unreachable
        if (
          errorMsg.toLowerCase().includes('fetch') ||
          errorMsg.toLowerCase().includes('unreachable') ||
          errorMsg.toLowerCase().includes('disconnected')
        ) {
          captureQueue.enqueue(url);
          log.capture.warn('SERVER OFFLINE: Link saved to local queue.');
        } else {
          log.capture.error(`CRITICAL FAILURE: ${errorMsg}`);
        }

        setError('Intelligence Link Rejected. Check Server Manifest.');
        setStatus('error');

        // Disconnect server logs on error
        logger.disconnectFromServer();
      }
    },
    [getTargetUrl]
  );

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl) {
      processCapture(manualUrl);
    }
  };

  // Process share/capture on mount if URL exists
  useEffect(() => {
    if (status === 'idle' && getTargetUrl()) {
      log.capture.debug('Status is idle and URL exists, triggering processCapture');
      processCapture();
    }
  }, [status, getTargetUrl, processCapture]);

  // Handle view conversation
  const handleView = () => {
    if (captured) {
      navigate(`/ai/conversation/${captured.conversationId}`);
    }
  };

  // 8 supported providers
  const PROVIDERS = [
    { name: 'ChatGPT',  color: '#10a37f', domain: 'chatgpt.com'      },
    { name: 'Claude',   color: '#d97706', domain: 'claude.ai'         },
    { name: 'Gemini',   color: '#4285f4', domain: 'gemini.google.com' },
    { name: 'Grok',     color: '#1d1d1f', domain: 'x.com/grok'        },
    { name: 'DeepSeek', color: '#6366f1', domain: 'deepseek.com'      },
    { name: 'Kimi',     color: '#0ea5e9', domain: 'kimi.ai'           },
    { name: 'Qwen',     color: '#f59e0b', domain: 'qwen.ai'           },
    { name: 'Zai',      color: '#8b5cf6', domain: 'zai.chat'          },
  ];

  // Render states
  if (status === 'idle') {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
        <div className="flex-1 flex items-center justify-center p-4">
          <IOSCard variant="elevated" padding="lg" className="max-w-md w-full">
            <div className="flex flex-col items-center text-center">

              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <Download className="w-8 h-8 text-white" />
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Save a Conversation
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-7 max-w-xs text-sm">
                Paste a shared link from any supported AI app and we'll save it to your library — signed and searchable.
              </p>

              {/* Supported Providers */}
              <div className="w-full mb-7">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">
                  Supported platforms
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {PROVIDERS.map((p) => (
                    <div
                      key={p.name}
                      className="flex flex-col items-center gap-1.5 p-2.5 bg-gray-50 dark:bg-gray-800/70 rounded-xl border border-gray-100 dark:border-gray-700"
                    >
                      {/* Colour dot as a simple brand accent */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.name[0]}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 leading-none">
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="w-full text-left mb-7 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  How to capture
                </h3>
                <div className="space-y-3">
                  {[
                    { step: 1, text: 'Open a conversation in any supported AI app.' },
                    { step: 2, text: 'Tap Share → Public Link, then choose VIVIM from the share sheet.' },
                    { step: 3, text: 'Done — VIVIM saves it instantly to your library.' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {step}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ready indicator */}
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-7">
                <Activity className="w-3.5 h-3.5 animate-pulse text-green-500" />
                <span>Ready — waiting for a shared link</span>
              </div>

              {/* Offline Queue */}
              {captureQueue.getQueue().length > 0 && (
                <div className="w-full mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Queued ({captureQueue.getQueue().length})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        captureQueue.clear();
                        window.location.reload();
                      }}
                      className="text-xs text-blue-500 font-medium hover:text-blue-600"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {captureQueue.getQueue().slice(0, 3).map((link, idx) => (
                      <IOSCard
                        key={idx}
                        variant="outlined"
                        padding="sm"
                        clickable
                        onClick={() => processCapture(link.url)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{link.provider}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(link.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </IOSCard>
                    ))}
                  </div>
                  {captureQueue.getQueue().length > 3 && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                      +{captureQueue.getQueue().length - 3} more pending…
                    </p>
                  )}
                </div>
              )}

              {/* Manual URL input */}
              <div className="w-full border-t border-gray-200 dark:border-gray-800 pt-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">
                  Or paste a link
                </p>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <IOSInput
                    type="url"
                    placeholder="https://chatgpt.com/share/..."
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                  />
                  <IOSButton variant="primary" fullWidth disabled={!manualUrl}>
                    Save Conversation
                  </IOSButton>
                </form>
              </div>

            </div>
          </IOSCard>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="flex-1 flex items-center justify-center p-4">
        <IOSCard variant="elevated" padding="lg" className="max-w-md w-full">
          {/* Processing */}
          {(status === 'extracting' || status === 'signing' || status === 'saving') && (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                {status === 'extracting' ? (
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                ) : status === 'signing' ? (
                  <Fingerprint className="w-10 h-10 text-purple-500" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-green-500" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {status === 'extracting'
                  ? 'Extracting Intelligence'
                  : status === 'signing'
                  ? 'Authenticating Feed'
                  : 'Materializing DAG'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Processing {targetUrl ? new URL(targetUrl).hostname : 'source'}
              </p>

              {/* Progress Bar */}
              <div className="w-full mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Materializing Intelligence
                  </span>
                  <span className="text-xs font-bold text-blue-500">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Console */}
              {sessionLogs.length > 0 && (
                <div className="w-full bg-black/90 dark:bg-black rounded-2xl p-4 text-left border border-white/5 shadow-inner mt-2">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em]">
                        Sync_Stream.live
                      </span>
                    </div>
                    <span className="text-[9px] text-white/30 font-mono">
                      BUF: {sessionLogs.length}/50
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto ios-scrollbar-hide font-mono">
                    {sessionLogs.map((log, i) => (
                      <div key={log.id} className="text-[10px] leading-relaxed flex gap-2">
                        <span className="text-white/20 shrink-0">{(sessionLogs.length - i).toString().padStart(2, '0')}</span>
                        <span
                          className={cn(
                            'break-all',
                            log.level === 'ERROR'
                              ? 'text-red-400'
                              : log.level === 'WARN'
                              ? 'text-yellow-400'
                              : log.message.includes('✓')
                              ? 'text-green-400 font-bold'
                              : log.source === 'server'
                              ? 'text-blue-400'
                              : 'text-white/70'
                          )}
                        >
                          {log.source === 'server' && <span className="opacity-50 mr-1">📡</span>}
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {status === 'success' && captured && (
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/10">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Knowledge Captured
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-4">
                Successfully materialized <span className="font-bold text-gray-900 dark:text-white">"{captured.title}"</span>
              </p>

              {/* Verification Badge */}
              <div className="flex items-center gap-2 mb-8 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Verified Local Materialization
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 w-full mb-8">
                <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <span className="text-xl font-black text-gray-900 dark:text-white">
                    {captured.messageCount}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Messages</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <span className="text-xl font-black text-gray-900 dark:text-white">
                    {(captured.wordCount / 1000).toFixed(1)}k
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Words</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-black text-gray-900 dark:text-white truncate w-full capitalize">
                    {captured.provider}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Engine</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 w-full px-2">
                <IOSButton
                  variant="primary"
                  fullWidth
                  onClick={handleView}
                  icon={<Download className="w-5 h-5" />}
                  className="rounded-2xl h-14 text-lg shadow-xl shadow-blue-500/20"
                >
                  Enter Intelligence
                </IOSButton>
                <button
                  onClick={() => navigate('/')}
                  className="text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors py-2"
                >
                  DISMISS
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {error === 'SERVER_OFFLINE' ? 'Engine Connection Lost' : 'Materialization Failed'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {error === 'SERVER_OFFLINE' ? 'Sync Interrupted' : 'Validation Error'}
              </p>

              <div className="w-full text-left mb-6">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {error === 'SERVER_OFFLINE' ? 'Action Required' : 'System Report'}
                </p>

                {error === 'SERVER_OFFLINE' ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The PWA cannot reach your server.
                    </p>
                    <div className="space-y-2 ml-2">
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Open your Server Terminal window
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Check for error messages
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Error Trace:
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{error}</p>
                  </div>
                )}
              </div>

              <div className="w-full text-left mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {error === 'SERVER_OFFLINE'
                    ? 'FAILSAFE ACTIVE: Your links are saved in the Pending Materialization list.'
                    : 'RECOVERY MODE: Check console for more details.'}
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <IOSButton
                  variant="secondary"
                  fullWidth
                  onClick={() => setStatus('idle')}
                >
                  Acknowledge & Sync Later
                </IOSButton>
                <IOSButton
                  variant="primary"
                  fullWidth
                  onClick={() => processCapture(targetUrl || undefined)}
                >
                  Retry Connection Now
                </IOSButton>
              </div>
            </div>
          )}
        </IOSCard>
      </div>
    </div>
  );
};

// Wrap Capture with Toast Provider
export const CaptureWithProvider: React.FC = () => {
  return (
    <IOSToastProvider>
      <Capture />
    </IOSToastProvider>
  );
};

export default CaptureWithProvider;

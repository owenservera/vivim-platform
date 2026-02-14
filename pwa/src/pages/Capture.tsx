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
  IOSSkeletonCard,
  ErrorNetwork,
  IOSToastProvider,
  useIOSToast,
  toast,
} from '../components/ios';
import { Loader2, CheckCircle, Download, Globe, Shield, Fingerprint, Lock, Activity, Clock, Zap, AlertCircle } from 'lucide-react';

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
  const { toast: showToast } = useIOSToast();

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

  // Render states
  if (status === 'idle') {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
        <div className="flex-1 flex items-center justify-center p-4">
          <IOSCard variant="elevated" padding="lg" className="max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Download className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add Conversation
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
                Capture, verify, and persist AI knowledge graphs.
              </p>

              {/* Capabilities */}
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Globe className="w-6 h-6 text-blue-500" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Capabilities</span>
                  <code className="text-xs text-gray-500 dark:text-gray-500">
                    ChatGPT, Claude, Gemini
                  </code>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Shield className="w-6 h-6 text-green-500" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Security</span>
                  <code className="text-xs text-gray-500 dark:text-gray-500">
                    Ed25519 Signing
                  </code>
                </div>
              </div>

              {/* Action Guide */}
              <div className="w-full text-left mb-8">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Simple Action Guide
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      1
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      OPEN YOUR AI APP - Go to ChatGPT, Claude, or Gemini and select a conversation.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      2
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      SHARE THE LINK - Tap 'Share', then 'Public Link', and choose 'OpenScroll' from menu.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      3
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      OBSERVE MATERIALIZATION - The PWA performs a 'Full Sync' with the engine to sign and save your knowledge.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engine Pulse */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>
                  <strong>Engine Pulse: Active</strong> - Waiting for operating system to send a share intent.
                </span>
              </div>

              {/* Offline Queue */}
              {captureQueue.getQueue().length > 0 && (
                <div className="w-full mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Pending Materialization
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
                      +{captureQueue.getQueue().length - 3} more pending...
                    </p>
                  )}
                </div>
              )}

              {/* Manual Input */}
              <div className="w-full border-t border-gray-200 dark:border-gray-800 pt-6">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">
                  Manual Injection
                </p>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <IOSInput
                    type="url"
                    placeholder="https://chatgpt.com/share/..."
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                  />
                  <IOSButton variant="primary" fullWidth disabled={!manualUrl}>
                    Capture
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
                <div className="w-full bg-gray-900 dark:bg-black rounded-xl p-4 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Quantum Tunnel Monitor
                    </span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto ios-scrollbar-thin">
                    {sessionLogs.map((log, i) => (
                      <div key={log.id} className="text-xs font-mono">
                        <span className="text-gray-500">[{sessionLogs.length - i}]</span>
                        <span
                          className={
                            log.level === 'ERROR'
                              ? 'text-red-400'
                              : log.level === 'WARN'
                              ? 'text-yellow-400'
                              : log.message.includes('✓')
                              ? 'text-green-400'
                              : log.source === 'server'
                              ? 'text-blue-400'
                              : 'text-gray-400'
                          }
                        >
                          {log.source === 'server' && '📡 '}
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
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Captured!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">"{captured.title}"</p>

              {/* Verification Badge */}
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Cryptographically verified
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 w-full mb-6">
                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {captured.messageCount}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Messages</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {captured.wordCount}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Words</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                    {captured.provider}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Source</span>
                </div>
              </div>

              {/* Content Hash */}
              <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Content Hash
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                  {captured.contentHash.slice(0, 32)}...
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <IOSButton
                  variant="primary"
                  fullWidth
                  onClick={handleView}
                  icon={<Download className="w-5 h-5" />}
                >
                  View Conversation
                </IOSButton>
                <IOSButton
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/')}
                >
                  Done
                </IOSButton>
              </div>

              {/* Privacy notice */}
              <div className="flex items-center gap-2 mt-6">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Private • Signed with Ed25519
                </span>
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

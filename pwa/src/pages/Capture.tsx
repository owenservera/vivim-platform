import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle, 
  Download, 
  Shield, 
  Fingerprint, 
  Activity, 
  Clock, 
  Zap, 
  AlertCircle, 
  List, 
  Send,
  ChevronRight
} from 'lucide-react';

/* Services & Utils */
import { bulkCaptureUrl, captureUrlStream } from '../lib/api';
import { captureQueue } from '../lib/capture-queue';
import { getStorage, type Hash } from '../lib/storage-v2';
import { log, logger, type LogEntry } from '../lib/logger';
import { extractUrls, cn } from '../lib/utils';
import { useIOSToast, toast as toastHelper } from '../components/ios';

/* Components */
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { DAGMaterializer } from '../components/sovereignty/DAGMaterializer';

type CaptureStatus = 'idle' | 'extracting' | 'signing' | 'saving' | 'success' | 'error';

interface CapturedData {
  title: string;
  provider: string;
  messageCount: number;
  wordCount: number;
  conversationId: Hash;
  contentHash: Hash;
}

const PROVIDERS = [
  { name: 'ChatGPT',  color: '#10a37f' },
  { name: 'Claude',   color: '#d97706' },
  { name: 'Gemini',   color: '#4285f4' },
  { name: 'Grok',     color: '#1d1d1f' },
  { name: 'DeepSeek', color: '#6366f1' },
  { name: 'Kimi',     color: '#0ea5e9' },
  { name: 'Qwen',     color: '#f59e0b' },
  { name: 'Zai',      color: '#8b5cf6' },
];

export const Capture: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<CapturedData | null>(null);
  const [bulkResults, setBulkResults] = useState<any[] | null>(null);

  const [userInput, setUserInput] = useState('');
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<LogEntry[]>([]);

  const { toast } = useIOSToast();

  useEffect(() => {
    const handleLog = (entry: LogEntry) => {
      if (['CAPTURE', 'API', 'STORAGE', 'DAG', 'CRYPTO'].includes(entry.module)) {
        setSessionLogs((prev) => [entry, ...prev].slice(0, 50));
      }
    };
    logger.addListener(handleLog);
    return () => logger.removeListener(handleLog);
  }, []);

  const getTargetUrl = useCallback((): string | null => {
    const urlParam = searchParams.get('url');
    const textParam = searchParams.get('text');
    if (urlParam) return urlParam;
    if (textParam) {
      const urlMatch = textParam.match(/https?:\/\/[^\s]+/);
      if (urlMatch) return urlMatch[0];
    }
    return null;
  }, [searchParams]);

  const processCapture = useCallback(
    async (urlOverride?: string | string[]) => {
      const input = urlOverride || getTargetUrl();
      if (!input) {
        setStatus('idle');
        return;
      }

      const urls = Array.isArray(input) ? input : extractUrls(input as string);
      const isBulk = urls.length > 1;

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      logger.connectToServer(apiBaseUrl);

      setTargetUrl(isBulk ? `${urls.length} urls` : urls[0]);
      setProgress(5);
      setStatus('extracting');
      setError(null);
      setBulkResults(null);
      setCaptured(null);

      try {
        if (isBulk) {
          setProgress(20);
          const results = await bulkCaptureUrl(urls);
          setBulkResults(results);
          setProgress(100);
          setStatus('success');
          return;
        }

        const url = urls[0];
        const data = await captureUrlStream(url, (update) => {
          setProgress(15 + update.percent * 0.7);
        });

        setStatus('signing');
        setProgress(85);

        const storage = getStorage();
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

        setProgress(95);
        const messages = await storage.getMessages(conversationId);
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
        logger.disconnectFromServer();
      } catch (err: any) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        if (!isBulk && (errorMsg.toLowerCase().includes('fetch') || errorMsg.toLowerCase().includes('unreachable'))) {
          captureQueue.enqueue(urls[0]);
        }
        setError(isBulk ? `Bulk sync failed: ${errorMsg}` : 'Materialization failed');
        setStatus('error');
        logger.disconnectFromServer();
      }
    },
    [getTargetUrl]
  );

  useEffect(() => {
    if (status === 'idle' && getTargetUrl()) {
      processCapture();
    }
  }, [status, getTargetUrl, processCapture]);

  useEffect(() => {
    setIsBulkMode(extractUrls(userInput).length > 1);
  }, [userInput]);

  if (status === 'idle') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-20">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-primary-500/20">
            <Download className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Save Intelligence</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Paste a shared AI link and we'll materialize it into your local-first library.
          </p>
        </div>

        <Card variant="glass" padding="lg" className="border-none shadow-sm">
          <div className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {PROVIDERS.map((p) => (
                <div key={p.name} className="flex flex-col items-center gap-2 group cursor-help" title={p.name}>
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm border border-border/50 group-hover:border-primary/50 transition-colors">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.name[0]}</span>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">How it works</h3>
              <div className="space-y-4">
                {[
                  { step: 1, text: 'Open a chat in any supported AI app.' },
                  { step: 2, text: 'Tap Share → Public Link, then copy the URL.' },
                  { step: 3, text: 'Paste it below — VIVIM saves it instantly.' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                      {step}
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); processCapture(userInput); }} className="space-y-4">
              <Input 
                label={isBulkMode ? "Bulk Intelligence Input" : "Conversation URL"}
                placeholder="https://chatgpt.com/share/..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                leftIcon={<Zap className="w-4 h-4" />}
                rightIcon={userInput && <Send className="w-4 h-4" />}
                onRightIconClick={() => processCapture(userInput)}
                className="bg-background border-none shadow-inner"
              />
              <Button 
                variant="primary" 
                fullWidth 
                size="lg" 
                disabled={!userInput}
                className="rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/20 border-none h-14 text-lg"
              >
                {isBulkMode ? 'Materialize All Feeds' : 'Capture Intelligence'}
              </Button>
            </form>
          </div>
        </Card>

        {captureQueue.getQueue().length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-warning-600">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Pending Sync ({captureQueue.getQueue().length})</span>
              </div>
              <button onClick={() => { captureQueue.clear(); window.location.reload(); }} className="text-xs font-bold text-primary hover:underline">Clear Queue</button>
            </div>
            <div className="grid gap-2">
              {captureQueue.getQueue().slice(0, 3).map((link, idx) => (
                <Card key={idx} variant="glass" padding="sm" clickable onClick={() => processCapture(link.url)} className="flex items-center justify-between border-none shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold capitalize">{link.provider}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(link.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-8">
      <Card variant="glass" padding="lg" className="border-none shadow-xl">
        {/* Processing State */}
        {(status === 'extracting' || status === 'signing' || status === 'saving') && (
          <div className="text-center space-y-8 py-4">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
              <div className="absolute inset-4 rounded-2xl bg-primary/5 flex items-center justify-center animate-pulse">
                {status === 'extracting' ? <Activity className="w-8 h-8 text-primary" /> : <Fingerprint className="w-8 h-8 text-accent-500" />}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {status === 'extracting' ? 'Extracting Feed' : status === 'signing' ? 'Authenticating' : 'Materializing'}
              </h2>
              <p className="text-sm text-muted-foreground truncate px-10">{targetUrl}</p>
            </div>

            <DAGMaterializer progress={progress} status={status} />

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Intelligence Sync</span>
                <span className="text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary" 
                  initial={{ width: 0 }} 
                  animate={{ width: `${progress}%` }} 
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {sessionLogs.length > 0 && (
              <div className="bg-black rounded-2xl p-4 text-left font-mono text-[10px] space-y-1 overflow-hidden shadow-inner max-h-40 overflow-y-auto custom-scrollbar border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-green-500 border-b border-white/5 pb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-bold tracking-widest">REALTIME_LOG.STREAM</span>
                </div>
                {sessionLogs.map((log, i) => (
                  <div key={log.id} className="opacity-80">
                    <span className="text-white/20 mr-2">{(sessionLogs.length - i).toString().padStart(2, '0')}</span>
                    <span className={cn(
                      log.level === 'ERROR' ? 'text-red-400' : 
                      log.level === 'WARN' ? 'text-yellow-400' : 
                      log.message.includes('✓') ? 'text-green-400' : 'text-white/70'
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center space-y-8 py-4 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-success-50 dark:bg-success-500/10 rounded-full mx-auto flex items-center justify-center shadow-xl shadow-success-500/10">
              <CheckCircle className="w-12 h-12 text-success-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Intelligence Captured</h2>
              <p className="text-sm text-muted-foreground font-medium">Materialization Successful</p>
            </div>

            <div className="bg-success-50 dark:bg-success-500/10 border border-success-500/20 rounded-full py-2 px-4 inline-flex items-center gap-2">
              <Shield className="w-4 h-4 text-success-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-success-600 dark:text-success-400">Verified Local DAG</span>
            </div>

            {captured && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-2xl p-4 border border-border/50">
                  <p className="text-2xl font-black">{captured.messageCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Messages</p>
                </div>
                <div className="bg-background rounded-2xl p-4 border border-border/50">
                  <p className="text-2xl font-black capitalize text-sm h-8 flex items-center justify-center">{captured.provider}</p>
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Engine</p>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <Button size="lg" fullWidth className="h-14 rounded-2xl text-lg shadow-lg shadow-primary/20" onClick={() => navigate(`/ai/conversation/${captured?.conversationId}`)}>
                Enter Knowledge
              </Button>
              <Button variant="ghost" fullWidth onClick={() => { setStatus('idle'); setUserInput(''); }}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center space-y-8 py-4 animate-in slide-in-from-top-4">
            <div className="w-24 h-24 bg-error-50 dark:bg-error-500/10 rounded-full mx-auto flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-error-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Sync Failed</h2>
              <p className="text-sm text-muted-foreground">Intelligence Materialization Error</p>
            </div>

            <div className="bg-error-50 dark:bg-error-500/10 border border-error-500/20 rounded-2xl p-4 text-left space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-error-600">Error_Report:</p>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">{error}</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" fullWidth onClick={() => setStatus('idle')}>Later</Button>
              <Button variant="primary" fullWidth onClick={() => processCapture(userInput || targetUrl || undefined)}>Retry</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Capture;

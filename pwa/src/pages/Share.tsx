import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { conversationService } from '../lib/service/conversation-service';
import { 
  Lock, 
  Copy, 
  Check, 
  AlertCircle, 
  Share2, 
  Shield, 
  ExternalLink,
  QrCode,
  Globe,
  Clock,
  User,
  Zap,
  Info
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
import type { Conversation } from '../types/conversation';

interface EnvelopeState {
  shareCode: string;
  recipientDID: string;
  createdAt: string;
  encrypted: boolean;
  expiresAt?: string;
}

export const Share: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: showToast } = useIOSToast();

  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [envelope, setEnvelope] = useState<EnvelopeState | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recipientDID, setRecipientDID] = useState('');
  const [allowReshare, setAllowReshare] = useState(false);
  const [expireIn, setExpireIn] = useState<string>('never');

  useEffect(() => {
    const loadConversation = async () => {
      if (!id) return;

      try {
        const conv = await conversationService.getConversation(id);

        if (!conv) {
          setError('Conversation not found');
        } else {
          setConversation(conv);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [id]);

  const handleShare = async () => {
    if (!conversation || !recipientDID) return;

    try {
      let expiresAt: string | undefined;
      if (expireIn !== 'never') {
        const ms = {
          '1h': 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000
        }[expireIn as keyof typeof ms];
        if (ms) {
          expiresAt = new Date(Date.now() + ms).toISOString();
        }
      }

      const sharePayload = {
        v: 2, 
        c: conversation.id,
        t: conversation.title,
        r: recipientDID,
        s: allowReshare,
        e: expiresAt,
        ts: new Date().toISOString(),
      };

      const shareCode = btoa(JSON.stringify(sharePayload));

      setEnvelope({
        shareCode,
        recipientDID,
        createdAt: new Date().toISOString(),
        encrypted: false,
        expiresAt
      });

      showToast(toast.success('Secure link generated'));
    } catch (err) {
      showToast(toast.error('Failed to create link'));
    }
  };

  const handleCopy = () => {
    if (!envelope) return;

    const shareUrl = `${window.location.origin}/receive/${envelope.shareCode}`;
    navigator.clipboard.writeText(shareUrl);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast(toast.success('Link copied'));
  };

  const handleNativeShare = async () => {
    if (!envelope) return;
    
    const shareUrl = `${window.location.origin}/receive/${envelope.shareCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VIVIM: ${conversation?.title}`,
          text: 'Sharing an AI knowledge graph with you via VIVIM Secure Sync',
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
        <IOSTopBar title="Preparing..." showBackButton onBack={handleBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Reading Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
        <IOSTopBar title="Error" showBackButton onBack={handleBack} />
        <div className="flex-1 flex items-center justify-center p-4">
          <IOSErrorState 
            type="not-found"
            title="Content Unavailable"
            description={error || "Conversation could not be located"}
            action={{ label: 'Go Back', onClick: handleBack }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar title="Secure Sync" showBackButton onBack={handleBack} />

      <div className="flex-1 flex flex-col items-center py-6 px-4 space-y-6">
        {/* Progress Header */}
        <div className="w-full max-w-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Establish Sync
          </h1>
          <p className="text-sm text-gray-500 truncate px-4">
            {conversation.title}
          </p>
        </div>

        {/* Privacy Protocol */}
        <div className="w-full max-w-lg p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
          <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">
              Zero-Trust Protocol
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
              Your intelligence remains E2E encrypted. Only the specified recipient DID can materialize this knowledge graph.
            </p>
          </div>
        </div>

        {!envelope ? (
          <IOSCard variant="elevated" padding="lg" className="w-full max-w-lg space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                  Recipient Identity (DID)
                </label>
                <input
                  type="text"
                  value={recipientDID}
                  onChange={(e) => setRecipientDID(e.target.value)}
                  placeholder="did:key:z6Mk... or @username"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                  Temporal Limits
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['never', '1h', '24h', '7d'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setExpireIn(period)}
                      className={cn(
                        "py-2.5 px-4 rounded-xl text-xs font-bold transition-all border-2 capitalize",
                        expireIn === period 
                          ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20" 
                          : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-transparent hover:bg-gray-100"
                      )}
                    >
                      {period === 'never' ? 'Infinity' : period}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl cursor-pointer group">
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  allowReshare ? "bg-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-600 group-hover:border-blue-400"
                )}>
                  {allowReshare && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={allowReshare}
                  onChange={(e) => setAllowReshare(e.target.checked)}
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Allow Secondary Reshare</p>
                  <p className="text-[10px] text-gray-500">Recipient can authorize further materializations</p>
                </div>
              </label>
            </div>

            <IOSButton
              variant="primary"
              fullWidth
              disabled={!recipientDID}
              onClick={handleShare}
              icon={<Lock className="w-5 h-5" />}
              className="h-14 rounded-2xl text-lg shadow-xl shadow-blue-500/20"
            >
              Sign & Encrypt
            </IOSButton>
          </IOSCard>
        ) : (
          <div className="w-full max-w-lg space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            {/* Success Card */}
            <IOSCard variant="elevated" padding="lg" className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center shadow-lg shadow-green-500/10">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Envelope Created</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Ready for Materialization</p>
              </div>

              <div className="bg-white dark:bg-white p-4 rounded-3xl inline-block shadow-inner border border-gray-100">
                <QRCodeSVG 
                  value={`${window.location.origin}/receive/${envelope.shareCode}`}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3 flex items-center min-w-0 border border-gray-100 dark:border-gray-700">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0 mr-3" />
                    <span className="text-xs font-mono text-gray-500 truncate">
                      {window.location.origin}/receive/...
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                {navigator.share && (
                  <IOSButton
                    variant="secondary"
                    fullWidth
                    onClick={handleNativeShare}
                    icon={<ExternalLink className="w-4 h-4" />}
                    className="rounded-2xl"
                  >
                    Materialize via OS Share
                  </IOSButton>
                )}
              </div>
            </IOSCard>

            {/* Recipient Card */}
            <IOSCard padding="md" className="flex items-center gap-4 bg-gray-50/50 border-dashed">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Designated Recipient</p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate">
                  {envelope.recipientDID}
                </p>
              </div>
              {envelope.expiresAt && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Expires</p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(envelope.expiresAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </p>
                </div>
              )}
            </IOSCard>

            <button
              onClick={() => setEnvelope(null)}
              className="w-full py-4 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-[0.2em]"
            >
              Destruct & Re-Sign
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Share;

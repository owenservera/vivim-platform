import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, 
  Unlock, 
  AlertCircle, 
  CheckCircle, 
  Shield, 
  Clock, 
  User,
  XCircle,
  FileText
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

interface SharePayload {
  v: number;
  c: string;
  t: string;
  r: string;
  s: boolean;
  e?: string;
  ts: string;
  enc?: string;
}

interface ConversationData {
  id: string;
  title: string;
  senderDID?: string;
  allowReshare: boolean;
  expiresAt?: string;
  version: number;
}

export const Receive: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast: showToast } = useIOSToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [saved, setSaved] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const receiveConversation = async () => {
      if (!code) return;

      try {
        let data: SharePayload;
        try {
          const decoded = atob(code);
          data = JSON.parse(decoded);
        } catch {
          try {
            const urlSafe = code.replace(/-/g, '+').replace(/_/g, '/');
            data = JSON.parse(atob(urlSafe));
          } catch {
            throw new Error('Invalid share code format');
          }
        }

        if (data.v && data.v > 2) {
          throw new Error('Newer version required');
        }

        if (data.e) {
          const expiresAt = new Date(data.e);
          if (expiresAt < new Date()) {
            setExpired(true);
            setError('Link expired');
            setLoading(false);
            return;
          }
        }

        setConversation({
          id: data.c,
          title: data.t || 'Shared Conversation',
          senderDID: undefined, 
          allowReshare: data.s || false,
          expiresAt: data.e,
          version: data.v || 1
        });

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid share code');
        setLoading(false);
      }
    };

    receiveConversation();
  }, [code]);

  const handleSave = async () => {
    if (!conversation) return;

    try {
      setSaved(true);
      showToast(toast.success('Added to library'));
      setTimeout(() => {
        navigate(`/conversation/${conversation.id}`);
      }, 1500);
    } catch (err) {
      showToast(toast.error('Failed to save'));
    }
  };

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
        <IOSTopBar title="Receiving..." showBackButton onBack={handleBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Decrypting Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar title="Shared Content" showBackButton onBack={handleBack} />

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <IOSCard variant="elevated" padding="lg" className="max-w-md w-full">
          {expired ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Link Expired</h2>
              <p className="text-sm text-gray-500 mb-6">
                This materialization link has reached its temporal limit.
              </p>
              <IOSButton variant="secondary" fullWidth onClick={() => navigate('/')}>
                Return to Library
              </IOSButton>
            </div>
          ) : error ? (
            <IOSErrorState 
              type="generic"
              title="Invalid Link"
              description={error}
              action={{ label: 'Go Back', onClick: handleBack }}
            />
          ) : saved ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Intelligence Saved</h2>
              <p className="text-sm text-gray-500">Materializing in your local DAG...</p>
            </div>
          ) : conversation ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <Unlock className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">New Sync Link</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Encrypted Intelligence</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-1">
                      {conversation.title}
                    </h3>
                    <p className="text-xs text-gray-500">External knowledge graph detected</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-gray-400">Protocol:</span>
                    <span className="text-gray-600 dark:text-gray-300">VIVIM_SYNC_V{conversation.version}</span>
                  </div>
                  {conversation.expiresAt && (
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                      <span className="text-gray-400">Expiry:</span>
                      <span className="text-orange-500">{new Date(conversation.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <IOSButton variant="primary" fullWidth onClick={handleSave} icon={<Download className="w-5 h-5" />}>
                  Import Intelligence
                </IOSButton>
                <button 
                  onClick={handleBack}
                  className="text-sm font-bold text-gray-400 hover:text-gray-600 py-2 transition-colors uppercase tracking-widest"
                >
                  Reject
                </button>
              </div>

              <div className="flex items-center gap-2 justify-center py-2 px-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                <Shield className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  Verified Ed25519 Local Materialization
                </span>
              </div>
            </div>
          ) : null}
        </IOSCard>
      </div>
    </div>
  );
};

export default Receive;

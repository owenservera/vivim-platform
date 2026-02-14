import React, { useState } from 'react';
import { 
  Share2, 
  Link, 
  QrCode, 
  Users, 
  Globe, 
  Lock,
  Clock,
  Copy,
  Check,
  X
} from 'lucide-react';
import { IOSCard, IOSButton, IOSInput, IOSAvatar } from './index';
import { useIOSToast, toast } from './Toast';
import { cn } from '../../lib/utils';
import type { ShareVisibility, Circle } from '../../types/features';

interface ShareDialogProps {
  conversationId: string;
  conversationTitle: string;
  open: boolean;
  onClose: () => void;
  circles?: Circle[];
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  conversationId,
  conversationTitle,
  open,
  onClose,
  circles = [],
}) => {
  const [visibility, setVisibility] = useState<ShareVisibility>('private');
  const [selectedCircle, setSelectedCircle] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [allowForks, setAllowForks] = useState(true);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast: showToast } = useIOSToast();

  const generateLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/share/${conversationId}?v=${visibility}${selectedCircle ? `&c=${selectedCircle}` : ''}`;
    setShareLink(link);
  };

  const handleCopy = async () => {
    if (!shareLink) {
      generateLink();
      return;
    }
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    showToast(toast.success('Link copied to clipboard'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareP2P = () => {
    showToast(toast.info('P2P sharing initiated'));
  };

  const handleGenerateQR = () => {
    if (!shareLink) generateLink();
    showToast(toast.info('QR Code generation coming soon'));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <IOSCard 
        variant="elevated" 
        padding="lg" 
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Share Conversation
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Sharing:
          </p>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {conversationTitle}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Visibility
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVisibility('private')}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                visibility === 'private'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-sm text-gray-900 dark:text-white">Private</p>
                <p className="text-xs text-gray-500">Only you</p>
              </div>
            </button>

            <button
              onClick={() => setVisibility('link')}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                visibility === 'link'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <Link className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-sm text-gray-900 dark:text-white">Link</p>
                <p className="text-xs text-gray-500">Anyone with link</p>
              </div>
            </button>

            <button
              onClick={() => setVisibility('circle')}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                visibility === 'circle'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-sm text-gray-900 dark:text-white">Circle</p>
                <p className="text-xs text-gray-500">Specific group</p>
              </div>
            </button>

            <button
              onClick={() => setVisibility('public')}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                visibility === 'public'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-sm text-gray-900 dark:text-white">Public</p>
                <p className="text-xs text-gray-500">Discoverable</p>
              </div>
            </button>
          </div>
        </div>

        {visibility === 'circle' && circles.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Select Circle
            </p>
            <div className="space-y-2">
              {circles.map((circle) => (
                <button
                  key={circle.id}
                  onClick={() => setSelectedCircle(circle.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                    selectedCircle === circle.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  <IOSAvatar initials={circle.name.slice(0, 2)} size="sm" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {circle.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {circle.memberCount} members
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Options
          </p>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Expires</p>
                <p className="text-xs text-gray-500">When link expires</p>
              </div>
            </div>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="never">Never</option>
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Allow Forks</p>
                <p className="text-xs text-gray-500">Others can create derivatives</p>
              </div>
            </div>
            <button
              onClick={() => setAllowForks(!allowForks)}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                allowForks ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
                  allowForks ? 'left-7' : 'left-1'
                )}
              />
            </button>
          </div>
        </div>

        {(visibility === 'link' || visibility === 'public') && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Share Link
            </p>
            <div className="flex gap-2">
              <IOSInput
                value={shareLink || 'Click Generate to create link'}
                readOnly
                className="flex-1"
              />
              <IOSButton
                variant={shareLink ? 'secondary' : 'primary'}
                onClick={shareLink ? handleCopy : generateLink}
                icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {shareLink ? (copied ? 'Copied!' : 'Copy') : 'Generate'}
              </IOSButton>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <IOSButton
            variant="secondary"
            fullWidth
            onClick={handleShareP2P}
            icon={<Share2 className="w-4 h-4" />}
          >
            P2P Direct
          </IOSButton>
          <IOSButton
            variant="secondary"
            fullWidth
            onClick={handleGenerateQR}
            icon={<QrCode className="w-4 h-4" />}
          >
            QR Code
          </IOSButton>
        </div>
      </IOSCard>
    </div>
  );
};

export default ShareDialog;

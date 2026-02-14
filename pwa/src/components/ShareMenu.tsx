/**
 * Share Menu Component
 * 
 * Share conversations and ACUs to various platforms
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Share2, Copy, Twitter, Linkedin, Mail, Link, X, Loader2, Check } from 'lucide-react';
import './ShareMenu.css';

interface ShareMenuProps {
  conversationId: string;
  title?: string;
  shareUrl?: string;
  onCopyLink?: () => void;
  onShareToFeed?: () => void;
}

type ShareOption = 'copy' | 'twitter' | 'linkedin' | 'email' | 'feed';

interface ShareOptionConfig {
  id: ShareOption;
  label: string;
  icon: React.ReactNode;
  getUrl: (url: string, title: string) => string;
  color: string;
}

const SHARE_OPTIONS: ShareOptionConfig[] = [
  {
    id: 'copy',
    label: 'Copy Link',
    icon: <Copy size={18} />,
    getUrl: () => '',
    color: '#64748b',
  },
  {
    id: 'twitter',
    label: 'Share on X',
    icon: <Twitter size={18} />,
    getUrl: (url, title) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    color: '#000000',
  },
  {
    id: 'linkedin',
    label: 'Share on LinkedIn',
    icon: <Linkedin size={18} />,
    getUrl: (url) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    color: '#0A66C2',
  },
  {
    id: 'email',
    label: 'Send via Email',
    icon: <Mail size={18} />,
    getUrl: (url, title) => 
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    color: '#EA4335',
  },
];

export function ShareMenu({ 
  conversationId, 
  title = 'Check out this AI conversation',
  shareUrl,
  onCopyLink,
  onShareToFeed,
}: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<ShareOption | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Generate share URL if not provided
  const getShareUrl = useCallback(() => {
    return shareUrl || `${window.location.origin}/conversation/${conversationId}`;
  }, [conversationId, shareUrl]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = useCallback(async (option: ShareOptionConfig) => {
    const url = getShareUrl();

    if (option.id === 'copy') {
      setLoading('copy');
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        onCopyLink?.();
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      } finally {
        setLoading(null);
      }
    } else if (option.id === 'feed') {
      setLoading('feed');
      try {
        await onShareToFeed?.();
      } catch (err) {
        console.error('Failed to share to feed:', err);
      } finally {
        setLoading(null);
        setIsOpen(false);
      }
    } else {
      // Open share dialog
      window.open(
        option.getUrl(url, title),
        'share',
        'width=600,height=400,menubar=no,toolbar=no'
      );
    }
  }, [getShareUrl, title, onCopyLink, onShareToFeed]);

  return (
    <div className="share-menu-container">
      <button
        ref={buttonRef}
        className="share-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Share"
        aria-expanded={isOpen}
      >
        <Share2 size={18} />
      </button>

      {isOpen && (
        <div ref={menuRef} className="share-menu">
          <div className="share-menu-header">
            <h3>Share</h3>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="share-options">
            {SHARE_OPTIONS.map(option => (
              <button
                key={option.id}
                className={`share-option ${loading === option.id ? 'loading' : ''}`}
                onClick={() => handleShare(option)}
                disabled={loading !== null}
              >
                <span className="option-icon" style={{ color: option.color }}>
                  {loading === option.id ? (
                    <Loader2 size={18} className="spinner" />
                  ) : option.id === 'copy' && copied ? (
                    <Check size={18} />
                  ) : (
                    option.icon
                  )}
                </span>
                <span className="option-label">
                  {option.id === 'copy' && copied ? 'Copied!' : option.label}
                </span>
              </button>
            ))}
          </div>

          {onShareToFeed && (
            <div className="share-to-feed">
              <button
                className="feed-option"
                onClick={() => handleShare({ ...SHARE_OPTIONS[0], id: 'feed' } as ShareOptionConfig)}
                disabled={loading !== null}
              >
                <span className="feed-icon">📢</span>
                <span className="option-label">Share to VIVIM Feed</span>
              </button>
            </div>
          )}

          <div className="share-url">
            <Link size={14} />
            <input
              type="text"
              value={getShareUrl()}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ShareMenu;

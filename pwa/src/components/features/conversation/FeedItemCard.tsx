import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  LayoutList, 
  FileCode, 
  GitBranch, 
  Sparkles, 
  BookOpen, 
  Pin, 
  Archive,
  Globe
} from 'lucide-react';
import { ErrorBoundary } from '../../ErrorBoundary';
import { ContentRenderer } from '../../content/ContentRenderer';
import { TrustSeal } from '../../sovereignty/TrustSeal';
import type { Conversation } from '@/types/conversation';
import type { AIAction } from '@/types/features';

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    const now  = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000)     return 'Just now';
    if (diff < 3600000)   return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000)  return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  } catch { return 'Unknown'; }
};

const isNew = (dateString: string | undefined) => {
  if (!dateString) return false;
  const diff = Date.now() - new Date(dateString).getTime();
  return diff < 86400000 * 2; // last 48h
};

const getPreviewText = (convo: Conversation): string => {
  if (!convo.messages?.length) return '';
  const msgs = [...convo.messages].reverse();
  for (const msg of msgs) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      const parts = (msg as any).parts || msg.content || [];
      if (Array.isArray(parts)) {
        for (const p of parts) {
          if (typeof p === 'string' && p.trim().length > 0) return p.trim();
          if (p?.type === 'text' && p.text?.trim()) return p.text.trim();
        }
      }
      if (typeof msg.content === 'string' && msg.content.trim()) {
        return msg.content.trim();
      }
    }
  }
  return '';
};

const providerColor: Record<string, string> = {
  chatgpt:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  claude:     'bg-orange-50  text-orange-700  dark:bg-orange-900/30  dark:text-orange-400',
  gemini:     'bg-blue-50    text-blue-700    dark:bg-blue-900/30    dark:text-blue-400',
  grok:       'bg-red-50     text-red-700     dark:bg-red-900/30     dark:text-red-400',
  perplexity: 'bg-purple-50  text-purple-700  dark:bg-purple-900/30  dark:text-purple-400',
  deepseek:   'bg-cyan-50    text-cyan-700    dark:bg-cyan-900/30    dark:text-cyan-400',
  kimi:       'bg-pink-50    text-pink-700    dark:bg-pink-900/30    dark:text-pink-400',
  qwen:       'bg-indigo-50  text-indigo-700  dark:bg-indigo-900/30  dark:text-indigo-400',
  other:      'bg-gray-100   text-gray-600    dark:bg-gray-800       dark:text-gray-400',
  default:    'bg-gray-100   text-gray-600    dark:bg-gray-800       dark:text-gray-400',
};

const providerEmoji: Record<string, string> = {
  chatgpt: '🤖', claude: '✨', gemini: '💎', grok: '🚀',
  perplexity: '🔮', deepseek: '🔍', kimi: '🎯', qwen: '🌐',
  other: '💬', default: '💬',
};

interface FeedItemCardProps {
  conversation: Conversation;
  isPinned: boolean;
  isArchived: boolean;
  gridMode?: boolean;
  onContinue: (id: string, messages?: any[]) => void;
  onShare: (id: string) => void;
  onPinToggle: (id: string, pinned: boolean) => void;
  onArchiveToggle: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
  onFork: (id: string, forkId: string) => void;
  onDuplicate: (id: string, newId: string) => void;
  onAIClick: (action: AIAction, id: string) => void;
  onExpandToggle?: (id: string) => void;
  overrideMessages?: any[];
  isLoadingAI?: boolean;
  onVisibilityToggle?: (id: string, visibility: string) => void;
}

export const FeedItemCard: React.FC<FeedItemCardProps> = ({
  conversation: convo,
  isPinned,
  isArchived,
  gridMode = false,
  onContinue,
  onShare,
  onPinToggle,
  onArchiveToggle,
  onDelete,
  onFork,
  onDuplicate,
  onAIClick,
  isExpanded,
  onExpandToggle,
  overrideMessages,
  isLoadingAI,
  onVisibilityToggle,
}) => {
  const navigate = useNavigate();
  const prov = convo.provider || 'default';
  const previewText = getPreviewText(convo);
  const tags = Array.isArray(convo.tags) ? convo.tags.slice(0, 3) : [];
  const msgCount = convo.stats?.totalMessages ?? convo.messages?.length ?? 0;
  const wordCount = convo.stats?.totalWords ?? 0;
  const codeBlocks = convo.stats?.totalCodeBlocks ?? 0;
  const isNewConvo = isNew(convo.createdAt);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const scrollEl = scrollContainerRef.current;
    const handleScroll = () => {
      const isNearBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 50;
      userScrolledUp.current = !isNearBottom;
    };
    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isExpanded && scrollContainerRef.current) {
      if (userScrolledUp.current) return;
      const container = scrollContainerRef.current;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [overrideMessages, isLoadingAI, isExpanded]);

  useEffect(() => {
    if (isExpanded && overrideMessages && cardRef.current) {
       cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [overrideMessages, isLoadingAI, isExpanded]);

  return (
    <ErrorBoundary
      fallback={
        <div className="px-4 py-3 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl">
          Failed to render
        </div>
      }
    >
      <div
        ref={cardRef}
        className={`conv-card-enhanced ${isPinned ? 'is-pinned' : ''} ${isArchived ? 'is-archived' : ''}`}
        onClick={() => {
          if (gridMode || !onExpandToggle) {
            navigate(`/ai/conversation/${convo.id}`);
          } else {
            onExpandToggle(convo.id);
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { 
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (gridMode || !onExpandToggle) {
              navigate(`/ai/conversation/${convo.id}`);
            } else {
              onExpandToggle(convo.id);
            }
          }
        }}
        id={`conv-card-${convo.id}`}
      >
        <div className={`conv-card-accent ${prov}`} />

        <div className="conv-card-body">
          <div className="flex items-center gap-2 mb-2">
            <span className={`conv-provider-chip ${providerColor[prov] || providerColor.default}`}>
              {providerEmoji[prov] || '💬'} {prov}
            </span>
            {isNewConvo && (
              <span className="conv-new-badge">✦ New</span>
            )}
            <TrustSeal 
              status={convo.metadata?.tampered ? 'tampered' : (convo.id ? 'verified' : 'unverified')} 
              className="ml-1"
            />
            <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-600 flex-shrink-0">
              {formatDate(convo.createdAt)}
            </span>
          </div>

          <h3 className={`font-semibold text-gray-900 dark:text-white leading-snug ${gridMode ? 'text-[13px] line-clamp-2' : 'text-sm truncate'}`}>
            {convo.title || 'Untitled Conversation'}
          </h3>

          {!gridMode && previewText && (
            <p className="conv-preview-text mt-1">{previewText}</p>
          )}

          {tags.length > 0 && (
            <div className="conv-tags">
              {tags.map((tag) => (
                <span key={tag} className="conv-tag">#{tag}</span>
              ))}
            </div>
          )}

          <div className="conv-mini-stats mt-2">
            {msgCount > 0 && (
              <span className="conv-mini-stat">
                <MessageSquare className="w-[11px] h-[11px]" aria-hidden="true" />
                <span className="sr-only">Messages: </span>
                {msgCount}
              </span>
            )}
            {wordCount > 0 && (
              <span className="conv-mini-stat">
                <LayoutList className="w-[11px] h-[11px]" aria-hidden="true" />
                <span className="sr-only">Words: </span>
                {wordCount >= 1000 ? `${(wordCount / 1000).toFixed(1)}k` : wordCount}w
              </span>
            )}
            {codeBlocks > 0 && (
              <span className="conv-mini-stat">
                <FileCode className="w-[11px] h-[11px]" aria-hidden="true" />
                <span className="sr-only">Code blocks: </span>
                {codeBlocks}
              </span>
            )}
            {convo.metadata?.forkCount && (
              <span className="conv-mini-stat text-indigo-500">
                <GitBranch className="w-[11px] h-[11px]" aria-hidden="true" />
                <span className="sr-only">Forks: </span>
                {convo.metadata.forkCount}
              </span>
            )}
          </div>

          {!gridMode && (
            <div
              className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onContinue(convo.id, convo.messages); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                Continue with AI
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onShare(convo.id); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                Share
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prev = isPinned;
                  onPinToggle(convo.id, !prev);
                }}
                className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title={isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
              </button>
              {onVisibilityToggle && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextVisibility = convo.visibility === 'public' ? 'private' : 'public';
                    onVisibilityToggle(convo.id, nextVisibility);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${convo.visibility === 'public' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title={convo.visibility === 'public' ? 'Unpublish from Scroll' : 'Publish to Scroll'}
                >
                  <Globe className={`w-3.5 h-3.5 ${convo.visibility === 'public' ? 'fill-current' : ''}`} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prev = isArchived;
                  onArchiveToggle(convo.id, !prev);
                }}
                className={`p-1.5 rounded-lg transition-colors ${isArchived ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title={isArchived ? 'Unarchive' : 'Archive'}
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {gridMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onContinue(convo.id); }}
              className="mt-2 w-full text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 text-center py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              Continue →
            </button>
          )}

          {isExpanded && !gridMode && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Conversation</span>
              </div>
              <div 
                ref={scrollContainerRef}
                className="max-h-[600px] overflow-y-auto pr-2 space-y-6 custom-scrollbar flex flex-col items-stretch"
              >
                {(overrideMessages || convo.messages || []).map((msg: any, i: number) => {
                  const parts = msg.parts || msg.content;
                  if (!parts) return null;
                  
                  return (
                    <div key={msg.id || i} className={`group relative flex flex-col w-full ${msg.role === 'user' ? 'items-end user-message-entry' : 'items-start assistant-message-entry'}`}>
                      <div className={`relative px-4 py-3 text-[13px] rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-sm md:max-w-[75%] max-w-[85%] shadow-md' 
                          : 'bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 rounded-bl-sm w-full border border-gray-100 dark:border-white/5 shadow-sm'
                      } overflow-x-hidden transition-all hover:shadow-lg`}>
                        {msg.role === 'user' ? (
                           <div className="whitespace-pre-wrap leading-relaxed">{typeof parts === 'string' ? parts : Array.isArray(parts) ? parts.map((p: any) => p.text || p.content || '').join('') : ''}</div>
                        ) : (
                          <ContentRenderer content={parts} />
                        )}
                        
                        {!overrideMessages && msg.role === 'user' && (
                        <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex right-[calc(100%+0.75rem)]`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onContinue(convo.id, convo.messages.slice(0, i + 1));
                            }}
                            className="bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-full p-2 text-indigo-600 dark:text-indigo-400 hover:scale-110 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap group/btn"
                            title="Branch conversation from here"
                          >
                            <Sparkles className="w-3.5 h-3.5 group-hover/btn:animate-pulse" />
                            <span className="text-[10px] font-bold pr-1">Branch</span>
                          </button>
                        </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

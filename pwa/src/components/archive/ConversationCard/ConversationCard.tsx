import React from 'react';
import { ConversationMetadata } from '../../../lib/db/vivim-db';
import { MessageSquare, Calendar, Trash2, BookmarkPlus, Share, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { getProviderAccentConfig } from '../utils/providerColors';
import { cn } from '../../../lib/utils';
import { useArchiveStore } from '../../../stores/archive.store';

interface Props {
  data: ConversationMetadata;
  viewMode: 'list' | 'grid' | 'canvas' | 'timeline';
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (id: string) => void;
}

export const ConversationCard: React.FC<Props> = ({ 
  data, 
  viewMode, 
  isSelected = false, 
  onSelect, 
  onClick 
}) => {
  const { toggleSelection } = useArchiveStore();
  const providerConfig = getProviderAccentConfig(data.provider);

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(data.id);
    } else {
      toggleSelection(data.id);
    }
  };

  const isGrid = viewMode === 'grid';

  return (
    <div
      onClick={() => onClick?.(data.id)}
      className={cn(
        "group relative flex bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl cursor-pointer transition-all duration-300",
        "border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 hover:shadow-xl",
        isGrid ? "flex-col items-start p-5 min-h-[160px]" : "flex-row items-center p-4 gap-4",
        isSelected && `ring-2 ring-offset-2 ring-offset-transparent ring-[${providerConfig.hex}] bg-white/80 dark:bg-white/5`
      )}
      style={{
        '--provider-accent': providerConfig.hex,
      } as React.CSSProperties}
    >
      {/* Accent Line (Left edge in list, Top edge in grid) */}
      <div 
        className={cn(
          "absolute bg-[var(--provider-accent)] opacity-80 rounded-full transition-all duration-300",
          isGrid ? "top-0 left-4 right-4 h-[2px] mt-[-1px] group-hover:opacity-100" : "left-0 top-3 bottom-3 w-[3px] ml-[-1px] group-hover:opacity-100"
        )} 
      />

      {/* Primary Content Area */}
      <div className={cn("flex-1 min-w-0 flex", isGrid ? "flex-col w-full" : "flex-row items-center gap-4")}>
        
        {/* Title and Badge Row */}
        <div className={cn("flex min-w-0", isGrid ? "flex-col w-full mb-3" : "flex-row items-center flex-1 gap-3")}>
          <h3 className={cn(
            "font-semibold text-gray-900 dark:text-white truncate leading-tight tracking-tight",
            isGrid ? "text-base mb-1" : "text-[15px] flex-1"
          )}>
            {data.title || 'Untitled Conversation'}
          </h3>
          
          <div className={cn("flex items-center gap-1.5 flex-shrink-0", isGrid ? "" : "ml-auto")}>
            <span 
              className={cn("px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold border", 
                providerConfig.bgClass.replace('bg-', 'bg-').concat('/10'),
                providerConfig.textClass,
                providerConfig.borderClass.replace('border-', 'border-').concat('/20')
              )}
            >
              {providerConfig.name}
            </span>
            {data.isPinned && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.5)]" title="Pinned" />
            )}
          </div>
        </div>

        {/* Metadata Footer */}
        <div className={cn("flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500", isGrid ? "mt-auto pt-2" : "flex-shrink-0 min-w-[140px]")}>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 opacity-70" />
            {new Date(data.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <MessageSquare className="w-3.5 h-3.5 opacity-70" />
            {data.messageCount}
          </div>
        </div>
      </div>

      {/* Floating Action Overlay (Reveals on Hover) */}
      <div className={cn(
        "absolute flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl p-1 shadow-sm border border-black/5 dark:border-white/5",
        "opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100",
        isGrid ? "bottom-4 right-4" : "right-4 top-1/2 -translate-y-1/2"
      )}>
        <button 
          onClick={handleSelectClick}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isSelected ? providerConfig.textClass : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg transition-colors">
          <BookmarkPlus className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-black/10 dark:bg-white/10 my-auto mx-0.5" />
        <button className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

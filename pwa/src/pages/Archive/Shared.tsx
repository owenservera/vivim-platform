import { useEffect, useState } from 'react';
import { useVivimDB, ConversationMetadata } from '../../lib/db/vivim-db';
import { useArchiveStore } from '../../stores/archive.store';
import { ListView } from '../../components/archive/ViewModes/ListView';
import { GridView } from '../../components/archive/ViewModes/GridView';
import { IOSEmptyState } from '../../components/ios/EmptyState';
import { Share2 } from 'lucide-react';

export default function Shared() {
  const db = useVivimDB();
  const { viewMode, selectedIds, toggleSelection } = useArchiveStore();
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);

  useEffect(() => {
    let mounted = true;
    db.getAllMetadata().then(data => {
      const shared = data.filter(c => c.tags?.includes('shared'));
      if (mounted) setConversations(shared);
    });
    return () => { mounted = false; };
  }, [db]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Shared Zone Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Shared Conversations</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Conversations shared with you or by you</p>
        </div>
      </div>

      {/* Two-panel layout: Outbox + Inbox */}
      <div className="flex gap-0 h-[calc(100%-73px)] overflow-hidden">
        {/* Outbox */}
        <div className="flex-1 border-r border-black/5 dark:border-white/5 overflow-y-auto px-4 py-4 scrollbar-hide">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Outbox</h3>
          {conversations.length === 0 ? (
            <IOSEmptyState
              icon={<Share2 className="w-10 h-10 text-gray-400" strokeWidth={1.5} />}
              title="Nothing shared yet"
              description="Share a conversation to see it here."
            />
          ) : viewMode === 'grid' ? (
            <GridView conversations={conversations} selectedIds={selectedIds} onSelect={toggleSelection} onClick={(id) => console.log('open', id)} />
          ) : (
            <ListView conversations={conversations} selectedIds={selectedIds} onSelect={toggleSelection} onClick={(id) => console.log('open', id)} />
          )}
        </div>

        {/* Inbox */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Inbox</h3>
          <IOSEmptyState
            icon={<Share2 className="w-10 h-10 text-gray-400" strokeWidth={1.5} />}
            title="No incoming shares"
            description="Conversations shared with you will appear here."
          />
        </div>
      </div>
    </div>
  );
}

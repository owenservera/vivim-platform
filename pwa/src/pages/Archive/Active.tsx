import { useEffect, useState } from 'react';
import { useVivimDB, ConversationMetadata } from '../../lib/db/vivim-db';
import { useArchiveStore } from '../../stores/archive.store';
import { ListView } from '../../components/archive/ViewModes/ListView';
import { GridView } from '../../components/archive/ViewModes/GridView';
import { IOSEmptyState } from '../../components/ios/EmptyState';
import { Zap } from 'lucide-react';

export default function Active() {
  const db = useVivimDB();
  const { viewMode, selectedIds, toggleSelection } = useArchiveStore();
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);

  useEffect(() => {
    let mounted = true;
    // Active = not archived, pinned first, last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    db.getAllMetadata().then(data => {
      const active = data.filter(c => !c.isArchived && c.lastMessageAt >= thirtyDaysAgo);
      // Sort by last activity
      active.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
      if (mounted) setConversations(active);
    });
    return () => { mounted = false; };
  }, [db]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Active Conversations</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{conversations.length} active in the last 30 days</p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="flex items-center justify-center p-8 h-full">
          <IOSEmptyState
            icon={<Zap className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
            title="No active conversations"
            description="Conversations you've engaged with in the last 30 days will appear here."
            className="mt-8"
          />
        </div>
      ) : viewMode === 'grid' ? (
        <GridView conversations={conversations} selectedIds={selectedIds} onSelect={toggleSelection} onClick={(id) => console.log('open', id)} />
      ) : (
        <ListView conversations={conversations} selectedIds={selectedIds} onSelect={toggleSelection} onClick={(id) => console.log('open', id)} />
      )}
    </div>
  );
}

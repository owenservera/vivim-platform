import { useEffect, useState } from 'react';
import { useVivimDB, ConversationMetadata } from '../../lib/db/vivim-db';
import { useArchiveStore } from '../../stores/archive.store';
import { ListView } from '../../components/archive/ViewModes/ListView';
import { GridView } from '../../components/archive/ViewModes/GridView';
import { IOSEmptyState } from '../../components/ios/EmptyState';
import { Download } from 'lucide-react';

export default function Imported() {
  const db = useVivimDB();
  const { viewMode, selectedIds, toggleSelection } = useArchiveStore();
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);

  useEffect(() => {
    let mounted = true;
    // Imported conversations include those with 'imported' tag or isArchived flag
    db.getAllMetadata().then(data => {
      //  Filter to only imported (those with 'imported' tag or captured externally)
      const imported = data.filter(c => c.tags?.includes('imported') || c.isArchived);
      if (mounted) setConversations(imported);
    });
    return () => { mounted = false; };
  }, [db]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Import Hub Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Imported Conversations</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{conversations.length} conversations from external sources</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-md shadow-indigo-500/20">
          <Download className="w-4 h-4" />
          Import more
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="flex items-center justify-center p-8 h-full">
          <IOSEmptyState
            icon={<Download className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
            title="No imported conversations"
            description="Import conversations from ChatGPT, Claude, or other sources to see them here."
            action={{ label: 'Import now', onClick: () => {} }}
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

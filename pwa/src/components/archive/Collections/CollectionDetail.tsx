import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCollectionsStore } from '../../../stores/collections.store';
import { useVivimDB, ConversationMetadata } from '../../../lib/db/vivim-db';
import { useArchiveStore } from '../../../stores/archive.store';
import { ListView } from '../ViewModes/ListView';
import { GridView } from '../ViewModes/GridView';
import { IOSEmptyState } from '../../ios/EmptyState';
import { FolderOpen, ArrowLeft, Sparkles } from 'lucide-react';

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collections } = useCollectionsStore();
  const { viewMode, selectedIds, toggleSelection } = useArchiveStore();
  const db = useVivimDB();

  const collection = collections.find(c => c.id === id);
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);

  useEffect(() => {
    if (!collection) return;
    let mounted = true;
    db.getAllMetadata().then(all => {
      const items = all.filter(c => collection.conversationIds.includes(c.id));
      if (mounted) setConversations(items);
    });
    return () => { mounted = false; };
  }, [collection, db]);

  if (!collection) {
    return (
      <div className="flex items-center justify-center w-full h-full p-8">
        <IOSEmptyState
          icon={<FolderOpen className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
          title="Collection not found"
          description="This collection may have been deleted."
          action={{ label: 'Back to Collections', onClick: () => navigate('/archive/collections') }}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-black/5 dark:border-white/5">
        <button
          onClick={() => navigate('/archive/collections')}
          className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">{collection.name}</h2>
          {collection.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{collection.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          AI Synthesis
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full p-8">
            <IOSEmptyState
              icon={<FolderOpen className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
              title="Collection is empty"
              description="Add conversations to this collection using the conversation card actions."
              className="mt-8"
            />
          </div>
        ) : viewMode === 'grid' ? (
          <GridView conversations={conversations} selectedIds={selectedIds} onSelect={toggleSelection} onClick={id => console.log('open', id)} />
        ) : (
          <ListView conversations={conversations} selectedIds={selectedIds} onSelect={toggleSelection} onClick={id => console.log('open', id)} />
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useVivimDB, ConversationMetadata } from '../../lib/db/vivim-db';
import { useArchiveStore } from '../../stores/archive.store';
import { ListView } from '../../components/archive/ViewModes/ListView';
import { GridView } from '../../components/archive/ViewModes/GridView';
import { CanvasView } from '../../components/archive/ViewModes/CanvasView';
import { TimelineView } from '../../components/archive/ViewModes/TimelineView';
import { IOSEmptyState } from '../../components/ios/EmptyState';
import { Archive as ArchiveIcon } from 'lucide-react';

export default function AllChats() {
  const db = useVivimDB();
  const { viewMode, selectedIds, toggleSelection } = useArchiveStore();
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);

  useEffect(() => {
    let mounted = true;
    db.getMetadataSorted({ limit: 100, includeArchived: true }).then((data) => {
      if (mounted) setConversations(data);
    }).catch(err => {
      console.error('Failed to load archive conversations', err);
    });
    return () => { mounted = false; };
  }, [db]);

  const handleSelect = (id: string) => {
    toggleSelection(id);
  };

  const handleClick = (id: string) => {
    console.log('Open conversation details', id);
    // TODO: implement detail slide over
  };

  const renderViewMode = () => {
    if (conversations.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 h-full">
          <IOSEmptyState
            icon={<ArchiveIcon className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
            title="Your Archive is Empty"
            description="Captured conversations and imported data will appear here."
            className="mt-20"
          />
        </div>
      );
    }

    switch (viewMode) {
      case 'grid':
        return <GridView conversations={conversations} selectedIds={selectedIds} onSelect={handleSelect} onClick={handleClick} />;
      case 'canvas':
        return <CanvasView conversations={conversations} selectedIds={selectedIds} onSelect={handleSelect} onClick={handleClick} />;
      case 'timeline':
        return <TimelineView conversations={conversations} selectedIds={selectedIds} onSelect={handleSelect} onClick={handleClick} />;
      case 'list':
      default:
        return <ListView conversations={conversations} selectedIds={selectedIds} onSelect={handleSelect} onClick={handleClick} />;
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
      {renderViewMode()}
    </div>
  );
}

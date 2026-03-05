import { useEffect, useState } from 'react';
import { useArchiveStore } from '../../../stores/archive.store';
import { useVivimDB, ConversationMetadata } from '../../../lib/db/vivim-db';
import { IOSEmptyState } from '../../ios/EmptyState';
import { Search as SearchIcon } from 'lucide-react';
import { ListView } from '../ViewModes/ListView';
import { GridView } from '../ViewModes/GridView';

export default function ArchiveSearch() {
  const { searchQuery, viewMode, selectedIds, toggleSelection } = useArchiveStore();
  const db = useVivimDB();
  const [results, setResults] = useState<ConversationMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        if (mounted) setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // We do a simple fallback filter over Metadata since full text isn't deeply indexed yet
        const allMeta = await db.getAllMetadata();
        const lowerQ = searchQuery.toLowerCase();
        
        const matched = allMeta.filter(m => 
          m.title.toLowerCase().includes(lowerQ) || 
          m.tags?.some(t => t.toLowerCase().includes(lowerQ)) ||
          m.provider.toLowerCase().includes(lowerQ)
        );

        if (mounted) {
          setResults(matched);
        }
      } catch (err) {
        console.error('Lexical search failed:', err);
      } finally {
        if (mounted) setIsSearching(false);
      }
    };

    const debounceId = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(debounceId);
    };
  }, [searchQuery, db]);

  const handleSelect = (id: string) => toggleSelection(id);
  const handleClick = (id: string) => console.log('Open', id);

  if (!searchQuery.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 h-full">
        <IOSEmptyState
          icon={<SearchIcon className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
          title="Search your knowledge"
          description="Type above to search across all conversations and imported data."
          className="mt-20"
        />
      </div>
    );
  }

  if (results.length === 0 && !isSearching) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 h-full">
        <IOSEmptyState
          icon={<SearchIcon className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
          title="No results found"
          description={`We couldn't find any conversations matching "${searchQuery}".`}
          className="mt-20"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
      {viewMode === 'grid' ? (
        <GridView conversations={results} selectedIds={selectedIds} onSelect={handleSelect} onClick={handleClick} />
      ) : (
        <ListView conversations={results} selectedIds={selectedIds} onSelect={handleSelect} onClick={handleClick} />
      )}
    </div>
  );
}

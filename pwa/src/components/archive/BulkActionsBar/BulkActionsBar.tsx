import { useArchiveStore } from '../../../stores/archive.store';
import { Trash2, BookmarkPlus, Archive, X, CheckSquare } from 'lucide-react';

export function BulkActionsBar() {
  const { selectedIds, clearSelection } = useArchiveStore();
  const count = selectedIds.size;

  if (count === 0) return null;

  return (
    <div
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 
        bg-gray-900/95 dark:bg-gray-100/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/40 
        border border-white/10 dark:border-black/10 text-white dark:text-gray-900
        animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center gap-2 text-sm font-semibold pr-3 mr-1 border-r border-white/10 dark:border-black/10">
        <CheckSquare className="w-4 h-4 text-indigo-400 dark:text-indigo-500" />
        {count} selected
      </div>
      
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 dark:hover:bg-black/5 transition-colors">
        <BookmarkPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Add to collection</span>
      </button>

      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 dark:hover:bg-black/5 transition-colors">
        <Archive className="w-4 h-4" />
        <span className="hidden sm:inline">Archive</span>
      </button>

      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">Delete</span>
      </button>

      <button
        onClick={clearSelection}
        className="ml-2 p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-black/5 transition-colors text-gray-400 dark:text-gray-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

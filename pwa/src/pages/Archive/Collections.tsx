import { useState } from 'react';
import { useCollectionsStore } from '../../stores/collections.store';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Trash2, ChevronRight } from 'lucide-react';
import { IOSEmptyState } from '../../components/ios/EmptyState';

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#3b82f6', '#ef4444', '#64748b',
];

export default function Collections() {
  const { collections, addCollection, removeCollection } = useCollectionsStore();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const col = addCollection(newName.trim());
    setNewName('');
    setCreating(false);
    navigate(`/archive/collections/${col.id}`);
  };

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Collections</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{collections.length} collection{collections.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {/* Create Collection Inline Form */}
      {creating && (
        <div className="mb-6 p-4 bg-white/60 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">New Collection</p>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Collection name..."
            className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500/20 mb-3"
          />
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: newColor === c ? 'white' : 'transparent',
                  boxShadow: newColor === c ? `0 0 0 2px ${c}` : 'none'
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setCreating(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-3 py-1.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Collection Cards */}
      {collections.length === 0 && !creating ? (
        <IOSEmptyState
          icon={<FolderOpen className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
          title="No collections yet"
          description="Group related conversations into collections to build a knowledge base."
          action={{ label: 'Create first collection', onClick: () => setCreating(true) }}
          className="mt-8"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => navigate(`/archive/collections/${col.id}`)}
              className="group relative flex items-center gap-4 p-4 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/5 hover:shadow-lg cursor-pointer transition-all duration-200"
            >
              {/* Color swatch */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${col.color || PALETTE[0]}20` }}>
                <FolderOpen className="w-5 h-5" style={{ color: col.color || PALETTE[0] }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{col.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{col.conversationIds.length} conversation{col.conversationIds.length !== 1 ? 's' : ''}</p>
              </div>

              <button
                onClick={e => { e.stopPropagation(); removeCollection(col.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import './Collections.css';
import { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderPlus,
  Settings,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  X,
  Loader2,
  MessageSquare,
  ChevronLeft
} from 'lucide-react';
import { 
  IOSTopBar, 
  IOSCard, 
  IOSButton, 
  IOSModal, 
  IOSSkeletonList,
  ConversationCard,
  useIOSToast,
  toast
} from '../components/ios';
import { cn } from '../lib/utils';

interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  messageCount: number;
  addedAt: string;
}

export const Collections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [conversations, setConversations] = useState<any[]>([]); // Using any for now to match ConversationCard expectation
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('#6366f1');
  const { toast: showToast } = useIOSToast();

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/collections');
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversations = useCallback(async (collectionId: string) => {
    try {
      const response = await fetch(`/api/v1/collections/${collectionId}/conversations`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (selectedCollection) {
      fetchConversations(selectedCollection.id);
    }
  }, [selectedCollection, fetchConversations]);

  const handleCreateCollection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      const response = await fetch('/api/v1/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollectionName.trim(),
          color: newCollectionColor,
        }),
      });

      if (response.ok) {
        const newCollection = await response.json();
        setCollections(prev => [...prev, newCollection]);
        setShowCreateModal(false);
        setNewCollectionName('');
        showToast(toast.success('Collection created'));
      }
    } catch (error) {
      showToast(toast.error('Failed to create collection'));
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Delete this collection? Conversations will not be deleted.')) return;

    try {
      await fetch(`/api/v1/collections/${collectionId}`, { method: 'DELETE' });
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      if (selectedCollection?.id === collectionId) {
        setSelectedCollection(null);
        setConversations([]);
      }
      showToast(toast.success('Collection deleted'));
    } catch (error) {
      showToast(toast.error('Failed to delete collection'));
    }
  };

  const COLORS = [
    '#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981',
    '#f59e0b', '#ef4444', '#ec4899', '#64748b'
  ];

  const handleBack = () => {
    if (selectedCollection) {
      setSelectedCollection(null);
    } else {
      window.history.back();
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar 
        title={selectedCollection ? selectedCollection.name : "Collections"} 
        showBackButton
        onBack={handleBack}
        rightAction={
          !selectedCollection && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            >
              <FolderPlus size={22} />
            </button>
          )
        }
      />

      <div className="px-4 py-4">
        {selectedCollection ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {conversations.length} Items in this collection
              </p>
              <button 
                onClick={() => handleDeleteCollection(selectedCollection.id)}
                className="text-[10px] font-bold text-red-500 uppercase tracking-widest"
              >
                Delete
              </button>
            </div>

            <div className="space-y-3">
              {conversations.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <MessageSquare size={48} className="mx-auto mb-4" />
                  <p className="text-sm font-medium">No items found</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <ConversationCard key={conv.id} conversation={conv} />
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {loading ? (
              <IOSSkeletonList count={5} />
            ) : collections.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                <Folder size={64} className="mx-auto mb-4" />
                <h3 className="text-lg font-bold">No Collections</h3>
                <p className="text-sm mb-6">Organize your intelligence into folders</p>
                <IOSButton variant="secondary" onClick={() => setShowCreateModal(true)}>
                  Create New
                </IOSButton>
              </div>
            ) : (
              collections.map(collection => (
                <IOSCard
                  key={collection.id}
                  padding="md"
                  clickable
                  onClick={() => setSelectedCollection(collection)}
                  className="flex items-center gap-4 group"
                >
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 flex-shrink-0"
                    style={{ backgroundColor: collection.color }}
                  >
                    <Folder className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {collection.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {collection.itemCount} Items · Knowledge Folder
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </IOSCard>
              ))
            )}
          </div>
        )}
      </div>

      <IOSModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Collection"
        footer={
          <div className="flex gap-3 w-full">
            <IOSButton variant="secondary" fullWidth onClick={() => setShowCreateModal(false)}>
              Cancel
            </IOSButton>
            <IOSButton variant="primary" fullWidth onClick={() => handleCreateCollection()} disabled={!newCollectionName.trim()}>
              Create
            </IOSButton>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
              Name
            </label>
            <input
              type="text"
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              placeholder="e.g. Research, Projects, Personal"
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
              Label Color
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-full aspect-square rounded-xl transition-all border-4",
                    newCollectionColor === color ? "border-blue-500/50 scale-110 shadow-lg shadow-black/10" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewCollectionColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
      </IOSModal>
    </div>
  );
};

export default Collections;

/**
 * Collections Page
 * 
 * Manage conversation collections and organization
 */

import { useState, useEffect, useCallback } from 'react';
import { Folder, FolderPlus, Settings, MoreVertical, Plus, Trash2, Edit2, ChevronRight, X, Loader2, MessageSquare } from 'lucide-react';
import './Collections.css';

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

export function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('#7c3aed');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; collection: Collection | null }>({ x: 0, y: 0, collection: null });

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/collections');
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch conversations for selected collection
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

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
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
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
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
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, collection: Collection) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, collection });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ x: 0, y: 0, collection: null });
  };

  const COLORS = [
    '#7c3aed', '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
    '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'
  ];

  return (
    <div className="collections-page">
      <aside className="collections-sidebar">
        <div className="sidebar-header">
          <h2>Collections</h2>
          <button className="add-btn" onClick={() => setShowCreateModal(true)}>
            <FolderPlus size={18} />
          </button>
        </div>

        <div className="collections-list">
          {loading ? (
            <div className="loading">
              <Loader2 className="spinner" size={24} />
              <span>Loading...</span>
            </div>
          ) : collections.length === 0 ? (
            <div className="empty-state">
              <Folder size={40} />
              <p>No collections yet</p>
              <button className="create-btn" onClick={() => setShowCreateModal(true)}>
                Create your first collection
              </button>
            </div>
          ) : (
            collections.map(collection => (
              <div
                key={collection.id}
                className={`collection-item ${selectedCollection?.id === collection.id ? 'active' : ''}`}
                onClick={() => setSelectedCollection(collection)}
                onContextMenu={(e) => handleContextMenu(e, collection)}
              >
                <div 
                  className="collection-icon" 
                  style={{ backgroundColor: collection.color }}
                >
                  <Folder size={18} />
                </div>
                <div className="collection-info">
                  <span className="collection-name">{collection.name}</span>
                  <span className="collection-count">{collection.itemCount} items</span>
                </div>
                <ChevronRight size={16} className="chevron" />
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="collections-main">
        {selectedCollection ? (
          <>
            <header className="collection-header">
              <div className="header-info">
                <div 
                  className="header-icon"
                  style={{ backgroundColor: selectedCollection.color }}
                >
                  <Folder size={24} />
                </div>
                <div>
                  <h2>{selectedCollection.name}</h2>
                  {selectedCollection.description && (
                    <p>{selectedCollection.description}</p>
                  )}
                </div>
              </div>
              <div className="header-actions">
                <button className="action-btn">
                  <Settings size={18} />
                </button>
              </div>
            </header>

            <div className="collection-content">
              {conversations.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={40} />
                  <p>No conversations in this collection</p>
                  <span className="hint">Add conversations from the conversation view</span>
                </div>
              ) : (
                <div className="conversations-grid">
                  {conversations.map(conv => (
                    <div key={conv.id} className="conversation-card">
                      <div className="card-header">
                        <MessageSquare size={16} />
                        <span className="provider-badge">{conv.provider}</span>
                      </div>
                      <h3>{conv.title}</h3>
                      <p className="card-meta">
                        {conv.messageCount} messages • {conv.model}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="no-selection">
            <Folder size={64} />
            <h2>Select a Collection</h2>
            <p>Choose a collection from the sidebar to view its contents</p>
          </div>
        )}
      </main>

      {/* Context Menu */}
      {contextMenu.collection && (
        <>
          <div className="context-menu-overlay" onClick={handleCloseContextMenu} />
          <div 
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button className="context-item">
              <Edit2 size={14} />
              Rename
            </button>
            <button 
              className="context-item danger"
              onClick={() => {
                handleDeleteCollection(contextMenu.collection!.id);
                handleCloseContextMenu();
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateModal(false)}>
              <X size={20} />
            </button>
            
            <h2>Create Collection</h2>
            
            <form onSubmit={handleCreateCollection}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder="My Collection"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${newCollectionColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCollectionColor(color)}
                    />
                  ))}
                </div>
              </div>
              
              <button type="submit" className="create-submit-btn">
                Create Collection
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Collections;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Collection } from '../types/collection';

interface CollectionsState {
  collections: Collection[];
  addCollection: (name: string, description?: string) => Collection;
  removeCollection: (id: string) => void;
  addConversation: (collectionId: string, conversationId: string) => void;
  removeConversation: (collectionId: string, conversationId: string) => void;
  updateCollection: (id: string, updates: Partial<Pick<Collection, 'name' | 'description' | 'color'>>) => void;
}

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set) => ({
      collections: [],

      addCollection: (name, description) => {
        const newCollection: Collection = {
          id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          description,
          conversationIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ collections: [...state.collections, newCollection] }));
        return newCollection;
      },

      removeCollection: (id) =>
        set(state => ({ collections: state.collections.filter(c => c.id !== id) })),

      addConversation: (collectionId, conversationId) =>
        set(state => ({
          collections: state.collections.map(c =>
            c.id === collectionId && !c.conversationIds.includes(conversationId)
              ? { ...c, conversationIds: [...c.conversationIds, conversationId], updatedAt: new Date().toISOString() }
              : c
          )
        })),

      removeConversation: (collectionId, conversationId) =>
        set(state => ({
          collections: state.collections.map(c =>
            c.id === collectionId
              ? { ...c, conversationIds: c.conversationIds.filter(id => id !== conversationId), updatedAt: new Date().toISOString() }
              : c
          )
        })),

      updateCollection: (id, updates) =>
        set(state => ({
          collections: state.collections.map(c =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          )
        })),
    }),
    {
      name: 'vivim-collections',
    }
  )
);

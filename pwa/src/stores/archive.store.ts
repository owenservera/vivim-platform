import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'list' | 'grid' | 'canvas' | 'timeline';
export type ActiveZone = 'all' | 'imported' | 'active' | 'shared' | 'collections';
export type SortBy = 'lastActive' | 'createdAt' | 'tokenCount' | 'qualityScore';

export interface ArchiveFilters {
  providers: string[];
  models: string[];
  dateRange: { start: string | null; end: string | null };
  status: string[];
  minTokens: number;
  maxTokens: number;
  hasCode: boolean;
  hasMath: boolean;
  tags: string[];
  collections: string[];
  minQualityScore: number;
}

export interface SearchResults {
  conversations: any[]; // refine type later
  acuMatches: any[]; // refine type later
  summary?: string;
}

interface ArchiveStore {
  // View state
  activeZone: ActiveZone;
  viewMode: ViewMode;
  sortBy: SortBy;
  filters: ArchiveFilters;

  // Selection state (for bulk actions)
  selectedIds: Set<string>;
  isSelecting: boolean;

  // Search state
  searchQuery: string;
  searchMode: 'lexical' | 'semantic' | 'cross-conversation';
  searchResults: SearchResults | null;

  // Actions
  setActiveZone: (zone: ActiveZone) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortBy) => void;
  setFilters: (filters: Partial<ArchiveFilters>) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  setIsSelecting: (isSelecting: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchMode: (mode: 'lexical' | 'semantic' | 'cross-conversation') => void;
  setSearchResults: (results: SearchResults | null) => void;

  bulkArchive: (ids: string[]) => Promise<void>;
  bulkAddToCollection: (ids: string[], collectionId: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}

const initialFilters: ArchiveFilters = {
  providers: [],
  models: [],
  dateRange: { start: null, end: null },
  status: [],
  minTokens: 0,
  maxTokens: 1000000,
  hasCode: false,
  hasMath: false,
  tags: [],
  collections: [],
  minQualityScore: 0,
};

export const useArchiveStore = create<ArchiveStore>()(
  persist(
    (set, get) => ({
      activeZone: 'all',
      viewMode: 'list',
      sortBy: 'lastActive',
      filters: initialFilters,

      selectedIds: new Set(),
      isSelecting: false,

      searchQuery: '',
      searchMode: 'lexical',
      searchResults: null,

      setActiveZone: (zone) => set({ activeZone: zone }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
      
      toggleSelection: (id) => set((state) => {
        const newSelection = new Set(state.selectedIds);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
        return { selectedIds: newSelection, isSelecting: newSelection.size > 0 };
      }),
      clearSelection: () => set({ selectedIds: new Set(), isSelecting: false }),
      setIsSelecting: (isSelecting) => set({ isSelecting, selectedIds: isSelecting ? get().selectedIds : new Set() }),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchMode: (mode) => set({ searchMode: mode }),
      setSearchResults: (results) => set({ searchResults: results }),

      bulkArchive: async (ids) => {
        // Implementation later
        console.log('bulkArchive', ids);
      },
      bulkAddToCollection: async (ids, collectionId) => {
        // Implementation later
        console.log('bulkAddToCollection', ids, collectionId);
      },
      bulkDelete: async (ids) => {
        // Implementation later
        console.log('bulkDelete', ids);
      },
    }),
    {
      name: 'vivim-archive-storage',
      // Only persist view settings
      partialize: (state) => ({
        activeZone: state.activeZone,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
      }),
    }
  )
);

import { create } from 'zustand';

type FilterTab = 'all' | 'pinned' | 'archived' | 'recent';
type ViewMode = 'list' | 'grid';
type SortBy = 'date' | 'messages' | 'title';

interface HomeUIState {
  filterTab: FilterTab;
  viewMode: ViewMode;
  searchQuery: string;
  sortBy: SortBy;
  fabExpanded: boolean;
  setFilterTab: (tab: FilterTab) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortBy) => void;
  setFabExpanded: (expanded: boolean) => void;
}

export const useHomeUIStore = create<HomeUIState>((set) => ({
  filterTab: 'all',
  viewMode: 'list',
  searchQuery: '',
  sortBy: 'date',
  fabExpanded: false,
  setFilterTab: (filterTab) => set({ filterTab }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  setFabExpanded: (fabExpanded) => set({ fabExpanded }),
}));

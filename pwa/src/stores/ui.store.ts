import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  captureModalOpen: boolean;
  selectedConversationId: string | null;
  activeConversationId: string | null;
  isChatActive: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setCaptureModalOpen: (open: boolean) => void;
  setSelectedConversation: (id: string | null) => void;
  openChat: (conversationId: string) => void;
  closeChat: () => void;
  toggleChat: (conversationId: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  searchOpen: false,
  captureModalOpen: false,
  selectedConversationId: null,
  activeConversationId: null,
  isChatActive: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setCaptureModalOpen: (captureModalOpen) => set({ captureModalOpen }),
  setSelectedConversation: (selectedConversationId) => set({ selectedConversationId }),
  openChat: (conversationId) => set({
    activeConversationId: conversationId,
    isChatActive: true
  }),
  closeChat: () => set({
    activeConversationId: null,
    isChatActive: false
  }),
  toggleChat: (conversationId) => {
    const { activeConversationId, isChatActive } = get();
    if (isChatActive && activeConversationId === conversationId) {
      set({ activeConversationId: null, isChatActive: false });
    } else {
      set({ activeConversationId: conversationId, isChatActive: true });
    }
  }
}));

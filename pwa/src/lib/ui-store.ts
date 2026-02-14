// apps/pwa/src/lib/ui-store.ts

import { create } from 'zustand';

interface UIState {
  // Chat Mode State
  activeConversationId: string | null;
  isChatActive: boolean;
  
  // Actions
  openChat: (conversationId: string) => void;
  closeChat: () => void;
  toggleChat: (conversationId: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeConversationId: null,
  isChatActive: false,

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

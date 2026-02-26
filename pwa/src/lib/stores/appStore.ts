// lib/stores/appStore.ts - Comprehensive VIVIM App State
// Based on VIVIM_FRONTEND_DESIGN.md

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types matching the design document
export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'local' | 'custom';
  apiKey?: string;
  endpoint?: string;
  models: string[];
  activeModel?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  avatar?: string;
  createdAt: number;
}

interface AppState {
  // ============================================
  // IDENTITY STATE
  // ============================================
  identity: {
    did: string | null;
    publicKey: string | null;
    displayName: string | null;
    avatar: string | null;           // CID
    verified: boolean;
    createdAt: number | null;
  };
  
  // ============================================
  // NETWORK STATE
  // ============================================
  network: {
    status: 'connected' | 'connecting' | 'offline' | 'error';
    peerCount: number;
    lastSync: number | null;
    pendingOperations: number;
    bootstrapNodes: string[];
  };
  
  // ============================================
  // STORAGE STATE
  // ============================================
  storage: {
    // Local storage
    localUsed: number;               // Bytes
    localCapacity: number;
    
    // IPFS
    ipfsPinned: number;
    ipfsPins: string[];              // CIDs
    
    // Filecoin deals
    activeDeals: number;
    totalDealStorage: number;
    
    // Preferences
    defaultVisibility: 'public' | 'circle' | 'friends' | 'private';
    autoPinThreshold: number;        // Auto-pin items with > N likes
    preferredProviders: string[];
  };
  
  // ============================================
  // AI STATE
  // ============================================
  ai: {
    activeProvider: string;
    availableProviders: AIProvider[];
    memoryEnabled: boolean;
    memoryCategories: string[];
    contextWindowUsed: number;
    totalMemoryCount: number;
  };
  
  // ============================================
  // UI STATE
  // ============================================
  ui: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    commandPaletteOpen: boolean;
    activeConversation: string | null;
    activeCircle: string | null;
    notifications: Notification[];
  };
  
  // ============================================
  // SOVEREIGNTY CONTROLS
  // ============================================
  sovereignty: {
    // Data location preferences
    defaultStorageLocation: 'local' | 'ipfs' | 'filecoin';
    requireExplicitConsent: boolean;
    
    // Privacy
    encryptByDefault: boolean;
    allowAnalytics: boolean;
    allowIndexing: boolean;
    
    // Export
    lastExport: number | null;
    autoExportEnabled: boolean;
    autoExportInterval: number;      // Days
  };

  // ============================================
  // SOCIAL STATE
  // ============================================
  social: {
    circles: Circle[];
    following: string[];
    followers: string[];
  };
  
  // ============================================
  // ACTIONS
  // ============================================
  actions: {
    // Identity
    setIdentity: (identity: Partial<AppState['identity']>) => void;
    clearIdentity: () => void;
    
    // Network
    setNetworkStatus: (status: AppState['network']['status']) => void;
    updatePeerCount: (count: number) => void;
    setLastSync: (timestamp: number) => void;
    addPendingOperation: () => void;
    removePendingOperation: () => void;
    
    // Storage
    updateStorageStats: (stats: Partial<AppState['storage']>) => void;
    addPin: (cid: string) => void;
    removePin: (cid: string) => void;
    
    // AI
    setAIProvider: (provider: string) => void;
    setAvailableProviders: (providers: AIProvider[]) => void;
    toggleMemory: (enabled: boolean) => void;
    updateMemoryStats: (used: number, count: number) => void;
    
    // UI
    setTheme: (theme: AppState['ui']['theme']) => void;
    toggleSidebar: () => void;
    setActiveConversation: (id: string | null) => void;
    setActiveCircle: (id: string | null) => void;
    toggleCommandPalette: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;
    
    // Sovereignty
    setDefaultStorageLocation: (location: AppState['sovereignty']['defaultStorageLocation']) => void;
    setDefaultVisibility: (visibility: AppState['storage']['defaultVisibility']) => void;
    toggleEncryptByDefault: () => void;
    setRequireExplicitConsent: (required: boolean) => void;
    setAllowAnalytics: (allowed: boolean) => void;
    setAllowIndexing: (allowed: boolean) => void;
    
    // Social
    addCircle: (circle: Circle) => void;
    removeCircle: (id: string) => void;
    updateCircle: (id: string, updates: Partial<Circle>) => void;
    setFollowing: (dids: string[]) => void;
    addFollowing: (did: string) => void;
    removeFollowing: (did: string) => void;
    setFollowers: (dids: string[]) => void;
    
    // Export
    exportAllData: () => Promise<void>;
    importData: (file: File) => Promise<void>;
  };
}

export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      identity: {
        did: null,
        publicKey: null,
        displayName: null,
        avatar: null,
        verified: false,
        createdAt: null,
      },
      
      network: {
        status: 'offline',
        peerCount: 0,
        lastSync: null,
        pendingOperations: 0,
        bootstrapNodes: [],
      },
      
      storage: {
        localUsed: 0,
        localCapacity: 50 * 1024 * 1024 * 1024, // 50GB
        ipfsPinned: 0,
        ipfsPins: [],
        activeDeals: 0,
        totalDealStorage: 0,
        defaultVisibility: 'friends',
        autoPinThreshold: 10,
        preferredProviders: [],
      },
      
      ai: {
        activeProvider: 'openai',
        availableProviders: [],
        memoryEnabled: true,
        memoryCategories: ['preference', 'identity', 'goal'],
        contextWindowUsed: 0,
        totalMemoryCount: 0,
      },
      
      ui: {
        theme: 'system',
        sidebarCollapsed: false,
        commandPaletteOpen: false,
        activeConversation: null,
        activeCircle: null,
        notifications: [],
      },
      
      sovereignty: {
        defaultStorageLocation: 'ipfs',
        requireExplicitConsent: true,
        encryptByDefault: true,
        allowAnalytics: false,
        allowIndexing: true,
        lastExport: null,
        autoExportEnabled: false,
        autoExportInterval: 30,
      },

      social: {
        circles: [],
        following: [],
        followers: [],
      },
      
      actions: {
        // Identity
        setIdentity: (identity) => set((state) => {
          Object.assign(state.identity, identity);
        }),
        
        clearIdentity: () => set((state) => {
          state.identity = {
            did: null,
            publicKey: null,
            displayName: null,
            avatar: null,
            verified: false,
            createdAt: null,
          };
        }),
        
        // Network
        setNetworkStatus: (status) => set((state) => {
          state.network.status = status;
        }),
        
        updatePeerCount: (count) => set((state) => {
          state.network.peerCount = count;
        }),
        
        setLastSync: (timestamp) => set((state) => {
          state.network.lastSync = timestamp;
        }),
        
        addPendingOperation: () => set((state) => {
          state.network.pendingOperations += 1;
        }),
        
        removePendingOperation: () => set((state) => {
          state.network.pendingOperations = Math.max(0, state.network.pendingOperations - 1);
        }),
        
        // Storage
        updateStorageStats: (stats) => set((state) => {
          Object.assign(state.storage, stats);
        }),
        
        addPin: (cid) => set((state) => {
          if (!state.storage.ipfsPins.includes(cid)) {
            state.storage.ipfsPins.push(cid);
            state.storage.ipfsPinned += 1;
          }
        }),
        
        removePin: (cid) => set((state) => {
          state.storage.ipfsPins = state.storage.ipfsPins.filter(c => c !== cid);
          state.storage.ipfsPinned = state.storage.ipfsPins.length;
        }),
        
        // AI
        setAIProvider: (provider) => set((state) => {
          state.ai.activeProvider = provider;
        }),
        
        setAvailableProviders: (providers) => set((state) => {
          state.ai.availableProviders = providers;
        }),
        
        toggleMemory: (enabled) => set((state) => {
          state.ai.memoryEnabled = enabled;
        }),
        
        updateMemoryStats: (used, count) => set((state) => {
          state.ai.contextWindowUsed = used;
          state.ai.totalMemoryCount = count;
        }),
        
        // UI
        setTheme: (theme) => set((state) => {
          state.ui.theme = theme;
        }),
        
        toggleSidebar: () => set((state) => {
          state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
        }),
        
        setActiveConversation: (id) => set((state) => {
          state.ui.activeConversation = id;
        }),
        
        setActiveCircle: (id) => set((state) => {
          state.ui.activeCircle = id;
        }),
        
        toggleCommandPalette: () => set((state) => {
          state.ui.commandPaletteOpen = !state.ui.commandPaletteOpen;
        }),
        
        addNotification: (notification) => set((state) => {
          state.ui.notifications.unshift({
            ...notification,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            read: false,
          });
        }),
        
        markNotificationRead: (id) => set((state) => {
          const notification = state.ui.notifications.find(n => n.id === id);
          if (notification) {
            notification.read = true;
          }
        }),
        
        clearNotifications: () => set((state) => {
          state.ui.notifications = [];
        }),
        
        // Sovereignty
        setDefaultStorageLocation: (location) => set((state) => {
          state.sovereignty.defaultStorageLocation = location;
        }),
        
        setDefaultVisibility: (visibility) => set((state) => {
          state.storage.defaultVisibility = visibility;
        }),
        
        toggleEncryptByDefault: () => set((state) => {
          state.sovereignty.encryptByDefault = !state.sovereignty.encryptByDefault;
        }),
        
        setRequireExplicitConsent: (required) => set((state) => {
          state.sovereignty.requireExplicitConsent = required;
        }),
        
        setAllowAnalytics: (allowed) => set((state) => {
          state.sovereignty.allowAnalytics = allowed;
        }),
        
        setAllowIndexing: (allowed) => set((state) => {
          state.sovereignty.allowIndexing = allowed;
        }),
        
        // Social
        addCircle: (circle) => set((state) => {
          if (!state.social.circles.find(c => c.id === circle.id)) {
            state.social.circles.push(circle);
          }
        }),
        
        removeCircle: (id) => set((state) => {
          state.social.circles = state.social.circles.filter(c => c.id !== id);
        }),
        
        updateCircle: (id, updates) => set((state) => {
          const circle = state.social.circles.find(c => c.id === id);
          if (circle) {
            Object.assign(circle, updates);
          }
        }),
        
        setFollowing: (dids) => set((state) => {
          state.social.following = dids;
        }),
        
        addFollowing: (did) => set((state) => {
          if (!state.social.following.includes(did)) {
            state.social.following.push(did);
          }
        }),
        
        removeFollowing: (did) => set((state) => {
          state.social.following = state.social.following.filter(d => d !== did);
        }),
        
        setFollowers: (dids) => set((state) => {
          state.social.followers = dids;
        }),
        
        // Export - to be implemented with actual API
        exportAllData: async () => {
          // TODO: Connect to backend API
          console.log('Export all data requested');
          set((state) => {
            state.sovereignty.lastExport = Date.now();
          });
        },
        
        importData: async (file) => {
          // TODO: Connect to backend API
          console.log('Import data requested:', file.name);
        },
      },
    })),
    {
      name: 'vivim-app-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        identity: state.identity,
        storage: state.storage,
        ai: state.ai,
        ui: state.ui,
        sovereignty: state.sovereignty,
        social: state.social,
      }),
    }
  )
);

// Helper selectors
export const selectIdentity = (state: AppState) => state.identity;
export const selectNetwork = (state: AppState) => state.network;
export const selectStorage = (state: AppState) => state.storage;
export const selectAI = (state: AppState) => state.ai;
export const selectUI = (state: AppState) => state.ui;
export const selectSovereignty = (state: AppState) => state.sovereignty;
export const selectSocial = (state: AppState) => state.social;

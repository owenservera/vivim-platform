/**
 * Zustand Stores
 * 
 * Centralized state management for:
 * - Identity (DID, tier, unlock status)
 * - Settings (theme, API, preferences)
 * - Sync (device sync state)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Identity Store
// ============================================================================

interface IdentityState {
  did: string | null;
  publicKey: string | null;
  tier: 0 | 1 | 2 | 3;
  isUnlocked: boolean;
  profile: {
    displayName?: string;
    avatar?: string;
  } | null;
  
  // Actions
  setIdentity: (did: string, publicKey: string, tier?: 0 | 1 | 2 | 3) => void;
  setTier: (tier: 0 | 1 | 2 | 3) => void;
  setProfile: (profile: { displayName?: string; avatar?: string }) => void;
  unlock: () => void;
  lock: () => void;
  clear: () => void;
}

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set) => ({
      did: null,
      publicKey: null,
      tier: 0,
      isUnlocked: false,
      profile: null,

      setIdentity: (did, publicKey, tier = 0) => 
        set({ did, publicKey, tier }),
      
      setTier: (tier) => 
        set({ tier }),
      
      setProfile: (profile) => 
        set({ profile }),
      
      unlock: () => 
        set({ isUnlocked: true }),
      
      lock: () => 
        set({ isUnlocked: false }),
      
      clear: () => 
        set({ did: null, publicKey: null, tier: 0, isUnlocked: false, profile: null }),
    }),
    {
      name: 'openscroll-identity',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        did: state.did,
        publicKey: state.publicKey,
        tier: state.tier,
        profile: state.profile,
        // Don't persist isUnlocked - require re-auth on reload
      }),
    }
  )
);

// ============================================================================
// Settings Store
// ============================================================================

interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  apiBaseUrl: string;
  useRustCore: boolean;
  autoCapture: boolean;
  notifications: boolean;
  region: string;
  
  // Actions
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setApiBaseUrl: (url: string) => void;
  setUseRustCore: (use: boolean) => void;
  setAutoCapture: (auto: boolean) => void;
  setNotifications: (enabled: boolean) => void;
  setRegion: (region: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
      useRustCore: true,
      autoCapture: false,
      notifications: true,
      region: 'GLOBAL',

      setTheme: (theme) => set({ theme }),
      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
      setUseRustCore: (useRustCore) => set({ useRustCore }),
      setAutoCapture: (autoCapture) => set({ autoCapture }),
      setNotifications: (notifications) => set({ notifications }),
      setRegion: (region) => set({ region }),
    }),
    {
      name: 'openscroll-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============================================================================
// Sync Store
// ============================================================================

interface Device {
  deviceId: string;
  name: string;
  platform: string;
  lastActive: string;
  status: 'active' | 'revoked' | 'pending';
}

interface SyncState {
  status: 'idle' | 'syncing' | 'error' | 'offline';
  lastSync: string | null;
  connectedDevices: Device[];
  pendingChanges: number;
  
  // Actions
  setStatus: (status: 'idle' | 'syncing' | 'error' | 'offline') => void;
  setLastSync: (timestamp: string) => void;
  addDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;
  setPendingChanges: (count: number) => void;
  incrementPending: () => void;
  decrementPending: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      status: 'idle',
      lastSync: null,
      connectedDevices: [],
      pendingChanges: 0,

      setStatus: (status) => set({ status }),
      
      setLastSync: (lastSync) => set({ lastSync }),
      
      addDevice: (device) => 
        set((state) => ({
          connectedDevices: [...state.connectedDevices.filter(d => d.deviceId !== device.deviceId), device]
        })),
      
      removeDevice: (deviceId) => 
        set((state) => ({
          connectedDevices: state.connectedDevices.filter(d => d.deviceId !== deviceId)
        })),
      
      updateDevice: (deviceId, updates) => 
        set((state) => ({
          connectedDevices: state.connectedDevices.map(d => 
            d.deviceId === deviceId ? { ...d, ...updates } : d
          )
        })),
      
      setPendingChanges: (pendingChanges) => set({ pendingChanges }),
      
      incrementPending: () => 
        set((state) => ({ pendingChanges: state.pendingChanges + 1 })),
      
      decrementPending: () => 
        set((state) => ({ pendingChanges: Math.max(0, state.pendingChanges - 1) })),
    }),
    {
      name: 'openscroll-sync',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lastSync: state.lastSync,
        connectedDevices: state.connectedDevices,
        // Don't persist status or pendingChanges
      }),
    }
  )
);

// ============================================================================
// UI Store (non-persisted)
// ============================================================================

interface UIState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  captureModalOpen: boolean;
  selectedConversationId: string | null;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setCaptureModalOpen: (open: boolean) => void;
  setSelectedConversation: (id: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  searchOpen: false,
  captureModalOpen: false,
  selectedConversationId: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setCaptureModalOpen: (captureModalOpen) => set({ captureModalOpen }),
  setSelectedConversation: (selectedConversationId) => set({ selectedConversationId }),
}));

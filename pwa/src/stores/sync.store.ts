import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
      }),
    }
  )
);

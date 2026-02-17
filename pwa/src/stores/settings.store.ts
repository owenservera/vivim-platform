import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  apiBaseUrl: string;
  useRustCore: boolean;
  autoCapture: boolean;
  notifications: boolean;
  region: string;

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

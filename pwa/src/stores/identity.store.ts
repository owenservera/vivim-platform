import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface IdentityState {
  did: string | null;
  publicKey: string | null;
  tier: 0 | 1 | 2 | 3;
  isUnlocked: boolean;
  profile: {
    displayName?: string;
    avatar?: string;
  } | null;

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
      }),
    }
  )
);

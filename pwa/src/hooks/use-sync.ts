import { useEffect, useState } from 'react';
import { useSyncStore, syncEngine } from '../lib/sync/sync-engine';
import { useIdentityStore } from '../lib/stores';

export function useSync() {
  const syncState = useSyncStore();
  const { did } = useIdentityStore(); // Assuming DID or token is available here

  useEffect(() => {
    // Auto-connect if logged in
    // In a real app, you'd get the actual JWT/Auth token
    const token = localStorage.getItem('auth_token'); // Or however we store it
    
    if (token) {
      syncEngine.connect(token);
    }

    return () => {
      // Optional: disconnect on unmount if it's a page-specific hook, 
      // but usually sync engine is global.
    };
  }, [did]);

  return {
    ...syncState,
    pull: () => syncEngine.pullChanges(),
    engine: syncEngine
  };
}

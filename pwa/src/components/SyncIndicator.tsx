/**
 * Sync Status Indicator
 * 
 * Shows sync status in the UI with manual sync trigger
 */

import { useEffect, useState } from 'react';
import { syncService, type SyncStatus } from '../lib/sync-service';
import './SyncIndicator.css';

export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    lastSync: null,
    pendingChanges: 0,
    syncing: false,
    error: null
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = syncService.subscribe(setStatus);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function handleManualSync() {
    try {
      await syncService.triggerSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  }

  function getStatusIcon() {
    if (!isOnline) return '📡';
    if (status.syncing) return '🔄';
    if (status.error) return '⚠️';
    if (status.pendingChanges > 0) return '⏳';
    return '✅';
  }

  function getStatusText() {
    if (!isOnline) return 'Offline';
    if (status.syncing) return 'Syncing...';
    if (status.error) return 'Sync error';
    if (status.pendingChanges > 0) return `${status.pendingChanges} pending`;
    if (status.lastSync) {
      const lastSync = new Date(status.lastSync);
      const now = new Date();
      const diffMs = now.getTime() - lastSync.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just synced';
      if (diffMins < 60) return `Synced ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `Synced ${diffHours}h ago`;
    }
    return 'Not synced';
  }

  function getStatusClass() {
    if (!isOnline) return 'offline';
    if (status.syncing) return 'syncing';
    if (status.error) return 'error';
    if (status.pendingChanges > 0) return 'pending';
    return 'synced';
  }

  return (
    <div className={`sync-indicator ${getStatusClass()}`}>
      <button
        className="sync-button"
        onClick={handleManualSync}
        disabled={status.syncing || !isOnline}
        title={status.error || getStatusText()}
      >
        <span className="sync-icon">{getStatusIcon()}</span>
        <span className="sync-text">{getStatusText()}</span>
      </button>

      {status.error && (
        <div className="sync-error-tooltip">
          {status.error}
        </div>
      )}
    </div>
  );
}

export default SyncIndicator;

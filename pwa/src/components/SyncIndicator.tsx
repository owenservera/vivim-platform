import { useAppStore } from '../lib/stores/appStore';
import './SyncIndicator.css';

export function SyncIndicator() {
  const status = useAppStore(state => state.network.status);
  const pendingOperations = useAppStore(state => state.network.pendingOperations);
  const lastSync = useAppStore(state => state.network.lastSync);
  const peerCount = useAppStore(state => state.network.peerCount);
  const isOnline = navigator.onLine && status !== 'offline' && status !== 'error';

  async function handleManualSync() {
    // Chain client handles GossipSub sync automatically
  }

  function getStatusIcon() {
    if (!isOnline) return '📡';
    if (status === 'connecting') return '🔄';
    if (status === 'error') return '⚠️';
    if (pendingOperations > 0) return '⏳';
    return '✅';
  }

  function getStatusText() {
    if (!isOnline) return 'Offline';
    if (status === 'connecting') return 'Connecting...';
    if (status === 'error') return 'Sync error';
    if (pendingOperations > 0) return `${pendingOperations} pending`;
    if (lastSync) {
      const lastSyncDate = new Date(lastSync);
      const now = new Date();
      const diffMs = now.getTime() - lastSyncDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return `Connected (${peerCount} peers)`;
      if (diffMins < 60) return `Synced ${diffMins}m ago (${peerCount} peers)`;
      const diffHours = Math.floor(diffMins / 60);
      return `Synced ${diffHours}h ago`;
    }
    return `Connected (${peerCount} peers)`;
  }

  function getStatusClass() {
    if (!isOnline) return 'offline';
    if (status === 'connecting') return 'syncing';
    if (status === 'error') return 'error';
    if (pendingOperations > 0) return 'pending';
    return 'synced';
  }

  return (
    <div className={`sync-indicator ${getStatusClass()}`}>
      <button
        className="sync-button"
        onClick={handleManualSync}
        disabled={status === 'connecting' || !isOnline}
        title={getStatusText()}
      >
        <span className="sync-icon">{getStatusIcon()}</span>
        <span className="sync-text">{getStatusText()}</span>
      </button>
    </div>
  );
}

export default SyncIndicator;

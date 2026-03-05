import { Wifi, WifiOff, RefreshCw, AlertTriangle, Clock, Check } from 'lucide-react';
import { useAppStore } from '../lib/stores/appStore';
import './SyncIndicator.css';

export function SyncIndicator() {
  const status = useAppStore(state => state.network.status);
  const pendingOperations = useAppStore(state => state.network.pendingOperations);
  const lastSync = useAppStore(state => state.network.lastSync);
  const peerCount = useAppStore(state => state.network.peerCount);
  const isOnline = navigator.onLine && status !== 'offline' && status !== 'error';

  // GossipSub sync is handled automatically by the chain client.
  // The button is intentionally disabled to avoid false feedback.
  // We surface an informative tooltip instead.
  function handleManualSync() {
    // No-op: sync happens automatically via GossipSub.
    // The button is disabled anyway, but this guard ensures no accidental call.
  }

  function getStatusIcon() {
    if (!isOnline) return <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />;
    if (status === 'connecting') return <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />;
    if (status === 'error') return <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />;
    if (pendingOperations > 0) return <Clock className="w-3.5 h-3.5" aria-hidden="true" />;
    return <Check className="w-3.5 h-3.5" aria-hidden="true" />;
  }

  function getStatusText() {
    if (!isOnline) return 'Offline';
    if (status === 'connecting') return 'Connecting…';
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

  const isSyncing = status === 'connecting' || !isOnline;

  return (
    <div className={`sync-indicator ${getStatusClass()}`}>
      <button
        className="sync-button"
        onClick={handleManualSync}
        disabled={true}
        title={
          isSyncing
            ? getStatusText()
            : 'Sync is automatic via GossipSub — no manual trigger needed'
        }
        aria-label={`Network status: ${getStatusText()}`}
        aria-live="polite"
      >
        <span className="sync-icon">{getStatusIcon()}</span>
        <span className="sync-text">{getStatusText()}</span>
      </button>
    </div>
  );
}

export default SyncIndicator;

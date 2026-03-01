import React, { useMemo } from 'react';
import { HardDrive, Globe, Database, Activity } from 'lucide-react';

interface SentinelProps {
  storageLocation: 'local' | 'ipfs' | 'filecoin';
  syncStatus: 'connected' | 'offline' | 'error';
  size?: number;
  className?: string;
}

/**
 * Sentinel: Visual heartbeat of data sovereignty.
 * Pulses signal storage health and network connection status.
 */
export const Sentinel: React.FC<SentinelProps> = ({ storageLocation, syncStatus, size = 16, className = "" }) => {
  const statusColor = useMemo(() => {
    if (syncStatus === 'offline') return 'text-amber-500';
    if (syncStatus === 'error') return 'text-rose-500';
    return 'text-teal-500';
  }, [syncStatus]);

  const LocationIcon = useMemo(() => {
    switch (storageLocation) {
      case 'ipfs': return Globe;
      case 'filecoin': return Database;
      default: return HardDrive;
    }
  }, [storageLocation]);

  return (
    <div className={`flex items-center gap-3 bg-gray-900/50 backdrop-blur-sm border border-white/5 px-3 py-1.5 rounded-full ${className}`}>
      {/* Sovereignty Heartbeat */}
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <Activity size={size - 2} className={statusColor} />
          <div className={`absolute inset-0 blur-sm rounded-full animate-ping ${statusColor} opacity-30`} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
          {syncStatus === 'connected' ? 'Sovereign' : syncStatus}
        </span>
      </div>

      {/* Storage Indicator */}
      <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
        <LocationIcon size={size - 2} className="text-gray-400" />
        <span className="text-[10px] font-bold text-gray-500 uppercase">
          {storageLocation}
        </span>
      </div>
    </div>
  );
};

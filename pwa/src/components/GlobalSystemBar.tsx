import React, { useState, useEffect } from 'react';
import { getStorage } from '../lib/storage-v2';
import { Fingerprint, Server, Activity, Clock } from 'lucide-react';

export const GlobalSystemBar: React.FC = () => {
  const [did, setDid] = useState<string>('Initializing...');
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [api] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api');

  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const storage = getStorage();
        const identity = await storage.getIdentity();
        setDid(identity);
      } catch {
        setDid('Identity Offline');
      }
    };
    loadIdentity();

    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-black text-[9px] uppercase tracking-tighter text-gray-500 border-b border-gray-900 px-3 py-1.5 flex items-center justify-between font-mono z-[100] relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 overflow-hidden max-w-[200px]">
          <Fingerprint className="w-3 h-3 text-purple-500 flex-shrink-0" />
          <span className="truncate">Signer: {did}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Server className="w-3 h-3 text-blue-500" />
          <span>Nodes: {api.replace(/^https?:\/\//, '')}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-green-500 animate-pulse" />
          <span>Mode: End-to-End Secure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-gray-600" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

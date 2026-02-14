import React, { useState, useEffect } from 'react';
import { getStorage } from '../lib/storage-v2';
import { Activity, Bell } from 'lucide-react';

export const TopBar: React.FC = () => {
  const [did, setDid] = useState<string>('');

  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const storage = getStorage();
        const identity = await storage.getIdentity();
        setDid(identity);
      } catch {
        setDid('Offline');
      }
    };
    loadIdentity();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 z-50 pt-safe">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
           <span className="text-white font-bold text-lg leading-none">V</span>
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
          VIVIM
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Indicator (Mini version of GlobalSystemBar) */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full border border-gray-100">
             <Activity className="w-3 h-3 text-green-500 animate-pulse" />
             <span className="text-[10px] font-medium text-gray-500 hidden sm:inline-block">Online</span>
        </div>
        
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        {did && (
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center overflow-hidden">
                <span className="text-xs font-medium text-gray-600">
                    {did.slice(8, 10).toUpperCase()}
                </span>
             </div>
        )}
      </div>
    </header>
  );
};

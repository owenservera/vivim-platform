import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Activity, Menu } from 'lucide-react';
import { SyncIndicator } from '../SyncIndicator';
import { cn } from '@/lib/utils';

interface MobileTopBarProps {
  title?: string;
  className?: string;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ title = 'VIVIM', className }) => {
  const navigate = useNavigate();

  return (
    <header 
      className={cn(
        "flex items-center justify-between h-[var(--height-topbar)] bg-background/80 backdrop-blur-xl border-b border-border px-4 safe-area-top z-50",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-black text-sm">V</span>
        </div>
        <h1 className="font-bold text-lg tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <SyncIndicator />
        <button 
          onClick={() => navigate('/analytics')}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Activity className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Plus, Archive, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  className?: string;
}

const ITEMS = [
  { icon: Home, label: 'Home', to: '/' },
  { icon: Search, label: 'Search', to: '/search' },
  { icon: Plus, label: 'Capture', to: '/capture', isAction: true },
  { icon: Archive, label: 'Archive', to: '/archive' },
  { icon: User, label: 'Account', to: '/settings' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ className }) => {
  return (
    <nav 
      className={cn(
        "flex items-center justify-around h-[var(--height-bottom-nav)] bg-card/80 backdrop-blur-xl border-t border-border px-2 safe-area-bottom z-50",
        className
      )}
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center flex-1 min-w-0 transition-all duration-200",
            item.isAction ? "relative -top-4" : "",
            isActive && !item.isAction ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {({ isActive }) => item.isAction ? (
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30 text-white transform active:scale-90 transition-transform">
              <item.icon className="w-7 h-7" />
            </div>
          ) : (
            <>
              <item.icon className={cn("w-6 h-6 mb-1", isActive ? "fill-current/10" : "")} />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

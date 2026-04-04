import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Archive, 
  Library, 
  Sparkles, 
  Bookmark, 
  Brain, 
  Database, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface SidebarProps {
  className?: string;
}

const NAV_ITEMS = [
  { icon: Home, label: 'Home', to: '/' },
  { icon: Globe, label: 'Scroll', to: '/scroll' },
  { icon: Search, label: 'Search', to: '/search' },
  { icon: Archive, label: 'Archive', to: '/archive' },
  { icon: Library, label: 'Collections', to: '/collections' },
  { icon: Sparkles, label: 'For You', to: '/for-you' },
  { icon: Bookmark, label: 'Bookmarks', to: '/bookmarks' },
];

const SECONDARY_ITEMS = [
  { icon: Brain, label: 'Context', to: '/context-cockpit' },
  { icon: Database, label: 'Storage', to: '/storage' },
];

const FOOTER_ITEMS = [
  { icon: Settings, label: 'Settings', to: '/settings' },
  { icon: User, label: 'Account', to: '/account' },
];

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out z-50",
        isCollapsed ? "w-[var(--width-sidebar-collapsed)]" : "w-[var(--width-sidebar)]",
        className
      )}
    >
      {/* Header / Logo */}
      <div className="h-[var(--height-topbar)] flex items-center px-4 border-b border-border/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-black text-lg">V</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-xl tracking-tight whitespace-nowrap">VIVIM</span>
          )}
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <Button 
          variant="primary" 
          fullWidth={!isCollapsed}
          size={isCollapsed ? "icon" : "md"}
          className={cn(
            "rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 border-none shadow-lg shadow-primary-500/20",
            isCollapsed ? "w-10 h-10" : ""
          )}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2 font-bold">New Chat</span>}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-3 space-y-1 custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
            {isCollapsed && (
              <div className="absolute left-14 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}

        <div className="my-4 border-t border-border/50 mx-2" />

        {SECONDARY_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-3 space-y-1 border-t border-border/50">
        {FOOTER_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 mt-2"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span className="font-medium text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

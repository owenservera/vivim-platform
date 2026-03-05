/**
 * SideNav.tsx — Desktop Left Navigation Rail
 * 
 * Renders only on screens ≥1024px (lg breakpoint).
 * Mirrors the same routes as BottomNav for consistent navigation.
 * Follows the "Neo-Glassmorphic Knowledge Hub" design language.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  Settings,
  Shield,
  BookOpen,
  Sparkles,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../lib/stores/appStore';
import { SyncIndicator } from '../SyncIndicator';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const primaryNavItems: NavItem[] = [
  { to: '/', icon: <Home className="w-5 h-5" strokeWidth={2} />, label: 'Home' },
  { to: '/search', icon: <Search className="w-5 h-5" strokeWidth={2} />, label: 'Search' },
  { to: '/capture', icon: <PlusCircle className="w-5 h-5" strokeWidth={2} />, label: 'Capture' },
  { to: '/ai-conversations', icon: <MessageSquare className="w-5 h-5" strokeWidth={2} />, label: 'AI Chat' },
  { to: '/chain-chat', icon: <Shield className="w-5 h-5" strokeWidth={2} />, label: 'Chain Chat' },
  { to: '/discover', icon: <Sparkles className="w-5 h-5" strokeWidth={2} />, label: 'Discover' },
  { to: '/circles', icon: <Users className="w-5 h-5" strokeWidth={2} />, label: 'Circles' },
  { to: '/notebooks', icon: <BookOpen className="w-5 h-5" strokeWidth={2} />, label: 'Notebooks' },
];

const bottomNavItems: NavItem[] = [
  { to: '/settings', icon: <Settings className="w-5 h-5" strokeWidth={2} />, label: 'Settings' },
];

export const SideNav: React.FC = () => {
  const displayName = useAppStore(s => s.identity.displayName);
  const avatar = useAppStore(s => s.identity.avatar);
  const location = useLocation();

  const NavItem = ({ item }: { item: NavItem }) => {
    const isActive = item.to === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.to);

    return (
      <NavLink
        to={item.to}
        title={item.label}
        className={({ isActive: navIsActive }) =>
          `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 select-none
          ${(navIsActive || isActive)
            ? 'bg-white/10 text-white border border-white/15'
            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`
        }
      >
        <span className="relative flex-shrink-0">
          {item.icon}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </span>
        <span className="text-sm font-medium tracking-tight">{item.label}</span>

        {/* Active indicator bar */}
        {(location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))) && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-indigo-400" />
        )}
      </NavLink>
    );
  };

  return (
    <aside
      aria-label="Primary navigation"
      className={`
        hidden lg:flex
        flex-col fixed left-0 top-0 bottom-0 z-40
        w-[260px] 
        bg-[#000000]/95 backdrop-blur-2xl
        border-r border-white/[0.06]
        shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]
      `}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="text-base font-semibold text-white tracking-tight">VIVIM</span>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5 mb-3" />

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-0.5 py-1 scrollbar-hide">
        {primaryNavItems.map(item => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5 my-2" />

      {/* Sync indicator */}
      <div className="px-4 py-2">
        <SyncIndicator />
      </div>

      {/* Bottom: Settings + User */}
      <nav className="px-3 pb-3 space-y-0.5">
        {bottomNavItems.map(item => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* User identity chip */}
      <div className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center gap-2.5 cursor-pointer hover:bg-white/[0.07] transition-colors">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            (displayName?.[0] ?? 'V').toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/90 truncate">{displayName ?? 'Anonymous'}</p>
          <p className="text-[10px] text-white/40 truncate">VIVIM Identity</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
      </div>
    </aside>
  );
};

export default SideNav;

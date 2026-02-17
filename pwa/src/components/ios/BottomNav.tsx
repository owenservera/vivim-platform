import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageSquare, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface IOSNavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  isSpecial?: boolean;
}

export interface IOSBottomNavProps {
  items?: IOSNavItem[];
  className?: string;
}

const defaultNavItems: IOSNavItem[] = [
  { to: '/', icon: <Home className="w-5 h-5" strokeWidth={2.5} />, label: 'Home' },
  { to: '/search', icon: <Search className="w-5 h-5" strokeWidth={2.5} />, label: 'Search' },
  {
    to: '/capture',
    icon: <PlusCircle className="w-5 h-5" fill="currentColor" strokeWidth={0} />,
    label: 'Capture',
    isSpecial: true,
  },
  {
    to: '/ai-conversations',
    icon: <MessageSquare className="w-5 h-5" strokeWidth={2.5} />,
    label: 'AI',
  },
  { to: '/settings', icon: <Settings className="w-5 h-5" strokeWidth={2.5} />, label: 'Settings' },
];

export const IOSBottomNav: React.FC<IOSBottomNavProps> = ({
  items = defaultNavItems,
  className,
}) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 h-16 ios-safe-bottom bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50 flex items-center justify-around z-[1030] shadow-[0_-1px_3px_rgba(0,0,0,0.05)] px-1',
        className
      )}
    >
      {items.map((item, index) => (
        <NavLink
          key={index}
          to={item.to}
          className={({ isActive }) => {
            const baseClasses = 'flex flex-col items-center justify-center w-full h-full space-y-0.5 ios-touch-feedback min-w-0';
            const activeClasses = 'text-blue-600 dark:text-blue-400';
            const inactiveClasses = 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200';

            const specialClasses = item.isSpecial
              ? 'text-blue-600 dark:text-blue-400'
              : '';

            return cn(
              baseClasses,
              isActive ? activeClasses : inactiveClasses,
              specialClasses
            );
          }}
        >
          {item.isSpecial ? (
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full p-2 text-white shadow-lg shadow-blue-500/30 transform transition-transform active:scale-95">
              {item.icon}
            </div>
          ) : (
            item.icon
          )}
          <span className="text-[9px] font-medium truncate w-full text-center px-0.5">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

// Floating Action Button (FAB) style bottom nav
export const IOSFloatingBottomNav: React.FC<IOSBottomNavProps> = ({
  items = defaultNavItems,
  className,
}) => {
  const specialItem = items.find((item) => item.isSpecial);
  const regularItems = items.filter((item) => !item.isSpecial);

  return (
    <nav
      className={cn(
        'fixed bottom-4 left-4 right-4 h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl flex items-center justify-around z-[1030] ios-safe-bottom',
        className
      )}
    >
      {regularItems.map((item, index) => (
        <NavLink
          key={index}
          to={item.to}
          className={({ isActive }) => {
            const baseClasses = 'flex flex-col items-center justify-center w-14 h-14 space-y-1 ios-touch-feedback';
            const activeClasses = 'text-blue-600 dark:text-blue-400';
            const inactiveClasses = 'text-gray-500 dark:text-gray-400';

            return cn(baseClasses, isActive ? activeClasses : inactiveClasses);
          }}
        >
          {item.icon}
          <span className="text-[9px] font-medium">{item.label}</span>
        </NavLink>
      ))}

      {/* Special center button */}
      {specialItem && (
        <NavLink
          to={specialItem.to}
          className={({ isActive }) => {
            const baseClasses = 'flex flex-col items-center justify-center -mt-6 ios-touch-feedback';
            const activeClasses = 'text-blue-600 dark:text-blue-400';
            const inactiveClasses = 'text-gray-500 dark:text-gray-400';

            return cn(baseClasses, isActive ? activeClasses : inactiveClasses);
          }}
        >
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full p-3 text-white shadow-lg shadow-blue-500/40 transform transition-transform active:scale-95">
            {specialItem.icon}
          </div>
        </NavLink>
      )}
    </nav>
  );
};

// Minimal bottom nav for clean pages
export const IOSMinimalBottomNav: React.FC<IOSBottomNavProps> = ({
  items = defaultNavItems,
  className,
}) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 h-14 ios-safe-bottom bg-transparent flex items-center justify-around z-[1030]',
        className
      )}
    >
      {items.map((item, index) => (
        <NavLink
          key={index}
          to={item.to}
          className={({ isActive }) => {
            const baseClasses = 'flex flex-col items-center justify-center w-14 h-14 ios-touch-feedback';
            const activeClasses = 'text-blue-600 dark:text-blue-400';
            const inactiveClasses = 'text-gray-400 dark:text-gray-600';

            return cn(baseClasses, isActive ? activeClasses : inactiveClasses);
          }}
        >
          {item.icon}
        </NavLink>
      ))}
    </nav>
  );
};

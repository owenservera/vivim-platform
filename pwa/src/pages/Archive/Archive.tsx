import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useArchiveStore } from '../../stores/archive.store';
import { Search, List, Grid, LayoutDashboard, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BulkActionsBar } from '../../components/archive/BulkActionsBar/BulkActionsBar';

const ZONES = [
  { id: 'all', label: 'All', to: '/archive', exact: true },
  { id: 'imported', label: 'Imported', to: '/archive/imported' },
  { id: 'active', label: 'Active', to: '/archive/active' },
  { id: 'shared', label: 'Shared', to: '/archive/shared' },
  { id: 'collections', label: 'Collections', to: '/archive/collections' },
];

export default function Archive() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery } = useArchiveStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Search Header & Toolbar */}
      <div className="flex flex-col gap-3 px-4 py-4 md:px-6 sticky top-0 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-xl z-20 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Main Search Input */}
          <div className="relative flex-1 max-w-2xl group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (location.pathname !== '/archive/search') {
                  navigate('/archive/search');
                }
              }}
              placeholder="Search all conversations semantically..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm backdrop-blur-md"
            />
          </div>

          {/* View Modes Toggle */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors", viewMode === 'list' && "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm")}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors", viewMode === 'grid' && "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm")}
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('canvas')}
              className={cn("p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors", viewMode === 'canvas' && "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm")}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('timeline')}
              className={cn("p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors", viewMode === 'timeline' && "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm")}
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zones & Sort Nav */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {ZONES.map((zone) => {
              const isActive = zone.exact 
                ? location.pathname === zone.to 
                : location.pathname.startsWith(zone.to);

              return (
                <NavLink
                  key={zone.id}
                  to={zone.to}
                  className={cn(
                    "px-4 py-1.5 rounded-full whitespace-nowrap font-medium transition-all duration-200",
                    isActive 
                      ? "bg-black text-white dark:bg-white dark:text-black" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  {zone.label}
                </NavLink>
              );
            })}
          </div>

          <button className="text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap border border-transparent">
            ↕ Last active
          </button>
        </div>
      </div>

      {/* Main Zones Content Area */}
      <div className="flex-1 w-full relative">
        <Outlet />
      </div>

      {/* Floating Bulk-Actions Bar */}
      <BulkActionsBar />
    </div>
  );
}

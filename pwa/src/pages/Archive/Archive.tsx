import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useArchiveStore } from '../../stores/archive.store';
import { Search, List, Grid2x2, LayoutDashboard, Clock, ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BulkActionsBar } from '../../components/archive/BulkActionsBar/BulkActionsBar';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

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
    <div className="flex flex-col min-h-full">
      {/* Header Area */}
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <div className="flex-1 w-full max-w-2xl">
            <Input 
              placeholder="Search conversations..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (location.pathname !== '/archive/search') {
                  navigate('/archive/search');
                }
              }}
              className="bg-card border-none shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-card p-1 rounded-xl shadow-sm border border-border/50">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all", 
                viewMode === 'list' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
              )}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all", 
                viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
              )}
              title="Grid view"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('canvas')}
              className={cn(
                "p-2 rounded-lg transition-all", 
                viewMode === 'canvas' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
              )}
              title="Canvas view"
            >
              <Grid2x2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('timeline')}
              className={cn(
                "p-2 rounded-lg transition-all", 
                viewMode === 'timeline' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
              )}
              title="Timeline view"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {ZONES.map((zone) => {
              const isActive = zone.exact 
                ? location.pathname === zone.to 
                : location.pathname.startsWith(zone.to);

              return (
                <NavLink
                  key={zone.id}
                  to={zone.to}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                    isActive 
                      ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                      : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {zone.label}
                </NavLink>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="bg-card border-none shadow-sm whitespace-nowrap shrink-0">
            <ArrowUpDown className="w-3 h-3 mr-2" />
            Last active
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full relative">
        <Outlet />
      </div>

      {/* Floating Bulk-Actions Bar */}
      <BulkActionsBar />
    </div>
  );
}

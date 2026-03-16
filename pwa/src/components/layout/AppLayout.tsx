import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileTopBar } from './MobileTopBar';
import { SyncIndicator } from '../SyncIndicator';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle debug panel with Ctrl+Shift+D or Cmd+Shift+D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('openscroll:open-debug'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar - hidden on mobile via CSS */}
      <Sidebar className="hidden lg:flex fixed inset-y-0 left-0" />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:pl-[var(--width-sidebar)] transition-[padding] duration-300 ease-in-out">
        {/* Mobile Top Bar - hidden on desktop via CSS */}
        <MobileTopBar className="lg:hidden fixed top-0 left-0 right-0 z-40" />

        {/* Desktop Top Bar / Breadcrumb Space (Optional) */}
        <header className="hidden lg:flex items-center justify-between h-[var(--height-topbar)] px-8 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">VIVIM</span>
            <span>/</span>
            <span className="text-foreground font-medium">Feed</span>
          </div>

          <div className="flex items-center gap-4">
            <SyncIndicator />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 mt-[var(--height-topbar)] lg:mt-0 pb-[var(--height-bottom-nav)] lg:pb-0">
          <div className="max-w-[var(--width-content-max)] mx-auto px-4 py-6 md:px-8 lg:px-10">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav - hidden on desktop via CSS */}
        <BottomNav className="lg:hidden fixed bottom-0 left-0 right-0 z-40" />
      </div>
    </div>
  );
};

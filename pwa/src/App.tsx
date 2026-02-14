import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeWithProvider } from './pages/Home';
import { CaptureWithProvider } from './pages/Capture';
import { CaptureSimple } from './pages/CaptureSimple';
import { ConversationView } from './pages/ConversationView';
import { SettingsWithProvider } from './pages/Settings';
import { Share } from './pages/Share';
import { Receive } from './pages/Receive';
import { Search } from './pages/Search';
import { Analytics } from './pages/Analytics';
import { Bookmarks } from './pages/Bookmarks';
import { Login } from './pages/Login';
import { AISettings } from './components/AISettings';
import { AIChat } from './components/AIChat';
import { AIConversationsPage } from './pages/AIConversationsPage';

import { BackgroundSync } from './components/BackgroundSync';
import { DebugPanel } from './components/DebugPanel';
import { IOSDefaultTopBar } from './components/ios';
import { IOSBottomNav } from './components/ios';
import { IOSToastProvider } from './components/ios';

import queryClient, { hydrateQueryCache, persistQueryCache } from './lib/query-client';
import { useIdentityStore, useSettingsStore } from './lib/stores';
import { syncManager } from './lib/sync-manager';
import { AuthProvider, useAuth } from './lib/auth-context';

function AuthInitializer() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, location.pathname]);

  return null;
}

function AppInitializer() {
  const { did } = useIdentityStore();
  const { apiBaseUrl } = useSettingsStore();

  useEffect(() => {
    hydrateQueryCache();
    const peerId = did || `anon-${crypto.randomUUID().slice(0, 8)}`;
    
    const initSync = async () => {
      try {
        await syncManager.initialize(peerId);
        const wsUrl = apiBaseUrl.replace('http', 'ws').replace('/api/v1', '');
        syncManager.connectWebSocket(wsUrl);
        console.log('✅ Sync initialized');
      } catch (error) {
        console.error('❌ Sync initialization failed:', error);
      }
    };
    
    initSync();

    const handleUnload = () => {
      persistQueryCache();
      syncManager.disconnect();
    };
    
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      syncManager.disconnect();
    };
  }, [did, apiBaseUrl]);

  return null;
}

function Layout() {
  const location = useLocation();
  
  const isConversationView = location.pathname.startsWith('/conversation/') || 
                             location.pathname.startsWith('/ai/conversation/');
  const isFullScreenChat = location.pathname === '/chat';
  const hideNav = isConversationView || isFullScreenChat;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-sans antialiased selection:bg-blue-500 selection:text-white">
      {!hideNav && <IOSDefaultTopBar />}
      
      <BackgroundSync />
      
      <main className={`flex-1 w-full max-w-md mx-auto ${hideNav ? '' : 'pt-16 pb-20 px-4'} overflow-y-auto ios-scrollbar-hide`}>
        <Routes>
          <Route path="/" element={<HomeWithProvider />} />
          <Route path="/login" element={<Login />} />
          <Route path="/search" element={<Search />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/capture" element={<CaptureWithProvider />} />
          <Route path="/simple-capture" element={<CaptureSimple />} />
          <Route path="/conversation/:id" element={<ConversationView />} />
          <Route path="/settings" element={<SettingsWithProvider />} />
          <Route path="/settings/ai" element={<AISettings />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/ai-conversations" element={<AIConversationsPage />} />
          <Route path="/ai/conversation/:id" element={<AIConversationsPage />} />
          <Route path="/conversation/:id/share" element={<Share />} />
          <Route path="/receive/:code" element={<Receive />} />
        </Routes>
      </main>

      {!hideNav && <IOSBottomNav />}
      {!hideNav && <DebugPanel />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <IOSToastProvider>
            <BrowserRouter>
              <AuthInitializer />
              <AppInitializer />
              <Layout />
            </BrowserRouter>
          </IOSToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { BackgroundSync } from '../components/BackgroundSync';
import { DebugPanel } from '../components/DebugPanel';
import { IOSToastProvider } from '../components/ios';
import { AppLayout } from '../components/layout/AppLayout';
import queryClient from '../lib/query-client';
import { GlobalSocketListener } from '../components/GlobalSocketListener';

// Lazy load pages for better performance
const Home = lazy(() => import('../pages/Home'));
const Scroll = lazy(() => import('../pages/Scroll'));
const HomeAssistant = lazy(() => import('../pages/HomeAssistant'));
const Login = lazy(() => import('../pages/Login'));
const Search = lazy(() => import('../pages/Search'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Bookmarks = lazy(() => import('../pages/Bookmarks'));
const Capture = lazy(() => import('../pages/Capture'));
const CaptureSimple = lazy(() => import('../pages/CaptureSimple'));
const ConversationView = lazy(() => import('../pages/ConversationView'));
const Settings = lazy(() => import('../pages/Settings'));
const Account = lazy(() => import('../pages/Account'));
const Collections = lazy(() => import('../pages/Collections'));
const Share = lazy(() => import('../pages/Share'));
const Receive = lazy(() => import('../pages/Receive'));
const ErrorDashboard = lazy(() => import('../pages/ErrorDashboard'));
const AIChat = lazy(() => import('../components/AIChat'));
const AIConversationsPage = lazy(() => import('../pages/AIConversationsPage'));
const AdminPanel = lazy(() => import('../pages/AdminPanel'));
const ForYou = lazy(() => import('../pages/ForYou'));
const BYOKChat = lazy(() => import('../pages/BYOKChat'));
const ContextComponents = lazy(() => import('../pages/ContextComponents'));
const ContextRecipes = lazy(() => import('../pages/settings/ContextRecipes'));
const AIProviders = lazy(() => import('../pages/settings/AIProviders'));
const AdvancedSettings = lazy(() => import('../pages/settings/AdvancedSettings'));
const ContextCockpitPage = lazy(() => import('../pages/ContextCockpitPage'));
const BlockchainAIChat = lazy(() => import('../components/BlockchainAIChat').then(m => ({ default: m.BlockchainAIChat })));
const IdentitySetup = lazy(() => import('../features/identity/components/IdentitySetup').then(m => ({ default: m.IdentitySetup })));
const StorageDashboard = lazy(() => import('../features/storage/components/StorageDashboard').then(m => ({ default: m.StorageDashboard })));
const Import = lazy(() => import('../pages/Import').then(m => ({ default: m.ImportPage })));

// Archive components
const Archive = lazy(() => import('../pages/Archive/Archive'));
const AllChats = lazy(() => import('../pages/Archive/AllChats'));
const ArchiveImported = lazy(() => import('../pages/Archive/Imported'));
const ArchiveActive = lazy(() => import('../pages/Archive/Active'));
const ArchiveShared = lazy(() => import('../pages/Archive/Shared'));
const ArchiveCollections = lazy(() => import('../pages/Archive/Collections'));
const CollectionDetail = lazy(() => import('../components/archive/Collections/CollectionDetail'));
const ArchiveSearch = lazy(() => import('../components/archive/Search/ArchiveSearch'));

// Loading component
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Auth guard component
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = window.location;

  if (isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated && location.pathname !== '/login') {
    // Redirect to login if not authenticated
    window.location.href = '/login';
    return null;
  }

  return <>{children}</>;
};

// Layout wrapper for lazy loading
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppLayout>
      <BackgroundSync />
      <GlobalSocketListener />
      <Suspense fallback={<PageLoading />}>
        {children}
      </Suspense>
      <DebugPanel />
    </AppLayout>
  );
};

// Router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Home />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/assistant-home",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <HomeAssistant />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },

  {
    path: "/login",
    element: (
      <LayoutWrapper>
        <Login />
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/search",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Search />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/analytics",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Analytics />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/scroll",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Scroll />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/bookmarks",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Bookmarks />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/capture",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Capture />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/simple-capture",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <CaptureSimple />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/conversation/:id",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <ConversationView />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/settings",
    element: (
      <LayoutWrapper>
        <Settings />
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/context-components",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <ContextComponents />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/settings/ai",
    element: (
      <LayoutWrapper>
        <ContextRecipes />
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/settings/context",
    element: (
      <LayoutWrapper>
        <ContextRecipes />
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/settings/providers",
    element: (
      <LayoutWrapper>
        <AIProviders />
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/settings/advanced",
    element: (
      <LayoutWrapper>
        <AdvancedSettings />
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/context-cockpit",
    element: (
      <LayoutWrapper>
        <ContextCockpitPage />
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/account",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Settings />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/import",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Import />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/collections",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Collections />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/archive",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Archive />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "",
        element: <AllChats />
      },
      {
        path: "imported",
        element: <ArchiveImported />
      },
      {
        path: "active",
        element: <ArchiveActive />
      },
      {
        path: "shared",
        element: <ArchiveShared />
      },
      {
        path: "collections",
        element: <ArchiveCollections />
      },
      {
        path: "collections/:id",
        element: <CollectionDetail />
      },
      {
        path: "search",
        element: <ArchiveSearch />
      }
    ]
  },
  {
    path: "/chat",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <AIChat />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/chain-chat",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <BlockchainAIChat />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/identity",
    element: (
      <LayoutWrapper>
        <IdentitySetup />
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/storage",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <StorageDashboard />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/ai-conversations",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <AIConversationsPage />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/ai/conversation/:id",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <AIConversationsPage />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/conversation/:id/share",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Share />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/receive/:code",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <Receive />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/errors",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <ErrorDashboard />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/admin",
    element: (
      <LayoutWrapper>
        <AdminPanel />
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/for-you",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <ForYou />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/byok",
    element: (
      <AuthGuard>
        <LayoutWrapper>
          <BYOKChat />
        </LayoutWrapper>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "*",
    element: (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            Go Home
          </button>
        </div>
      </LayoutWrapper>
    ),
    errorElement: <ErrorBoundary />
  }
]);

// App router component
export const AppRouter = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <IOSToastProvider>
            <RouterProvider router={router} />
          </IOSToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

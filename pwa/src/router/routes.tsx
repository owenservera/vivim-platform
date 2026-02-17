import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../lib/auth-context';
import DeviceProvider from '../lib/device-context';
import { BackgroundSync } from '../components/BackgroundSync';
import { DebugPanel } from '../components/DebugPanel';
import { IOSDefaultTopBar } from '../components/ios';
import { IOSBottomNav } from '../components/ios';
import { IOSToastProvider } from '../components/ios';
import { ResponsiveLayout } from '../components/responsive/ResponsiveLayout';
import queryClient from '../lib/query-client';

// Lazy load pages for better performance
const Home = lazy(() => import('../pages/Home'));
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

// Loading component
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
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

// Layout wrapper
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-sans antialiased selection:bg-blue-500 selection:text-white">
      <IOSDefaultTopBar />
      
      <BackgroundSync />
      
      <ResponsiveLayout
        maxWidth="lg"
        padding="md"
        className="flex-1"
        mobileClassName="px-2"
        desktopClassName="px-4"
      >
        <main className="pt-16 pb-20 overflow-y-auto scrollbar-hide">
          <Suspense fallback={<PageLoading />}>
            {children}
          </Suspense>
        </main>
      </ResponsiveLayout>

      <IOSBottomNav />
      <DebugPanel />
    </div>
  );
};

// Router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthGuard>
        <AppLayout>
          <Home />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/login",
    element: (
      <AppLayout>
        <Login />
      </AppLayout>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/search",
    element: (
      <AuthGuard>
        <AppLayout>
          <Search />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/analytics",
    element: (
      <AuthGuard>
        <AppLayout>
          <Analytics />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/bookmarks",
    element: (
      <AuthGuard>
        <AppLayout>
          <Bookmarks />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/capture",
    element: (
      <AuthGuard>
        <AppLayout>
          <Capture />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/simple-capture",
    element: (
      <AuthGuard>
        <AppLayout>
          <CaptureSimple />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/conversation/:id",
    element: (
      <AuthGuard>
        <AppLayout>
          <ConversationView />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/settings",
    element: (
      <AuthGuard>
        <AppLayout>
          <Settings />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/account",
    element: (
      <AuthGuard>
        <AppLayout>
          <Account />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/collections",
    element: (
      <AuthGuard>
        <AppLayout>
          <Collections />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/chat",
    element: (
      <AuthGuard>
        <AppLayout>
          <AIChat />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/ai-conversations",
    element: (
      <AuthGuard>
        <AppLayout>
          <AIConversationsPage />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/ai/conversation/:id",
    element: (
      <AuthGuard>
        <AppLayout>
          <AIConversationsPage />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/conversation/:id/share",
    element: (
      <AuthGuard>
        <AppLayout>
          <Share />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/receive/:code",
    element: (
      <AuthGuard>
        <AppLayout>
          <Receive />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/errors",
    element: (
      <AuthGuard>
        <AppLayout>
          <ErrorDashboard />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/admin",
    element: (
      <AuthGuard>
        <AppLayout>
          <AdminPanel />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/for-you",
    element: (
      <AuthGuard>
        <AppLayout>
          <ForYou />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "/byok",
    element: (
      <AuthGuard>
        <AppLayout>
          <BYOKChat />
        </AppLayout>
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: "*",
    element: (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            Go Home
          </button>
        </div>
      </AppLayout>
    ),
    errorElement: <ErrorBoundary />
  }
]);

// App router component
export const AppRouter = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DeviceProvider>
          <QueryClientProvider client={queryClient}>
            <IOSToastProvider>
              <RouterProvider router={router} />
            </IOSToastProvider>
          </QueryClientProvider>
        </DeviceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};
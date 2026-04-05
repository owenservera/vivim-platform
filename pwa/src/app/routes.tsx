import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { IOSDefaultTopBar, IOSBottomNav } from '@/components/ios';
import { IOSToastProvider } from '@/components/ios';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BackgroundSync } from '@/components/BackgroundSync';
import { DebugPanel } from '@/components/DebugPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AuthCallback from '@/pages/AuthCallback';

const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.HomeWithProvider })));
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Search = lazy(() => import('@/pages/Search').then(m => ({ default: m.Search })));
const Analytics = lazy(() => import('@/pages/Analytics').then(m => ({ default: m.Analytics })));
const Bookmarks = lazy(() => import('@/pages/Bookmarks').then(m => ({ default: m.Bookmarks })));
const Capture = lazy(() => import('@/pages/Capture').then(m => ({ default: m.CaptureWithProvider })));
const CaptureSimple = lazy(() => import('@/pages/CaptureSimple').then(m => ({ default: m.CaptureSimple })));
const ConversationView = lazy(() => import('@/pages/ConversationView').then(m => ({ default: m.ConversationView })));
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.SettingsWithProvider })));
const Share = lazy(() => import('@/pages/Share').then(m => ({ default: m.Share })));
const Receive = lazy(() => import('@/pages/Receive').then(m => ({ default: m.Receive })));
const AIConversationsPage = lazy(() => import('@/pages/AIConversationsPage').then(m => ({ default: m.AIConversationsPage })));
const ErrorDashboard = lazy(() => import('@/pages/ErrorDashboard').then(m => ({ default: m.default })));
const Account = lazy(() => import('@/pages/Account').then(m => ({ default: m.AccountPage })));
const Import = lazy(() => import('@/pages/Import').then(m => ({ default: m.ImportPage })));
const InvestorPitchDemo = lazy(() => import('@/pages/InvestorPitchDemo').then(m => ({ default: m.InvestorPitchDemoPage })));

function PageSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <CardSkeleton />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/conversation/:id/share" element={<Share />} />
        <Route path="/receive/:code" element={<Receive />} />
        <Route path="/demo/investor-pitch" element={<InvestorPitchDemo />} />

        {/* Protected Routes */}
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
        <Route path="/capture" element={<ProtectedRoute><Capture /></ProtectedRoute>} />
        <Route path="/simple-capture" element={<ProtectedRoute><CaptureSimple /></ProtectedRoute>} />
        <Route path="/conversation/:id" element={<ProtectedRoute><ConversationView /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/ai" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/ai-conversations" element={<ProtectedRoute><AIConversationsPage /></ProtectedRoute>} />
        <Route path="/ai/conversation/:id" element={<ProtectedRoute><AIConversationsPage /></ProtectedRoute>} />
        <Route path="/errors" element={<ProtectedRoute><ErrorDashboard /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}

export { ErrorBoundary, IOSToastProvider, IOSDefaultTopBar, IOSBottomNav, BackgroundSync, DebugPanel };
export { CardSkeleton };

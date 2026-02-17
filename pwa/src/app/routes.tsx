import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { IOSDefaultTopBar, IOSBottomNav } from '@/components/ios';
import { IOSToastProvider } from '@/components/ios';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BackgroundSync } from '@/components/BackgroundSync';
import { DebugPanel } from '@/components/DebugPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';

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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/simple-capture" element={<CaptureSimple />} />
        <Route path="/conversation/:id" element={<ConversationView />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/ai" element={<Settings />} />
        <Route path="/chat" element={<Home />} />
        <Route path="/ai-conversations" element={<AIConversationsPage />} />
        <Route path="/ai/conversation/:id" element={<AIConversationsPage />} />
        <Route path="/conversation/:id/share" element={<Share />} />
        <Route path="/receive/:code" element={<Receive />} />
        <Route path="/errors" element={<ErrorDashboard />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </Suspense>
  );
}

export { ErrorBoundary, IOSToastProvider, IOSDefaultTopBar, IOSBottomNav, BackgroundSync, DebugPanel };
export { CardSkeleton };

import { AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageTransition } from './PageTransition';
import { VemoDrawer } from '../vemo/VemoDrawer';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { AppShellProvider } from '../../context/AppShellContext';
import { useRequireAuth } from '../../hooks/useRequireAuth';

function AppShellInner() {
  const location = useLocation();
  const authStatus = useRequireAuth();

  if (authStatus === 'checking') {
    return (
      <div className="flex h-screen w-screen items-center justify-center gap-3 bg-base text-text-muted">
        <Loader2 size={16} className="animate-spin" />
        <span className="font-mono text-xs">Checking session…</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden app-canvas-texture">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
      <VemoDrawer />
      <NotificationPanel />
    </div>
  );
}

export function AppShell() {
  return (
    <AppShellProvider>
      <AppShellInner />
    </AppShellProvider>
  );
}

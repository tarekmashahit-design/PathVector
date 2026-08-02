import { AnimatePresence } from 'framer-motion';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageTransition } from './PageTransition';
import { VemoDrawer } from '../vemo/VemoDrawer';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { AppShellProvider } from '../../context/AppShellContext';

function AppShellInner() {
  const location = useLocation();

  if (typeof window !== 'undefined' && localStorage.getItem('pv_auth') !== '1') {
    return <Navigate to="/login" replace />;
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

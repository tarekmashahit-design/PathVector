import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLiveEvents } from '../hooks/useLiveEvents';

interface AppShellContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  vemoOpen: boolean;
  setVemoOpen: (v: boolean) => void;
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
  liveEvents: ReturnType<typeof useLiveEvents>;
  currentSection: string;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [vemoOpen, setVemoOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const liveEvents = useLiveEvents();
  const location = useLocation();

  const currentSection = useMemo(() => {
    const seg = location.pathname.split('/')[2] ?? 'dashboard';
    return seg;
  }, [location.pathname]);

  const value: AppShellContextValue = {
    sidebarCollapsed,
    toggleSidebar: () => setSidebarCollapsed((v) => !v),
    vemoOpen,
    setVemoOpen,
    notifOpen,
    setNotifOpen,
    liveEvents,
    currentSection,
  };

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error('useAppShell must be used within AppShellProvider');
  return ctx;
}

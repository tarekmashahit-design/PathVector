import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Bell, ChevronDown, User, Settings, Moon, LogOut } from 'lucide-react';
import { useAppShell } from '../../context/AppShellContext';
import { clockTime } from '../../lib/format';
import { cn } from '../../lib/cn';

const titles: Record<string, { title: string; context: string }> = {
  dashboard: { title: 'Dashboard', context: 'Dashboard · Live' },
  topology: { title: 'Topology', context: 'Topology · 3 floors' },
  analytics: { title: 'AI Analytics', context: 'Analytics · Vemo' },
  devices: { title: 'Devices', context: 'Devices · 23 managed' },
  security: { title: 'Security', context: 'Security · Live' },
  automations: { title: 'Automations', context: 'Automations · 6 rules' },
};

export function Topbar() {
  const { currentSection, notifOpen, setNotifOpen, liveEvents } = useAppShell();
  const [now, setNow] = useState(new Date());
  const [userMenu, setUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const meta = titles[currentSection] ?? titles.dashboard;

  return (
    <header className="relative z-20 flex h-16 flex-shrink-0 items-center justify-between border-b border-border-subtle bg-base px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <h1 className="font-display text-[15px] font-semibold text-text-bright">{meta.title}</h1>
          <p className="font-mono text-[11px] text-text-muted">{meta.context}</p>
        </motion.div>
      </AnimatePresence>

      <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
        <div
          className={cn(
            'flex items-center gap-2 rounded-pill border border-border-subtle bg-surface px-4 py-2 text-sm text-text-muted transition-all duration-200',
            searchFocused && 'w-96 border-blue/40 shadow-glow-blue-sm',
            !searchFocused && 'w-80',
          )}
        >
          <Search size={15} strokeWidth={1.75} className="flex-shrink-0" />
          <input
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search devices, IPs, alerts…"
            className="w-full bg-transparent text-sm text-text-default outline-none placeholder:text-text-muted"
          />
          <kbd className="flex-shrink-0 font-mono text-[10px] text-text-faint">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-sm text-text-muted tabular-nums">{clockTime(now)}</span>

        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative rounded-btn p-2 text-text-muted transition-colors hover:bg-elevated hover:text-text-bright"
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.75} />
          {liveEvents.unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 font-mono text-[10px] font-medium text-void">
              {liveEvents.unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenu(!userMenu)}
            className="flex items-center gap-1.5 rounded-btn p-1 pr-1.5 transition-colors hover:bg-elevated"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue/50 bg-elevated font-mono text-xs font-medium text-blue">
              AD
            </span>
            <ChevronDown size={14} className="text-text-muted" />
          </button>
          <AnimatePresence>
            {userMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setUserMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-card border border-border-subtle bg-surface py-1.5 shadow-2xl"
                >
                  {[
                    { icon: User, label: 'Profile' },
                    { icon: Settings, label: 'Settings' },
                    { icon: Moon, label: 'Theme' },
                  ].map((m) => (
                    <button key={m.label} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-text-default hover:bg-elevated hover:text-text-bright">
                      <m.icon size={15} strokeWidth={1.75} />
                      {m.label}
                    </button>
                  ))}
                  <div className="my-1 border-t border-border-subtle" />
                  <button className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red hover:bg-red/10">
                    <LogOut size={15} strokeWidth={1.75} />
                    Log out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

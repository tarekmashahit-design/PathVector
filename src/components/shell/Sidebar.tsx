import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Waypoints,
  Sparkles,
  Server,
  ShieldCheck,
  Workflow,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Logomark } from '../icons/Logomark';
import { VemoOrb } from '../primitives/VemoOrb';
import { useAppShell } from '../../context/AppShellContext';
import { cn } from '../../lib/cn';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/topology', label: 'Topology', icon: Waypoints },
  { to: '/app/analytics', label: 'AI Analytics', icon: Sparkles },
  { to: '/app/devices', label: 'Devices', icon: Server },
  { to: '/app/security', label: 'Security', icon: ShieldCheck },
  { to: '/app/automations', label: 'Automations', icon: Workflow },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, vemoOpen, setVemoOpen } = useAppShell();
  const width = sidebarCollapsed ? 72 : 248;

  return (
    <motion.aside
      animate={{ width }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="relative z-30 flex h-full flex-shrink-0 flex-col border-r border-border-subtle bg-base"
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logomark size={26} />
        {!sidebarCollapsed && <span className="font-display text-[15px] font-semibold text-text-bright">PathVector</span>}
      </div>

      <div className="mx-4 mb-4 flex items-center gap-2 rounded-btn border border-border-subtle bg-surface/60 px-3 py-2">
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          <span className="absolute inset-0 animate-pulse-dot rounded-full bg-green" />
        </span>
        {!sidebarCollapsed && <span className="truncate font-mono text-[11px] text-text-muted">All systems nominal</span>}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm transition-colors',
                isActive ? 'bg-blue/[0.08] text-text-bright' : 'text-text-muted hover:bg-elevated hover:text-text-default',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-bar"
                    className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-blue"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <item.icon size={18} strokeWidth={1.75} className={cn('flex-shrink-0', isActive && 'text-blue')} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 px-3 pb-4">
        <button
          onClick={() => setVemoOpen(!vemoOpen)}
          className={cn(
            'flex items-center gap-2.5 rounded-pill border border-border-glow bg-blue/[0.06] px-3 py-2.5 text-sm text-text-bright transition-colors hover:bg-blue/[0.12]',
            sidebarCollapsed && 'justify-center',
          )}
        >
          <VemoOrb size={18} />
          {!sidebarCollapsed && <span className="font-medium">Ask Vemo</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center gap-2 rounded-btn px-3 py-2 text-text-muted transition-colors hover:bg-elevated hover:text-text-bright"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}

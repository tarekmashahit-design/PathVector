import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Waypoints, ShieldAlert, Server, Sparkles, UploadCloud } from 'lucide-react';
import { Logomark } from '../icons/Logomark';
import { Badge } from '../primitives/Badge';
import { useDemoStore } from '../../store/demoStore';
import { fetchFindings, fetchScores, fetchTopology, fetchSummary } from '../../lib/demoApi';
import { cn } from '../../lib/cn';

const navItems = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: 'topology', label: 'Topology', icon: Waypoints },
  { to: 'findings', label: 'Findings', icon: ShieldAlert },
  { to: 'devices', label: 'Devices', icon: Server },
  { to: 'vemo', label: 'Vemo', icon: Sparkles },
];

export function DemoShell() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const store = useDemoStore();

  useEffect(() => {
    if (!sessionId) return;
    if (store.sessionId === sessionId && store.analysisComplete) return;
    // Direct navigation to the dashboard (e.g. page refresh) — hydrate from REST.
    Promise.all([fetchTopology(sessionId), fetchFindings(sessionId), fetchScores(sessionId), fetchSummary(sessionId)])
      .then(([topology, findings, scores, summary]) => {
        store.setSession(sessionId, store.filename ?? 'uploaded file');
        store.setComplete({ topology, findings, scores, summary: summary.summary ?? '' });
      })
      .catch(() => navigate('/app/demo'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden app-canvas-texture">
      <aside className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-border-subtle bg-base">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Logomark size={24} />
          <span className="font-display text-[14px] font-semibold text-text-bright">PathVector</span>
        </div>
        <div className="mx-4 mb-4">
          <Badge tone="blue">Demo Mode</Badge>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-blue/[0.08] text-text-bright' : 'text-text-muted hover:bg-elevated hover:text-text-default',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="demo-active-bar" className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-blue" />}
                  <item.icon size={17} strokeWidth={1.75} className={cn(isActive && 'text-blue')} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={() => navigate('/app/demo')}
            className="flex w-full items-center justify-center gap-2 rounded-btn border border-border-subtle px-3 py-2 text-xs text-text-muted transition-colors hover:border-blue/40 hover:text-text-bright"
          >
            <UploadCloud size={13} /> Upload New File
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border-subtle bg-base px-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[15px] font-semibold text-text-bright">Virtualization Demo</h1>
              <Badge tone="blue">DEMO</Badge>
            </div>
            <p className="truncate font-mono text-[11px] text-text-muted">{store.filename}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

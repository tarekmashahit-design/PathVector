import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Logomark } from '../components/icons/Logomark';
import { VemoOrb } from '../components/primitives/VemoOrb';
import { NodeShape } from '../components/topology/NodeShape';
import { subscribeToAnalysis, startFixtureSession } from '../lib/demoApi';
import { useDemoStore } from '../store/demoStore';
import { computeDegrees, mapDemoType, normalizePositions } from '../lib/demoDeviceMap';
import type { DemoDevice, DemoFinding, DemoLink } from '../types/demo';

type Phase = 'discovering' | 'analyzing' | 'diagnosing' | 'complete' | 'error';

const severityColor: Record<string, string> = { critical: '#F87171', high: '#F87171', medium: '#FBBF24', low: '#FBBF24', info: '#38BDF8' };

export function DemoAnalysis() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const store = useDemoStore();

  const [phase, setPhase] = useState<Phase>('discovering');
  const [devices, setDevices] = useState<DemoDevice[]>([]);
  const [links, setLinks] = useState<DemoLink[]>([]);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>(['Parsing file…']);
  const [issueDevices, setIssueDevices] = useState<Record<string, number>>({});
  const [issueCount, setIssueCount] = useState(0);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [diagnosedCount, setDiagnosedCount] = useState(0);
  const [totalFindings, setTotalFindings] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const positions = useMemo(() => normalizePositions(devices), [devices]);
  const degrees = useMemo(() => computeDegrees(devices, links), [devices, links]);

  async function handleLoadDemo() {
    setLoadingDemo(true);
    try {
      const { session_id } = await startFixtureSession();
      store.setSession(session_id, 'demo-fixture.pkt');
      navigate(`/app/demo/${session_id}/analysis`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start demo session');
      setLoadingDemo(false);
    }
  }

  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribeToAnalysis(sessionId, {
      onParsed: (data) => {
        // If the backend fell back to demo data, show a clear warning toast
        if (data.warning) {
          toast.warning(data.warning, { duration: 8000 });
        }
        setDevices(data.topology.devices);
        setLinks(data.topology.links);
        setLogs((prev) => [...prev, `Parsed ${data.topology.devices.length} devices, ${data.topology.links.length} links`]);

        data.topology.devices.forEach((d, i) => {
          setTimeout(() => {
            setRevealedIds((prev) => (prev.includes(d.id) ? prev : [...prev, d.id]));
            setLogs((prev) => [...prev, `Found ${d.name} (${d.type}) with ${d.interfaces.length} interface(s)`]);
          }, 180 * (i + 1));
        });
        data.topology.links.forEach((l, i) => {
          setTimeout(() => {
            const src = data.topology.devices.find((d) => d.id === l.source_device)?.name ?? l.source_device;
            const tgt = data.topology.devices.find((d) => d.id === l.target_device)?.name ?? l.target_device;
            setLogs((prev) => [...prev, `Discovered link: ${src} ${l.source_interface} ↔ ${tgt} ${l.target_interface}`]);
          }, 180 * (data.topology.devices.length + i + 1));
        });
      },
      onAnalyzed: (data) => {
        setPhase('analyzing');
        setTotalFindings(data.findings.length);
        setLogs((prev) => [...prev, 'Analyzing configurations…']);
        const counts: Record<string, number> = {};
        data.findings.forEach((f: DemoFinding) => {
          f.affected_devices.forEach((name) => {
            counts[name] = (counts[name] ?? 0) + 1;
          });
        });
        setIssueDevices(counts);
        let n = 0;
        const step = setInterval(() => {
          n += 1;
          setIssueCount(n);
          if (n >= data.findings.length) clearInterval(step);
        }, 120);
      },
      onScored: (data) => {
        setHealthScore(data.scores.overall);
        setLogs((prev) => [...prev, `Health score: ${data.scores.overall}`]);
      },
      onAiDiagnosed: (data) => {
        setPhase('diagnosing');
        setDiagnosedCount((n) => n + 1);
        toast.message(`AI diagnosed: ${data.finding.title} on ${data.finding.affected_devices[0] ?? ''}`);
      },
      onComplete: (data) => {
        setPhase('complete');
        store.setComplete(data);
        setLogs((prev) => [...prev, 'Analysis complete.']);
        setTimeout(() => navigate(`/app/demo/${sessionId}`), 1400);
      },
      onError: (data) => {
        setPhase('error');
        setErrorMsg(data.message);
      },
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [logs]);

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 app-canvas-texture px-6 text-center">
        <AlertCircle size={36} className="text-red" />
        <h2 className="font-display text-xl font-semibold text-text-bright">Couldn't analyze this file</h2>
        <p className="max-w-md text-sm text-text-muted">{errorMsg}</p>
        <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row">
          <button onClick={() => navigate('/app/demo')} className="rounded-btn border border-border-subtle px-4 py-2 text-sm text-text-default hover:border-blue/40 hover:text-text-bright">
            Try a different file
          </button>
          <button onClick={handleLoadDemo} disabled={loadingDemo} className="rounded-btn border border-blue/40 bg-blue/[0.06] px-4 py-2 text-sm text-blue hover:bg-blue/10 disabled:opacity-50 flex items-center gap-2">
            {loadingDemo ? <Loader2 size={13} className="animate-spin" /> : null}
            Use demo data instead
          </button>
        </div>
      </div>
    );
  }

  const heading =
    phase === 'discovering' ? 'Discovering your network…' : phase === 'analyzing' ? 'Analyzing configurations…' : phase === 'diagnosing' ? 'PathVector AI is analyzing findings…' : 'Analysis complete.';

  return (
    <div className="relative flex min-h-screen flex-col app-canvas-texture overflow-hidden">
      <header className="flex items-center gap-2 px-8 py-6">
        <Logomark size={26} />
        <span className="font-display text-sm font-semibold text-text-bright">PathVector</span>
      </header>

      <div className="flex flex-1 flex-col items-center px-6">
        <div className="flex w-full max-w-5xl items-center justify-between px-2">
          <div className="flex items-center gap-2">
            {phase === 'complete' ? <CheckCircle2 size={18} className="text-green" /> : <VemoOrb size={18} />}
            <h1 className="font-display text-lg font-semibold text-text-bright">{heading}</h1>
          </div>
          <div className="flex items-center gap-5 font-mono text-sm">
            <span className="text-text-muted">
              Devices: <span className="text-blue">{revealedIds.length}</span>
            </span>
            <span className="text-text-muted">
              Links: <span className="text-blue">{links.length}</span>
            </span>
            {phase !== 'discovering' && (
              <span className="text-text-muted">
                Issues: <span className="text-amber">{issueCount}</span>
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-6 h-[440px] w-full max-w-5xl overflow-hidden rounded-hero border border-border-subtle bg-void/50">
          {(phase === 'discovering') && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 rounded-full border border-blue/40"
                  initial={{ width: 8, height: 8, opacity: 0.8, x: '-50%', y: '-50%' }}
                  animate={{ width: 500, height: 500, opacity: 0 }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
                  style={{ x: '-50%', y: '-50%' }}
                />
              ))}
            </div>
          )}

          {phase === 'analyzing' && (
            <motion.div
              className="absolute top-0 h-full w-1 bg-gradient-to-b from-transparent via-blue to-transparent"
              initial={{ left: '0%' }}
              animate={{ left: '100%' }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            />
          )}

          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
            {links.map((l, i) => {
              const a = positions[l.source_device];
              const b = positions[l.target_device];
              if (!a || !b || !revealedIds.includes(l.source_device) || !revealedIds.includes(l.target_device)) return null;
              const hasIssue = phase !== 'discovering';
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hasIssue ? 'rgba(56,189,248,0.25)' : 'rgba(148,163,184,0.2)'} strokeWidth={0.4} />;
            })}
            {devices.map((d) => {
              const pos = positions[d.id];
              if (!pos || !revealedIds.includes(d.id)) return null;
              const issues = issueDevices[d.name] ?? 0;
              return (
                <motion.g key={d.id} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                  <g transform={`translate(${pos.x}, ${pos.y}) scale(0.22)`}>
                    <NodeShape type={mapDemoType(d.type, degrees[d.id] ?? 0)} status={issues > 0 ? 'warning' : 'healthy'} pulse={issues > 0 && phase !== 'discovering'} />
                  </g>
                  {issues > 0 && phase !== 'discovering' && (
                    <circle cx={pos.x + 4} cy={pos.y - 4} r={1.6} fill={severityColor.high}>
                      <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text x={pos.x} y={pos.y + 8} textAnchor="middle" fontSize={2.6} fill="#64748B" className="select-none" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {d.name}
                  </text>
                </motion.g>
              );
            })}
          </svg>

          {healthScore !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-5 top-5 flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 bg-void/80"
              style={{ borderColor: healthScore > 80 ? '#34D399' : healthScore > 60 ? '#FBBF24' : '#F87171' }}
            >
              <span className="font-mono text-lg font-semibold text-text-bright">{healthScore}</span>
              <span className="text-[8px] text-text-faint">health</span>
            </motion.div>
          )}
        </div>

        <div ref={logRef} className="mt-4 h-24 w-full max-w-5xl overflow-y-auto rounded-inset border border-border-subtle bg-void/70 p-3 font-mono text-[11px] leading-relaxed text-text-muted">
          {logs.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>

        {phase === 'diagnosing' && totalFindings > 0 && (
          <p className="mt-3 font-mono text-xs text-text-muted">
            AI diagnosis {diagnosedCount}/{totalFindings}
          </p>
        )}
      </div>
    </div>
  );
}

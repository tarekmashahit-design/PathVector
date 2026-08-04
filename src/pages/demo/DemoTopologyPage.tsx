import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDemoStore } from '../../store/demoStore';
import { NodeShape } from '../../components/topology/NodeShape';
import { SlideOver } from '../../components/primitives/SlideOver';
import { Badge, StatusBadge } from '../../components/primitives/Badge';
import { computeDegrees, mapDemoType, normalizePositions } from '../../lib/demoDeviceMap';

export function DemoTopologyPage() {
  const { topology, findings } = useDemoStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const devices = topology?.devices ?? [];
  const links = topology?.links ?? [];
  const positions = useMemo(() => normalizePositions(devices), [devices]);
  const degrees = useMemo(() => computeDegrees(devices, links), [devices, links]);

  const issuesByDevice = useMemo(() => {
    const map: Record<string, number> = {};
    findings.forEach((f) => f.affected_devices.forEach((name) => (map[name] = (map[name] ?? 0) + 1)));
    return map;
  }, [findings]);

  const hovered = devices.find((d) => d.id === hoveredId);
  const selected = devices.find((d) => d.id === selectedId);
  const selectedFindings = selected ? findings.filter((f) => f.affected_devices.includes(selected.name)) : [];

  return (
    <div className="relative h-[calc(100vh-64px)] w-full app-canvas-texture">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {links.map((l, i) => {
          const a = positions[l.source_device];
          const b = positions[l.target_device];
          if (!a || !b) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(56,189,248,0.22)" strokeWidth={0.35} />;
        })}
        {devices.map((d) => {
          const pos = positions[d.id];
          if (!pos) return null;
          const issues = issuesByDevice[d.name] ?? 0;
          return (
            <g
              key={d.id}
              transform={`translate(${pos.x}, ${pos.y}) scale(0.22)`}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredId(d.id);
                setHoverPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => setHoverPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setSelectedId(d.id)}
            >
              <NodeShape type={mapDemoType(d.type, degrees[d.id] ?? 0)} status={issues > 0 ? 'warning' : 'healthy'} pulse={issues > 0} />
            </g>
          );
        })}
        {devices.map((d) => {
          const pos = positions[d.id];
          if (!pos) return null;
          return (
            <text key={`${d.id}-label`} x={pos.x} y={pos.y + 8} textAnchor="middle" fontSize={2.4} fill="#64748B" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {d.name}
            </text>
          );
        })}
      </svg>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed z-20 w-56 rounded-card border border-border-subtle bg-surface/95 p-3 text-xs shadow-2xl backdrop-blur-xl"
            style={{ left: hoverPos.x + 16, top: hoverPos.y + 16 }}
          >
            <p className="font-mono text-sm font-semibold text-text-bright">{hovered.name}</p>
            <p className="font-mono text-[11px] text-text-muted">{hovered.model}</p>
            <p className="mt-1 font-mono text-[11px] text-text-faint">{hovered.interfaces.length} interface(s)</p>
            {(issuesByDevice[hovered.name] ?? 0) > 0 && <Badge tone="amber">{issuesByDevice[hovered.name]} finding(s)</Badge>}
          </motion.div>
        )}
      </AnimatePresence>

      <SlideOver open={!!selected} onClose={() => setSelectedId(null)} title={selected && <span className="font-mono text-sm font-semibold text-text-bright">{selected.name}</span>}>
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-text-faint">Type</p>
                <p className="text-text-default">{selected.type}</p>
              </div>
              <div>
                <p className="text-text-faint">Model</p>
                <p className="text-text-default">{selected.model || '—'}</p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Interfaces</h3>
              <ul className="space-y-1.5">
                {selected.interfaces.map((iface) => (
                  <li key={iface.name} className="rounded-inset border border-border-subtle bg-surface p-2.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-blue">{iface.name}</span>
                      <StatusBadge status={iface.status} />
                    </div>
                    {iface.config_lines.map((l, i) => (
                      <p key={i} className="mt-1 text-text-muted">
                        {l}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
            {selectedFindings.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Findings on this device</h3>
                <ul className="space-y-1.5">
                  {selectedFindings.map((f) => (
                    <li key={f.rule_id} className="rounded-inset border border-border-subtle bg-surface p-2.5 text-xs">
                      <Badge tone={f.severity === 'critical' || f.severity === 'high' ? 'red' : f.severity === 'info' ? 'blue' : 'amber'}>{f.rule_id}</Badge>
                      <p className="mt-1 text-text-default">{f.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}

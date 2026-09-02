import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDemoStore } from '../../store/demoStore';
import { PacketTracerIcon } from '../../components/topology/PacketTracerIcon';
import { SlideOver } from '../../components/primitives/SlideOver';
import { Badge, StatusBadge } from '../../components/primitives/Badge';
import { computeDegrees, mapDemoType, layeredPositions } from '../../lib/demoDeviceMap';

export function DemoTopologyPage() {
  const { topology, findings } = useDemoStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingId = useRef<string | null>(null);
  // True once a drag has moved past a tiny threshold — lets the click
  // handler (which fires after pointerup) tell "clicked" from "dragged
  // and released here" and skip opening the detail panel for the latter.
  const didDragRef = useRef(false);
  // User-dragged overrides, keyed by device id — starts empty, so every
  // device begins at its computed layered position until moved by hand.
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});

  const devices = topology?.devices ?? [];
  const links = topology?.links ?? [];
  const layout = useMemo(() => layeredPositions(devices, links), [devices, links]);
  const positions = { ...layout.positions, ...customPositions };
  const degrees = useMemo(() => computeDegrees(devices, links), [devices, links]);

  const issuesByDevice = useMemo(() => {
    const map: Record<string, number> = {};
    findings.forEach((f) => f.affected_devices.forEach((name) => (map[name] = (map[name] ?? 0) + 1)));
    return map;
  }, [findings]);

  const hovered = devices.find((d) => d.id === hoveredId);
  const selected = devices.find((d) => d.id === selectedId);
  const selectedFindings = selected ? findings.filter((f) => f.affected_devices.includes(selected.name)) : [];

  // Converts a mouse event's screen coordinates into the SVG's own
  // viewBox coordinate space, so dragging tracks the cursor exactly
  // regardless of how the viewBox is scaled to fit the canvas.
  function toSvgPoint(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function handlePointerDown(id: string) {
    draggingId.current = id;
    didDragRef.current = false;
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (hoveredId) setHoverPos({ x: e.clientX, y: e.clientY });
    if (!draggingId.current) return;
    didDragRef.current = true;
    const p = toSvgPoint(e);
    if (!p) return;
    setCustomPositions((prev) => ({ ...prev, [draggingId.current as string]: p }));
  }

  function handlePointerUp() {
    draggingId.current = null;
  }

  return (
    <div className="relative h-[calc(100vh-64px)] w-full app-canvas-texture">
      <div className="absolute left-6 top-6 z-10 rounded-pill border border-border-subtle bg-surface/80 px-3 py-1.5 font-mono text-[10.5px] text-text-muted backdrop-blur-md">
        Drag any device to rearrange the layout
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="h-full w-full touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {links.map((l, i) => {
          const a = positions[l.source_device];
          const b = positions[l.target_device];
          if (!a || !b) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(56,189,248,0.3)" strokeWidth={0.4} />;
        })}
        {devices.map((d) => {
          const pos = positions[d.id];
          if (!pos) return null;
          const issues = issuesByDevice[d.name] ?? 0;
          return (
            <g
              key={d.id}
              transform={`translate(${pos.x}, ${pos.y}) scale(0.22)`}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                // Pointer capture keeps every subsequent move/up event
                // routed to the SVG root regardless of what's under the
                // cursor mid-drag (other nodes, link lines, gaps between).
                (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
                handlePointerDown(d.id);
              }}
              onMouseEnter={(e) => {
                setHoveredId(d.id);
                setHoverPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
                setSelectedId(d.id);
              }}
            >
              <PacketTracerIcon type={mapDemoType(d.type, degrees[d.id] ?? 0)} status={issues > 0 ? 'warning' : 'healthy'} pulse={issues > 0} />
            </g>
          );
        })}
        {devices.map((d) => {
          const pos = positions[d.id];
          if (!pos) return null;
          return (
            <text
              key={`${d.id}-label`}
              x={pos.x}
              y={pos.y + 9}
              textAnchor="middle"
              fontSize={2.4}
              fill="#64748B"
              className="pointer-events-none select-none"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
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

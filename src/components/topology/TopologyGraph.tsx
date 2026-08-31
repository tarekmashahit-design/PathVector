import { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Maximize } from 'lucide-react';
import { topoNodes as seededTopoNodes, topoEdges as seededTopoEdges, type TopoNode, type TopoEdge } from '../../data/topology';
import { NodeShape, nodeRadius } from './NodeShape';
import { cn } from '../../lib/cn';

const edgeColor = { healthy: 'rgba(56,189,248,0.28)', degraded: 'rgba(251,191,36,0.4)', down: 'rgba(248,113,113,0.5)' };

interface Props {
  floor: 'all' | 1 | 2 | 3;
  onSelect: (id: string) => void;
  nodes?: TopoNode[];
  edges?: TopoEdge[];
}

export function TopologyGraph({ floor, onSelect, nodes: nodesProp, edges: edgesProp }: Props) {
  const topoNodes = nodesProp ?? seededTopoNodes;
  const topoEdges = edgesProp ?? seededTopoEdges;
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [hovered, setHovered] = useState<TopoNode | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 50);
    return () => clearInterval(t);
  }, []);

  const visibleNodes = useMemo(
    () => topoNodes.filter((n) => floor === 'all' || n.floor === 0 || n.floor === floor),
    [floor, topoNodes],
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => topoEdges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)),
    [visibleIds, topoEdges],
  );
  const nodeById = useMemo(() => new Map(topoNodes.map((n) => [n.id, n])), [topoNodes]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setTransform((t) => ({ ...t, k: Math.min(2.4, Math.max(0.5, t.k + delta)) }));
  }

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setTransform((t) => ({
      ...t,
      x: dragStart.current.tx + (e.clientX - dragStart.current.x),
      y: dragStart.current.ty + (e.clientY - dragStart.current.y),
    }));
  }
  function onMouseUp() {
    setDragging(false);
  }

  const highlightedNodeIds = useMemo(() => {
    if (!hovered) return null;
    const ids = new Set([hovered.id]);
    visibleEdges.forEach((e) => {
      if (e.source === hovered.id) ids.add(e.target);
      if (e.target === hovered.id) ids.add(e.source);
    });
    return ids;
  }, [hovered, visibleEdges]);

  const drift = (seed: number, axis: 'x' | 'y') => {
    const phase = seed * 1.7 + (axis === 'y' ? 1.4 : 0);
    return Math.sin(tick * 0.02 + phase) * 3;
  };

  return (
    <div className="relative h-full w-full overflow-hidden app-canvas-texture">
      <svg
        ref={svgRef}
        className={cn('h-full w-full', dragging ? 'cursor-grabbing' : 'cursor-grab')}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {visibleEdges.map((e) => {
            const a = nodeById.get(e.source)!;
            const b = nodeById.get(e.target)!;
            const ax = a.x + drift(a.x, 'x');
            const ay = a.y + drift(a.y, 'y');
            const bx = b.x + drift(b.x, 'x');
            const by = b.y + drift(b.y, 'y');
            const dimmed = highlightedNodeIds && !(highlightedNodeIds.has(a.id) && highlightedNodeIds.has(b.id));
            return (
              <g key={e.id} opacity={dimmed ? 0.25 : 1}>
                <line
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke={
                    highlightedNodeIds && highlightedNodeIds.has(a.id) && highlightedNodeIds.has(b.id) && hovered
                      ? '#38BDF8'
                      : edgeColor[e.status]
                  }
                  strokeWidth={Math.max(1, e.bandwidth / 2.5)}
                  strokeDasharray={e.status === 'degraded' ? '5 4' : undefined}
                />
                {e.status === 'healthy' &&
                  [0, 0.5].map((offset) => (
                    <circle key={offset} r={1.8} fill="#38BDF8">
                      <animateMotion
                        dur={`${3 + (e.bandwidth % 3)}s`}
                        repeatCount="indefinite"
                        begin={`${offset * 2}s`}
                        path={`M${ax},${ay} L${bx},${by}`}
                      />
                    </circle>
                  ))}
                {e.status === 'down' && (
                  <circle cx={(ax + bx) / 2} cy={(ay + by) / 2} r={4} fill="#F87171" opacity={0.8}>
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {visibleNodes.map((n) => {
            const dimmed = highlightedNodeIds && !highlightedNodeIds.has(n.id);
            const nx = n.x + drift(n.x, 'x');
            const ny = n.y + drift(n.y, 'y');
            return (
              <g
                key={n.id}
                transform={`translate(${nx}, ${ny})`}
                opacity={dimmed ? 0.35 : 1}
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setHovered(n);
                  setHoverPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => setHoverPos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(n.id)}
              >
                <motion.g whileHover={{ scale: 1.15 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <NodeShape type={n.type} status={n.status} />
                </motion.g>
                {n.type === 'endpoint' && n.endpointCount && (
                  <text y={4} textAnchor="middle" className="pointer-events-none select-none font-mono" fontSize={9} fill="#CBD5E1">
                    {n.endpointCount}
                  </text>
                )}
                <text y={nodeRadius(n.type) + 16} textAnchor="middle" className="pointer-events-none select-none font-mono" fontSize={9.5} fill="#64748B">
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none fixed z-20 w-56 rounded-card border border-border-subtle bg-surface/95 p-3 text-xs shadow-2xl backdrop-blur-xl"
            style={{ left: hoverPos.x + 16, top: hoverPos.y + 16 }}
          >
            <p className="font-mono text-sm font-semibold text-text-bright">{hovered.label}</p>
            <p className="font-mono text-[11px] text-text-muted">{hovered.ip}</p>
            <div className="mt-2 space-y-1 font-mono text-[11px] text-text-default">
              <div className="flex justify-between">
                <span className="text-text-faint">Model</span>
                <span>{hovered.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint">CPU</span>
                <span>{hovered.cpu}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint">Mem</span>
                <span>{hovered.mem}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint">Uptime</span>
                <span>{hovered.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint">Alerts</span>
                <span className={hovered.alerts > 0 ? 'text-amber' : ''}>{hovered.alerts}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-5 left-5 rounded-card border border-border-subtle bg-surface/70 p-3 text-[10.5px] backdrop-blur-md">
        <p className="mb-1.5 font-medium text-text-muted">Legend</p>
        <div className="flex items-center gap-3 text-text-faint">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-blue" /> Healthy</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-amber" /> Warning</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-red" /> Critical</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-text-muted" /> Offline</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-5 right-5 flex flex-col gap-1 rounded-card border border-border-subtle bg-surface/70 p-1 backdrop-blur-md">
        <button onClick={() => setTransform((t) => ({ ...t, k: Math.min(2.4, t.k + 0.15) }))} className="rounded-btn p-1.5 text-text-muted hover:bg-elevated hover:text-text-bright">
          <Plus size={14} />
        </button>
        <button onClick={() => setTransform((t) => ({ ...t, k: Math.max(0.5, t.k - 0.15) }))} className="rounded-btn p-1.5 text-text-muted hover:bg-elevated hover:text-text-bright">
          <Minus size={14} />
        </button>
        <button onClick={() => setTransform({ x: 0, y: 0, k: 1 })} className="rounded-btn p-1.5 text-text-muted hover:bg-elevated hover:text-text-bright">
          <Maximize size={13} />
        </button>
      </div>
    </div>
  );
}

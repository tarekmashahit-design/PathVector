import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { portSecurityMap, type PortSecStatus } from '../../data/security';
import { cn } from '../../lib/cn';

const statusColor: Record<PortSecStatus, string> = {
  '802.1x': '#34D399',
  'mac-filter': '#FBBF24',
  open: '#F87171',
};

export function PortSecurityMap() {
  const [hovered, setHovered] = useState<{ device: string; port: string; status: PortSecStatus } | null>(null);

  const grouped = portSecurityMap.reduce<Record<string, typeof portSecurityMap>>((acc, cell) => {
    (acc[cell.device] ??= []).push(cell);
    return acc;
  }, {});

  return (
    <div className="relative">
      <h3 className="mb-3 font-display text-sm font-semibold text-text-bright">Port Security Map</h3>
      <div className="space-y-2 rounded-card border border-border-subtle bg-surface p-4">
        {Object.entries(grouped).map(([device, cells]) => (
          <div key={device} className="flex items-center gap-3">
            <span className="w-24 flex-shrink-0 truncate font-mono text-[11px] text-text-muted">{device}</span>
            <div className="flex flex-wrap gap-1">
              {cells.map((c) => (
                <motion.div
                  key={c.port}
                  whileHover={{ scale: 1.25 }}
                  onMouseEnter={() => setHovered(c)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn('h-3.5 w-3.5 cursor-pointer rounded-[3px]', c.status === 'open' && 'animate-pulse-dot')}
                  style={{ background: `${statusColor[c.status]}33`, border: `1px solid ${statusColor[c.status]}` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 font-mono text-[10.5px] text-text-muted">
        {(['802.1x', 'mac-filter', 'open'] as PortSecStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: `${statusColor[s]}33`, border: `1px solid ${statusColor[s]}` }} />
            {s}
          </span>
        ))}
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full rounded-btn border border-border-subtle bg-surface px-2.5 py-1.5 font-mono text-[11px] text-text-bright shadow-xl"
          >
            {hovered.device} · {hovered.port} · {hovered.status}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

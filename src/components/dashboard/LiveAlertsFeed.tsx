import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import type { Alert } from '../../data/alerts';
import { Badge } from '../primitives/Badge';
import { relativeTime } from '../../lib/format';
import { cn } from '../../lib/cn';

const severityBar: Record<Alert['severity'], string> = {
  critical: 'bg-red',
  warning: 'bg-amber',
  info: 'bg-blue',
};

function renderMessage(message: string) {
  const parts = message.split(/(`[^`]+`)/g);
  return parts.map((p, i) =>
    p.startsWith('`') ? (
      <code key={i} className="font-mono text-blue">
        {p.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function LiveAlertsFeed({ alerts }: { alerts: Alert[] }) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-text-bright">Live Alerts</h3>
        <Badge tone="amber">{alerts.filter((a) => !resolved.has(a.id)).length} active</Badge>
      </div>
      <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {alerts
            .filter((a) => !resolved.has(a.id))
            .slice(0, 12)
            .map((a) => (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0, backgroundColor: ['rgba(56,189,248,0.1)', 'rgba(0,0,0,0)'] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, backgroundColor: { duration: 1.6 } }}
                className={cn(
                  'group flex items-center gap-3 rounded-inset border border-transparent px-2.5 py-2.5 transition-colors hover:border-border-subtle',
                  a.severity === 'critical' && 'shadow-[inset_2px_0_0_0_rgba(248,113,113,0.6)]',
                )}
              >
                <span className={cn('h-6 w-[3px] flex-shrink-0 rounded-full', severityBar[a.severity])} />
                <p className="min-w-0 flex-1 truncate text-[13px] leading-relaxed text-text-default">{renderMessage(a.message)}</p>
                <div className="flex flex-shrink-0 items-center gap-2.5">
                  <button
                    onClick={() => {
                      setResolved((prev) => new Set(prev).add(a.id));
                      toast.success(`${a.id} resolved`);
                    }}
                    className="hidden rounded-btn border border-border-subtle px-2 py-1 text-[11px] text-text-muted transition-colors hover:border-blue/40 hover:text-text-bright group-hover:block"
                  >
                    Resolve
                  </button>
                  <span className="font-mono text-[11px] text-text-muted">{a.confidence}%</span>
                  <span className="w-16 flex-shrink-0 text-right font-mono text-[10px] text-text-faint">{relativeTime(a.timestamp)}</span>
                </div>
              </motion.li>
            ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

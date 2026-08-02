import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { anomalyTimeline } from '../../data/analytics';
import { Badge } from '../primitives/Badge';
import { relativeTime } from '../../lib/format';
import { cn } from '../../lib/cn';

const severityDot = { critical: 'bg-red', warning: 'bg-amber', info: 'bg-blue' } as const;
const severityTone = { critical: 'red', warning: 'amber', info: 'blue' } as const;

export function AnomalyTimeline() {
  const [openId, setOpenId] = useState<string | null>(anomalyTimeline[0]?.id ?? null);

  return (
    <div>
      <h3 className="mb-4 font-display text-sm font-semibold text-text-bright">Anomaly Timeline</h3>
      <div className="relative pl-6">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-blue/50 via-border-glow to-transparent" />
        <ul className="space-y-4">
          {anomalyTimeline.map((ev) => {
            const open = openId === ev.id;
            return (
              <li key={ev.id} className="relative">
                <span className={cn('absolute -left-6 top-1.5 h-3 w-3 rounded-full ring-4 ring-base', severityDot[ev.severity])} />
                <div className="rounded-card border border-border-subtle bg-surface p-4 transition-colors hover:border-border">
                  <button onClick={() => setOpenId(open ? null : ev.id)} className="flex w-full items-start justify-between gap-3 text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-text-faint">{relativeTime(ev.timestamp)}</span>
                        <span className="font-mono text-xs text-blue">{ev.device}</span>
                        <Badge tone={severityTone[ev.severity]}>{ev.severity}</Badge>
                      </div>
                      <p className="mt-1.5 text-sm text-text-default">{ev.what}</p>
                    </div>
                    <ChevronDown size={15} className={cn('mt-1 flex-shrink-0 text-text-muted transition-transform', open && 'rotate-180')} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 border-t border-border-subtle pt-3">
                          <p className="mb-1.5 text-xs font-medium text-text-muted">Evidence</p>
                          <ul className="space-y-1 rounded-inset bg-void/60 p-3 font-mono text-[11.5px] leading-relaxed text-text-default">
                            {ev.evidence.map((e, i) => (
                              <li key={i}>• {e}</li>
                            ))}
                          </ul>
                          <p className="mt-3 mb-1 text-xs font-medium text-text-muted">Recommendation</p>
                          <p className="text-[13px] text-text-default">{ev.recommendation}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

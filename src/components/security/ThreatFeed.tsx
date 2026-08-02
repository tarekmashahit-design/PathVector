import { AnimatePresence, motion } from 'framer-motion';
import { threatFeed, securityOverview } from '../../data/security';
import { relativeTime } from '../../lib/format';
import { cn } from '../../lib/cn';
import { ThreatActivityChart } from './ThreatActivityChart';
import { Badge } from '../primitives/Badge';

const severityBar = { critical: 'bg-red', warning: 'bg-amber', info: 'bg-blue' } as const;

function renderLine(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
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

export function ThreatFeed() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-text-bright">Threat Feed</h3>
        <div className="flex items-center gap-1.5">
          <Badge tone="red">{securityOverview.activeThreats} active</Badge>
          <Badge tone="green">{securityOverview.blockedToday} blocked today</Badge>
        </div>
      </div>

      <div className="mb-4 rounded-card border border-border-subtle bg-void/40 p-3">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-text-muted">Threat activity · 24h</p>
        <ThreatActivityChart />
      </div>

      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {threatFeed.map((t) => (
            <motion.li
              key={t.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'flex items-start gap-3 rounded-inset border border-transparent px-2.5 py-2.5 transition-colors hover:border-border-subtle',
                t.severity === 'critical' && 'shadow-[inset_2px_0_0_0_rgba(248,113,113,0.6)]',
              )}
            >
              <span className={cn('mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full', severityBar[t.severity])} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-relaxed text-text-default">{renderLine(t.line)}</p>
                <p className="mt-0.5 font-mono text-[10.5px] text-text-faint">
                  {t.source} · {relativeTime(t.timestamp)}
                </p>
              </div>
              <button className="flex-shrink-0 text-[11px] text-blue hover:underline">Investigate</button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

import { motion } from 'framer-motion';
import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import type { Automation } from '../../data/automations';
import { Badge } from '../primitives/Badge';
import { relativeTime } from '../../lib/format';
import { cn } from '../../lib/cn';

export function AutomationCard({ automation, onToggle }: { automation: Automation; onToggle: () => void }) {
  const a = automation;
  return (
    <div
      className={cn(
        'rounded-card border bg-surface p-5 shadow-inset-top transition-colors',
        a.active ? 'border-blue/15 hover:border-blue/30 hover:shadow-glow-blue-sm' : 'border-border-subtle opacity-60 hover:opacity-80',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:w-52 lg:flex-shrink-0">
          <h3 className="font-display text-sm font-semibold text-text-bright">{a.name}</h3>
          <div className="mt-1.5">
            <Badge tone={a.active ? 'green' : 'slate'}>{a.active ? 'Active' : 'Paused'}</Badge>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded-btn border border-border-subtle bg-elevated px-2.5 py-1.5 text-text-default">{a.trigger}</span>
          <ArrowRight size={12} className="flex-shrink-0 text-text-faint" />
          <span className="rounded-btn border border-border-subtle bg-elevated px-2.5 py-1.5 text-text-default">{a.condition}</span>
          <ArrowRight size={12} className="flex-shrink-0 text-text-faint" />
          <span className="rounded-btn border border-blue/25 bg-blue/[0.08] px-2.5 py-1.5 text-blue">{a.action}</span>
        </div>

        <div className="flex flex-shrink-0 items-center gap-4 lg:w-56 lg:justify-end">
          <div className="text-right">
            <p className="font-mono text-[10.5px] text-text-faint">Last run {relativeTime(a.lastRun)}</p>
            <p className="font-mono text-[10.5px] text-text-faint">{a.runCount} runs</p>
          </div>
          <button
            onClick={onToggle}
            className={cn('relative h-5 w-9 flex-shrink-0 rounded-pill transition-colors', a.active ? 'bg-blue' : 'bg-elevated')}
            aria-label="Toggle automation"
          >
            <motion.span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
              initial={false}
              animate={{ left: a.active ? 18 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            />
          </button>
          <button className="text-text-muted hover:text-text-bright">
            <Pencil size={14} />
          </button>
          <button className="text-text-muted hover:text-red">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

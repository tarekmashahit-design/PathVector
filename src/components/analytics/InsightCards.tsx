import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert, Gauge, Activity } from 'lucide-react';
import { insights, type Insight } from '../../data/analytics';
import { Badge } from '../primitives/Badge';

const impactIcon: Record<Insight['impact'], typeof ShieldAlert> = {
  Security: ShieldAlert,
  Performance: Gauge,
  Stability: Activity,
};
const impactTone: Record<Insight['impact'], 'red' | 'blue' | 'amber'> = {
  Security: 'red',
  Performance: 'blue',
  Stability: 'amber',
};

function renderHeadline(text: string) {
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

export function InsightCards() {
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-semibold text-text-bright">AI Insights</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {insights.map((ins, i) => {
          const Icon = impactIcon[ins.impact];
          return (
            <motion.div
              key={ins.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="w-80 flex-shrink-0 rounded-card border border-border-subtle bg-surface p-4 shadow-inset-top transition-colors hover:border-border hover:shadow-glow-blue-sm"
            >
              <div className="flex items-center justify-between">
                <Icon size={16} strokeWidth={1.75} className="text-blue" />
                <Badge tone={impactTone[ins.impact]}>{ins.impact}</Badge>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-text-default">{renderHeadline(ins.headline)}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge tone="slate">{ins.confidence}%</Badge>
                <button className="flex items-center gap-1 text-xs text-blue hover:underline">
                  Investigate <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

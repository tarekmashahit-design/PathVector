import { motion } from 'framer-motion';
import { hygieneMetrics } from '../../data/analytics';

const riskColor = { high: '#F87171', mid: '#FBBF24', low: '#38BDF8' } as const;

export function HygieneMeters() {
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-semibold text-text-bright">Config Hygiene</h3>
      <div className="space-y-3.5 rounded-card border border-border-subtle bg-surface p-4">
        {hygieneMetrics.map((m, i) => {
          const pct = (m.affected / m.total) * 100;
          return (
            <div key={m.id}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-text-default">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-text-muted">{m.affected} devices</span>
                  <button className="text-[11px] text-blue hover:underline">Fix all</button>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-elevated">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, type: 'spring', stiffness: 120, damping: 12 }}
                  className="h-full rounded-full"
                  style={{ background: riskColor[m.risk] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

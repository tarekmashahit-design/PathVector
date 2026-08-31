import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { riskLeaderboard as seededRiskLeaderboard, type RiskDevice } from '../../data/metrics';
import { cn } from '../../lib/cn';

function riskColor(risk: number) {
  if (risk >= 75) return '#F87171';
  if (risk >= 50) return '#FBBF24';
  return '#38BDF8';
}

export function RiskLeaderboard({ data }: { data?: RiskDevice[] }) {
  const riskLeaderboard = data ?? seededRiskLeaderboard;
  return (
    <div>
      <h3 className="font-display text-sm font-semibold text-text-bright">Devices Needing Attention</h3>
      <p className="mb-4 font-mono text-[11px] text-text-muted">Ranked by risk</p>
      <ul className="space-y-1">
        {riskLeaderboard.map((d) => (
          <li key={d.device} className="group flex cursor-pointer items-center gap-3 rounded-inset px-1.5 py-2 transition-colors hover:bg-elevated">
            <span className="w-4 flex-shrink-0 font-mono text-xs text-text-faint">{d.rank}</span>
            <span className="w-24 flex-shrink-0 truncate font-mono text-xs text-text-bright">{d.device}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.risk}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: riskColor(d.risk) }}
              />
            </div>
            <span className="w-7 flex-shrink-0 text-right font-mono text-xs text-text-muted">{d.risk}</span>
            <ChevronRight size={13} className={cn('flex-shrink-0 text-text-faint transition-transform group-hover:translate-x-0.5')} />
          </li>
        ))}
      </ul>
    </div>
  );
}

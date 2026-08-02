import { motion } from 'framer-motion';
import { Gauge } from '../primitives/Gauge';
import { vulnScore, vulnCategories } from '../../data/security';

export function VulnPosture() {
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-semibold text-text-bright">Vulnerability Posture</h3>
      <div className="flex flex-col items-center">
        <Gauge value={vulnScore} size={150} strokeWidth={10} />
      </div>
      <div className="mt-2 space-y-3">
        {vulnCategories.map((c, i) => (
          <div key={c.id}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-text-default">{c.label}</span>
              <span className="font-mono text-text-muted">{c.score}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.score}%` }}
                transition={{ duration: 0.7, delay: i * 0.06 }}
                className="h-full rounded-full bg-blue"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Gauge } from '../../components/primitives/Gauge';
import { Card } from '../../components/primitives/Card';
import { Badge } from '../../components/primitives/Badge';
import { useDemoStore } from '../../store/demoStore';
import { staggerContainer, staggerItem } from '../../components/shell/PageTransition';

const scoreLabel: Record<string, string> = { switching: 'Switching Health', routing: 'Routing Health', security: 'Security Posture', infrastructure: 'Infrastructure Hygiene' };

const severityTone: Record<string, 'red' | 'amber' | 'blue' | 'slate'> = { critical: 'red', high: 'red', medium: 'amber', low: 'amber', info: 'blue' };

export function DemoDashboardPage() {
  const { scores, findings, summary } = useDemoStore();

  const severityCounts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto max-w-[1200px] space-y-5 p-6">
      <div className="flex flex-col gap-5 lg:flex-row">
        <motion.div variants={staggerItem} className="flex flex-shrink-0 items-center justify-center rounded-hero border border-border-subtle bg-surface p-8 shadow-inset-top lg:w-[300px]">
          {scores && <Gauge value={scores.overall} label="Network Health" size={180} />}
        </motion.div>

        <motion.div variants={staggerItem} className="flex-1 space-y-3">
          {scores &&
            (['switching', 'routing', 'security', 'infrastructure'] as const).map((key) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-text-default">{scoreLabel[key]}</span>
                  <span className="font-mono text-text-muted">{scores[key]}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-elevated">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${scores[key]}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full bg-blue" />
                </div>
              </div>
            ))}
        </motion.div>
      </div>

      <motion.div variants={staggerItem}>
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={15} className="text-blue" />
            <h3 className="font-display text-sm font-semibold text-text-bright">AI Executive Summary</h3>
          </div>
          <p className="text-sm leading-relaxed text-text-default">{summary}</p>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(['critical', 'high', 'medium', 'low', 'info'] as const).map((sev) => (
          <div key={sev} className="rounded-card border border-border-subtle bg-surface p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-text-bright">{severityCounts[sev] ?? 0}</p>
            <Badge tone={severityTone[sev]}>{sev}</Badge>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

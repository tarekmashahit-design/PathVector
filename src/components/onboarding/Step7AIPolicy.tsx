import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Lightbulb, ShieldCheck, Zap, Bot, Check, Circle } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore';
import { WizardShell } from './WizardShell';
import { StepHeader } from './shared';
import { cn } from '../../lib/cn';

const policies = [
  { id: 'monitor', title: 'Monitor Only', desc: 'Detect and report. Never take action.', icon: Eye },
  { id: 'suggest', title: 'Suggest Fixes', desc: 'Detect, diagnose, and suggest. You decide.', icon: Lightbulb },
  { id: 'approval', title: 'Approval Required', desc: 'Detect, diagnose, and prepare the fix. You approve with one click.', icon: ShieldCheck, badge: 'Recommended' },
  { id: 'auto-low', title: 'Auto Low-Risk', desc: 'Low-risk actions execute automatically. High-risk actions wait for approval.', icon: Zap },
  { id: 'autonomous', title: 'Fully Autonomous', desc: 'All actions execute automatically. Full audit trail maintained.', icon: Bot, warning: 'Recommended only after 30+ days of baseline learning.' },
];

const learningItems = [
  { label: 'Traffic patterns', delay: 400 },
  { label: 'CPU and memory baselines', delay: 900 },
  { label: 'Business hours detection', delay: 1600, inProgress: true },
  { label: 'Bandwidth norms', delay: 0, pending: true },
  { label: 'Authentication patterns', delay: 0, pending: true },
];

export function Step7AIPolicy() {
  const s = useOnboardingStore();
  const [progress, setProgress] = useState(0);
  const [doneItems, setDoneItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => Math.min(15, p + 1)), 280);
    const timers = learningItems
      .filter((i) => !i.pending)
      .map((i) => setTimeout(() => setDoneItems((prev) => new Set(prev).add(i.label)), i.delay));
    return () => {
      clearInterval(t);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <WizardShell canContinue={!!s.automationPolicy}>
      <StepHeader title="PathVector is learning your network's normal behavior" />

      <p className="text-sm leading-relaxed text-text-muted">
        We're analyzing traffic patterns, CPU and memory baselines, normal bandwidth levels, and typical log activity. Until learning completes, only rule-based alerts are active.
      </p>

      <div className="mt-4 rounded-card border border-border-subtle bg-surface p-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-text-muted">Baseline learning</span>
          <span className="font-mono text-blue">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-elevated">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full bg-blue" />
        </div>
        <p className="mt-1.5 font-mono text-[10.5px] text-text-faint">Estimated time to full baseline: 7-14 days</p>

        <ul className="mt-3 space-y-1.5">
          {learningItems.map((item) => {
            const done = doneItems.has(item.label);
            return (
              <li key={item.label} className="flex items-center gap-2 text-xs">
                {done ? (
                  <Check size={13} className="text-green" />
                ) : item.inProgress ? (
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                    <Circle size={10} className="fill-blue text-blue" />
                  </motion.span>
                ) : (
                  <Circle size={10} className="text-text-faint" />
                )}
                <span className={cn(done ? 'text-text-default' : item.pending ? 'text-text-faint' : 'text-text-muted')}>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6">
        <p className="mb-3 font-display text-sm font-semibold text-text-bright">How much should PathVector act on its own?</p>
        <div className="space-y-2.5">
          {policies.map((p) => (
            <button
              key={p.id}
              onClick={() => s.setField('automationPolicy', p.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-card border p-3.5 text-left transition-colors',
                s.automationPolicy === p.id ? 'border-blue/50 bg-blue/[0.06] shadow-glow-blue-sm' : 'border-border-subtle bg-surface hover:border-border',
              )}
            >
              <p.icon size={17} className="mt-0.5 flex-shrink-0 text-blue" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-text-bright">{p.title}</span>
                  {p.badge && <span className="rounded-pill border border-blue/25 bg-blue/10 px-2 py-0.5 text-[10px] text-blue">{p.badge}</span>}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">{p.desc}</p>
                {p.warning && <p className="mt-1 text-[10.5px] text-amber">{p.warning}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </WizardShell>
  );
}

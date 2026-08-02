import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Cpu, Radio, BrainCircuit, ShieldCheck, DatabaseBackup, ScanLine } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore';
import { WizardShell } from './WizardShell';
import { Gauge } from '../primitives/Gauge';
import { Button } from '../primitives/Button';
import { ConfettiBurst } from './ConfettiBurst';

const policyLabels: Record<string, string> = {
  monitor: 'Monitor Only',
  suggest: 'Suggest Fixes',
  approval: 'Approval Required',
  'auto-low': 'Auto Low-Risk',
  autonomous: 'Fully Autonomous',
};

export function Step9Launch() {
  const s = useOnboardingStore();
  const navigate = useNavigate();
  const [launching, setLaunching] = useState(false);

  function launch() {
    setLaunching(true);
    localStorage.setItem('onboarding_complete', '1');
    setTimeout(() => navigate('/app/dashboard'), 1000);
  }

  const rows = [
    { icon: Building2, label: 'Sites connected', value: String(s.sites.length) },
    { icon: Cpu, label: 'Devices discovered', value: '22' },
    { icon: Radio, label: 'Monitoring', value: 'Active', tone: 'text-green' },
    { icon: BrainCircuit, label: 'AI Learning', value: '15%' },
    { icon: ShieldCheck, label: 'Automation Policy', value: policyLabels[s.automationPolicy] ?? 'Approval Required' },
    { icon: DatabaseBackup, label: 'Last Config Backup', value: 'Just now' },
    { icon: ScanLine, label: 'Next Scheduled Scan', value: 'In 1 hour' },
  ];

  return (
    <WizardShell hideFooter>
      <div className="relative flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-3xl font-bold text-text-bright drop-shadow-[0_0_24px_rgba(56,189,248,0.35)] sm:text-4xl"
        >
          {s.orgName || 'PathVector'} is ready.
        </motion.h2>
        <p className="mt-2 text-sm text-text-muted">Your live digital twin is up and Vemo has started learning.</p>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.5 }} className="mt-6">
          <Gauge value={94} size={140} strokeWidth={10} label="Network Health" />
        </motion.div>

        <div className="mt-6 w-full max-w-md space-y-2 text-left">
          {rows.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.35 }}
              className="flex items-center justify-between rounded-inset border border-border-subtle bg-surface px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2 text-xs text-text-muted">
                <r.icon size={13} className="text-blue" />
                {r.label}
              </span>
              <span className={`font-mono text-xs ${r.tone ?? 'text-text-bright'}`}>{r.value}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="relative mt-8 w-full max-w-md">
          {launching && <ConfettiBurst />}
          <Button variant="solid" sheen className="w-full py-3" onClick={launch} disabled={launching}>
            Launch Dashboard <ArrowRight size={15} />
          </Button>
        </motion.div>
      </div>
    </WizardShell>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Server } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore';
import { WizardShell } from './WizardShell';
import { StepHeader } from './shared';
import { DiscoveryPulse } from './DiscoveryPulse';
import { ConfettiBurst } from './ConfettiBurst';
import { TopologyGraph } from '../topology/TopologyGraph';
import { Button } from '../primitives/Button';

const unassigned = ['SW-ACC-06 · MikroTik CRS326', 'AP-FL2-01 · C9130AXI'];

export function Step6DiscoveryTopology() {
  const s = useOnboardingStore();
  const [phase, setPhase] = useState<'discovering' | 'topology'>(s.discoveryComplete ? 'topology' : 'discovering');
  const [confetti, setConfetti] = useState(false);

  function onDiscoveryComplete() {
    s.setField('discoveryComplete', true);
    setTimeout(() => setPhase('topology'), 900);
  }

  function approve() {
    s.setField('topologyApproved', true);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 1300);
  }

  return (
    <WizardShell canContinue={s.topologyApproved} wide>
      <StepHeader title="Discovery & Topology" subtitle="Watch PathVector map your network in real time." />

      <AnimatePresence mode="wait">
        {phase === 'discovering' ? (
          <motion.div key="discovering" exit={{ opacity: 0 }}>
            <DiscoveryPulse onComplete={onDiscoveryComplete} />
          </motion.div>
        ) : (
          <motion.div key="topology" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-3 flex items-center gap-2 font-mono text-xs text-green">
              <CheckCircle2 size={14} /> Discovery complete. 22 devices found.
            </div>

            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative h-[420px] flex-1 overflow-hidden rounded-card border border-border-subtle">
                <TopologyGraph floor="all" onSelect={() => {}} />
                {confetti && <ConfettiBurst />}
              </div>
              <div className="w-full flex-shrink-0 rounded-card border border-border-subtle bg-surface p-3.5 lg:w-52">
                <p className="mb-2 text-xs font-medium text-text-muted">Unassigned Devices</p>
                <ul className="space-y-1.5">
                  {unassigned.map((u) => (
                    <li key={u} className="flex items-center gap-1.5 rounded-inset border border-border-subtle bg-void/40 px-2 py-1.5 font-mono text-[10.5px] text-text-default">
                      <Server size={11} className="flex-shrink-0 text-text-faint" />
                      {u}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] text-text-faint">Drag onto a building/floor from Step 2 (or assign later from Settings).</p>
              </div>
            </div>

            <Button variant="solid" sheen className="mt-4 w-full" onClick={approve} disabled={s.topologyApproved}>
              {s.topologyApproved ? 'Topology approved ✓' : 'Approve Topology'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </WizardShell>
  );
}

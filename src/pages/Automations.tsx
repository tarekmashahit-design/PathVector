import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { automations as seedAutomations, type Automation } from '../data/automations';
import { AutomationCard } from '../components/automations/AutomationCard';
import { NewAutomationModal } from '../components/automations/NewAutomationModal';
import { Button } from '../components/primitives/Button';
import { staggerContainer, staggerItem } from '../components/shell/PageTransition';

export function Automations() {
  const [rules, setRules] = useState<Automation[]>(seedAutomations);
  const [modalOpen, setModalOpen] = useState(false);

  function toggle(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }

  function createRule(name: string) {
    setRules((prev) => [
      { id: `AT-${prev.length + 1}`, name, active: true, trigger: 'Custom trigger', condition: 'Custom condition', action: 'Custom action', lastRun: new Date().toISOString(), runCount: 0 },
      ...prev,
    ]);
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto max-w-[1200px] space-y-5 p-6">
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-bright">Automations</h2>
          <p className="mt-1 text-sm text-text-muted">Rules Vemo runs on your behalf, continuously.</p>
        </div>
        <Button sheen onClick={() => setModalOpen(true)}>
          <Plus size={15} /> New Automation
        </Button>
      </motion.div>

      <div className="space-y-3">
        {rules.map((r) => (
          <motion.div key={r.id} variants={staggerItem}>
            <AutomationCard automation={r} onToggle={() => toggle(r.id)} />
          </motion.div>
        ))}
      </div>

      <NewAutomationModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createRule} />
    </motion.div>
  );
}

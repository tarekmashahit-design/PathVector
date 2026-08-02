import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../primitives/Modal';
import { Button } from '../primitives/Button';

const triggers = ['Unknown device joins access port', 'Device CPU exceeds threshold', 'Port enters err-disabled state', 'Weekly on Monday 08:00'];
const conditions = ['Not in asset inventory', 'Severity = high', 'Device role = core or distribution', 'First occurrence'];
const actions = ['Move to VLAN 999', 'Page on-call', 'Re-enable port after cooldown', 'Rotate credential'];
const channels = [
  { id: 'slack', label: 'Slack', color: '#4A154B' },
  { id: 'email', label: 'Email', color: '#38BDF8' },
  { id: 'teams', label: 'Teams', color: '#6264A7' },
  { id: 'webhook', label: 'Webhook', color: '#64748B' },
];

export function NewAutomationModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState(triggers[0]);
  const [condition, setCondition] = useState(conditions[0]);
  const [action, setAction] = useState(actions[0]);
  const [channel, setChannel] = useState(channels[0].id);

  const channelLabel = channels.find((c) => c.id === channel)?.label ?? '';
  const preview = `When ${trigger.charAt(0).toLowerCase() + trigger.slice(1)}, if ${condition.toLowerCase()}, ${action.toLowerCase()} and notify #netops on ${channelLabel}.`;

  function handleSave() {
    if (!name.trim()) {
      toast.error('Give the automation a name');
      return;
    }
    onCreate(name);
    toast.success(`${name} created`);
    setName('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New Automation" width={520}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quarantine unknown devices"
            className="w-full rounded-btn border border-border-subtle bg-surface px-3 py-2 text-sm text-text-bright outline-none focus:border-blue/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-text-muted">Trigger</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full rounded-btn border border-border-subtle bg-surface px-3 py-2 text-sm text-text-bright outline-none focus:border-blue/40"
            >
              {triggers.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-muted">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-btn border border-border-subtle bg-surface px-3 py-2 text-sm text-text-bright outline-none focus:border-blue/40"
            >
              {conditions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-text-muted">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-btn border border-border-subtle bg-surface px-3 py-2 text-sm text-text-bright outline-none focus:border-blue/40"
          >
            {actions.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-text-muted">Notification channel</label>
          <div className="grid grid-cols-4 gap-2">
            {channels.map((c) => (
              <button
                key={c.id}
                onClick={() => setChannel(c.id)}
                className={`rounded-btn border px-2 py-2 text-xs transition-colors ${
                  channel === c.id ? 'border-blue/40 bg-blue/10 text-text-bright' : 'border-border-subtle text-text-muted hover:text-text-bright'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-border-subtle bg-void/60 p-3.5">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">Preview</p>
          <p className="text-sm leading-relaxed text-text-default">{preview}</p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" size="sm" onClick={handleSave}>
            Save automation
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import { Mail, Smartphone, Webhook as WebhookIcon, Bell, Check, Plus, X } from 'lucide-react';
import { useOnboardingStore, uid } from '../../store/onboardingStore';
import { WizardShell } from './WizardShell';
import { StepHeader, InfoNote, TextInput, Select } from './shared';
import { SlackIcon, TeamsIcon, DiscordIcon } from './NotificationIcons';
import { cn } from '../../lib/cn';

const roles = ['Owner', 'Administrator', 'Network Engineer', 'Help Desk', 'Security Analyst', 'Auditor', 'Read Only'];

const platforms: { id: string; label: string; icon: React.ReactNode; field?: 'email' | 'phone' | 'url' }[] = [
  { id: 'teams', label: 'Microsoft Teams', icon: <TeamsIcon /> },
  { id: 'slack', label: 'Slack', icon: <SlackIcon /> },
  { id: 'discord', label: 'Discord', icon: <DiscordIcon /> },
  { id: 'email', label: 'Email', icon: <Mail size={18} className="text-blue" />, field: 'email' },
  { id: 'sms', label: 'SMS', icon: <Smartphone size={18} className="text-blue" />, field: 'phone' },
  { id: 'pagerduty', label: 'PagerDuty', icon: <Bell size={18} className="text-green" /> },
  { id: 'webhook', label: 'Webhook', icon: <WebhookIcon size={18} className="text-blue" />, field: 'url' },
];

const severities: { key: 'critical' | 'warning' | 'info'; label: string; tone: string }[] = [
  { key: 'critical', label: 'Critical', tone: 'text-red' },
  { key: 'warning', label: 'Warning', tone: 'text-amber' },
  { key: 'info', label: 'Info', tone: 'text-blue' },
];

export function Step8Notifications() {
  const s = useOnboardingStore();

  function toggleConnect(id: string) {
    const current = s.integrations[id];
    s.setField('integrations', { ...s.integrations, [id]: { connected: !current?.connected, value: current?.value } });
  }
  function setValue(id: string, value: string) {
    s.setField('integrations', { ...s.integrations, [id]: { connected: true, value } });
  }
  function toggleRouting(sev: 'critical' | 'warning' | 'info', channel: string) {
    const list = s.severityRouting[sev];
    const next = list.includes(channel) ? list.filter((c) => c !== channel) : [...list, channel];
    s.setField('severityRouting', { ...s.severityRouting, [sev]: next });
  }

  function addMember() {
    s.setField('team', [...s.team, { id: uid(), name: '', email: '', role: 'Read Only' }]);
  }
  function updateMember(id: string, patch: Partial<{ name: string; email: string; role: string }>) {
    s.setField('team', s.team.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function removeMember(id: string) {
    s.setField('team', s.team.filter((m) => m.id !== id));
  }

  const connectedChannels = Object.entries(s.integrations).filter(([, v]) => v.connected).map(([k]) => k);

  return (
    <WizardShell canContinue>
      <StepHeader title="Notifications & Team" subtitle="Connect the channels your team already lives in." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {platforms.map((p) => {
          const state = s.integrations[p.id];
          return (
            <div key={p.id} className={cn('rounded-card border p-3.5 transition-colors', state?.connected ? 'border-blue/30 bg-blue/[0.04]' : 'border-border-subtle bg-surface')}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-text-bright">
                  {p.icon}
                  {p.label}
                </span>
                <button
                  onClick={() => toggleConnect(p.id)}
                  className={cn(
                    'flex items-center gap-1 rounded-btn border px-2.5 py-1 text-[11px]',
                    state?.connected ? 'border-green/30 bg-green/10 text-green' : 'border-border-subtle text-text-muted hover:border-blue/40 hover:text-text-bright',
                  )}
                >
                  {state?.connected && <Check size={11} />}
                  {state?.connected ? 'Connected' : 'Connect'}
                </button>
              </div>
              {state?.connected && p.field && (
                <TextInput
                  className="mt-2"
                  placeholder={p.field === 'email' ? 'alerts@company.com' : p.field === 'phone' ? '+1 555 0100' : 'https://…'}
                  value={state.value ?? ''}
                  onChange={(e) => setValue(p.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-card border border-border-subtle bg-void/40 p-4">
        <p className="mb-3 text-xs font-medium text-text-muted">Severity routing</p>
        <div className="space-y-2.5">
          {severities.map((sev) => (
            <div key={sev.key} className="flex flex-wrap items-center gap-2">
              <span className={cn('w-16 flex-shrink-0 text-xs font-medium', sev.tone)}>{sev.label}</span>
              {connectedChannels.length === 0 && <span className="text-[11px] text-text-faint">Connect a channel above</span>}
              {connectedChannels.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleRouting(sev.key, c)}
                  className={cn(
                    'rounded-pill border px-2.5 py-1 text-[10.5px] capitalize transition-colors',
                    s.severityRouting[sev.key].includes(c) ? 'border-blue/40 bg-blue/10 text-blue' : 'border-border-subtle text-text-muted',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 font-display text-sm font-semibold text-text-bright">Invite Your Team</p>
        <div className="space-y-2">
          {s.team.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <TextInput placeholder="Name" value={m.name} disabled={m.role === 'Owner'} onChange={(e) => updateMember(m.id, { name: e.target.value })} className="flex-1" />
              <TextInput placeholder="Email" value={m.email} disabled={m.role === 'Owner'} onChange={(e) => updateMember(m.id, { email: e.target.value })} className="flex-1" />
              <Select value={m.role} disabled={m.role === 'Owner'} onChange={(e) => updateMember(m.id, { role: e.target.value })} className="w-40 flex-shrink-0">
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
              {m.role !== 'Owner' && (
                <button onClick={() => removeMember(m.id)} className="flex-shrink-0 text-text-faint hover:text-red">
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addMember} className="mt-2 flex items-center gap-1.5 text-xs text-blue hover:underline">
          <Plus size={13} /> Add another
        </button>
      </div>

      <InfoNote>Team members will receive an email invitation to join PathVector.</InfoNote>
    </WizardShell>
  );
}

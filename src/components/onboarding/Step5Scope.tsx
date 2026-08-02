import {
  HeartPulse,
  Activity,
  ScrollText,
  Waves,
  DatabaseBackup,
  Waypoints,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  Fingerprint,
  Gauge,
  GitCompareArrows,
} from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore';
import { WizardShell } from './WizardShell';
import { StepHeader, InfoNote, ToggleRow } from './shared';
import { cn } from '../../lib/cn';

const cards = [
  { key: 'deviceHealth', icon: HeartPulse, title: 'Device Health', desc: 'CPU, memory, temperature' },
  { key: 'interfaceStats', icon: Activity, title: 'Interface Statistics', desc: 'Bandwidth, errors, utilization' },
  { key: 'syslog', icon: ScrollText, title: 'Syslog Collection', desc: 'Real-time event logs' },
  { key: 'trafficFlow', icon: Waves, title: 'Traffic Flow Analysis', desc: 'NetFlow / sFlow' },
  { key: 'configBackup', icon: DatabaseBackup, title: 'Configuration Backup', desc: 'Automatic config snapshots' },
  { key: 'topologyDiscovery', icon: Waypoints, title: 'Topology Discovery', desc: 'CDP/LLDP neighbor mapping' },
  { key: 'aiMonitoring', icon: Sparkles, title: 'AI-Powered Monitoring', desc: 'Anomaly detection, root cause', badge: 'Powered by AI' },
  { key: 'predictiveAnalytics', icon: TrendingDown, title: 'Predictive Analytics', desc: 'Failure forecasting' },
  { key: 'continuousHardening', icon: ShieldCheck, title: 'Continuous Hardening', desc: 'Active security testing', badge: 'Advanced' },
  { key: 'userDeviceTracking', icon: Fingerprint, title: 'User & Device Tracking', desc: 'MAC, 802.1X, RADIUS' },
  { key: 'bandwidthMonitoring', icon: Gauge, title: 'Bandwidth Monitoring', desc: 'Per-interface utilization trends' },
  { key: 'configDriftDetection', icon: GitCompareArrows, title: 'Configuration Drift Detection', desc: 'Change tracking' },
];

export function Step5Scope() {
  const s = useOnboardingStore();
  const canContinue = Object.values(s.monitoringScope).some(Boolean);

  return (
    <WizardShell canContinue={canContinue}>
      <StepHeader title="What should PathVector monitor?" subtitle="Toggle the capabilities you want active from day one." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => {
          const on = s.monitoringScope[c.key];
          return (
            <div key={c.key} className={cn('flex flex-col gap-2.5 rounded-card border p-3.5 transition-colors', on ? 'border-blue/25 bg-blue/[0.04]' : 'border-border-subtle bg-surface')}>
              <div className="flex items-start justify-between">
                <c.icon size={16} strokeWidth={1.75} className="text-blue" />
                <ToggleRow label={c.title} checked={on} onChange={(v) => s.setField('monitoringScope', { ...s.monitoringScope, [c.key]: v })} />
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-text-bright">
                  {c.title}
                  {c.badge && <span className="rounded-pill border border-blue/25 bg-blue/10 px-1.5 py-0.5 text-[9px] text-blue">{c.badge}</span>}
                </p>
                <p className="mt-0.5 text-[11px] text-text-muted">{c.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <InfoNote>You can enable or disable any of these later from Settings. Starting with the defaults is recommended.</InfoNote>
    </WizardShell>
  );
}

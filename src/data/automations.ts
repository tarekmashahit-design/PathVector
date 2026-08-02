import { isoHoursAgo, isoDaysAgo } from '../lib/format';

export interface Automation {
  id: string;
  name: string;
  active: boolean;
  trigger: string;
  condition: string;
  action: string;
  lastRun: string;
  runCount: number;
}

export const automations: Automation[] = [
  {
    id: 'AT-1', name: 'Quarantine unknown devices', active: true,
    trigger: 'Unknown device joins access port', condition: 'Not in asset inventory', action: 'Move to VLAN 999 + notify #netops',
    lastRun: isoHoursAgo(2), runCount: 14,
  },
  {
    id: 'AT-2', name: 'Auto-clear err-disabled ports', active: true,
    trigger: 'Port enters err-disabled state', condition: 'Cause = BPDU guard, first occurrence', action: 'Re-enable port after 5 min cooldown',
    lastRun: isoHoursAgo(6), runCount: 31,
  },
  {
    id: 'AT-3', name: 'Nightly hardening scan', active: true,
    trigger: 'Every day at 02:00', condition: 'Always', action: 'Run hygiene scan + email summary',
    lastRun: isoHoursAgo(9), runCount: 214,
  },
  {
    id: 'AT-4', name: 'CPU threshold escalation', active: true,
    trigger: 'Device CPU > 80% for 10 min', condition: 'Device role = core or distribution', action: 'Page on-call via PagerDuty',
    lastRun: isoDaysAgo(4), runCount: 3,
  },
  {
    id: 'AT-5', name: 'Weak credential remediation', active: false,
    trigger: 'Default or weak credential detected', condition: 'Severity = high', action: 'Rotate credential + notify #security',
    lastRun: isoDaysAgo(11), runCount: 7,
  },
  {
    id: 'AT-6', name: 'Firmware drift report', active: false,
    trigger: 'Weekly on Monday 08:00', condition: 'Firmware version behind by 2+ releases', action: 'Generate report to #netops-weekly',
    lastRun: isoDaysAgo(6), runCount: 18,
  },
];

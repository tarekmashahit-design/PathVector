import { isoHoursAgo, isoDaysAgo } from '../lib/format';

export interface Insight {
  id: string;
  headline: string;
  impact: 'Security' | 'Performance' | 'Stability';
  confidence: number;
}

export const insights: Insight[] = [
  { id: 'IN-1', headline: '`SW-ACC-07` port `Gi0/12` traffic is 340% above its 30-day baseline — likely a rogue device or misconfiguration', impact: 'Security', confidence: 88 },
  { id: 'IN-2', headline: '`SW-DIST-03` trunk to `SW-ACC-11` has been down 14 minutes; VLAN 30 clients on Floor 3 losing redundancy', impact: 'Stability', confidence: 97 },
  { id: 'IN-3', headline: 'Wi-Fi retransmits on Floor 2 correlate with `AP-FL2-04` channel overlap with a neighboring AP', impact: 'Performance', confidence: 76 },
  { id: 'IN-4', headline: '`SW-CORE-02` CPU has trended up 4pts/week for 3 weeks — projected to breach 80% by Aug 2', impact: 'Stability', confidence: 81 },
  { id: 'IN-5', headline: '3 access switches on Floor 3 are two firmware versions behind current, no critical CVEs outstanding', impact: 'Security', confidence: 100 },
  { id: 'IN-6', headline: 'Database server `SRV-DB-01` p95 query latency up 22% since last Tuesday’s config change', impact: 'Performance', confidence: 69 },
];

export interface AnomalyEvent {
  id: string;
  timestamp: string;
  device: string;
  severity: 'critical' | 'warning' | 'info';
  what: string;
  evidence: string[];
  recommendation: string;
}

export const anomalyTimeline: AnomalyEvent[] = [
  {
    id: 'AN-1', timestamp: isoHoursAgo(0.2), device: 'SW-DIST-03', severity: 'critical',
    what: 'Trunk to SW-ACC-11 dropped without a corresponding physical link-down event',
    evidence: ['Interface Gi1/0/1 error-disabled at 14:32:07', 'BPDU guard violation logged 3x in prior 5 min', 'No syslog entry for physical carrier loss'],
    recommendation: 'Clear err-disable state on Gi1/0/1 and verify spanning-tree topology before re-enabling.',
  },
  {
    id: 'AN-2', timestamp: isoHoursAgo(1.1), device: 'SW-ACC-07', severity: 'warning',
    what: 'Sudden sustained traffic increase on access port Gi0/12',
    evidence: ['In-traffic baseline: 40-90 Mb/s, observed: 312 Mb/s', 'New MAC a4:83:e7:2c:19:0f learned at 13:41:02', 'No corresponding DHCP lease issued from known scope'],
    recommendation: 'Isolate port to quarantine VLAN pending manual identification of the device.',
  },
  {
    id: 'AN-3', timestamp: isoHoursAgo(3.4), device: 'SW-CORE-02', severity: 'warning',
    what: 'Control-plane CPU sustained above 65% for 18 continuous minutes',
    evidence: ['5-min CPU avg: 68%, 24h baseline: 28-35%', 'Process "IP Input" consuming 41% of cycles', 'Coincides with a burst of ARP requests from VLAN 20'],
    recommendation: 'Enable ARP rate limiting on VLAN 20 SVI and monitor for recurrence over next 24h.',
  },
  {
    id: 'AN-4', timestamp: isoDaysAgo(1), device: 'RTR-EDGE-01', severity: 'warning',
    what: 'BGP session to upstream AS64512 flapped 3 times within 10 minutes',
    evidence: ['Hold timer expired at 09:14:55, 09:19:12, 09:24:03', 'Interface error counters unchanged during flaps', 'Upstream peer confirmed maintenance window at 09:00-09:30'],
    recommendation: 'No action required — correlates with upstream-announced maintenance. Vemo will monitor for 24h.',
  },
  {
    id: 'AN-5', timestamp: isoDaysAgo(2), device: 'SRV-DB-01', severity: 'info',
    what: 'Query p95 latency increased 22% following a scheduled configuration change',
    evidence: ['p95 before change: 14ms, after: 17.1ms', 'Change window: Tue 02:00 — connection pool size reduced 200→120', 'No corresponding CPU or memory pressure increase'],
    recommendation: 'Review connection pool sizing; likely contention under peak concurrent load.',
  },
];

export interface Prediction {
  id: string;
  device: string;
  issue: string;
  horizon: string;
  horizonRisk: 'high' | 'mid' | 'low';
  confidence: number;
  action: string;
}

export const predictions: Prediction[] = [
  { id: 'PR-1', device: 'SW-DIST-03', issue: 'Interface Gi1/0/1 hardware failure', horizon: '2–4 days', horizonRisk: 'high', confidence: 84, action: 'Schedule proactive port replacement' },
  { id: 'PR-2', device: 'SW-CORE-02', issue: 'Sustained CPU threshold breach (80%)', horizon: '5–9 days', horizonRisk: 'mid', confidence: 81, action: 'Investigate ARP traffic source on VLAN 20' },
  { id: 'PR-3', device: 'SRV-APP-01', issue: 'Memory exhaustion under peak load', horizon: '6 hours', horizonRisk: 'high', confidence: 68, action: 'Restart app service during low-traffic window' },
  { id: 'PR-4', device: 'AP-FL2-04', issue: 'Client capacity ceiling on 5GHz radio', horizon: '2–3 weeks', horizonRisk: 'low', confidence: 62, action: 'Plan supplemental AP for Floor 2 east wing' },
  { id: 'PR-5', device: 'SW-ACC-11', issue: 'Extended offline duration risking SLA breach', horizon: '< 1 hour', horizonRisk: 'high', confidence: 92, action: 'Dispatch on-site check of power and uplink' },
];

export interface HygieneMetric {
  id: string;
  label: string;
  affected: number;
  total: number;
  risk: 'high' | 'mid' | 'low';
}

export const hygieneMetrics: HygieneMetric[] = [
  { id: 'hy1', label: 'Open Ports', affected: 6, total: 23, risk: 'high' },
  { id: 'hy2', label: 'Missing Port-Security', affected: 4, total: 23, risk: 'high' },
  { id: 'hy3', label: 'Default Credentials', affected: 1, total: 23, risk: 'high' },
  { id: 'hy4', label: 'Unencrypted Mgmt', affected: 3, total: 23, risk: 'mid' },
  { id: 'hy5', label: 'Weak Segmentation', affected: 2, total: 23, risk: 'mid' },
];

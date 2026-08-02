import { isoMinutesAgo, isoHoursAgo, isoDaysAgo } from '../lib/format';

export interface ThreatEntry {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  line: string;
  source: string;
  timestamp: string;
}

export const threatFeed: ThreatEntry[] = [
  { id: 'TH-1', severity: 'critical', line: 'Unknown MAC `a4:83:e7:2c:19:0f` appeared on `SW-ACC-07` port `Gi0/12`', source: 'NAC Engine', timestamp: isoMinutesAgo(6) },
  { id: 'TH-2', severity: 'warning', line: 'Repeated failed SSH auth (5x) against `SW-CORE-02` from `10.42.9.201`', source: 'AAA Log', timestamp: isoMinutesAgo(22) },
  { id: 'TH-3', severity: 'critical', line: 'Rogue DHCP server detected offering leases on VLAN 20 from `10.42.2.44`', source: 'DHCP Snoop', timestamp: isoMinutesAgo(48) },
  { id: 'TH-4', severity: 'info', line: 'Port scan pattern (SYN, 40+ ports) observed toward `SRV-APP-01` from internal host', source: 'Flow Analysis', timestamp: isoHoursAgo(1.2) },
  { id: 'TH-5', severity: 'warning', line: 'Default credential login attempt blocked on `AP-FL2-04`', source: 'AAA Log', timestamp: isoHoursAgo(2.6) },
  { id: 'TH-6', severity: 'info', line: 'New certificate pinned for management access on `FW-EDGE-01`', source: 'Cert Monitor', timestamp: isoHoursAgo(5) },
  { id: 'TH-7', severity: 'warning', line: 'Unauthorized VLAN hop attempt blocked on `SW-DIST-01` port `Gi1/0/1`', source: 'Dot1x Engine', timestamp: isoHoursAgo(8) },
  { id: 'TH-8', severity: 'info', line: 'TLS certificate on `RTR-EDGE-01` management interface renewed automatically', source: 'Cert Monitor', timestamp: isoHoursAgo(11) },
  { id: 'TH-9', severity: 'critical', line: 'Brute-force pattern (12 attempts/min) against `FW-EDGE-01` VPN gateway from `203.0.113.44`', source: 'AAA Log', timestamp: isoHoursAgo(14) },
  { id: 'TH-10', severity: 'warning', line: 'ARP spoofing signature detected on VLAN 10 originating from `10.42.2.61`', source: 'Flow Analysis', timestamp: isoDaysAgo(1) },
];

export interface SecurityOverview {
  activeThreats: number;
  blockedToday: number;
  openInvestigations: number;
  devicesAtRisk: number;
}

export const securityOverview: SecurityOverview = {
  activeThreats: threatFeed.filter((t) => t.severity !== 'info').length,
  blockedToday: 14,
  openInvestigations: 3,
  devicesAtRisk: 4,
};

export interface ThreatActivityPoint {
  hour: string;
  critical: number;
  warning: number;
  info: number;
}

export const threatActivity: ThreatActivityPoint[] = [
  { hour: '00:00', critical: 0, warning: 1, info: 2 },
  { hour: '02:00', critical: 0, warning: 0, info: 1 },
  { hour: '04:00', critical: 0, warning: 1, info: 1 },
  { hour: '06:00', critical: 1, warning: 1, info: 2 },
  { hour: '08:00', critical: 0, warning: 2, info: 3 },
  { hour: '10:00', critical: 1, warning: 3, info: 2 },
  { hour: '12:00', critical: 0, warning: 2, info: 4 },
  { hour: '14:00', critical: 2, warning: 3, info: 3 },
  { hour: '16:00', critical: 1, warning: 2, info: 2 },
  { hour: '18:00', critical: 0, warning: 1, info: 3 },
  { hour: '20:00', critical: 1, warning: 2, info: 1 },
  { hour: '22:00', critical: 0, warning: 1, info: 2 },
];

export interface AuditRow {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  result: 'success' | 'failed';
}

export const auditLog: AuditRow[] = [
  { id: 'AU-1', timestamp: isoMinutesAgo(14), actor: 'admin', action: 'Pushed config', target: 'SW-DIST-01', result: 'success' },
  { id: 'AU-2', timestamp: isoMinutesAgo(40), actor: 'jchen', action: 'Restarted port', target: 'SW-DIST-03 Gi1/0/1', result: 'success' },
  { id: 'AU-3', timestamp: isoHoursAgo(1), actor: 'system', action: 'Rotated SNMP credential', target: 'All devices', result: 'success' },
  { id: 'AU-4', timestamp: isoHoursAgo(1.5), actor: 'jchen', action: 'Login attempt', target: 'SW-CORE-02', result: 'failed' },
  { id: 'AU-5', timestamp: isoHoursAgo(3), actor: 'admin', action: 'Isolated device', target: 'SW-ACC-07 Gi0/12', result: 'success' },
  { id: 'AU-6', timestamp: isoHoursAgo(6), actor: 'system', action: 'Applied hardening rule', target: 'AP-FL2-04', result: 'success' },
  { id: 'AU-7', timestamp: isoDaysAgo(1), actor: 'admin', action: 'Added VLAN', target: 'SW-DIST-01 (VLAN 40)', result: 'success' },
  { id: 'AU-8', timestamp: isoDaysAgo(2), actor: 'system', action: 'Backup config', target: 'All devices', result: 'success' },
];

export interface VulnCategory {
  id: string;
  label: string;
  score: number;
}

export const vulnScore = 72;
export const vulnCategories: VulnCategory[] = [
  { id: 'vc1', label: 'Port Security', score: 64 },
  { id: 'vc2', label: 'Access Control', score: 81 },
  { id: 'vc3', label: 'Encryption', score: 77 },
  { id: 'vc4', label: 'Credential Hygiene', score: 58 },
  { id: 'vc5', label: 'Segmentation', score: 79 },
];

export type PortSecStatus = '802.1x' | 'mac-filter' | 'open';

export interface PortCell {
  device: string;
  port: string;
  status: PortSecStatus;
}

const switches = ['SW-DIST-01', 'SW-DIST-02', 'SW-DIST-03', 'SW-ACC-01', 'SW-ACC-04', 'SW-ACC-07', 'SW-ACC-09', 'SW-ACC-14'];
export const portSecurityMap: PortCell[] = switches.flatMap((device) =>
  Array.from({ length: 12 }, (_, i) => {
    const r = Math.random();
    const status: PortSecStatus = r > 0.82 ? 'open' : r > 0.6 ? 'mac-filter' : '802.1x';
    return { device, port: `Gi0/${i + 1}`, status };
  }),
);

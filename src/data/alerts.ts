import { isoMinutesAgo, isoHoursAgo } from '../lib/format';

export type Severity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  severity: Severity;
  message: string;
  devices: string[];
  confidence: number;
  timestamp: string;
}

export const initialAlerts: Alert[] = [
  {
    id: 'AL-1042',
    severity: 'critical',
    message: 'Trunk encapsulation mismatch between `SW-CORE-01` and `SW-DIST-03` may isolate VLAN 40 traffic',
    devices: ['SW-CORE-01', 'SW-DIST-03'],
    confidence: 94,
    timestamp: isoMinutesAgo(3),
  },
  {
    id: 'AL-1041',
    severity: 'critical',
    message: 'Interface `Gi1/0/1` on `SW-DIST-03` reporting 1,204 CRC errors in the last hour, 240x baseline',
    devices: ['SW-DIST-03'],
    confidence: 91,
    timestamp: isoMinutesAgo(11),
  },
  {
    id: 'AL-1040',
    severity: 'warning',
    message: 'CPU on `SW-CORE-02` sustained above 65% for 18 minutes, approaching control-plane threshold',
    devices: ['SW-CORE-02'],
    confidence: 82,
    timestamp: isoMinutesAgo(24),
  },
  {
    id: 'AL-1039',
    severity: 'warning',
    message: 'Port `Gi0/12` on `SW-ACC-07` traffic is 340% above its 30-day baseline',
    devices: ['SW-ACC-07'],
    confidence: 88,
    timestamp: isoMinutesAgo(37),
  },
  {
    id: 'AL-1038',
    severity: 'info',
    message: 'Firmware `17.12.1` available for 3 access switches on Floor 3, no known CVEs addressed',
    devices: ['SW-ACC-14', 'SW-ACC-18'],
    confidence: 100,
    timestamp: isoHoursAgo(1),
  },
  {
    id: 'AL-1037',
    severity: 'critical',
    message: '`SW-ACC-11` has not responded to polling for 14 minutes, last known state healthy',
    devices: ['SW-ACC-11'],
    confidence: 97,
    timestamp: isoHoursAgo(1.4),
  },
  {
    id: 'AL-1036',
    severity: 'warning',
    message: 'Retransmit rate on `AP-FL2-04` climbed to 6.1%, likely channel congestion on 20 clients',
    devices: ['AP-FL2-04'],
    confidence: 76,
    timestamp: isoHoursAgo(2.1),
  },
  {
    id: 'AL-1035',
    severity: 'info',
    message: 'Scheduled config backup completed for all 23 managed devices',
    devices: [],
    confidence: 100,
    timestamp: isoHoursAgo(3),
  },
  {
    id: 'AL-1034',
    severity: 'warning',
    message: 'BGP session flap detected on `RTR-EDGE-01` toward upstream AS64512, 3 flaps in 10 minutes',
    devices: ['RTR-EDGE-01'],
    confidence: 85,
    timestamp: isoHoursAgo(4.3),
  },
  {
    id: 'AL-1033',
    severity: 'info',
    message: 'New device `10.42.2.44` learned on `SW-ACC-09` port `1/1/4`, pending classification',
    devices: ['SW-ACC-09'],
    confidence: 100,
    timestamp: isoHoursAgo(5),
  },
];

const queueTemplates: Omit<Alert, 'id' | 'timestamp'>[] = [
  { severity: 'warning', message: 'Latency to `SRV-DB-01` from Floor 2 clients increased to 18ms, 3x baseline', devices: ['SRV-DB-01'], confidence: 79 },
  { severity: 'critical', message: 'Duplicate IP `10.42.2.4` detected on VLAN 10, conflicting with `SW-ACC-04`', devices: ['SW-ACC-04'], confidence: 93 },
  { severity: 'info', message: 'DHCP scope on VLAN 20 at 82% utilization, 41 leases of 50 available', devices: [], confidence: 100 },
  { severity: 'warning', message: 'Power draw on `AP-FL3-01` PoE port fluctuating outside expected range', devices: ['AP-FL3-01'], confidence: 71 },
  { severity: 'critical', message: 'Unauthorized VLAN hop attempt blocked on `SW-DIST-01` port `Gi1/0/1`', devices: ['SW-DIST-01'], confidence: 96 },
  { severity: 'info', message: 'Vemo completed nightly hardening scan across 23 devices, 2 findings', devices: [], confidence: 100 },
  { severity: 'warning', message: 'Memory on `SRV-APP-01` trending toward 80% over the next 6 hours', devices: ['SRV-APP-01'], confidence: 68 },
];

export function nextQueuedAlert(seq: number): Alert {
  const t = queueTemplates[seq % queueTemplates.length];
  return { ...t, id: `AL-${1050 + seq}`, timestamp: new Date().toISOString() };
}

import { isoMinutesAgo, isoHoursAgo, isoDaysAgo } from '../lib/format';

export type NotifType = 'critical' | 'warning' | 'info' | 'success';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
}

export const initialNotifications: Notification[] = [
  { id: 'NT-1', type: 'critical', title: 'Link down', detail: '`SW-DIST-03` → `SW-ACC-11` uplink has been down 14 minutes', timestamp: isoMinutesAgo(14), read: false },
  { id: 'NT-2', type: 'warning', title: 'Traffic anomaly', detail: '`SW-ACC-07` port `Gi0/12` at 340% of baseline', timestamp: isoMinutesAgo(37), read: false },
  { id: 'NT-3', type: 'success', title: 'Auto-remediation applied', detail: 'Cleared err-disable state on `SW-DIST-01` `Gi1/0/1`', timestamp: isoHoursAgo(1), read: false },
  { id: 'NT-4', type: 'info', title: 'Scan complete', detail: 'Nightly hardening scan finished, 2 findings across 23 devices', timestamp: isoHoursAgo(2), read: true },
  { id: 'NT-5', type: 'warning', title: 'CPU threshold', detail: '`SW-CORE-02` sustained above 65% for 18 minutes', timestamp: isoHoursAgo(3), read: true },
  { id: 'NT-6', type: 'critical', title: 'Rogue DHCP', detail: 'Unauthorized DHCP server detected on VLAN 20', timestamp: isoHoursAgo(5), read: true },
  { id: 'NT-7', type: 'success', title: 'Config backup', detail: 'Scheduled backup completed for all 23 devices', timestamp: isoHoursAgo(7), read: true },
  { id: 'NT-8', type: 'info', title: 'Firmware available', detail: '17.12.1 available for 3 switches on Floor 3', timestamp: isoDaysAgo(1), read: true },
  { id: 'NT-9', type: 'warning', title: 'BGP flap', detail: '`RTR-EDGE-01` session to AS64512 flapped 3 times', timestamp: isoDaysAgo(1), read: true },
  { id: 'NT-10', type: 'success', title: 'Automation triggered', detail: 'Unknown device quarantined on `SW-ACC-09` port `1/1/4`', timestamp: isoDaysAgo(2), read: true },
];

const notifQueue: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [
  { type: 'warning', title: 'Latency spike', detail: '`SRV-DB-01` p95 latency up 22% since last change' },
  { type: 'critical', title: 'Duplicate IP', detail: '`10.42.2.4` conflict detected on VLAN 10' },
  { type: 'info', title: 'DHCP scope high', detail: 'VLAN 20 scope at 82% utilization' },
  { type: 'success', title: 'Fix applied', detail: 'Isolated rogue device on `SW-ACC-07`' },
];

export function nextQueuedNotification(seq: number): Notification {
  const t = notifQueue[seq % notifQueue.length];
  return { ...t, id: `NT-Q${seq}`, timestamp: new Date().toISOString(), read: false };
}

export type DeviceType = 'router' | 'core-switch' | 'access-switch' | 'ap' | 'server' | 'endpoint';
export type DeviceStatus = 'healthy' | 'warning' | 'critical' | 'offline';

export interface InterfaceRow {
  port: string;
  status: 'up' | 'down';
  speed: string;
  vlan: string;
  inTraffic: string;
  outTraffic: string;
  errors: number;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ip: string;
  model: string;
  vendor: 'Cisco' | 'Juniper' | 'Aruba' | 'MikroTik';
  firmware: string;
  serial: string;
  mac: string;
  location: string;
  vlan: string;
  uptime: string;
  cpu: number;
  mem: number;
  alerts: number;
  cpuHistory: number[];
  memHistory: number[];
  throughputHistory: number[];
  interfaces: InterfaceRow[];
  configDiff: { added: string[]; removed: string[]; changedBy: string; daysAgo: number };
}

const cpuSeries = (base: number) =>
  Array.from({ length: 24 }, (_, i) => Math.max(2, Math.round(base + Math.sin(i / 2.3) * 6 + (Math.random() * 4 - 2))));

const memSeries = (base: number) =>
  Array.from({ length: 24 }, (_, i) => Math.max(4, Math.round(base + Math.cos(i / 3.1) * 4 + (Math.random() * 3 - 1.5))));

const thruSeries = (base: number) =>
  Array.from({ length: 24 }, (_, i) => Math.max(1, Math.round(base + Math.sin(i / 1.7) * base * 0.4 + (Math.random() * base * 0.1))));

function iface(port: string, status: 'up' | 'down', speed: string, vlan: string, inT: string, outT: string, errors = 0): InterfaceRow {
  return { port, status, speed, vlan, inTraffic: inT, outTraffic: outT, errors };
}

export const devices: Device[] = [
  {
    id: 'RTR-CORE-01', name: 'RTR-CORE-01', type: 'router', status: 'healthy',
    ip: '10.42.0.1', model: 'Cisco ASR 1001-X', vendor: 'Cisco', firmware: '17.9.4a',
    serial: 'FXS2431Q0K7', mac: '58:AC:78:3B:11:02', location: 'DC / Core Rack 1', vlan: 'Trunk',
    uptime: '214d 6h', cpu: 22, mem: 41, alerts: 0,
    cpuHistory: cpuSeries(22), memHistory: memSeries(41), throughputHistory: thruSeries(620),
    interfaces: [
      iface('Gi0/0/0', 'up', '10G', 'Trunk', '412 Mb/s', '388 Mb/s'),
      iface('Gi0/0/1', 'up', '10G', 'Trunk', '390 Mb/s', '401 Mb/s'),
      iface('Gi0/0/2', 'up', '1G', '999', '2 Mb/s', '1 Mb/s'),
    ],
    configDiff: { added: ['ip route 10.60.0.0 255.255.0.0 10.42.0.9'], removed: ['ip route 10.60.0.0 255.255.0.0 10.42.0.5'], changedBy: 'admin', daysAgo: 2 },
  },
  {
    id: 'RTR-CORE-02', name: 'RTR-CORE-02', type: 'router', status: 'healthy',
    ip: '10.42.0.2', model: 'Cisco ASR 1001-X', vendor: 'Cisco', firmware: '17.9.4a',
    serial: 'FXS2431Q0K8', mac: '58:AC:78:3B:11:03', location: 'DC / Core Rack 1', vlan: 'Trunk',
    uptime: '214d 6h', cpu: 19, mem: 38, alerts: 0,
    cpuHistory: cpuSeries(19), memHistory: memSeries(38), throughputHistory: thruSeries(580),
    interfaces: [
      iface('Gi0/0/0', 'up', '10G', 'Trunk', '401 Mb/s', '377 Mb/s'),
      iface('Gi0/0/1', 'up', '10G', 'Trunk', '355 Mb/s', '360 Mb/s'),
    ],
    configDiff: { added: ['ntp server 10.42.0.53'], removed: [], changedBy: 'admin', daysAgo: 9 },
  },
  {
    id: 'SW-CORE-01', name: 'SW-CORE-01', type: 'core-switch', status: 'healthy',
    ip: '10.42.0.11', model: 'Catalyst 9500-40X', vendor: 'Cisco', firmware: '17.12.1',
    serial: 'FCW2438L0QT', mac: '58:AC:78:4C:02:01', location: 'DC / Core Rack 1', vlan: 'Trunk',
    uptime: '188d 14h', cpu: 31, mem: 52, alerts: 0,
    cpuHistory: cpuSeries(31), memHistory: memSeries(52), throughputHistory: thruSeries(910),
    interfaces: [
      iface('Te1/1/1', 'up', '10G', 'Trunk', '3.1 Gb/s', '2.9 Gb/s'),
      iface('Te1/1/2', 'up', '10G', 'Trunk', '2.8 Gb/s', '3.0 Gb/s'),
      iface('Te1/1/3', 'up', '10G', 'Trunk', '1.2 Gb/s', '1.1 Gb/s'),
    ],
    configDiff: { added: ['spanning-tree vlan 10,20,30 priority 4096'], removed: [], changedBy: 'admin', daysAgo: 14 },
  },
  {
    id: 'SW-CORE-02', name: 'SW-CORE-02', type: 'core-switch', status: 'warning',
    ip: '10.42.0.12', model: 'Catalyst 9500-40X', vendor: 'Cisco', firmware: '17.12.1',
    serial: 'FCW2438L0QU', mac: '58:AC:78:4C:02:02', location: 'DC / Core Rack 2', vlan: 'Trunk',
    uptime: '188d 14h', cpu: 68, mem: 71, alerts: 1,
    cpuHistory: cpuSeries(68), memHistory: memSeries(71), throughputHistory: thruSeries(880),
    interfaces: [
      iface('Te1/1/1', 'up', '10G', 'Trunk', '3.0 Gb/s', '2.7 Gb/s'),
      iface('Te1/1/2', 'up', '10G', 'Trunk', '2.9 Gb/s', '2.8 Gb/s', 214),
    ],
    configDiff: { added: [], removed: ['no spanning-tree portfast'], changedBy: 'jchen', daysAgo: 1 },
  },
  {
    id: 'SW-DIST-01', name: 'SW-DIST-01', type: 'core-switch', status: 'healthy',
    ip: '10.42.1.1', model: 'Catalyst 9300-48P', vendor: 'Cisco', firmware: '17.9.5',
    serial: 'FOC2519X1AB', mac: '58:AC:78:5D:10:01', location: 'Floor 1 / IDF-A', vlan: 'Trunk',
    uptime: '96d 3h', cpu: 24, mem: 44, alerts: 0,
    cpuHistory: cpuSeries(24), memHistory: memSeries(44), throughputHistory: thruSeries(410),
    interfaces: [iface('Gi1/0/1', 'up', '1G', 'Trunk', '210 Mb/s', '198 Mb/s')],
    configDiff: { added: ['vlan 40', ' name Guest-WiFi'], removed: [], changedBy: 'admin', daysAgo: 30 },
  },
  {
    id: 'SW-DIST-03', name: 'SW-DIST-03', type: 'core-switch', status: 'critical',
    ip: '10.42.1.3', model: 'Catalyst 9300-48P', vendor: 'Cisco', firmware: '17.9.5',
    serial: 'FOC2519X1AD', mac: '58:AC:78:5D:10:03', location: 'Floor 2 / IDF-B', vlan: 'Trunk',
    uptime: '96d 3h', cpu: 89, mem: 84, alerts: 2,
    cpuHistory: cpuSeries(89), memHistory: memSeries(84), throughputHistory: thruSeries(390),
    interfaces: [
      iface('Gi1/0/1', 'down', '1G', 'Trunk', '0 Mb/s', '0 Mb/s', 1204),
      iface('Gi1/0/2', 'up', '1G', '40', '88 Mb/s', '76 Mb/s'),
    ],
    configDiff: { added: ['switchport trunk allowed vlan 10,20,30'], removed: ['switchport trunk allowed vlan 10,20,30,40'], changedBy: 'jchen', daysAgo: 2 },
  },
  {
    id: 'SW-ACC-01', name: 'SW-ACC-01', type: 'access-switch', status: 'healthy',
    ip: '10.42.2.1', model: 'Catalyst 9200L-24P', vendor: 'Cisco', firmware: '17.9.5',
    serial: 'FCW2547B0X1', mac: '58:AC:78:6E:20:01', location: 'Floor 1 / IDF-A', vlan: '10',
    uptime: '52d 19h', cpu: 14, mem: 33, alerts: 0,
    cpuHistory: cpuSeries(14), memHistory: memSeries(33), throughputHistory: thruSeries(120),
    interfaces: [iface('Gi0/1', 'up', '1G', '10', '45 Mb/s', '38 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 41 },
  },
  {
    id: 'SW-ACC-04', name: 'SW-ACC-04', type: 'access-switch', status: 'healthy',
    ip: '10.42.2.4', model: 'Catalyst 9200L-24P', vendor: 'Cisco', firmware: '17.9.5',
    serial: 'FCW2547B0X4', mac: '58:AC:78:6E:20:04', location: 'Floor 1 / IDF-A', vlan: '10',
    uptime: '52d 19h', cpu: 11, mem: 29, alerts: 0,
    cpuHistory: cpuSeries(11), memHistory: memSeries(29), throughputHistory: thruSeries(95),
    interfaces: [iface('Gi0/1', 'up', '1G', '10', '22 Mb/s', '19 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 41 },
  },
  {
    id: 'SW-ACC-07', name: 'SW-ACC-07', type: 'access-switch', status: 'warning',
    ip: '10.42.2.7', model: 'Catalyst 9200L-24P', vendor: 'Cisco', firmware: '17.9.5',
    serial: 'FCW2547B0X7', mac: '58:AC:78:6E:20:07', location: 'Floor 2 / IDF-B', vlan: '20',
    uptime: '52d 19h', cpu: 47, mem: 55, alerts: 1,
    cpuHistory: cpuSeries(47), memHistory: memSeries(55), throughputHistory: thruSeries(340),
    interfaces: [
      iface('Gi0/12', 'up', '1G', '20', '312 Mb/s', '298 Mb/s', 18),
      iface('Gi0/13', 'up', '1G', '20', '18 Mb/s', '14 Mb/s'),
    ],
    configDiff: { added: [], removed: [], changedBy: 'system', daysAgo: 0 },
  },
  {
    id: 'SW-ACC-09', name: 'SW-ACC-09', type: 'access-switch', status: 'healthy',
    ip: '10.42.2.9', model: 'Aruba 6100-48G', vendor: 'Aruba', firmware: '10.11.1004',
    serial: 'SG3ZFY9021', mac: '20:4C:03:9A:31:09', location: 'Floor 2 / IDF-B', vlan: '20',
    uptime: '133d 2h', cpu: 9, mem: 27, alerts: 0,
    cpuHistory: cpuSeries(9), memHistory: memSeries(27), throughputHistory: thruSeries(80),
    interfaces: [iface('1/1/1', 'up', '1G', '20', '15 Mb/s', '12 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 60 },
  },
  {
    id: 'SW-ACC-11', name: 'SW-ACC-11', type: 'access-switch', status: 'offline',
    ip: '10.42.2.11', model: 'Aruba 6100-48G', vendor: 'Aruba', firmware: '10.11.1004',
    serial: 'SG3ZFY9023', mac: '20:4C:03:9A:31:11', location: 'Floor 3 / IDF-C', vlan: '30',
    uptime: '—', cpu: 0, mem: 0, alerts: 1,
    cpuHistory: cpuSeries(0).map(() => 0), memHistory: memSeries(0).map(() => 0), throughputHistory: thruSeries(0).map(() => 0),
    interfaces: [iface('1/1/1', 'down', '1G', '30', '0 Mb/s', '0 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'system', daysAgo: 0 },
  },
  {
    id: 'AP-FL1-02', name: 'AP-FL1-02', type: 'ap', status: 'healthy',
    ip: '10.42.3.2', model: 'Aruba AP-535', vendor: 'Aruba', firmware: '8.11.2.1',
    serial: 'CNF9451Q22', mac: '20:4C:03:B1:12:02', location: 'Floor 1 / Ceiling', vlan: '10',
    uptime: '77d 11h', cpu: 8, mem: 21, alerts: 0,
    cpuHistory: cpuSeries(8), memHistory: memSeries(21), throughputHistory: thruSeries(60),
    interfaces: [iface('radio0', 'up', '1.2G', '10', '38 Mb/s', '30 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 70 },
  },
  {
    id: 'AP-FL2-04', name: 'AP-FL2-04', type: 'ap', status: 'warning',
    ip: '10.42.3.4', model: 'Aruba AP-535', vendor: 'Aruba', firmware: '8.11.2.1',
    serial: 'CNF9451Q24', mac: '20:4C:03:B1:12:04', location: 'Floor 2 / Ceiling', vlan: '20',
    uptime: '77d 11h', cpu: 34, mem: 48, alerts: 1,
    cpuHistory: cpuSeries(34), memHistory: memSeries(48), throughputHistory: thruSeries(210),
    interfaces: [iface('radio0', 'up', '1.2G', '20', '188 Mb/s', '166 Mb/s', 6)],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 5 },
  },
  {
    id: 'AP-FL3-01', name: 'AP-FL3-01', type: 'ap', status: 'healthy',
    ip: '10.42.3.6', model: 'Aruba AP-535', vendor: 'Aruba', firmware: '8.11.2.1',
    serial: 'CNF9451Q26', mac: '20:4C:03:B1:12:06', location: 'Floor 3 / Ceiling', vlan: '30',
    uptime: '77d 11h', cpu: 6, mem: 19, alerts: 0,
    cpuHistory: cpuSeries(6), memHistory: memSeries(19), throughputHistory: thruSeries(45),
    interfaces: [iface('radio0', 'up', '1.2G', '30', '22 Mb/s', '17 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 70 },
  },
  {
    id: 'SRV-APP-01', name: 'SRV-APP-01', type: 'server', status: 'healthy',
    ip: '10.42.5.10', model: 'Dell PowerEdge R650', vendor: 'Cisco', firmware: 'BIOS 2.14.2',
    serial: 'DXJ3K92', mac: '3C:EC:EF:44:0A:01', location: 'DC / Rack 4', vlan: '50',
    uptime: '301d 8h', cpu: 41, mem: 62, alerts: 0,
    cpuHistory: cpuSeries(41), memHistory: memSeries(62), throughputHistory: thruSeries(340),
    interfaces: [iface('eth0', 'up', '10G', '50', '412 Mb/s', '390 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 90 },
  },
  {
    id: 'SRV-DB-01', name: 'SRV-DB-01', type: 'server', status: 'healthy',
    ip: '10.42.5.11', model: 'Dell PowerEdge R750', vendor: 'Cisco', firmware: 'BIOS 2.16.0',
    serial: 'DXJ3K93', mac: '3C:EC:EF:44:0A:02', location: 'DC / Rack 4', vlan: '50',
    uptime: '301d 8h', cpu: 55, mem: 74, alerts: 0,
    cpuHistory: cpuSeries(55), memHistory: memSeries(74), throughputHistory: thruSeries(260),
    interfaces: [iface('eth0', 'up', '10G', '50', '210 Mb/s', '198 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 90 },
  },
  {
    id: 'RTR-EDGE-01', name: 'RTR-EDGE-01', type: 'router', status: 'healthy',
    ip: '203.0.113.1', model: 'MikroTik CCR2216', vendor: 'MikroTik', firmware: '7.15.3',
    serial: 'MKT-88231', mac: '4C:5E:0C:11:9A:01', location: 'DC / Core Rack 1', vlan: 'WAN',
    uptime: '412d 2h', cpu: 17, mem: 30, alerts: 0,
    cpuHistory: cpuSeries(17), memHistory: memSeries(30), throughputHistory: thruSeries(720),
    interfaces: [iface('ether1-wan', 'up', '1G', 'WAN', '540 Mb/s', '480 Mb/s')],
    configDiff: { added: ['/ip firewall filter add chain=input action=drop src-address-list=blocked'], removed: [], changedBy: 'admin', daysAgo: 4 },
  },
  {
    id: 'FW-EDGE-01', name: 'FW-EDGE-01', type: 'router', status: 'healthy',
    ip: '10.42.0.254', model: 'Juniper SRX345', vendor: 'Juniper', firmware: '22.4R3',
    serial: 'JN129A0912', mac: '2C:6B:F5:88:41:01', location: 'DC / Core Rack 1', vlan: 'Trunk',
    uptime: '188d 20h', cpu: 26, mem: 47, alerts: 0,
    cpuHistory: cpuSeries(26), memHistory: memSeries(47), throughputHistory: thruSeries(650),
    interfaces: [iface('ge-0/0/0', 'up', '10G', 'Trunk', '480 Mb/s', '455 Mb/s')],
    configDiff: { added: ['set security zones security-zone untrust screen untrust-screen'], removed: [], changedBy: 'admin', daysAgo: 21 },
  },
  {
    id: 'SW-DIST-02', name: 'SW-DIST-02', type: 'core-switch', status: 'healthy',
    ip: '10.42.1.2', model: 'Juniper EX4400-48P', vendor: 'Juniper', firmware: '22.2R3',
    serial: 'JN129A1204', mac: '2C:6B:F5:9C:10:02', location: 'Floor 2 / IDF-B', vlan: 'Trunk',
    uptime: '96d 3h', cpu: 21, mem: 39, alerts: 0,
    cpuHistory: cpuSeries(21), memHistory: memSeries(39), throughputHistory: thruSeries(380),
    interfaces: [iface('ge-0/0/1', 'up', '1G', 'Trunk', '190 Mb/s', '175 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 30 },
  },
  {
    id: 'SW-ACC-14', name: 'SW-ACC-14', type: 'access-switch', status: 'healthy',
    ip: '10.42.2.14', model: 'MikroTik CRS326-24G', vendor: 'MikroTik', firmware: '7.14.2',
    serial: 'MKT-77120', mac: '4C:5E:0C:22:0B:14', location: 'Floor 3 / IDF-C', vlan: '30',
    uptime: '68d 5h', cpu: 12, mem: 24, alerts: 0,
    cpuHistory: cpuSeries(12), memHistory: memSeries(24), throughputHistory: thruSeries(70),
    interfaces: [iface('ether1', 'up', '1G', '30', '18 Mb/s', '14 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 50 },
  },
  {
    id: 'AP-FL1-05', name: 'AP-FL1-05', type: 'ap', status: 'healthy',
    ip: '10.42.3.9', model: 'Cisco C9130AXI', vendor: 'Cisco', firmware: '17.12.1',
    serial: 'FCW2611X0AB', mac: '58:AC:78:D1:0A:05', location: 'Floor 1 / Ceiling', vlan: '10',
    uptime: '40d 1h', cpu: 10, mem: 22, alerts: 0,
    cpuHistory: cpuSeries(10), memHistory: memSeries(22), throughputHistory: thruSeries(90),
    interfaces: [iface('radio0', 'up', '2.4G', '10', '55 Mb/s', '41 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 40 },
  },
  {
    id: 'SW-ACC-18', name: 'SW-ACC-18', type: 'access-switch', status: 'healthy',
    ip: '10.42.2.18', model: 'Catalyst 9200L-24P', vendor: 'Cisco', firmware: '17.9.5',
    serial: 'FCW2547B1X8', mac: '58:AC:78:6E:20:18', location: 'Floor 3 / IDF-C', vlan: '30',
    uptime: '52d 19h', cpu: 13, mem: 31, alerts: 0,
    cpuHistory: cpuSeries(13), memHistory: memSeries(31), throughputHistory: thruSeries(88),
    interfaces: [iface('Gi0/1', 'up', '1G', '30', '20 Mb/s', '17 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 41 },
  },
  {
    id: 'SRV-MON-01', name: 'SRV-MON-01', type: 'server', status: 'healthy',
    ip: '10.42.5.20', model: 'Dell PowerEdge R450', vendor: 'Cisco', firmware: 'BIOS 2.11.4',
    serial: 'DXJ3K99', mac: '3C:EC:EF:44:0A:09', location: 'DC / Rack 4', vlan: '50',
    uptime: '301d 8h', cpu: 33, mem: 51, alerts: 0,
    cpuHistory: cpuSeries(33), memHistory: memSeries(51), throughputHistory: thruSeries(150),
    interfaces: [iface('eth0', 'up', '1G', '50', '90 Mb/s', '76 Mb/s')],
    configDiff: { added: [], removed: [], changedBy: 'admin', daysAgo: 90 },
  },
];

export const deviceCount = devices.length;

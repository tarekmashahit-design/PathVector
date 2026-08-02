import type { DeviceType, DeviceStatus } from './devices';

export interface TopoNode {
  id: string;
  label: string;
  type: DeviceType;
  status: DeviceStatus;
  floor: 1 | 2 | 3 | 0; // 0 = core / shared across all floors
  x: number;
  y: number;
  ip: string;
  model: string;
  cpu: number;
  mem: number;
  uptime: string;
  alerts: number;
  endpointCount?: number;
}

export interface TopoEdge {
  id: string;
  source: string;
  target: string;
  status: 'healthy' | 'degraded' | 'down';
  bandwidth: number; // 1-10, drives link thickness
}

export const topoNodes: TopoNode[] = [
  { id: 'RTR-CORE-01', label: 'RTR-CORE-01', type: 'router', status: 'healthy', floor: 0, x: 420, y: 60, ip: '10.42.0.1', model: 'ASR 1001-X', cpu: 22, mem: 41, uptime: '214d', alerts: 0 },
  { id: 'RTR-CORE-02', label: 'RTR-CORE-02', type: 'router', status: 'healthy', floor: 0, x: 620, y: 60, ip: '10.42.0.2', model: 'ASR 1001-X', cpu: 19, mem: 38, uptime: '214d', alerts: 0 },
  { id: 'SW-CORE-01', label: 'SW-CORE-01', type: 'core-switch', status: 'healthy', floor: 0, x: 420, y: 180, ip: '10.42.0.11', model: 'Catalyst 9500-40X', cpu: 31, mem: 52, uptime: '188d', alerts: 0 },
  { id: 'SW-CORE-02', label: 'SW-CORE-02', type: 'core-switch', status: 'warning', floor: 0, x: 620, y: 180, ip: '10.42.0.12', model: 'Catalyst 9500-40X', cpu: 68, mem: 71, uptime: '188d', alerts: 1 },

  { id: 'SW-DIST-01', label: 'SW-DIST-01', type: 'core-switch', status: 'healthy', floor: 1, x: 190, y: 320, ip: '10.42.1.1', model: 'Catalyst 9300-48P', cpu: 24, mem: 44, uptime: '96d', alerts: 0 },
  { id: 'SW-DIST-02', label: 'SW-DIST-02', type: 'core-switch', status: 'healthy', floor: 2, x: 520, y: 320, ip: '10.42.1.2', model: 'EX4400-48P', cpu: 21, mem: 39, uptime: '96d', alerts: 0 },
  { id: 'SW-DIST-03', label: 'SW-DIST-03', type: 'core-switch', status: 'critical', floor: 2, x: 700, y: 320, ip: '10.42.1.3', model: 'Catalyst 9300-48P', cpu: 89, mem: 84, uptime: '96d', alerts: 2 },

  { id: 'SW-ACC-01', label: 'SW-ACC-01', type: 'access-switch', status: 'healthy', floor: 1, x: 90, y: 460, ip: '10.42.2.1', model: 'Catalyst 9200L-24P', cpu: 14, mem: 33, uptime: '52d', alerts: 0 },
  { id: 'SW-ACC-04', label: 'SW-ACC-04', type: 'access-switch', status: 'healthy', floor: 1, x: 230, y: 460, ip: '10.42.2.4', model: 'Catalyst 9200L-24P', cpu: 11, mem: 29, uptime: '52d', alerts: 0 },
  { id: 'SW-ACC-07', label: 'SW-ACC-07', type: 'access-switch', status: 'warning', floor: 2, x: 470, y: 460, ip: '10.42.2.7', model: 'Catalyst 9200L-24P', cpu: 47, mem: 55, uptime: '52d', alerts: 1 },
  { id: 'SW-ACC-09', label: 'SW-ACC-09', type: 'access-switch', status: 'healthy', floor: 2, x: 610, y: 460, ip: '10.42.2.9', model: 'Aruba 6100-48G', cpu: 9, mem: 27, uptime: '133d', alerts: 0 },
  { id: 'SW-ACC-14', label: 'SW-ACC-14', type: 'access-switch', status: 'healthy', floor: 3, x: 830, y: 460, ip: '10.42.2.14', model: 'CRS326-24G', cpu: 12, mem: 24, uptime: '68d', alerts: 0 },
  { id: 'SW-ACC-18', label: 'SW-ACC-18', type: 'access-switch', status: 'healthy', floor: 3, x: 950, y: 460, ip: '10.42.2.18', model: 'Catalyst 9200L-24P', cpu: 13, mem: 31, uptime: '52d', alerts: 0 },
  { id: 'SW-ACC-11', label: 'SW-ACC-11', type: 'access-switch', status: 'offline', floor: 3, x: 890, y: 340, ip: '10.42.2.11', model: 'Aruba 6100-48G', cpu: 0, mem: 0, uptime: '—', alerts: 1 },

  { id: 'AP-FL1-02', label: 'AP-FL1-02', type: 'ap', status: 'healthy', floor: 1, x: 60, y: 580, ip: '10.42.3.2', model: 'Aruba AP-535', cpu: 8, mem: 21, uptime: '77d', alerts: 0 },
  { id: 'AP-FL1-05', label: 'AP-FL1-05', type: 'ap', status: 'healthy', floor: 1, x: 200, y: 580, ip: '10.42.3.9', model: 'C9130AXI', cpu: 10, mem: 22, uptime: '40d', alerts: 0 },
  { id: 'AP-FL2-04', label: 'AP-FL2-04', type: 'ap', status: 'warning', floor: 2, x: 470, y: 580, ip: '10.42.3.4', model: 'Aruba AP-535', cpu: 34, mem: 48, uptime: '77d', alerts: 1 },
  { id: 'AP-FL3-01', label: 'AP-FL3-01', type: 'ap', status: 'healthy', floor: 3, x: 890, y: 580, ip: '10.42.3.6', model: 'Aruba AP-535', cpu: 6, mem: 19, uptime: '77d', alerts: 0 },

  { id: 'SRV-APP-01', label: 'SRV-APP-01', type: 'server', status: 'healthy', floor: 0, x: 330, y: 200, ip: '10.42.5.10', model: 'PowerEdge R650', cpu: 41, mem: 62, uptime: '301d', alerts: 0 },
  { id: 'SRV-DB-01', label: 'SRV-DB-01', type: 'server', status: 'healthy', floor: 0, x: 720, y: 200, ip: '10.42.5.11', model: 'PowerEdge R750', cpu: 55, mem: 74, uptime: '301d', alerts: 0 },
  { id: 'SRV-MON-01', label: 'SRV-MON-01', type: 'server', status: 'healthy', floor: 0, x: 520, y: 130, ip: '10.42.5.20', model: 'PowerEdge R450', cpu: 33, mem: 51, uptime: '301d', alerts: 0 },

  { id: 'END-FL1', label: 'Floor 1 endpoints', type: 'endpoint', status: 'healthy', floor: 1, x: 145, y: 660, ip: '10.42.10.0/24', model: 'Mixed', cpu: 0, mem: 0, uptime: '—', alerts: 0, endpointCount: 61 },
  { id: 'END-FL2', label: 'Floor 2 endpoints', type: 'endpoint', status: 'healthy', floor: 2, x: 540, y: 660, ip: '10.42.11.0/24', model: 'Mixed', cpu: 0, mem: 0, uptime: '—', alerts: 0, endpointCount: 84 },
  { id: 'END-FL3', label: 'Floor 3 endpoints', type: 'endpoint', status: 'healthy', floor: 3, x: 920, y: 660, ip: '10.42.12.0/24', model: 'Mixed', cpu: 0, mem: 0, uptime: '—', alerts: 0, endpointCount: 47 },
];

export const topoEdges: TopoEdge[] = [
  { id: 'e1', source: 'RTR-CORE-01', target: 'RTR-CORE-02', status: 'healthy', bandwidth: 6 },
  { id: 'e2', source: 'RTR-CORE-01', target: 'SW-CORE-01', status: 'healthy', bandwidth: 9 },
  { id: 'e3', source: 'RTR-CORE-02', target: 'SW-CORE-02', status: 'healthy', bandwidth: 9 },
  { id: 'e4', source: 'SW-CORE-01', target: 'SW-CORE-02', status: 'healthy', bandwidth: 7 },
  { id: 'e5', source: 'SW-CORE-01', target: 'SRV-APP-01', status: 'healthy', bandwidth: 5 },
  { id: 'e6', source: 'SW-CORE-02', target: 'SRV-DB-01', status: 'healthy', bandwidth: 5 },
  { id: 'e7', source: 'SW-CORE-01', target: 'SRV-MON-01', status: 'healthy', bandwidth: 3 },
  { id: 'e8', source: 'SW-CORE-01', target: 'SW-DIST-01', status: 'healthy', bandwidth: 6 },
  { id: 'e9', source: 'SW-CORE-02', target: 'SW-DIST-02', status: 'healthy', bandwidth: 5 },
  { id: 'e10', source: 'SW-CORE-02', target: 'SW-DIST-03', status: 'degraded', bandwidth: 4 },
  { id: 'e11', source: 'SW-DIST-01', target: 'SW-ACC-01', status: 'healthy', bandwidth: 4 },
  { id: 'e12', source: 'SW-DIST-01', target: 'SW-ACC-04', status: 'healthy', bandwidth: 4 },
  { id: 'e13', source: 'SW-DIST-02', target: 'SW-ACC-07', status: 'healthy', bandwidth: 4 },
  { id: 'e14', source: 'SW-DIST-02', target: 'SW-ACC-09', status: 'healthy', bandwidth: 3 },
  { id: 'e15', source: 'SW-DIST-03', target: 'SW-ACC-11', status: 'down', bandwidth: 3 },
  { id: 'e16', source: 'SW-DIST-03', target: 'SW-ACC-14', status: 'healthy', bandwidth: 3 },
  { id: 'e17', source: 'SW-DIST-03', target: 'SW-ACC-18', status: 'healthy', bandwidth: 3 },
  { id: 'e18', source: 'SW-ACC-01', target: 'AP-FL1-02', status: 'healthy', bandwidth: 2 },
  { id: 'e19', source: 'SW-ACC-04', target: 'AP-FL1-05', status: 'healthy', bandwidth: 2 },
  { id: 'e20', source: 'SW-ACC-07', target: 'AP-FL2-04', status: 'degraded', bandwidth: 3 },
  { id: 'e21', source: 'SW-ACC-14', target: 'AP-FL3-01', status: 'healthy', bandwidth: 2 },
  { id: 'e22', source: 'SW-ACC-01', target: 'END-FL1', status: 'healthy', bandwidth: 4 },
  { id: 'e23', source: 'SW-ACC-04', target: 'END-FL1', status: 'healthy', bandwidth: 3 },
  { id: 'e24', source: 'SW-ACC-07', target: 'END-FL2', status: 'healthy', bandwidth: 5 },
  { id: 'e25', source: 'SW-ACC-09', target: 'END-FL2', status: 'healthy', bandwidth: 3 },
  { id: 'e26', source: 'SW-ACC-14', target: 'END-FL3', status: 'healthy', bandwidth: 3 },
  { id: 'e27', source: 'SW-ACC-18', target: 'END-FL3', status: 'healthy', bandwidth: 3 },
];

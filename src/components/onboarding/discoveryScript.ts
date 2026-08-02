import type { DiscoveredDevice } from '../../store/onboardingStore';

interface ScriptEntry extends DiscoveredDevice {
  group: 'router' | 'core' | 'access' | 'ap' | 'server';
}

export const discoveryScript: ScriptEntry[] = [
  { id: 'd1', name: 'RTR-CORE-01', model: 'Cisco ASR 1001-X', type: 'router', ip: '10.42.0.1', via: 'SSH', group: 'router' },
  { id: 'd2', name: 'RTR-CORE-02', model: 'Cisco ASR 1001-X', type: 'router', ip: '10.42.0.2', via: 'SSH', group: 'router' },
  { id: 'd3', name: 'SW-CORE-01', model: 'Catalyst 9500-40X', type: 'core-switch', ip: '10.42.0.11', via: 'SNMP', group: 'core' },
  { id: 'd4', name: 'SW-CORE-02', model: 'Catalyst 9500-40X', type: 'core-switch', ip: '10.42.0.12', via: 'SNMP', group: 'core' },
  { id: 'd5', name: 'SW-DIST-01', model: 'Catalyst 9300-48P', type: 'core-switch', ip: '10.42.1.1', via: 'SNMP', group: 'core' },
  { id: 'd6', name: 'SW-DIST-02', model: 'Juniper EX4400-48P', type: 'core-switch', ip: '10.42.1.2', via: 'CDP', group: 'core' },
  { id: 'd7', name: 'SW-ACC-01', model: 'Catalyst 9200L-24P', type: 'access-switch', ip: '10.42.2.1', via: 'SNMP', group: 'access' },
  { id: 'd8', name: 'SW-ACC-02', model: 'Catalyst 9200L-24P', type: 'access-switch', ip: '10.42.2.2', via: 'SNMP', group: 'access' },
  { id: 'd9', name: 'SW-ACC-03', model: 'Aruba 6100-48G', type: 'access-switch', ip: '10.42.2.3', via: 'SNMP', group: 'access' },
  { id: 'd10', name: 'SW-ACC-04', model: 'Catalyst 9200L-24P', type: 'access-switch', ip: '10.42.2.4', via: 'CDP', group: 'access' },
  { id: 'd11', name: 'SW-ACC-05', model: 'Aruba 6100-48G', type: 'access-switch', ip: '10.42.2.5', via: 'SNMP', group: 'access' },
  { id: 'd12', name: 'SW-ACC-06', model: 'MikroTik CRS326-24G', type: 'access-switch', ip: '10.42.2.6', via: 'ARP', group: 'access' },
  { id: 'd13', name: 'SW-ACC-07', model: 'Catalyst 9200L-24P', type: 'access-switch', ip: '10.42.2.7', via: 'SNMP', group: 'access' },
  { id: 'd14', name: 'SW-ACC-08', model: 'Catalyst 9200L-24P', type: 'access-switch', ip: '10.42.2.8', via: 'SNMP', group: 'access' },
  { id: 'd15', name: 'AP-FL1-01', model: 'Aruba AP-535', type: 'ap', ip: '10.42.3.1', via: 'CDP', group: 'ap' },
  { id: 'd16', name: 'AP-FL1-02', model: 'Aruba AP-535', type: 'ap', ip: '10.42.3.2', via: 'CDP', group: 'ap' },
  { id: 'd17', name: 'AP-FL2-01', model: 'Cisco C9130AXI', type: 'ap', ip: '10.42.3.3', via: 'CDP', group: 'ap' },
  { id: 'd18', name: 'AP-FL2-02', model: 'Aruba AP-535', type: 'ap', ip: '10.42.3.4', via: 'CDP', group: 'ap' },
  { id: 'd19', name: 'AP-FL3-01', model: 'Aruba AP-535', type: 'ap', ip: '10.42.3.5', via: 'CDP', group: 'ap' },
  { id: 'd20', name: 'SRV-APP-01', model: 'Dell PowerEdge R650', type: 'server', ip: '10.42.5.10', via: 'SSH', group: 'server' },
  { id: 'd21', name: 'SRV-DB-01', model: 'Dell PowerEdge R750', type: 'server', ip: '10.42.5.11', via: 'SSH', group: 'server' },
  { id: 'd22', name: 'FW-EDGE-01', model: 'Juniper SRX345', type: 'router', ip: '10.42.0.254', via: 'SSH', group: 'server' },
];

export function logLineFor(d: ScriptEntry): string {
  return `Found ${d.name} (${d.model}) at ${d.ip} via ${d.via}...`;
}

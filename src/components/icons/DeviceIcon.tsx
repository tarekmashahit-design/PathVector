import { Router, Server, Wifi, Network, Boxes, MonitorSmartphone } from 'lucide-react';
import type { DeviceType } from '../../data/devices';

const iconMap: Record<DeviceType, typeof Router> = {
  router: Router,
  'core-switch': Network,
  'access-switch': Boxes,
  ap: Wifi,
  server: Server,
  endpoint: MonitorSmartphone,
};

export function DeviceIcon({ type, size = 16, className }: { type: DeviceType; size?: number; className?: string }) {
  const Icon = iconMap[type];
  return <Icon size={size} strokeWidth={1.75} className={className} />;
}

export const deviceTypeLabel: Record<DeviceType, string> = {
  router: 'Router',
  'core-switch': 'Core Switch',
  'access-switch': 'Access Switch',
  ap: 'Access Point',
  server: 'Server',
  endpoint: 'Endpoint Cluster',
};

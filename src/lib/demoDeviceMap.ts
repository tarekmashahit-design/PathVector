import type { DeviceType } from '../data/devices';
import type { DemoDevice, DemoLink, DemoDeviceType } from '../types/demo';

export function mapDemoType(type: DemoDeviceType, degree: number): DeviceType {
  switch (type) {
    case 'Router':
    case 'Firewall':
      return 'router';
    case 'Switch':
      return degree >= 3 ? 'core-switch' : 'access-switch';
    case 'AP':
      return 'ap';
    case 'Server':
      return 'server';
    case 'PC':
    default:
      return 'endpoint';
  }
}

export function computeDegrees(devices: DemoDevice[], links: DemoLink[]): Record<string, number> {
  const degree: Record<string, number> = {};
  devices.forEach((d) => (degree[d.id] = 0));
  links.forEach((l) => {
    degree[l.source_device] = (degree[l.source_device] ?? 0) + 1;
    degree[l.target_device] = (degree[l.target_device] ?? 0) + 1;
  });
  return degree;
}

/** Normalizes raw file-canvas x/y positions into a 0-100 viewBox, preserving relative layout. */
export function normalizePositions(devices: DemoDevice[]): Record<string, { x: number; y: number }> {
  if (devices.length === 0) return {};
  const xs = devices.map((d) => d.position.x);
  const ys = devices.map((d) => d.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const out: Record<string, { x: number; y: number }> = {};
  devices.forEach((d) => {
    out[d.id] = {
      x: 10 + ((d.position.x - minX) / rangeX) * 80,
      y: 10 + ((d.position.y - minY) / rangeY) * 80,
    };
  });
  return out;
}

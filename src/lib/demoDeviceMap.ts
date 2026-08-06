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

const TYPE_RANK: Record<DemoDeviceType, number> = { Router: 0, Firewall: 0, Switch: 1, Server: 2, AP: 2, PC: 3 };

/**
 * Packet Tracer / GNS3 files often store x/y at clustered or default
 * coordinates, which makes the raw positions useless for a readable graph.
 * This derives layout purely from the real link topology instead: devices
 * are layered by hop-distance from the most-connected device in each
 * connected component (routers/firewalls preferred as roots when tied),
 * then spread evenly within each layer so nothing overlaps.
 */
export interface LayeredLayout {
  positions: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
}

export function layeredPositions(devices: DemoDevice[], links: DemoLink[]): LayeredLayout {
  if (devices.length === 0) return { positions: {}, width: 100, height: 100 };

  const adjacency: Record<string, string[]> = {};
  devices.forEach((d) => (adjacency[d.id] = []));
  links.forEach((l) => {
    if (!adjacency[l.source_device] || !adjacency[l.target_device]) return;
    adjacency[l.source_device].push(l.target_device);
    adjacency[l.target_device].push(l.source_device);
  });

  const degree = computeDegrees(devices, links);
  const deviceById = new Map(devices.map((d) => [d.id, d]));
  const visited = new Set<string>();
  const layerOf: Record<string, number> = {};
  const components: string[][] = [];

  // Group devices into connected components, pick a sensible root per
  // component (router/firewall with highest degree, else highest-degree node),
  // then BFS to assign each node its shortest-hop layer from that root.
  devices.forEach((start) => {
    if (visited.has(start.id)) return;
    const componentIds: string[] = [];
    const stack = [start.id];
    const seen = new Set([start.id]);
    while (stack.length) {
      const id = stack.pop()!;
      componentIds.push(id);
      adjacency[id].forEach((n) => {
        if (!seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      });
    }
    componentIds.forEach((id) => visited.add(id));

    const root = componentIds
      .map((id) => deviceById.get(id)!)
      .sort((a, b) => {
        const rankDiff = TYPE_RANK[a.type] - TYPE_RANK[b.type];
        if (rankDiff !== 0) return rankDiff;
        return (degree[b.id] ?? 0) - (degree[a.id] ?? 0);
      })[0];

    const queue = [root.id];
    layerOf[root.id] = 0;
    const bfsSeen = new Set([root.id]);
    while (queue.length) {
      const id = queue.shift()!;
      adjacency[id].forEach((n) => {
        if (!bfsSeen.has(n)) {
          bfsSeen.add(n);
          layerOf[n] = layerOf[id] + 1;
          queue.push(n);
        }
      });
    }
    components.push(componentIds);
  });

  const layers: Record<number, string[]> = {};
  devices.forEach((d) => {
    const layer = layerOf[d.id] ?? 0;
    (layers[layer] ??= []).push(d.id);
  });
  Object.values(layers).forEach((ids) => ids.sort((a, b) => (degree[b] ?? 0) - (degree[a] ?? 0)));

  const layerKeys = Object.keys(layers)
    .map(Number)
    .sort((a, b) => a - b);
  const maxLayerSize = Math.max(...Object.values(layers).map((ids) => ids.length));

  const width = Math.max(100, maxLayerSize * 14);
  const height = Math.max(100, (layerKeys.length || 1) * 16);
  const marginX = 8;
  const marginY = 10;

  const out: Record<string, { x: number; y: number }> = {};
  layerKeys.forEach((layer, layerIdx) => {
    const ids = layers[layer];
    const y = layerKeys.length > 1 ? marginY + (layerIdx / (layerKeys.length - 1)) * (height - marginY * 2) : height / 2;
    const usableWidth = width - marginX * 2;
    ids.forEach((id, i) => {
      const x = ids.length > 1 ? marginX + (i / (ids.length - 1)) * usableWidth : width / 2;
      out[id] = { x, y };
    });
  });

  return { positions: out, width, height };
}

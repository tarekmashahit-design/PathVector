import type { DeviceType, DeviceStatus } from '../../data/devices';

const statusColor: Record<DeviceStatus, string> = {
  healthy: '#38BDF8',
  warning: '#FBBF24',
  critical: '#F87171',
  offline: '#475569',
};

const SIZE: Record<DeviceType, number> = {
  router: 22,
  'core-switch': 26,
  'access-switch': 20,
  ap: 18,
  server: 20,
  endpoint: 14,
};

export function nodeRadius(type: DeviceType) {
  return SIZE[type];
}

export function NodeShape({ type, status, pulse }: { type: DeviceType; status: DeviceStatus; pulse?: boolean }) {
  const color = statusColor[status];
  const r = SIZE[type];
  const shouldPulse = pulse ?? (status === 'warning' || status === 'critical');

  const ring = (
    <>
      {shouldPulse && (
        <circle r={r + 6} fill="none" stroke={color} strokeWidth={1.5} opacity={0.5}>
          <animate attributeName="r" values={`${r + 4};${r + 11};${r + 4}`} dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.55;0;0.55" dur="2.2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle r={r + 5} fill="none" stroke={color} strokeWidth={2} opacity={0.85} />
    </>
  );

  switch (type) {
    case 'router':
      return (
        <g>
          {ring}
          <rect x={-r * 0.62} y={-r * 0.62} width={r * 1.24} height={r * 1.24} rx={4} fill="#131A2A" stroke={color} strokeWidth={1.5} transform="rotate(45)" />
        </g>
      );
    case 'core-switch':
      return (
        <g>
          {ring}
          <rect x={-r * 0.62} y={-r * 0.62} width={r * 1.24} height={r * 1.24} rx={6} fill="#131A2A" stroke={color} strokeWidth={1.5} />
        </g>
      );
    case 'access-switch':
      return (
        <g>
          {ring}
          <rect x={-r * 0.55} y={-r * 0.55} width={r * 1.1} height={r * 1.1} rx={4} fill="#131A2A" stroke={color} strokeWidth={1.5} />
        </g>
      );
    case 'ap': {
      const s = r * 0.75;
      return (
        <g>
          {ring}
          <polygon points={`0,${-s} ${s * 0.87},${s * 0.5} ${-s * 0.87},${s * 0.5}`} fill="#131A2A" stroke={color} strokeWidth={1.5} />
        </g>
      );
    }
    case 'server': {
      const s = r * 0.65;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return `${s * Math.cos(a)},${s * Math.sin(a)}`;
      }).join(' ');
      return (
        <g>
          {ring}
          <polygon points={pts} fill="#131A2A" stroke={color} strokeWidth={1.5} />
        </g>
      );
    }
    case 'endpoint':
    default:
      return (
        <g>
          {ring}
          <circle r={r * 0.55} fill="#131A2A" stroke={color} strokeWidth={1.5} />
        </g>
      );
  }
}

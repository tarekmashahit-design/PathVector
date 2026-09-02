import type { DeviceType, DeviceStatus } from '../../data/devices';

const statusColor: Record<DeviceStatus, string> = {
  healthy: '#38BDF8',
  warning: '#FBBF24',
  critical: '#F87171',
  offline: '#475569',
};

/**
 * Pictorial device icons styled after the familiar Packet Tracer /
 * networking-course look (monitor for PCs, switch box with traffic
 * arrows, router circle with a routing arrow) rather than PathVector's
 * abstract monoline shapes — used specifically on the Virtualization
 * Demo topology canvas so a parsed network reads instantly, the way it
 * would in the tool it came from.
 */
export function PacketTracerIcon({ type, status, pulse, size = 34 }: { type: DeviceType; status: DeviceStatus; pulse?: boolean; size?: number }) {
  const color = statusColor[status];
  const shouldPulse = pulse ?? (status === 'warning' || status === 'critical');
  const r = size;

  const ring = shouldPulse && (
    <circle r={r * 0.72} fill="none" stroke={color} strokeWidth={1.5} opacity={0.5}>
      <animate attributeName="r" values={`${r * 0.68};${r * 0.95};${r * 0.68}`} dur="2.2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.55;0;0.55" dur="2.2s" repeatCount="indefinite" />
    </circle>
  );

  switch (type) {
    case 'router':
      return (
        <g>
          {ring}
          <circle r={r * 0.62} fill="#131A2A" stroke={color} strokeWidth={2} />
          {/* four-way routing arrow */}
          <g stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none">
            <path d={`M0,${-r * 0.34} V${r * 0.34} M${-r * 0.34},0 H${r * 0.34}`} />
            <path d={`M${-r * 0.1},${-r * 0.24} L0,${-r * 0.36} L${r * 0.1},${-r * 0.24}`} />
            <path d={`M${-r * 0.1},${r * 0.24} L0,${r * 0.36} L${r * 0.1},${r * 0.24}`} />
            <path d={`M${-r * 0.24},${-r * 0.1} L${-r * 0.36},0 L${-r * 0.24},${r * 0.1}`} />
            <path d={`M${r * 0.24},${-r * 0.1} L${r * 0.36},0 L${r * 0.24},${r * 0.1}`} />
          </g>
        </g>
      );

    case 'core-switch':
    case 'access-switch': {
      const w = r * 1.15;
      const h = r * 0.78;
      return (
        <g>
          {ring}
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r * 0.16} fill="#131A2A" stroke={color} strokeWidth={2} />
          {/* switching traffic arrows */}
          <g stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d={`M${-w * 0.3},${-h * 0.16} H${w * 0.22} L${w * 0.1},${-h * 0.32}`} />
            <path d={`M${w * 0.22},${-h * 0.16} L${w * 0.1},0`} />
            <path d={`M${w * 0.3},${h * 0.16} H${-w * 0.22} L${-w * 0.1},${h * 0.32}`} />
            <path d={`M${-w * 0.22},${h * 0.16} L${-w * 0.1},0`} />
          </g>
        </g>
      );
    }

    case 'ap': {
      const w = r * 1.0;
      const h = r * 0.62;
      return (
        <g>
          {ring}
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r * 0.3} fill="#131A2A" stroke={color} strokeWidth={2} />
          {/* wifi arcs */}
          <g stroke={color} strokeWidth={1.8} strokeLinecap="round" fill="none">
            <path d={`M${-r * 0.28},${-r * 0.02} a${r * 0.28},${r * 0.28} 0 0 1 ${r * 0.56},0`} />
            <path d={`M${-r * 0.16},${r * 0.08} a${r * 0.16},${r * 0.16} 0 0 1 ${r * 0.32},0`} />
            <circle cx={0} cy={r * 0.18} r={1.6} fill={color} stroke="none" />
          </g>
        </g>
      );
    }

    case 'server': {
      const w = r * 0.86;
      const h = r * 1.05;
      return (
        <g>
          {ring}
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r * 0.12} fill="#131A2A" stroke={color} strokeWidth={2} />
          <g stroke={color} strokeWidth={1.6} fill="none">
            <line x1={-w * 0.32} y1={-h * 0.26} x2={w * 0.32} y2={-h * 0.26} />
            <line x1={-w * 0.32} y1={0} x2={w * 0.32} y2={0} />
            <line x1={-w * 0.32} y1={h * 0.26} x2={w * 0.32} y2={h * 0.26} />
          </g>
          <circle cx={w * 0.22} cy={-h * 0.26} r={1.4} fill={color} stroke="none" />
          <circle cx={w * 0.22} cy={0} r={1.4} fill={color} stroke="none" />
          <circle cx={w * 0.22} cy={h * 0.26} r={1.4} fill={color} stroke="none" />
        </g>
      );
    }

    case 'endpoint':
    default: {
      // monitor + stand, matching the familiar PC glyph
      const w = r * 1.02;
      const h = r * 0.72;
      return (
        <g>
          {ring}
          <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.74} rx={r * 0.08} fill="#131A2A" stroke={color} strokeWidth={2} />
          <rect x={-w * 0.1} y={h * 0.12} width={w * 0.2} height={h * 0.16} fill="#131A2A" stroke={color} strokeWidth={1.6} />
          <line x1={-w * 0.26} y1={h * 0.36} x2={w * 0.26} y2={h * 0.36} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <rect x={-w * 0.36} y={-h * 0.3} width={w * 0.72} height={h * 0.42} rx={2} fill="none" stroke={color} strokeWidth={1.3} opacity={0.6} />
        </g>
      );
    }
  }
}

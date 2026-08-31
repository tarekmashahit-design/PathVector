import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { bandwidthSeries as seededBandwidthSeries } from '../../data/metrics';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-inset border border-border-subtle bg-surface/95 px-3 py-2 backdrop-blur-xl">
      <p className="font-mono text-[10px] text-text-muted">{label}</p>
      <p className="font-mono text-sm text-blue">{payload[0].value} Mb/s</p>
    </div>
  );
}

export function BandwidthChart({ data }: { data?: { hour: string; mbps: number }[] }) {
  const bandwidthSeries = data ?? seededBandwidthSeries;
  const latest = bandwidthSeries[bandwidthSeries.length - 1];
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-text-bright">Bandwidth Utilization</h3>
          <p className="font-mono text-[11px] text-text-muted">Last 24 hours</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-pulse-dot rounded-full bg-blue" />
          </span>
          <span className="font-mono text-sm text-text-bright">{latest.mbps} Mb/s</span>
        </div>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={bandwidthSeries} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="bw-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.06)" />
            <XAxis
              dataKey="hour"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
              tickLine={false}
              interval={5}
            />
            <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(56,189,248,0.25)' }} />
            <Area
              type="monotone"
              dataKey="mbps"
              stroke="#38BDF8"
              strokeWidth={1.75}
              fill="url(#bw-fill)"
              animationDuration={1200}
              dot={false}
              activeDot={{ r: 4, fill: '#38BDF8', stroke: '#0D1220', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

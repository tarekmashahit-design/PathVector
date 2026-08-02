import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { threatActivity } from '../../data/security';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-inset border border-border-subtle bg-surface/95 px-3 py-2 backdrop-blur-xl">
      <p className="mb-1 font-mono text-[10px] text-text-muted">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono text-[11px]" style={{ color: p.fill }}>
          {p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function ThreatActivityChart() {
  return (
    <div style={{ width: '100%', height: 130 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={threatActivity} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barGap={1}>
          <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 9.5, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} tickLine={false} interval={1} />
          <YAxis tick={{ fill: '#475569', fontSize: 9.5, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={26} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
          <Bar dataKey="info" stackId="a" fill="#38BDF8" radius={[0, 0, 0, 0]} />
          <Bar dataKey="warning" stackId="a" fill="#FBBF24" radius={[0, 0, 0, 0]} />
          <Bar dataKey="critical" stackId="a" fill="#F87171" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

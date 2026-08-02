import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

export function Sparkline({ data, color = '#38BDF8', height = 32 }: { data: number[]; color?: string; height?: number }) {
  const points = data.map((v, i) => ({ i, v }));
  const gradId = `spark-${color.replace('#', '')}`;
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

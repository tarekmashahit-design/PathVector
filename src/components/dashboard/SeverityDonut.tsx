import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { severityBreakdown as seededSeverityBreakdown } from '../../data/metrics';

export function SeverityDonut({ data }: { data?: { name: string; value: number; color: string }[] }) {
  const severityBreakdown = data ?? seededSeverityBreakdown;
  const total = severityBreakdown.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex h-full flex-col">
      <h3 className="font-display text-sm font-semibold text-text-bright">Alert Mix</h3>
      <p className="font-mono text-[11px] text-text-muted">Last 24 hours</p>
      <div className="relative mx-auto my-2" style={{ width: 150, height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={severityBreakdown} dataKey="value" innerRadius={48} outerRadius={68} paddingAngle={3} animationDuration={1000} stroke="none">
              {severityBreakdown.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-semibold text-text-bright">{total}</span>
          <span className="text-[10px] text-text-muted">total</span>
        </div>
      </div>
      <ul className="mt-2 space-y-1.5">
        {severityBreakdown.map((d) => (
          <li key={d.name} className="flex items-center justify-between font-mono text-xs">
            <span className="flex items-center gap-1.5 text-text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="text-text-default">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { useState } from 'react';
import { auditLog } from '../../data/security';
import { relativeTime } from '../../lib/format';
import { Badge } from '../primitives/Badge';

export function AuditLog() {
  const [query, setQuery] = useState('');
  const filtered = auditLog.filter((a) => `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-text-bright">Audit Log</h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter…"
          className="rounded-btn border border-border-subtle bg-surface px-2.5 py-1 font-mono text-[11px] text-text-default outline-none placeholder:text-text-muted focus:border-blue/40"
        />
      </div>
      <div className="overflow-hidden rounded-card border border-border-subtle">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle bg-elevated/50 text-[10.5px] uppercase text-text-faint">
              <th className="px-3 py-2 font-medium">Timestamp</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-border-subtle/60 last:border-0 hover:bg-elevated">
                <td className="px-3 py-2.5 font-mono text-text-muted">{relativeTime(a.timestamp)}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={a.actor === 'system' ? 'blue' : 'slate'}>{a.actor}</Badge>
                </td>
                <td className="px-3 py-2.5 text-text-default">{a.action}</td>
                <td className="px-3 py-2.5 font-mono text-text-default">{a.target}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={a.result === 'success' ? 'green' : 'red'}>{a.result}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

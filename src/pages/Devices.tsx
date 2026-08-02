import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreHorizontal } from 'lucide-react';
import { devices, type DeviceType, type DeviceStatus } from '../data/devices';
import { DeviceIcon, deviceTypeLabel } from '../components/icons/DeviceIcon';
import { StatusBadge, Badge } from '../components/primitives/Badge';
import { SlideOver } from '../components/primitives/SlideOver';
import { DeviceDetailPanel } from '../components/devices/DeviceDetailPanel';
import { cn } from '../lib/cn';

const typeOptions: DeviceType[] = ['router', 'core-switch', 'access-switch', 'ap', 'server', 'endpoint'];
const statusOptions: DeviceStatus[] = ['healthy', 'warning', 'critical', 'offline'];

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-10 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="w-7 font-mono text-[11px] text-text-muted">{value}%</span>
    </div>
  );
}

export function Devices() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DeviceType | null>(null);
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let list = devices.filter((d) => {
      if (typeFilter && d.type !== typeFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (query && !`${d.name} ${d.ip} ${d.model}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return list;
  }, [query, typeFilter, statusFilter, sortAsc]);

  const selectedDevice = selectedId ? devices.find((d) => d.id === selectedId) : undefined;

  return (
    <div className="mx-auto max-w-[1440px] space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-pill border border-border-subtle bg-surface px-3 py-2">
          <Search size={14} className="text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search devices…"
            className="w-56 bg-transparent font-mono text-xs text-text-default outline-none placeholder:text-text-muted"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {typeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={cn(
                'rounded-pill border px-2.5 py-1 text-[11px] transition-colors',
                typeFilter === t ? 'border-blue/40 bg-blue/10 text-blue' : 'border-border-subtle text-text-muted hover:text-text-bright',
              )}
            >
              {deviceTypeLabel[t]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              className={cn(
                'rounded-pill border px-2.5 py-1 text-[11px] capitalize transition-colors',
                statusFilter === s ? 'border-blue/40 bg-blue/10 text-blue' : 'border-border-subtle text-text-muted hover:text-text-bright',
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <span className="ml-auto font-mono text-xs text-text-muted">
          Showing {filtered.length} of {devices.length} devices
        </span>
      </div>

      <div className="overflow-x-auto rounded-card border border-border-subtle">
        <table className="w-full whitespace-nowrap text-left text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border-subtle bg-base text-[10.5px] uppercase text-text-faint">
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="cursor-pointer px-3 py-2.5 font-medium hover:text-text-bright" onClick={() => setSortAsc(!sortAsc)}>
                Device Name
              </th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="px-3 py-2.5 font-medium">IP</th>
              <th className="px-3 py-2.5 font-medium">Model</th>
              <th className="px-3 py-2.5 font-medium">Firmware</th>
              <th className="px-3 py-2.5 font-medium">CPU</th>
              <th className="px-3 py-2.5 font-medium">Mem</th>
              <th className="px-3 py-2.5 font-medium">Uptime</th>
              <th className="px-3 py-2.5 font-medium">Alerts</th>
              <th className="px-3 py-2.5 font-medium">VLAN</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <motion.tr
                key={d.id}
                layout
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  'cursor-pointer border-b border-border-subtle/60 transition-colors last:border-0 hover:border-l-2 hover:border-l-blue hover:bg-elevated',
                  i % 2 === 1 && 'bg-surface/40',
                )}
              >
                <td className="px-3 py-2.5">
                  <StatusBadge status={d.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono font-medium text-blue">{d.name}</td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-text-default">
                    <DeviceIcon type={d.type} size={13} />
                    {deviceTypeLabel[d.type]}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-text-default">{d.ip}</td>
                <td className="px-3 py-2.5 text-text-default">{d.model}</td>
                <td className="px-3 py-2.5 font-mono text-text-muted">{d.firmware}</td>
                <td className="px-3 py-2.5">
                  <MiniBar value={d.cpu} color="#38BDF8" />
                </td>
                <td className="px-3 py-2.5">
                  <MiniBar value={d.mem} color="#22D3EE" />
                </td>
                <td className="px-3 py-2.5 font-mono text-text-muted">{d.uptime}</td>
                <td className="px-3 py-2.5">
                  {d.alerts > 0 ? <Badge tone="amber">{d.alerts}</Badge> : <span className="text-text-faint">—</span>}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone="slate">{d.vlan}</Badge>
                </td>
                <td className="px-3 py-2.5">
                  <button onClick={(e) => e.stopPropagation()} className="rounded-btn p-1 text-text-muted hover:bg-elevated hover:text-text-bright">
                    <MoreHorizontal size={15} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlideOver
        open={!!selectedDevice}
        onClose={() => setSelectedId(null)}
        title={selectedDevice && <span className="font-mono text-sm font-semibold text-text-bright">{selectedDevice.name}</span>}
      >
        {selectedDevice && <DeviceDetailPanel device={selectedDevice} />}
      </SlideOver>
    </div>
  );
}

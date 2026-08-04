import { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import { DeviceIcon } from '../../components/icons/DeviceIcon';
import { Badge, StatusBadge } from '../../components/primitives/Badge';
import { SlideOver } from '../../components/primitives/SlideOver';
import { mapDemoType, computeDegrees } from '../../lib/demoDeviceMap';

export function DemoDevicesPage() {
  const { topology, findings } = useDemoStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const devices = topology?.devices ?? [];
  const links = topology?.links ?? [];
  const degrees = computeDegrees(devices, links);
  const selected = devices.find((d) => d.id === selectedId);
  const selectedFindings = selected ? findings.filter((f) => f.affected_devices.includes(selected.name)) : [];

  const issuesByDevice = findings.reduce<Record<string, number>>((acc, f) => {
    f.affected_devices.forEach((name) => (acc[name] = (acc[name] ?? 0) + 1));
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text-bright">Devices</h2>
        <span className="font-mono text-xs text-text-muted">{devices.length} parsed</span>
      </div>

      <div className="overflow-hidden rounded-card border border-border-subtle">
        <table className="w-full whitespace-nowrap text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle bg-elevated/50 text-[10.5px] uppercase text-text-faint">
              <th className="px-3 py-2.5 font-medium">Device Name</th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="px-3 py-2.5 font-medium">Model</th>
              <th className="px-3 py-2.5 font-medium">Interfaces</th>
              <th className="px-3 py-2.5 font-medium">Findings</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <tr
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`cursor-pointer border-b border-border-subtle/60 transition-colors last:border-0 hover:bg-elevated ${i % 2 === 1 ? 'bg-surface/40' : ''}`}
              >
                <td className="px-3 py-2.5 font-mono font-medium text-blue">{d.name}</td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-text-default">
                    <DeviceIcon type={mapDemoType(d.type, degrees[d.id] ?? 0)} size={13} />
                    {d.type}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-text-default">{d.model || '—'}</td>
                <td className="px-3 py-2.5 font-mono text-text-muted">{d.interfaces.length}</td>
                <td className="px-3 py-2.5">{(issuesByDevice[d.name] ?? 0) > 0 ? <Badge tone="amber">{issuesByDevice[d.name]}</Badge> : <span className="text-text-faint">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlideOver open={!!selected} onClose={() => setSelectedId(null)} title={selected && <span className="font-mono text-sm font-semibold text-text-bright">{selected.name}</span>}>
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-text-faint">Type</p>
                <p className="text-text-default">{selected.type}</p>
              </div>
              <div>
                <p className="text-text-faint">Model</p>
                <p className="text-text-default">{selected.model || '—'}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Interfaces</h3>
              <ul className="space-y-1.5">
                {selected.interfaces.map((iface) => (
                  <li key={iface.name} className="rounded-inset border border-border-subtle bg-surface p-2.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-blue">{iface.name}</span>
                      <StatusBadge status={iface.status} />
                    </div>
                    {iface.config_lines.map((l, i) => (
                      <p key={i} className="mt-1 text-text-muted">
                        {l}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Full Config</h3>
              <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-inset border border-border-subtle bg-void p-3 font-mono text-[11px] leading-relaxed text-text-default">{selected.config}</pre>
            </div>

            {selectedFindings.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Findings on this device</h3>
                <ul className="space-y-1.5">
                  {selectedFindings.map((f) => (
                    <li key={f.rule_id} className="rounded-inset border border-border-subtle bg-surface p-2.5 text-xs">
                      <Badge tone={f.severity === 'critical' || f.severity === 'high' ? 'red' : f.severity === 'info' ? 'blue' : 'amber'}>{f.rule_id}</Badge>
                      <p className="mt-1 text-text-default">{f.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}

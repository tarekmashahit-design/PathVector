import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { RotateCw, ShieldOff, UploadCloud, FileText } from 'lucide-react';
import type { Device } from '../../data/devices';
import { DeviceIcon, deviceTypeLabel } from '../icons/DeviceIcon';
import { StatusBadge, Badge } from '../primitives/Badge';
import { Sparkline } from '../primitives/Sparkline';
import { Modal } from '../primitives/Modal';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/cn';

const quickActions = [
  { label: 'Restart Port', icon: RotateCw },
  { label: 'Isolate', icon: ShieldOff },
  { label: 'Push Config', icon: UploadCloud },
  { label: 'View Logs', icon: FileText },
];

export function DeviceDetailPanel({ device }: { device: Device }) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [selectedPort, setSelectedPort] = useState(device.interfaces[0]?.port);

  const infoRows: [string, string][] = [
    ['Model', device.model],
    ['Serial', device.serial],
    ['MAC', device.mac],
    ['IP', device.ip],
    ['VLAN', device.vlan],
    ['Firmware', device.firmware],
    ['Location', device.location],
    ['Uptime', device.uptime],
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <DeviceIcon type={device.type} size={18} className="text-blue" />
          <h2 className="font-mono text-lg font-semibold text-text-bright">{device.name}</h2>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={device.status} />
          <Badge tone="slate">{deviceTypeLabel[device.type]}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => setConfirmAction(a.label)}
              className="flex flex-col items-center gap-1.5 rounded-btn border border-border-subtle bg-surface px-2 py-2.5 text-text-muted transition-colors hover:border-blue/40 hover:text-text-bright"
            >
              <a.icon size={15} strokeWidth={1.75} />
              <span className="text-center text-[10px] leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-text-muted">Info</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-card border border-border-subtle bg-surface p-3.5">
          {infoRows.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-[10px] text-text-faint">{label}</p>
              <p className="truncate font-mono text-xs text-text-default">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-text-muted">Live Telemetry</h3>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'CPU', data: device.cpuHistory, color: '#38BDF8', suffix: '%' },
            { label: 'Memory', data: device.memHistory, color: '#22D3EE', suffix: '%' },
            { label: 'Throughput', data: device.throughputHistory, color: '#34D399', suffix: 'Mb/s' },
          ].map((m) => (
            <div key={m.label} className="rounded-card border border-border-subtle bg-surface p-2.5">
              <p className="text-[10px] text-text-faint">{m.label}</p>
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-pulse-dot rounded-full" style={{ background: m.color }} />
                </span>
                <span className="font-mono text-xs text-text-bright">
                  {m.data[m.data.length - 1]}
                  {m.suffix}
                </span>
              </div>
              <Sparkline data={m.data} color={m.color} height={28} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-text-muted">Interfaces</h3>
        <div className="overflow-hidden rounded-card border border-border-subtle">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-elevated/50 text-[10px] uppercase text-text-faint">
                <th className="px-2.5 py-2 font-medium">Port</th>
                <th className="px-2.5 py-2 font-medium">Status</th>
                <th className="px-2.5 py-2 font-medium">Speed</th>
                <th className="px-2.5 py-2 font-medium">VLAN</th>
                <th className="px-2.5 py-2 font-medium">In/Out</th>
                <th className="px-2.5 py-2 font-medium">Errors</th>
              </tr>
            </thead>
            <tbody>
              {device.interfaces.map((iface) => (
                <tr
                  key={iface.port}
                  onClick={() => setSelectedPort(iface.port)}
                  className={cn(
                    'cursor-pointer border-b border-border-subtle/60 font-mono transition-colors last:border-0 hover:bg-elevated',
                    selectedPort === iface.port && 'bg-blue/[0.06]',
                  )}
                >
                  <td className="px-2.5 py-2 text-blue">{iface.port}</td>
                  <td className="px-2.5 py-2">
                    <span className={cn('inline-block h-1.5 w-1.5 rounded-full', iface.status === 'up' ? 'bg-green' : 'bg-red')} />
                    <span className="ml-1.5 text-text-default">{iface.status}</span>
                  </td>
                  <td className="px-2.5 py-2 text-text-default">{iface.speed}</td>
                  <td className="px-2.5 py-2 text-text-default">{iface.vlan}</td>
                  <td className="px-2.5 py-2 text-text-default">
                    {iface.inTraffic} / {iface.outTraffic}
                  </td>
                  <td className={cn('px-2.5 py-2', iface.errors > 0 ? 'text-red' : 'text-text-muted')}>{iface.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">Config Diff</h3>
          <p className="font-mono text-[10px] text-text-faint">
            Last change: {device.configDiff.daysAgo === 0 ? 'today' : `${device.configDiff.daysAgo}d ago`} by {device.configDiff.changedBy}
          </p>
        </div>
        <div className="rounded-card border border-border-subtle bg-void p-3 font-mono text-[11.5px] leading-relaxed">
          {device.configDiff.added.length === 0 && device.configDiff.removed.length === 0 ? (
            <p className="text-text-faint">No changes recorded.</p>
          ) : (
            <>
              {device.configDiff.removed.map((l, i) => (
                <p key={`r${i}`} className="text-red">
                  − {l}
                </p>
              ))}
              {device.configDiff.added.map((l, i) => (
                <p key={`a${i}`} className="text-green">
                  + {l}
                </p>
              ))}
            </>
          )}
        </div>
      </div>

      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)} title={confirmAction ?? ''} width={400}>
        <p className="text-sm text-text-default">
          This will {confirmAction?.toLowerCase()} on <span className="font-mono text-blue">{device.name}</span>. This is a visual simulation only.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
            Cancel
          </Button>
          <Button
            variant="solid"
            size="sm"
            onClick={() => {
              toast.success(`${confirmAction} completed on ${device.name}`);
              setConfirmAction(null);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}

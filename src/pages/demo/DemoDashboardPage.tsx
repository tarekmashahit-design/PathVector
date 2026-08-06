import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Waypoints, ChevronRight } from 'lucide-react';
import { Gauge } from '../../components/primitives/Gauge';
import { Card } from '../../components/primitives/Card';
import { Badge } from '../../components/primitives/Badge';
import { DeviceIcon } from '../../components/icons/DeviceIcon';
import { useDemoStore } from '../../store/demoStore';
import { staggerContainer, staggerItem } from '../../components/shell/PageTransition';
import { computeDegrees, mapDemoType } from '../../lib/demoDeviceMap';
import { cn } from '../../lib/cn';
import type { Category, Severity } from '../../types/demo';

const scoreLabel: Record<string, string> = { switching: 'Switching Health', routing: 'Routing Health', security: 'Security Posture', infrastructure: 'Infrastructure Hygiene' };
const severityTone: Record<Severity, 'red' | 'amber' | 'blue' | 'slate'> = { critical: 'red', high: 'red', medium: 'amber', low: 'amber', info: 'blue' };
const severityWeight: Record<Severity, number> = { critical: 40, high: 22, medium: 10, low: 5, info: 2 };
const categoryLabel: Record<Category, string> = { switching: 'Switching', routing: 'Routing', security: 'Security', infrastructure: 'Infrastructure' };
const categoryColor: Record<Category, string> = { switching: '#38BDF8', routing: '#22D3EE', security: '#F87171', infrastructure: '#FBBF24' };

function riskColor(risk: number) {
  if (risk >= 60) return '#F87171';
  if (risk >= 30) return '#FBBF24';
  return '#38BDF8';
}

export function DemoDashboardPage() {
  const { scores, findings, summary, topology } = useDemoStore();

  const devices = topology?.devices ?? [];
  const links = topology?.links ?? [];
  const degrees = useMemo(() => computeDegrees(devices, links), [devices, links]);

  const severityCounts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {});

  const categoryCounts = findings.reduce<Record<Category, number>>(
    (acc, f) => {
      acc[f.category] = (acc[f.category] ?? 0) + 1;
      return acc;
    },
    { switching: 0, routing: 0, security: 0, infrastructure: 0 },
  );
  const maxCategory = Math.max(1, ...Object.values(categoryCounts));

  const typeCounts = devices.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1;
    return acc;
  }, {});

  // Real risk ranking: tally severity-weighted findings per device name, from the actual analysis output.
  const riskByDevice = useMemo(() => {
    const scoreMap: Record<string, number> = {};
    findings.forEach((f) => {
      f.affected_devices.forEach((name) => {
        scoreMap[name] = (scoreMap[name] ?? 0) + severityWeight[f.severity];
      });
    });
    return Object.entries(scoreMap)
      .map(([device, raw]) => ({ device, risk: Math.min(100, raw) }))
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 6);
  }, [findings]);

  const isolatedDevices = devices.filter((d) => (degrees[d.id] ?? 0) === 0);
  const hubDevice = devices.length
    ? devices.reduce((best, d) => ((degrees[d.id] ?? 0) > (degrees[best.id] ?? 0) ? d : best), devices[0])
    : null;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto max-w-[1200px] space-y-5 p-6">
      <div className="flex flex-col gap-5 lg:flex-row">
        <motion.div variants={staggerItem} className="flex flex-shrink-0 items-center justify-center rounded-hero border border-border-subtle bg-surface p-8 shadow-inset-top lg:w-[300px]">
          {scores && <Gauge value={scores.overall} label="Network Health" size={180} />}
        </motion.div>

        <motion.div variants={staggerItem} className="flex-1 space-y-3">
          {scores &&
            (['switching', 'routing', 'security', 'infrastructure'] as const).map((key) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-text-default">{scoreLabel[key]}</span>
                  <span className="font-mono text-text-muted">{scores[key]}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-elevated">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${scores[key]}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full bg-blue" />
                </div>
              </div>
            ))}
        </motion.div>
      </div>

      <motion.div variants={staggerItem}>
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={15} className="text-blue" />
            <h3 className="font-display text-sm font-semibold text-text-bright">AI Executive Summary</h3>
          </div>
          <p className="text-sm leading-relaxed text-text-default">{summary}</p>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(['critical', 'high', 'medium', 'low', 'info'] as const).map((sev) => (
          <div key={sev} className="rounded-card border border-border-subtle bg-surface p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-text-bright">{severityCounts[sev] ?? 0}</p>
            <Badge tone={severityTone[sev]}>{sev}</Badge>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <motion.div variants={staggerItem} className="lg:col-span-3">
          <Card className="h-full">
            <div className="mb-1 flex items-center gap-2">
              <Waypoints size={15} className="text-blue" />
              <h3 className="font-display text-sm font-semibold text-text-bright">Topology Composition</h3>
            </div>
            <p className="mb-4 font-mono text-[11px] text-text-muted">
              {devices.length} devices · {links.length} links parsed from {topology ? '1 uploaded file' : '—'}
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(typeCounts).map(([type, count]) => (
                <span key={type} className="flex items-center gap-1.5 rounded-pill border border-border-subtle bg-elevated px-2.5 py-1 text-xs text-text-default">
                  <DeviceIcon type={mapDemoType(type as never, 0)} size={12} />
                  {type}
                  <span className="font-mono text-text-muted">{count}</span>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-3 text-xs">
              <div>
                <p className="text-text-faint">Most connected device</p>
                <p className="font-mono text-text-bright">{hubDevice ? `${hubDevice.name} (${degrees[hubDevice.id] ?? 0} links)` : '—'}</p>
              </div>
              <div>
                <p className="text-text-faint">Isolated devices</p>
                <p className="font-mono text-text-bright">
                  {isolatedDevices.length === 0 ? 'None' : isolatedDevices.map((d) => d.name).join(', ')}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card className="h-full">
            <h3 className="font-display text-sm font-semibold text-text-bright">Findings by Category</h3>
            <p className="mb-4 font-mono text-[11px] text-text-muted">From the {findings.length} rule violations detected</p>
            <div className="space-y-3">
              {(Object.keys(categoryCounts) as Category[]).map((cat) => (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-text-default">{categoryLabel[cat]}</span>
                    <span className="font-mono text-text-muted">{categoryCounts[cat]}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(categoryCounts[cat] / maxCategory) * 100}%` }}
                      transition={{ duration: 0.7 }}
                      className="h-full rounded-full"
                      style={{ background: categoryColor[cat] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {riskByDevice.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <h3 className="font-display text-sm font-semibold text-text-bright">Devices Needing Attention</h3>
            <p className="mb-3 font-mono text-[11px] text-text-muted">Ranked by severity-weighted finding count for this network</p>
            <ul className="space-y-1">
              {riskByDevice.map((d, i) => (
                <li key={d.device} className="group flex items-center gap-3 rounded-inset px-1.5 py-2 transition-colors hover:bg-elevated">
                  <span className="w-4 flex-shrink-0 font-mono text-xs text-text-faint">{i + 1}</span>
                  <span className="w-32 flex-shrink-0 truncate font-mono text-xs text-text-bright">{d.device}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.risk}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: riskColor(d.risk) }}
                    />
                  </div>
                  <span className="w-7 flex-shrink-0 text-right font-mono text-xs text-text-muted">{d.risk}</span>
                  <ChevronRight size={13} className={cn('flex-shrink-0 text-text-faint transition-transform group-hover:translate-x-0.5')} />
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

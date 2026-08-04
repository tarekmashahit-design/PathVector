import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { useDemoStore } from '../../store/demoStore';
import { Badge } from '../../components/primitives/Badge';
import type { DemoFinding } from '../../types/demo';
import { cn } from '../../lib/cn';

const severityTone: Record<string, 'red' | 'amber' | 'blue'> = { critical: 'red', high: 'red', medium: 'amber', low: 'amber', info: 'blue' };
const severityBar: Record<string, string> = { critical: 'bg-red', high: 'bg-red', medium: 'bg-amber', low: 'bg-amber', info: 'bg-blue' };

function FindingRow({ finding }: { finding: DemoFinding }) {
  const [open, setOpen] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <div className="rounded-card border border-border-subtle bg-surface">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className={cn('h-8 w-1 flex-shrink-0 rounded-full', severityBar[finding.severity])} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-text-faint">{finding.rule_id}</span>
            <p className="truncate text-sm font-medium text-text-bright">{finding.title}</p>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-text-muted">{finding.affected_devices.join(', ')}</p>
        </div>
        {finding.confidence !== null && <Badge tone="blue">{finding.confidence}%</Badge>}
        <Badge tone={severityTone[finding.severity]}>{finding.severity}</Badge>
        <ChevronDown size={15} className={cn('flex-shrink-0 text-text-muted transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-4 border-t border-border-subtle px-4 py-4">
              {finding.ai_diagnosis && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-text-muted">AI Diagnosis</p>
                  <p className="text-sm leading-relaxed text-text-default">{finding.ai_diagnosis}</p>
                </div>
              )}
              <div>
                <p className="mb-1.5 text-xs font-medium text-text-muted">Evidence</p>
                <ul className="space-y-1 rounded-inset bg-void/60 p-3 font-mono text-[11.5px] leading-relaxed text-text-default">
                  {finding.evidence.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </div>

              {Object.keys(finding.fix_commands).length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-xs font-medium text-text-muted">Fix Commands</p>
                    <button onClick={() => setShowDiff(!showDiff)} className="text-[11px] text-blue hover:underline">
                      {showDiff ? 'Hide' : 'View'} Config Diff
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(finding.fix_commands).map(([device, cmds]) =>
                      cmds.length ? (
                        <div key={device} className="relative rounded-inset border border-border-subtle bg-void p-3">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="font-mono text-[11px] text-blue">{device}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(cmds.join('\n'));
                                setCopied(device);
                                setTimeout(() => setCopied(null), 1200);
                              }}
                              className="text-text-muted hover:text-text-bright"
                            >
                              {copied === device ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                            </button>
                          </div>
                          {showDiff ? (
                            <div className="font-mono text-[11.5px] leading-relaxed">
                              {finding.evidence
                                .filter((e) => e.startsWith(device))
                                .map((e, i) => (
                                  <p key={`r${i}`} className="text-red">
                                    − {e.replace(`${device}:`, '').replace(`${device}`, '').trim()}
                                  </p>
                                ))}
                              {cmds.map((c, i) => (
                                <p key={`a${i}`} className="text-green">
                                  + {c}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-cyan">{cmds.join('\n')}</pre>
                          )}
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DemoFindingsPage() {
  const { findings } = useDemoStore();
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const sorted = [...findings].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return (
    <div className="mx-auto max-w-[1000px] space-y-3 p-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text-bright">Findings</h2>
        <span className="font-mono text-xs text-text-muted">{findings.length} total</span>
      </div>
      {sorted.map((f) => (
        <FindingRow key={f.rule_id} finding={f} />
      ))}
    </div>
  );
}

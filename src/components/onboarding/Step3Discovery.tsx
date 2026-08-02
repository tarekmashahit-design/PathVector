import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Upload, Keyboard, Download, Info } from 'lucide-react';
import { useOnboardingStore, type DiscoveryMethod } from '../../store/onboardingStore';
import { WizardShell } from './WizardShell';
import { StepHeader } from './shared';
import { cn } from '../../lib/cn';

function toggleMethod(methods: DiscoveryMethod[], m: DiscoveryMethod): DiscoveryMethod[] {
  return methods.includes(m) ? methods.filter((x) => x !== m) : [...methods, m];
}

export function Step3Discovery() {
  const s = useOnboardingStore();
  const has = (m: DiscoveryMethod) => s.discoveryMethods.includes(m);

  const canContinue =
    (has('auto') && s.ipRanges.trim().length > 0) ||
    (has('import') && !!s.uploadedFileName) ||
    (has('manual') && s.discoveryMethods.length > 0 && !has('auto') && !has('import'));

  function downloadTemplate() {
    const csv = 'IP,Hostname,Type,Location,SNMP Community\n10.42.0.1,RTR-CORE-01,Router,DC Rack 1,PathVector\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pathvector-device-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <WizardShell canContinue={canContinue}>
      <StepHeader title="How should PathVector find your devices?" subtitle="Choose one or more discovery methods." />

      <div className="space-y-3">
        {/* Automatic */}
        <div className={cn('rounded-card border p-4 transition-colors', has('auto') ? 'border-blue/50 bg-blue/[0.05]' : 'border-border-subtle bg-surface')}>
          <button onClick={() => s.setField('discoveryMethods', toggleMethod(s.discoveryMethods, 'auto'))} className="flex w-full items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <Radar size={17} className="text-blue" />
              <span className="font-display text-sm font-semibold text-text-bright">Automatic Discovery</span>
            </div>
            <span className="rounded-pill border border-blue/25 bg-blue/10 px-2 py-0.5 text-[10px] font-medium text-blue">Recommended</span>
          </button>
          <AnimatePresence initial={false}>
            {has('auto') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 space-y-2">
                  <textarea
                    value={s.ipRanges}
                    onChange={(e) => s.setField('ipRanges', e.target.value)}
                    placeholder={'192.168.1.0/24\n10.0.0.0/16'}
                    rows={3}
                    className="w-full rounded-btn border border-border-subtle bg-void/60 px-3 py-2 font-mono text-xs text-text-bright outline-none focus:border-blue/40"
                  />
                  <p className="font-mono text-[10.5px] text-text-faint">Accepted formats: CIDR (10.0.0.0/16), range (10.0.0.1-10.0.0.50), single IP</p>
                  <div className="flex items-start gap-1.5 text-[11px] text-text-muted">
                    <Info size={12} className="mt-0.5 flex-shrink-0 text-blue" />
                    PathVector will scan these ranges using SNMP, CDP/LLDP, and ARP to find routers, switches, access points, firewalls, and servers.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Import */}
        <div className={cn('rounded-card border p-4 transition-colors', has('import') ? 'border-blue/50 bg-blue/[0.05]' : 'border-border-subtle bg-surface')}>
          <button onClick={() => s.setField('discoveryMethods', toggleMethod(s.discoveryMethods, 'import'))} className="flex w-full items-center gap-2.5 text-left">
            <Upload size={17} className="text-blue" />
            <span className="font-display text-sm font-semibold text-text-bright">Import Inventory</span>
          </button>
          <AnimatePresence initial={false}>
            {has('import') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 space-y-2">
                  <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-btn border border-dashed border-border bg-void/40 px-4 py-6 text-center transition-colors hover:border-blue/40">
                    <Upload size={18} className="text-text-muted" />
                    <span className="text-xs text-text-muted">Drag &amp; drop, or click to browse</span>
                    <span className="font-mono text-[10px] text-text-faint">CSV, XLSX, JSON</span>
                    <input type="file" accept=".csv,.xlsx,.json" className="hidden" onChange={(e) => s.setField('uploadedFileName', e.target.files?.[0]?.name ?? null)} />
                  </label>
                  {s.uploadedFileName && <p className="font-mono text-[11px] text-green">✓ {s.uploadedFileName}</p>}
                  <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-[11px] text-blue hover:underline">
                    <Download size={11} /> Download Template
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Manual */}
        <div className={cn('rounded-card border p-4 transition-colors', has('manual') ? 'border-blue/50 bg-blue/[0.05]' : 'border-border-subtle bg-surface')}>
          <button onClick={() => s.setField('discoveryMethods', toggleMethod(s.discoveryMethods, 'manual'))} className="flex w-full items-center gap-2.5 text-left">
            <Keyboard size={17} className="text-blue" />
            <span className="font-display text-sm font-semibold text-text-bright">Manual Entry</span>
          </button>
          <AnimatePresence initial={false}>
            {has('manual') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <p className="mt-3 text-xs text-text-muted">You'll add devices one by one after setup. Best for very small networks.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </WizardShell>
  );
}

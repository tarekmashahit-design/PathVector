import { motion } from 'framer-motion';
import { Waypoints, Sparkles, Zap, ShieldCheck, TrendingDown, Layers } from 'lucide-react';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';

const features = [
  { icon: Sparkles, title: 'AI Root-Cause Diagnosis', desc: 'Vemo explains faults in plain language with evidence, not just alerts.', hero: true },
  { icon: Waypoints, title: 'Live Digital Twin', desc: 'A continuously updated model of every device, link, and dependency.' },
  { icon: Zap, title: 'One-Click Remediation', desc: 'Apply a vetted fix the moment root cause is confirmed.' },
  { icon: ShieldCheck, title: 'Continuous Hardening', desc: 'Nightly scans surface open ports and weak credentials automatically.' },
  { icon: TrendingDown, title: 'Failure Prediction', desc: 'Forecast hardware and capacity issues days before they happen.' },
  { icon: Layers, title: 'Vendor-Agnostic Coverage', desc: 'Cisco, Juniper, Aruba, MikroTik, and more under one pane of glass.' },
];

function DiagnosisPreview() {
  return (
    <div className="mt-5 rounded-card border border-border-subtle bg-void/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-muted">Vemo diagnosis</p>
        <Badge tone="blue">94% confidence</Badge>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-text-default">
        Trunk encapsulation mismatch between <code className="font-mono text-blue">SW-CORE-01</code> and{' '}
        <code className="font-mono text-blue">SW-DIST-03</code> is isolating VLAN 40 traffic.
      </p>
      <Button size="sm" variant="solid" className="mt-3.5">
        Apply fix
      </Button>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-28 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-14 max-w-xl"
      >
        <h2 className="font-display text-3xl font-semibold text-text-bright sm:text-4xl">Built for the people who own the network.</h2>
        <p className="mt-3 text-text-muted">Six capabilities, one continuously running platform.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className={`group rounded-card border border-border-subtle bg-surface p-6 shadow-inset-top transition-all duration-200 hover:border-border hover:shadow-glow-blue-sm ${
              f.hero ? 'md:col-span-2 md:row-span-2' : ''
            }`}
          >
            <f.icon size={20} strokeWidth={1.75} className="text-blue transition-transform duration-200 group-hover:scale-110" />
            <h3 className="mt-4 font-display text-lg font-semibold text-text-bright">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{f.desc}</p>
            {f.hero && <DiagnosisPreview />}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

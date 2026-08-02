import { motion } from 'framer-motion';
import { Cable, BrainCircuit, ShieldCheck } from 'lucide-react';

const steps = [
  { n: '01', title: 'Connect', desc: 'Point PathVector at your management network via SNMP, SSH, or NetFlow. No agents to install.', icon: Cable },
  { n: '02', title: 'Understand', desc: 'A live digital twin forms in minutes. Vemo starts learning your network’s normal.', icon: BrainCircuit },
  { n: '03', title: 'Protect', desc: 'Anomalies are explained, prioritized, and — with your approval — fixed automatically.', icon: ShieldCheck },
];

export function HowItWorks() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28 md:px-10">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-16 font-display text-3xl font-semibold text-text-bright sm:text-4xl"
      >
        How it works
      </motion.h2>

      <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="relative"
          >
            <span className="font-mono text-5xl font-bold text-text-faint/30">{s.n}</span>
            <div className="mt-4 flex items-center gap-2.5">
              <s.icon size={18} strokeWidth={1.75} className="text-blue" />
              <h3 className="font-display text-lg font-semibold text-text-bright">{s.title}</h3>
            </div>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-muted">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

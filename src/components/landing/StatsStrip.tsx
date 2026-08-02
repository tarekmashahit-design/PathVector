import { motion } from 'framer-motion';
import { TickingNumber } from '../primitives/TickingNumber';

const stats = [
  { value: 5, prefix: '‹', suffix: 's', label: 'detection' },
  { value: 100, prefix: '0–', suffix: '', label: 'health score' },
  { value: 6, prefix: '', suffix: '+', label: 'vendors' },
  { value: 24, prefix: '', suffix: '/7', label: 'autonomous' },
];

export function StatsStrip() {
  return (
    <section className="border-y border-border-subtle bg-surface/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-16 md:grid-cols-4 md:divide-x md:divide-border-subtle md:px-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="text-center md:px-4"
          >
            <TickingNumber value={s.value} prefix={s.prefix} suffix={s.suffix} className="text-4xl font-bold text-text-bright" />
            <p className="mt-1.5 text-xs uppercase tracking-wide text-text-muted">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

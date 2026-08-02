import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AmbientNetworkCanvas } from '../topology/AmbientNetworkCanvas';
import { Button } from '../primitives/Button';

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden py-32 text-center">
      <AmbientNetworkCanvas className="absolute inset-0 h-full w-full opacity-30" density={16} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base via-base/70 to-base" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-2xl px-6"
      >
        <h2 className="font-display text-3xl font-semibold text-text-bright sm:text-4xl">
          Stop watching dashboards.
          <br />
          Start trusting your network.
        </h2>
        <Link to="/login" className="mt-8 inline-block">
          <Button sheen>Start free trial</Button>
        </Link>
      </motion.div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { AmbientNetworkCanvas } from '../topology/AmbientNetworkCanvas';
import { Button } from '../primitives/Button';

const headlineLines = ['Awareness intelligence', 'that travels at your network speed.'];

function AnimatedHeadline() {
  let wordIndex = 0;
  return (
    <h1 className="font-display text-[42px] font-bold leading-[1.08] tracking-tight text-text-bright sm:text-[54px] lg:text-[64px]">
      {headlineLines.map((line, li) => (
        <div key={li} className="overflow-hidden">
          {line.split(' ').map((word, wi) => {
            wordIndex += 1;
            return (
              <motion.span
                key={wi}
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.15 + wordIndex * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="mr-[0.28em] inline-block"
              >
                {word}
              </motion.span>
            );
          })}
        </div>
      ))}
    </h1>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden app-canvas-texture">
      <AmbientNetworkCanvas className="absolute inset-0 h-full w-full" density={30} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/20 via-void/40 to-base" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_35%_50%,transparent_0%,rgba(10,14,23,0.55)_65%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-20 md:px-10">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-pill border border-border-subtle bg-surface/60 px-3 py-1.5 backdrop-blur-md"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-pulse-dot rounded-full bg-green" />
            </span>
            <span className="font-mono text-[11px] text-text-muted">Live network intelligence</span>
          </motion.div>

          <AnimatedHeadline />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-6 max-w-lg text-base leading-relaxed text-text-muted"
          >
            PathVector builds a live digital twin of your network, explains problems in plain language, and fixes them before your users notice.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/login">
              <Button sheen>Start free trial</Button>
            </Link>
            <a href="#features" className="group flex items-center gap-1.5 rounded-btn border border-transparent px-4 py-2 text-sm text-text-default transition-colors hover:text-text-bright">
              Watch it work
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-8 flex items-center gap-4 font-mono text-xs text-text-faint"
          >
            <span className="flex items-center gap-1.5">
              <Check size={12} className="text-green" /> No hardware
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={12} className="text-green" /> No agents
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={12} className="text-green" /> Connects in minutes
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

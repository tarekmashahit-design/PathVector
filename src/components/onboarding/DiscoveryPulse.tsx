import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeviceIcon } from '../icons/DeviceIcon';
import { discoveryScript, logLineFor } from './discoveryScript';
import type { DeviceType } from '../../data/devices';

interface Placed {
  id: string;
  name: string;
  model: string;
  type: DeviceType;
  x: number;
  y: number;
}

const groupRadius: Record<string, number> = { router: 70, core: 115, access: 165, ap: 200, server: 140 };

function positionFor(group: string, seed: number) {
  const angle = (seed * 47.3) % 360;
  const rad = (angle * Math.PI) / 180;
  const r = groupRadius[group] + ((seed * 13) % 20);
  return { x: 50 + (Math.cos(rad) * r) / 4, y: 50 + (Math.sin(rad) * r) / 4 };
}

export function DiscoveryPulse({ onComplete }: { onComplete: (count: number) => void }) {
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [log, setLog] = useState<string[]>(['Scanning 10.42.0.0/16...']);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    discoveryScript.forEach((d, i) => {
      timers.push(
        setTimeout(() => {
          const pos = positionFor(d.group, i + 1);
          setPlaced((prev) => (prev.some((p) => p.id === d.id) ? prev : [...prev, { id: d.id, name: d.name, model: d.model, type: d.type, x: pos.x, y: pos.y }]));
          setLog((prev) => [...prev, logLineFor(d)]);
        }, 350 * (i + 1)),
      );
    });
    const totalTime = 350 * (discoveryScript.length + 1) + 600;
    timers.push(
      setTimeout(() => {
        setLog((prev) => [...prev, 'Discovery scan complete.']);
        setDone(true);
        onComplete(discoveryScript.length);
      }, totalTime),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-text-bright">{done ? 'Discovery complete.' : 'Discovering your network…'}</h3>
        <span className="font-mono text-sm text-blue">Found: {placed.length}</span>
      </div>

      <div className="relative mt-4 h-[320px] overflow-hidden rounded-card border border-border-subtle bg-void/60">
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue" />
        {!done &&
          [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 rounded-full border border-blue/40"
              initial={{ width: 8, height: 8, opacity: 0.8, x: '-50%', y: '-50%' }}
              animate={{ width: 420, height: 420, opacity: 0 }}
              transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }}
              style={{ x: '-50%', y: '-50%' }}
            />
          ))}

        <AnimatePresence>
          {placed.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-btn border border-blue/40 bg-surface text-blue shadow-glow-blue-sm">
                <DeviceIcon type={p.type} size={13} />
              </div>
              <span className="whitespace-nowrap rounded-pill bg-void/80 px-1.5 py-0.5 font-mono text-[8.5px] text-text-muted">{p.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div ref={logRef} className="mt-3 h-24 overflow-y-auto rounded-inset border border-border-subtle bg-void/80 p-2.5 font-mono text-[10.5px] leading-relaxed text-text-muted">
        {log.map((l, i) => (
          <p key={i} className={l.includes('complete') ? 'text-green' : undefined}>
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

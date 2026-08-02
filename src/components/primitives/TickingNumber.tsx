import { useEffect, useRef, useState } from 'react';
import { useSpring, useInView } from 'framer-motion';
import { cn } from '../../lib/cn';

interface TickingNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}

/** Animates a numeric value with a departure-board tick rather than a text swap. */
export function TickingNumber({ value, decimals = 0, suffix = '', prefix = '', className, duration = 1.1 }: TickingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0.18 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, value, spring]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => {
      setDisplay(v.toFixed(decimals));
    });
    return unsub;
  }, [spring, decimals]);

  return (
    <span ref={ref} className={cn('font-mono tabular-nums', className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

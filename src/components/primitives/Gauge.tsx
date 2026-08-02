import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

function colorForValue(v: number) {
  if (v >= 80) return '#34D399';
  if (v >= 55) return '#FBBF24';
  return '#F87171';
}

export function Gauge({ value, size = 220, strokeWidth = 14, label, sublabel }: GaugeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const arcFraction = 0.75; // 270deg arc
  const arcLength = circumference * arcFraction;
  const color = colorForValue(value);
  const offset = mounted ? arcLength - (value / 100) * arcLength : arcLength;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[225deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.1)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl font-bold text-text-bright tabular-nums">{value}</span>
        {label && <span className="mt-1 text-sm text-text-muted">{label}</span>}
        {sublabel && <span className="mt-2 text-xs font-mono text-green">{sublabel}</span>}
      </div>
    </div>
  );
}

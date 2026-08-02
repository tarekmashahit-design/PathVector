import { type ReactNode } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '../../lib/cn';
import { TickingNumber } from './TickingNumber';
import { Sparkline } from './Sparkline';

const trendToneClass = {
  good: 'text-green',
  bad: 'text-red',
  neutral: 'text-text-muted',
} as const;

const trendIcon = { up: ArrowUp, down: ArrowDown, flat: Minus } as const;

export function StatTile({
  label,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  spark,
  sparkColor = '#38BDF8',
  emphasize,
  icon,
  trend,
  trendDirection = 'flat',
  trendTone,
  caption,
}: {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  spark?: number[];
  sparkColor?: string;
  emphasize?: 'amber' | 'red' | null;
  icon?: ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'flat';
  trendTone?: 'good' | 'bad' | 'neutral';
  caption?: string;
}) {
  const TrendIcon = trendIcon[trendDirection];
  const tone = trendTone ?? (trendDirection === 'up' ? 'good' : trendDirection === 'down' ? 'bad' : 'neutral');
  return (
    <div
      className={cn(
        'flex min-w-[150px] flex-col gap-2 rounded-card border border-border-subtle bg-surface p-4 shadow-inset-top transition-colors hover:border-border',
        emphasize === 'amber' && 'border-amber/25 shadow-[0_0_20px_-6px_rgba(251,191,36,0.35)]',
        emphasize === 'red' && 'border-red/25 shadow-[0_0_20px_-6px_rgba(248,113,113,0.35)]',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{label}</span>
        {icon}
      </div>
      <TickingNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} className="text-2xl font-semibold text-text-bright" />
      {spark && <Sparkline data={spark} color={sparkColor} height={24} />}
      {(trend || caption) && (
        <div className="mt-auto flex flex-col gap-0.5 border-t border-border-subtle pt-2">
          {trend && (
            <span className={cn('flex items-center gap-1 truncate font-mono text-[10.5px]', trendToneClass[tone])}>
              <TrendIcon size={10} strokeWidth={2.5} className="flex-shrink-0" />
              <span className="truncate">{trend}</span>
            </span>
          )}
          {caption && <span className="truncate font-mono text-[10.5px] text-text-faint">{caption}</span>}
        </div>
      )}
    </div>
  );
}

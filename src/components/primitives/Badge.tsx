import { cn } from '../../lib/cn';

export type BadgeTone = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'cyan';

const toneStyles: Record<BadgeTone, string> = {
  blue: 'bg-blue/10 text-blue border-blue/25',
  green: 'bg-green/10 text-green border-green/25',
  amber: 'bg-amber/10 text-amber border-amber/25',
  red: 'bg-red/10 text-red border-red/25',
  slate: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  cyan: 'bg-cyan/10 text-cyan border-cyan/25',
};

export function Badge({
  tone = 'slate',
  children,
  className,
  mono = true,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-xs font-medium',
        mono && 'font-mono',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, BadgeTone> = {
  healthy: 'green',
  warning: 'amber',
  critical: 'red',
  offline: 'slate',
  active: 'green',
  paused: 'slate',
  up: 'green',
  down: 'red',
  success: 'green',
  failed: 'red',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusTone[status] ?? 'slate'}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          statusTone[status] === 'green' && 'bg-green',
          statusTone[status] === 'amber' && 'bg-amber animate-pulse-dot',
          statusTone[status] === 'red' && 'bg-red animate-pulse-dot',
          statusTone[status] === 'slate' && 'bg-text-muted',
        )}
      />
      {status}
    </Badge>
  );
}

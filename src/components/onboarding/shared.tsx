import { type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '../../lib/cn';

export function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <h2 className="font-display text-2xl font-semibold text-text-bright">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-inset border border-border-subtle bg-void/40 px-3 py-2.5 text-xs text-text-muted">
      <Info size={13} className="mt-0.5 flex-shrink-0 text-blue" />
      <span>{children}</span>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs text-text-muted">{children}</label>;
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-btn border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-bright outline-none transition-colors focus:border-blue/40 focus:shadow-glow-blue-sm',
        props.className,
      )}
    />
  );
}

export function Select({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-btn border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-bright outline-none transition-colors focus:border-blue/40',
        className,
      )}
    >
      {children}
    </select>
  );
}

export function SelectableCard({
  selected,
  onClick,
  icon,
  title,
  description,
  badge,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  description: string;
  badge?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-2 rounded-card border p-4 text-left transition-all duration-150',
        selected ? 'border-blue/50 bg-blue/[0.06] shadow-glow-blue-sm' : 'border-border-subtle bg-surface hover:border-border',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue">{icon}</div>
        {badge && <span className="rounded-pill border border-blue/25 bg-blue/10 px-2 py-0.5 text-[10px] font-medium text-blue">{badge}</span>}
      </div>
      <p className="font-display text-sm font-semibold text-text-bright">{title}</p>
      <p className="text-xs leading-relaxed text-text-muted">{description}</p>
    </button>
  );
}

export function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={cn('relative h-5 w-9 flex-shrink-0 rounded-pill transition-colors', checked ? 'bg-blue' : 'bg-elevated')} aria-label={label}>
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
        style={{ left: checked ? 18 : 2 }}
      />
    </button>
  );
}

import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-pill border border-border-subtle bg-surface/80 p-1 backdrop-blur-md', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative rounded-pill px-3 py-1.5 text-xs font-medium font-mono transition-colors',
            value === opt.value ? 'text-void' : 'text-text-muted hover:text-text-bright',
          )}
        >
          {value === opt.value && (
            <motion.span
              layoutId="segmented-pill"
              className="absolute inset-0 rounded-pill bg-blue"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

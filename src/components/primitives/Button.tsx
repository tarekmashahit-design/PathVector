import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  sheen?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'solid', size = 'md', sheen = false, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-btn font-medium transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40',
        size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
        variant === 'solid' &&
          'bg-blue text-void hover:-translate-y-px hover:bg-blue-deep hover:shadow-glow-blue',
        variant === 'ghost' &&
          'border border-border-subtle text-text-default hover:-translate-y-px hover:border-blue/40 hover:text-text-bright',
        variant === 'outline' &&
          'border border-border text-text-bright hover:-translate-y-px hover:border-blue/50',
        variant === 'danger' &&
          'border border-red/30 bg-red/10 text-red hover:-translate-y-px hover:bg-red/15',
        className,
      )}
      {...props}
    >
      {children}
      {sheen && variant === 'solid' && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-btn">
          <span className="absolute inset-y-0 left-0 w-1/3 -skew-x-[20deg] bg-white/25 animate-sheen" />
        </span>
      )}
    </button>
  ),
);
Button.displayName = 'Button';

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  padded?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = true, padded = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative rounded-card border border-border-subtle bg-surface shadow-inset-top transition-colors duration-200',
        glow && 'hover:border-border hover:shadow-glow-blue-sm',
        padded && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = 'Card';

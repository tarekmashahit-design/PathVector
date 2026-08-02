import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FloatingInput({ label, className, id, ...props }: FloatingInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(props.value ?? props.defaultValue));
  const floated = focused || hasValue;

  return (
    <div className="relative">
      <input
        id={inputId}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          setHasValue(e.target.value.length > 0);
          props.onChange?.(e);
        }}
        placeholder=" "
        className={cn(
          'peer w-full rounded-btn border border-border-subtle bg-surface px-3.5 pb-2 pt-5 text-sm text-text-bright outline-none transition-all duration-150',
          focused && 'border-blue/50 shadow-glow-blue-sm',
          className,
        )}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'pointer-events-none absolute left-3.5 top-3.5 text-sm text-text-muted transition-all duration-150',
          floated && 'top-2 text-[10.5px]',
          focused && 'text-blue',
        )}
      >
        {label}
      </label>
    </div>
  );
}

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'info' | 'success' | 'danger';

const styles: Record<Variant, string> = {
  info: 'bg-accent/10 text-foreground border-accent/40',
  success: 'bg-success/10 text-success border-success/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
};

type BannerProps = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
};

export function Banner({
  variant = 'info',
  className,
  role,
  ...props
}: BannerProps) {
  return (
    <div
      role={role ?? (variant === 'danger' ? 'alert' : 'status')}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
      className={cn(
        'rounded-md border px-4 py-3 text-sm',
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

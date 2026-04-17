import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-surface',
        'shadow-[0_1px_3px_rgba(11,37,69,0.04),0_8px_24px_rgba(11,37,69,0.08)]',
        'transition-all duration-300',
        className,
      )}
      {...props}
    />
  );
}

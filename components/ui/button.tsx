import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'gradient' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'icon';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold cursor-pointer ' +
  'transition-all duration-300 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-background ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-8 py-4 text-base',
  icon: 'h-11 w-11 p-0',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary',
  gradient:
    'text-primary-foreground shadow-lg hover:shadow-xl ' +
    'bg-[image:var(--gradient-primary)] hover:-translate-y-0.5 ' +
    'focus-visible:ring-primary',
  secondary:
    'bg-surface text-foreground border border-border hover:bg-surface-alt focus-visible:ring-foreground',
  ghost:
    'bg-transparent text-foreground hover:bg-surface-alt focus-visible:ring-foreground',
  danger:
    'bg-danger text-white hover:brightness-110 focus-visible:ring-danger',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}

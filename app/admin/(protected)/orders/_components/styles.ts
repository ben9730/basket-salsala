// Button does not support asChild, so links reuse the button classes (same as the products page).
const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold cursor-pointer ' +
  'transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background h-11 px-5 text-[15px] ';

export const linkPrimary =
  base + 'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary';
export const linkSecondary =
  base + 'bg-surface text-foreground border border-border hover:bg-surface-alt focus-visible:ring-foreground';
export const linkGhost =
  base + 'bg-transparent text-foreground hover:bg-surface-alt focus-visible:ring-foreground';

export const selectClass =
  'h-11 rounded-md border border-border bg-surface px-3 text-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary';

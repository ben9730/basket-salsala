'use client';

import { useBasket } from './basket-provider';

export function BasketButton() {
  const { itemCount, openDrawer, hydrated } = useBasket();

  if (!hydrated || itemCount === 0) return null;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="פתח/י את הסל"
      className="fixed bottom-4 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-surface shadow-[0_10px_30px_rgba(31,27,23,0.18)] transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <BasketIcon />
      <span
        aria-hidden="true"
        className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1 text-xs font-medium text-surface"
      >
        {itemCount}
      </span>
    </button>
  );
}

function BasketIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7h18l-2 12a2 2 0 0 1-2 1.8H7a2 2 0 0 1-2-1.8L3 7z" />
      <path d="M8 7V5a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

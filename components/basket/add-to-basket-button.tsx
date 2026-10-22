'use client';

import { useBasket } from './basket-provider';

type Props = {
  productId: string;
  name: string;
  price: number;
  disabled?: boolean;
};

export function AddToBasketButton({ productId, name, price, disabled }: Props) {
  const { state, addItem, openDrawer, hydrated } = useBasket();
  const existing = state.items.find((i) => i.id === productId);

  const label = existing ? `בסל · ${existing.quantity}` : 'הוסף לסל';

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled || !hydrated}
        onClick={() => {
          addItem({ id: productId, name, price });
          openDrawer();
        }}
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-surface cursor-pointer transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}

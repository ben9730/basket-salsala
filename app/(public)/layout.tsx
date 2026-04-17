import type { ReactNode } from 'react';
import { BasketProvider } from '@/components/basket/basket-provider';
import { BasketButton } from '@/components/basket/basket-button';
import { BasketDrawer } from '@/components/basket/basket-drawer';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <BasketProvider>
      {children}
      <BasketButton />
      <BasketDrawer />
    </BasketProvider>
  );
}

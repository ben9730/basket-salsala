'use client';

import { Button } from '@/components/ui/button';
import { toggleAvailable, moveUp, moveDown } from '../actions';
import { ConfirmDelete } from './confirm-delete';

export function RowActions({
  product,
  isFirst,
  isLast,
}: {
  product: { id: string; is_available: boolean };
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={toggleAvailable}>
        <input type="hidden" name="id" value={product.id} />
        <input type="hidden" name="next" value={product.is_available ? 'false' : 'true'} />
        <Button type="submit" variant="ghost" size="md">
          {product.is_available ? 'סמן כלא זמין' : 'סמן כזמין'}
        </Button>
      </form>
      <form action={moveUp}>
        <input type="hidden" name="id" value={product.id} />
        <Button type="submit" variant="ghost" size="md" disabled={isFirst} aria-label="הזז למעלה">
          ↑
        </Button>
      </form>
      <form action={moveDown}>
        <input type="hidden" name="id" value={product.id} />
        <Button type="submit" variant="ghost" size="md" disabled={isLast} aria-label="הזז למטה">
          ↓
        </Button>
      </form>
      <ConfirmDelete id={product.id} />
    </div>
  );
}

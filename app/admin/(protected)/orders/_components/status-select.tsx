'use client';

import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from '@/lib/orders/schema';
import { setOrderStatus } from '../actions';
import { selectClass } from './styles';

// Submits as soon as a status is picked.
export function StatusSelect({ id, status }: { id: string; status: OrderStatus }) {
  return (
    <form action={setOrderStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        aria-label="סטטוס הזמנה"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={selectClass}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}

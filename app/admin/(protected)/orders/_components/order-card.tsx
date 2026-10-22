import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { itemsText, orderTotal } from '@/lib/orders/day-sheet';
import type { OrderRow } from '@/lib/orders/queries';
import { setOrderPaid } from '../actions';
import { StatusSelect } from './status-select';
import { linkSecondary } from './styles';

// One order as a card (mobile-first; fine on desktop too).
export function OrderCard({ order, showDate }: { order: OrderRow; showDate?: boolean }) {
  const cancelled = order.status === 'cancelled';
  return (
    <li
      data-testid="order-card"
      className={`rounded-2xl border border-border bg-surface p-4 print:break-inside-avoid ${
        cancelled ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-bold">
          #{order.order_number} · {order.customer_name}
        </p>
        <p className="font-bold">₪{orderTotal(order).toFixed(2)}</p>
      </div>
      <a
        href={`tel:${order.phone}`}
        dir="ltr"
        className="inline-flex min-h-11 items-center text-sm text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {order.phone}
      </a>
      {showDate && <p className="text-sm text-muted">איסוף: {order.due_date}</p>}
      <p className="mt-1 text-sm">{itemsText(order)}</p>
      {order.note && <p className="mt-1 text-sm text-muted">הערה: {order.note}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
        <StatusSelect id={order.id} status={order.status} />
        <form action={setOrderPaid}>
          <input type="hidden" name="id" value={order.id} />
          <input type="hidden" name="next" value={String(!order.is_paid)} />
          <Button type="submit" variant={order.is_paid ? 'primary' : 'secondary'} aria-pressed={order.is_paid}>
            {order.is_paid ? 'שולם' : 'לא שולם'}
          </Button>
        </form>
        <Link href={`/admin/orders/${order.id}/edit`} className={linkSecondary}>
          עריכה
        </Link>
      </div>
      <p className="mt-2 hidden text-sm print:block">{order.is_paid ? 'שולם' : 'לא שולם'}</p>
    </li>
  );
}

import Link from 'next/link';
import { listOrders } from '@/lib/orders/queries';
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from '@/lib/orders/schema';
import { OrderCard } from '../_components/order-card';
import { linkSecondary } from '../_components/styles';

type SearchParams = Promise<{ status?: string; placed?: string }>;

const chip = (active: boolean) =>
  `inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground'
  }`;

export default async function AllOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const placedToday = sp.placed === 'today';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
  const orders = await listOrders({ status, placedOn: placedToday ? today : undefined });

  const href = (s?: string, placed = placedToday) => {
    const q = new URLSearchParams();
    if (s) q.set('status', s);
    if (placed) q.set('placed', 'today');
    const qs = q.toString();
    return `/admin/orders/all${qs ? `?${qs}` : ''}`;
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium">כל ההזמנות</h1>
        <Link href="/admin/orders" className={linkSecondary}>
          גיליון יום
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <Link href={href(undefined)} className={chip(!status)}>
          הכול
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={href(s)} className={chip(status === s)}>
            {STATUS_LABELS[s]}
          </Link>
        ))}
        <Link href={href(status, !placedToday)} className={chip(placedToday)} aria-pressed={placedToday}>
          הוזמנו היום
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted">אין הזמנות.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} showDate />
          ))}
        </ul>
      )}
    </section>
  );
}

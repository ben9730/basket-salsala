import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listProducts } from '@/lib/products/queries';
import { listOrdersDue } from '@/lib/orders/queries';
import { formatBakeDay } from '@/lib/orders/bake-days';
import {
  adjacentBakeDay,
  bakeList,
  daySheetTotals,
  defaultDaySheetDate,
} from '@/lib/orders/day-sheet';
import { OrderCard } from './_components/order-card';
import { PrintButton } from './_components/print-button';
import { linkPrimary, linkSecondary } from './_components/styles';

type SearchParams = Promise<{ date?: string }>;

const money = (n: number) => `₪${n.toFixed(2)}`;

export default async function DaySheetPage({ searchParams }: { searchParams: SearchParams }) {
  const { date: raw } = await searchParams;
  // Round-trip check rejects impossible dates like 2026-13-45, not just the wrong shape.
  const valid = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && new Date(`${raw}T00:00:00Z`).toISOString().startsWith(raw);
  const date = valid ? raw : defaultDaySheetDate(new Date());
  const [orders, products] = await Promise.all([listOrdersDue(date), listProducts()]);

  // Cancelled orders sink to the bottom.
  const sorted = [...orders].sort(
    (a, b) => Number(a.status === 'cancelled') - Number(b.status === 'cancelled'),
  );
  const bake = bakeList(orders, products);
  const totals = daySheetTotals(orders);
  const prev = adjacentBakeDay(date, -1);
  const next = adjacentBakeDay(date, 1);

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-3">
        <h1 className="font-display text-2xl font-medium">
          הזמנות · {formatBakeDay(date)}.{date.slice(0, 4)}
        </h1>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Link href={`/admin/orders?date=${prev}`} className={linkSecondary} aria-label="יום אפייה קודם">
            ← {formatBakeDay(prev)}
          </Link>
          <Link href={`/admin/orders?date=${next}`} className={linkSecondary} aria-label="יום אפייה הבא">
            {formatBakeDay(next)} →
          </Link>
          <form method="get" className="flex items-center gap-2">
            <Input name="date" type="date" defaultValue={date} aria-label="תאריך" className="w-auto" />
            <Button type="submit" variant="secondary">
              הצג
            </Button>
          </form>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <PrintButton />
          <Link href="/admin/orders/all" className={linkSecondary}>
            כל ההזמנות
          </Link>
          <Link href="/admin/orders/new" className={linkPrimary}>
            הזמנה חדשה
          </Link>
        </div>
      </header>

      <Card className="mb-6 p-4" data-testid="bake-list">
        <h2 className="mb-2 text-lg font-bold">רשימת אפייה</h2>
        {bake.length === 0 ? (
          <p className="text-sm text-muted">אין מה לאפות ליום הזה.</p>
        ) : (
          <ul className="divide-y divide-border">
            {bake.map((b) => (
              <li key={b.productId ?? b.name} className="flex justify-between py-2">
                <span>{b.name}</span>
                <span className="font-bold">×{b.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <h2 className="mb-2 text-lg font-bold">לקוחות</h2>
      {sorted.length === 0 ? (
        <p className="mb-6 text-sm text-muted">אין הזמנות ליום הזה.</p>
      ) : (
        <ul className="mb-6 grid gap-3 md:grid-cols-2">
          {sorted.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      )}

      <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4" data-testid="totals">
        <Stat label="הזמנות" value={String(totals.count)} />
        <Stat label="סה״כ" value={money(totals.grand)} />
        <Stat label="שולם" value={money(totals.paid)} />
        <Stat label="לא שולם" value={money(totals.unpaid)} />
      </Card>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

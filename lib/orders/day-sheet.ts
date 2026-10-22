// Pure Day sheet maths (no server-only, so tests and client code can import it).
import { BAKE_WEEKDAYS } from './bake-days';
import type { OrderRow } from './queries';

type SheetOrder = Pick<OrderRow, 'status' | 'is_paid' | 'order_lines'>;

export type BakeListEntry = { productId: string | null; name: string; quantity: number };

const live = <T extends SheetOrder>(orders: T[]) => orders.filter((o) => o.status !== 'cancelled');

export function orderTotal(o: Pick<OrderRow, 'order_lines'>): number {
  return o.order_lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
}

export function itemsText(o: Pick<OrderRow, 'order_lines'>): string {
  return o.order_lines.map((l) => `${l.product_name} ×${l.quantity}`).join(', ');
}

// Sorted by the product's display_order; products that were deleted (or have no id) go last.
export function bakeList(
  orders: SheetOrder[],
  products: { id: string; display_order: number }[],
): BakeListEntry[] {
  const rank = new Map(products.map((p) => [p.id, p.display_order]));
  const byKey = new Map<string, BakeListEntry>();
  for (const o of live(orders)) {
    for (const l of o.order_lines) {
      const key = l.product_id ?? `name:${l.product_name}`;
      const cur = byKey.get(key);
      if (cur) cur.quantity += l.quantity;
      else byKey.set(key, { productId: l.product_id, name: l.product_name, quantity: l.quantity });
    }
  }
  const order = (e: BakeListEntry) => (e.productId ? rank.get(e.productId) : undefined);
  return [...byKey.values()].sort((a, b) => {
    const ra = order(a);
    const rb = order(b);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return 0; // deleted products keep first-seen order
  });
}

export function daySheetTotals(orders: SheetOrder[]) {
  let grand = 0;
  let paid = 0;
  const kept = live(orders);
  for (const o of kept) {
    const t = orderTotal(o);
    grand += t;
    if (o.is_paid) paid += t;
  }
  return { count: kept.length, grand, paid, unpaid: grand - paid };
}

const israelDate = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(d);

const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Today if today is a bake day, otherwise the next bake day — even past its cutoff, the owner still needs that sheet.
export function defaultDaySheetDate(now: Date): string {
  const today = israelDate(now);
  if (BAKE_WEEKDAYS.includes(weekday(today))) return today;
  return adjacentBakeDay(today, 1);
}

// Previous (-1) or next (+1) bake day, from any date.
export function adjacentBakeDay(date: string, dir: 1 | -1): string {
  let d = date;
  for (let i = 0; i < 14; i++) {
    d = shift(d, dir);
    if (BAKE_WEEKDAYS.includes(weekday(d))) return d;
  }
  return d;
}

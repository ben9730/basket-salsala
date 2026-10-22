import 'server-only';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from './schema';

export type OrderLineRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
};

export type OrderRow = {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  due_date: string;
  note: string | null;
  status: OrderStatus;
  is_paid: boolean;
  source: 'web' | 'manual';
  created_at: string;
  order_lines: OrderLineRow[];
};

const SELECT = '*, order_lines(*)';

export async function listOrdersDue(date: string): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(SELECT)
    .eq('due_date', date)
    .order('order_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

// placedOn: 'YYYY-MM-DD' in Israel time (callers compute it, e.g. from israel today).
export async function listOrders(
  opts: { status?: OrderStatus; placedOn?: string } = {},
): Promise<OrderRow[]> {
  const supabase = await createClient();
  let q = supabase.from('orders').select(SELECT);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.placedOn) {
    // Israel offset is +02:00/+03:00; widen to UTC +-1 day then filter exactly below.
    const start = new Date(`${opts.placedOn}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 1);
    const end = new Date(`${opts.placedOn}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 2);
    q = q.gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
  }
  // shortcut: no pagination, add when orders > 200 per view
  const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  let rows = (data ?? []) as OrderRow[];
  if (opts.placedOn) {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' });
    rows = rows.filter((r) => fmt.format(new Date(r.created_at)) === opts.placedOn);
  }
  return rows;
}

export async function getOrder(id: string): Promise<OrderRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  return data as OrderRow;
}

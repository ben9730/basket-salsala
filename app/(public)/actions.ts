'use server';

import { createClient } from '@/lib/supabase/server';
import { isOrderable } from '@/lib/orders/bake-days';
import { placeOrderSchema } from '@/lib/orders/schema';
import type { BasketItem } from '@/components/basket/types';

export type PlaceOrderResult =
  | { ok: true; orderNumber: number; total: number; items: BasketItem[] }
  | { ok: false; error: string };

// shortcut: bake-day/cutoff is enforced here only, not in place_order(); move into SQL once the owner confirms her days.
// shortcut: no rate limit/captcha, add if junk orders appear.
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  try {
    const parsed = placeOrderSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'פרטי ההזמנה לא תקינים' };
    }
    const { name, phone, dueDate, note, items } = parsed.data;
    if (!isOrderable(dueDate, new Date())) {
      return { ok: false, error: 'יום האיסוף שנבחר כבר לא זמין, בחר/י יום אחר' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('place_order', {
      p_name: name,
      p_phone: phone,
      p_due_date: dueDate,
      p_note: note ?? null,
      p_lines: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
    });
    if (error) {
      const unavailable = /product unavailable/.test(error.message);
      const fridayOnly = /friday only/.test(error.message);
      return {
        ok: false,
        error: unavailable
          ? 'חלק מהמוצרים כבר לא זמינים, רענן/י את העמוד'
          : fridayOnly
            ? 'בסל יש מוצרים של שישי בלבד – בחר/י יום שישי'
            : 'שמירת ההזמנה נכשלה, נסו שוב',
      };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { ok: false, error: 'שמירת ההזמנה נכשלה, נסו שוב' };
    const lines = (row.lines ?? []) as {
      product_id: string;
      product_name: string;
      unit_price: number | string;
      quantity: number;
    }[];
    return {
      ok: true,
      orderNumber: Number(row.order_number),
      total: Number(row.total),
      items: lines.map((l) => ({
        id: l.product_id,
        name: l.product_name,
        price: Number(l.unit_price),
        quantity: l.quantity,
      })),
    };
  } catch {
    return { ok: false, error: 'שמירת ההזמנה נכשלה, נסו שוב' };
  }
}

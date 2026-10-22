'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { adminOrderSchema, ORDER_STATUSES, type OrderStatus } from '@/lib/orders/schema';
import type { ActionResult } from '@/lib/products/schema';

// Same check as ../actions.ts (not exported there: exports from a 'use server' file become endpoints).
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  return supabase;
}

function revalidateOrders() {
  revalidatePath('/admin/orders', 'layout');
}

export async function setOrderStatus(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as OrderStatus;
  if (!id || !ORDER_STATUSES.includes(status)) return;
  await supabase.from('orders').update({ status }).eq('id', id);
  revalidateOrders();
}

export async function setOrderPaid(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await supabase.from('orders').update({ is_paid: formData.get('next') === 'true' }).eq('id', id);
  revalidateOrders();
}

export async function deleteOrder(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/orders');
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw new Error(`שגיאת מחיקה: ${error.message}`);
  revalidateOrders();
  redirect('/admin/orders');
}

// Create (empty `id`) or update an order, then go to the Day sheet of its due date.
export async function saveOrder(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');

  let lines: unknown = [];
  try {
    lines = JSON.parse(String(formData.get('lines') ?? '[]'));
  } catch {
    return { ok: false, message: 'רשימת מוצרים לא חוקית' };
  }

  const parsed = adminOrderSchema.safeParse({
    name: formData.get('name') ?? '',
    phone: formData.get('phone') ?? '',
    dueDate: formData.get('dueDate') ?? '',
    note: formData.get('note') ?? undefined,
    status: formData.get('status'),
    isPaid: formData.get('isPaid') === 'on',
    lines,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const o = parsed.data;
  const { error } = await supabase.rpc('admin_save_order', {
    p_id: id || null,
    p_order: {
      customer_name: o.name,
      phone: o.phone,
      due_date: o.dueDate,
      note: o.note ?? null,
      status: o.status,
      is_paid: o.isPaid,
    },
    p_lines: o.lines.map((l) => ({
      product_id: l.productId,
      product_name: l.productName,
      unit_price: l.unitPrice,
      quantity: l.quantity,
    })),
  });
  if (error) return { ok: false, message: `שגיאת שמירה: ${error.message}` };

  revalidateOrders();
  redirect(`/admin/orders?date=${o.dueDate}`);
}

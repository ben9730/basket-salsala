'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseProductForm, type ActionResult } from '@/lib/products/schema';
import { nextDisplayOrder } from '@/lib/products/queries';

export async function createProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, message: 'מזהה מוצר חסר' };

  const parsed = parseProductForm(formData, id);
  if (!parsed.ok) return parsed;

  const displayOrder = await nextDisplayOrder();
  const { error } = await supabase.from('products').insert({
    id,
    name: parsed.data!.name,
    price: parsed.data!.price,
    description: parsed.data!.description ?? null,
    image_urls: parsed.data!.image_urls,
    is_available: parsed.data!.is_available,
    display_order: displayOrder,
  });

  if (error) return { ok: false, message: `שגיאת שמירה: ${error.message}` };

  revalidatePath('/admin');
  redirect('/admin');
}

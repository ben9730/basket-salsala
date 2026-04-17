'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseProductForm, type ActionResult } from '@/lib/products/schema';
import { deleteImages } from '@/lib/products/storage';

export async function updateProduct(
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

  const { data: existing, error: readErr } = await supabase
    .from('products')
    .select('image_urls')
    .eq('id', id)
    .maybeSingle();
  if (readErr || !existing) return { ok: false, message: 'המוצר לא נמצא' };

  const oldUrls = (existing.image_urls ?? []) as string[];
  const newUrls = parsed.data!.image_urls;
  const orphans = oldUrls.filter((u) => !newUrls.includes(u));

  const { error: updErr } = await supabase
    .from('products')
    .update({
      name: parsed.data!.name,
      price: parsed.data!.price,
      description: parsed.data!.description ?? null,
      image_urls: newUrls,
      is_available: parsed.data!.is_available,
    })
    .eq('id', id);

  if (updErr) return { ok: false, message: `שגיאת עדכון: ${updErr.message}` };

  if (orphans.length > 0) await deleteImages(supabase, orphans);

  revalidatePath('/admin');
  redirect('/admin');
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin');

  const { data: existing } = await supabase
    .from('products')
    .select('image_urls')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(`שגיאת מחיקה: ${error.message}`);

  if (existing?.image_urls?.length) {
    await deleteImages(supabase, existing.image_urls);
  }

  revalidatePath('/admin');
  redirect('/admin');
}

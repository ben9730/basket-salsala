'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  return supabase;
}

export async function toggleAvailable(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const next = formData.get('next') === 'true';
  if (!id) return;
  await supabase.from('products').update({ is_available: next }).eq('id', id);
  revalidatePath('/admin');
}

export async function moveUp(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { data: cur } = await supabase
    .from('products')
    .select('id, display_order')
    .eq('id', id)
    .maybeSingle();
  if (!cur) return;
  const { data: prev } = await supabase
    .from('products')
    .select('id, display_order')
    .lt('display_order', cur.display_order)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prev) return;
  await supabase.rpc('swap_display_order', { a: cur.id, b: prev.id });
  revalidatePath('/admin');
}

export async function moveDown(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { data: cur } = await supabase
    .from('products')
    .select('id, display_order')
    .eq('id', id)
    .maybeSingle();
  if (!cur) return;
  const { data: nxt } = await supabase
    .from('products')
    .select('id, display_order')
    .gt('display_order', cur.display_order)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!nxt) return;
  await supabase.rpc('swap_display_order', { a: cur.id, b: nxt.id });
  revalidatePath('/admin');
}

import 'server-only';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_urls: string[];
  is_available: boolean;
  display_order: number;
  created_at: string;
};

export async function listProducts(): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, description, image_urls, is_available, display_order, created_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductRow[];
}

export async function getProduct(id: string): Promise<ProductRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, description, image_urls, is_available, display_order, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();
  return data as ProductRow;
}

export async function listAvailableProducts(): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, description, image_urls, is_available, display_order, created_at')
    .eq('is_available', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductRow[];
}

export async function nextDisplayOrder(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.display_order ?? -1) + 1;
}

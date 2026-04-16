-- Basket Salsala / Shlomi & Bat-Chen Orders — initial schema
-- Run once in Supabase SQL editor, or via `supabase db push` after linking.

create extension if not exists pgcrypto;

--
-- products
--
create table public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  price          numeric(10, 2) not null check (price >= 0),
  description    text,
  image_url      text,
  is_available   boolean not null default true,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

create index products_display_order_idx
  on public.products (display_order, created_at);

alter table public.products enable row level security;

-- Public shop: any visitor can read every product row.
-- The app filters `is_available = true` for customer-facing views.
create policy "products_select_public"
  on public.products for select
  to anon, authenticated
  using (true);

-- Only signed-in admins can write.
create policy "products_insert_auth"
  on public.products for insert
  to authenticated
  with check (true);

create policy "products_update_auth"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

create policy "products_delete_auth"
  on public.products for delete
  to authenticated
  using (true);

--
-- Storage: product-images bucket (public read, authenticated write)
--
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- No SELECT policy on storage.objects: customers read image files via the
-- bucket's public CDN URLs (the `public: true` flag bypasses RLS for direct
-- fetches), and admin flows here never list the bucket — they upload to a
-- fresh UUID path, save the URL, and delete by path. Omitting SELECT avoids
-- exposing an enumeration vector.

create policy "product_images_write_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "product_images_update_auth"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

create policy "product_images_delete_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

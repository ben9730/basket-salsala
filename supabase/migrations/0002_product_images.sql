-- Phase 4: replace single image_url with ordered image_urls[]
-- and add an atomic swap function for reorder.

alter table public.products
  add column image_urls text[] not null default '{}';

update public.products
  set image_urls = array[image_url]
  where image_url is not null
    and image_url <> ''
    and cardinality(image_urls) = 0;

alter table public.products
  drop column image_url;

alter table public.products
  add constraint products_image_urls_max
  check (cardinality(image_urls) <= 5);

create or replace function public.swap_display_order(a uuid, b uuid)
returns void
language plpgsql
security invoker
as $$
declare
  order_a integer;
  order_b integer;
begin
  select display_order into order_a from public.products where id = a for update;
  select display_order into order_b from public.products where id = b for update;

  if order_a is null or order_b is null then
    raise exception 'product not found';
  end if;

  update public.products set display_order = order_b where id = a;
  update public.products set display_order = order_a where id = b;
end;
$$;

grant execute on function public.swap_display_order(uuid, uuid) to authenticated;

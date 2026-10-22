-- Orders: customers place orders via place_order() only; the owner (authenticated) manages them.
-- Apply in the Supabase SQL editor.

create type public.order_status as enum ('new', 'confirmed', 'ready', 'cancelled');

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_number   bigint generated always as identity (start with 1001) unique,
  customer_name  text not null check (char_length(btrim(customer_name)) between 1 and 80),
  phone          text not null check (phone ~ '^05[0-9]{8}$'),
  due_date       date not null,
  note           text check (note is null or char_length(note) <= 500),
  status         public.order_status not null default 'new',
  is_paid        boolean not null default false,
  source         text not null default 'web' check (source in ('web', 'manual')),
  created_at     timestamptz not null default now()
);
create index orders_due_date_idx on public.orders (due_date);
create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_lines (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  product_name  text not null,
  unit_price    numeric(10, 2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity between 1 and 99)
);
create index order_lines_order_id_idx on public.order_lines (order_id);

alter table public.orders enable row level security;
alter table public.order_lines enable row level security;

-- Defense in depth: anon gets no table privileges at all (and no policies).
revoke all on public.orders from anon;
revoke all on public.order_lines from anon;

-- Admin (authenticated): full access.
create policy "orders_select_auth" on public.orders for select to authenticated using (true);
create policy "orders_insert_auth" on public.orders for insert to authenticated with check (true);
create policy "orders_update_auth" on public.orders for update to authenticated using (true) with check (true);
create policy "orders_delete_auth" on public.orders for delete to authenticated using (true);

create policy "order_lines_select_auth" on public.order_lines for select to authenticated using (true);
create policy "order_lines_insert_auth" on public.order_lines for insert to authenticated with check (true);
create policy "order_lines_update_auth" on public.order_lines for update to authenticated using (true) with check (true);
create policy "order_lines_delete_auth" on public.order_lines for delete to authenticated using (true);

--
-- place_order: the only thing anon may call. Prices always come from products.
-- p_lines: [{"product_id": uuid, "quantity": 1..99}]
--
create or replace function public.place_order(
  p_name text,
  p_phone text,
  p_due_date date,
  p_note text,
  p_lines jsonb
)
returns table (order_number bigint, total numeric, lines jsonb)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_id uuid;
  v_num bigint;
  v_total numeric;
  v_distinct integer;
  v_count integer;
  v_max integer;
begin
  if p_due_date is null or p_due_date < (now() at time zone 'Asia/Jerusalem')::date then
    raise exception 'invalid due date';
  end if;

  if p_lines is null
     or jsonb_typeof(p_lines) <> 'array'
     or jsonb_array_length(p_lines) < 1
     or jsonb_array_length(p_lines) > 30 then
    raise exception 'invalid lines';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_lines) as e
    where jsonb_typeof(e) <> 'object'
       or (e->>'product_id') is null
       or (e->>'quantity') is null
       or (e->>'quantity')::int not between 1 and 99
  ) then
    raise exception 'invalid line';
  end if;

  select count(distinct (e->>'product_id')::uuid) into v_distinct
    from jsonb_array_elements(p_lines) as e;

  insert into public.orders (customer_name, phone, due_date, note, source)
  values (btrim(p_name), p_phone, p_due_date, nullif(btrim(p_note), ''), 'web')
  returning id, orders.order_number into v_id, v_num;

  -- Duplicate product ids are merged; name and price come from products, only for available ones.
  insert into public.order_lines (order_id, product_id, product_name, unit_price, quantity)
  select v_id, p.id, p.name, p.price, m.quantity
  from (
    select (e->>'product_id')::uuid as product_id, sum((e->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_lines) as e
    group by 1
  ) m
  join public.products p on p.id = m.product_id and p.is_available;

  -- Any raise below rolls the whole order back.
  select count(*), sum(unit_price * quantity), max(quantity)
    into v_count, v_total, v_max
    from public.order_lines where order_id = v_id;
  if v_count <> v_distinct then
    raise exception 'product unavailable';
  end if;
  if v_max > 99 then
    raise exception 'quantity too large';
  end if;

  -- The saved lines go back to the customer so their message shows the prices actually charged.
  return query select v_num, v_total, (
    select jsonb_agg(jsonb_build_object(
      'product_id', l.product_id, 'product_name', l.product_name,
      'unit_price', l.unit_price, 'quantity', l.quantity))
    from public.order_lines l where l.order_id = v_id
  );
end;
$$;

revoke all on function public.place_order(text, text, date, text, jsonb) from public;
grant execute on function public.place_order(text, text, date, text, jsonb) to anon, authenticated;

--
-- admin_save_order: security invoker, so RLS limits it to authenticated.
-- p_order: {customer_name, phone, due_date, note, status, is_paid}
-- p_lines: [{product_id|null, product_name, unit_price, quantity}]
--
create or replace function public.admin_save_order(
  p_id uuid,
  p_order jsonb,
  p_lines jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception 'order needs at least one line';
  end if;

  if p_id is null then
    insert into public.orders (customer_name, phone, due_date, note, status, is_paid, source)
    values (
      p_order->>'customer_name',
      p_order->>'phone',
      (p_order->>'due_date')::date,
      nullif(btrim(p_order->>'note'), ''),
      (p_order->>'status')::public.order_status,
      coalesce((p_order->>'is_paid')::boolean, false),
      'manual'
    )
    returning id into v_id;
  else
    update public.orders set
      customer_name = p_order->>'customer_name',
      phone = p_order->>'phone',
      due_date = (p_order->>'due_date')::date,
      note = nullif(btrim(p_order->>'note'), ''),
      status = (p_order->>'status')::public.order_status,
      is_paid = coalesce((p_order->>'is_paid')::boolean, false)
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'order not found';
    end if;
    delete from public.order_lines where order_id = v_id;
  end if;

  insert into public.order_lines (order_id, product_id, product_name, unit_price, quantity)
  select
    v_id,
    nullif(e->>'product_id', '')::uuid,
    e->>'product_name',
    (e->>'unit_price')::numeric,
    (e->>'quantity')::int
  from jsonb_array_elements(p_lines) as e;

  return v_id;
end;
$$;

revoke all on function public.admin_save_order(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_order(uuid, jsonb, jsonb) to authenticated;

-- place_order rejects Saturday and Sunday: distribution is Monday-Friday (owner confirmed 2026-10-22).
-- Apply in the Supabase SQL editor.

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

  if extract(dow from p_due_date) in (0, 6) then
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

  if extract(dow from p_due_date) <> 5 and exists (
    select 1 from public.products p
    where p.is_friday_only
      and p.id in (select (e->>'product_id')::uuid from jsonb_array_elements(p_lines) e)
  ) then
    raise exception 'friday only';
  end if;

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

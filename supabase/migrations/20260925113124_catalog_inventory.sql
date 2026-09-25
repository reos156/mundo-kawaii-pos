create table public.products (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text,
  price_cop integer not null,
  stock_on_hand integer not null default 0,
  created_by uuid not null references auth.users (id) on delete restrict,
  metadata_updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  metadata_updated_at timestamptz not null default pg_catalog.now(),
  constraint products_sku_nonempty_check
    check (pg_catalog.btrim(sku) <> ''),
  constraint products_name_nonempty_check
    check (pg_catalog.btrim(name) <> ''),
  constraint products_price_cop_check
    check (price_cop >= 0),
  constraint products_stock_on_hand_check
    check (stock_on_hand >= 0)
);

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete restrict,
  movement_type text not null,
  quantity_delta integer not null,
  note text,
  actor_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  constraint inventory_movements_type_check
    check (movement_type in ('receipt', 'adjustment')),
  constraint inventory_movements_quantity_delta_check
    check (
      (movement_type = 'receipt' and quantity_delta > 0)
      or (movement_type = 'adjustment' and quantity_delta <> 0)
    )
);

create index inventory_movements_product_created_at_idx
  on public.inventory_movements (product_id, created_at desc, id desc);

alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;

create policy products_read_cashier_or_administrator
  on public.products
  for select
  to authenticated
  using (
    (select public.is_current_user_in_role('cashier'::public.app_role))
    or (select public.is_current_user_in_role('administrator'::public.app_role))
  );

create policy inventory_movements_read_cashier_or_administrator
  on public.inventory_movements
  for select
  to authenticated
  using (
    (select public.is_current_user_in_role('cashier'::public.app_role))
    or (select public.is_current_user_in_role('administrator'::public.app_role))
  );

create function public.create_product(
  p_sku text,
  p_name text,
  p_price_cop integer,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_product_id uuid;
begin
  v_actor_id := public.require_current_user_administrator();

  if p_sku is null or pg_catalog.btrim(p_sku) = ''
     or p_name is null or pg_catalog.btrim(p_name) = ''
     or p_price_cop is null or p_price_cop < 0 then
    raise exception 'Product SKU, name, and nonnegative COP price are required'
      using errcode = '22023';
  end if;

  insert into public.products (
    sku,
    name,
    description,
    price_cop,
    created_by,
    metadata_updated_by
  )
  values (
    pg_catalog.btrim(p_sku),
    pg_catalog.btrim(p_name),
    nullif(pg_catalog.btrim(p_description), ''),
    p_price_cop,
    v_actor_id,
    v_actor_id
  )
  returning id into v_product_id;

  return v_product_id;
end;
$$;

create function public.update_product(
  p_product_id uuid,
  p_sku text,
  p_name text,
  p_price_cop integer,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := public.require_current_user_administrator();

  if p_product_id is null
     or p_sku is null or pg_catalog.btrim(p_sku) = ''
     or p_name is null or pg_catalog.btrim(p_name) = ''
     or p_price_cop is null or p_price_cop < 0 then
    raise exception 'Product ID, SKU, name, and nonnegative COP price are required'
      using errcode = '22023';
  end if;

  update public.products
  set sku = pg_catalog.btrim(p_sku),
      name = pg_catalog.btrim(p_name),
      description = nullif(pg_catalog.btrim(p_description), ''),
      price_cop = p_price_cop,
      metadata_updated_by = v_actor_id,
      metadata_updated_at = pg_catalog.now()
  where id = p_product_id;

  if not found then
    raise exception 'Product not found'
      using errcode = '22023';
  end if;
end;
$$;

create function public.receive_stock(
  p_product_id uuid,
  p_quantity integer,
  p_note text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_current_stock integer;
  v_new_stock bigint;
  v_movement_id bigint;
begin
  v_actor_id := public.require_current_user_administrator();

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Receipt quantity must be a positive integer'
      using errcode = '22023';
  end if;

  select product.stock_on_hand
  into v_current_stock
  from public.products as product
  where product.id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found'
      using errcode = '22023';
  end if;

  v_new_stock := v_current_stock::bigint + p_quantity::bigint;
  if v_new_stock > 2147483647 then
    raise exception 'On-hand stock exceeds the supported integer range'
      using errcode = '22003';
  end if;

  update public.products
  set stock_on_hand = v_new_stock::integer
  where id = p_product_id;

  insert into public.inventory_movements (
    product_id,
    movement_type,
    quantity_delta,
    note,
    actor_id
  )
  values (
    p_product_id,
    'receipt',
    p_quantity,
    nullif(pg_catalog.btrim(p_note), ''),
    v_actor_id
  )
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

create function public.adjust_stock(
  p_product_id uuid,
  p_quantity_delta integer,
  p_note text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_current_stock integer;
  v_new_stock bigint;
  v_movement_id bigint;
begin
  v_actor_id := public.require_current_user_administrator();

  if p_quantity_delta is null or p_quantity_delta = 0 then
    raise exception 'Adjustment quantity must be a nonzero integer'
      using errcode = '22023';
  end if;

  select product.stock_on_hand
  into v_current_stock
  from public.products as product
  where product.id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found'
      using errcode = '22023';
  end if;

  v_new_stock := v_current_stock::bigint + p_quantity_delta::bigint;
  if v_new_stock < 0 then
    raise exception 'Adjustment would make stock negative'
      using errcode = '23514';
  end if;
  if v_new_stock > 2147483647 then
    raise exception 'On-hand stock exceeds the supported integer range'
      using errcode = '22003';
  end if;

  update public.products
  set stock_on_hand = v_new_stock::integer
  where id = p_product_id;

  insert into public.inventory_movements (
    product_id,
    movement_type,
    quantity_delta,
    note,
    actor_id
  )
  values (
    p_product_id,
    'adjustment',
    p_quantity_delta,
    nullif(pg_catalog.btrim(p_note), ''),
    v_actor_id
  )
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

create function public.reject_inventory_movement_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Inventory movements are append-only'
    using errcode = '55000';
end;
$$;

create trigger inventory_movements_are_append_only
before update or delete on public.inventory_movements
for each row execute function public.reject_inventory_movement_mutation();

revoke all on table public.products
  from public, anon, authenticated, service_role;
revoke all on table public.inventory_movements
  from public, anon, authenticated, service_role;
grant select on table public.products, public.inventory_movements
  to authenticated;

revoke all on function public.create_product(text, text, integer, text)
  from public, anon, authenticated, service_role;
revoke all on function public.update_product(uuid, text, text, integer, text)
  from public, anon, authenticated, service_role;
revoke all on function public.receive_stock(uuid, integer, text)
  from public, anon, authenticated, service_role;
revoke all on function public.adjust_stock(uuid, integer, text)
  from public, anon, authenticated, service_role;
revoke all on function public.reject_inventory_movement_mutation()
  from public, anon, authenticated, service_role;

grant execute on function public.create_product(text, text, integer, text)
  to authenticated;
grant execute on function public.update_product(uuid, text, text, integer, text)
  to authenticated;
grant execute on function public.receive_stock(uuid, integer, text)
  to authenticated;
grant execute on function public.adjust_stock(uuid, integer, text)
  to authenticated;

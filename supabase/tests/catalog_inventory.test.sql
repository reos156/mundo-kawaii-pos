begin;

select plan(53);

select has_table('public', 'products', 'product catalog table exists');
select has_table('public', 'inventory_movements', 'inventory movement ledger exists');
select has_column('public', 'products', 'stock_on_hand', 'products expose on-hand stock');
select has_column('public', 'products', 'price_cop', 'products expose COP prices');
select col_type_is('public', 'products', 'stock_on_hand', 'integer', 'on-hand stock uses whole units');
select col_type_is('public', 'products', 'price_cop', 'integer', 'COP prices use integer pesos');
insert into auth.users (id)
values
  ('20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000003');

insert into public.role_memberships (user_id, role, granted_by)
values
  ('20000000-0000-0000-0000-000000000001', 'administrator', null),
  (
    '20000000-0000-0000-0000-000000000002',
    'cashier',
    '20000000-0000-0000-0000-000000000001'
  );

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;

select lives_ok(
  $$select public.create_product('SKU-001', 'Kawaii sticker', 12500, 'Test product')$$,
  'administrator can create a product through the catalog RPC'
);
select is(
  (select stock_on_hand from public.products where sku = 'SKU-001'),
  0,
  'new catalog products start with zero on-hand stock'
);
select is(
  (select price_cop from public.products where sku = 'SKU-001'),
  12500,
  'product price is stored in integer COP'
);
select lives_ok(
  $$select public.update_product(
      (select id from public.products where sku = 'SKU-001'),
      'SKU-001', 'Kawaii sticker pack', 13000, 'Updated test product'
    )$$,
  'administrator can update product metadata through the catalog RPC'
);
select is(
  (select name from public.products where sku = 'SKU-001'),
  'Kawaii sticker pack',
  'catalog RPC updates product metadata'
);
select is(
  (select price_cop from public.products where sku = 'SKU-001'),
  13000,
  'catalog RPC updates the integer COP price'
);
select lives_ok(
  $$select public.receive_stock(
      (select id from public.products where sku = 'SKU-001'), 5, 'Initial receipt'
    )$$,
  'administrator can receive positive whole-unit stock'
);
select is(
  (select stock_on_hand from public.products where sku = 'SKU-001'),
  5,
  'receipt increases on-hand stock'
);
select lives_ok(
  $$select public.adjust_stock(
      (select id from public.products where sku = 'SKU-001'), -2, 'Count correction'
    )$$,
  'administrator can make a nonzero signed stock adjustment'
);
select is(
  (select stock_on_hand from public.products where sku = 'SKU-001'),
  3,
  'adjustment changes on-hand stock by its signed quantity'
);
select is(
  (select count(*) from public.inventory_movements),
  2::bigint,
  'each successful stock change appends one inventory movement'
);
select is(
  (
    select count(*)
    from public.inventory_movements
    where product_id = (select id from public.products where sku = 'SKU-001')
      and movement_type = 'receipt'
      and quantity_delta = 5
      and actor_id = '20000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'receipt audit records its quantity, type, and authenticated administrator'
);
select is(
  (
    select count(*)
    from public.inventory_movements
    where product_id = (select id from public.products where sku = 'SKU-001')
      and movement_type = 'adjustment'
      and quantity_delta = -2
      and actor_id = '20000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'adjustment audit records its signed quantity and authenticated administrator'
);

reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
set local role authenticated;

select is((select count(*) from public.products), 1::bigint, 'cashier can read the product catalog');
select is((select count(*) from public.inventory_movements), 2::bigint, 'cashier can read inventory movements');
select throws_ok(
  $$select public.create_product('SKU-002', 'Unauthorized', 100)$$,
  '42501',
  null,
  'cashier cannot create products'
);
select throws_ok(
  $$select public.update_product(
      (select id from public.products where sku = 'SKU-001'),
      'SKU-001', 'Unauthorized', 100, null
    )$$,
  '42501',
  null,
  'cashier cannot change product metadata'
);
select throws_ok(
  $$select public.receive_stock(
      (select id from public.products where sku = 'SKU-001'), 1
    )$$,
  '42501',
  null,
  'cashier cannot receive stock'
);
select throws_ok(
  $$select public.adjust_stock(
      (select id from public.products where sku = 'SKU-001'), 1
    )$$,
  '42501',
  null,
  'cashier cannot adjust stock'
);
select throws_ok(
  $$insert into public.products (sku, name, price_cop)
    values ('SKU-DIRECT-CASHIER', 'Unauthorized', 100)$$,
  '42501',
  null,
  'cashier cannot insert products directly'
);
select throws_ok(
  $$update public.products set stock_on_hand = 99 where sku = 'SKU-001'$$,
  '42501',
  null,
  'cashier cannot mutate an on-hand balance directly'
);
select throws_ok(
  $$insert into public.inventory_movements
      (product_id, movement_type, quantity_delta, actor_id)
    select id, 'receipt', 1, '20000000-0000-0000-0000-000000000002'
    from public.products where sku = 'SKU-001'$$,
  '42501',
  null,
  'cashier cannot forge an inventory movement'
);
select throws_ok(
  $$update public.inventory_movements set quantity_delta = 99$$,
  '42501',
  null,
  'cashier cannot rewrite inventory movements'
);
select throws_ok(
  $$delete from public.inventory_movements$$,
  '42501',
  null,
  'cashier cannot delete inventory movements'
);

reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000003', true);
set local role authenticated;

select is((select count(*) from public.products), 0::bigint, 'users without a cashier or administrator role cannot read products');
select is((select count(*) from public.inventory_movements), 0::bigint, 'users without a role cannot read inventory movements');
select throws_ok(
  $$select public.create_product('SKU-003', 'Unauthorized', 100)$$,
  '42501',
  null,
  'users without an administrator role cannot use catalog RPCs'
);

reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;

select throws_ok(
  $$update public.products set name = 'Direct admin write' where sku = 'SKU-001'$$,
  '42501',
  null,
  'administrator clients cannot bypass the catalog RPC for metadata writes'
);
select throws_ok(
  $$update public.products set stock_on_hand = 99 where sku = 'SKU-001'$$,
  '42501',
  null,
  'administrator clients cannot mutate balances directly'
);
select throws_ok(
  $$insert into public.inventory_movements
      (product_id, movement_type, quantity_delta, actor_id)
    select id, 'receipt', 1, '20000000-0000-0000-0000-000000000001'
    from public.products where sku = 'SKU-001'$$,
  '42501',
  null,
  'administrator clients cannot insert movement rows directly'
);
select throws_ok(
  $$update public.inventory_movements set quantity_delta = 99$$,
  '42501',
  null,
  'administrator clients cannot rewrite movement history directly'
);

reset role;

select throws_ok(
  $$insert into public.products
      (id, sku, name, price_cop, stock_on_hand, created_by, metadata_updated_by)
    values (
      '30000000-0000-0000-0000-000000000001', 'SKU-NEG-STOCK', 'Invalid', 100, -1,
      '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'
    )$$,
  '23514',
  null,
  'database constraint rejects negative on-hand stock'
);
select throws_ok(
  $$insert into public.products
      (id, sku, name, price_cop, stock_on_hand, created_by, metadata_updated_by)
    values (
      '30000000-0000-0000-0000-000000000002', 'SKU-NEG-PRICE', 'Invalid', -1, 0,
      '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'
    )$$,
  '23514',
  null,
  'database constraint rejects negative COP prices'
);
select throws_ok(
  $$select public.receive_stock(
      (select id from public.products where sku = 'SKU-001'), 0
    )$$,
  '22023',
  'Receipt quantity must be a positive integer',
  'receipt rejects zero quantity'
);
select throws_ok(
  $$select public.receive_stock(
      (select id from public.products where sku = 'SKU-001'), -1
    )$$,
  '22023',
  'Receipt quantity must be a positive integer',
  'receipt rejects negative quantity'
);
select throws_ok(
  $$select public.receive_stock(
      (select id from public.products where sku = 'SKU-001'), 1.5
    )$$,
  '42883',
  null,
  'receipt RPC rejects fractional quantities'
);
select throws_ok(
  $$select public.adjust_stock(
      (select id from public.products where sku = 'SKU-001'), 0
    )$$,
  '22023',
  'Adjustment quantity must be a nonzero integer',
  'adjustment rejects a zero quantity'
);
select throws_ok(
  $$insert into public.inventory_movements
      (product_id, movement_type, quantity_delta, actor_id)
    select id, 'receipt', 0, '20000000-0000-0000-0000-000000000001'
    from public.products where sku = 'SKU-001'$$,
  '23514',
  null,
  'movement constraint rejects a receipt without a positive quantity'
);
select throws_ok(
  $$insert into public.inventory_movements
      (product_id, movement_type, quantity_delta, actor_id)
    select id, 'unknown', 1, '20000000-0000-0000-0000-000000000001'
    from public.products where sku = 'SKU-001'$$,
  '23514',
  null,
  'movement constraint rejects unknown movement types'
);
select throws_ok(
  $$select public.adjust_stock(
      (select id from public.products where sku = 'SKU-001'), -4
    )$$,
  '23514',
  'Adjustment would make stock negative',
  'adjustment rejects a result below zero stock'
);
select is(
  (select stock_on_hand from public.products where sku = 'SKU-001'),
  3,
  'rejected adjustment leaves the on-hand balance unchanged'
);
select is(
  (select count(*) from public.inventory_movements),
  2::bigint,
  'rejected adjustment appends no movement'
);
select throws_ok(
  $$update public.inventory_movements set note = 'rewritten'
    where product_id = (select id from public.products where sku = 'SKU-001')$$,
  '55000',
  'Inventory movements are append-only',
  'movement ledger rejects updates even from the database owner'
);
select throws_ok(
  $$delete from public.inventory_movements
    where product_id = (select id from public.products where sku = 'SKU-001')$$,
  '55000',
  'Inventory movements are append-only',
  'movement ledger rejects deletes even from the database owner'
);

create function public.test_reject_inventory_movement_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'forced movement write failure'
    using errcode = 'P0001';
end;
$$;

create trigger test_reject_inventory_movement_insert
before insert on public.inventory_movements
for each row execute function public.test_reject_inventory_movement_insert();

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;

select throws_ok(
  $$select public.receive_stock(
      (select id from public.products where sku = 'SKU-001'), 2
    )$$,
  'P0001',
  'forced movement write failure',
  'a failed movement insert aborts the stock receipt RPC'
);
select is(
  (select stock_on_hand from public.products where sku = 'SKU-001'),
  3,
  'failed movement insert rolls back the balance update atomically'
);
select is(
  (select count(*) from public.inventory_movements),
  2::bigint,
  'failed movement insert leaves the audit ledger unchanged'
);

select * from finish();
rollback;

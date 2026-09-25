begin;

select plan(29);

select has_table('public', 'role_memberships', 'role membership table exists');
select is(
  (
    select array_agg(enumlabel::text order by enumsortorder)
    from pg_enum
    where enumtypid = 'public.app_role'::regtype
  ),
  array['cashier', 'administrator']::text[],
  'the initial role set is cashier and administrator'
);

insert into auth.users (id)
values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000004');

insert into public.role_memberships (user_id, role, granted_by)
values
  ('10000000-0000-0000-0000-000000000001', 'administrator', null),
  (
    '10000000-0000-0000-0000-000000000002',
    'cashier',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'administrator',
    '10000000-0000-0000-0000-000000000001'
  );

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
set local role authenticated;

select is(
  public.current_user_id()::text,
  '10000000-0000-0000-0000-000000000002',
  'current user helper reads the authenticated subject'
);
select is(
  public.is_current_user_in_role('cashier'),
  true,
  'cashier role helper recognizes the current cashier'
);
select is(
  public.is_current_user_in_role('administrator'),
  false,
  'cashier is not treated as an administrator'
);
select is(
  (select count(*) from public.role_memberships),
  1::bigint,
  'cashier can see their own role membership'
);
select is(
  (
    select count(*)
    from public.role_memberships
    where user_id = '10000000-0000-0000-0000-000000000001'
  ),
  0::bigint,
  'cashier cannot see another user role membership'
);
select is(
  (select count(*) from public.role_change_audit),
  0::bigint,
  'cashier cannot see the privileged role audit log'
);
select throws_ok(
  $$insert into public.role_memberships (user_id, role, granted_by)
    values ('10000000-0000-0000-0000-000000000002', 'administrator', null)$$,
  '42501',
  null,
  'cashier cannot self-grant by inserting a role row'
);
select throws_ok(
  $$update public.role_memberships
    set role = 'administrator'
    where user_id = '10000000-0000-0000-0000-000000000002'$$,
  '42501',
  null,
  'cashier cannot promote a role row directly'
);
select throws_ok(
  $$delete from public.role_memberships
    where user_id = '10000000-0000-0000-0000-000000000002'$$,
  '42501',
  null,
  'cashier cannot delete a role row directly'
);
select throws_ok(
  $$select public.assign_user_role(
      '10000000-0000-0000-0000-000000000003', 'administrator'
    )$$,
  '42501',
  null,
  'cashier cannot assign roles through the authorized function'
);
select throws_ok(
  $$insert into public.role_change_audit
      (target_user_id, role, action, performed_by, change_source)
    values (
      '10000000-0000-0000-0000-000000000002',
      'administrator',
      'grant',
      '10000000-0000-0000-0000-000000000002',
      'admin'
    )$$,
  '42501',
  null,
  'cashier cannot forge role audit entries'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;

select is(
  public.is_current_user_in_role('administrator'),
  true,
  'administrator role helper recognizes the current administrator'
);
select is(
  (select count(*) from public.role_memberships),
  3::bigint,
  'administrator can see all role memberships'
);
select is(
  (select count(*) from public.role_change_audit),
  0::bigint,
  'administrator can see the role audit log'
);
select lives_ok(
  $$select public.assign_user_role(
      '10000000-0000-0000-0000-000000000003', 'administrator'
    )$$,
  'administrator can assign a privileged role to another user'
);
select is(
  (
    select count(*)
    from public.role_memberships
    where user_id = '10000000-0000-0000-0000-000000000003'
      and role = 'administrator'
  ),
  1::bigint,
  'authorized role assignment becomes active'
);
select is(
  (
    select count(*)
    from public.role_change_audit
    where target_user_id = '10000000-0000-0000-0000-000000000003'
      and role = 'administrator'
      and action = 'grant'
      and performed_by = '10000000-0000-0000-0000-000000000001'
      and change_source = 'admin'
  ),
  1::bigint,
  'role grant records its administrator actor in the audit log'
);
select lives_ok(
  $$select public.revoke_user_role(
      '10000000-0000-0000-0000-000000000002', 'cashier'
    )$$,
  'administrator can revoke another user role'
);
select is(
  (
    select count(*)
    from public.role_memberships
    where user_id = '10000000-0000-0000-0000-000000000002'
      and role = 'cashier'
  ),
  0::bigint,
  'authorized role revocation removes the active membership'
);
select is(
  (
    select count(*)
    from public.role_change_audit
    where target_user_id = '10000000-0000-0000-0000-000000000002'
      and role = 'cashier'
      and action = 'revoke'
      and performed_by = '10000000-0000-0000-0000-000000000001'
      and change_source = 'admin'
  ),
  1::bigint,
  'role revocation records its administrator actor in the audit log'
);
select throws_ok(
  $$select public.assign_user_role(
      '10000000-0000-0000-0000-000000000001', 'cashier'
    )$$,
  '42501',
  'Users cannot modify their own role memberships',
  'administrator cannot change their own role memberships'
);
select lives_ok(
  $$select public.revoke_user_role(
      '10000000-0000-0000-0000-000000000004', 'administrator'
    )$$,
  'administrator can revoke another administrator while one remains'
);
select lives_ok(
  $$select public.revoke_user_role(
      '10000000-0000-0000-0000-000000000003', 'administrator'
    )$$,
  'administrator can revoke a second administrator while keeping their own role'
);
select is(
  (
    select count(*)
    from public.role_change_audit
    where target_user_id = '10000000-0000-0000-0000-000000000004'
      and role = 'administrator'
      and action = 'revoke'
      and performed_by = '10000000-0000-0000-0000-000000000001'
      and change_source = 'admin'
  ),
  1::bigint,
  'privileged role revocation records its administrator actor'
);
select throws_ok(
  $$select public.revoke_user_role(
      '10000000-0000-0000-0000-000000000001', 'administrator'
    )$$,
  '42501',
  'At least one administrator must remain',
  'the last administrator cannot be revoked'
);
select is(
  (
    select count(*)
    from public.role_memberships
    where user_id = '10000000-0000-0000-0000-000000000001'
      and role = 'administrator'
  ),
  1::bigint,
  'last-administrator safeguard preserves the active administrator role'
);

reset role;
select throws_ok(
  $$delete from auth.users
    where id = '10000000-0000-0000-0000-000000000001'$$,
  '23503',
  null,
  'an Auth account with an active role cannot bypass audited revocation'
);

select * from finish();
rollback;

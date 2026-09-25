create type public.app_role as enum ('cashier', 'administrator');

create table public.role_memberships (
  user_id uuid not null references auth.users (id) on delete restrict,
  role public.app_role not null,
  granted_by uuid,
  granted_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, role)
);

create table public.role_change_audit (
  id bigint generated always as identity primary key,
  target_user_id uuid not null,
  role public.app_role not null,
  action text not null check (action in ('grant', 'revoke')),
  performed_by uuid,
  change_source text not null default 'admin'
    check (change_source in ('admin', 'operator')),
  changed_at timestamptz not null default pg_catalog.now(),
  constraint role_change_audit_actor_source_check check (
    (change_source = 'admin' and performed_by is not null)
    or (change_source = 'operator' and performed_by is null)
  )
);

create index role_change_audit_target_idx
  on public.role_change_audit (target_user_id, changed_at desc);

alter table public.role_memberships enable row level security;
alter table public.role_change_audit enable row level security;

create function public.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select auth.uid()
$$;

create function public.is_current_user_in_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.role_memberships as membership
    where membership.user_id = auth.uid()
      and membership.role = p_role
  )
$$;

create policy role_memberships_select_own_or_administrator
  on public.role_memberships
  for select
  to authenticated
  using (
    user_id = (select public.current_user_id())
    or (select public.is_current_user_in_role('administrator'))
  );

create policy role_change_audit_select_administrator
  on public.role_change_audit
  for select
  to authenticated
  using (
    (select public.is_current_user_in_role('administrator'))
  );

create function public.require_current_user_administrator()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null
     or not public.is_current_user_in_role('administrator') then
    raise exception 'Administrator role required'
      using errcode = '42501';
  end if;

  return v_actor_id;
end;
$$;

create function public.assign_user_role(
  p_user_id uuid,
  p_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(67031003);
  v_actor_id := public.require_current_user_administrator();

  if p_user_id is null or p_role is null then
    raise exception 'User and role are required'
      using errcode = '22023';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'Users cannot modify their own role memberships'
      using errcode = '42501';
  end if;

  insert into public.role_memberships (user_id, role, granted_by)
  values (p_user_id, p_role, v_actor_id)
  on conflict (user_id, role) do nothing;

  if found then
    insert into public.role_change_audit (
      target_user_id,
      role,
      action,
      performed_by,
      change_source
    )
    values (p_user_id, p_role, 'grant', v_actor_id, 'admin');
  end if;
end;
$$;

create function public.revoke_user_role(
  p_user_id uuid,
  p_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_admin_count bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(67031003);
  v_actor_id := public.require_current_user_administrator();

  if p_user_id is null or p_role is null then
    raise exception 'User and role are required'
      using errcode = '22023';
  end if;

  if p_role = 'administrator' then
    select count(*)
    into v_admin_count
    from public.role_memberships
    where role = 'administrator';

    if v_admin_count <= 1
       and exists (
         select 1
         from public.role_memberships
         where user_id = p_user_id
           and role = 'administrator'
       ) then
      raise exception 'At least one administrator must remain'
        using errcode = '42501';
    end if;
  end if;

  if p_user_id = v_actor_id then
    raise exception 'Users cannot modify their own role memberships'
      using errcode = '42501';
  end if;

  delete from public.role_memberships
  where user_id = p_user_id
    and role = p_role;

  if found then
    insert into public.role_change_audit (
      target_user_id,
      role,
      action,
      performed_by,
      change_source
    )
    values (p_user_id, p_role, 'revoke', v_actor_id, 'admin');
  end if;
end;
$$;

revoke all on table public.role_memberships
  from public, anon, authenticated, service_role;
revoke all on table public.role_change_audit
  from public, anon, authenticated, service_role;
grant select on table public.role_memberships, public.role_change_audit
  to authenticated;

revoke all on function public.current_user_id()
  from public, anon, authenticated, service_role;
revoke all on function public.is_current_user_in_role(public.app_role)
  from public, anon, authenticated, service_role;
revoke all on function public.require_current_user_administrator()
  from public, anon, authenticated, service_role;
revoke all on function public.assign_user_role(uuid, public.app_role)
  from public, anon, authenticated, service_role;
revoke all on function public.revoke_user_role(uuid, public.app_role)
  from public, anon, authenticated, service_role;

grant execute on function public.current_user_id()
  to authenticated;
grant execute on function public.is_current_user_in_role(public.app_role)
  to authenticated;
grant execute on function public.assign_user_role(uuid, public.app_role)
  to authenticated;
grant execute on function public.revoke_user_role(uuid, public.app_role)
  to authenticated;

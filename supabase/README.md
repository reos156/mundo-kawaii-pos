# Supabase local database

This slice establishes Postgres-owned identity and role authorization, product catalog, on-hand inventory, and auditable stock movements. It does not add sale, payment, cash-session, reservation, or receipt tables. The MVP is for one physical shop/register; any eventual receipt is internal and non-fiscal. A transfer awaiting manual verification is not a confirmed sale, payment, or cash movement. Privileged verification belongs in the database, not in UI-only checks.

## Catalog and inventory

Authenticated cashiers and administrators can read products and inventory movements; users without either role cannot. Only administrators can create or change product metadata, receive stock, or make stock adjustments. These operations use database-authorized RPCs, and client roles have no direct table-write grants.

On-hand quantities and COP prices are whole-unit integers. On-hand stock cannot be negative. Each successful receipt or adjustment atomically changes the product balance and appends a movement recording its type, signed quantity, and authenticated actor. Movement history is append-only. Reservations and pending checkout holds affect availability in later POS slices; they are not included in on-hand stock here.

## Local development and tests

The Supabase CLI is a project-local development dependency. From the repository root:

```sh
bun install
bun run db:start
bun run db:test
```

`bun run db:test` wraps `supabase test db` and runs the pgTAP files in `supabase/tests/` against the local stack. Start the local stack first. To rebuild the local database from migrations:

```sh
bun run db:reset
```

`db:reset` is destructive to local database contents; it must only be used against this checkout's local Supabase stack. Database tests create temporary Auth users without email/password credentials inside a transaction and roll the transaction back. There is no demo-user seed. Local Auth sign-up is disabled; test fixtures are created only by the test SQL.

Vitest remains the TypeScript/UI runner (`bun run test`); database tests are separate.

## Roles and bootstrap

The initial roles are `cashier` and `administrator` (the supervisor role). Authenticated users can read their own role membership; administrators can read all role memberships and the role-change audit log. Authenticated clients have no direct role-table or audit-table mutation grants. Role changes go through `assign_user_role` and `revoke_user_role`, which require an authenticated administrator, reject self-changes, serialize concurrent role changes, preserve the last administrator, and append an audit record. Role helpers derive identity from `auth.uid()` and do not accept a caller-selected user ID. Auth accounts with active roles cannot be deleted until those roles have been revoked through the audited administrator path.

There is deliberately no public bootstrap RPC, self-service promotion route, or committed credential. Bootstrap the first administrator only as a trusted operator after creating the intended Auth user through an operator-controlled Auth flow. Do not enable public registration as a way to bootstrap privileged access.

For local development, start the stack and create the intended user through the local Studio Auth user-management UI. Then open its SQL editor as the local database operator, substitute the user's Auth UUID below, and run the transaction:

```sql
begin;
select pg_catalog.pg_advisory_xact_lock(67031003);

insert into public.role_memberships (user_id, role, granted_by)
values ('<auth-user-uuid>'::uuid, 'administrator', null);

insert into public.role_change_audit
  (target_user_id, role, action, performed_by, change_source)
values
  ('<auth-user-uuid>'::uuid, 'administrator', 'grant', null, 'operator');

commit;
```

For production, use the same audited SQL only after the schema has been deployed through the project's separately approved release process. Run it through a trusted operator-only database connection with database-owner authority, after the intended Auth user has been created by an authorized administrator. Never run it through the client, anon key, or a user-controlled endpoint; never paste database or service-role credentials into source control. This task does not link to or mutate a production project.

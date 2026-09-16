# Implementation Tasks: Offline-first MVP foundations

> Implementation and apply progress are authorized one bounded work unit at a time under the work-unit protocol below. This plan does not authorize commits, pushes, pull requests, synchronization, archiving, or deployment.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 9,000–15,000 authored additions + deletions across application, tests, migrations, packaging, and operations documentation |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Decision/POC evidence → foundation → one independently verifiable vertical work unit per PR; split UI from service only when each sub-PR remains runnable |
| Delivery strategy | ask-on-risk (split approved) |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

The MVP is a new offline application with multiple transactional workflows, hardware integration, recovery tooling, migrations, security controls, tests, and Windows packaging. Before apply, obtain the requested delivery decision; then keep each accepted PR at or below 400 authored changed lines where an honest vertical split exists. If a cohesive unit cannot fit after one slicing pass, report its smallest honest size and request a size exception rather than compressing tests or documentation.

## Work-unit protocol

Dependencies use work-unit identifiers below. A work unit starts from a green predecessor, finishes with its acceptance behavior usable through the browser UI and local service where applicable, and can be rolled back by removing only the named paths/migration while preserving predecessor behavior.

Strict TDD applies to every later implementation unit:

1. **RED:** add the smallest failing domain/contract/integration or hardware-harness test and record the expected failure.
2. **GREEN:** implement only enough browser UI, local service, ACID persistence, and adapters to pass it.
3. **TRIANGULATE:** add boundary, denial, failure-injection, restart, idempotency, and concurrency cases relevant to the slice.
4. **REFACTOR:** improve structure without changing behavior and rerun the focused and predecessor suites.

For every work unit, retain `evidence/work-units/WU-XX.md` with the exact focused test command and result, exact runtime/hardware scenario and result (or `N/A` with reason), changed-line count, acceptance observations, and an independent rollback boundary. Tests and user/operations documentation travel with the behavior they verify. Because no runner is currently detected, WU-01 must establish commands before later RED work.

## Phase 0 — Resolve prerequisites and release-critical unknowns

### WU-00 — Record resolved product and security decisions

**Dependencies:** none. **Decision-map evidence:** resolved GitHub issue #5. **Child decisions:** #6 owner access; #7 user administration; #8 quantity precision; #9 backup objectives and operations; #10 retention and disposal; #11 confidentiality and recovery-material custody. **Finish:** the resolved policies are recorded without reopening owner choices, and no implementation-critical mechanism remains implicit. **Rollback:** revert only the ADRs before code depends on them.

The map is resolved planning input, not implementation completion. Keep these tasks unchecked until their ADR and evidence artifacts are actually created under implementation authorization.

- [ ] Transcribe resolved issue #6 into `docs/adr/ADR-001-owner-access.md`: atomic claim; no shared/default/platform/support account; password/delay rules; OWNER/CASHIER sessions without inactivity/absolute expiry; 15-minute POS lock; process/Windows restart termination; shared Windows lock terminates OWNER POS session; revocation with exact replay; bounded fresh authorization; off-terminal recovery rotation without bypass. <!-- sdd-owner: implementation -->
- [ ] Transcribe resolved issue #7 into `docs/adr/ADR-002-user-administration.md`: named lifecycle/display snapshots; identical single-use no-time-expiry provisional password and operational block for creation/reset/reactivation; every self-password change requires current password plus fresh OWNER authorization without independent CASHIER password authority; 15-minute lock preserves work while termination abandons cart; definitive matrix, replay, authorization, and reasons. <!-- sdd-owner: implementation -->
- [ ] Transcribe resolved issue #8 into `docs/adr/ADR-003-quantity-precision.md`: whole-unit opening/sale/adjustment rules, integral-form acceptance, fraction rejection without rounding, zero `OPENING` entries, ledger-only stock change, gift representation, and the history-preserving migration boundary. <!-- sdd-owner: implementation -->
- [ ] Transcribe resolved issues #9–#11 into `docs/adr/ADR-004-data-protection-retention.md`: open-shift-age RPO warning, complete RTO, capacity/retry/disconnection, automatic detail/diagnostic expiry, guarded artifact/installation retirement, external custodian responsibility, rollback/journal/new-backup gate, confidentiality, custody authority boundary, only approved rotation/rehearsal triggers, exact restore, redaction, and permanent loss. <!-- sdd-owner: implementation -->
- [ ] Verify ADRs 001–004 faithfully consume resolved map #5 and its child issues against `specs/access-control/spec.md`, `specs/catalog-inventory/spec.md`, `specs/offline-data-recovery/spec.md`, and `design.md`; record traceability, acceptance criteria, deferred mechanisms, and unchanged non-goals in `evidence/work-units/WU-00.md` without checking implementation tasks prematurely. <!-- sdd-owner: implementation -->

### WU-01 — Stack, database, test, and packaging selection

**Dependencies:** WU-00. **Finish:** a runnable browser UI/local-service skeleton can be tested offline. **Rollback:** remove the skeleton and ADR without affecting planning artifacts.

- [ ] Compare supported stacks in `docs/adr/ADR-005-runtime-database-packaging.md` and select a browser UI, loopback-only local service, ACID local relational database, migration tool, test runners, and signed Windows packaging model; reject browser storage as the authority and keep domain transactions out of any browser shell. <!-- sdd-owner: implementation -->
- [ ] RED: create failing smoke/contract tests under `tests/architecture/` proving the UI uses an authenticated loopback API, the service owns database writes, Internet is unnecessary, only one service instance starts, and no printer/database path is exposed to the browser. <!-- sdd-owner: implementation -->
- [ ] GREEN: create the selected skeleton under `apps/web/`, `apps/service/`, `packages/contracts/`, and `packaging/windows/`, plus an ACID database readiness endpoint and documented local commands in `README.md`, sufficient to pass the architecture smoke tests. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: add `tests/architecture/startup-security.*` cases for non-loopback binding rejection, duplicate service startup, absent Internet, unavailable database, and unsupported schema; require fail-closed Spanish recovery status rather than creating an empty database. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: centralize configuration and process boundaries without introducing domain behavior; run lint, typecheck, unit, integration, and smoke commands and record exact results and rollback paths in `evidence/work-units/WU-01.md`. <!-- sdd-owner: implementation -->

### WU-02 — Silent-printing hardware proof of concept

**Dependencies:** WU-01. This optional work unit may be deferred without blocking any other MVP work unit, acceptance, or delivery. Provider exploration or integration may proceed separately, but actual-hardware evidence is required before printing is described as working or supported. **Finish:** retained evidence supports the bounded printing claim, or printing remains explicitly unavailable or unverified. **Rollback:** remove POC-only harnesses and candidate installations.

- [ ] Create `hardware/printing/poc-plan.md` and `hardware/printing/representative-ticket.json` to compare at least (a) a local print bridge such as QZ Tray, (b) an Electron/native Windows print path, and (c) a commercial local bridge such as JSPrintManager on the actual Windows terminal and USB thermal printer. <!-- sdd-owner: implementation -->
- [ ] Build isolated candidate probes under `hardware/printing/poc/` only—not production ticketing—and record OS, driver, printer model/firmware, connection, candidate/runtime versions, install privileges, and cleanup steps. <!-- sdd-owner: implementation -->
- [ ] Execute and capture evidence in `evidence/hardware/printing-poc.md` for silent no-dialog output, Internet-disconnected operation, Colombian accents, paper width, feed/cut, repeated tickets, Windows restart/startup, non-admin daily use, unplug, out-of-paper/offline, process crash, ambiguous handoff, retry, and reprint. <!-- sdd-owner: implementation -->
- [ ] Compare each candidate's loopback exposure, trust/signing/certificates, permissions, update and offline-continuity controls, rollback/support burden, redistribution/commercial licensing, recurring cost, and required notices in `hardware/printing/poc-results.md`, marking every criterion pass or fail without unsupported assumptions. <!-- sdd-owner: implementation -->
- [ ] Record explicit stakeholder acceptance, rejection, or deferral plus any selected provider and exact hardware context in `hardware/printing/accepted-provider.md`; every criterion must pass before claiming working or supported printing, while rejection, deferral, or incomplete evidence leaves printing unavailable or unverified without blocking other MVP work. <!-- sdd-owner: implementation -->

## Phase 1 — Transactional operating core

### WU-03 — Schema, migrations, command envelope, and audit spine

**Dependencies:** WU-01 and quantity/security decisions from WU-00. **Finish:** versioned local persistence supports transactional command and audit primitives. **Rollback:** restore the pre-migration database and prior compatible application.

- [ ] RED: add migration and repository contract tests under `tests/persistence/` for monotonic schema versions, exact integer COP, selected exact quantities, stable IDs, revisions, command idempotency `(type,key,actor,payload digest)`, safe audit fields, and atomic rollback. <!-- sdd-owner: implementation -->
- [ ] GREEN: add initial migrations under `apps/service/migrations/` and persistence primitives under `apps/service/src/infrastructure/persistence/` for roles/users/sessions, commands, audits, migrations, and transaction units of work. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: inject failure at each migration step and race duplicate commands under `tests/persistence/failure-concurrency.*`; prove prior schema usability, no partial migration, same-key replay, and rejection of key reuse by a different actor or payload. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: document schema/data/backup version ownership and pre-migration backup/rollback procedure in `docs/operations/migrations.md`, then record focused and clean-database upgrade results in `evidence/work-units/WU-03.md`. <!-- sdd-owner: implementation -->

### WU-04 — Identity and access vertical slice

**Dependencies:** WU-03 and ADRs 001–002. **Acceptance:** named owner/cashier authentication works offline; role denials do not mutate business state. **Rollback:** remove identity endpoints/screens and related migration only.

- [ ] RED: add `tests/access/role-matrix.*` for resolved roles/commands; display attribution snapshots; creation/reset/reactivation sharing a single-use no-time-expiry provisional password and operation block; OWNER/CASHIER self-password change with current password plus fresh OWNER authorization and no independent CASHIER authority; exact replay/reasons; no-expiry sessions; idle-lock cart preservation versus termination abandonment; revocation, last owner, and orphan transfer. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement credential hashing, common-password rejection, local sessions, request-forgery defenses, authorization policies, atomic owner bootstrap, single-use recovery-code rotation, named-account administration, and orphaned-shift transfer in `apps/service/src/identity/` with Spanish login/admin screens in `apps/web/src/features/access/`; provide no support/platform bypass. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: add concurrent claim/login/revocation, reused recovery code, creation/reset/reactivation provisional flows, OWNER/CASHIER self-password authorization, idle lock preserving cart, each termination abandoning cart, shared Windows lock, brute-force delay, deactivated/last owner, login reuse, cash movement without fresh owner authorization, exact replay versus changed payload, missing reason/authorization, denied no-mutation, and safe-audit tests under `tests/access/security.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: isolate role policy from UI flags, run the complete role matrix offline, and record exact commands, security observations, runtime login scenario, and rollback in `evidence/work-units/WU-04.md`. <!-- sdd-owner: implementation -->

### WU-05 — Catalog and opening stock vertical slice

**Dependencies:** WU-04 and ADR-003. **Acceptance:** an owner can create/edit/deactivate a product with traceable opening stock; a cashier cannot. **Rollback:** remove catalog slice and migration while preserving identity.

- [ ] RED: add `tests/catalog/catalog-opening-stock.*` for required fields, SKU uniqueness, optional-barcode uniqueness, category references, integer COP, non-negative whole-unit opening quantities, positive whole-unit sale/adjustment increments, exact integral forms such as `2.0`, fraction rejection without rounding, zero/nonzero `OPENING` ledger entries, no direct stock overwrite, gift lines with positive quantity and zero effective price, revisions, inactive discovery, cashier denial, and the future history-preserving migration boundary. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement owner catalog APIs, ACID tables/constraints, opening-stock ledger, search, and Spanish management/sellable-search screens in `apps/service/src/catalog/` and `apps/web/src/features/catalog/`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: add duplicate/stale concurrent edits, invalid precision, negative opening stock, referenced-category deletion, inactive-product, and injected-write rollback cases under `tests/catalog/catalog-boundaries.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: separate append-only stock authority from current-stock projection, verify ledger reconstruction equals product balances, and record evidence in `evidence/work-units/WU-05.md`. <!-- sdd-owner: implementation -->

### WU-06 — Shift opening vertical slice

**Dependencies:** WU-04 and WU-03. **Acceptance:** owner/cashier opens exactly one shift with retained attribution and opening COP. **Rollback:** remove shift-open slice and migration.

- [ ] RED: add `tests/shifts/open-shift.*` for no-open-shift prerequisite, opening amount/user/time, owner/cashier access, audit, and database-enforced single-open-shift behavior. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement transactional `OpenShift` in `apps/service/src/shifts/` and the Spanish opening/status UI in `apps/web/src/features/shifts/`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: race two opens, replay the same key after a lost response/restart, inject writes failures, and verify exactly one complete opening effect under `tests/shifts/open-shift-concurrency.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: keep opening cash as a deterministic source effect, run offline restart acceptance, and record results in `evidence/work-units/WU-06.md`. <!-- sdd-owner: implementation -->

### WU-07 — Cash sale vertical slice

**Dependencies:** WU-05 and WU-06. **Acceptance:** one cash sale with change commits sale, stock, shift cash, ticket snapshot, audit, and pending print job atomically; no physical printing occurs yet. **Rollback:** remove cash-checkout slice while preserving catalog and shifts.

- [ ] RED: add `tests/checkout/cash-sale.*` for active shift, active products, sufficient stock, integer-COP totals, cash tender/change/net cash, immutable line snapshots, and unchanged state on rejection. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement transactional cash confirmation in `apps/service/src/sales/`, cart/payment UI in `apps/web/src/features/checkout/`, and migrations for sales, lines, payments, stock effects, ticket snapshots, print jobs, and audits. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: inject failure after every confirmation write; race sales for the same last stock; retry after lost response/restart; prove no negative stock, partial effects, or duplicate sale/job under `tests/checkout/cash-sale-atomicity.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: centralize transaction locking and settlement invariants, run a complete offline cash-sale browser scenario, reconcile stock/cash to source records, and capture evidence in `evidence/work-units/WU-07.md`. <!-- sdd-owner: implementation -->

### WU-08 — Transfer and split sale vertical slice

**Dependencies:** WU-07. **Acceptance:** referenced transfer and cash/transfer split sales settle exactly and only net cash affects expected cash. **Rollback:** remove additional settlement modes without changing cash-sale records.

- [ ] RED: add `tests/checkout/transfer-split-sale.*` for transfer reference, exact settlement, split components, cash change, expected-cash exclusion, and missing/under/over-settlement rejection. <!-- sdd-owner: implementation -->
- [ ] GREEN: extend payment contracts, persistence, service policies, and checkout UI under `packages/contracts/`, `apps/service/src/sales/`, and `apps/web/src/features/checkout/` for `TRANSFER` and split settlement. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: add duplicate-reference policy cases, concurrent/replayed confirmation, malformed amounts, crash injection, and restart recovery proving components apply once under `tests/checkout/transfer-split-boundaries.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: unify settlement calculation without floating point, execute cash/transfer/split acceptance scenarios offline, and record payment/shift evidence in `evidence/work-units/WU-08.md`. <!-- sdd-owner: implementation -->

### WU-09 — Cart edits, price overrides, and discounts vertical slice

**Dependencies:** WU-08. **Acceptance:** pre-confirmation edits recalculate totals without stock mutation and confirmed snapshots retain actors/details. **Rollback:** remove edit controls/policies while retaining base checkout.

- [ ] RED: add `tests/checkout/cart-pricing.*` for quantity change, removal, abandonment, unit-price override, explicit discount, actor retention, final-price/no-tax calculation, and post-confirmation immutability. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement cart pricing policies/contracts and Spanish controls in `apps/service/src/sales/pricing/` and `apps/web/src/features/checkout/cart/`, retaining override/discount details only on confirmation. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: add zero/negative/excess discount, stale product revision, session identity change, concurrent catalog edit, abandoned cart, and replay cases under `tests/checkout/cart-pricing-boundaries.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: consolidate exact arithmetic and audit attribution, prove every pre-confirmation action leaves stock unchanged, and record evidence in `evidence/work-units/WU-09.md`. <!-- sdd-owner: implementation -->

### WU-10 — Owner stock adjustments vertical slice

**Dependencies:** WU-05 and WU-04. **Acceptance:** owner-only increases/decreases are reasoned, exact, non-negative, idempotent, and reconstructable. **Rollback:** remove adjustment command/UI and migration without altering opening/sale ledger entries.

- [ ] RED: add `tests/inventory/stock-adjustment.*` for role, direction, positive exact quantity, reason, actor/time, previous/resulting balances, and negative-stock rejection. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement adjustment records, ledger source uniqueness, projection update, API, and Spanish owner UI in `apps/service/src/inventory/` and `apps/web/src/features/inventory/adjustments/`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: race competing decreases, duplicate keys/source effects, stale balances, cashier attempts, and injected failures under `tests/inventory/stock-adjustment-concurrency.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: reuse stock transaction primitives without bypassing authorization, reconcile the full ledger, and record evidence in `evidence/work-units/WU-10.md`. <!-- sdd-owner: implementation -->

### WU-11 — Cash movements vertical slice

**Dependencies:** WU-06 and WU-04. **Acceptance:** deposits/withdrawals affect active-shift expected cash exactly once with complete attribution. **Rollback:** remove movement slice and migration.

- [ ] RED: add `tests/shifts/cash-movement.*` for deposit/withdrawal, positive COP amount, required reason, actor/time, active-shift requirement, and expected-cash formula. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement transactional movement command, cash-effect source, API, and Spanish UI in `apps/service/src/shifts/movements/` and `apps/web/src/features/shifts/movements/`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: add duplicate key, close-versus-movement race, stale shift, invalid amount/reason, crash injection, and restart cases under `tests/shifts/cash-movement-boundaries.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: share expected-cash derivation with reports, reconcile mixed movements/sales, and record evidence in `evidence/work-units/WU-11.md`. <!-- sdd-owner: implementation -->

### WU-12 — Owner-authorized void vertical slice

**Dependencies:** WU-08, WU-10, WU-11, and owner step-up from WU-04. **Acceptance:** one eligible void atomically preserves history, restores stock, reverses each payment, and adjusts only refunded cash. **Rollback:** remove void slice while preserving original completed sales.

- [ ] RED: add `tests/checkout/void-sale.*` for fresh owner authorization, reason, original open shift, cash/transfer/split exact reversals, stock restoration, audit, report effects, and immutable original sale. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement void/reversal tables, transactional orchestration, owner step-up UI, and Spanish outcomes in `apps/service/src/sales/voids/` and `apps/web/src/features/sales/voids/`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: inject failure after every void write; race repeated voids and shift close; test cashier request with owner authorization, cashier self-authorization denial, closed-shift denial, exact replay after restart, changed-payload rejection, and uniqueness of every stock/payment/cash effect under `tests/checkout/void-atomicity.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: use shared locking/idempotency primitives, run all three payment-mode void scenarios and no-mutation denials, and record reconciliation evidence in `evidence/work-units/WU-12.md`. <!-- sdd-owner: implementation -->

## Phase 2 — Output, insight, and recovery

### WU-13 — Ticket jobs, optional print provider, and reprint

**Dependencies:** WU-07. This work unit and provider integration may be deferred without blocking later MVP work, acceptance, or delivery. **Acceptance:** when pursued, durable jobs use retained snapshots, failures never alter sales, and ambiguous handoffs require a user decision; absent qualifying actual-hardware evidence, printing remains unavailable or unverified. **Rollback:** disable/remove provider adapter and worker while retaining sale/ticket/job records.

- [ ] RED: add `tests/ticketing/ticket-job.*` for required ticket content, one initial job, attributed reprints, leases, attempt history, `FAILED`/`UNKNOWN`, and zero sale/stock/payment/shift mutation from print commands. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement provider-neutral ticket rendering/job orchestration in `apps/service/src/ticketing/` and Spanish status/retry/reprint UI in `apps/web/src/features/ticketing/`; when provider integration is pursued, add the selected adapter in `apps/service/src/infrastructure/printing/`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: use the provider-neutral harness to simulate unplug, out-of-paper, process crash before/after handoff, abandoned lease, duplicate request, restart, and deliberate reprint under `tests/ticketing/print-recovery.*`; prohibit automatic replay of `UNKNOWN`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: isolate provider diagnostics and redact sensitive data; when claiming working or supported printing, rerun the WU-02 critical smoke set on the actual terminal/printer offline and capture commands, paper-output observations, versions, and rollback in `evidence/work-units/WU-13.md`; otherwise record printing as unavailable or unverified. <!-- sdd-owner: implementation -->

### WU-14 — Reports and reconciliation vertical slice

**Dependencies:** WU-10, WU-11, WU-12. **Acceptance:** owner reports derive deterministic sales, payment, shift, and stock values from authoritative records and expose mismatches without silent repair. **Rollback:** remove report queries/UI only.

- [ ] RED: add `tests/reports/reconciliation.*` using mixed cash/transfer/split sales, adjustments, movements, and voids to verify date filters, retained void history, component totals, expected cash, closed snapshots, and stock. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement owner-only deterministic queries/reconciliation in `apps/service/src/reporting/` and Spanish report screens in `apps/web/src/features/reports/`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: add cashier denial, duplicate-source, corrupted projection, business-date boundary, active/closed shift, and large sample-data cases under `tests/reports/report-boundaries.*`; mismatches must be reported, not overwritten. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: document source formulas and controlled projection rebuild boundary in `docs/operations/reconciliation.md`, run source-to-report comparison, and record evidence in `evidence/work-units/WU-14.md`. <!-- sdd-owner: implementation -->

### WU-15 — Shift close and automatic backup vertical slice

**Dependencies:** WU-14 and ADR-004. **Acceptance:** closure atomically retains reconciliation and one backup job; external backup success/failure is observable and never reopens the shift. **Rollback:** restore pre-close test fixtures and remove close/backup worker slice.

- [ ] RED: add `tests/shifts/close-backup.*` for job-before-I/O, lifecycle states, next-shift gate, one-shift/24-hour RPO, currently-open-shift age warnings without forced close/sale interruption, predictive capacity, destination-return automatic and owner-requested same-job retry, and success-only media disconnection. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement transactional close/job creation, an unattended encrypted worker with destination-return retry and capacity prediction under `apps/service/src/recovery/backup/`, and Spanish persistent role-appropriate status/alerts under `apps/web/src/features/recovery/`; require physically distinct removable storage and prompt disconnection only after successful artifact completion. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: race close with void/movement/second close; inject database failure, same-disk/missing/full destination, partial write, encryption/flush/finalize failure, worker crash, and non-destructive retry of the same job under `tests/recovery/closure-backup-failures.*`; prove live and closed state remains consistent and the next shift stays blocked until a complete artifact exists. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: enforce lifetime durable jobs and authoritative outcomes distinct from automatic expiry of unprotected 90-day attempt/verification detail and 30-day diagnostics; preserve protected records/artifact minima; owner-authorize artifact disposal; guard installation retirement with irreversible named-owner confirmation, recent external restore-ready backup, recorded custodian, and tombstone; record `evidence/work-units/WU-15.md`. <!-- sdd-owner: implementation -->

### WU-16 — Export, verify, and restore vertical slice

**Dependencies:** WU-15, ADR-004, and migration contract from WU-03. **Acceptance:** owner can export, objectively verify, and safely restore only the exact restore-ready artifact without exposing mixed live data. **Rollback:** external recovery journal restores the pre-restore snapshot and prior compatible application.

- [ ] RED: add `tests/recovery/export-verify-restore.*` for fresh authorization; independent custody; allowed rotation/rehearsal triggers; exact recovery; rollback/new-backup gate; staging limit; and RTO starting when compatible terminal, installable app, and latest complete artifact are available, with recovery-material retrieval/availability plus verify/restore/verify/return inside four hours. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement encrypted recovery, versioned rotation only for compromise/custody change/owner decision, and external custodian responsibility attestations in `apps/service/src/recovery/`; custodian may be another OWNER or trusted non-user but custody grants no authority/direction; journal cleanup waits for restored-state verification plus new restore-ready backup. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: test altered/truncated/missing-class/unsupported artifacts, broken relationships, inconsistent balances, unavailable/wrong/lost encryption material, unsafe key retirement, cashier or custodian authority attempts, secret redaction, concurrent business requests, and power loss at every swap stage under `tests/recovery/restore-failure-matrix.*`; prove fail-closed behavior, zero live mutation before accepted swap, and no backdoor after total material loss. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: restore exact fixtures, compare invariants/migrations, rehearse before first production shift and after material rotation, custodian change, terminal replacement, or protection-boundary change only; measure verification through return to operation within four hours, enforce seven-day failed staging unless held, and exercise guarded rollback/journal retirement before recording `evidence/work-units/WU-16.md`. <!-- sdd-owner: implementation -->

### WU-17 — Offline restart, crash recovery, and cross-slice idempotency

**Dependencies:** WU-15 and WU-16. **Acceptance:** all core workflows recover offline after process/terminal interruption with complete-or-no effects and safe durable-job states; printing-specific recovery applies only when WU-13 is pursued. **Rollback:** remove resilience orchestration while retaining prior transactional behavior.

- [ ] RED: add `tests/resilience/offline-restart.*` covering committed/rolled-back transactions, active shift, confirmed records, pending/leased/ambiguous jobs, unsupported schema, integrity failure, and Internet loss during cart/checkout. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement single-instance startup, readiness/recovery mode, database-native crash recovery checks, job lease recovery, projection checks, and Spanish diagnostics in `apps/service/src/startup/` and `apps/web/src/features/startup/`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: run a fault matrix that terminates UI/service/terminal around each transactional boundary, races duplicate commands and stock/shift operations, and proves retries return original outcomes without repeating domain effects under `tests/resilience/fault-matrix.*`. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: remove duplicated recovery logic, run the complete selling day with Internet disconnected and mid-flow restarts, and record exact state comparisons and rollback in `evidence/work-units/WU-17.md`. <!-- sdd-owner: implementation -->

### WU-18 — Regional behavior across all slices

**Dependencies:** WU-17. **Acceptance:** all user-facing, ticket, report, audit, and backup behavior consistently uses COP, Colombian Spanish, `America/Bogota`, and day-first dates with no tax breakdown. **Rollback:** revert centralized locale presentation without changing retained integer/instant data.

- [ ] RED: add `tests/regional/colombia.*` for integer COP formatting, final prices/no taxes, every user-visible status/error, Bogotá civil-time conversion, daylight/host-zone independence, and `dd/MM/yyyy` presentation. <!-- sdd-owner: implementation -->
- [ ] GREEN: centralize locale, money, time-zone, and translation behavior in `packages/contracts/src/regional/`, `apps/service/src/regional/`, and `apps/web/src/i18n/`, including ticket/report/backup metadata. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: run all workflows under non-Bogotá Windows zones, incorrect host-zone settings, date boundaries, unusual COP values, and missing-translation detection under `tests/regional/cross-workflow.*`; surface clock-health warnings without changing policy. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: remove ad hoc formatters/text, produce a cross-screen/ticket/report snapshot review, and record exact test and runtime evidence in `evidence/work-units/WU-18.md`. <!-- sdd-owner: implementation -->

## Phase 3 — Windows delivery and pilot

### WU-19 — Installer, security hardening, and operations

**Dependencies:** WU-18. **Acceptance:** a signed Windows package installs, starts, upgrades, rolls back, and operates offline under least privilege on the supported terminal; absent printing does not block package acceptance or release and is labeled unavailable or unverified. **Rollback:** uninstall package and restore the pre-install/pre-upgrade verified dataset.

- [ ] RED: add packaging acceptance scripts under `tests/packaging/windows/` for clean install, service/UI startup order, loopback binding, single instance, filesystem ACLs, non-admin operation, no-Internet startup, upgrade migration, failed upgrade rollback, uninstall data policy, and executable signature checks. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement installer/service launcher/signing configuration under `packaging/windows/` and operator procedures in `docs/operations/install-runbook.md` and `docs/operations/backup-restore-runbook.md`; add `docs/operations/printer-runbook.md` when printing is pursued, otherwise document printing as unavailable or unverified in release and operator materials. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: validate normalized backup inputs, local API abuse cases, log/credential redaction, database/backup permissions, full disk, clock warning, and anti-malware/firewall interactions on the actual terminal under `tests/security/local-threats.*`; validate printer inputs and driver/provider changes only when printing is included. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: perform clean-install, upgrade, offline restart, backup/verify/restore, and uninstall/recovery rehearsals on the supported Windows image; perform printer smoke only when claiming working or supported printing, then record versions, exact commands/results, changed-line count, and rollback in `evidence/work-units/WU-19.md`. <!-- sdd-owner: implementation -->

### WU-20 — Pilot preparation and rehearsal

**Dependencies:** WU-19. **Acceptance:** stakeholders have objective entry/exit criteria, trained named users, rehearsed recovery, and a reversible pilot package; unavailable or unverified printing does not block pilot entry or exit. **Rollback:** stop pilot, preserve/export evidence and data, restore the pre-pilot verified snapshot, and reinstall the prior accepted package.

- [ ] Create anonymized but realistic products, categories, opening stock, cash/transfer/split sales, voids, movements, and reconciliation fixtures in `pilot/sample-data/`, with expected totals in `pilot/sample-data/expected-results.md`. <!-- sdd-owner: implementation -->
- [ ] Create role-specific Colombian-Spanish training in `pilot/training/owner.md` and `pilot/training/cashier.md` covering login, shift, checkout, price edits, movements, void authority, close, reports, backup alerts, and escalation; include printing recovery only when printing is available, otherwise state that it is unavailable or unverified. <!-- sdd-owner: implementation -->
- [ ] Define measurable pilot entry/exit criteria in `pilot/pilot-plan.md`: all critical non-printing tests green, verified off-device backup, trained named users, no unresolved data-loss/security defect, transaction/reconciliation accuracy, restart recovery time, backup completion/verification rate, and operator task success; require an accepted hardware matrix and print success/recovery rate only when claiming working or supported printing. <!-- sdd-owner: implementation -->
- [ ] Rehearse clean install, named-user provisioning, sample-data load, offline selling day, active-shift restart, backup destination failure, export/verify/restore, failed-restore rollback, upgrade rollback, and uninstall/recovery on the actual terminal; rehearse printer failure/recovery only when printing is included, and retain timestamps and results in `evidence/pilot/rehearsal.md`. <!-- sdd-owner: implementation -->
- [ ] Record pilot monitoring, support ownership, issue severity/stop conditions, daily backup checks, rollback triggers, data-preservation steps, and final success-metric review in `pilot/operations-and-rollback.md`; unresolved release-critical failure keeps pilot entry unmet. <!-- sdd-owner: implementation -->

## Recommended PR/work-unit boundaries

After the required ask-on-risk decision, prefer one numbered work unit per chained PR. WU-00 is an evidence-heavy prerequisite, WU-01 establishes the runnable base, and WU-02 is an optional printing evidence stream that may be deferred. WU-03 through WU-18 each deliver one vertical behavior with tests and documentation, except that WU-13 may be deferred with printing. WU-19 and WU-20 isolate packaging and pilot risk. If any work unit exceeds 400 authored changed lines, split once at a runnable contract boundary—for example service/domain first with executable API acceptance, then browser UI consuming that accepted contract—while keeping tests with each behavior and documenting predecessor/next-PR links. Generated installer outputs and generated fixtures must be identified separately but remain included in artifact inventories.

## Dependency summary

`WU-00 → WU-01 → WU-03 → WU-04`; optional `WU-01 → WU-02`; `WU-04 → WU-05/WU-06`; `WU-05 + WU-06 → WU-07 → WU-08 → WU-09`; `WU-05 → WU-10`; `WU-06 → WU-11`; `WU-08 + WU-10 + WU-11 → WU-12 → WU-14`; optional `WU-07 → WU-13`; `WU-14 → WU-15 → WU-16 → WU-17 → WU-18 → WU-19 → WU-20`.

WU-02 and WU-13 are deferrable printing streams and are not predecessors of the remaining MVP path. Provider exploration or integration may proceed without accepted WU-02 evidence, but release and operational materials must label printing unavailable or unverified until actual-hardware evidence supports a working or supported claim. WU-07 retains provider-neutral ticket snapshots and initial print-job records regardless of printing availability. Catalog, identity, and backup/recovery work MUST consume the resolved issue #5 policies before implementation. They remain blocked only on recording the ADR/evidence artifacts and selecting the explicitly deferred implementation mechanisms; the owner MUST NOT be asked to decide #6–#11 again.

## Traceability

| Work units | Specification/design coverage |
| --- | --- |
| WU-00, WU-04, WU-12 | `specs/access-control/spec.md`; design identity/session, role matrix, attribution, and owner step-up |
| WU-06, WU-11, WU-15 | `specs/cash-shifts/spec.md`; design single-open-shift constraint, expected-cash formula, immutable closure, unique backup job |
| WU-05, WU-07, WU-10, WU-12 | `specs/catalog-inventory/spec.md`; design stock ledger/projection, strict non-negative and exactly-once effects |
| WU-07–WU-09, WU-12 | `specs/sales-checkout/spec.md`; design atomic confirmation, settlement, immutable snapshots, exact void reversals |
| WU-02, WU-07, WU-13, WU-19 | `specs/tickets-printing/spec.md`; design post-commit jobs, `UNKNOWN` recovery, provider port, actual-hardware gate |
| WU-01, WU-03, WU-15–WU-17, WU-19 | `specs/offline-data-recovery/spec.md`; design local authority, migrations, durable jobs, objective verification, isolated restore, safe replacement |
| WU-12, WU-14, WU-15 | `specs/reports-reconciliation/spec.md`; design authoritative queries, void-preserving totals, projection checks, closed snapshots |
| WU-18 and acceptance checks in every UI-facing unit | `specs/colombia-regional-behavior/spec.md`; design integer COP, final prices, Colombian Spanish, `America/Bogota`, day-first dates |
| WU-01–WU-20 | `design.md` deployment, module, transaction, security, failure, migration, validation, rollout, and operations decisions |

## Explicit non-goals

No work unit may introduce Siigo integration or migration, cloud authority, multiple stores/terminals, synchronization, card payments, payment-terminal integration, customer credit, taxes/fiscal integration, returns, exchanges, post-close corrections, suppliers, purchase orders, loyalty, ecommerce, advanced analytics, draft-cart restart persistence, or an exactly-once physical-print claim. A browser shell may host presentation only; it may not own domain transactions. Printing selection cannot be inferred from framework convenience, and backup failure cannot reopen a closed shift.

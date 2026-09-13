# Proposal: Define MVP foundations

## Intent

Establish an approved, testable product boundary for the first usable Mundo Kawaii POS release. This proposal turns the confirmed planning decisions into a stable basis for later specifications and design while deliberately avoiding implementation and premature architecture choices.

## Business problem

Mundo Kawaii needs to complete a normal in-store selling day even when Internet access is unavailable. The store needs one reliable place to record sales, collect supported payments, control stock, operate and reconcile cash shifts, issue tickets, and review basic results. Without a defined MVP boundary, these workflows risk being handled inconsistently, stock and cash records can diverge, and later architecture work could overbuild toward Siigo parity, multi-device synchronization, or unsupported hardware assumptions.

## Target users and operating context

- **Cashier:** operates the single Windows sales terminal during a shift, prepares and confirms sales, collects payment, records permitted cash movements, and prints or reprints tickets.
- **Owner:** can perform cashier workflows and is responsible for catalog and stock administration, owner-authorized voids, backup and recovery operations, and basic business review.
- **Operating context:** one physical store, one Windows terminal, one locally owned dataset, and one active cash shift. Core selling-day operations must continue without Internet access.

The product is an independent POS. Siigo is only a workflow and visual reference; integration, migration, terminology parity, and feature parity are not goals.

## Product outcome

After the MVP is delivered, Mundo Kawaii can complete this offline selling-day flow on the supported terminal:

1. Open the single active cash shift with an initial cash amount.
2. Find in-stock products in the local catalog and prepare a sale.
3. Collect cash, transfer, or a cash/transfer split payment.
4. Confirm the sale atomically, persist it locally, reduce stock, update shift totals, and retain the ticket data; printing may follow when available.
5. Continue operating after application restarts without losing confirmed sales, stock changes, or active-shift state.
6. Record controlled cash deposits or withdrawals and, while the original shift remains open, void a completed sale with owner authorization and an audit trail.
7. Close and reconcile the shift, automatically write a backup to the owner-configured location, then review basic sales, payment, cash, and stock results.
8. Protect local business data with owner-driven backup export, objective verification, and restore.

## MVP scope and capabilities

### Sales and checkout

- Find products from the local catalog and add them to a sale.
- Edit quantities, remove products, override unit prices, and apply explicit discounts before payment.
- Calculate totals in Colombian pesos using final catalog prices without an MVP tax breakdown.
- Accept cash, transfer, and cash/transfer split payments.
- Calculate cash change where applicable.
- Require payment to settle the sale before confirmation.
- Require a reference for every transfer component.
- Confirm and persist a completed sale, its line details, payment breakdown, stock effects, and shift effects.
- Block checkout when any requested quantity exceeds available stock, leaving sale, stock, and shift totals unchanged.

### Cash shifts and movements

- Maintain only one active cash shift on the terminal.
- Open a shift with an initial cash amount and associate confirmed sales with that shift.
- Record cash deposits and withdrawals with amount, reason, user, and timestamp.
- Calculate expected cash from the opening amount, cash received and change, authorized cash movements, and applicable void adjustments.
- Close a shift with counted cash and retain the expected-versus-counted difference.
- Preserve the active shift and its financial state across application restarts.

### Catalog and strict stock

- Maintain products with name, SKU/code, optional barcode, final selling price, stock, category, and active status.
- Reduce stock only when a sale is confirmed.
- Prevent stock from becoming negative through checkout.
- Allow owner-only stock adjustments with direction, quantity, reason, user, timestamp, and resulting balance.
- Keep pre-confirmation cart edits from changing catalog stock.

### Voids and auditability

- Allow a completed sale to be voided only with owner authorization, a recorded reason, and while its original shift remains open.
- Reverse each original payment component exactly once, reduce expected cash by the refunded cash component, restore the voided quantities to stock, and update reports.
- Preserve the original sale and retain an audit record of the void rather than erasing transaction history.
- Keep closed shifts immutable; post-close sale correction is outside the MVP void workflow.

Returns and exchanges are not introduced by this void capability.

### Tickets and printing

- Produce a ticket containing store identity, sale number, timestamp, cashier, items, prices, payment breakdown, and change.
- Support reprinting a confirmed sale's ticket.
- Treat a print failure as a recoverable output failure: it must not roll back or duplicate a confirmed sale.
- Provide silent/direct printing to a USB thermal printer on Windows without showing a browser print dialog.

The print bridge is intentionally unresolved. QZ Tray, an Electron-based approach, JSPrintManager, or another approach may be evaluated, but none is selected by this proposal. Printing remains a planned capability, but its proof of concept, provider selection, integration, and availability MUST NOT block MVP implementation, acceptance, or delivery; all remaining work may proceed while printing is pending or deferred. Any claim that silent/direct printing works or is supported requires retained evidence from the actual Windows terminal and USB thermal printer covering offline operation, installation and recovery, ticket output, failure handling, compatibility, and relevant trust, update, and licensing constraints. Until that evidence exists, release and operational materials must state honestly that printing is unavailable or unverified. All implementation still requires later authorization.

### Basic reports

- List completed sales and their status.
- Review or filter sales by date.
- Show totals by cash and transfer payment components.
- Show shift opening cash, cash movements, expected cash, counted cash, and reconciliation difference.
- Show current stock levels.
- Reflect authorized voids without deleting their audit history.

### Offline persistence, backup, and recovery

- Keep the primary selling-day workflow available without Internet access.
- Persist confirmed sales, payment details, stock changes, audit records, cash movements, and shift state locally on the single terminal.
- Preserve confirmed state across normal application restarts.
- Automatically create a backup when a shift closes and write it to an owner-configured backup location.
- Allow the owner to export, verify, and restore a backup.
- Verify backup completeness and version metadata, validate integrity, and validate restore readiness without mutating live state before acceptance.

### Regional behavior

- Use Colombian pesos (COP).
- Present user-facing language in Colombian Spanish.
- Use the `America/Bogota` time zone.
- Present dates in day/month/year order.

## Business rules and invariants

1. A sale can be confirmed only against the single active shift and only when its accepted payment components settle the total.
2. Cash may exceed the amount due and produce change; every transfer component requires a reference.
3. Confirmation must not partially apply: sale persistence, stock reduction, payment attribution, and shift effects remain consistent.
4. Insufficient stock blocks confirmation and causes no sale, stock, or shift mutation.
5. Prices are final amounts in the MVP; no tax breakdown or configurable tax calculation is introduced.
6. Cashiers may edit the cart, override unit prices, and apply explicit discounts only before payment is confirmed.
7. Completed-sale voids require owner authorization and a reason, are permitted only while the original shift remains open, reverse each original payment component, reduce expected cash by the refunded cash component, restore stock, update reports, and preserve the original sale plus an audit record; closed shifts are immutable.
8. Stock adjustments are owner-only and must preserve a traceable before/after result through the recorded resulting balance.
9. Cash deposits and withdrawals must retain amount, reason, user, and time and must affect expected cash consistently.
10. Printing occurs after or independently from durable sale confirmation; a printing failure never reverses the sale, and reprinting never creates another sale.
11. Closing a shift must automatically write a backup to the owner-configured location; owner-controlled export, objective verification, and restore are required safeguards for the terminal's local data.
12. The implementation must not assume Internet availability for core selling-day work.

## Explicit non-goals

- Siigo integration, data migration, terminology parity, or full workflow parity.
- Multiple stores, multiple concurrent terminals, device synchronization, shared cloud state, or conflict resolution.
- Card payments, payment-terminal integration, customer credit, or payment methods beyond cash and transfer.
- Full accounting, tax calculation, fiscal-platform integration, or tax breakdown on tickets.
- Returns, exchanges, supplier management, purchase orders, loyalty programs, ecommerce synchronization, or advanced analytics.
- Selecting an application framework, database, print bridge, or detailed architecture in this proposal.
- Creating specifications, design artifacts, task plans, implementation code, or deployment changes as part of this change phase.

## Affected areas

| Area | Expected impact |
| --- | --- |
| Store operations | Establishes a single offline workflow for opening, selling, cash handling, printing, reconciliation, and recovery. |
| Cashiers | Defines permitted checkout edits, supported payments, transfer evidence, shift responsibilities, and ticket recovery. |
| Owner controls | Introduces privileged stock adjustments, void authorization, reporting, and backup/restore responsibilities. |
| Sales and inventory data | Requires consistent local records and auditable links among sales, payments, stock, shifts, movements, and voids. |
| Reporting | Requires totals to reconcile with payment splits, cash movements, voids, and current stock. |
| Windows hardware | Keeps silent USB thermal printing planned and requires real-hardware evidence before it is described as working, without making it an MVP release gate. |
| Support and recovery | Adds operational procedures for printer failure, ticket reprint, automatic backups, verification, and restore. |
| Future specification/design | Supplies the approved boundary and invariants while leaving technical choices unresolved. |

## Risks and mitigations

| Risk | Consequence | Mitigation or gate |
| --- | --- | --- |
| Silent USB printing cannot yet be shown reliable on the actual hardware | Printing remains unavailable or unverified, but MVP progress and delivery continue. | Defer printing when necessary, label it unavailable or unverified, and require retained actual-hardware evidence before claiming support; do not block other MVP work or delivery. |
| Local-only storage is lost or corrupted | Sales, stock, and shift history may become unrecoverable. | Require a backup at shift closure, owner-configured destination, completeness and version metadata checks, integrity validation, and non-mutating restore validation before acceptance. |
| Sale, stock, payment, and shift updates diverge | Inventory and cash reports become untrustworthy. | Require atomic confirmation semantics and unchanged state on blocked checkout. |
| Price overrides or discounts are misused | Revenue leakage or difficult reconciliation may occur. | Attribute actions to users and retain sale details; later specifications must make audit expectations observable. |
| Void or cash-movement handling is incomplete | Expected cash and historical reports may be incorrect. | Preserve reasons, users, timestamps, original records, and consistent adjustment rules. |
| Offline and restart behavior is underspecified | The terminal may fail during normal connectivity loss or restart. | Add explicit offline, restart, backup, and restore scenarios in subsequent specifications. |
| MVP scope expands toward reference-product parity | Delivery is delayed by unrelated workflows and integrations. | Enforce the explicit non-goals and treat Siigo material as non-binding reference only. |

## Rollback

This phase changes planning documentation only and creates no runtime or data migration impact. If the proposal is rejected, rollback consists of removing or reverting this proposal and returning to the confirmed pre-proposal decision state. Once later artifacts exist, any product-boundary rollback must also revise dependent specifications, design, and tasks before implementation is authorized. No implementation dependency may be adopted based solely on this proposal.

## Success criteria

The proposal is successful when:

1. Stakeholders can describe the first release as an independent, offline-first POS for one store, one Windows terminal, and owner/cashier roles without relying on Siigo behavior.
2. Later specifications can derive observable scenarios for checkout, strict stock, cash/transfer/split settlement, shifts, cash movements, voids, reports, restart persistence, and backup recovery without inventing new product scope.
3. An offline cash sale, transfer sale, and split sale can each be specified to preserve correct sale, payment, stock, and shift records.
4. An insufficient-stock attempt can be specified to leave sale, stock, and shift totals unchanged.
5. A restart can be specified to preserve the active shift and all confirmed operational records.
6. Ticket printing can fail without reversing the sale, and a ticket can be reprinted without duplicating the sale.
7. The required ticket content, COP/Colombian Spanish/`America/Bogota` regional behavior, and day/month/year date presentation are unambiguous.
8. Owner-authorized voids during the original open shift, owner-only stock adjustments, and cash deposits or withdrawals can be traced by reason, user, time, and deterministic financial or stock effect; closed shifts remain immutable.
9. Shift closure can be shown to create a backup at the owner-configured location, and backup export, objective verification, and restore can be validated as owner workflows.
10. Pending or deferred printing does not block MVP implementation, acceptance, or delivery; printing is reported as unavailable or unverified until retained evidence from the actual Windows terminal and USB thermal printer supports any claim that it works.
11. Multi-store, multi-terminal, synchronization, Siigo integration, and other deferred capabilities remain outside the MVP.

## Follow-on boundary

The next authorized phase may create capability specifications from this proposal. Architecture and design must preserve these product rules and may compare implementation options. Printing implementation and its proof of concept may be deferred and never block MVP implementation, acceptance, or delivery; any printing claim still requires honest evidence from the actual supported hardware. This proposal does not authorize any implementation.

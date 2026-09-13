# Exploration: MVP foundations

> **Historical point-in-time record:** This document preserves the discovery evidence and unresolved questions as they stood before the later planning artifacts were written. The list under “Decisions blocking proposal readiness” is historical, not a statement of current decision status: its items were subsequently resolved in `preproposal.md`, `proposal.md`, and the capability specifications under `specs/`. Any historical printing prerequisite below is superseded: printing remains planned but may be deferred and must never block MVP implementation, acceptance, or delivery; it must be reported as unavailable or unverified until actual-hardware evidence supports a working claim. This note does not rewrite or erase the original exploration evidence, and this planning session authorizes no implementation.

## Purpose

Establish the evidence boundary for the first Mundo Kawaii POS release before proposal, specification, design, and task artifacts are written. This repository is planning-only; no implementation assumptions are treated as approved scope.

## Evidence reviewed

- `openspec/config.yaml`: confirms an independent, offline-first POS for one store and one terminal; owner and cashier roles; checkout, shifts, catalog/strict stock, basic reports, cash/transfer/split payments, printable tickets, and local persistence; implementation is unauthorized.
- `docs/planning/mvp-boundary.md`: provides the current product outcome, required capabilities, acceptance scenarios, explicit deferrals, and an open-decision list.
- `README.md`: contains no additional product or technical constraints.
- External Siigo screenshots in `/home/reos156/proyectos/mundo-kawaii-pos/assets/siigo-pos/`: show reference workflows for product search/cart editing, payment entry, shift opening/closing, shift history/detail, and sales reports/filtering.

## Approved product decisions

These are the baseline decisions to carry into the proposal and later artifacts:

- The product is an independent POS; there is no Siigo integration, migration, or parity requirement.
- MVP topology is one physical store and one terminal/device.
- Roles are owner and cashier.
- MVP capabilities are sales/checkout, cash shifts, local catalog, strict stock control, and basic reports.
- Accepted payments are cash, transfer, and a cash/transfer split.
- Checkout is blocked when requested quantity exceeds available stock.
- The MVP produces a printable ticket.
- Confirmed sales, stock changes, and shift state persist locally across restarts and core selling works offline.
- Multi-store, multi-terminal, synchronization, and implementation work are deferred or unauthorized.

## Reference-derived inference (not approved decisions)

The screenshots can inform vocabulary and candidate flows, but must not be copied as requirements:

- Search appears to support product name/reference/code, with category or favorite navigation.
- A cart line can be quantity-edited or removed without changing the catalog product.
- Payment entry may present cash shortcuts, transfer/online-payment rows, remaining amount, and change.
- Shift flows show an opening cash amount, a shift list/detail view, payment totals, cash movements, expected-versus-counted cash, and a reconciliation difference.
- Reports show a sales table with date/payment-method summaries, date filters, seller filters, status filters, and export affordances.
- The reference includes customers, taxes/charges, cards/online payments, credit, document types, Excel export, and cloud-oriented product creation; none are MVP commitments. Visual styling and Siigo terminology are likewise non-binding.

## Current flow evidence

The planning brief establishes this happy path: open a shift; add in-stock products; collect cash, transfer, or both; confirm and persist the sale; reduce stock; print a ticket; close/reconcile the shift; review basic sales and cash results. It also requires that an insufficient-stock attempt leave sale, stock, and shift totals unchanged, and that a restart preserve active-shift state and confirmed data.

The brief does not yet define enough operational rules for unambiguous acceptance around permissions, pricing/tax calculation, cash movement, payment evidence, cancellation, or printing/backups.

## Decisions blocking proposal readiness

These are product or user-flow decisions, rather than implementation choices, that should be resolved or explicitly time-boxed in the proposal:

1. **Access rules:** Is login required; how are owner/cashier identities represented; may one person hold both roles; which actions are owner-only (catalog/stock, reports, closing or reopening a shift)?
2. **Shift lifecycle:** Is only one shift active on the terminal; can a cashier open a second shift; who may close it; what happens to an abandoned/open shift after restart; are sales forbidden without an open shift?
3. **Price and tax policy:** Are displayed prices tax-inclusive; are taxes out of scope or configurable; what rounding and currency precision apply? This determines sale totals, tickets, reports, and stock-independent calculations.
4. **Discounts and line edits:** Are discounts excluded; can the cashier override a unit price; can a completed sale be voided or cancelled before/after payment? The reference shows line editing but does not establish authorization or scope.
5. **Cash movements:** Are deposits and withdrawals required during a shift, or is expected cash only opening cash plus cash received minus change? If supported, who records/approves them and how do they affect reconciliation?
6. **Payment completion rules:** Must cash plus transfer equal the total exactly; may cash exceed the remainder and produce change in a split; is transfer confirmation/reference required; can payment be edited after a failed print?
7. **Ticket contract:** What fields are required operationally or legally (store identity, timestamp, sale number, cashier, items, tax, payment breakdown, change); is printing immediate, retryable, or optional when no printer is available?
8. **Catalog minimum:** Beyond name, selling price, and quantity, are SKU/barcode, category, unit, active/inactive status, or low-stock fields required? How is stock initially entered or adjusted, and must adjustments be audited?
9. **Backup/recovery:** How does the owner create, restore, or export a local backup, and what is the expected behavior after device failure? Offline persistence across normal restarts does not define disaster recovery.
10. **Operational target:** Which operating system/device and printer connection types are in the MVP, and which currency/locale/date rules apply? Printable tickets cannot be validated without a supported target.

## Safe proposal posture if decisions remain open

The proposal may proceed only if it records the unresolved items as explicit product assumptions, exclusions, or follow-up decisions with owners. Architecture, framework, database, and printer-library choices should not be inferred from the screenshots. The highest-risk blockers are payment/shift rules, tax and pricing policy, access permissions, ticket requirements, and the supported terminal/printer target.

## Out of scope confirmed by evidence

No Siigo integration or migration, multi-store or multi-terminal coordination, card/payment-terminal integration, full accounting/fiscal integration, returns, exchanges, credit, suppliers, purchase orders, loyalty, ecommerce synchronization, advanced analytics, or code implementation should enter this change without new approval.

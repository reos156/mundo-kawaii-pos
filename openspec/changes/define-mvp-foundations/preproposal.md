---
schema: gentle-ai.sdd-preproposal/v1
revision: 3
change: define-mvp-foundations
proposal_ready: true
---

# Pre-proposal decision state

**Status:** Product decisions confirmed; printing is planned but non-blocking and may be deferred

**Exploration reference:** `openspec/changes/define-mvp-foundations/exploration.md`

**Research reference:** `openspec/changes/define-mvp-foundations/research.md`

## Confirmed product decisions

- The product is an independent POS; Siigo is a reference only.
- MVP targets one physical store and one Windows terminal with owner and cashier roles.
- MVP covers sales, one active cash shift, local catalog, strict stock, basic reports, and local restart-safe persistence.
- Accepted payments are cash, transfer, and cash/transfer split; payment must settle the sale, cash may produce change, and transfer requires a reference.
- Insufficient stock blocks checkout.
- Catalog prices are final amounts without an MVP tax breakdown.
- Cashiers may edit quantities, remove products, override unit prices, and apply explicit discounts before payment.
- Owner-authorized voids require a reason, restore stock, adjust shift totals, and leave an audit record.
- Cash deposits and withdrawals record amount, reason, user, and time.
- Tickets include store identity, sale number, timestamp, cashier, items, prices, payment breakdown, and change.
- A print failure does not roll back a confirmed sale; reprinting is supported.
- Products include name, SKU/code, optional barcode, final selling price, stock, category, and active status.
- Owner-only stock adjustments record direction, quantity, reason, user, timestamp, and resulting balance.
- Automatic backups and owner-driven export, verification, and restore are required.
- Regional settings are COP, Colombian Spanish, `America/Bogota`, and day/month/year dates.
- Silent/direct printing to a USB thermal printer on Windows without a browser print dialog remains a planned capability, not an MVP implementation, acceptance, or delivery prerequisite.
- Multi-store, multi-terminal, synchronization, and implementation are outside this change.

## Deferred design decision

Printing architecture selection is intentionally deferred. A hardware proof of concept should test candidate approaches against the actual Windows terminal and USB thermal printer, but neither that proof of concept nor printing implementation may block MVP implementation, acceptance, or delivery. Proposal and specification may define the required behavior without selecting QZ Tray, Electron, or JSPrintManager.

Printing may remain pending or be deferred while all other MVP work proceeds. No printing approach may be described as working or supported without retained evidence from the actual hardware; until then, release and operational materials must state honestly that printing is unavailable or unverified. All implementation still requires later authorization.

The user explicitly removed the blocked research comparison from proposal readiness on 2026-09-08. The blocked research record remains as an audit artifact and must not be presented as validated evidence.

## Research request

Compare QZ Tray, an Electron wrapper using `webContents.print`, and Neodynamic JSPrintManager for silent USB thermal printing by an offline-first web POS on one Windows terminal. Evaluate offline behavior, silent operation, trust/key risk, installation, updates, compatibility and ESC/POS unknowns, licensing unknowns, recovery, and workload. Preserve the provenance of first-party observations and parent-fetched official passages. Recommend a hardware proof-of-concept gate rather than an unsupported final dependency selection.

## Requested evidence classes

- User-provided operational evidence
- Official vendor documentation
- Official web-platform documentation

## Admission outcome

| Field | Value |
|---|---|
| Outcome | Denied; research blocked |
| Observed documentation grants | `[]` |
| Observed open-web grants | `[]` |
| Validated claims | None |
| Architecture recommendation | None |

## Evidence references

- Exploration input: `openspec/changes/define-mvp-foundations/exploration.md`
- Blocked research record: `openspec/changes/define-mvp-foundations/research.md`
- Admitted external evidence: none
- Unadmitted corrective input: user-provided Siigo observation and parent-fetched passages attributed to QZ Tray, Electron, JSPrintManager, and MDN

## Post-specification gate

**Status:** Resolved.

- An automatic backup is created when a shift closes and is written to an owner-configured backup location.
- A sale may be voided only while its original shift remains open.
- Voiding reverses each original payment component, reduces expected cash by refunded cash, restores stock, updates reports, and preserves the original sale plus audit record.
- Closed shifts are immutable in the MVP; correcting a sale after shift closure is outside the void workflow.

## Proposal gate

`proposal_ready` is **true**. Product decisions are confirmed. The proposal must preserve silent offline printing as a planned capability while making printing and its proof of concept non-blocking for MVP implementation, acceptance, and delivery. Pending printing must be reported as unavailable or unverified, and a working/supported claim requires retained actual-hardware evidence.

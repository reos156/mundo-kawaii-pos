# Define the first usable Mundo Kawaii POS release

This brief records the confirmed MVP boundary for an independent, offline-first, single-store point-of-sale system. Siigo is a workflow and visual reference only; the MVP does not integrate with or reproduce Siigo by default.

**Status:** Confirmed planning baseline, aligned with pre-proposal revision 3 and the approved proposal/specifications

**Target:** One physical store, one Windows sales terminal

This planning baseline authorizes the proposal, specifications, design, and task planning only. It does not authorize implementation.

## Product outcome

The MVP must let Mundo Kawaii complete a normal selling day without depending on an Internet connection:

1. An authenticated cashier or owner opens the single active cash shift.
2. The user adds in-stock products to a sale and makes permitted pre-payment cart edits.
3. The customer pays with cash, transfer, or both.
4. The POS atomically records the sale, reduces stock, updates the shift, and produces a ticket for direct thermal printing.
5. The user can record controlled cash movements and an owner can void an eligible sale while its original shift remains open.
6. The user closes and reconciles the shift, which triggers an automatic local backup.
7. The owner reviews basic sales, payment, cash, and stock results and can manage backup recovery.

## Users and access

Local authentication is required and must work without Internet access.

| Role | Confirmed MVP access |
| --- | --- |
| Cashier | Open and close shifts, prepare and settle sales, record cash movements, and print or reprint tickets. |
| Owner | Use all cashier capabilities; exclusively manage the catalog, adjust stock, authorize eligible voids, review business reports, and configure, export, verify, or restore backups. |

Actions are attributed to the authenticated identity. Auditable actions include stock adjustments, cash movements, price overrides, discounts, sale confirmations, voids, and applicable backup recovery operations.

## Confirmed operating rules

| Area | Confirmed decision |
| --- | --- |
| Shift | The terminal permits at most one active shift. Opening records the initial cash, user, and time; closing records expected cash, counted cash, their difference, user, and time. Closed shifts are immutable. |
| Pricing and tax | All amounts use COP. Catalog and effective sale prices are final customer amounts; the MVP has no configurable tax calculation or separate tax breakdown. |
| Cart edits | Before confirmation, an owner or cashier may change quantities, remove lines, override unit prices, and apply explicit discounts. Confirmed sales cannot be edited as carts, and all pricing edits retain user attribution and sale details. |
| Payment | Cash, referenced transfer, and cash/transfer split are supported. Accepted components must settle the total; cash may exceed the amount due and produce change. Only net cash affects expected physical cash. |
| Void | Only an owner may void a completed, non-voided sale, with a reason, while its original shift is open. The void preserves the original sale and audit record, restores stock, reverses each payment component exactly once, adjusts expected cash by the refunded net cash, and updates reports. Returns, exchanges, and post-close corrections are not introduced. |
| Cash movements | An authenticated owner or cashier may record a deposit or withdrawal against the active shift. Each movement retains type, amount, reason, user, and timestamp and affects expected cash exactly once. |
| Ticket | A confirmed sale's ticket includes store identity, sale number, timestamp, cashier, items, effective prices, payment breakdown, and change. A print failure does not roll back or duplicate the sale, and owner or cashier reprinting is supported. |
| Catalog and stock | Owner-managed products include name, SKU/code, optional barcode, final selling price, stock, category, and active status. Stock changes on confirmed sales, eligible voids, or owner-only audited adjustments; insufficient stock blocks checkout and stock never becomes negative. |
| Backup and restore | Shift closure automatically writes a backup to an owner-configured location and exposes the result. The owner can export, objectively verify, and restore a backup; verification covers completeness, supported version metadata, integrity, and isolated restore readiness before live restore. |
| Platform and printing | The MVP is web-based on one Windows terminal and must print silently/directly to the actual USB thermal printer without a browser print dialog, including offline. |
| Locale | User-facing text is Colombian Spanish, currency is COP, operational time uses `America/Bogota`, and dates use day/month/year order. |
| Printing gate | No print bridge is selected. Before selection, integration, or shipment of the production printer provider/adapter, a mandatory proof of concept on the actual Windows terminal and USB printer must validate silent and offline operation, installation and recovery, ticket output, failure handling, compatibility, trust, updates, and licensing. Technical foundation, non-printing MVP work, and provider-neutral ticket snapshots, print jobs, UI recovery, and retries are not blocked by this gate when separately authorized, and an isolated proof-of-concept harness may be built after the base runtime and test foundation exists. The production printer provider/adapter may not be selected, integrated, or shipped until the evaluated approach is explicitly accepted. |

## Required capabilities

### Sales and checkout

- Find active products in the local catalog and add them to a sale.
- Make the confirmed pre-payment cart edits described above without changing stock.
- Settle the sale with cash, referenced transfer, or a cash/transfer split.
- Calculate cash change where applicable.
- Confirm the sale as one consistent outcome across sale details, payment attribution, stock, and shift effects.
- Block confirmation when stock is insufficient or payment does not settle the total, leaving business state unchanged.

### Cash shifts and reporting

- Open, operate, persist, close, and reconcile the single active shift.
- Record audited deposits and withdrawals.
- Calculate expected cash from opening cash, net cash payments, movements, and eligible void adjustments.
- List completed and voided sales by date and report cash and transfer components separately.
- Show shift opening, movements, expected cash, counted cash, difference, and current stock levels.

### Catalog, inventory, and audit

- Let owners create and edit products and make traceable stock adjustments.
- Enforce strict non-negative stock at checkout and during adjustments.
- Retain user, reason, time, and deterministic effects for privileged or financially significant actions where specified.

### Offline operation and recovery

- Complete the primary selling-day flow without Internet access.
- Persist confirmed sales, payment details, stock changes, audit records, cash movements, and shift state locally on the single terminal.
- Preserve each confirmed effect exactly once across normal application restarts.
- Create the closure-triggered backup and support owner-controlled export, verification, and consistent restore.

## MVP constraints

| Area | Decision |
| --- | --- |
| Product boundary | Independent POS; no Siigo integration. |
| Store topology | One physical store. |
| Terminal topology | One Windows sales terminal/device. |
| Roles | Locally authenticated owner and cashier identities; owners inherit cashier capabilities. |
| Inventory behavior | The POS owns catalog and stock; insufficient stock blocks checkout. |
| Payments | Cash, transfer, and cash/transfer split payments only. |
| Receipt | Recoverable, reprintable thermal ticket with confirmed required content. |
| Connectivity | Core operation and supported printing must remain available offline. |
| Implementation | Not authorized by this planning baseline; only selection, integration, and shipment of the production printer provider/adapter remain behind the accepted real-hardware proof-of-concept gate. |

## Explicitly deferred

- Multiple stores.
- Multiple concurrent sales terminals.
- Synchronization between independently offline devices.
- Siigo integration or migration.
- Card payments or payment-terminal integration.
- Full accounting or fiscal-platform integration.
- Feature parity with every workflow visible in the Siigo references.

The following are not included until explicitly approved: returns, exchanges, customer credit, supplier management, purchase orders, loyalty programs, ecommerce synchronization, and advanced analytics.

## Acceptance scenarios

1. **Complete a cash sale offline**
   Given an authenticated user, an open shift, and sufficient stock, the user can sell a product for cash without Internet; the POS records the sale, calculates change, reduces stock, updates expected cash, and produces a directly printable ticket.

2. **Complete a referenced transfer sale offline**
   Given an open shift and sufficient stock, the user can record a transfer with its required reference; the sale appears under transfer and does not increase expected cash.

3. **Complete a split payment**
   Given an open shift, the user can settle the exact sale total with cash and a referenced transfer; both components are retained and reported separately, and only net cash affects expected cash.

4. **Prevent partial or negative-stock confirmation**
   Given insufficient stock or an invalid settlement, the POS rejects confirmation and leaves sale, stock, payment, and shift records unchanged.

5. **Recover printing without changing the sale**
   Given a durably confirmed sale, a print failure leaves all business effects intact and permits reprinting from the existing sale without duplication.

6. **Void only during the original open shift**
   Given an eligible completed sale, an owner can void it once with a reason while its original shift is open; the POS preserves its history, reverses payment effects, restores stock, and updates reports. The same action is rejected after shift closure.

7. **Reconcile, back up, and recover**
   Given completed activity, a restart preserves the active shift and confirmed records. Closing records the cash difference and automatically writes an observable backup to the owner-configured location; an owner can verify it before a consistent restore.

## Next gate

Before selection, integration, or shipment of the production printer provider/adapter, complete the mandatory proof of concept on the actual Windows terminal and USB thermal printer and obtain explicit acceptance of the evaluated silent-printing approach. This gate does not block separately authorized technical foundation, non-printing MVP work, or provider-neutral ticket snapshots, print jobs, UI recovery, and retries; an isolated proof-of-concept harness may proceed after the base runtime and test foundation exists when separately authorized. All implementation still requires later authorization. Product scope remains fixed while that technical dependency is evaluated.

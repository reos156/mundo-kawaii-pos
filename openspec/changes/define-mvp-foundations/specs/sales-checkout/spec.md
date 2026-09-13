# Sales and Checkout Specification

## Purpose

Define cart preparation, supported settlement methods, atomic sale confirmation, and deterministic owner-authorized voids while the original shift remains open.

## Requirements

### Requirement: Editable pre-confirmation cart

The system MUST allow an authenticated owner or cashier to find active products in the local catalog, add them to a cart, change quantities, remove lines, override unit prices, and apply explicit discounts before the sale is confirmed. The system MUST calculate the total from the effective final prices and MUST retain the acting user and applied price or discount details with the confirmed sale.

#### Scenario: Prepare and edit a cart

- GIVEN an authenticated cashier and active catalog products
- WHEN the cashier adds products, changes a quantity, removes a line, overrides a unit price, and applies an explicit discount before confirmation
- THEN the system MUST recalculate the sale total from the remaining effective line prices
- AND MUST leave catalog stock unchanged until confirmation

#### Scenario: Reject edits after confirmation

- GIVEN a confirmed sale
- WHEN a user attempts to edit its quantities, prices, discounts, or payment components as though it were an open cart
- THEN the system MUST reject the edit
- AND MUST preserve the confirmed sale, stock, payment, and shift effects

### Requirement: Supported payment settlement

The system MUST accept cash, transfer, or a cash-and-transfer split. Accepted payment components MUST settle the sale total before confirmation; cash tendered MAY exceed the cash amount due and produce change, and every transfer component MUST include a reference.

#### Scenario: Settle a cash sale with change

- GIVEN an active shift, sufficient stock, and a sale total
- WHEN the cashier records cash tendered greater than the amount due
- THEN the system MUST calculate the difference as change
- AND the retained net cash payment component MUST equal cash tendered minus change

#### Scenario: Settle a transfer sale

- GIVEN an active shift, sufficient stock, and a sale total
- WHEN the cashier records a transfer equal to the total with a reference
- THEN the system MUST accept the settlement
- AND expected physical cash MUST remain unchanged

#### Scenario: Settle a split sale

- GIVEN an active shift, sufficient stock, and a sale total
- WHEN the cashier records cash and a referenced transfer whose accepted components settle the total
- THEN the system MUST retain both components separately
- AND MUST attribute only the net cash component to expected cash

#### Scenario: Reject an unsettled payment

- GIVEN a sale whose accepted payment components do not settle the total
- WHEN the cashier attempts confirmation
- THEN the system MUST reject confirmation
- AND MUST leave sale, stock, payment, and shift records unchanged

#### Scenario: Reject a transfer without reference

- GIVEN a sale includes a transfer component without a reference
- WHEN the cashier attempts confirmation
- THEN the system MUST reject confirmation
- AND MUST leave sale, stock, payment, and shift records unchanged

### Requirement: Atomic sale confirmation

The system MUST confirm a sale only against the active shift and MUST apply sale persistence, line details, payment attribution, stock reduction, and shift effects as one consistent outcome. If the complete outcome cannot be retained, none of those effects MUST remain applied.

#### Scenario: Confirm a valid sale

- GIVEN an active shift, sufficient stock, an editable cart, and a valid settlement
- WHEN the cashier confirms the sale
- THEN the system MUST create one completed sale associated with the shift
- AND MUST retain its lines and payment breakdown, reduce stock once, and update shift totals once

#### Scenario: Recover from a confirmation failure

- GIVEN a valid cart and settlement
- WHEN confirmation fails before all sale effects can be durably retained
- THEN the system MUST NOT leave a completed or partial sale
- AND MUST leave stock, payment records, and shift totals at their pre-confirmation values

### Requirement: Audited owner-authorized void

The system MUST permit a completed, non-voided sale to be voided only with owner authorization, a reason, and while its original shift remains open. A successful void MUST preserve the original sale, mark it voided, retain the owner, reason, and timestamp, restore each sold quantity exactly once, reverse each original payment component exactly once, update affected reports, and apply all void effects as one consistent outcome. The cash reversal MUST equal the original retained net cash payment component and MUST reduce expected cash by that refunded amount; a transfer reversal MUST equal the original retained transfer component and MUST NOT affect expected cash.

#### Scenario: Owner voids a cash sale during its open shift

- GIVEN a completed non-voided cash sale whose original shift remains open and an authenticated owner
- WHEN the owner voids the sale with a reason
- THEN the system MUST preserve and mark the sale voided, retain the audit record, restore its sold quantities, and reverse its original net cash payment component exactly once
- AND MUST reduce that shift's expected cash by exactly the refunded cash component and update affected reports

#### Scenario: Owner voids a transfer sale during its open shift

- GIVEN a completed non-voided transfer sale whose original shift remains open and an authenticated owner
- WHEN the owner voids the sale with a reason
- THEN the system MUST preserve and mark the sale voided, retain the audit record, restore its sold quantities, and reverse the referenced transfer component exactly once
- AND MUST leave expected cash unchanged and update affected reports

#### Scenario: Owner voids a split sale during its open shift

- GIVEN a completed non-voided split sale whose original shift remains open and an authenticated owner
- WHEN the owner voids the sale with a reason
- THEN the system MUST reverse the original net cash and referenced transfer components separately and exactly once
- AND MUST reduce expected cash only by the refunded cash component, restore sold quantities, preserve the sale and audit record, and update affected reports

#### Scenario: Cashier attempts to void a sale

- GIVEN a completed sale and an authenticated cashier
- WHEN the cashier attempts to void the sale
- THEN the system MUST deny the action
- AND MUST leave sale status, stock, payment, shift totals, and reports unchanged

#### Scenario: Reject a repeated void

- GIVEN a sale that is already voided
- WHEN an owner attempts to void it again
- THEN the system MUST reject the attempt
- AND MUST NOT repeat any stock, payment, expected-cash, or report adjustment

#### Scenario: Reject a void after the original shift closes

- GIVEN a completed non-voided sale whose original shift is closed and an authenticated owner
- WHEN the owner attempts to void the sale
- THEN the system MUST reject the attempt because the closed shift is immutable
- AND MUST leave the original sale, stock, payment components, shift reconciliation, and reports unchanged

#### Scenario: Void cannot complete consistently

- GIVEN an eligible sale in its original open shift and an authenticated owner
- WHEN all required void effects cannot be retained as one consistent outcome
- THEN the system MUST leave sale status, stock, payment components, expected cash, audit history, and reports at their pre-void values

### Requirement: Voids remain distinct from returns and exchanges

The system MUST treat a void only as the audited reversal of a completed sale during its original open shift. The MVP MUST NOT represent a void as a return or exchange, MUST NOT provide return or exchange workflows, and MUST NOT use the void workflow for post-close sale correction.

#### Scenario: User requests a return, exchange, or post-close correction

- GIVEN a completed sale
- WHEN a user attempts to initiate a return, exchange, or post-close correction
- THEN the system MUST NOT process it through the void capability
- AND MUST preserve the original sale, stock, and financial records unless an eligible, separately authorized void is completed while the original shift remains open

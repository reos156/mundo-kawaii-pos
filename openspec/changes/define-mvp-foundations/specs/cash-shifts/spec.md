# Cash Shifts Specification

## Purpose

Define the single cash-shift lifecycle, controlled cash movements, cash reconciliation, closure-triggered backup, and closed-shift immutability for one terminal.

## Requirements

### Requirement: Single active shift

The system MUST allow at most one active cash shift on the terminal. An authenticated owner or cashier MUST be able to open a shift with an initial cash amount, and confirmed sales MUST be associated with the active shift.

#### Scenario: Open the selling-day shift

- GIVEN no active shift and an authenticated cashier
- WHEN the cashier opens a shift with an initial cash amount
- THEN the system MUST create one active shift
- AND MUST retain the opening amount, user, and opening time

#### Scenario: Reject a second active shift

- GIVEN an active shift already exists
- WHEN any user attempts to open another shift
- THEN the system MUST reject the attempt
- AND MUST leave the existing active shift unchanged

#### Scenario: Reject a sale without an active shift

- GIVEN no active shift
- WHEN a user attempts to confirm a sale
- THEN the system MUST reject confirmation
- AND MUST leave sale, stock, payment, and shift records unchanged

### Requirement: Audited cash movements

The system MUST allow an authenticated owner or cashier to record a cash deposit or withdrawal only against the active shift. Every movement MUST retain its type, amount, reason, user, and timestamp and MUST affect expected cash exactly once.

#### Scenario: Record a cash deposit

- GIVEN an active shift and an authenticated cashier
- WHEN the cashier records a cash deposit with an amount and reason
- THEN the system MUST add the amount to expected cash
- AND MUST retain the movement type, amount, reason, cashier, and timestamp

#### Scenario: Record a cash withdrawal

- GIVEN an active shift and an authenticated owner
- WHEN the owner records a cash withdrawal with an amount and reason
- THEN the system MUST subtract the amount from expected cash
- AND MUST retain the movement type, amount, reason, owner, and timestamp

#### Scenario: Reject an incomplete cash movement

- GIVEN an active shift
- WHEN a user submits a cash movement without a valid amount or reason
- THEN the system MUST reject the movement
- AND MUST leave expected cash and the movement history unchanged

### Requirement: Expected cash calculation

The system MUST calculate expected cash from opening cash, net cash payment components, deposits, withdrawals, and cash components refunded by valid voids. Each valid void MUST reduce expected cash by exactly the original sale's retained net cash payment component. Transfer payment components and their reversals MUST NOT affect expected cash.

#### Scenario: Calculate expected cash for mixed activity

- GIVEN an active shift with opening cash, confirmed cash and split sales, transfer-only sales, deposits, withdrawals, and a valid void
- WHEN expected cash is requested
- THEN the system MUST include each cash effect exactly once, including subtraction of the voided sale's refunded cash component
- AND MUST exclude transfer components and transfer reversals from physical cash

### Requirement: Shift closure and reconciliation

An authenticated owner or cashier MUST be able to close the active shift by recording counted cash. The system MUST retain expected cash, counted cash, their difference, the closing user, and closing time, and the closed shift MUST cease to be active. Closing the shift MUST automatically create a backup containing the closed shift state and write it to the owner-configured backup location.

#### Scenario: Close and reconcile a shift

- GIVEN an active shift with calculated expected cash and an available owner-configured backup location
- WHEN an authenticated cashier closes it with counted cash
- THEN the system MUST record counted cash and the counted-minus-expected difference
- AND MUST retain the final reconciliation, make the shift inactive, and automatically write a backup containing that closed shift state to the configured location

#### Scenario: Reject closure without counted cash

- GIVEN an active shift
- WHEN a user attempts to close it without a counted cash amount
- THEN the system MUST reject closure
- AND MUST keep the shift active with its financial state unchanged
- AND MUST NOT trigger a shift-closure backup

### Requirement: Closed-shift immutability

After a shift closes, the system MUST preserve its retained sales, payment components, cash movements, void records, expected cash, counted cash, and reconciliation difference without further mutation. Post-close sale correction MUST NOT be performed through the MVP void workflow.

#### Scenario: Reject a financial mutation against a closed shift

- GIVEN a closed shift and a sale associated with it
- WHEN a user attempts to void the sale or record another cash movement against that shift
- THEN the system MUST reject the action
- AND MUST leave the closed shift, sale, payments, stock, reports, and reconciliation unchanged

# Reports and Reconciliation Specification

## Purpose

Define owner-visible sales, payment, shift, cash, and stock views that reconcile to retained operational records and deterministic open-shift void effects.

## Requirements

### Requirement: Sales history and date review

The system MUST allow an authenticated owner to list completed sales, review or filter them by date, and see each sale's status. Voided sales MUST remain visible with their void status and audit history.

#### Scenario: Review sales for a date

- GIVEN confirmed sales exist across multiple dates
- WHEN an authenticated owner selects a date or date range
- THEN the system MUST show the matching sales and their statuses
- AND MUST retain voided sales in the results rather than deleting them

#### Scenario: Cashier attempts to access owner reports

- GIVEN an authenticated cashier
- WHEN the cashier requests a business report
- THEN the system MUST deny access
- AND MUST NOT modify any operational record

### Requirement: Payment totals

The system MUST report cash and transfer components separately and MUST derive totals from retained confirmed sales and their authorized void reversals. A split sale MUST contribute to both payment totals by its respective components. A valid void MUST subtract exactly the original retained net cash component from cash totals and exactly the original retained transfer component from transfer totals, while preserving the original sale and void audit history.

#### Scenario: Report mixed payment activity

- GIVEN the selected period contains cash, transfer, and split sales
- WHEN an owner reviews payment totals
- THEN the system MUST show cash and transfer totals separately
- AND each retained payment component MUST contribute exactly once according to sale status

#### Scenario: Reflect a voided cash sale without deleting history

- GIVEN a cash sale in the selected period was validly voided while its original shift was open
- WHEN the owner reviews sales and payment totals
- THEN the report MUST preserve the original sale and its void status
- AND MUST subtract exactly its original retained net cash component from cash totals without changing transfer totals

#### Scenario: Reflect a voided transfer sale without deleting history

- GIVEN a transfer sale in the selected period was validly voided while its original shift was open
- WHEN the owner reviews sales and payment totals
- THEN the report MUST preserve the original sale, transfer reference, and void status
- AND MUST subtract exactly its original transfer component from transfer totals without changing cash totals

#### Scenario: Reflect a voided split sale by component

- GIVEN a split sale in the selected period was validly voided while its original shift was open
- WHEN the owner reviews sales and payment totals
- THEN the report MUST subtract the original retained net cash component from cash totals and the original retained transfer component from transfer totals exactly once
- AND MUST preserve the original sale, component details, and void audit history

### Requirement: Shift reconciliation report

The system MUST show each shift's opening cash, cash deposits and withdrawals, net cash sale effects, cash components refunded by valid voids, expected cash, counted cash when closed, and reconciliation difference. Transfer components and transfer reversals MUST remain visible in payment reporting but MUST NOT affect expected cash. Closed-shift report values MUST remain immutable.

#### Scenario: Review a closed shift

- GIVEN a closed shift has sales, cash movements, and counted cash
- WHEN an authenticated owner reviews the shift
- THEN the system MUST show the components used to determine expected cash
- AND MUST show counted cash and the retained counted-minus-expected difference without any post-close void adjustment

#### Scenario: Review an active shift

- GIVEN a shift remains active
- WHEN an authenticated owner reviews it
- THEN the system MUST show its current expected cash and recorded components, including any refunded cash components from valid voids
- AND MUST identify that counted cash and final difference are not yet recorded

### Requirement: Current stock report

The system MUST allow an authenticated owner to review current stock levels, and reported balances MUST reflect confirmed sales, authorized void restorations, and audited stock adjustments exactly once.

#### Scenario: Review stock after inventory activity

- GIVEN products have confirmed sales, an authorized void, and owner stock adjustments
- WHEN the owner reviews current stock
- THEN each displayed balance MUST match the retained resulting balance after those effects
- AND no abandoned or failed cart MUST affect the report

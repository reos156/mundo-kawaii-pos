# Colombia Regional Behavior Specification

## Purpose

Define fixed MVP currency, language, time-zone, date, and price presentation for the Colombian store.

## Requirements

### Requirement: Colombian peso amounts

The system MUST use Colombian pesos (COP) for catalog prices, cart totals, discounts, payment components, change, cash movements, shift reconciliation, void adjustments, tickets, and reports.

#### Scenario: Present monetary values consistently

- GIVEN a product sale and its related payment, shift, ticket, and report records
- WHEN a user reviews those records
- THEN every monetary value MUST be identified and presented as COP
- AND the same retained amount MUST remain consistent across the related views

### Requirement: Final-price presentation without tax breakdown

The system MUST treat catalog selling prices and effective sale prices as final customer amounts. The MVP MUST NOT calculate, configure, or present a separate tax breakdown.

#### Scenario: Calculate a sale from final prices

- GIVEN a cart contains products with final catalog prices and permitted pricing edits
- WHEN the total and ticket are produced
- THEN the system MUST calculate the amount due from the effective final prices and explicit discounts
- AND MUST NOT add or display a separate tax component

### Requirement: Colombian Spanish user-facing language

The system MUST present user-facing operational text in Colombian Spanish.

#### Scenario: User operates the selling-day workflow

- GIVEN an authenticated owner or cashier uses an MVP workflow
- WHEN the system presents labels, actions, statuses, validation messages, or recoverable failures
- THEN that user-facing text MUST be presented in Colombian Spanish

### Requirement: Bogota civil time

The system MUST interpret and present operational timestamps using the `America/Bogota` time zone, including sales, shifts, cash movements, stock adjustments, voids, tickets, reports, and backup operations.

#### Scenario: Display a retained event timestamp

- GIVEN an operational event has a retained timestamp
- WHEN that event is shown to a user or printed on a ticket
- THEN the displayed local date and time MUST correspond to `America/Bogota`

### Requirement: Day-first dates

The system MUST present user-facing dates in day/month/year order.

#### Scenario: Present dates across workflows

- GIVEN sales, shift, report, audit, ticket, or backup dates are displayed
- WHEN a user reviews them
- THEN each user-facing date MUST use day/month/year order

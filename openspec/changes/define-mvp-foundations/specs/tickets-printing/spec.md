# Tickets and Printing Specification

## Purpose

Define durable ticket generation and the planned recoverable-printing capability without selecting a print bridge or making printing an MVP delivery gate.

## Requirements

### Requirement: Ticket content for a confirmed sale

The system MUST generate a ticket for each confirmed sale containing store identity, sale number, sale timestamp, cashier identity, items, effective prices, payment breakdown, and cash change.

#### Scenario: Generate a ticket after confirmation

- GIVEN a sale has been durably confirmed
- WHEN its ticket is generated
- THEN the ticket MUST contain all required sale and payment fields
- AND the ticket data MUST correspond to that confirmed sale

#### Scenario: Do not issue a completed-sale ticket for a failed confirmation

- GIVEN a sale confirmation did not complete
- WHEN ticket output is requested for that attempt
- THEN the system MUST NOT issue a ticket representing a completed sale

### Requirement: Direct thermal printing

When the planned printing capability is delivered, it MUST support silent direct printing to the actual USB thermal printer on the supported Windows terminal without displaying a browser print dialog, including while Internet access is unavailable.

#### Scenario: Print a confirmed sale offline

- GIVEN the supported Windows terminal and USB thermal printer are operational, a sale is confirmed, and Internet access is unavailable
- WHEN the cashier requests printing
- THEN the system MUST send the ticket directly without a browser print dialog
- AND MUST NOT require Internet access to complete the print request

### Requirement: Print failure isolation and recovery

Printing MUST occur after or independently from durable sale confirmation. A print failure MUST NOT reverse, duplicate, or modify the confirmed sale, its stock effects, payment records, or shift effects, and the system MUST allow the ticket to be printed again.

#### Scenario: Printer fails after sale confirmation

- GIVEN a sale is durably confirmed
- WHEN immediate printing fails because output cannot be completed
- THEN the system MUST retain the confirmed sale and all of its business effects exactly once
- AND MUST expose the print failure as recoverable without creating another sale

#### Scenario: Retry after printer recovery

- GIVEN a confirmed sale whose prior print attempt failed
- WHEN the printer becomes available and the cashier requests the ticket again
- THEN the system MUST print from the existing confirmed sale
- AND MUST NOT duplicate sale, stock, payment, or shift effects

### Requirement: Ticket reprint

When printing is available, an authenticated owner or cashier MUST be able to reprint a confirmed sale's ticket. A reprint MUST reproduce the retained ticket data and MUST NOT create a new sale or reapply any business effect.

#### Scenario: Reprint a historical confirmed sale

- GIVEN an authenticated cashier and a confirmed sale
- WHEN the cashier requests a reprint
- THEN the system MUST produce the ticket from the existing sale data
- AND MUST leave sale count, stock, payments, and shift totals unchanged

### Requirement: Non-blocking deferral and honest hardware evidence

Printing implementation and proof-of-concept work MUST NOT block MVP implementation, acceptance, or delivery. Printing MAY be deferred while ticket generation and all remaining MVP work proceed, and no replacement capability is implied. Until testing on the actual Windows terminal and USB thermal printer validates silent operation, offline behavior, installation and recovery, ticket output, failure handling, compatibility, and relevant trust, update, and licensing constraints, release and operational materials MUST describe printing as unavailable or unverified and MUST NOT claim that it works or is supported.

#### Scenario: Printing has no accepted actual-hardware evidence

- GIVEN no print approach has retained evidence covering the required criteria on the actual hardware
- WHEN MVP readiness or release status is evaluated
- THEN pending printing MUST NOT block MVP implementation, acceptance, or delivery
- AND printing MUST be described as unavailable or unverified

#### Scenario: Actual-hardware evidence supports the printing claim

- GIVEN a candidate approach has been tested on the actual terminal and printer against every required criterion
- WHEN authorized stakeholders review a claim that printing works or is supported
- THEN the evidence MUST identify the tested approach and hardware context
- AND the claim MUST NOT exceed the behavior demonstrated by that evidence

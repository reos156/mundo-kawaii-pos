# Prototype checkout and finalization interaction

Issue: [Prototipar la interacción de cobro y finalización](https://github.com/reos156/mundo-kawaii-pos/issues/34)

## Destination

Validate, with the store owner, a clickable interaction sequence from sale preparation through explicit finalization without changing previously agreed business rules.

## Tasks

- [x] Load the Wayfinder map, prerequisite decisions, and claim the decision ticket.
- [x] Build a single-file logic prototype with guided scenarios and visible state.
- [x] Validate the interaction with the store owner and revise if needed.
- [ ] Record the confirmed resolution, link the prototype, close the ticket, and update the map.

## Evidence

- Ticket claimed: <https://github.com/reos156/mundo-kawaii-pos/issues/34#issuecomment-5815035092>
- Prototype: `prototypes/checkout-finalization-prototype.html`
- Verification: inline JavaScript syntax passed; independent static review traced all seven scenarios with no remaining blockers.
- Owner validation: Q1–Q4 confirmed without requested changes; sequence, reservations, reimbursement-before-finalization, and correction/refund distinction accepted.
- Work-unit commit: `5e81378` (`docs(planning): prototype checkout finalization flow`).

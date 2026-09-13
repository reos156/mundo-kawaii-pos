# Access Control Specification

## Purpose

Define offline authentication and role permissions for accountable operation by owners and cashiers on the single MVP terminal.

## Requirements

### Requirement: Local user authentication

The system MUST require a user to authenticate as an assigned owner or cashier identity before accessing operational or administrative capabilities, and authentication MUST remain available without Internet access.

#### Scenario: Authenticate while offline

- GIVEN an assigned active cashier identity and no Internet connection
- WHEN the cashier provides valid authentication credentials
- THEN the system MUST establish a session attributed to that cashier identity
- AND the cashier MUST be able to access permitted selling-day capabilities

#### Scenario: Reject invalid credentials

- GIVEN an assigned user identity
- WHEN invalid authentication credentials are provided
- THEN the system MUST deny access
- AND MUST NOT establish an authenticated session

### Requirement: Role-based authorization

The system MUST authorize actions according to the authenticated user's role. Owners MUST be allowed to perform cashier actions and MUST exclusively manage the catalog, perform stock adjustments, authorize eligible completed-sale voids, review business reports, and configure the backup location, export backups, verify backups, or restore verified backups. Cashiers MUST be allowed to operate shifts, prepare and settle sales, record cash movements, and print or reprint tickets.

#### Scenario: Cashier performs an operational action

- GIVEN an authenticated cashier
- WHEN the cashier opens a shift, prepares a sale, records an allowed cash movement, or prints a confirmed sale ticket
- THEN the system MUST allow the action subject to the capability's business rules
- AND MUST attribute the action to the cashier identity

#### Scenario: Cashier is denied an owner-only action

- GIVEN an authenticated cashier
- WHEN the cashier attempts to manage a product, adjust stock, void a completed sale, review owner reports, configure the backup location, or export, verify, or restore a backup
- THEN the system MUST deny the action
- AND MUST leave business data unchanged

#### Scenario: Owner uses cashier capabilities

- GIVEN an authenticated owner
- WHEN the owner performs a cashier capability
- THEN the system MUST allow the action subject to the same business rules
- AND MUST attribute the action to the owner identity

### Requirement: Privileged action attribution

The system MUST evaluate authorization using the identity active when an action is requested and MUST retain that identity on auditable stock adjustments, cash movements, price overrides, discounts, sale confirmations, voids, and backup recovery operations where applicable.

#### Scenario: Session identity changes before a privileged action

- GIVEN a cashier prepared a cart and the cashier session has ended
- WHEN an owner authenticates and authorizes a completed-sale void or stock adjustment
- THEN the system MUST attribute the privileged action to the owner
- AND MUST preserve the original cashier attribution on the sale or cart actions already recorded

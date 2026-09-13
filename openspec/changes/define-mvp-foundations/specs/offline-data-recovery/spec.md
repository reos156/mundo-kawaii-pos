# Offline Data and Recovery Specification

## Purpose

Define offline selling-day availability, restart-safe local records, observable shift-closure backups, and objectively verified owner-controlled recovery for the single terminal.

## Requirements

### Requirement: Offline core operation

The system MUST support authentication, shift operation, catalog lookup, cart preparation, cash movements, cash/transfer/split checkout, sale confirmation, ticket generation, and access to retained operational data without Internet access. When printing is available, it MUST also operate without Internet access; unavailable or deferred printing MUST NOT block the remaining offline workflow or MVP delivery.

#### Scenario: Complete the selling-day flow offline

- GIVEN the terminal has no Internet connection
- WHEN authenticated users open a shift, sell in-stock products, collect supported payments, generate ticket data, and close the shift
- THEN the system MUST complete the workflow without Internet access even when printing is unavailable or deferred
- AND MUST retain all confirmed effects locally

#### Scenario: Connectivity changes during cart preparation

- GIVEN a cashier is preparing a cart and Internet access is lost
- WHEN the cashier completes a valid checkout
- THEN the system MUST apply the same confirmation rules as when connectivity is available
- AND MUST NOT lose or duplicate the confirmed sale because connectivity changed

### Requirement: Durable operational records

The system MUST persist confirmed sales, sale lines, payment details, stock changes, audit records, cash movements, and active or closed shift state on the single terminal. A normal application restart MUST preserve each confirmed effect exactly once.

#### Scenario: Restart with an active shift

- GIVEN an active shift contains confirmed sales, payment components, cash movements, and stock changes
- WHEN the application restarts without Internet access
- THEN the same shift MUST remain active with its financial state intact
- AND all confirmed sales, payments, audit records, and stock balances MUST be recoverable without duplication

#### Scenario: Restart after a failed confirmation

- GIVEN a sale confirmation failed without completing its atomic outcome
- WHEN the application restarts
- THEN no completed sale or partial payment, stock, or shift effect from that attempt MUST appear

### Requirement: Observable automatic backup at shift closure

The system MUST automatically create a backup whenever a shift closes and MUST write it to the backup location configured by the owner. The backup MUST contain the business data and relationships needed to recover sales, payment components, stock, audits, cash movements, and active or closed shift state, including the newly closed shift. The system MUST expose the backup result, completion time, and configured destination to the owner without requiring manual backup initiation.

#### Scenario: Shift closure creates an observable backup

- GIVEN an active shift, retained operational records, and an available owner-configured backup location
- WHEN the shift closes successfully
- THEN the system MUST automatically write one completed backup containing the closed shift state to that configured location
- AND MUST make the successful result, completion time, and destination observable to the owner

#### Scenario: Rejected closure does not trigger a backup

- GIVEN an active shift and an owner-configured backup location
- WHEN a shift-closure attempt is rejected
- THEN the system MUST NOT represent a closure-triggered backup as completed
- AND MUST leave the active shift and live operational records unchanged

#### Scenario: Automatic backup fails

- GIVEN a shift closes but its automatic backup cannot be completed at the owner-configured location
- WHEN the backup result is reported
- THEN the system MUST preserve the live operational data and closed shift state unchanged
- AND MUST make the failure, attempted time, and configured destination observable to the owner for recovery action

### Requirement: Owner backup location and export

Only an authenticated owner MUST be allowed to configure the backup location or export a completed backup. Changing the configured location MUST NOT move, alter, or delete live business data or existing backups.

#### Scenario: Owner configures the backup location

- GIVEN an authenticated owner
- WHEN the owner selects a backup location that the system accepts as available for writing
- THEN the system MUST retain that location for subsequent shift-closure backups
- AND MUST leave live business data and existing backups unchanged

#### Scenario: Owner exports a completed backup

- GIVEN an authenticated owner and a completed backup
- WHEN the owner exports it
- THEN the system MUST provide an exportable copy of that backup
- AND MUST leave the source backup and live business data unchanged

#### Scenario: Cashier attempts a backup operation

- GIVEN an authenticated cashier
- WHEN the cashier attempts to configure a backup location, export, verify, or restore a backup
- THEN the system MUST deny the operation
- AND MUST leave live data, backup configuration, and backups unchanged

### Requirement: Objective backup verification

Only an authenticated owner MUST be allowed to verify a backup. A backup MUST be accepted as restore-ready only when verification confirms all of the following: completeness metadata identifies the backup scope and every required recoverable data class; version metadata identifies a supported backup format or data version; integrity validation confirms the retained backup contents have not been lost, truncated, or altered; and restore validation can read and reconstruct the complete mutually consistent dataset in validation state isolated from live operational state. Verification MUST report each check's result and MUST NOT mutate live state.

#### Scenario: Complete and supported metadata passes

- GIVEN an authenticated owner selects a backup whose completeness metadata identifies sales, sale lines, payment components, stock, audits, cash movements, and shift state and whose version metadata identifies a supported version
- WHEN metadata verification is performed
- THEN the system MUST report the completeness and version checks as passed
- AND MUST retain the identified backup scope and version in the verification result

#### Scenario: Missing or unsupported metadata fails

- GIVEN an authenticated owner selects a backup with a required data class absent from its completeness metadata or with missing or unsupported version metadata
- WHEN metadata verification is performed
- THEN the system MUST report the specific completeness or version failure
- AND MUST NOT accept the backup as restore-ready

#### Scenario: Integrity validation detects altered or incomplete contents

- GIVEN an authenticated owner selects a backup whose retained contents are altered, truncated, or incomplete relative to its integrity information
- WHEN integrity validation is performed
- THEN the system MUST report the integrity failure
- AND MUST NOT accept the backup as restore-ready or modify live business data

#### Scenario: Restore validation succeeds without mutating live state

- GIVEN an authenticated owner selects a backup that passed metadata and integrity checks
- WHEN restore validation reconstructs and reads the backup in state isolated from live operations
- THEN the system MUST confirm that all required records, relationships, shift status, and balances form a mutually consistent recoverable dataset
- AND MUST leave every live sale, payment, stock balance, audit, cash movement, and shift record unchanged

#### Scenario: Restore validation detects inconsistent relationships

- GIVEN an authenticated owner selects a backup that cannot reconstruct required record relationships or consistent balances in isolated validation state
- WHEN restore validation is performed
- THEN the system MUST report the failed consistency checks
- AND MUST leave live business data unchanged and MUST NOT accept the backup as restore-ready

#### Scenario: Verification accepts a restore-ready backup

- GIVEN completeness metadata, supported version metadata, integrity validation, and isolated restore validation have all passed for the same backup
- WHEN verification completes
- THEN the system MUST report that backup as restore-ready
- AND MUST preserve the complete check results for owner review before any live restore is accepted

### Requirement: Verified backup restore

Only an authenticated owner MUST be allowed to restore a backup, and the system MUST require the selected backup to have passed every objective verification check before restore. A successful restore MUST recover a mutually consistent dataset; a failed restore MUST NOT leave a partially replaced dataset.

#### Scenario: Restore a verified backup

- GIVEN an authenticated owner and a backup accepted as restore-ready by metadata, integrity, and isolated restore validation
- WHEN the owner accepts and performs the live restore
- THEN the system MUST recover sales, payments, stock, audits, cash movements, and shift state as a consistent set
- AND the recovered active-shift status and balances MUST match the verified backup

#### Scenario: Reject restore before all checks pass

- GIVEN an authenticated owner and a backup with any required verification check missing or failed
- WHEN the owner attempts to restore it
- THEN the system MUST reject the restore
- AND MUST leave live business data unchanged

#### Scenario: Restore fails before completion

- GIVEN an authenticated owner starts restoring a verified backup
- WHEN the complete dataset cannot be restored
- THEN the system MUST report the failure
- AND MUST NOT expose a partially restored mixture of old and backup data as operational state

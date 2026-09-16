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

A successful shift closure MUST atomically commit the closed-shift state and create exactly one durable backup job before any external I/O. An unattended worker MUST attempt that job against owner-configured removable storage physically distinct from the live-data disk; the medium MUST be disconnected only after successful completion of a backup artifact, not after a failed or `UNKNOWN` attempt. The complete artifact MUST contain the business data and relationships needed to recover sales, payments, stock, audits, cash movements, and shift state including the new closure. The system MUST expose persistent role-appropriate job/attempt status, time, and destination without manual initiation.

#### Scenario: Shift closure creates an observable backup

- GIVEN an active shift, retained operational records, and an available owner-configured backup location
- WHEN the shift closes successfully
- THEN the closure transaction MUST create one durable backup job containing the closed shift high-watermark
- AND the unattended worker MUST create and verify one complete artifact at the configured location
- AND the system MUST make the job, attempts, artifact result, completion time, and destination observable to the owner

#### Scenario: Rejected closure does not trigger a backup

- GIVEN an active shift and an owner-configured backup location
- WHEN a shift-closure attempt is rejected
- THEN the system MUST NOT represent a closure-triggered backup as completed
- AND MUST leave the active shift and live operational records unchanged

#### Scenario: Automatic backup fails

- GIVEN a shift closes but its automatic backup cannot be completed at the owner-configured location
- WHEN the backup result is reported
- THEN the system MUST preserve the live operational data and closed shift state unchanged
- AND MUST automatically append a non-destructive retry to the same durable job when the destination returns, while also allowing an owner-requested retry on that job
- AND MUST persist a role-appropriate alert with the failed attempt time and destination until resolved

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

### Requirement: Recovery objectives and shift gate

The system MUST protect closure state to an RPO of at most one shift or 24 hours, whichever is stricter. When the currently open shift approaches 24 hours of age the system MUST warn, and when it exceeds 24 hours MUST raise a critical alert, without forcing closure or interrupting an open shift or sale; the next shift remains blocked until the prior closure has a complete artifact. The four-operating-hour RTO MUST start once a compatible terminal, installable application, and latest complete artifact are available; retrieving and making recovery material available MUST occur inside that period and MUST NOT postpone its start, which also includes artifact verification, restoration, restored-state verification, and return to operation. Before closure, the system MUST warn when destination capacity is predicted insufficient for the next backup.

#### Scenario: Prior closure lacks a complete artifact

- GIVEN the most recently closed shift's backup job has no complete artifact
- WHEN an owner or cashier attempts to open the next shift
- THEN the service MUST reject shift opening
- AND MUST show the persistent backup alert and owner recovery action

#### Scenario: Retry the same closure job

- GIVEN a closure backup attempt failed after the shift and job committed
- WHEN the destination becomes available again or an owner requests retry
- THEN the worker MUST automatically append, or allow the owner to append, a new attempt to the same job
- AND MUST leave the closed shift and prior attempt history unchanged

### Requirement: Precise recovery terminology

A backup job MUST mean the durable unit of work created by shift closure or explicit owner export; an attempt MUST mean one execution of that job; a complete artifact MUST mean an immutable finalized output that passed write, flush, reopen, and integrity checks; and restore-ready MUST mean that the exact complete artifact digest later passed every objective verification and isolated reconstruction check. The UI, audits, and operations documentation MUST NOT use these terms interchangeably.

### Requirement: Lifetime history and bounded detail retention

Authoritative business records, durable jobs, each job's authoritative outcome, and audit history MUST remain for the installation lifetime, distinct from repetitive attempt/verification detail. Scheduled retention MAY automatically expire that unprotected repetitive detail after 90 days and non-authoritative diagnostics after 30 days without owner authorization only when they are not `UNKNOWN`, incident-linked, or held. It MUST preserve the seven latest complete artifacts and latest restore-ready artifact even when overlapping; eligible complete-artifact disposal remains guarded and owner-authorized.

#### Scenario: Retention runs under normal storage conditions

- GIVEN retained detail and artifacts exceed their minimum age or count
- WHEN retention evaluation runs
- THEN it MUST automatically expire only unprotected attempt/verification detail older than 90 days and diagnostics older than 30 days
- AND MUST preserve lifetime history, `UNKNOWN`/incident/held records, artifact minima, and material requiring guarded owner disposal

#### Scenario: Storage pressure becomes critical

- GIVEN available protected storage falls below 20 percent
- WHEN health is evaluated
- THEN the system MUST issue a persistent warning
- AND when availability falls below 10 percent or a required backup fails, it MUST issue a persistent critical alert
- AND it MUST NOT silently delete authoritative history, protected artifacts, holds, incidents, or `UNKNOWN` records

### Requirement: Owner-controlled disposal and guarded retirement

Only a freshly authorized owner MAY dispose of an eligible complete backup artifact or irreversibly retire the installation, with a reason, policy evaluation, custody confirmation, and secret-free tombstone. Installation retirement MUST require named-owner irreversible confirmation, a recent external restore-ready backup, and a recorded external custodian responsibility attestation. Artifact/key retirement MUST be refused while retained material depends on it.

#### Scenario: Retire an installation

- GIVEN a recent external restore-ready backup and recorded external custodian are available
- WHEN a named owner provides a reason, fresh password, and irreversible confirmation
- THEN the system MAY execute guarded installation retirement
- AND MUST retain its custody attestation and tombstone

### Requirement: Confidential live data and recovery copies

Live data, temporary backup output, complete artifacts, exported copies, validation copies, rollback snapshots, staging datasets, and recovery-journal material MUST be confidential at rest. Backup execution MUST remain automatic and unattended after its durable job is created. Encryption and decryption failure MUST fail closed, emit safe audits, and redact passwords, recovery codes, keys, decrypted content, and unnecessary payment details from logs and diagnostics.

#### Scenario: Protected storage cannot encrypt an artifact

- GIVEN a backup job is ready to write but approved encryption material is unavailable or invalid
- WHEN the worker attempts the backup
- THEN the attempt MUST fail without creating a complete plaintext artifact
- AND the system MUST persist a redacted failure and critical alert

### Requirement: Separated restore authority and sealed-material custody

A named owner MUST authorize/direct restore separately from sealed-material custody. The offline sealed copy MUST be separate from terminal, backup medium/location, owner credential, and everyday custodian material. Its named external custodian MAY be another `OWNER` or a trusted non-user and is responsible for physical security, availability, and controlled handoff with secret-free attestations; custody grants no application authority, and the custodian MAY supply material but MUST NOT authorize/direct restore. Loss of all usable copies is permanent without bypass.

#### Scenario: Restore requires separate material

- GIVEN a named owner selects an exact restore-ready artifact
- WHEN the required sealed material is not supplied through the approved custody procedure
- THEN the system MUST refuse decryption and restore without mutating live data

### Requirement: Versioned retention-aware key rotation

Encryption material MUST be versioned and rotated only on suspected compromise, custody change, or explicit owner decision. Rotation MUST preserve decryption of every retained artifact until each dependency is lawfully disposed or re-encrypted and verified, retain an independent offline sealed version, update custody responsibility attestations, and never silently invalidate restore-ready evidence.

### Requirement: Exact-artifact recovery and rehearsal

Restore and recovery rehearsals MUST decrypt, verify, and reconstruct the exact selected artifact in isolated staging before the first production shift and after material rotation, custodian change, terminal replacement, or protection-boundary change. No other mandatory trigger or cadence applies. A successful rehearsal MUST demonstrate verification, restoration, restored-state verification, and return to operation within four operating hours without mutating live data.

#### Scenario: Rehearse a selected artifact

- GIVEN a complete artifact, its exact digest, and authorized recovery material
- WHEN a rehearsal is performed
- THEN the system MUST decrypt, verify, migrate if supported, and reconstruct that exact artifact in isolation
- AND MUST retain the measured result and custody attestations without exposing secrets

### Requirement: Controlled recovery-material lifecycle

Restore MUST use an external journal, isolated staging, and a pre-restore rollback snapshot. Rollback snapshots and external recovery journals MUST remain encrypted until restored-state verification succeeds AND a new restore-ready backup exists, then follow guarded auditable retirement. Failed staging data MUST be encrypted and removed within seven days unless an explicit incident or legal hold applies. Interruption MUST deterministically resume or roll back, and cleanup MUST never remove the only viable recovery path.

#### Scenario: Restore is interrupted

- GIVEN the recovery journal identifies live, staging, and rollback datasets
- WHEN power or process failure interrupts replacement
- THEN startup MUST use the journal to finish or roll back deterministically
- AND MUST fail closed rather than expose mixed or unverifiable data

# Access Control Specification

## Purpose

Define offline authentication, account recovery, and service-enforced role permissions for accountable operation by owners and cashiers on the single MVP terminal.

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

### Requirement: Service-enforced role-based authorization

The local service MUST enforce this complete command matrix; browser visibility MUST NOT grant authority. A `CASHIER` or `OWNER` MAY authenticate/logout; read the sellable catalog; operate shifts; prepare/settle sales including allowed pricing and gifts; record reasoned cash movements; request a cashier-assisted void; print/reprint tickets; and view backup health plus role-appropriate alerts. An `OWNER` MAY perform every cashier command and exclusively MAY administer users/roles/account state; manage categories/products including positive opening stock; adjust stock; authorize a void; review reports, backup configuration/protection, and projection health; configure backup location/protection; export/verify/restore/retire/dispose backup material; rotate the recovery code; perform repair/rebuild; transfer an orphaned shift; and attest custody. Cashier-assisted void retains requester/authorizer. Revoked/changed identity is denied except exact `(command type, idempotency key, actor, payload digest)` replay MAY return its durable outcome without mutation. Unlisted commands are denied.

#### Scenario: Cashier performs an operational action

- GIVEN an authenticated cashier
- WHEN the cashier opens a shift, prepares a sale, records an allowed cash movement, or prints a confirmed sale ticket
- THEN the system MUST allow the action subject to the capability's business rules
- AND MUST attribute the action to the cashier identity

#### Scenario: Cashier is denied an owner-only action

- GIVEN an authenticated cashier
- WHEN the cashier attempts an owner-only command
- THEN the service MUST deny the action
- AND MUST leave business data unchanged

#### Scenario: Owner uses cashier capabilities

- GIVEN an authenticated owner
- WHEN the owner performs a cashier capability
- THEN the system MUST allow the action subject to the same business rules
- AND MUST attribute the action to the owner identity

### Requirement: One-time named-owner bootstrap

On a pristine installation, the system MUST offer exactly one atomic claim that creates the first named `OWNER` and consumes the bootstrap opportunity. It MUST NOT create or enable a default, shared, platform, or support account. The claim MUST produce one single-use recovery code for off-terminal custody; failed setup MUST leave neither a partial owner nor a consumed claim.

#### Scenario: Claim a pristine installation

- GIVEN a pristine installation with no user accounts
- WHEN a person completes the owner claim with a unique login name, compliant password, and confirmed off-terminal recovery-code custody
- THEN the system MUST atomically create that named owner and consume the claim
- AND MUST display the recovery code only for that custody handoff
- AND MUST NOT permit another bootstrap claim

#### Scenario: Setup fails before commit

- GIVEN a pristine installation
- WHEN owner creation or recovery-code custody confirmation fails
- THEN the system MUST leave the installation unclaimed
- AND MUST NOT retain a partial account or expose an authentication bypass

### Requirement: Credential and session policy

Passwords MUST contain at least eight characters with uppercase, lowercase, number, and symbol and reject common passwords. Failed authentication MUST incur progressive delays without permanent lockout. `OWNER` and `CASHIER` sessions MUST have neither inactivity nor absolute expiry; the POS interface MUST lock after 15 idle minutes while preserving pending work. Application/service closure or restart, Windows restart, logout, and any other session termination MUST abandon a pending cart. Locking the shared Windows login MUST terminate an active `OWNER` POS session; Windows unlock MUST NOT authenticate an application user. Password change/recovery, role change, and activation-state change MUST revoke affected sessions, subject only to exact idempotent replay.

#### Scenario: Reject a weak or common password

- GIVEN an owner creates or changes a credential
- WHEN the proposed password misses a required character class, is shorter than eight characters, or matches the common-password denylist
- THEN the system MUST reject it without changing the credential

#### Scenario: Lock an idle POS session

- GIVEN an authenticated operational session has had no user activity for 15 minutes
- WHEN the user next accesses a protected capability
- THEN the system MUST require re-authentication before continuing and preserve the pending work unchanged

#### Scenario: Revoke affected sessions immediately

- GIVEN a user has one or more active sessions
- WHEN that user logs out, changes or recovers a password, or has their role or active state changed
- THEN every affected session MUST be rejected by the next service command

### Requirement: Offline owner credential recovery

Owner recovery MUST require the named owner and the current single-use recovery code, MUST work without Internet or a privileged support account, and MUST atomically set a compliant new password, revoke all owner sessions, consume the presented code, and issue a replacement single-use recovery code for renewed off-terminal custody. The system MUST provide no bypass. If no valid recovery code remains, recovery through the application MUST be impossible.

#### Scenario: Recover an owner account offline

- GIVEN a named owner presents the valid current recovery code without Internet access
- WHEN the owner sets a compliant new password and confirms custody of the replacement code
- THEN the system MUST revoke all prior sessions, replace the credential, consume the old code, and activate only the replacement code

### Requirement: Named account lifecycle and immutable attribution

The system MUST support multiple named owners and cashiers. Every account MUST have a visible attribution/display name. Login names MUST be unique, immutable, and never reusable; an owner MAY edit a display name with fresh authorization. Accounts MUST be deactivated rather than deleted, and historical records MUST immutably snapshot requester and authorizer user identity, login name, display name, and role. Account creation, credential reset, and reactivation MUST issue the same single-use provisional password with no time expiry and block operations until it is changed. The last active owner MUST NOT be deactivated or demoted.

#### Scenario: Activate a provisioned account

- GIVEN an owner creates, resets, or reactivates a named account with its single-use no-time-expiry provisional password
- WHEN that user authenticates before consuming it
- THEN the system MUST require a compliant password change before permitting operations

#### Scenario: Protect the last active owner

- GIVEN exactly one active owner remains
- WHEN a command would deactivate or demote that owner
- THEN the system MUST reject the command without changing account state

### Requirement: Sensitive mutation authorization and reasons

Creating/reactivating a user, editing its display name/profile, changing another user's role/credential/state, creating positive opening stock, authorizing a cashier-assisted void, adjusting stock, transferring an orphaned shift, rotating a recovery code outside recovery, mutating backup location/protection, exporting/restoring/retiring/disposing backup material, and repair/rebuild MUST require the acting owner password for that command only. Any user changing their own password MUST supply their current password plus fresh `OWNER` authorization for that command; this includes a `CASHIER` and grants no independent password authority. No authorization creates reusable elevation. Cash movements MUST NOT require fresh owner authorization. Positive opening stock, role/activation changes, another user's credential reset, void, stock adjustment, cash movement, orphan transfer, code rotation, backup protection/location/export/restore/retirement/disposal, and repair/rebuild MUST include a reason. Requests, denials, and effects retain credential-free requester/authorizer snapshots.

#### Scenario: Authorize one sensitive mutation

- GIVEN an authenticated owner requests a fresh-authorization command with its required reason
- WHEN the owner supplies the current password for that command
- THEN the service MUST execute the command only if all role and business rules still pass
- AND MUST consume the authorization whether the command succeeds or fails

#### Scenario: Reject missing fresh authorization or reason

- GIVEN a command lacks fresh owner authorization or a mandatory reason required by its boundary
- WHEN the command reaches the service
- THEN the system MUST deny it without domain mutation
- AND MUST audit the safe denial without recording the password

### Requirement: Privileged action attribution

The system MUST evaluate authorization using the identity active when requested and retain immutable requester/authorizer snapshots containing user identity, login name, display name, and role on auditable stock adjustments, cash movements, price overrides, discounts, sale confirmations, voids, user administration, and backup recovery operations where applicable.

### Requirement: Orphaned-shift transfer

When a shift is assigned to a deactivated or otherwise unavailable user, only an owner MAY transfer operational responsibility. The transfer MUST require one-command fresh password authorization and a reason, and MUST retain immutable snapshots of both the original responsible user and the accepting owner; it MUST NOT rewrite prior shift attribution.

#### Scenario: Transfer an orphaned shift

- GIVEN an open shift's responsible user can no longer operate it
- WHEN an owner provides a reason and fresh password authorization to accept responsibility
- THEN subsequent shift commands MUST be attributed to the accepting owner
- AND prior shift events MUST remain attributed to their original actors

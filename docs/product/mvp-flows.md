# MVP User and System Flows

## User flow

```mermaid
flowchart TD
    scope[Exactly one physical shop and one register] --> signIn([Sign in])
    signIn --> openSession[Open cash session and record opening float]
    openSession --> chooseTask{Choose a task}

    chooseTask --> preAccounts[Create or edit multiple independent pre-accounts]
    preAccounts --> preAccountNote[No sale, payment, reservation, or stock hold]
    preAccountNote --> chooseTask

    chooseTask --> reservation[Create a customer reservation]
    reservation --> reserved[Reserved units reduce available stock; no sale, payment, or cash movement]
    reserved --> reservationEnd[Reservation ends by conversion, cancellation, or expiry]
    reservationEnd --> releaseReservation[Release its availability hold]
    releaseReservation --> chooseTask

    chooseTask --> checkout[Start checkout]
    checkout --> paymentMethod{Payment method}
    paymentMethod -->|Cash| cashCheckout[Confirm payment, sale, stock movement, and cash movement atomically]
    cashCheckout --> cashReceipt[Issue internal non-fiscal receipt]
    cashReceipt --> chooseTask

    paymentMethod -->|Manual bank transfer| submitTransfer[Submit transfer for manual verification]
    submitTransfer --> pending[Pending: temporary checkout stock hold; no confirmed payment, sale, or cash movement]
    pending --> verification{Only an authorized supervisor verifies transfer}
    verification -->|Approved| approveTransfer[Confirm payment and sale; consume held stock; no cash movement]
    approveTransfer --> transferReceipt[Issue internal non-fiscal receipt]
    transferReceipt --> chooseTask
    verification -->|Rejected| rejectTransfer[Reject transfer and release stock hold; no sale or cash movement]
    rejectTransfer --> chooseTask

    chooseTask --> closeSession[Count cash and close cash session]
    closeSession --> reconcile[Compare expected cash with counted cash and show any discrepancy; exclude transfers]
```

## System sequence

```mermaid
sequenceDiagram
    autonumber
    actor Cashier
    actor Supervisor
    participant POS
    participant DB as System of record
    participant Receipt

    Note over POS,DB: MVP scope: exactly one physical shop and one register.
    Cashier->>POS: Sign in
    POS->>DB: Authenticate and verify cashier role
    DB-->>POS: Authenticated session and permissions
    POS-->>Cashier: Show register
    Cashier->>POS: Open cash session with opening float
    POS->>DB: Create open cash session
    DB-->>POS: Cash session opened

    loop Any number of independent pre-accounts
        Cashier->>POS: Create or edit a pre-account
        POS->>DB: Save pre-account only
        DB-->>POS: Saved without sale, collection, stock, or cash records
    end

    Cashier->>POS: Reserve items for a customer
    POS->>DB: Check availability and create customer reservation
    DB-->>POS: Reservation recorded; available stock reduced
    Note over POS,DB: Reservation creates no sale, collection, payment, stock movement, or cash movement.

    Cashier->>POS: Start cash checkout
    POS->>DB: Atomically validate stock and record confirmed cash payment, collection, sale, stock movement, and cash movement
    DB-->>POS: Commit all cash-checkout records together or commit none
    POS->>Receipt: Render receipt for confirmed sale
    Receipt-->>Cashier: Internal non-fiscal receipt

    Cashier->>POS: Submit manual bank-transfer checkout
    POS->>DB: Check availability; create pending collection and temporary checkout stock hold
    DB-->>POS: Pending; no confirmed payment, sale, stock movement, or cash movement
    Note over POS,DB: A pending transfer is never a confirmed sale or physical cash.
    Supervisor->>POS: Sign in
    POS->>DB: Authenticate supervisor
    DB->>DB: Verify supervisor/admin authorization
    DB-->>POS: Authenticated session with authorized supervisor/admin role
    POS-->>Supervisor: Show transfer verification
    Supervisor->>POS: Review transfer and submit approve/reject decision
    POS->>DB: Validate supervisor/admin authorization and record decision
    Note over POS,DB: Database role enforcement is required; UI-only permission is insufficient.
    alt Transfer approved
        DB-->>POS: Confirm payment and sale; consume held inventory; record stock movement, no cash movement
        POS->>Receipt: Render receipt for confirmed sale
        Receipt-->>Cashier: Internal non-fiscal receipt
    else Transfer rejected
        DB-->>POS: Mark collection rejected and release hold; no sale, payment, or cash movement
        POS-->>Cashier: Transfer rejected; held stock is available again
    end

    Cashier->>POS: Count cash and close cash session
    POS->>DB: Close session and calculate expected cash from opening float and cash movements
    DB-->>POS: Expected cash; transfer collections excluded
    POS-->>Cashier: Show expected cash, counted cash, and discrepancy
```

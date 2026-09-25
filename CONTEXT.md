# Mundo Kawaii POS Domain

This glossary keeps checkout commitments, completed sales, inventory, and physical cash distinct in the MVP.

**MVP scope**: Exactly one physical shop and one register.

## Checkout and customer commitments

**Pre-account**: An editable set of intended checkout items that can exist alongside other pre-accounts. It is not a sale or payment and does not reserve stock.

**Customer reservation**: A commitment to hold available units for a customer until conversion, cancellation, or expiry. It is separate from a pre-account and does not create a sale, payment, or cash movement.

**Checkout stock hold**: A temporary reduction in available stock while a manual bank transfer is awaiting verification. It is not a confirmed sale, payment, inventory movement, or cash movement.

**Collection**: A record of a checkout tender and its state, such as pending, approved, or rejected. A pending transfer collection is not a confirmed payment.

**Payment**: Confirmed settlement of a checkout amount. Cash is confirmed at checkout; a bank transfer is confirmed only after manual approval.

**Sale**: A completed checkout created after payment is confirmed. A pending transfer is not a sale.

## Inventory and register

**Product**: An item offered for sale with a name and a price in Colombian pesos.

**On-hand stock**: The count of physical units currently held by the store, before reservations and pending checkout holds reduce availability.

**Stock receipt**: An inventory event that records physical units added to on-hand stock.

**Stock adjustment**: An authorized correction that increases or decreases on-hand stock to reflect a changed or corrected count.

**Stock availability**: Units available for new commitments after customer reservations and pending transfer checkout holds are excluded from on-hand stock.

**Stock movement**: A recorded change to on-hand inventory. Reservations and checkout holds affect availability only; cash checkout and approved transfers consume inventory through a stock movement.

**Cash movement**: A recorded change in physical register cash associated with a cash session. A bank transfer, including one awaiting verification, is not a cash movement.

**Cash session**: The register's open-to-close period for its opening float, physical cash movements, and closing reconciliation. Transfer collections do not increase its cash.

**Internal receipt**: A browser-printable, non-fiscal record of a confirmed sale that satisfies the MVP receipt requirement. DIAN electronic invoicing is out of scope.

# Catalog and Inventory Specification

## Purpose

Define owner-managed products, strict non-negative stock, and traceable stock adjustments.

## Requirements

### Requirement: Product catalog management

The system MUST allow an authenticated owner to create and edit products with a name, SKU or code, optional barcode, final selling price, stock balance, category, and active status. The system MUST deny catalog management to cashiers.

#### Scenario: Owner creates an active product

- GIVEN an authenticated owner
- WHEN the owner creates a product with all required fields and an optional barcode
- THEN the system MUST retain the product and its current stock balance
- AND MUST make the active product available for sale discovery

#### Scenario: Cashier attempts to edit a product

- GIVEN an authenticated cashier and an existing product
- WHEN the cashier attempts to change the product
- THEN the system MUST deny the action
- AND MUST leave the product and stock balance unchanged

#### Scenario: Inactive product is not added to a new cart

- GIVEN a product marked inactive
- WHEN a user searches the sellable catalog or attempts to add that product to a new cart
- THEN the system MUST prevent the inactive product from being added
- AND MUST leave its stock unchanged

### Requirement: Strict stock at checkout

The system MUST reduce stock only when a sale is confirmed and MUST prevent any confirmed sale from making a product's stock negative. Cart additions, quantity edits, removals, price overrides, discounts, and abandoned carts MUST NOT change catalog stock.

#### Scenario: Confirm a sale with sufficient stock

- GIVEN an active shift and a cart whose requested quantities are available
- WHEN the sale is successfully confirmed
- THEN the system MUST reduce each product's stock by its confirmed quantity exactly once
- AND every resulting stock balance MUST be non-negative

#### Scenario: Block checkout for insufficient stock

- GIVEN a cart requests more of a product than its current stock
- WHEN the user attempts to confirm the sale
- THEN the system MUST reject confirmation
- AND MUST leave the sale, all stock balances, payment records, and shift totals unchanged

#### Scenario: Edit and abandon a cart

- GIVEN a cart contains catalog products
- WHEN the user changes quantities, removes lines, applies pricing edits, or abandons the cart before confirmation
- THEN the system MUST leave every catalog stock balance unchanged

### Requirement: Audited stock adjustment

The system MUST allow only an authenticated owner to increase or decrease stock outside sale confirmation. Each adjustment MUST retain direction, quantity, reason, user, timestamp, previous balance, and resulting balance, and MUST NOT produce negative stock.

#### Scenario: Owner records a stock increase

- GIVEN an authenticated owner and an existing product
- WHEN the owner records an increase with quantity and reason
- THEN the system MUST update the stock once
- AND MUST retain the complete adjustment audit details and resulting balance

#### Scenario: Reject an adjustment that would make stock negative

- GIVEN a product whose stock is lower than a requested decrease
- WHEN an authenticated owner submits the decrease
- THEN the system MUST reject the adjustment
- AND MUST leave both stock and adjustment history unchanged

#### Scenario: Cashier attempts a stock adjustment

- GIVEN an authenticated cashier and an existing product
- WHEN the cashier attempts to adjust stock
- THEN the system MUST deny the action
- AND MUST leave stock and adjustment history unchanged

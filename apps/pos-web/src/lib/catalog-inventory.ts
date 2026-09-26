import type { SupabaseClient, SupabaseRpc } from "./supabase";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_cop: number;
  stock_on_hand: number;
}

export interface InventoryMovement {
  id: number;
  product_id: string;
  movement_type: "receipt" | "adjustment";
  quantity_delta: number;
  note: string | null;
  actor_id: string;
  created_at: string;
  product: { sku: string; name: string } | null;
}

export interface ProductInput {
  sku: string;
  name: string;
  description?: string | null;
  priceCop: number;
}

export interface StockReceiptInput {
  productId: string;
  quantity: number;
  note?: string | null;
}

export interface StockAdjustmentInput {
  productId: string;
  quantityDelta: number;
  note?: string | null;
}

export interface CatalogInventoryClient
  extends Pick<SupabaseClient, "select" | "rpc"> {}

export interface MovementPage {
  items: InventoryMovement[];
  hasNext: boolean;
}

export const MOVEMENT_PAGE_SIZE = 25;
const MOVEMENT_FETCH_SIZE = MOVEMENT_PAGE_SIZE + 1;

function normalizedProduct(input: ProductInput) {
  const sku = input.sku.trim();
  const name = input.name.trim();
  if (!sku || !name) throw new Error("El SKU y el nombre son obligatorios.");
  if (!Number.isSafeInteger(input.priceCop) || input.priceCop < 0) {
    throw new Error("El precio debe ser un valor entero en pesos colombianos.");
  }

  const description = input.description?.trim() || null;
  return { sku, name, description };
}

function normalizedNote(note?: string | null): string | null {
  return note?.trim() || null;
}

function requireProductId(productId: string): string {
  const id = productId.trim();
  if (!id) throw new Error("Seleccioná un producto.");
  return id;
}

function requireWholeQuantity(quantity: number, description: string): void {
  if (!Number.isSafeInteger(quantity)) {
    throw new Error(`${description} debe ser un número entero.`);
  }
}

async function callRpc<T>(
  client: CatalogInventoryClient,
  name: SupabaseRpc,
  args: Readonly<Record<string, unknown>>,
): Promise<T> {
  return client.rpc<T>(name, args);
}

export async function loadCatalog(
  client: CatalogInventoryClient,
): Promise<Product[]> {
  return client.select<Product>("products", {
    select: "id,sku,name,description,price_cop,stock_on_hand",
    order: "name.asc,sku.asc",
  });
}

export async function loadMovementPage(
  client: CatalogInventoryClient,
  page: number,
): Promise<MovementPage> {
  if (!Number.isSafeInteger(page) || page < 0) {
    throw new Error("La página del historial no es válida.");
  }
  const rows = await client.select<InventoryMovement>("inventory_movements", {
    select:
      "id,product_id,movement_type,quantity_delta,note,actor_id,created_at,product:products(sku,name)",
    order: "created_at.desc,id.desc",
    limit: String(MOVEMENT_FETCH_SIZE),
    offset: String(page * MOVEMENT_PAGE_SIZE),
  });
  return {
    items: rows.slice(0, MOVEMENT_PAGE_SIZE),
    hasNext: rows.length > MOVEMENT_PAGE_SIZE,
  };
}

export async function createProduct(
  client: CatalogInventoryClient,
  input: ProductInput,
): Promise<string> {
  const product = normalizedProduct(input);
  return callRpc<string>(client, "create_product", {
    p_sku: product.sku,
    p_name: product.name,
    p_price_cop: input.priceCop,
    p_description: product.description,
  });
}

export async function updateProduct(
  client: CatalogInventoryClient,
  productId: string,
  input: ProductInput,
): Promise<void> {
  const product = normalizedProduct(input);
  await callRpc<void>(client, "update_product", {
    p_product_id: requireProductId(productId),
    p_sku: product.sku,
    p_name: product.name,
    p_price_cop: input.priceCop,
    p_description: product.description,
  });
}

export async function receiveStock(
  client: CatalogInventoryClient,
  input: StockReceiptInput,
): Promise<number> {
  requireWholeQuantity(input.quantity, "La entrada");
  if (input.quantity <= 0) {
    throw new Error("La entrada debe ser mayor que cero.");
  }
  return callRpc<number>(client, "receive_stock", {
    p_product_id: requireProductId(input.productId),
    p_quantity: input.quantity,
    p_note: normalizedNote(input.note),
  });
}

export async function adjustStock(
  client: CatalogInventoryClient,
  input: StockAdjustmentInput,
): Promise<number> {
  requireWholeQuantity(input.quantityDelta, "El ajuste");
  if (input.quantityDelta === 0) {
    throw new Error("El ajuste debe ser distinto de cero.");
  }
  return callRpc<number>(client, "adjust_stock", {
    p_product_id: requireProductId(input.productId),
    p_quantity_delta: input.quantityDelta,
    p_note: normalizedNote(input.note),
  });
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatWholeUnits(quantity: number): string {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(quantity);
}

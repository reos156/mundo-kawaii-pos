import { describe, expect, it, vi } from "vitest";
import {
  adjustStock,
  createProduct,
  formatCOP,
  loadCatalog,
  loadMovementPage,
  receiveStock,
  updateProduct,
  type CatalogInventoryClient,
} from "./catalog-inventory";

function createClient() {
  const client = {
    select: vi.fn(async () => [] as unknown[]),
    rpc: vi.fn(async () => "created-id"),
  };
  return client as unknown as CatalogInventoryClient & typeof client;
}

const product = {
  sku: "KW-001",
  name: "Sticker kawaii",
  description: "",
  priceCop: 12500,
};

describe("catalog and inventory data operations", () => {
  it("reads products through a bounded catalog query", async () => {
    const client = createClient();

    await loadCatalog(client);

    expect(client.select).toHaveBeenCalledWith("products", {
      select: "id,sku,name,description,price_cop,stock_on_hand",
      order: "name.asc,sku.asc",
    });
  });

  it("pages movement history instead of loading the whole ledger", async () => {
    const client = createClient();
    client.select.mockResolvedValue(
      Array.from({ length: 26 }, (_, index) => ({ id: index + 1 })),
    );

    const page = await loadMovementPage(client, 2);

    expect(client.select).toHaveBeenCalledWith("inventory_movements", {
      select:
        "id,product_id,movement_type,quantity_delta,note,actor_id,created_at,product:products(sku,name)",
      order: "created_at.desc,id.desc",
      limit: "26",
      offset: "50",
    });
    expect(page.items).toHaveLength(25);
    expect(page.hasNext).toBe(true);
  });

  it("creates products through the administrator-checked RPC without a stock value", async () => {
    const client = createClient();

    await createProduct(client, product);

    expect(client.rpc).toHaveBeenCalledWith("create_product", {
      p_sku: "KW-001",
      p_name: "Sticker kawaii",
      p_price_cop: 12500,
      p_description: null,
    });
  });

  it("updates product metadata through its RPC", async () => {
    const client = createClient();

    await updateProduct(client, "product-id", {
      ...product,
      description: "Edición especial",
    });

    expect(client.rpc).toHaveBeenCalledWith("update_product", {
      p_product_id: "product-id",
      p_sku: "KW-001",
      p_name: "Sticker kawaii",
      p_price_cop: 12500,
      p_description: "Edición especial",
    });
  });

  it("sends positive whole-unit receipts to the receipt RPC", async () => {
    const client = createClient();

    await receiveStock(client, {
      productId: "product-id",
      quantity: 4,
      note: "Compra semanal",
    });

    expect(client.rpc).toHaveBeenCalledWith("receive_stock", {
      p_product_id: "product-id",
      p_quantity: 4,
      p_note: "Compra semanal",
    });
  });

  it("sends nonzero signed adjustments and allows an empty note", async () => {
    const client = createClient();

    await adjustStock(client, {
      productId: "product-id",
      quantityDelta: -2,
      note: "",
    });

    expect(client.rpc).toHaveBeenCalledWith("adjust_stock", {
      p_product_id: "product-id",
      p_quantity_delta: -2,
      p_note: null,
    });
  });

  it.each([
    ["receipt", 0],
    ["receipt", 1.5],
    ["adjustment", 0],
    ["adjustment", -1.5],
  ])("rejects invalid %s quantities before making an RPC", async (kind, quantity) => {
    const client = createClient();

    if (kind === "receipt") {
      await expect(
        receiveStock(client, { productId: "product-id", quantity: Number(quantity) }),
      ).rejects.toThrow();
    } else {
      await expect(
        adjustStock(client, {
          productId: "product-id",
          quantityDelta: Number(quantity),
        }),
      ).rejects.toThrow();
    }
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("formats COP prices with no fractional pesos", () => {
    expect(formatCOP(12500)).toContain("12.500");
    expect(formatCOP(12500)).not.toMatch(/[,\.]\d{2}\s*$/);
  });
});

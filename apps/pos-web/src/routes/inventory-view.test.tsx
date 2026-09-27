import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { InventoryMovement, Product } from "../lib/catalog-inventory";
import type { SupabaseClient } from "../lib/supabase";
import { HomeRoute } from "./home";
import { InventoryView, MovementHistoryView } from "./inventory-view";

const session = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: { id: "operator-id", email: "caja@example.test" },
};

const product: Product = {
  id: "product-id",
  sku: "KW-001",
  name: "Sticker kawaii",
  description: "Edición pastel",
  price_cop: 12500,
  stock_on_hand: 8,
};

const movement: InventoryMovement = {
  id: 1,
  product_id: "product-id",
  movement_type: "receipt",
  quantity_delta: 8,
  note: "Ingreso inicial",
  actor_id: "operator-id",
  created_at: "2026-09-25T12:00:00Z",
  product: { sku: product.sku, name: product.name },
};

function makeClient(roles: { role: string }[]) {
  const client = {
    getSession: vi.fn(async () => session),
    signInWithPassword: vi.fn(async () => session),
    signOut: vi.fn(async () => {}),
    select: vi.fn(async (table: string) => {
      if (table === "role_memberships") return roles;
      if (table === "products") return [product];
      if (table === "inventory_movements") return [movement];
      return [];
    }),
    rpc: vi.fn(async () => "movement-id"),
  };
  return client as unknown as SupabaseClient & typeof client;
}

describe("read-only inventory view", () => {
  it("shows on-hand products without product or stock mutation controls", () => {
    render(<InventoryView operatorRoleLabel="Cajero" products={[product]} />);

    expect(screen.getByRole("heading", { name: "Inventario en mano" })).toBeInTheDocument();
    expect(screen.getByText("Cajero")).toBeInTheDocument();
    expect(screen.getByText("Sticker kawaii")).toBeInTheDocument();
    expect(screen.getByText("8 unidades")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar|registrar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("shows the empty catalog message without adding controls", () => {
    render(<InventoryView operatorRoleLabel="Cajero" products={[]} />);

    expect(screen.getByText("No hay productos en el catálogo.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("bounded movement history view", () => {
  it("renders movement details and reports page navigation to the route", () => {
    const onPageChange = vi.fn();

    render(
      <MovementHistoryView
        movements={[movement]}
        productCount={1}
        page={0}
        hasOlderMovements
        onPageChange={onPageChange}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Historial de movimientos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ingreso inicial")).toBeInTheDocument();
    expect(screen.getByText("+8 unidades")).toBeInTheDocument();
    expect(screen.getByText("1 productos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Movimientos más recientes" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Movimientos anteriores" }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

describe("cashier inventory route", () => {
  it("shows on-hand stock and bounded history without mutation controls", async () => {
    const client = makeClient([{ role: "cashier" }]);

    render(<HomeRoute client={client} />);

    expect((await screen.findAllByText("Sticker kawaii")).length).toBe(2);
    expect(screen.getByRole("heading", { name: "Inventario en mano" })).toBeInTheDocument();
    expect(screen.getByText("8 unidades")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Historial de movimientos" })).toBeInTheDocument();
    expect(screen.getByText("Ingreso inicial")).toBeInTheDocument();
    expect(client.select.mock.calls.map(([table]) => table)).toEqual([
      "role_memberships",
      "products",
      "inventory_movements",
    ]);
    expect(client.select).toHaveBeenCalledWith(
      "inventory_movements",
      expect.objectContaining({ limit: "26", offset: "0" }),
    );
    expect(client.rpc).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /editar|registrar|guardar|eliminar/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });
});

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "../lib/supabase";
import { HomeRoute } from "./home";

const session = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: { id: "operator-id", email: "admin@example.test" },
};

const product = {
  id: "product-id",
  sku: "KW-001",
  name: "Sticker kawaii",
  description: "Edición pastel",
  price_cop: 12500,
  stock_on_hand: 8,
};

const movement = {
  id: 1,
  product_id: "product-id",
  movement_type: "receipt",
  quantity_delta: 8,
  note: "Ingreso inicial",
  actor_id: "operator-id",
  created_at: "2026-09-25T12:00:00Z",
  product: { sku: product.sku, name: product.name },
};

interface ClientOptions {
  select?: (table: string) => unknown | Promise<unknown>;
  rpc?: (name: string, args: Readonly<Record<string, unknown>>) => unknown | Promise<unknown>;
  signOut?: () => Promise<unknown>;
}

function makeClient(roles: { role: string }[], options: ClientOptions = {}) {
  const client = {
    getSession: vi.fn(async () => session),
    signInWithPassword: vi.fn(async () => session),
    signOut: vi.fn(() => options.signOut?.() ?? Promise.resolve()),
    select: vi.fn(async (table: string) => {
      if (options.select) return options.select(table);
      if (table === "role_memberships") return roles;
      if (table === "products") return [product];
      if (table === "inventory_movements") return [movement];
      return [];
    }),
    rpc: vi.fn(async (name: string, args: Readonly<Record<string, unknown>>) => {
      if (options.rpc) return options.rpc(name, args);
      return 42;
    }),
  };
  return client as unknown as SupabaseClient & typeof client;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function findStockForm() {
  const form = await screen.findByRole("form", {
    name: "Registrar movimiento de inventario",
  });
  await within(form).findByRole("option", { name: `${product.sku} · ${product.name}` });
  return form;
}

function selectProduct(form: HTMLElement) {
  fireEvent.change(within(form).getByLabelText("Producto"), {
    target: { value: product.id },
  });
}

describe("administrator stock movement form", () => {
  it("submits receipts and signed adjustments through their respective RPCs", async () => {
    const client = makeClient([{ role: "administrator" }]);

    render(<HomeRoute client={client} />);

    const stockForm = await findStockForm();
    selectProduct(stockForm);
    const quantityInput = within(stockForm).getByLabelText("Unidades");
    expect(quantityInput).toHaveAttribute("min", "1");

    fireEvent.change(quantityInput, { target: { value: "3" } });
    fireEvent.click(within(stockForm).getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() =>
      expect(client.rpc).toHaveBeenNthCalledWith(1, "receive_stock", {
        p_product_id: "product-id",
        p_quantity: 3,
        p_note: null,
      }),
    );
    expect(await screen.findByText("Entrada registrada y vista actualizada.")).toBeInTheDocument();

    await waitFor(() => {
      expect(client.select.mock.calls.filter(([table]) => table === "products")).toHaveLength(2);
      expect(
        client.select.mock.calls.filter(([table]) => table === "inventory_movements"),
      ).toHaveLength(2);
    });

    fireEvent.change(within(stockForm).getByLabelText("Tipo de movimiento"), {
      target: { value: "adjustment" },
    });
    expect(within(stockForm).getByLabelText("Unidades")).toHaveAttribute(
      "min",
      String(-Number.MAX_SAFE_INTEGER),
    );
    selectProduct(stockForm);
    fireEvent.change(within(stockForm).getByLabelText("Unidades"), {
      target: { value: "-1" },
    });
    fireEvent.change(within(stockForm).getByLabelText("Nota (opcional)"), {
      target: { value: "  Revisión de conteo  " },
    });
    fireEvent.click(within(stockForm).getByRole("button", { name: "Registrar ajuste" }));
    await waitFor(() =>
      expect(client.rpc).toHaveBeenNthCalledWith(2, "adjust_stock", {
        p_product_id: "product-id",
        p_quantity_delta: -1,
        p_note: "Revisión de conteo",
      }),
    );
  });

  it("does not expose stock writes to a cashier", async () => {
    const client = makeClient([{ role: "cashier" }]);

    render(<HomeRoute client={client} />);

    expect(await screen.findByRole("heading", { name: "Inventario en mano" })).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: "Registrar movimiento de inventario" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar entrada" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar ajuste" })).not.toBeInTheDocument();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("does not expose stock writes when the user has no POS membership", async () => {
    const client = makeClient([]);

    render(<HomeRoute client={client} />);

    expect(await screen.findByRole("heading", { name: "Acceso pendiente" })).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: "Registrar movimiento de inventario" }),
    ).not.toBeInTheDocument();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("blocks invalid fractional, zero, and unsafe quantities before calling the RPC", async () => {
    const client = makeClient([{ role: "administrator" }]);

    render(<HomeRoute client={client} />);

    const stockForm = await findStockForm();
    selectProduct(stockForm);
    const quantityInput = within(stockForm).getByLabelText("Unidades");

    fireEvent.change(quantityInput, { target: { value: "1.5" } });
    fireEvent.submit(stockForm);
    expect(await within(stockForm).findByRole("alert")).toHaveTextContent("entero");
    expect(client.rpc).not.toHaveBeenCalled();

    fireEvent.change(within(stockForm).getByLabelText("Tipo de movimiento"), {
      target: { value: "adjustment" },
    });
    fireEvent.change(quantityInput, { target: { value: "0" } });
    fireEvent.submit(stockForm);
    expect(await within(stockForm).findByRole("alert")).toHaveTextContent("distinto de cero");
    expect(client.rpc).not.toHaveBeenCalled();

    fireEvent.change(quantityInput, { target: { value: "9007199254740992" } });
    fireEvent.submit(stockForm);
    expect(await within(stockForm).findByRole("alert")).toHaveTextContent("entero");
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("blocks duplicate submits while a stock mutation is pending", async () => {
    const rpcResult = deferred<number>();
    const client = makeClient([{ role: "administrator" }], {
      rpc: () => rpcResult.promise,
    });

    render(<HomeRoute client={client} />);

    const stockForm = await findStockForm();
    selectProduct(stockForm);
    fireEvent.change(within(stockForm).getByLabelText("Unidades"), {
      target: { value: "3" },
    });
    fireEvent.submit(stockForm);
    fireEvent.submit(stockForm);

    expect(client.rpc).toHaveBeenCalledTimes(1);
    rpcResult.resolve(42);
    expect(await screen.findByText("Entrada registrada y vista actualizada.")).toBeInTheDocument();
  });

  it("preserves a retryable draft when the mutation fails", async () => {
    let attempts = 0;
    const client = makeClient([{ role: "administrator" }], {
      rpc: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("RPC rejected");
        return 42;
      },
    });

    render(<HomeRoute client={client} />);

    const stockForm = await findStockForm();
    selectProduct(stockForm);
    fireEvent.change(within(stockForm).getByLabelText("Unidades"), {
      target: { value: "3" },
    });
    fireEvent.change(within(stockForm).getByLabelText("Nota (opcional)"), {
      target: { value: "Conteo de bodega" },
    });
    fireEvent.submit(stockForm);

    expect(await within(stockForm).findByRole("alert")).toHaveTextContent(
      "No pudimos registrar el movimiento",
    );
    expect(within(stockForm).getByLabelText("Unidades")).toHaveValue(3);
    expect(within(stockForm).getByLabelText("Nota (opcional)")).toHaveValue("Conteo de bodega");
    expect(within(stockForm).getByRole("button", { name: "Registrar entrada" })).toBeEnabled();

    fireEvent.submit(stockForm);
    expect(await screen.findByText("Entrada registrada y vista actualizada.")).toBeInTheDocument();
    expect(client.rpc).toHaveBeenCalledTimes(2);
  });

  it("reports refresh failure as a stale view after a successful mutation", async () => {
    let productReads = 0;
    const client = makeClient([{ role: "administrator" }], {
      select: async (table) => {
        if (table === "role_memberships") return [{ role: "administrator" }];
        if (table === "products") {
          productReads += 1;
          if (productReads > 1) throw new Error("Catalog refresh failed");
          return [product];
        }
        if (table === "inventory_movements") return [movement];
        return [];
      },
    });

    render(<HomeRoute client={client} />);

    const stockForm = await findStockForm();
    selectProduct(stockForm);
    fireEvent.change(within(stockForm).getByLabelText("Unidades"), {
      target: { value: "3" },
    });
    fireEvent.submit(stockForm);

    expect(client.rpc).toHaveBeenCalledWith("receive_stock", {
      p_product_id: "product-id",
      p_quantity: 3,
      p_note: null,
    });
    expect(await within(stockForm).findByRole("status")).toHaveTextContent(
      "El movimiento quedó registrado, pero no pudimos actualizar el inventario y el historial",
    );
    expect(within(stockForm).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(stockForm).getByLabelText("Unidades")).toHaveValue(null);
  });

  it.each([
    { kind: "receipt", quantity: "3", rpcName: "receive_stock" },
    { kind: "adjustment", quantity: "-1", rpcName: "adjust_stock" },
  ])("blocks a $kind submission while sign-out is pending", async ({ kind, quantity }) => {
    const signOutResult = deferred<void>();
    const client = makeClient([{ role: "administrator" }], {
      signOut: () => signOutResult.promise,
    });

    render(<HomeRoute client={client} />);

    const stockForm = await findStockForm();
    await waitFor(() => {
      expect(client.select.mock.calls.filter(([table]) => table === "products")).toHaveLength(1);
      expect(
        client.select.mock.calls.filter(([table]) => table === "inventory_movements"),
      ).toHaveLength(1);
    });
    selectProduct(stockForm);
    if (kind === "adjustment") {
      fireEvent.change(within(stockForm).getByLabelText("Tipo de movimiento"), {
        target: { value: "adjustment" },
      });
    }
    fireEvent.change(within(stockForm).getByLabelText("Unidades"), {
      target: { value: quantity },
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
      expect(client.signOut).toHaveBeenCalledTimes(1);
      fireEvent.submit(stockForm);
    });
    expect(stockForm).toBeInTheDocument();

    expect(client.rpc.mock.calls.map(([name]) => name)).not.toContain("receive_stock");
    expect(client.rpc.mock.calls.map(([name]) => name)).not.toContain("adjust_stock");

    signOutResult.resolve();
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: "Registrar movimiento de inventario" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Inventario en mano" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Entrada registrada|Ajuste registrado|El movimiento quedó registrado/)).not.toBeInTheDocument();
    expect(client.select.mock.calls.filter(([table]) => table === "products")).toHaveLength(1);
    expect(
      client.select.mock.calls.filter(([table]) => table === "inventory_movements"),
    ).toHaveLength(1);
  });

  it("ignores a mutation response that arrives after logout", async () => {
    const rpcResult = deferred<number>();
    const client = makeClient([{ role: "administrator" }], {
      rpc: () => rpcResult.promise,
    });

    render(<HomeRoute client={client} />);

    const stockForm = await findStockForm();
    selectProduct(stockForm);
    fireEvent.change(within(stockForm).getByLabelText("Unidades"), {
      target: { value: "3" },
    });
    fireEvent.submit(stockForm);
    expect(client.rpc).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    rpcResult.resolve(42);

    await waitFor(() => expect(client.rpc).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("form", { name: "Registrar movimiento de inventario" })).not.toBeInTheDocument();
    expect(screen.queryByText(/movimiento quedó registrado/)).not.toBeInTheDocument();
    expect(client.select.mock.calls.filter(([table]) => table === "products")).toHaveLength(1);
  });
});

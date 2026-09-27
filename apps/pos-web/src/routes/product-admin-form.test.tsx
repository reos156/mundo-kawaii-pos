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

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function makeClient(
  roles: { role: string }[],
  initialSession: typeof session | null = session,
  rpcResult: Promise<string> = Promise.resolve("created-id"),
) {
  const client = {
    getSession: vi.fn(async () => initialSession),
    signInWithPassword: vi.fn(async () => session),
    signOut: vi.fn(async () => {}),
    select: vi.fn(async (table: string) => {
      if (table === "role_memberships") return roles;
      if (table === "products") return [product];
      if (table === "inventory_movements") return [movement];
      return [];
    }),
    rpc: vi.fn(async () => rpcResult),
  };
  return client as unknown as SupabaseClient & typeof client;
}

describe("administrator product form", () => {
  it("creates a product through the administrator-checked RPC", async () => {
    const client = makeClient([{ role: "administrator" }]);

    render(<HomeRoute client={client} />);

    const catalogForm = await screen.findByRole("form", { name: "Administración del catálogo" });
    fireEvent.change(within(catalogForm).getByLabelText("SKU"), {
      target: { value: "KW-002" },
    });
    fireEvent.change(within(catalogForm).getByLabelText("Nombre del producto"), {
      target: { value: "Llavero kawaii" },
    });
    fireEvent.change(within(catalogForm).getByLabelText("Precio (COP)"), {
      target: { value: "18000" },
    });
    fireEvent.click(within(catalogForm).getByRole("button", { name: "Crear producto" }));

    await waitFor(() =>
      expect(client.rpc).toHaveBeenCalledWith("create_product", {
        p_sku: "KW-002",
        p_name: "Llavero kawaii",
        p_price_cop: 18000,
        p_description: null,
      }),
    );
  });

  it.each(["create", "update"] as const)(
    "treats a %s product as saved when refreshing the catalog fails",
    async (operation) => {
      const client = makeClient([{ role: "administrator" }]);
      client.select.mockImplementation(async (table: string) => {
        if (table === "products" && client.rpc.mock.calls.length > 0) {
          throw new Error("catalog refresh failed");
        }
        if (table === "role_memberships") return [{ role: "administrator" }];
        if (table === "products") return [product];
        if (table === "inventory_movements") return [movement];
        return [];
      });

      render(<HomeRoute client={client} />);

      const catalogForm = await screen.findByRole("form", {
        name: "Administración del catálogo",
      });
      await within(catalogForm).findByRole("button", { name: "Editar KW-001" });
      if (operation === "update") {
        fireEvent.click(within(catalogForm).getByRole("button", { name: "Editar KW-001" }));
        fireEvent.change(within(catalogForm).getByLabelText("Nombre del producto"), {
          target: { value: "Sticker edición nueva" },
        });
      } else {
        fireEvent.change(within(catalogForm).getByLabelText("SKU"), {
          target: { value: "KW-002" },
        });
        fireEvent.change(within(catalogForm).getByLabelText("Nombre del producto"), {
          target: { value: "Llavero kawaii" },
        });
        fireEvent.change(within(catalogForm).getByLabelText("Precio (COP)"), {
          target: { value: "18000" },
        });
      }
      fireEvent.click(
        within(catalogForm).getByRole("button", {
          name: operation === "update" ? "Guardar cambios" : "Crear producto",
        }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        operation === "update"
          ? "Los cambios sí quedaron guardados, pero no pudimos actualizar el catálogo."
          : "El producto sí quedó guardado, pero no pudimos actualizar el catálogo.",
      );
      expect(within(catalogForm).getByLabelText("SKU")).toHaveValue("");
      expect(within(catalogForm).getByLabelText("Nombre del producto")).toHaveValue("");
      expect(within(catalogForm).getByLabelText("Precio (COP)")).toHaveValue(null);
      expect(within(catalogForm).getByRole("button", { name: "Crear producto" })).toBeEnabled();
      expect(
        within(catalogForm).queryByRole("button", { name: "Cancelar edición" }),
      ).not.toBeInTheDocument();
      expect(client.rpc).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["create", "update"] as const)(
    "retains the %s draft when its product RPC fails",
    async (operation) => {
      const client = makeClient([{ role: "administrator" }]);
      client.rpc.mockRejectedValueOnce(new Error("product write failed"));

      render(<HomeRoute client={client} />);

      const catalogForm = await screen.findByRole("form", {
        name: "Administración del catálogo",
      });
      await within(catalogForm).findByRole("button", { name: "Editar KW-001" });
      if (operation === "update") {
        fireEvent.click(within(catalogForm).getByRole("button", { name: "Editar KW-001" }));
        fireEvent.change(within(catalogForm).getByLabelText("Nombre del producto"), {
          target: { value: "Sticker edición corregida" },
        });
      } else {
        fireEvent.change(within(catalogForm).getByLabelText("SKU"), {
          target: { value: "KW-002" },
        });
        fireEvent.change(within(catalogForm).getByLabelText("Nombre del producto"), {
          target: { value: "Llavero kawaii" },
        });
        fireEvent.change(within(catalogForm).getByLabelText("Precio (COP)"), {
          target: { value: "18000" },
        });
      }
      fireEvent.click(
        within(catalogForm).getByRole("button", {
          name: operation === "update" ? "Guardar cambios" : "Crear producto",
        }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "No pudimos guardar el producto. Revisá los datos y tus permisos.",
      );
      expect(within(catalogForm).getByLabelText("SKU")).toHaveValue(
        operation === "update" ? "KW-001" : "KW-002",
      );
      expect(within(catalogForm).getByLabelText("Nombre del producto")).toHaveValue(
        operation === "update" ? "Sticker edición corregida" : "Llavero kawaii",
      );
      expect(within(catalogForm).getByRole("button", {
        name: operation === "update" ? "Guardar cambios" : "Crear producto",
      })).toBeEnabled();
      expect(client.rpc).toHaveBeenCalledTimes(1);
    },
  );

  it("does not surface a catalog refresh failure after logout", async () => {
    const pendingRefresh = deferred<(typeof product)[]>();
    const client = makeClient([{ role: "administrator" }], null);
    let refreshStarted = false;
    client.select.mockImplementation(async (table: string) => {
      if (table === "products" && client.rpc.mock.calls.length > 0 && !refreshStarted) {
        refreshStarted = true;
        return pendingRefresh.promise;
      }
      if (table === "role_memberships") return [{ role: "administrator" }];
      if (table === "products") return [product];
      if (table === "inventory_movements") return [movement];
      return [];
    });

    render(<HomeRoute client={client} />);

    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "admin@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "operator-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    const catalogForm = await screen.findByRole("form", { name: "Administración del catálogo" });
    await within(catalogForm).findByRole("button", { name: "Editar KW-001" });
    fireEvent.change(within(catalogForm).getByLabelText("SKU"), {
      target: { value: "KW-002" },
    });
    fireEvent.change(within(catalogForm).getByLabelText("Nombre del producto"), {
      target: { value: "Llavero kawaii" },
    });
    fireEvent.change(within(catalogForm).getByLabelText("Precio (COP)"), {
      target: { value: "18000" },
    });
    fireEvent.click(within(catalogForm).getByRole("button", { name: "Crear producto" }));
    await waitFor(() => expect(refreshStarted).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    await act(async () => {
      pendingRefresh.reject(new Error("catalog refresh failed"));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });

    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "operator-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    const reauthenticatedForm = await screen.findByRole("form", {
      name: "Administración del catálogo",
    });
    expect(
      within(reauthenticatedForm).queryByText(
        "El producto sí quedó guardado, pero no pudimos actualizar el catálogo.",
      ),
    ).not.toBeInTheDocument();
    expect(within(reauthenticatedForm).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ignores a product mutation that finishes after logout", async () => {
    const pendingRpc = deferred<string>();
    const client = makeClient([{ role: "administrator" }], null, pendingRpc.promise);

    render(<HomeRoute client={client} />);

    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "admin@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "operator-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    const catalogForm = await screen.findByRole("form", { name: "Administración del catálogo" });
    await waitFor(() =>
      expect(client.select.mock.calls.some(([table]) => table === "products")).toBe(true),
    );
    const catalogLoadCount = client.select.mock.calls.filter(([table]) => table === "products").length;
    fireEvent.change(within(catalogForm).getByLabelText("SKU"), {
      target: { value: "KW-002" },
    });
    fireEvent.change(within(catalogForm).getByLabelText("Nombre del producto"), {
      target: { value: "Llavero kawaii" },
    });
    fireEvent.change(within(catalogForm).getByLabelText("Precio (COP)"), {
      target: { value: "18000" },
    });
    fireEvent.click(within(catalogForm).getByRole("button", { name: "Crear producto" }));
    await waitFor(() =>
      expect(client.rpc).toHaveBeenCalledWith("create_product", {
        p_sku: "KW-002",
        p_name: "Llavero kawaii",
        p_price_cop: 18000,
        p_description: null,
      }),
    );
    const initialAccountLoadCount = client.select.mock.calls.filter(
      ([table]) => table === "role_memberships",
    ).length;

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();

    await act(async () => {
      pendingRpc.resolve("created-id");
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });

    expect(
      client.select.mock.calls.filter(([table]) => table === "role_memberships"),
    ).toHaveLength(initialAccountLoadCount);
    expect(
      client.select.mock.calls.filter(([table]) => table === "products"),
    ).toHaveLength(catalogLoadCount);
    expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Administración del catálogo" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });

  it("updates an existing product through the administrator-checked RPC", async () => {
    const client = makeClient([{ role: "administrator" }]);

    render(<HomeRoute client={client} />);

    const catalogForm = await screen.findByRole("form", { name: "Administración del catálogo" });
    fireEvent.click(await within(catalogForm).findByRole("button", { name: "Editar KW-001" }));
    fireEvent.change(within(catalogForm).getByLabelText("Nombre del producto"), {
      target: { value: "Sticker edición nueva" },
    });
    fireEvent.click(within(catalogForm).getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(client.rpc).toHaveBeenCalledWith("update_product", {
        p_product_id: "product-id",
        p_sku: "KW-001",
        p_name: "Sticker edición nueva",
        p_price_cop: 12500,
        p_description: "Edición pastel",
      }),
    );
  });

  it("keeps the existing product edit and cancel controls in the admin form", async () => {
    const client = makeClient([{ role: "administrator" }]);

    render(<HomeRoute client={client} />);

    const catalogForm = await screen.findByRole("form", { name: "Administración del catálogo" });
    fireEvent.click(await within(catalogForm).findByRole("button", { name: "Editar KW-001" }));

    expect(await screen.findByRole("heading", { name: "Editar producto" })).toBeInTheDocument();
    expect(within(catalogForm).getByLabelText("SKU")).toHaveValue("KW-001");
    expect(within(catalogForm).getByLabelText("Nombre del producto")).toHaveValue(
      "Sticker kawaii",
    );
    expect(within(catalogForm).getByLabelText("Precio (COP)")).toHaveValue(12500);

    fireEvent.click(within(catalogForm).getByRole("button", { name: "Cancelar edición" }));

    expect(
      await screen.findByRole("heading", { name: "Administración del catálogo" }),
    ).toBeInTheDocument();
  });

  it("does not expose product administration to a cashier", async () => {
    const client = makeClient([{ role: "cashier" }]);

    render(<HomeRoute client={client} />);

    expect(await screen.findByRole("heading", { name: "Inventario en mano" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Administración del catálogo" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar KW-001" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Crear producto" })).not.toBeInTheDocument();
  });
});

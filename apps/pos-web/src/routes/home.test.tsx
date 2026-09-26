import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { HomeRoute } from "./home";
import type { SupabaseClient } from "../lib/supabase";

it("retains a provisioned sign-in through role lookup failure and retry", async () => {
  const session = { user: { id: "operator-id", email: "admin@example.test" } };
  const client = {
    getSession: vi.fn(async () => null),
    signInWithPassword: vi.fn()
      .mockRejectedValueOnce(new Error("invalid credentials"))
      .mockResolvedValue(session),
    signOut: vi.fn(async () => {}),
    select: vi.fn()
      .mockRejectedValueOnce(new Error("membership lookup failed"))
      .mockResolvedValue([{ role: "cashier" }]),
  };
  render(<HomeRoute client={client as unknown as SupabaseClient} />);
  expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /crear cuenta|registrarse/i })).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "admin@example.test" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "wrong" } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo iniciar sesión");
  expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  expect(client.select).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "operator-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  expect(await screen.findByRole("heading", { name: "No pudimos cargar el POS" })).toBeInTheDocument();
  expect(screen.getByText("admin@example.test")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByRole("heading", { name: "Sesión verificada" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
  expect(client.signOut).toHaveBeenCalledOnce();
  expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  expect(client.signInWithPassword).toHaveBeenCalledWith("admin@example.test", "operator-password");
});

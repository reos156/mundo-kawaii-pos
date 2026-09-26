import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { HomeRoute } from "./home";
import type { SupabaseClient } from "../lib/supabase";

it("signs in a provisioned operator without public signup", async () => {
  const session = {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: { id: "operator-id", email: "caja@example.test" },
  };
  const client = {
    getSession: vi.fn(async () => null),
    signInWithPassword: vi.fn(async () => session),
    signOut: vi.fn(async () => {}),
    select: vi.fn(async () => [{ role: "administrator" }]),
  };

  render(<HomeRoute client={client as unknown as SupabaseClient} />);
  expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /crear cuenta|registrarse/i })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "admin@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "operator-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

  expect(await screen.findByRole("heading", { name: "Sesión verificada" })).toBeInTheDocument();
  expect(client.signInWithPassword).toHaveBeenCalledWith("admin@example.test", "operator-password");
});

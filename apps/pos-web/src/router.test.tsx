import { RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "./router";

describe("POS home route", () => {
  it("introduces a single-store, single-register shell and marks unfinished functions", async () => {
    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Mundo Kawaii POS" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tienda única · Caja 1")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Las funciones del punto de venta todavía no están disponibles.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Función pendiente")).not.toHaveLength(0);
  });
});

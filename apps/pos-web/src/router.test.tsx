import { RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "./router";

describe("POS home route", () => {
  it("introduces the single-store, single-register shell", async () => {
    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Mundo Kawaii POS" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tienda única · Caja 1")).toBeInTheDocument();
    expect(screen.queryByText("Función pendiente")).not.toBeInTheDocument();
  });
});

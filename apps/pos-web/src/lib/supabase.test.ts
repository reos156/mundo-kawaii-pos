import { describe, expect, it, vi } from "vitest";
import { createSupabaseClient } from "./supabase";

describe("authenticated Supabase access", () => {
  it("uses only the public key for password auth and the user session for RLS reads", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const authPayload = {
      access_token: "operator-session-token",
      refresh_token: "operator-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      user: { id: "operator-id", email: "operator@example.test" },
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(authPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: "product-id" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const client = createSupabaseClient(
      { url: "https://project.example.test", anonKey: "public-anon-key" },
      { storage, fetcher: fetcher as typeof fetch, now: () => 1_700_000_000_000 },
    );

    await client.signInWithPassword("operator@example.test", "password");
    await client.select("products", { select: "id" });

    const authRequest = fetcher.mock.calls[0];
    const authHeaders = new Headers(authRequest?.[1]?.headers);
    expect(authRequest?.[0]).toBe(
      "https://project.example.test/auth/v1/token?grant_type=password",
    );
    expect(authHeaders.get("apikey")).toBe("public-anon-key");
    expect(authHeaders.get("authorization")).toBeNull();

    const dataRequest = fetcher.mock.calls[1];
    const dataHeaders = new Headers(dataRequest?.[1]?.headers);
    expect(String(dataRequest?.[0])).toContain("/rest/v1/products?select=id");
    expect(dataHeaders.get("apikey")).toBe("public-anon-key");
    expect(dataHeaders.get("authorization")).toBe("Bearer operator-session-token");
  });
});

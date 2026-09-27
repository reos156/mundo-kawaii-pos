import type { FormEvent } from "react";
import type { Product } from "../lib/catalog-inventory";

export type MovementKind = "receipt" | "adjustment";

export interface MovementDraft {
  productId: string;
  kind: MovementKind;
  quantity: string;
  note: string;
}

export interface StockMovementFormState {
  draft: MovementDraft;
  busy: boolean;
  message: string;
  error: string;
}

export interface StockMovementFormProps {
  products: readonly Product[];
  state: StockMovementFormState;
  onDraftChange: (update: Partial<MovementDraft>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function StockMovementForm({
  products,
  state,
  onDraftChange,
  onSubmit,
}: StockMovementFormProps) {
  const { draft, busy, message, error } = state;

  return (
    <form
      aria-label="Registrar movimiento de inventario"
      className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8"
      onSubmit={onSubmit}
    >
      <div>
        <h2 className="text-xl font-semibold">Movimientos de inventario</h2>
        <p className="mt-1 text-sm text-slate-600">
          Las entradas son positivas; los ajustes aceptan un cambio entero con signo.
        </p>
      </div>
      <label className="block text-sm font-medium">
        Producto
        <select
          className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
          onChange={(event) => onDraftChange({ productId: event.currentTarget.value })}
          required
          value={draft.productId}
        >
          <option disabled value="">
            Selecciona un producto
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.sku} · {product.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Tipo de movimiento
        <select
          className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
          onChange={(event) =>
            onDraftChange({ kind: event.currentTarget.value as MovementKind, quantity: "" })
          }
          value={draft.kind}
        >
          <option value="receipt">Entrada de inventario</option>
          <option value="adjustment">Ajuste firmado</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Unidades
        <input
          className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
          max={Number.MAX_SAFE_INTEGER}
          min={draft.kind === "receipt" ? "1" : -Number.MAX_SAFE_INTEGER}
          onChange={(event) => onDraftChange({ quantity: event.currentTarget.value })}
          required
          step="1"
          type="number"
          value={draft.quantity}
        />
      </label>
      <label className="block text-sm font-medium">
        Nota (opcional)
        <textarea
          className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
          onChange={(event) => onDraftChange({ note: event.currentTarget.value })}
          rows={2}
          value={draft.note}
        />
      </label>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-green-800" role="status">
          {message}
        </p>
      )}
      <button
        className="rounded-xl bg-pink-700 px-4 py-2.5 font-semibold text-white hover:bg-pink-800 disabled:opacity-60"
        disabled={busy || products.length === 0}
        type="submit"
      >
        {busy
          ? "Registrando…"
          : draft.kind === "receipt"
            ? "Registrar entrada"
            : "Registrar ajuste"}
      </button>
    </form>
  );
}

import type { FormEvent } from "react";
import type { Product } from "../lib/catalog-inventory";

export interface ProductDraft {
  sku: string;
  name: string;
  description: string;
  priceCop: string;
}

export interface ProductAdminFormState {
  draft: ProductDraft;
  editingProductId: string | null;
  busy: boolean;
  message: string;
  error: string;
}

export interface ProductAdminFormProps {
  products: readonly Product[];
  state: ProductAdminFormState;
  onDraftChange: (update: Partial<ProductDraft>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditProduct: (product: Product) => void;
  onCancelEdit: () => void;
}

export function ProductAdminForm({
  products,
  state,
  onDraftChange,
  onSubmit,
  onEditProduct,
  onCancelEdit,
}: ProductAdminFormProps) {
  const { draft, editingProductId, busy, message, error } = state;

  return (
    <form
      aria-label="Administración del catálogo"
      className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8"
      onSubmit={onSubmit}
    >
      <div>
        <h2 className="text-xl font-semibold">
          {editingProductId ? "Editar producto" : "Administración del catálogo"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Los productos nuevos empiezan con cero unidades en mano.
        </p>
      </div>
      {products.length > 0 && (
        <div aria-label="Productos para editar" className="flex flex-wrap gap-2">
          {products.map((product) => (
            <button
              className="rounded-lg border border-rose-200 px-3 py-1.5 font-semibold text-pink-800 hover:bg-rose-50"
              key={product.id}
              onClick={() => onEditProduct(product)}
              type="button"
            >
              Editar {product.sku}
            </button>
          ))}
        </div>
      )}
      <label className="block text-sm font-medium">
        SKU
        <input
          className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
          onChange={(event) => onDraftChange({ sku: event.currentTarget.value })}
          required
          value={draft.sku}
        />
      </label>
      <label className="block text-sm font-medium">
        Nombre del producto
        <input
          className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
          onChange={(event) => onDraftChange({ name: event.currentTarget.value })}
          required
          value={draft.name}
        />
      </label>
      <label className="block text-sm font-medium">
        Descripción (opcional)
        <textarea
          className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
          onChange={(event) => onDraftChange({ description: event.currentTarget.value })}
          rows={2}
          value={draft.description}
        />
      </label>
      <label className="block text-sm font-medium">
        Precio (COP)
        <input
          className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
          min="0"
          onChange={(event) => onDraftChange({ priceCop: event.currentTarget.value })}
          required
          step="1"
          type="number"
          value={draft.priceCop}
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
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-pink-700 px-4 py-2.5 font-semibold text-white hover:bg-pink-800 disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy
            ? "Guardando…"
            : editingProductId
              ? "Guardar cambios"
              : "Crear producto"}
        </button>
        {editingProductId && (
          <button
            className="rounded-xl border border-rose-200 px-4 py-2.5 font-semibold text-pink-800"
            onClick={onCancelEdit}
            type="button"
          >
            Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
}

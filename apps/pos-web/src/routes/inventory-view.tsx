import type { InventoryMovement, Product } from "../lib/catalog-inventory";
import { formatCOP, formatWholeUnits } from "../lib/catalog-inventory";

export interface InventoryViewProps {
  products: readonly Product[];
  operatorRoleLabel: string;
}

export function InventoryView({ products, operatorRoleLabel }: InventoryViewProps) {
  return (
    <section
      aria-labelledby="inventory-title"
      className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold" id="inventory-title">
            Inventario en mano
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            El saldo mostrado es el inventario en mano; todavía no descuenta reservas ni
            transferencias pendientes.
          </p>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-pink-800">
          {operatorRoleLabel}
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-rose-100 text-slate-600">
              <th className="px-3 py-3 font-semibold">SKU</th>
              <th className="px-3 py-3 font-semibold">Producto</th>
              <th className="px-3 py-3 font-semibold">Precio</th>
              <th className="px-3 py-3 font-semibold">Existencias en mano</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="px-3 py-5 text-slate-600" colSpan={4}>
                  No hay productos en el catálogo.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr className="border-b border-rose-50" key={product.id}>
                  <td className="px-3 py-4 font-mono text-xs">{product.sku}</td>
                  <td className="px-3 py-4">
                    <p className="font-semibold">{product.name}</p>
                    {product.description && (
                      <p className="mt-1 text-xs text-slate-500">{product.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {formatCOP(product.price_cop)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {formatWholeUnits(product.stock_on_hand)} unidades
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export interface MovementHistoryViewProps {
  movements: readonly InventoryMovement[];
  productCount: number;
  page: number;
  hasOlderMovements: boolean;
  onPageChange: (nextPage: number) => void;
}

const numberFormat = new Intl.NumberFormat("es-CO");
const dateTimeFormat = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatMovementQuantity(delta: number): string {
  return `${delta > 0 ? "+" : ""}${formatWholeUnits(delta)}`;
}

function formatMovementDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : dateTimeFormat.format(date);
}

export function MovementHistoryView({
  movements,
  productCount,
  page,
  hasOlderMovements,
  onPageChange,
}: MovementHistoryViewProps) {
  return (
    <section
      aria-labelledby="history-title"
      className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold" id="history-title">
            Historial de movimientos
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Se muestran hasta 25 registros por página, del más reciente al más antiguo.
          </p>
        </div>
        {productCount > 0 && (
          <p className="text-sm text-slate-600">
            {numberFormat.format(productCount)} productos
          </p>
        )}
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-rose-100 text-slate-600">
              <th className="px-3 py-3 font-semibold">Fecha</th>
              <th className="px-3 py-3 font-semibold">Producto</th>
              <th className="px-3 py-3 font-semibold">Movimiento</th>
              <th className="px-3 py-3 font-semibold">Cambio</th>
              <th className="px-3 py-3 font-semibold">Nota</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td className="px-3 py-5 text-slate-600" colSpan={5}>
                  Todavía no hay movimientos de inventario.
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr className="border-b border-rose-50" key={movement.id}>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {formatMovementDate(movement.created_at)}
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-semibold">{movement.product?.name ?? "Producto"}</p>
                    <p className="font-mono text-xs text-slate-500">
                      {movement.product?.sku ?? movement.product_id}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    {movement.movement_type === "receipt" ? "Entrada" : "Ajuste"}
                  </td>
                  <td className="px-3 py-4 font-semibold">
                    {formatMovementQuantity(movement.quantity_delta)} unidades
                  </td>
                  <td className="px-3 py-4">{movement.note || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <nav aria-label="Páginas del historial" className="mt-5 flex justify-between">
        <button
          className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-pink-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Movimientos más recientes
        </button>
        <span className="self-center text-sm text-slate-600">
          Página {numberFormat.format(page + 1)}
        </span>
        <button
          className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-pink-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasOlderMovements}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Movimientos anteriores
        </button>
      </nav>
    </section>
  );
}

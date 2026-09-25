const pendingFunctions = ["Precuentas", "Reservas", "Ventas e inventario"];

export function HomeRoute() {
  return (
    <main className="min-h-screen bg-rose-50 px-6 py-10 text-slate-900 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl bg-white p-8 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-700">
            Punto de venta
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Mundo Kawaii POS
          </h1>
          <p className="mt-3 text-slate-600">Tienda única · Caja 1</p>
        </header>

        <section aria-labelledby="pending-title" className="mt-8">
          <h2 id="pending-title" className="text-xl font-semibold">
            Funciones del punto de venta
          </h2>
          <p className="mt-2 text-slate-600">
            Las funciones del punto de venta todavía no están disponibles.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingFunctions.map((name) => (
              <article
                key={name}
                className="rounded-2xl border border-rose-100 bg-white p-5"
              >
                <p className="text-sm font-medium text-pink-700">
                  Función pendiente
                </p>
                <h3 className="mt-2 font-semibold">{name}</h3>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

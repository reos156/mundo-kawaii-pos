import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  getSupabaseClient,
  type SupabaseClient,
  type SupabaseSession,
} from "../lib/supabase";
import {
  createProduct,
  loadCatalog,
  loadMovementPage,
  updateProduct,
  type InventoryMovement,
  type Product,
  type ProductInput,
} from "../lib/catalog-inventory";
import { InventoryView, MovementHistoryView } from "./inventory-view";
import { ProductAdminForm, type ProductAdminFormState, type ProductDraft } from "./product-admin-form";

interface HomeRouteProps {
  client?: SupabaseClient | null;
}

type AppState = "configuration" | "loading" | "signed-out" | "denied" | "ready" | "error";
type OperatorRole = "cashier" | "administrator";

function roleLabel(role: OperatorRole): string {
  return role === "administrator" ? "Administrador" : "Cajero";
}

const emptyProductAdminState: ProductAdminFormState = {
  draft: { sku: "", name: "", description: "", priceCop: "" },
  editingProductId: null,
  busy: false,
  message: "",
  error: "",
};

export function HomeRoute({ client }: HomeRouteProps = {}) {
  const supabase = useMemo(
    () => (client === undefined ? getSupabaseClient() : client),
    [client],
  );
  const [appState, setAppState] = useState<AppState>(() =>
    supabase ? "loading" : "configuration",
  );
  const loadGeneration = useRef(0);
  const inventoryGeneration = useRef(0);
  const sessionEpoch = useRef(0);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [hasOlderMovements, setHasOlderMovements] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [role, setRole] = useState<OperatorRole | null>(null);
  const [productAdminState, setProductAdminState] = useState(emptyProductAdminState);
  const [pageError, setPageError] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInBusy, setSignInBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signOutError, setSignOutError] = useState("");

  const loadAccount = useCallback(
    async (activeSession: SupabaseSession, actionEpoch: number) => {
      if (!supabase || actionEpoch !== sessionEpoch.current) return;

      const requestGeneration = ++loadGeneration.current;
      const isCurrentRequest = () =>
        actionEpoch === sessionEpoch.current && requestGeneration === loadGeneration.current;

      setSession(activeSession);
      try {
        const memberships = await supabase.select<{ role: string }>("role_memberships", {
          select: "role",
          user_id: `eq.${activeSession.user.id}`,
        });
        if (!isCurrentRequest()) return;

        const nextRole: OperatorRole | null = memberships.some(
          (membership) => membership.role === "administrator",
        )
          ? "administrator"
          : memberships.some((membership) => membership.role === "cashier")
            ? "cashier"
            : null;

        setRole(nextRole);
        setAppState(nextRole ? "ready" : "denied");
      } catch (error) {
        if (isCurrentRequest()) throw error;
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      setAppState("configuration");
      return;
    }

    const actionEpoch = sessionEpoch.current;
    let active = true;
    void supabase
      .getSession()
      .then(async (storedSession) => {
        if (!active || actionEpoch !== sessionEpoch.current) return;
        if (!storedSession) {
          setAppState("signed-out");
          return;
        }
        setAppState("loading");
        await loadAccount(storedSession, actionEpoch);
      })
      .catch(() => {
        if (active && actionEpoch === sessionEpoch.current) {
          setPageError("No pudimos verificar la sesión. Iniciá sesión de nuevo.");
          setAppState("error");
        }
      });

    return () => {
      active = false;
      sessionEpoch.current += 1;
      loadGeneration.current += 1;
    };
  }, [loadAccount, supabase]);

  useEffect(() => {
    if (!supabase || appState !== "ready" || !session || !role) {
      setProducts([]);
      setMovements([]);
      setHasOlderMovements(false);
      setHistoryPage(0);
      return;
    }
    const epoch = sessionEpoch.current;
    const request = ++inventoryGeneration.current;
    let active = true;
    const current = () =>
      active &&
      epoch === sessionEpoch.current &&
      request === inventoryGeneration.current;
    void Promise.all([loadCatalog(supabase), loadMovementPage(supabase, historyPage)])
      .then(([catalog, page]) => {
        if (!current()) return;
        setProducts(catalog);
        setMovements(page.items);
        setHasOlderMovements(page.hasNext);
      })
      .catch(() => {
        if (!current()) return;
        setPageError("No pudimos cargar el inventario.");
        setAppState("error");
      });
    return () => {
      active = false;
      inventoryGeneration.current += 1;
    };
  }, [appState, historyPage, role, session, supabase]);

  function handleProductDraftChange(update: Partial<ProductDraft>) {
    setProductAdminState((current) => ({
      ...current,
      draft: { ...current.draft, ...update },
      error: "",
      message: "",
    }));
  }

  function handleEditProduct(product: Product) {
    setProductAdminState({
      ...emptyProductAdminState,
      editingProductId: product.id,
      draft: {
        sku: product.sku,
        name: product.name,
        description: product.description ?? "",
        priceCop: String(product.price_cop),
      },
    });
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || role !== "administrator" || !session || productAdminState.busy) return;

    const actionEpoch = sessionEpoch.current;
    const { draft, editingProductId } = productAdminState;
    const input: ProductInput = { ...draft, priceCop: Number(draft.priceCop) };
    setProductAdminState((current) => ({ ...current, busy: true, error: "", message: "" }));
    try {
      if (editingProductId) await updateProduct(supabase, editingProductId, input);
      else await createProduct(supabase, input);
    } catch {
      if (actionEpoch !== sessionEpoch.current) return;
      setProductAdminState((current) => ({
        ...current,
        busy: false,
        error: "No pudimos guardar el producto. Revisá los datos y tus permisos.",
      }));
      return;
    }

    if (actionEpoch !== sessionEpoch.current) return;
    setProductAdminState({ ...emptyProductAdminState, busy: true });
    try {
      const catalog = await loadCatalog(supabase);
      if (actionEpoch !== sessionEpoch.current) return;
      setProducts(catalog);
      setProductAdminState({
        ...emptyProductAdminState,
        message: editingProductId ? "Producto actualizado." : "Producto creado.",
      });
    } catch {
      if (actionEpoch !== sessionEpoch.current) return;
      setProductAdminState({
        ...emptyProductAdminState,
        message: editingProductId
          ? "Los cambios sí quedaron guardados, pero no pudimos actualizar el catálogo."
          : "El producto sí quedó guardado, pero no pudimos actualizar el catálogo.",
      });
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || signInBusy) return;

    const actionEpoch = sessionEpoch.current;
    setSignInBusy(true);
    setSignInError("");
    setPageError("");
    setAppState("loading");
    try {
      const nextSession = await supabase.signInWithPassword(email, password);
      if (actionEpoch !== sessionEpoch.current) return;
      setPassword("");
      try {
        await loadAccount(nextSession, actionEpoch);
      } catch {
        if (actionEpoch !== sessionEpoch.current) return;
        setPageError("No pudimos verificar tu rol.");
        setAppState("error");
      }
    } catch {
      if (actionEpoch !== sessionEpoch.current) return;
      setSignInError("No se pudo iniciar sesión. Verificá el correo, la contraseña y la conexión.");
      setAppState("signed-out");
    } finally {
      if (actionEpoch === sessionEpoch.current) setSignInBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    const actionEpoch = ++sessionEpoch.current;
    loadGeneration.current += 1;
    inventoryGeneration.current += 1;
    setProducts([]);
    setMovements([]);
    setHasOlderMovements(false);
    setHistoryPage(0);
    setProductAdminState(emptyProductAdminState);
    setSignOutError("");
    try {
      await supabase.signOut();
    } catch {
      if (actionEpoch === sessionEpoch.current) {
        setSignOutError("La sesión se cerró en este dispositivo, pero Supabase no confirmó la salida.");
      }
    } finally {
      if (actionEpoch === sessionEpoch.current) {
        setSession(null);
        setRole(null);
        setSignInBusy(false);
        setAppState("signed-out");
      }
    }
  }

  const currentOperator = session?.user.email;

  return (
    <main className="min-h-screen bg-rose-50 px-6 py-10 text-slate-900 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-8 shadow-sm sm:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-700">
              Punto de venta
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Mundo Kawaii POS
            </h1>
            <p className="mt-3 text-slate-600">Tienda única · Caja 1</p>
          </div>
          {session && appState !== "signed-out" && appState !== "configuration" && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600">
                {currentOperator ?? "Operador"}
                {role ? ` · ${roleLabel(role)}` : ""}
              </p>
              <button
                className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-pink-800 hover:bg-rose-50"
                onClick={() => void handleSignOut()}
                type="button"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </header>

        <section aria-live="polite" className="mt-8">
          {appState === "configuration" && (
            <article className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">Configuración de Supabase pendiente</h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                Para conectar esta caja, configurá estas variables públicas en el entorno de
                desarrollo y reiniciá Vite:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>
                  <code>VITE_SUPABASE_URL=https://your-project-ref.supabase.co</code>
                </li>
                <li>
                  <code>VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key</code>
                </li>
              </ul>
              <p className="mt-4 text-sm text-slate-600">
                Usá solamente la clave pública anon o publishable. Nunca pongas una clave
                service-role ni otro secreto en el navegador.
              </p>
            </article>
          )}

          {appState === "loading" && (
            <p className="rounded-2xl bg-white p-6 text-slate-700" role="status">
              Validando sesión y rol…
            </p>
          )}

          {appState === "signed-out" && (
            <article className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
              <p className="mt-2 text-slate-600">
                Ingresá con la cuenta que te aprovisionó el administrador de la tienda.
              </p>
              <form className="mt-6 space-y-4" onSubmit={(event) => void handleSignIn(event)}>
                <label className="block text-sm font-medium">
                  Correo electrónico
                  <input
                    autoComplete="username"
                    className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
                    onChange={(event) => setEmail(event.currentTarget.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Contraseña
                  <input
                    autoComplete="current-password"
                    className="mt-1 w-full rounded-xl border border-rose-200 px-3 py-2"
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
                {signInError && (
                  <p className="text-sm text-red-700" role="alert">
                    {signInError}
                  </p>
                )}
                {signOutError && (
                  <p className="text-sm text-amber-800" role="status">
                    {signOutError}
                  </p>
                )}
                <button
                  className="w-full rounded-xl bg-pink-700 px-4 py-3 font-semibold text-white hover:bg-pink-800 disabled:opacity-60"
                  disabled={signInBusy}
                  type="submit"
                >
                  {signInBusy ? "Ingresando…" : "Ingresar"}
                </button>
              </form>
            </article>
          )}

          {appState === "denied" && (
            <article className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">Acceso pendiente</h2>
              <p className="mt-3 text-slate-700">
                Tu usuario todavía no tiene un rol asignado. Pedile a un administrador que te
                asigne el rol de cajero o administrador para habilitar el acceso al POS.
              </p>
              <button
                className="mt-5 rounded-xl border border-rose-200 px-4 py-2 font-semibold text-pink-800 hover:bg-rose-50"
                onClick={() => void handleSignOut()}
                type="button"
              >
                Cerrar sesión
              </button>
            </article>
          )}

          {appState === "error" && (
            <article className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">No pudimos cargar el POS</h2>
              <p className="mt-3 text-slate-600">
                {pageError || "Verificá la conexión y tus permisos, y volvé a intentar."}
              </p>
              {session && (
                <button
                  className="mt-5 rounded-xl bg-pink-700 px-4 py-2 font-semibold text-white"
                  onClick={() => {
                    const actionEpoch = sessionEpoch.current;
                    setAppState("loading");
                    void loadAccount(session, actionEpoch).catch(() => {
                      if (actionEpoch !== sessionEpoch.current) return;
                      setPageError("No pudimos verificar tu rol.");
                      setAppState("error");
                    });
                  }}
                  type="button"
                >
                  Reintentar
                </button>
              )}
            </article>
          )}

          {appState === "ready" && session && role && (
            <div className="space-y-8">
              <h2 className="sr-only">Sesión verificada</h2>
              {role === "administrator" && (
                <ProductAdminForm
                  products={products}
                  state={productAdminState}
                  onDraftChange={handleProductDraftChange}
                  onSubmit={(event) => void handleProductSubmit(event)}
                  onEditProduct={handleEditProduct}
                  onCancelEdit={() => setProductAdminState(emptyProductAdminState)}
                />
              )}
              <InventoryView products={products} operatorRoleLabel={roleLabel(role)} />
              <MovementHistoryView
                movements={movements}
                productCount={products.length}
                page={historyPage}
                hasOlderMovements={hasOlderMovements}
                onPageChange={setHistoryPage}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

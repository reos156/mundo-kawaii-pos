export interface SupabaseUser {
  id: string;
  email?: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  user: SupabaseUser;
}

export type SupabaseTable =
  | "role_memberships"
  | "products"
  | "inventory_movements";

export type SupabaseRpc =
  | "create_product"
  | "update_product"
  | "receive_stock"
  | "adjust_stock";

export type SupabaseQuery = Readonly<Record<string, string>>;

export interface SupabaseClient {
  getSession(): Promise<SupabaseSession | null>;
  signInWithPassword(email: string, password: string): Promise<SupabaseSession>;
  signOut(): Promise<void>;
  select<T>(table: SupabaseTable, query: SupabaseQuery): Promise<T[]>;
  rpc<T>(name: SupabaseRpc, args: Readonly<Record<string, unknown>>): Promise<T>;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface SupabaseClientOptions {
  storage?: StorageAdapter;
  fetcher?: typeof fetch;
  now?: () => number;
}

interface AuthResponse {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_at?: unknown;
  expires_in?: unknown;
  token_type?: unknown;
  user?: unknown;
}

interface ApiErrorResponse {
  message?: unknown;
  error_description?: unknown;
  error?: unknown;
  msg?: unknown;
}

export class SupabaseRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SupabaseRequestError";
  }
}

const SESSION_REFRESH_LEEWAY_SECONDS = 30;

function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function defaultStorage(): StorageAdapter {
  try {
    return typeof window === "undefined" ? createMemoryStorage() : window.localStorage;
  } catch {
    return createMemoryStorage();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function responseErrorMessage(payload: unknown, status: number): string {
  if (isRecord(payload)) {
    for (const key of ["message", "error_description", "error", "msg"] as const) {
      const message = readString((payload as ApiErrorResponse)[key]);
      if (message) return message;
    }
  }
  return `Supabase request failed (${status}).`;
}

function createSession(payload: unknown, nowMilliseconds: number): SupabaseSession {
  if (!isRecord(payload)) {
    throw new Error("Supabase returned an invalid authentication session.");
  }

  const response = payload as AuthResponse;
  const user = isRecord(response.user) ? response.user : null;
  const accessToken = readString(response.access_token);
  const refreshToken = readString(response.refresh_token);
  const userId = user ? readString(user.id) : null;
  if (!accessToken || !refreshToken || !userId) {
    throw new Error("Supabase returned an incomplete authentication session.");
  }

  const currentTimeSeconds = Math.floor(nowMilliseconds / 1000);
  const expiresAt =
    typeof response.expires_at === "number"
      ? response.expires_at
      : currentTimeSeconds +
        (typeof response.expires_in === "number" ? response.expires_in : 3600);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    token_type: readString(response.token_type) ?? "bearer",
    user: {
      id: userId,
      ...(typeof user?.email === "string" ? { email: user.email } : {}),
    },
  };
}

function parseStoredSession(value: string | null): SupabaseSession | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || !isRecord(parsed.user)) return null;
    const accessToken = readString(parsed.access_token);
    const refreshToken = readString(parsed.refresh_token);
    const userId = readString(parsed.user.id);
    if (
      !accessToken ||
      !refreshToken ||
      !userId ||
      typeof parsed.expires_at !== "number"
    ) {
      return null;
    }
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: parsed.expires_at,
      token_type: readString(parsed.token_type) ?? "bearer",
      user: {
        id: userId,
        ...(typeof parsed.user.email === "string"
          ? { email: parsed.user.email }
          : {}),
      },
    };
  } catch {
    return null;
  }
}

export function createSupabaseClient(
  config: SupabaseConfig,
  options: SupabaseClientOptions = {},
): SupabaseClient {
  const baseUrl = new URL(config.url.trim());
  if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") {
    throw new Error("Supabase URL must use HTTP or HTTPS.");
  }
  const anonKey = config.anonKey.trim();
  if (!anonKey) throw new Error("Supabase public key is required.");

  const rootUrl = baseUrl.toString().replace(/\/$/, "");
  const projectRef = baseUrl.hostname.split(".")[0] || baseUrl.hostname;
  const storageKey = `sb-${projectRef}-auth-token`;
  const storage = options.storage ?? defaultStorage();
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  let refreshInFlight: Promise<SupabaseSession | null> | null = null;

  function saveSession(session: SupabaseSession): void {
    storage.setItem(storageKey, JSON.stringify(session));
  }

  function clearSession(): void {
    storage.removeItem(storageKey);
  }

  async function request(
    path: string,
    init: RequestInit = {},
    accessToken?: string,
  ): Promise<unknown> {
    const headers = new Headers(init.headers);
    headers.set("apikey", anonKey);
    headers.set("Accept", "application/json");
    if (init.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    let response: Response;
    try {
      const requestUrl = /^https?:\/\//i.test(path) ? path : `${rootUrl}${path}`;
      response = await fetcher(requestUrl, { ...init, headers });
    } catch {
      throw new Error("No se pudo conectar con Supabase.");
    }

    const payload = await readResponse(response);
    if (!response.ok) {
      throw new SupabaseRequestError(
        responseErrorMessage(payload, response.status),
        response.status,
      );
    }
    return payload;
  }

  async function refreshSession(
    refreshToken: string,
  ): Promise<SupabaseSession | null> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      try {
        const payload = await request(
          "/auth/v1/token?grant_type=refresh_token",
          {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
          },
        );
        const session = createSession(payload, now());
        saveSession(session);
        return session;
      } catch (error) {
        if (
          error instanceof SupabaseRequestError &&
          (error.status === 400 || error.status === 401)
        ) {
          clearSession();
          return null;
        }
        throw error;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  }

  return {
    async getSession() {
      const session = parseStoredSession(storage.getItem(storageKey));
      if (!session) {
        if (storage.getItem(storageKey)) clearSession();
        return null;
      }
      const nowSeconds = Math.floor(now() / 1000);
      if (session.expires_at > nowSeconds + SESSION_REFRESH_LEEWAY_SECONDS) {
        return session;
      }
      return refreshSession(session.refresh_token);
    },

    async signInWithPassword(email, password) {
      const payload = await request("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const session = createSession(payload, now());
      saveSession(session);
      return session;
    },

    async signOut() {
      try {
        const session = await this.getSession();
        if (session) {
          await request(
            "/auth/v1/logout",
            { method: "POST" },
            session.access_token,
          );
        }
      } finally {
        clearSession();
      }
    },

    async select<T>(table: SupabaseTable, query: SupabaseQuery): Promise<T[]> {
      const session = await this.getSession();
      if (!session) throw new Error("Se requiere una sesión autenticada.");

      const url = new URL(`/rest/v1/${table}`, rootUrl);
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
      const payload = await request(url.toString(), { method: "GET" }, session.access_token);
      if (!Array.isArray(payload)) {
        throw new Error("Supabase returned an invalid data response.");
      }
      return payload as T[];
    },

    async rpc<T>(
      name: SupabaseRpc,
      args: Readonly<Record<string, unknown>>,
    ): Promise<T> {
      const session = await this.getSession();
      if (!session) throw new Error("Se requiere una sesión autenticada.");
      return (await request(
        `/rest/v1/rpc/${name}`,
        { method: "POST", body: JSON.stringify(args) },
        session.access_token,
      )) as T;
    },
  };
}

let configuredClient: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (configuredClient !== undefined) return configuredClient;

  const env = import.meta.env as Record<string, string | undefined>;
  const url = env.VITE_SUPABASE_URL?.trim();
  const publicKey =
    env.VITE_SUPABASE_ANON_KEY?.trim() ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publicKey) {
    configuredClient = null;
    return null;
  }

  try {
    configuredClient = createSupabaseClient({ url, anonKey: publicKey });
  } catch {
    configuredClient = null;
  }
  return configuredClient;
}

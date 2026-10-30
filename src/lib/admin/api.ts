"use client";

/**
 * Thin fetch wrapper for the admin dashboard. Talks to the real NestJS backend — never mock data.
 * The access token lives in memory + sessionStorage (admin tool, not the customer session), and a
 * 401 triggers a single silent refresh attempt (the backend's httpOnly refresh cookie) before
 * giving up and signalling the caller to sign in again.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const TOKEN_KEY = "eb_admin_access_token";

/** Media URLs come back as a path relative to the backend ("/api/v1/media/xyz") since the public
 *  catalogue consumes them the same way through its own origin. The admin frontend is a separate
 *  origin, so it must resolve them against the API's own origin to actually load. */
export function mediaUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE.replace(/\/api\/v1\/?$/, "")}${path}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

// At most one refresh ever in flight. The refresh token is single-use and rotates on every call —
// the backend's reuse-detection revokes the whole session if the same token is presented twice — so
// two admin pages whose effects both 401 at once (e.g. a list page's two parallel loaders) must not
// each independently race to refresh with the same stale cookie.
let refreshInFlight: Promise<string | null> | null = null;

function tryRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!res.ok) return null;
      const body = (await res.json()) as { accessToken: string };
      setToken(body.accessToken);
      return body.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** multipart/form-data body; mutually exclusive with `body`. */
  form?: FormData;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body,
    credentials: "include",
  });

  if (res.status === 401 && !retried) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, true);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const problem = data as { code?: string; title?: string; errors?: { field: string; message: string }[] } | undefined;
    throw new ApiError(res.status, problem?.code ?? "ERROR", problem?.title ?? "Request failed", problem?.errors);
  }
  return data as T;
}

export const adminApi = {
  get: <T>(path: string, query?: RequestOptions["query"]) => request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData, method: "POST" | "PATCH" = "POST") => request<T>(path, { method, form }),
  /** Same contract as `upload`, but over XMLHttpRequest so the caller can show real per-file
   *  progress — `fetch` has no upload-progress event. Shares the single-retry-on-401 refresh
   *  behaviour of the fetch-based `request()` so a mid-upload token expiry doesn't just fail. */
  uploadWithProgress<T>(path: string, form: FormData, method: "POST" | "PATCH", onProgress: (pct: number) => void): Promise<T> {
    const send = (retried: boolean): Promise<T> =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, buildUrl(path));
        const token = getToken();
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.withCredentials = true;
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onerror = () => reject(new ApiError(0, "NETWORK_ERROR", "Network error"));
        xhr.onload = () => {
          void (async () => {
            if (xhr.status === 401 && !retried) {
              const refreshed = await tryRefresh();
              if (refreshed) {
                try {
                  resolve(await send(true));
                } catch (err) {
                  reject(err);
                }
                return;
              }
            }
            const text = xhr.responseText;
            const data: unknown = text ? JSON.parse(text) : undefined;
            if (xhr.status < 200 || xhr.status >= 300) {
              const problem = data as { code?: string; title?: string; errors?: { field: string; message: string }[] } | undefined;
              reject(new ApiError(xhr.status, problem?.code ?? "ERROR", problem?.title ?? "Request failed", problem?.errors));
              return;
            }
            resolve(data as T);
          })();
        };
        xhr.send(form);
      });
    return send(false);
  },
  /** For a private, access-controlled file (e.g. an InstaPay receipt): the Authorization header
   *  cannot be attached to a plain `<a href>` navigation, so this fetches the bytes under our own
   *  auth and hands back a blob: URL the caller opens instead. The caller must revoke it when done. */
  async blobUrl(path: string): Promise<string> {
    const token = getToken();
    const res = await fetch(buildUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" });
    if (!res.ok) throw new ApiError(res.status, "ERROR", "Failed to load file");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

"use client";

import { ApiError, toApiError } from "./errors";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const TOKEN_KEY = "eb.accessToken";

/**
 * The customer session's access token: short-lived (10 minutes, see backend config), kept in
 * sessionStorage, never in a cookie or localStorage. The refresh token never reaches JavaScript at
 * all — it lives in the backend's own httpOnly cookie, set by Set-Cookie on login/refresh and sent
 * automatically by the browser with `credentials: "include"`.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

/** At most one refresh ever in flight for the whole app. The refresh token is single-use and
 *  rotates on every call (backend reuse-detection revokes the whole session if the same token is
 *  presented twice) — two independent, uncoordinated refresh calls racing on the same stale cookie
 *  (e.g. AppProvider's mount-time check and a page's own 401-retry, both firing on first load) would
 *  otherwise have the loser read as token theft and get the whole session logged out. Every caller
 *  (AppProvider included) must go through this shared function, never call /auth/refresh directly. */
let refreshInFlight: Promise<string | null> | null = null;

export function tryRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!res.ok) return null;
      const body = (await res.json()) as { accessToken: string };
      setAccessToken(body.accessToken);
      return body.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

type QueryValue = string | number | boolean | string[] | undefined;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  form?: FormData;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "") continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form; // browser sets multipart boundary itself — never set Content-Type by hand
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

  if (res.status === 401 && !retried && token) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, true);
  }

  if (res.status === 204) return undefined as T;
  if (!res.ok) throw await toApiError(res);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"]) => request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>(path, { method: "POST", body, headers }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  upload: <T>(path: string, form: FormData, headers?: Record<string, string>) => request<T>(path, { method: "POST", form, headers }),
};

export { ApiError };

/** A fresh idempotency key for one logical attempt (booking creation, InstaPay submission). Callers
 *  must generate this once per user-initiated action and reuse it across retries of that SAME
 *  attempt, never a new one per HTTP call, or retries would create duplicate resources. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

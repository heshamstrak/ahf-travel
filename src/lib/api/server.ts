import { ApiError, toApiError } from "./errors";

/** Base URL of the real NestJS backend. Catalogue reads are public, so no auth header is needed here. */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type QueryValue = string | number | boolean | string[] | undefined;

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "") continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
  }
  return url.toString();
}

/**
 * Server-side catalogue fetch, called from Server Components and metadata functions. Always
 * `cache: "no-store"`: catalogue content is admin-managed (Milestone 6) and must reflect the
 * latest published state on every request, never a stale build-time snapshot.
 */
export async function serverGet<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
  const res = await fetch(buildUrl(path, query), { cache: "no-store" });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

/** Same as serverGet, but returns null for a 404 instead of throwing — convenient for detail pages
 *  that call next/navigation's notFound(). */
export async function serverGetOrNull<T>(path: string, query?: Record<string, QueryValue>): Promise<T | null> {
  try {
    return await serverGet<T>(path, query);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

import { expireSession, getAccessToken, setAccessToken } from "@/lib/auth/session";
import { parseSessionResponse } from "@/lib/schemas/session";
import type { SessionResponse } from "@/types/api";
import { API_URL, shouldMock } from "./config";
import { ApiError, networkError, toApiError } from "./errors";
import { mockRequest } from "./mocks/handlers";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions<T> {
  method?: HttpMethod;
  /**
   * Plain objects are sent as JSON; FormData as multipart; a string is sent as-is and needs
   * `contentType` (e.g. the CSV import).
   */
  body?: unknown;
  contentType?: string;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  /** `blob` for file downloads (exports). Defaults to JSON. */
  responseType?: "json" | "blob";
  /** Optional response validator; throw to reject an unexpected shape. */
  parse?: (data: unknown) => T;
  /** Internal: set after a refresh retry or for /auth/* calls. */
  skipRefresh?: boolean;
}

function buildUrl(path: string, query?: RequestOptions<unknown>["query"]): string {
  const url = `${API_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

let refreshInFlight: Promise<SessionResponse | null> | null = null;

/**
 * Single-flight refresh: concurrent 401s share one call to POST /auth/refresh (the cookie is
 * rotated on every call, so two parallel refreshes would invalidate the session).
 * Returns the new session, or null when there is no valid refresh cookie.
 */
export function refreshSession(): Promise<SessionResponse | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const session = await send<SessionResponse>("/auth/refresh", {
          method: "POST",
          skipRefresh: true,
          parse: parseSessionResponse,
        });
        setAccessToken(session.accessToken);
        return session;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function send<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const method = options.method ?? "GET";

  if (shouldMock(path)) {
    const data = await mockRequest(method, path, options.body, options.query);
    return (options.parse ? options.parse(data) : data) as T;
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (typeof options.body === "string") {
    headers["Content-Type"] = options.contentType ?? "text/plain";
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      credentials: "include",
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw networkError();
  }

  if (response.status === 401 && !options.skipRefresh) {
    // UNAUTHORIZED: access token missing or expired -> refresh once and retry (API_CONTRATO §6.2).
    if (await refreshSession()) {
      return send<T>(path, { ...options, skipRefresh: true });
    }
    expireSession();
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;

  if (options.responseType === "blob") return (await response.blob()) as T;

  const data: unknown = await response.json();
  return options.parse ? options.parse(data) : (data as T);
}

/** Typed client for the NestJS API. Paths are relative to NEXT_PUBLIC_API_URL, e.g. `/courses`. */
export function apiFetch<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  return send<T>(path, options);
}

export { ApiError };

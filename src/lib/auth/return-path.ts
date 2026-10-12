// Where to send the user after signing in. Only same-origin, in-app paths are accepted, so a
// crafted `?next=` can never become an open redirect to another site.

export const DEFAULT_HOME = "/inicio";
const PUBLIC_PATHS = ["/login", "/recuperar", "/restablecer"];

/** Normalises a candidate return path; anything unsafe or public falls back to /inicio. */
export function safeReturnPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_HOME;
  try {
    const base = "http://docentia.local";
    const url = new URL(raw, base);
    if (url.origin !== base) return DEFAULT_HOME;
    if (PUBLIC_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return DEFAULT_HOME;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_HOME;
  }
}

/** The `next` query parameter of the current URL, sanitised. Client-only. */
export function returnPathFromLocation(): string {
  if (typeof window === "undefined") return DEFAULT_HOME;
  return safeReturnPath(new URLSearchParams(window.location.search).get("next"));
}

/** /login URL that brings the user back to where they are now. Client-only. */
export function loginUrlForCurrentLocation(): string {
  if (typeof window === "undefined") return "/login";
  const here = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const next = safeReturnPath(here);
  return next === DEFAULT_HOME ? "/login" : `/login?next=${encodeURIComponent(next)}`;
}

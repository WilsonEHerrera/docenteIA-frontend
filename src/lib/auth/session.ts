// Access token lives in memory only (docs/FRONTEND.md §4). Never persist it in localStorage.

let accessToken: string | null = null;
const expiredListeners = new Set<() => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Drops the token and tells the app the session is over (e.g. refresh failed). */
export function expireSession(): void {
  accessToken = null;
  expiredListeners.forEach((listener) => listener());
}

export function onSessionExpired(listener: () => void): () => void {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

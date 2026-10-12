"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, refreshSession } from "@/lib/api/client";
import { onSessionExpired, setAccessToken } from "@/lib/auth/session";
import { parseSessionResponse } from "@/lib/schemas/session";
import type { User } from "@/types/api";

/**
 * - "loading": the session is being restored; nothing may redirect yet.
 * - "authenticated" / "unauthenticated": the backend answered.
 * - "unreachable": the session could not be checked (network, 5xx, cold start). Not a logout.
 */
type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unreachable";
/** Why the session ended, so the app knows whether to offer a return path. */
type EndReason = "logout" | "expired" | null;

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  endReason: EndReason;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Tries the restore again after an "unreachable" result. */
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// A sleeping backend (e.g. a free-tier cold start) can fail the first calls: retry before giving up.
const RESTORE_RETRY_DELAYS_MS = [1500, 4000];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [endReason, setEndReason] = useState<EndReason>(null);
  const [attempt, setAttempt] = useState(0);

  // Restore on every full page load: the access token lives only in memory, so the httpOnly
  // refresh cookie is exchanged for a new one plus the user (there is no GET /me, API_CONTRATO §4).
  // refreshSession() is single-flight, so React's dev double-mount still sends one request.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; ; i++) {
        try {
          const session = await refreshSession();
          if (cancelled) return;
          if (session) {
            setUser(session.user);
            setStatus("authenticated");
          } else {
            setUser(null);
            setEndReason("expired");
            setStatus("unauthenticated");
          }
          return;
        } catch {
          if (cancelled) return;
          if (i >= RESTORE_RETRY_DELAYS_MS.length) {
            setStatus("unreachable");
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, RESTORE_RETRY_DELAYS_MS[i]));
          if (cancelled) return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setEndReason("expired");
        setStatus("unauthenticated");
      }),
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    const session = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
      skipRefresh: true,
      parse: parseSessionResponse,
    });
    setAccessToken(session.accessToken);
    setUser(session.user);
    setEndReason(null);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST", skipRefresh: true });
    } catch {
      // Logout is idempotent; whatever the server says, the local session ends.
    } finally {
      setAccessToken(null);
      setUser(null);
      setEndReason("logout");
      setStatus("unauthenticated");
    }
  }, []);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo(
    () => ({ user, status, endReason, login, logout, retry }),
    [user, status, endReason, login, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

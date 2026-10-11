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

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Restore the session on load: the httpOnly refresh cookie yields a new in-memory access token
  // and the user (there is no GET /me yet, API_CONTRATO §4).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await refreshSession();
      if (cancelled) return;
      if (session) {
        setUser(session.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
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
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

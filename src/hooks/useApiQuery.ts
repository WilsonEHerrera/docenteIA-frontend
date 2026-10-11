"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

interface Result<T> {
  token: string;
  data: T | null;
  error: unknown;
}

export interface ApiQuery<T> {
  data: T | null;
  error: unknown;
  /** True only while there is no data yet (first load, or after a key change). */
  loading: boolean;
  /** True while any request is in flight, including reloads that keep showing old data. */
  fetching: boolean;
  reload: () => void;
  /** Local update after a mutation, without another round trip. */
  setData: (update: (current: T) => T) => void;
}

/**
 * Minimal GET hook (TanStack Query is not installed yet).
 * Pass `null` as `path` to skip the request. Replace with `useQuery` when the dependency lands.
 */
export function useApiQuery<T>(
  path: string | null,
  query?: Record<string, string | number | undefined>,
): ApiQuery<T> {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const queryKey = query ? JSON.stringify(query) : "";
  const token = `${path}|${queryKey}|${reloadCount}`;

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;
    const params = queryKey ? (JSON.parse(queryKey) as Record<string, string | number>) : undefined;
    apiFetch<T>(path, { query: params })
      .then((data) => {
        if (!cancelled) setResult({ token, data, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult({ token, data: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, [path, queryKey, token]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const setData = useCallback((update: (current: T) => T) => {
    setResult((current) =>
      current && current.data !== null ? { ...current, data: update(current.data) } : current,
    );
  }, []);

  const fetching = path !== null && result?.token !== token;
  const data = path === null ? null : (result?.data ?? null);
  const error = path === null || fetching ? null : (result?.error ?? null);
  return { data, error, loading: fetching && data === null && error === null, fetching, reload, setData };
}

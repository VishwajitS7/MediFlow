"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError } from "@/lib/api/client";

interface QueryState<T> {
  key: string;
  data?: T;
  error?: ApiClientError;
}

function toApiError(error: unknown): ApiClientError {
  return error instanceof ApiClientError ? error : new ApiClientError("Unexpected error", 500, "UNKNOWN_ERROR");
}

/**
 * Minimal client-side data loader keyed by `key` (pass null to skip). Refetches when the key changes
 * or `reload()` is called. `previous` keeps the last successful data visible while a new key loads.
 */
export function useApiQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [token, setToken] = useState(0);
  const [state, setState] = useState<QueryState<T> | null>(null);
  const [previous, setPrevious] = useState<T | undefined>(undefined);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const fullKey = key === null ? null : `${key}#${token}`;

  useEffect(() => {
    if (fullKey === null) return;
    let cancelled = false;
    fetcherRef
      .current()
      .then((data) => {
        if (cancelled) return;
        setState({ key: fullKey, data });
        setPrevious(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ key: fullKey, error: toApiError(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [fullKey]);

  const current = state && state.key === fullKey ? state : null;
  const reload = useCallback(() => setToken((t) => t + 1), []);
  const setData = useCallback(
    (data: T) => {
      if (fullKey === null) return;
      setState({ key: fullKey, data });
      setPrevious(data);
    },
    [fullKey]
  );

  return {
    data: current?.data,
    error: current?.error,
    isLoading: fullKey !== null && current === null,
    previous,
    reload,
    setData,
  };
}

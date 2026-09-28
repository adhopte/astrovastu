import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { ApiError } from "./api";

export function errorMessage(e: unknown, t: (k: string) => string) {
  if (e instanceof ApiError) return e.status === 0 ? t("common.networkError") : e.message;
  return t("common.error");
}

/**
 * Load data when `deps` change (e.g. record id or UI language). With
 * `refetchOnFocus`, it also reloads whenever the screen regains focus, so
 * lists reflect records created or deleted on other screens.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[], opts: { refetchOnFocus?: boolean } = {}) {
  const { t } = useTranslation();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  const key = JSON.stringify(deps);

  // Only sets state after the request settles, so it is safe to call from effects.
  const fetchData = useCallback(async () => {
    try {
      const result = await fnRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setLoading(false);
    }
    // `key` stands in for the caller's deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, t]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchData();
  }, [fetchData]);

  const onFocus = !!opts.refetchOnFocus;
  useEffect(() => {
    if (!onFocus) void fetchData();
  }, [fetchData, onFocus]);
  useFocusEffect(
    useCallback(() => {
      if (onFocus) void fetchData();
    }, [fetchData, onFocus]),
  );

  return { data, error, loading, reload, setData };
}

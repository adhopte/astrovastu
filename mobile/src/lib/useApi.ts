import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : "Something went wrong");

/**
 * Runs a local read (SQLite query, file check, etc.) and exposes it as
 * { data, error, loading, reload }. With `refetchOnFocus`, it also re-runs
 * whenever the screen regains focus, so lists reflect records created or
 * deleted on other screens.
 */
export function useLocal<T>(fn: () => T | Promise<T>, deps: unknown[], opts: { refetchOnFocus?: boolean } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  const key = JSON.stringify(deps);

  const fetchData = useCallback(async () => {
    try {
      const result = await fnRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
    // `key` stands in for the caller's deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

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

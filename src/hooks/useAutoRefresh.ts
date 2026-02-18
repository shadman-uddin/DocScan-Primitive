import { useState, useEffect, useRef, useCallback } from 'react';

interface AutoRefreshResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useAutoRefresh<T>(
  fetchFn: () => Promise<T>,
  interval = 30000
): AutoRefreshResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const doFetch = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      setIsLoading(true);
      const result = await fetchFnRef.current();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    doFetch();

    intervalRef.current = setInterval(doFetch, interval);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        doFetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [doFetch, interval]);

  return { data, isLoading, error, lastUpdated, refresh: doFetch };
}

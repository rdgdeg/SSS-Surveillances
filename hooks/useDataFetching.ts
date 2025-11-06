import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';

type Dependency = any;

interface UseDataFetchingResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  setData: Dispatch<SetStateAction<T>>;
}

/**
 * A custom hook for fetching data, handling loading and error states.
 * @param fetcher A function that returns a promise with the data.
 * @param initialData The initial state for the data.
 * @param dependencies An array of dependencies that will trigger a refetch when changed.
 */
export function useDataFetching<T>(
  fetcher: () => Promise<T>,
  initialData: T,
  dependencies: Dependency[] = []
): UseDataFetchingResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the fetcher function based on its dependencies from the component.
  const memoizedFetcher = useCallback(fetcher, dependencies);

  const fetchData = useCallback(async (isRefetch: boolean = false) => {
    if (!isRefetch) {
        setIsLoading(true);
    }
    setError(null);
    try {
      const result = await memoizedFetcher();
      setData(result);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('An unknown error occurred during data fetching.');
      setError(e);
      toast.error('Erreur lors du chargement des données.');
      console.error("Data fetching error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [memoizedFetcher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // This effect re-runs when the memoizedFetcher identity changes (i.e., when dependencies change)

  return { data, isLoading, error, refetch: () => fetchData(true), setData };
}
'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryObserverResult,
} from '@tanstack/react-query';

interface ApiState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<QueryObserverResult<T, Error>>;
}

// Cache keys can be a plain string (e.g. "employees.list") or a structured
// array (e.g. ["attendance", "date", "2026-08-09"]). Structured keys are
// recommended for parameterized queries so mutations can invalidate a whole
// group via prefix matching (e.g. ["attendance", "date"]).
export type QueryKey = string | readonly string[];

function normalizeKey(key: QueryKey): string[] {
  if (typeof key === 'string') return [key];
  return [...key];
}

// Typed query hook backed by TanStack Query.
// `key` is the stable cache key; pass the same key to invalidate from mutations.
export function useApi<T>(
  key: QueryKey,
  fetcher: () => Promise<T>,
  options?: { enabled?: boolean; staleTime?: number }
): ApiState<T> {
  const { data, isPending, isRefetching, error, refetch } = useQuery({
    queryKey: ['api', ...normalizeKey(key)],
    queryFn: fetcher,
    enabled: options?.enabled,
    staleTime: options?.staleTime,
  });

  return {
    data,
    loading: isPending || isRefetching,
    error: Error.isError(error)
      ? error
      : error
        ? new Error(String(error))
        : undefined,
    refetch,
  };
}

interface MutationOptions<TVars, TData> {
  invalidate?: QueryKey[];
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (error: Error, vars: TVars) => void;
}

// Typed mutation hook backed by TanStack Query. Pass the cache keys you want
// invalidated after a successful mutation (e.g. ["employees.list"]). Structured
// keys invalidate every query sharing that prefix (e.g. ["attendance", "date"]).
export function useApiMutation<TVars, TData>(
  fetcher: (vars: TVars) => Promise<TData>,
  options?: MutationOptions<TVars, TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetcher,
    onSuccess: async (data, vars) => {
      if (options?.invalidate?.length) {
        await Promise.all(
          options.invalidate.map((key) => {
            return queryClient.invalidateQueries({
              queryKey: ['api', ...normalizeKey(key)],
            });
          })
        );
      }
      options?.onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      options?.onError?.(
        Error.isError(error) ? error : new Error(String(error)),
        vars
      );
    },
  });
}

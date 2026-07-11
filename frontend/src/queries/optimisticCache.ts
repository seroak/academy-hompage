import type { QueryClient, QueryKey } from '@tanstack/react-query'

export type QuerySnapshots<T> = Array<[QueryKey, T | undefined]>

export async function snapshotQueryLists<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
): Promise<QuerySnapshots<T[]>> {
  await queryClient.cancelQueries({ queryKey })
  return queryClient.getQueriesData<T[]>({ queryKey })
}

export function restoreQuerySnapshots<T>(queryClient: QueryClient, snapshots: QuerySnapshots<T>) {
  for (const [queryKey, data] of snapshots) queryClient.setQueryData(queryKey, data)
}

export function updateCachedLists<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater: (items: T[], queryKey: QueryKey) => T[],
) {
  for (const [cachedKey, data] of queryClient.getQueriesData<T[]>({ queryKey })) {
    if (data) queryClient.setQueryData(cachedKey, updater(data, cachedKey))
  }
}

export function optimisticId(prefix: string) {
  return `optimistic-${prefix}-${crypto.randomUUID()}`
}

export function nowIso() {
  return new Date().toISOString()
}

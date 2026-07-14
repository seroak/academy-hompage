import { useQuery } from '@tanstack/react-query'
import { fetchAdminNotifications } from '../../../api/adminNotifications.api'
import { queryKeys } from '../../../queries/queryKeys'

const POLL_INTERVAL_MS = 30_000

export function useAdminNotificationsQuery(enabled: boolean) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.adminNotifications.list,
    queryFn: fetchAdminNotifications,
    enabled,
    refetchInterval: enabled ? POLL_INTERVAL_MS : false,
  })

  return { notifications: data ?? [], isLoading, error: error ?? null }
}

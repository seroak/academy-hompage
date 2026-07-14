import { useQuery } from '@tanstack/react-query'
import { fetchAdminNotificationUnreadCount } from '../../../api/adminNotifications.api'
import { queryKeys } from '../../../queries/queryKeys'

const POLL_INTERVAL_MS = 30_000

export function useAdminNotificationUnreadCountQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.adminNotifications.unreadCount,
    queryFn: fetchAdminNotificationUnreadCount,
    refetchInterval: POLL_INTERVAL_MS,
  })

  return { unreadCount: data?.count ?? 0, isLoading, error: error ?? null }
}

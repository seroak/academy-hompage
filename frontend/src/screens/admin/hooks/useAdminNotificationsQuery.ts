import { useQuery } from '@tanstack/react-query'
import { fetchAdminNotifications } from '../../../api/adminNotifications.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useAdminNotificationsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.adminNotifications.list,
    queryFn: fetchAdminNotifications,
  })

  return { notifications: data ?? [], isLoading, error: error ?? null }
}

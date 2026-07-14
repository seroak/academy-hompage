import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '../../../api/adminNotifications.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useAdminNotificationMutations() {
  const queryClient = useQueryClient()

  function invalidateAdminNotifications() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.adminNotifications.all })
  }

  const markReadMutation = useMutation({
    mutationKey: ['adminNotifications', 'markRead'],
    mutationFn: (id: string) => markAdminNotificationRead(id),
    onSuccess: invalidateAdminNotifications,
  })

  const markAllReadMutation = useMutation({
    mutationKey: ['adminNotifications', 'markAllRead'],
    mutationFn: () => markAllAdminNotificationsRead(),
    onSuccess: invalidateAdminNotifications,
  })

  return {
    markRead: (id: string) => markReadMutation.mutateAsync(id),
    markAllRead: () => markAllReadMutation.mutateAsync(),
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
  }
}

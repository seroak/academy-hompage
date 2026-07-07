import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createNotice, deleteNotice, updateNotice } from '../../../api/notices.api'
import { queryKeys } from '../../../queries/queryKeys'
import type { CreateNoticeInput } from '../../../api/schemas/notice.schema'

export function useNoticeMutations() {
  const queryClient = useQueryClient()

  function invalidateNotices() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.notices.all })
  }

  const createMutation = useMutation({
    mutationKey: ['notices', 'create'],
    mutationFn: (input: CreateNoticeInput) => createNotice(input),
    onSuccess: invalidateNotices,
  })

  const updateMutation = useMutation({
    mutationKey: ['notices', 'update'],
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateNoticeInput> }) =>
      updateNotice(id, input),
    onSuccess: invalidateNotices,
  })

  const deleteMutation = useMutation({
    mutationKey: ['notices', 'delete'],
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: invalidateNotices,
  })

  return {
    createNotice: (input: CreateNoticeInput) => createMutation.mutateAsync(input),
    updateNotice: (id: string, input: Partial<CreateNoticeInput>) =>
      updateMutation.mutateAsync({ id, input }),
    deleteNotice: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
  }
}

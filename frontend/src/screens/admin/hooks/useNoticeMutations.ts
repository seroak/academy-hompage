import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createNotice, deleteNotice, updateNotice } from '../../../api/notices.api'
import { queryKeys } from '../../../queries/queryKeys'
import type { CreateNoticeInput, Notice } from '../../../api/schemas/notice.schema'
import { nowIso, optimisticId, restoreQuerySnapshots, snapshotQueryLists, updateCachedLists } from '../../../queries/optimisticCache'

export function useNoticeMutations() {
  const queryClient = useQueryClient()

  function invalidateNotices() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.notices.all })
  }

  const createMutation = useMutation({
    mutationKey: ['notices', 'create'],
    mutationFn: (input: CreateNoticeInput) => createNotice(input),
    onMutate: async (input) => {
      const snapshots = await snapshotQueryLists<Notice>(queryClient, queryKeys.notices.all)
      const notice: Notice = { id: optimisticId('notice'), ...input, pinned: input.pinned ?? false, createdAt: nowIso(), updatedAt: nowIso() }
      updateCachedLists<Notice>(queryClient, queryKeys.notices.all, (notices) => [notice, ...notices])
      return { snapshots, optimisticId: notice.id }
    },
    onError: (_error, _input, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSuccess: (notice, _input, context) => updateCachedLists<Notice>(queryClient, queryKeys.notices.all, (notices) => notices.map((item) => item.id === context?.optimisticId ? notice : item)),
    onSettled: invalidateNotices,
  })

  const updateMutation = useMutation({
    mutationKey: ['notices', 'update'],
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateNoticeInput> }) =>
      updateNotice(id, input),
    onMutate: async ({ id, input }) => {
      const snapshots = await snapshotQueryLists<Notice>(queryClient, queryKeys.notices.all)
      updateCachedLists<Notice>(queryClient, queryKeys.notices.all, (notices) => notices.map((notice) => notice.id === id ? { ...notice, ...input, updatedAt: nowIso() } : notice))
      return { snapshots }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSuccess: (notice) => updateCachedLists<Notice>(queryClient, queryKeys.notices.all, (notices) => notices.map((item) => item.id === notice.id ? notice : item)),
    onSettled: invalidateNotices,
  })

  const deleteMutation = useMutation({
    mutationKey: ['notices', 'delete'],
    mutationFn: (id: string) => deleteNotice(id),
    onMutate: async (id) => {
      const snapshots = await snapshotQueryLists<Notice>(queryClient, queryKeys.notices.all)
      updateCachedLists<Notice>(queryClient, queryKeys.notices.all, (notices) => notices.filter((notice) => notice.id !== id))
      return { snapshots }
    },
    onError: (_error, _id, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSettled: invalidateNotices,
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

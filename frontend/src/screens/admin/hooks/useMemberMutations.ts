import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteMember } from '../../../api/members.api'
import { queryKeys } from '../../../queries/queryKeys'
import type { Member } from '../../../api/schemas/member.schema'
import { restoreQuerySnapshots, snapshotQueryLists, updateCachedLists } from '../../../queries/optimisticCache'

export function useMemberMutations() {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationKey: ['members', 'delete'],
    mutationFn: (id: string) => deleteMember(id),
    onMutate: async (id) => {
      const snapshots = await snapshotQueryLists<Member>(queryClient, queryKeys.members.all)
      updateCachedLists<Member>(queryClient, queryKeys.members.all, (members) => members.filter((member) => member.id !== id))
      return { snapshots }
    },
    onError: (_error, _id, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
  })

  return {
    deleteMember: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
  }
}

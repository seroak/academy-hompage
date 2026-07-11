import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAdmin, deleteAdmin } from '../../../api/admins.api'
import { queryKeys } from '../../../queries/queryKeys'
import type { Admin, CreateAdminInput } from '../../../api/schemas/admin.schema'
import { nowIso, optimisticId, restoreQuerySnapshots, snapshotQueryLists, updateCachedLists } from '../../../queries/optimisticCache'

export function useAdminMutations() {
  const queryClient = useQueryClient()

  function invalidateAdmins() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.admins.all })
  }

  const deleteMutation = useMutation({
    mutationKey: ['admins', 'delete'],
    mutationFn: (id: string) => deleteAdmin(id),
    onMutate: async (id) => {
      const snapshots = await snapshotQueryLists<Admin>(queryClient, queryKeys.admins.all)
      updateCachedLists<Admin>(queryClient, queryKeys.admins.all, (admins) => admins.filter((admin) => admin.id !== id))
      return { snapshots }
    },
    onError: (_error, _id, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSettled: invalidateAdmins,
  })

  const createMutation = useMutation({
    mutationKey: ['admins', 'create'],
    mutationFn: createAdmin,
    onMutate: async (input: CreateAdminInput) => {
      const snapshots = await snapshotQueryLists<Admin>(queryClient, queryKeys.admins.all)
      const admin: Admin = { id: optimisticId('admin'), username: input.username, createdAt: nowIso() }
      updateCachedLists<Admin>(queryClient, queryKeys.admins.all, (admins) => [...admins, admin])
      return { snapshots, optimisticId: admin.id }
    },
    onError: (_error, _input, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSuccess: (admin, _input, context) => updateCachedLists<Admin>(queryClient, queryKeys.admins.all, (admins) => admins.map((item) => item.id === context?.optimisticId ? admin : item)),
    onSettled: invalidateAdmins,
  })

  return {
    createAdmin: (input: CreateAdminInput) => createMutation.mutateAsync(input),
    deleteAdmin: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

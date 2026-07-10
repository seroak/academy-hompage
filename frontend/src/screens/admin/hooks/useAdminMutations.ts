import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteAdmin } from '../../../api/admins.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useAdminMutations() {
  const queryClient = useQueryClient()

  function invalidateAdmins() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.admins.all })
  }

  const deleteMutation = useMutation({
    mutationKey: ['admins', 'delete'],
    mutationFn: (id: string) => deleteAdmin(id),
    onSuccess: invalidateAdmins,
  })

  return {
    deleteAdmin: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
  }
}

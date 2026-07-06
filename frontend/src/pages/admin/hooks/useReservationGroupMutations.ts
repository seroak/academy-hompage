import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteReservationGroup, createReservationGroup } from '../../../api/reservationGroups.api'
import { queryKeys } from '../../../queries/queryKeys'
import type { CreateReservationGroupInput } from '../../../api/schemas/reservation-group.schema'

export function useReservationGroupMutations() {
  const queryClient = useQueryClient()

  function invalidateAll() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.reservationGroups.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
    ])
  }

  const createMutation = useMutation({
    mutationKey: ['reservationGroups', 'create'],
    mutationFn: (input: CreateReservationGroupInput) => createReservationGroup(input),
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationKey: ['reservationGroups', 'delete'],
    mutationFn: (id: string) => deleteReservationGroup(id),
    onSuccess: invalidateAll,
  })

  return {
    createGroup: (input: CreateReservationGroupInput) => createMutation.mutateAsync(input),
    deleteGroup: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
  }
}

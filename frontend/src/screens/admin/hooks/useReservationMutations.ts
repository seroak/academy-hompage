import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createWalkInReservation, deleteReservation, updateReservation } from '../../../api/reservations.api'
import { queryKeys } from '../../../queries/queryKeys'
import type {
  CreateWalkInReservationInput,
  UpdateReservationInput,
} from '../../../api/schemas/reservation.schema'

export function useReservationMutations() {
  const queryClient = useQueryClient()

  function invalidateReservations() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all })
  }

  const updateMutation = useMutation({
    mutationKey: ['reservations', 'update'],
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationInput }) => updateReservation(id, input),
    onSuccess: invalidateReservations,
  })

  const deleteMutation = useMutation({
    mutationKey: ['reservations', 'delete'],
    mutationFn: (id: string) => deleteReservation(id),
    onSuccess: invalidateReservations,
  })

  const createWalkInMutation = useMutation({
    mutationKey: ['reservations', 'createWalkIn'],
    mutationFn: (input: CreateWalkInReservationInput) => createWalkInReservation(input),
    onSuccess: invalidateReservations,
  })

  return {
    updateReservation: (id: string, input: UpdateReservationInput) => updateMutation.mutateAsync({ id, input }),
    deleteReservation: (id: string) => deleteMutation.mutateAsync(id),
    createWalkInReservation: (input: CreateWalkInReservationInput) => createWalkInMutation.mutateAsync(input),
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCreatingWalkIn: createWalkInMutation.isPending,
  }
}

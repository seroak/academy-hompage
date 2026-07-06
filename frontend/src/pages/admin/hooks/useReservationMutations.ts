import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteReservation, updateReservation } from '../../../api/reservations.api'
import { queryKeys } from '../../../queries/queryKeys'
import type { CreateReservationInput, Reservation } from '../../../api/schemas/reservation.schema'

export function useReservationMutations() {
  const queryClient = useQueryClient()

  function invalidateReservations() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all })
  }

  const updateMutation = useMutation({
    mutationKey: ['reservations', 'update'],
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<CreateReservationInput> & { status?: Reservation['status'] }
    }) => updateReservation(id, input),
    onSuccess: invalidateReservations,
  })

  const deleteMutation = useMutation({
    mutationKey: ['reservations', 'delete'],
    mutationFn: (id: string) => deleteReservation(id),
    onSuccess: invalidateReservations,
  })

  return {
    updateReservation: (
      id: string,
      input: Partial<CreateReservationInput> & { status?: Reservation['status'] },
    ) => updateMutation.mutateAsync({ id, input }),
    deleteReservation: (id: string) => deleteMutation.mutateAsync(id),
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createReservation } from '../../api/reservations.api'
import type { CreateReservationInput } from '../../api/schemas/reservation.schema'
import { queryKeys } from '../../queries/queryKeys'

export function useApplyReservationMutation() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationKey: ['reservations', 'apply'],
    mutationFn: (input: CreateReservationInput) => createReservation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myReservations.all })
    },
  })

  return {
    apply: (input: CreateReservationInput) => mutation.mutateAsync(input),
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  }
}

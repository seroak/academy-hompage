import { useMutation } from '@tanstack/react-query'
import { createReservation } from '../../api/reservations.api'
import type { CreateReservationInput } from '../../api/schemas/reservation.schema'

export function useApplyReservationMutation() {
  const mutation = useMutation({
    mutationKey: ['reservations', 'apply'],
    mutationFn: (input: CreateReservationInput) => createReservation(input),
  })

  return {
    apply: (input: CreateReservationInput) => mutation.mutateAsync(input),
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  }
}

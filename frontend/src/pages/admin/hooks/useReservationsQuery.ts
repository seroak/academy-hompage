import { useQuery } from '@tanstack/react-query'
import { fetchReservations } from '../../../api/reservations.api'
import { queryKeys } from '../../../queries/queryKeys'
import type { ReservationFilters } from '../../../api/schemas/reservation.schema'

export function useReservationsQuery(filters: ReservationFilters = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.reservations.list(filters),
    queryFn: () => fetchReservations(filters),
  })

  return { reservations: data ?? [], isLoading, error: error ?? null }
}

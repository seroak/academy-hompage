import { useQuery } from '@tanstack/react-query'
import { fetchMyReservations } from '../../api/reservations.api'
import { queryKeys } from '../../queries/queryKeys'

export function useMyReservationsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.myReservations.all,
    queryFn: fetchMyReservations,
  })

  return { myReservations: data ?? [], isLoading, error: error ?? null }
}

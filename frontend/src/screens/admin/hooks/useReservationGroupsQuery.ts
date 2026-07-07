import { useQuery } from '@tanstack/react-query'
import { fetchReservationGroups } from '../../../api/reservationGroups.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useReservationGroupsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.reservationGroups.all,
    queryFn: fetchReservationGroups,
  })

  return { groups: data ?? [], isLoading, error: error ?? null }
}

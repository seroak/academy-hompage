import { useQuery } from '@tanstack/react-query'
import { fetchPublicConfirmedSlots } from '../../api/public.api'
import { queryKeys } from '../../queries/queryKeys'

export function useConfirmedSlotsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.confirmedSlots.all,
    queryFn: fetchPublicConfirmedSlots,
  })

  return { confirmedSlots: data ?? [], isLoading, error: error ?? null }
}

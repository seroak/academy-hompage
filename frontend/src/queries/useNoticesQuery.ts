import { useQuery } from '@tanstack/react-query'
import { fetchNotices } from '../api/notices.api'
import { queryKeys } from './queryKeys'

export function useNoticesQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.notices.all,
    queryFn: fetchNotices,
  })

  return { notices: data ?? [], isLoading, error: error ?? null }
}

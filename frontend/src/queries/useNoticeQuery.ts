import { useQuery } from '@tanstack/react-query'
import { fetchNotice } from '../api/notices.api'
import { queryKeys } from './queryKeys'

export function useNoticeQuery(id: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.notices.detail(id ?? ''),
    queryFn: () => fetchNotice(id!),
    enabled: !!id,
  })

  return { notice: data, isLoading, error: error ?? null }
}

import { useQuery } from '@tanstack/react-query'
import { fetchJoinableGroups } from '../../api/public.api'
import { queryKeys } from '../../queries/queryKeys'

export function useJoinableGroupsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.joinableGroups.all,
    queryFn: fetchJoinableGroups,
  })

  return { joinableGroups: data ?? [], isLoading, error: error ?? null }
}

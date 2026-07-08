import { useQuery } from '@tanstack/react-query'
import { fetchMembers } from '../../../api/members.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useMembersQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.members.all,
    queryFn: fetchMembers,
  })

  return { members: data ?? [], isLoading, error: error ?? null }
}

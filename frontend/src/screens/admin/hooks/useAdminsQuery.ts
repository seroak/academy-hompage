import { useQuery } from '@tanstack/react-query'
import { fetchAdmins } from '../../../api/admins.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useAdminsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.admins.all,
    queryFn: fetchAdmins,
  })

  return { admins: data ?? [], isLoading, error: error ?? null }
}

import { useQuery } from '@tanstack/react-query'
import { fetchAdminMe } from '../../../api/auth.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useAdminMeQuery() {
  const { data } = useQuery({
    queryKey: queryKeys.adminMe.all,
    queryFn: fetchAdminMe,
  })

  return { currentAdminId: data?.id }
}

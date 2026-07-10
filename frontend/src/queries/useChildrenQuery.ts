import { useQuery } from '@tanstack/react-query'
import { fetchChildren } from '../api/children.api'
import { queryKeys } from './queryKeys'

export function useChildrenQuery() {
  const query = useQuery({ queryKey: queryKeys.children.all, queryFn: fetchChildren })
  return { children: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

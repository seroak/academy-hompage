import { useQuery } from '@tanstack/react-query'
import { fetchInstructors } from '../api/instructors.api'
import { queryKeys } from './queryKeys'

export function useInstructorsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.instructors.all,
    queryFn: fetchInstructors,
  })

  return { instructors: data ?? [], isLoading, error: error ?? null }
}

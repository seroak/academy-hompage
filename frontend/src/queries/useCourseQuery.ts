import { useQuery } from '@tanstack/react-query'
import { fetchCourse } from '../api/courses.api'
import { queryKeys } from './queryKeys'

export function useCourseQuery(id: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.courses.detail(id ?? ''),
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  })

  return { course: data, isLoading, error: error ?? null }
}

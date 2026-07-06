import { useQuery } from '@tanstack/react-query'
import { fetchCourses } from '../api/courses.api'
import { queryKeys } from './queryKeys'

export function useCoursesQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: fetchCourses,
  })

  return { courses: data ?? [], isLoading, error: error ?? null }
}

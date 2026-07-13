import { useQuery } from '@tanstack/react-query'
import { fetchClassSchedules } from '../api/classSchedules.api'
import { queryKeys } from './queryKeys'

export function useClassSchedulesQuery() {
  const query = useQuery({ queryKey: queryKeys.classSchedules.all, queryFn: fetchClassSchedules })
  return { schedules: query.data ?? [], isLoading: query.isLoading, error: query.error ?? null }
}

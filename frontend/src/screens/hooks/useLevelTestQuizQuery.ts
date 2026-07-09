import { useQuery } from '@tanstack/react-query'
import { fetchLevelTestQuiz } from '../../api/public.api'
import { queryKeys } from '../../queries/queryKeys'

export function useLevelTestQuizQuery(age: number) {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.levelTests.quiz(age),
    queryFn: () => fetchLevelTestQuiz(age),
    enabled: false,
  })

  return { questions: data ?? [], isLoading: isFetching, error: error ?? null, start: refetch }
}

import { useQuery } from '@tanstack/react-query'
import { fetchLevelTestQuestions } from '../../../api/levelTests.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useLevelTestQuestionsQuery(age?: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.levelTests.questions.list(age),
    queryFn: () => fetchLevelTestQuestions(age),
  })

  return { questions: data ?? [], isLoading, error: error ?? null }
}

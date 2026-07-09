import { useQuery } from '@tanstack/react-query'
import { fetchLevelTestResults } from '../../../api/levelTests.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useLevelTestResultsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.levelTests.results.all,
    queryFn: fetchLevelTestResults,
  })

  return { results: data ?? [], isLoading, error: error ?? null }
}

import { useQuery } from '@tanstack/react-query'
import { fetchLevelTestConfigs } from '../../../api/levelTests.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useLevelTestConfigsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.levelTests.config.all,
    queryFn: fetchLevelTestConfigs,
  })

  return { configs: data ?? [], isLoading, error: error ?? null }
}

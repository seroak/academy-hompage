import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMarketingDashboard, syncMetaInsights, type MarketingDashboardFilters } from "../../../api/marketing.api";
import { queryKeys } from "../../../queries/queryKeys";

export function useMarketingDashboardQuery(filters: MarketingDashboardFilters) {
  return useQuery({
    queryKey: queryKeys.marketing.dashboard(filters),
    queryFn: () => fetchMarketingDashboard(filters),
  });
}
export function useMetaSyncMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncMetaInsights,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.marketing.all }),
  });
}

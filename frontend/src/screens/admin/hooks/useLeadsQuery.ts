import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchLeads, fetchLeadSummary, updateLead, type LeadFilters } from '../../../api/leads.api'
import { queryKeys } from '../../../queries/queryKeys'

export function useLeadsQuery(filters: LeadFilters) {
  const list = useQuery({ queryKey: queryKeys.leads.list(filters), queryFn: () => fetchLeads(filters) })
  const summaryFilters = { campaign: filters.campaign, content: filters.content, from: filters.from, to: filters.to }
  const summary = useQuery({ queryKey: queryKeys.leads.summary(summaryFilters), queryFn: () => fetchLeadSummary(summaryFilters) })
  return { list, summary }
}

export function useUpdateLeadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateLead>[1] }) => updateLead(id, input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
  })
}

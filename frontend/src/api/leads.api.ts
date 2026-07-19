import { apiFetch } from '../lib/apiClient'
import {
  CreateLeadInputSchema,
  LeadAcceptedSchema,
  LeadListSchema,
  LeadSchema,
  LeadSummarySchema,
  type CreateLeadInput,
  type Lead,
  type LeadList,
  type LeadStatus,
  type LeadSummary,
} from './schemas/lead.schema'

export async function createLead(input: CreateLeadInput) {
  const validated = CreateLeadInputSchema.parse(input)
  return LeadAcceptedSchema.parse(await apiFetch('/leads', { method: 'POST', body: JSON.stringify(validated) }))
}

export type LeadFilters = {
  page?: number
  status?: LeadStatus
  campaign?: string
  content?: string
  from?: string
  to?: string
}

function leadQuery(filters: LeadFilters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function fetchLeads(filters: LeadFilters = {}): Promise<LeadList> {
  return LeadListSchema.parse(await apiFetch(`/leads${leadQuery(filters)}`))
}

export async function fetchLeadSummary(filters: Omit<LeadFilters, 'page' | 'status'> = {}): Promise<LeadSummary> {
  return LeadSummarySchema.parse(await apiFetch(`/leads/summary${leadQuery(filters)}`))
}

export async function updateLead(id: string, input: { status?: LeadStatus; adminNote?: string | null }): Promise<Lead> {
  return LeadSchema.parse(await apiFetch(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(input) }))
}

export async function deleteLead(id: string): Promise<void> {
  await apiFetch(`/leads/${id}`, { method: 'DELETE' })
}

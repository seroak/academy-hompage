import { apiFetch } from '../lib/apiClient'
import { MarketingDashboardSchema, MetaSyncResultSchema } from './schemas/marketing.schema'

export type MarketingDashboardFilters = { from?: string; to?: string; campaignId?: string }
function queryString(filters: MarketingDashboardFilters) { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) }); const query = params.toString(); return query ? `?${query}` : '' }
export async function fetchMarketingDashboard(filters: MarketingDashboardFilters = {}) { return MarketingDashboardSchema.parse(await apiFetch(`/marketing/dashboard${queryString(filters)}`)) }
export async function syncMetaInsights() { return MetaSyncResultSchema.parse(await apiFetch('/marketing/meta/sync', { method: 'POST' })) }

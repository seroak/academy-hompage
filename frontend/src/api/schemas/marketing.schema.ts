import { z } from 'zod'

const NullableMetricSchema = z.number().nullable()
export const MarketingMetricsSchema = z.object({
  spendWon: z.number().int().nonnegative(), impressions: z.number().int().nonnegative(), linkClicks: z.number().int().nonnegative(), landingVisits: z.number().int().nonnegative(), ctaClicks: z.number().int().nonnegative(), formStarts: z.number().int().nonnegative(), leads: z.number().int().nonnegative(), validLeads: z.number().int().nonnegative(), bookings: z.number().int().nonnegative(), visits: z.number().int().nonnegative(), registrations: z.number().int().nonnegative(),
  cpm: NullableMetricSchema, cpc: NullableMetricSchema, costPerLead: NullableMetricSchema, costPerValidLead: NullableMetricSchema, costPerRegistration: NullableMetricSchema, clickToLandingRate: NullableMetricSchema, landingToLeadRate: NullableMetricSchema, leadToValidRate: NullableMetricSchema, validToBookingRate: NullableMetricSchema, bookingToVisitRate: NullableMetricSchema, visitToRegistrationRate: NullableMetricSchema,
})
export const MarketingDashboardSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  totals: MarketingMetricsSchema,
  creatives: z.array(MarketingMetricsSchema.extend({ campaignId: z.string(), campaignName: z.string(), adId: z.string(), adName: z.string() })),
  daily: z.array(z.object({ date: z.string(), spendWon: z.number(), landingVisits: z.number(), leads: z.number(), registrations: z.number() })),
  newLeads: z.number().int().nonnegative(),
  meta: z.object({ configured: z.boolean(), isRunning: z.boolean(), lastSuccessAt: z.string().nullable(), lastError: z.string().nullable() }),
})
export const MetaSyncResultSchema = z.object({ synced: z.number().int().nonnegative(), skipped: z.literal(true).optional() })
export type MarketingDashboard = z.infer<typeof MarketingDashboardSchema>

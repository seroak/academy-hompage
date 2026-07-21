import { z } from 'zod'

export const LeadStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'CONSULTATION_BOOKED',
  'VISITED',
  'REGISTERED',
  'NO_RESPONSE',
  'DISQUALIFIED',
])
export const ContactWindowSchema = z.enum([
  'H09_10', 'H10_11', 'H11_12', 'H12_13', 'H13_14', 'H14_15', 'H15_16',
  'H16_17', 'H17_18', 'H18_19', 'H19_20', 'H20_21', 'H21_22', 'H22_23', 'H23_24',
])

export const CreateLeadInputSchema = z.object({
  guardianName: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(9).max(20),
  childAge: z.number().int().min(4).max(10),
  contactWindow: ContactWindowSchema,
  privacyConsent: z.literal(true),
  privacyConsentVersion: z.string(),
  turnstileToken: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  fbclid: z.string().optional(),
  landingPath: z.string().optional(),
  referrer: z.string().optional(),
  analyticsConsent: z.boolean(),
  marketingConsent: z.boolean(),
})

export const LeadAcceptedSchema = z.object({ accepted: z.literal(true) })

export const LeadSchema = z.object({
  id: z.string(),
  guardianName: z.string(),
  phone: z.string(),
  childAge: z.number(),
  contactWindow: ContactWindowSchema,
  status: LeadStatusSchema,
  utmSource: z.string().nullable(),
  utmMedium: z.string().nullable(),
  utmCampaign: z.string().nullable(),
  utmContent: z.string().nullable(),
  utmTerm: z.string().nullable(),
  fbclid: z.string().nullable(),
  landingPath: z.string().nullable(),
  referrer: z.string().nullable(),
  adminNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const LeadListSchema = z.object({
  items: z.array(LeadSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
})

export const LeadSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  valid: z.number().int().nonnegative(),
  booking: z.number().int().nonnegative(),
  visited: z.number().int().nonnegative(),
  registered: z.number().int().nonnegative(),
  validRate: z.number().nonnegative(),
  bookingRate: z.number().nonnegative(),
  visitRate: z.number().nonnegative(),
  registrationRate: z.number().nonnegative(),
})

export type ContactWindow = z.infer<typeof ContactWindowSchema>
export type CreateLeadInput = z.infer<typeof CreateLeadInputSchema>
export type Lead = z.infer<typeof LeadSchema>
export type LeadStatus = z.infer<typeof LeadStatusSchema>
export type LeadList = z.infer<typeof LeadListSchema>
export type LeadSummary = z.infer<typeof LeadSummarySchema>

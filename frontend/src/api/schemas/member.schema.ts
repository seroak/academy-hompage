import { z } from 'zod'
import { ReservationListSchema } from './reservation.schema'

export const OAUTH_PROVIDER_OPTIONS = ['GOOGLE', 'KAKAO', 'NAVER'] as const

export const OAUTH_PROVIDER_LABELS: Record<(typeof OAUTH_PROVIDER_OPTIONS)[number], string> = {
  GOOGLE: '구글',
  KAKAO: '카카오',
  NAVER: '네이버',
}

export const MemberSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.string(),
  hasPassword: z.boolean(),
  socialProviders: z.array(z.enum(OAUTH_PROVIDER_OPTIONS)),
  reservations: ReservationListSchema,
})

export const MemberListSchema = z.array(MemberSchema)

export type Member = z.infer<typeof MemberSchema>

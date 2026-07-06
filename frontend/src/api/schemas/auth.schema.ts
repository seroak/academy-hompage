import { z } from 'zod'

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const OAuthProviderSchema = z.enum(['google', 'kakao', 'naver'])

export type OAuthProvider = z.infer<typeof OAuthProviderSchema>

export const ParentProfileSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
})

export type ParentProfile = z.infer<typeof ParentProfileSchema>

export const ParentLoginResponseSchema = z.object({
  accessToken: z.string(),
  parent: ParentProfileSchema,
})

export type ParentLoginResponse = z.infer<typeof ParentLoginResponseSchema>

import { z } from 'zod'

export const AdminRoleSchema = z.enum([
  'CONTENT_MANAGER',
  'RESERVATION_MANAGER',
  'ASSESSMENT_MANAGER',
  'SUPER_ADMIN',
])

export type AdminRole = z.infer<typeof AdminRoleSchema>

export const AdminProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: AdminRoleSchema,
})

export type AdminProfile = z.infer<typeof AdminProfileSchema>

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  admin: AdminProfileSchema,
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

export const ParentPasswordAuthInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type ParentPasswordAuthInput = z.infer<typeof ParentPasswordAuthInputSchema>

export const ParentSignupInputSchema = ParentPasswordAuthInputSchema.extend({
  name: z.string().min(1),
})

export type ParentSignupInput = z.infer<typeof ParentSignupInputSchema>

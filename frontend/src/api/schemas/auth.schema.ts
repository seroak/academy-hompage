import { z } from 'zod'

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

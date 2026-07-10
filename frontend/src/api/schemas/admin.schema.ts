import { z } from 'zod'

export const CreateAdminInputSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
})

export type CreateAdminInput = z.infer<typeof CreateAdminInputSchema>

export const CreatedAdminSchema = z.object({
  id: z.string(),
  username: z.string(),
  createdAt: z.string(),
})

export type CreatedAdmin = z.infer<typeof CreatedAdminSchema>

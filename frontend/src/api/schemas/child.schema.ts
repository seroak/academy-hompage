import { z } from 'zod'

export const CHILD_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const

export const ChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int().min(4).max(10),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ChildListSchema = z.array(ChildSchema)

export const ChildInputSchema = z.object({
  name: z.string().trim().min(1, '자녀 이름을 입력해 주세요'),
  age: z.number().int().min(4).max(10),
})

export type Child = z.infer<typeof ChildSchema>
export type ChildInput = z.infer<typeof ChildInputSchema>

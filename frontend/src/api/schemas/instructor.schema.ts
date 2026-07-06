import { z } from 'zod'

export const InstructorSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  bio: z.string(),
  photoUrl: z.string().nullable().optional(),
  createdAt: z.string(),
})

export const InstructorListSchema = z.array(InstructorSchema)

export type Instructor = z.infer<typeof InstructorSchema>

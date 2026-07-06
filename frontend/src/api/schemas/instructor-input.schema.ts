import { z } from 'zod'

export const CreateInstructorInputSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요'),
  subject: z.string().min(1, '담당 과목을 입력해 주세요'),
  bio: z.string().min(1, '소개를 입력해 주세요'),
  photoUrl: z.string().optional(),
})

export type CreateInstructorInput = z.infer<typeof CreateInstructorInputSchema>

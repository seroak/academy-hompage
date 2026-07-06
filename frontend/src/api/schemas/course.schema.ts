import { z } from 'zod'
import { InstructorSchema } from './instructor.schema'

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  level: z.string(),
  tuition: z.number(),
  schedule: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  instructorId: z.string(),
  instructor: InstructorSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CourseListSchema = z.array(CourseSchema)

export type Course = z.infer<typeof CourseSchema>

export const CreateCourseInputSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요'),
  description: z.string().min(1, '설명을 입력해 주세요'),
  category: z.string().min(1, '분류를 입력해 주세요'),
  level: z.string().min(1, '난이도를 입력해 주세요'),
  tuition: z.number().int().min(0, '수강료는 0 이상이어야 합니다'),
  schedule: z.string().min(1, '일정을 입력해 주세요'),
  instructorId: z.string().min(1, '담당 강사를 선택해 주세요'),
  thumbnailUrl: z.string().optional(),
})

export type CreateCourseInput = z.infer<typeof CreateCourseInputSchema>

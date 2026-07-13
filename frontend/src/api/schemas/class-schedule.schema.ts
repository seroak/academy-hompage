import { z } from 'zod'

export const ScheduleDayKindSchema = z.enum(['CLASS', 'HOLIDAY', 'CLOSED'])
export const ScheduleStatusSchema = z.enum(['DRAFT', 'PUBLISHED'])
export const ClassScheduleDaySchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: ScheduleDayKindSchema,
  classMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  note: z.string().max(30).nullable().optional(),
})
export const ClassScheduleSchema = z.object({
  id: z.string(), year: z.number().int().min(2000).max(2100), quarter: z.number().int().min(1).max(4),
  status: ScheduleStatusSchema, publishedAt: z.string().nullable(), createdAt: z.string(), updatedAt: z.string(),
  days: z.array(ClassScheduleDaySchema),
})
export const ClassScheduleListSchema = z.array(ClassScheduleSchema)
export const ClassScheduleInputSchema = z.object({
  year: z.number().int().min(2000).max(2100), quarter: z.number().int().min(1).max(4),
  days: z.array(ClassScheduleDaySchema.omit({ id: true })),
})
export type ClassSchedule = z.infer<typeof ClassScheduleSchema>
export type ClassScheduleDay = z.infer<typeof ClassScheduleDaySchema>
export type ClassScheduleInput = z.infer<typeof ClassScheduleInputSchema>

import { z } from 'zod'

export const NoticeSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  pinned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const NoticeListSchema = z.array(NoticeSchema)

export type Notice = z.infer<typeof NoticeSchema>

export const CreateNoticeInputSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요'),
  content: z.string().min(1, '내용을 입력해 주세요'),
  pinned: z.boolean().optional(),
})

export type CreateNoticeInput = z.infer<typeof CreateNoticeInputSchema>

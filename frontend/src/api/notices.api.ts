import { apiFetch } from '../lib/apiClient'
import { NoticeListSchema, NoticeSchema, type Notice, type CreateNoticeInput } from './schemas/notice.schema'

export async function fetchNotices(): Promise<Notice[]> {
  const raw = await apiFetch('/notices')
  return NoticeListSchema.parse(raw)
}

export async function fetchNotice(id: string): Promise<Notice> {
  const raw = await apiFetch(`/notices/${id}`)
  return NoticeSchema.parse(raw)
}

export async function createNotice(input: CreateNoticeInput): Promise<Notice> {
  const raw = await apiFetch('/notices', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return NoticeSchema.parse(raw)
}

export async function updateNotice(
  id: string,
  input: Partial<CreateNoticeInput>,
): Promise<Notice> {
  const raw = await apiFetch(`/notices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return NoticeSchema.parse(raw)
}

export async function deleteNotice(id: string): Promise<void> {
  await apiFetch(`/notices/${id}`, { method: 'DELETE' })
}

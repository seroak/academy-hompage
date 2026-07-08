import { apiFetch } from '../lib/apiClient'
import { MemberListSchema, type Member } from './schemas/member.schema'

export async function fetchMembers(): Promise<Member[]> {
  const raw = await apiFetch('/members')
  return MemberListSchema.parse(raw)
}

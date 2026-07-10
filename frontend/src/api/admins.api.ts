import { apiFetch } from '../lib/apiClient'
import {
  CreateAdminInputSchema,
  CreatedAdminSchema,
  type CreateAdminInput,
  type CreatedAdmin,
} from './schemas/admin.schema'

export async function createAdmin(input: CreateAdminInput): Promise<CreatedAdmin> {
  const payload = CreateAdminInputSchema.parse(input)
  const raw = await apiFetch('/admins', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return CreatedAdminSchema.parse(raw)
}

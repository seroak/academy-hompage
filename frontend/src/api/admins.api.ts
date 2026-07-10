import { apiFetch } from '../lib/apiClient'
import {
  AdminListSchema,
  CreateAdminInputSchema,
  CreatedAdminSchema,
  type Admin,
  type CreateAdminInput,
  type CreatedAdmin,
} from './schemas/admin.schema'

export async function fetchAdmins(): Promise<Admin[]> {
  const raw = await apiFetch('/admins')
  return AdminListSchema.parse(raw)
}

export async function createAdmin(input: CreateAdminInput): Promise<CreatedAdmin> {
  const payload = CreateAdminInputSchema.parse(input)
  const raw = await apiFetch('/admins', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return CreatedAdminSchema.parse(raw)
}

export async function deleteAdmin(id: string): Promise<void> {
  await apiFetch(`/admins/${id}`, { method: 'DELETE' })
}

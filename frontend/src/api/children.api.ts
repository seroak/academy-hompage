import { apiFetch } from '../lib/apiClient'
import { ChildListSchema, ChildSchema, type Child, type ChildInput } from './schemas/child.schema'

export async function fetchChildren(): Promise<Child[]> {
  const raw = await apiFetch('/children', {}, { authMode: 'parent' })
  return ChildListSchema.parse(raw)
}

export async function createChild(input: ChildInput): Promise<Child> {
  const raw = await apiFetch('/children', { method: 'POST', body: JSON.stringify(input) }, { authMode: 'parent' })
  return ChildSchema.parse(raw)
}

export async function updateChild(id: string, input: ChildInput): Promise<Child> {
  const raw = await apiFetch(`/children/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, { authMode: 'parent' })
  return ChildSchema.parse(raw)
}

export async function deleteChild(id: string): Promise<void> {
  await apiFetch(`/children/${id}`, { method: 'DELETE' }, { authMode: 'parent' })
}

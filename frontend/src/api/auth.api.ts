import { apiFetch } from '../lib/apiClient'
import { LoginResponseSchema, type LoginResponse } from './schemas/auth.schema'

export async function login(username: string, password: string): Promise<LoginResponse> {
  const raw = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return LoginResponseSchema.parse(raw)
}

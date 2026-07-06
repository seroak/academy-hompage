import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }))
    throw new ApiError(response.status, body.message ?? response.statusText)
  }

  const text = await response.text()
  if (!text) return null

  return JSON.parse(text)
}

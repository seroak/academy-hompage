import { useAuthStore } from '../stores/authStore'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type ApiAuthMode = 'admin' | 'parent' | 'none'

interface ApiFetchOptions {
  authMode?: ApiAuthMode
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<unknown> {
  const authMode = options.authMode ?? 'admin'
  const token = authMode === 'admin' ? useAuthStore.getState().accessToken : null
  const headers = new Headers(init.headers)
  // FormData(파일 업로드 등)는 브라우저가 멀티파트 boundary를 포함해 Content-Type을 직접 설정해야 하므로 건드리지 않는다.
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // 학부모 인증은 httpOnly 쿠키(academy-parent-session)로 이뤄지므로
  // credentials: 'include'로 모든 요청에 쿠키를 함께 전송한다.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }))
    throw new ApiError(response.status, body.message ?? response.statusText)
  }

  const text = await response.text()
  if (!text) return null

  return JSON.parse(text)
}

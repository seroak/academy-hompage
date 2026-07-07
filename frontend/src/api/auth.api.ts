import { API_BASE_URL, apiFetch } from '../lib/apiClient'
import {
  LoginResponseSchema,
  ParentLoginResponseSchema,
  ParentProfileSchema,
  type LoginResponse,
  type OAuthProvider,
  type ParentPasswordAuthInput,
  type ParentLoginResponse,
  type ParentProfile,
  type ParentSignupInput,
} from './schemas/auth.schema'

export async function login(username: string, password: string): Promise<LoginResponse> {
  const raw = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, { authMode: 'none' })
  return LoginResponseSchema.parse(raw)
}

export function socialLoginStartUrl(provider: OAuthProvider, returnTo = '/'): string {
  const params = new URLSearchParams({ returnTo })
  return `${API_BASE_URL}/auth/social/${provider}/start?${params.toString()}`
}

export async function exchangeSocialLogin(code: string): Promise<ParentLoginResponse> {
  const raw = await apiFetch('/auth/social/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }, { authMode: 'none' })
  return ParentLoginResponseSchema.parse(raw)
}

export async function loginParentWithPassword(
  input: ParentPasswordAuthInput,
): Promise<ParentLoginResponse> {
  const raw = await apiFetch('/auth/parents/login', {
    method: 'POST',
    body: JSON.stringify(input),
  }, { authMode: 'none' })
  return ParentLoginResponseSchema.parse(raw)
}

export async function signupParent(input: ParentSignupInput): Promise<ParentLoginResponse> {
  const raw = await apiFetch('/auth/parents/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  }, { authMode: 'none' })
  return ParentLoginResponseSchema.parse(raw)
}

export async function fetchParentMe(): Promise<ParentProfile> {
  const raw = await apiFetch('/auth/social/me', {}, { authMode: 'parent' })
  return ParentProfileSchema.parse(raw)
}

export async function logoutParent(): Promise<void> {
  await apiFetch('/auth/parents/logout', { method: 'POST' }, { authMode: 'none' })
}

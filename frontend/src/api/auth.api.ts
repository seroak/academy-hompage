import { API_BASE_URL, apiFetch } from '../lib/apiClient'
import {
  AdminProfileSchema,
  LoginResponseSchema,
  ParentLoginResponseSchema,
  ParentProfileSchema,
  ParentSignupResponseSchema,
  type AdminProfile,
  type LoginResponse,
  type OAuthProvider,
  type ParentPasswordAuthInput,
  type ParentLoginResponse,
  type ParentProfile,
  type ParentSignupInput,
  type ParentSignupResponse,
} from './schemas/auth.schema'

export async function login(username: string, password: string): Promise<LoginResponse> {
  const raw = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return LoginResponseSchema.parse(raw)
}

export async function logoutAdmin(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' })
}

export async function fetchAdminMe(): Promise<AdminProfile> {
  const raw = await apiFetch('/auth/admin/me')
  return AdminProfileSchema.parse(raw)
}

export function socialLoginStartUrl(provider: OAuthProvider, returnTo = '/'): string {
  const params = new URLSearchParams({ returnTo })
  return `${API_BASE_URL}/auth/social/${provider}/start?${params.toString()}`
}

export async function exchangeSocialLogin(code: string): Promise<ParentLoginResponse> {
  const raw = await apiFetch('/auth/social/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  return ParentLoginResponseSchema.parse(raw)
}

export async function loginParentWithPassword(
  input: ParentPasswordAuthInput,
): Promise<ParentLoginResponse> {
  const raw = await apiFetch('/auth/parents/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return ParentLoginResponseSchema.parse(raw)
}

export async function signupParent(input: ParentSignupInput): Promise<ParentSignupResponse> {
  const raw = await apiFetch('/auth/parents/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return ParentSignupResponseSchema.parse(raw)
}

export async function verifyParentEmail(token: string): Promise<ParentLoginResponse> {
  const raw = await apiFetch('/auth/parents/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
  return ParentLoginResponseSchema.parse(raw)
}

export async function fetchParentMe(): Promise<ParentProfile> {
  const raw = await apiFetch('/auth/social/me')
  return ParentProfileSchema.parse(raw)
}

export async function logoutParent(): Promise<void> {
  await apiFetch('/auth/parents/logout', { method: 'POST' })
}

import { cookies } from 'next/headers'
import { ParentProfileSchema, type ParentProfile } from '../api/schemas/auth.schema'

export interface ServerAuth {
  admin: boolean
  parent: ParentProfile | null
}

const EMPTY_AUTH: ServerAuth = { admin: false, parent: null }

const PARENT_SESSION_COOKIE = 'academy-parent-session'
const ADMIN_SESSION_COOKIE = 'academy-admin-session'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

interface SessionJwtPayload {
  sub?: string
  email?: string | null
  name?: string | null
  username?: string
  tokenType?: string
  exp?: number
}

function decodeJwtPayload(token: string | undefined): SessionJwtPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8')
    const payload: unknown = JSON.parse(json)
    if (!isRecord(payload)) return null
    return {
      sub: typeof payload.sub === 'string' ? payload.sub : undefined,
      email: typeof payload.email === 'string' || payload.email === null ? payload.email : undefined,
      name: typeof payload.name === 'string' || payload.name === null ? payload.name : undefined,
      username: typeof payload.username === 'string' ? payload.username : undefined,
      tokenType: typeof payload.tokenType === 'string' ? payload.tokenType : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    }
  } catch {
    return null
  }
}

function isSessionExpired(payload: SessionJwtPayload): boolean {
  return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()
}

function parentFromSessionCookie(token: string | undefined): ParentProfile | null {
  const payload = decodeJwtPayload(token)
  if (!payload || payload.tokenType !== 'parent' || !payload.sub) return null
  if (isSessionExpired(payload)) return null

  const parsed = ParentProfileSchema.safeParse({
    id: payload.sub,
    email: payload.email ?? null,
    name: payload.name ?? null,
  })
  return parsed.success ? parsed.data : null
}

function isAdminSessionValid(token: string | undefined): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload || payload.tokenType !== 'admin' || !payload.sub || !payload.username) return false
  return !isSessionExpired(payload)
}

/**
 * 서버 컴포넌트에서 로그인 상태를 읽는다. 관리자·학부모 인증 모두 백엔드가 발급한
 * httpOnly 쿠키(academy-admin-session / academy-parent-session)의 JWT payload를
 * 디코드해 판정한다 — 서명 검증은 하지 않으며(브라우저 JS도 이 쿠키를 읽을 수 없으므로
 * 위조 위험이 없고, 실제 검증은 API 호출 시 백엔드 jwt/parent-jwt 가드가 수행한다),
 * 여기서는 만료(exp)만 확인한다. 파싱 실패/부재 시 항상 로그아웃 상태로 폴백한다(throw 금지).
 */
export async function getServerAuth(): Promise<ServerAuth> {
  const jar = await cookies()

  const admin = isAdminSessionValid(jar.get(ADMIN_SESSION_COOKIE)?.value)
  const parent = parentFromSessionCookie(jar.get(PARENT_SESSION_COOKIE)?.value)

  if (!admin && !parent) return EMPTY_AUTH
  return { admin, parent }
}

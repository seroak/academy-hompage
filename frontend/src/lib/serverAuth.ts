import { cookies } from 'next/headers'
import { ParentProfileSchema, type ParentProfile } from '../api/schemas/auth.schema'

export interface ServerAuth {
  admin: boolean
  parent: ParentProfile | null
}

const EMPTY_AUTH: ServerAuth = { admin: false, parent: null }

const PARENT_SESSION_COOKIE = 'academy-parent-session'

// zustand persist가 쿠키에 저장하는 형태: { state: {...}, version: number }
function parsePersistState(raw: string | undefined): unknown {
  if (!raw) return null
  try {
    const envelope = JSON.parse(raw) as { state?: unknown }
    return envelope?.state ?? null
  } catch {
    return null
  }
}

interface ParentJwtPayload {
  sub?: string
  email?: string | null
  name?: string | null
  tokenType?: string
  exp?: number
}

function decodeJwtPayload(token: string | undefined): ParentJwtPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8')
    return JSON.parse(json) as ParentJwtPayload
  } catch {
    return null
  }
}

function parentFromSessionCookie(token: string | undefined): ParentProfile | null {
  const payload = decodeJwtPayload(token)
  if (!payload || payload.tokenType !== 'parent' || !payload.sub) return null
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) return null

  const parsed = ParentProfileSchema.safeParse({
    id: payload.sub,
    email: payload.email ?? null,
    name: payload.name ?? null,
  })
  return parsed.success ? parsed.data : null
}

/**
 * 서버 컴포넌트에서 로그인 상태를 읽는다. 학부모 인증은 백엔드가 발급한 httpOnly
 * 쿠키(academy-parent-session)의 JWT payload를 디코드해 판정한다 — 서명 검증은
 * 하지 않으며(브라우저 JS도 이 쿠키를 읽을 수 없으므로 위조 위험이 없고, 실제 검증은
 * API 호출 시 백엔드 parent-jwt 가드가 수행한다), 여기서는 만료(exp)만 확인한다.
 * 파싱 실패/부재 시 항상 로그아웃 상태로 폴백한다(throw 금지).
 */
export async function getServerAuth(): Promise<ServerAuth> {
  const jar = await cookies()

  const adminState = parsePersistState(jar.get('academy-admin-auth')?.value) as
    | { isAuthenticated?: boolean }
    | null
  const admin = adminState?.isAuthenticated === true

  const parent = parentFromSessionCookie(jar.get(PARENT_SESSION_COOKIE)?.value)

  if (!admin && !parent) return EMPTY_AUTH
  return { admin, parent }
}

import { cookies } from 'next/headers'
import { ParentProfileSchema, type ParentProfile } from '../api/schemas/auth.schema'

export interface ServerAuth {
  admin: boolean
  parent: ParentProfile | null
}

const EMPTY_AUTH: ServerAuth = { admin: false, parent: null }

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

/**
 * 서버 컴포넌트에서 로그인 상태를 읽는다. cookieStorage(클라이언트)가 쓴 쿠키를
 * next/headers의 cookies()로 읽어 SSR 첫 렌더부터 정확한 Header를 그릴 수 있게 한다.
 * 파싱 실패/부재 시 항상 로그아웃 상태로 폴백한다(throw 금지).
 */
export async function getServerAuth(): Promise<ServerAuth> {
  const jar = await cookies()

  const adminState = parsePersistState(jar.get('academy-admin-auth')?.value) as
    | { isAuthenticated?: boolean }
    | null
  const admin = adminState?.isAuthenticated === true

  const parentState = parsePersistState(jar.get('academy-parent-auth')?.value) as
    | { isAuthenticated?: boolean; parent?: unknown }
    | null
  let parent: ParentProfile | null = null
  if (parentState?.isAuthenticated === true) {
    const parsed = ParentProfileSchema.safeParse(parentState.parent)
    parent = parsed.success ? parsed.data : null
  }

  if (!admin && !parent) return EMPTY_AUTH
  return { admin, parent }
}

import type { StateStorage } from 'zustand/middleware'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7일

function readCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
  if (!match) return null
  const value = match.slice(name.length + 1)
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

/**
 * Zustand persist용 StateStorage 구현체.
 * 로그인 상태(토큰)를 서버(next/headers의 cookies())에서도 읽을 수 있도록
 * localStorage 대신 document.cookie에 저장한다.
 * httpOnly가 아니므로 apiClient가 클라이언트에서 계속 토큰을 읽어 Bearer 헤더로 쓸 수 있다.
 */
export const cookieStorage: StateStorage = {
  getItem: (name) => {
    if (typeof document === 'undefined') return null
    return readCookie(name)
  },
  setItem: (name, value) => {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`
  },
  removeItem: (name) => {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
  },
}

// serverAuth.ts(getServerAuth)는 학부모 세션 쿠키의 JWT 서명을 검증하지 않고
// payload만 디코드해 tokenType/exp를 확인한다(실제 서명 검증은 백엔드 API 가드가 담당).
// 그래서 E2E에서는 실제 로그인을 태우지 않고 이 형식에 맞는 위조 JWT를 쿠키에 심는 것만으로
// 보호자 로그인 상태를 재현할 수 있다.
function base64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

export interface FakeParentPayload {
  sub: string
  email?: string | null
  name?: string | null
  expiresInSeconds?: number
}

export function makeParentJwt({ sub, email, name, expiresInSeconds = 60 * 60 }: FakeParentPayload): string {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      sub,
      email: email ?? null,
      name: name ?? null,
      tokenType: 'parent',
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    }),
  )
  return `${header}.${payload}.e2e-fake-signature`
}

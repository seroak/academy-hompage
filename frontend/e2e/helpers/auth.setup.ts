import { test as setup } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { makeAdminJwt, makeParentJwt } from './makeParentJwt'
import { PARENT_STORAGE_STATE, ADMIN_STORAGE_STATE } from './authPaths'

const authDir = path.join(process.cwd(), 'e2e/.auth')

setup('보호자 인증 상태 준비', async ({ context, baseURL }) => {
  fs.mkdirSync(authDir, { recursive: true })
  const jwt = makeParentJwt({ sub: 'e2e-parent-1', email: 'parent.e2e@example.com', name: 'E2E 학부모' })
  const hostname = new URL(baseURL!).hostname

  await context.addCookies([
    {
      name: 'academy-parent-session',
      value: jwt,
      domain: hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])

  await context.storageState({ path: PARENT_STORAGE_STATE })
})

setup('관리자 인증 상태 준비', async ({ context, baseURL }) => {
  fs.mkdirSync(authDir, { recursive: true })
  // serverAuth.ts는 httpOnly 쿠키(academy-admin-session)의 JWT payload만 디코드해
  // tokenType==='admin' && username 존재 && exp를 확인한다(서명 검증은 백엔드 가드가 담당).
  // 어차피 클라이언트 요청은 각 spec의 page.route()가 가로채므로 실제 백엔드 토큰일 필요는 없다.
  const jwt = makeAdminJwt({ sub: 'e2e-admin-1', username: 'e2e-admin' })
  const hostname = new URL(baseURL!).hostname

  await context.addCookies([
    {
      name: 'academy-admin-session',
      value: jwt,
      domain: hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])

  await context.storageState({ path: ADMIN_STORAGE_STATE })
})

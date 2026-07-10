import { test as setup } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { makeParentJwt } from './makeParentJwt'
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
  // zustand persist(cookieStorage)가 저장하는 형태: { state: {...}, version }.
  // serverAuth.ts는 state.isAuthenticated === true만 확인하므로 accessToken 값 자체는
  // 실제 백엔드 토큰일 필요가 없다(어차피 클라이언트 요청은 각 spec의 page.route()가 가로챈다).
  const envelope = JSON.stringify({
    state: {
      accessToken: 'e2e-fake-admin-token',
      admin: { id: 'e2e-admin-1', username: 'e2e-admin' },
      isAuthenticated: true,
    },
    version: 0,
  })
  const hostname = new URL(baseURL!).hostname

  await context.addCookies([
    {
      name: 'academy-admin-auth',
      value: encodeURIComponent(envelope),
      domain: hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])

  await context.storageState({ path: ADMIN_STORAGE_STATE })
})

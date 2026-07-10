import { defineConfig, devices } from '@playwright/test'

// E2E 전용 포트. 개발 중인 next dev(3001)/백엔드(3000)와 절대 겹치지 않도록 분리한다.
// (이미 떠 있는 3001 dev 서버는 실백엔드(3000)를 바라보는 env로 기동된 상태라 재사용할 수 없다.)
export const MOCK_API_PORT = 4310
export const APP_PORT = 3410

export const MOCK_API_BASE_URL = `http://localhost:${MOCK_API_PORT}`
const APP_BASE_URL = `http://localhost:${APP_PORT}`

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: APP_BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      command: `node e2e/mock-server/server.ts`,
      url: `${MOCK_API_BASE_URL}/__health`,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
      env: { MOCK_API_PORT: String(MOCK_API_PORT) },
    },
    {
      // Next의 fetch 데이터 캐시(revalidate 옵션이 붙은 fetch)는 .next-e2e/dev/cache/fetch-cache에
      // 디스크로 영구 저장되어 dev 서버 프로세스를 껐다 켜도 살아남는다. 목 서버 시나리오를
      // 매 실행마다 신뢰성 있게 반영하려면 dev 서버를 시작하기 전 이 캐시를 비워야 한다.
      command: `rm -rf .next-e2e/dev/cache && npx next dev -p ${APP_PORT}`,
      url: APP_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_BASE_URL: MOCK_API_BASE_URL,
        NEXT_PUBLIC_SITE_URL: APP_BASE_URL,
        // next dev는 프로젝트 디렉토리당 인스턴스를 1개로 제한한다(포트가 달라도 잠금 충돌).
        // distDir을 분리해 평소 개발용 dev 서버(3001, .next)와 공존시킨다.
        NEXT_E2E: '1',
      },
    },
  ],
})

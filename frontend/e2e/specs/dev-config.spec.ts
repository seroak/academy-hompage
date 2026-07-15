import { expect, test } from '@playwright/test'
import nextConfig from '../../next.config'

test('127.0.0.1에서 개발 HMR 리소스 접근을 허용한다', () => {
  expect(nextConfig.allowedDevOrigins).toContain('127.0.0.1')
})

test('개발 환경에서 Agentation 툴바를 표시한다', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.removeItem('agentation-session-toolbar-hidden')
  })
  await page.goto('/lp/heungdeok-math')

  await expect(page.locator('[data-agentation-toolbar]')).toBeVisible()
})

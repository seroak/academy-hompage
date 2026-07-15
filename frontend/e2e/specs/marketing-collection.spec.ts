import { expect, test } from '@playwright/test'
import { apiPattern, fulfillJson } from '../helpers/intercept'

test('광고 랜딩 행동은 익명 세션과 UTM만 자체 API로 전송한다', async ({ page }) => {
  const events: Record<string, unknown>[] = []
  await page.route(apiPattern('/marketing/events$'), async (route) => {
    events.push(route.request().postDataJSON() as Record<string, unknown>)
    await fulfillJson(route, 202, { accepted: true })
  })
  await page.goto('/lp/heungdeok-math?utm_source=meta&utm_medium=paid_social&utm_campaign=10&utm_content=30')
  await expect.poll(() => events.length).toBeGreaterThan(0)
  const landing = events.find((event) => event.name === 'view_ad_landing')
  expect(landing).toMatchObject({ utmSource: 'meta', utmCampaign: '10', utmContent: '30' })
  expect(landing?.eventId).toMatch(/^[0-9a-f-]{36}$/)
  expect(landing?.sessionId).toMatch(/^[0-9a-f-]{36}$/)
  expect(landing).not.toHaveProperty('guardianName')
  expect(landing).not.toHaveProperty('phone')
  expect(landing).not.toHaveProperty('childAge')
})

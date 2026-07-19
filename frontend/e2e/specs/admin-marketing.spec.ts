import { expect, test } from '@playwright/test'
import { ADMIN_STORAGE_STATE } from '../helpers/authPaths'
import { apiPattern, fulfillJson, routeByMethod } from '../helpers/intercept'

test.use({ storageState: ADMIN_STORAGE_STATE })

const dashboard = {
  range: { from: '2026-07-09', to: '2026-07-15' },
  totals: { spendWon: 140000, impressions: 21000, linkClicks: 260, landingVisits: 210, ctaClicks: 40, formStarts: 18, leads: 10, validLeads: 6, bookings: 4, visits: 3, registrations: 2, cpm: 6667, cpc: 538, ctr: 1.24, costPerLead: 14000, costPerValidLead: 23333, costPerRegistration: 70000, clickToLandingRate: 80.77, landingToLeadRate: 4.76, leadToValidRate: 60, validToBookingRate: 66.67, bookingToVisitRate: 75, visitToRegistrationRate: 66.67 },
  creatives: [{ campaignId: '10', campaignName: '흥덕 7월', adId: '30', adName: '수업 영상', imageUrl: 'https://example.com/30.jpg', thumbnailUrl: 'https://example.com/30-thumb.jpg', spendWon: 80000, impressions: 12000, linkClicks: 170, landingVisits: 140, ctaClicks: 28, formStarts: 12, leads: 7, validLeads: 5, bookings: 3, visits: 2, registrations: 2, cpm: 6667, cpc: 471, ctr: 1.42, costPerLead: 11429, costPerValidLead: 16000, costPerRegistration: 40000, clickToLandingRate: 82.35, landingToLeadRate: 5, leadToValidRate: 71.43, validToBookingRate: 60, bookingToVisitRate: 66.67, visitToRegistrationRate: 100 }],
  daily: [{ date: '2026-07-15', spendWon: 20000, landingVisits: 35, leads: 2, registrations: 1 }],
  newLeads: 3,
  meta: { configured: true, isRunning: false, lastSuccessAt: '2026-07-15T05:00:00.000Z', lastError: null },
}

test('관리자는 소재별 광고 효율을 확인하고 상세 지표를 펼친다', async ({ page }) => {
  await page.route(apiPattern('/marketing/dashboard(?:\\?.*)?$'), (route) => fulfillJson(route, 200, dashboard))
  await routeByMethod(page, apiPattern('/marketing/meta/sync$'), { POST: (route) => fulfillJson(route, 200, { synced: 1 }) })
  await page.goto('/admin/marketing')
  await expect(page.getByRole('heading', { level: 1, name: '광고 분석' })).toBeVisible()
  await expect(page.getByText('140,000원')).toBeVisible()
  await expect(page.getByText('70,000원')).toBeVisible()
  await expect(page.getByText('수업 영상')).toBeVisible()
  await expect(page.getByText('40,000원', { exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: '수업 영상 썸네일' })).toHaveAttribute('src', 'https://example.com/30-thumb.jpg')
  await page.getByRole('button', { name: 'CTR(클릭률)순' }).click()
  await page.locator('summary[aria-label="수업 영상 상세 보기"]').click()
  await expect(page.getByText('링크 클릭 170')).toBeVisible()
  await expect(page.getByText('CTR 1.42%', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '신규 상담 신청 3건 확인' })).toHaveAttribute('href', '/admin/leads?status=NEW')
})

test('Meta 연결 전에는 설정 안내를 표시한다', async ({ page }) => {
  await page.route(apiPattern('/marketing/dashboard(?:\\?.*)?$'), (route) => fulfillJson(route, 200, { ...dashboard, totals: { ...dashboard.totals, spendWon: 0 }, creatives: [], meta: { configured: false, isRunning: false, lastSuccessAt: null, lastError: null } }))
  await page.goto('/admin/marketing')
  await expect(page.getByText('Meta API 연결이 필요합니다')).toBeVisible()
})

test('관리자는 Meta 동기화 완료와 반영 건수를 확인한다', async ({ page }) => {
  await page.route(apiPattern('/marketing/dashboard(?:\\?.*)?$'), (route) => fulfillJson(route, 200, dashboard))
  await routeByMethod(page, apiPattern('/marketing/meta/sync$'), {
    POST: (route) => fulfillJson(route, 200, { synced: 2 }),
  })

  await page.goto('/admin/marketing')
  await page.getByRole('button', { name: '지금 동기화' }).click()

  await expect(page.getByRole('status')).toHaveText('동기화 완료 · 광고 데이터 2건 반영')
  await expect(page.getByText('마지막 동기화 성공')).toBeVisible()
})

test('관리자는 측정 기준을 펼쳐 구간별 집계 단위를 확인한다', async ({ page }) => {
  await page.route(apiPattern('/marketing/dashboard(?:\\?.*)?$'), (route) =>
    fulfillJson(route, 200, dashboard),
  )

  await page.goto('/admin/marketing')

  const guide = page.getByRole('table', { name: '광고 분석 측정 기준' })
  await expect(guide).toBeHidden()
  await page.locator('summary').filter({ hasText: '측정 기준 보기' }).click()
  await expect(guide).toBeVisible()

  for (const section of [
    '노출·링크 클릭·광고비',
    '랜딩 방문',
    'CTA 클릭',
    '폼 시작',
    '상담 신청',
    '유효 상담·예약·방문·등록',
  ]) {
    await expect(guide.getByRole('cell', { name: section, exact: true })).toBeVisible()
  }
  await expect(guide.getByRole('cell', { name: '30분 기준 고유 세션', exact: true })).toBeVisible()
  await expect(page.getByText('클릭·세션·이벤트·DB 건수는 서로 다른 집계 단위이며 실제 고유 인원과 같지 않을 수 있습니다.')).toBeVisible()
})

test('모바일 측정 기준 안내는 가로 스크롤 없이 표시된다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route(apiPattern('/marketing/dashboard(?:\\?.*)?$'), (route) =>
    fulfillJson(route, 200, dashboard),
  )

  await page.goto('/admin/marketing')
  await page.locator('summary').filter({ hasText: '측정 기준 보기' }).click()

  const guide = page.getByRole('table', { name: '광고 분석 측정 기준' })
  await expect(guide).toBeVisible()
  await expect(guide.getByRole('cell', { name: '집계 단위 Meta 집계 횟수', exact: true })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true)
})

test('모바일에서도 핵심 광고 지표를 숨기지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route(apiPattern('/marketing/dashboard(?:\\?.*)?$'), (route) =>
    fulfillJson(route, 200, dashboard),
  )

  await page.goto('/admin/marketing')

  for (const label of ['광고비', '상담 신청', '등록', '등록당 광고비']) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
  }
  await expect(page.getByText('140,000원')).toBeVisible()
  await expect(page.getByText('70,000원')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true)
})

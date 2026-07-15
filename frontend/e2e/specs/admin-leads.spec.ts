import { expect, test } from '@playwright/test'
import { ADMIN_STORAGE_STATE } from '../helpers/authPaths'
import { apiPattern, fulfillJson, routeByMethod } from '../helpers/intercept'

test.use({ storageState: ADMIN_STORAGE_STATE })

const lead = {
  id: 'lead-1',
  guardianName: '김보호',
  phone: '01012345678',
  childAge: 7,
  contactWindow: 'H15_18',
  commuteStatus: 'AVAILABLE',
  status: 'NEW',
  utmSource: 'meta',
  utmMedium: 'paid_social',
  utmCampaign: 'heungdeok-v1',
  utmContent: 'video-a',
  utmTerm: null,
  fbclid: 'fb-test',
  landingPath: '/lp/heungdeok-math',
  referrer: '',
  adminNote: null,
  createdAt: '2026-07-15T04:00:00.000Z',
  updatedAt: '2026-07-15T04:00:00.000Z',
}

test('관리자가 상담 신청과 전환 흐름을 확인하고 상태를 변경한다', async ({ page }) => {
  let currentLead: Record<string, unknown> = lead
  await page.route(apiPattern('/leads/summary(?:\\?.*)?$'), (route) => fulfillJson(route, 200, {
    total: 1,
    valid: 0,
    booking: 0,
    visited: 0,
    registered: 0,
    validRate: 0,
    bookingRate: 0,
    visitRate: 0,
    registrationRate: 0,
  }))
  await page.route(apiPattern('/leads(?:\\?.*)?$'), (route) => fulfillJson(route, 200, { items: [currentLead], total: 1, page: 1, pageSize: 20, totalPages: 1 }))
  await routeByMethod(page, apiPattern('/leads/lead-1$'), {
    PATCH: async (route) => {
      const body = route.request().postDataJSON() as { status?: string; adminNote?: string }
      currentLead = { ...currentLead, ...body, updatedAt: '2026-07-15T05:00:00.000Z' }
      await fulfillJson(route, 200, currentLead)
    },
  })

  await page.goto('/admin/leads')

  await expect(page.getByRole('heading', { level: 1, name: '광고 상담 신청' })).toBeVisible()
  await expect(page.getByText('전체 상담 신청').locator('..')).toContainText('1')
  await expect(page.getByText('김보호')).toBeVisible()
  await expect(page.getByRole('link', { name: '010-1234-5678' })).toHaveAttribute('href', 'tel:01012345678')
  await expect(page.getByText('meta / heungdeok-v1 / video-a')).toBeVisible()

  await page.getByLabel('김보호 상태').selectOption('CONTACTED')
  await expect(page.getByLabel('김보호 상태')).toHaveValue('CONTACTED')
})

test('신규 상담 신청 링크의 상태 필터를 적용한다', async ({ page }) => {
  let requestedUrl = ''
  await page.route(apiPattern('/leads/summary(?:\\?.*)?$'), (route) => fulfillJson(route, 200, { total: 0, valid: 0, booking: 0, visited: 0, registered: 0, validRate: 0, bookingRate: 0, visitRate: 0, registrationRate: 0 }))
  await page.route(apiPattern('/leads(?:\\?.*)?$'), (route) => { requestedUrl = route.request().url(); return fulfillJson(route, 200, { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }) })
  await page.goto('/admin/leads?status=NEW')
  await expect(page.getByLabel('상태')).toHaveValue('NEW')
  await expect.poll(() => requestedUrl).toContain('status=NEW')
})

import { expect, test } from '@playwright/test'
import { apiPattern, fulfillJson } from '../helpers/intercept'

async function prepareTurnstile(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const browserWindow = window as typeof window & {
      turnstile?: {
        render: (_target: string | HTMLElement, options: { callback: (token: string) => void }) => string
        reset: () => void
      }
    }
    browserWindow.turnstile = {
      render: (_target, options) => {
        options.callback('turnstile-test-token')
        return 'test-widget'
      },
      reset: () => undefined,
    }
  })
  await page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({ status: 200, body: '' }))
}

test.describe('흥덕 수학 광고 랜딩', () => {
  test.beforeEach(async ({ page }) => {
    await prepareTurnstile(page)
  })

  test('광고 방문자가 과정과 상담 수단을 바로 확인한다', async ({ page }) => {
    await page.setViewportSize({ width: 607, height: 1222 })
    await page.goto('/lp/heungdeok-math')

    await expect(page).toHaveTitle(/흥덕 유치부·초등 저학년 수학/)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.getByRole('heading', { level: 1, name: '흥덕 유치부·초등 저학년 수학' })).toBeVisible()
    const heroImage = page.getByRole('img', { name: '도형 교구로 수학 활동을 하는 아이' })
    await expect(heroImage).toHaveAttribute('src', /c2m-activity/)
    await expect(heroImage).toHaveAttribute('loading', 'eager')
    await expect(page.getByRole('heading', { level: 2, name: '생각을 여는 수학은 무엇이 다른가요?' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: '아이의 성장에 맞춰 이어지는 세 가지 수업' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: '플레이팩토' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: '요리수 수학' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: '씨투엠(C2M)' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: '이런 고민이 있다면 상담해 보세요' })).toBeVisible()
    await expect(page.getByRole('img', { name: '블록 교구로 함께 사고력 활동을 하는 아이들' })).toHaveAttribute('src', /playfacto-activity/)
    await expect(page.getByText('놀이 → 개념 이해 → 사고력 → 교과 연결')).toBeVisible()
    await expect(page.getByRole('link', { name: '전화로 상담하기' }).first()).toHaveAttribute('href', 'tel:01029760166')
    await expect(page.getByRole('button', { name: '상담 신청하기' })).toBeVisible()
  })

  test('넓은 화면에서 히어로 이미지를 표시 폭 이상의 해상도로 제공한다', async ({ page }) => {
    await page.setViewportSize({ width: 2131, height: 1222 })
    await page.goto('/lp/heungdeok-math')

    const heroImage = page.getByRole('img', { name: '도형 교구로 수학 활동을 하는 아이' })
    await expect(heroImage).toBeVisible()
    await expect.poll(async () => heroImage.evaluate((image: HTMLImageElement) => image.naturalWidth >= image.clientWidth)).toBe(true)
  })

  test('UTM과 최소 상담 정보만 제출하고 완료 안내를 표시한다', async ({ page }) => {
    let submittedBody: Record<string, unknown> | undefined
    await page.route(apiPattern('/leads$'), async (route) => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>
      await fulfillJson(route, 201, { accepted: true })
    })
    await page.goto('/lp/heungdeok-math?utm_source=meta&utm_medium=paid_social&utm_campaign=heungdeok-v1&utm_content=video-a&fbclid=fb-test')

    await page.getByLabel('보호자 이름').fill('김보호')
    await page.getByLabel('휴대전화').fill('010-1234-5678')
    await page.getByLabel('자녀 만 나이').selectOption('7')
    await page.getByLabel('연락 가능 시간').selectOption('H15_18')
    await page.getByLabel('통학 가능 여부').selectOption('AVAILABLE')
    await page.getByLabel('개인정보 수집·이용에 동의합니다').check()
    await page.getByRole('button', { name: '상담 신청하기' }).click()

    await expect(page.getByText('평일 13~20시 확인 후 연락드립니다')).toBeVisible()
    expect(submittedBody).toMatchObject({
      guardianName: '김보호',
      phone: '010-1234-5678',
      childAge: 7,
      contactWindow: 'H15_18',
      commuteStatus: 'AVAILABLE',
      turnstileToken: 'turnstile-test-token',
      utmSource: 'meta',
      utmCampaign: 'heungdeok-v1',
      utmContent: 'video-a',
      fbclid: 'fb-test',
    })
    expect(submittedBody).not.toHaveProperty('childName')
  })

  test('접수 실패 시 입력을 유지하고 다시 시도할 수 있게 안내한다', async ({ page }) => {
    await page.route(apiPattern('/leads$'), (route) => fulfillJson(route, 503, { message: 'unavailable' }))
    await page.goto('/lp/heungdeok-math')

    await page.getByLabel('보호자 이름').fill('김보호')
    await page.getByLabel('휴대전화').fill('010-1234-5678')
    await page.getByLabel('자녀 만 나이').selectOption('7')
    await page.getByLabel('연락 가능 시간').selectOption('H15_18')
    await page.getByLabel('통학 가능 여부').selectOption('AVAILABLE')
    await page.getByLabel('개인정보 수집·이용에 동의합니다').check()
    await page.getByRole('button', { name: '상담 신청하기' }).click()

    await expect(page.getByText('상담 신청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.')).toBeVisible()
    await expect(page.getByLabel('보호자 이름')).toHaveValue('김보호')
  })
})

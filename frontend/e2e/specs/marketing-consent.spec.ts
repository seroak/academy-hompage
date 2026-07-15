import { expect, test } from '@playwright/test'

const GA_SCRIPT = 'https://www.googletagmanager.com/gtag/js?id=G-E2ETEST'
const META_SCRIPT = 'https://connect.facebook.net/en_US/fbevents.js'

test.describe('분석 및 마케팅 측정', () => {
  test('첫 방문에 GA4와 Meta Pixel 스크립트를 바로 로드하고 동의 대화상자를 보이지 않는다', async ({ page }) => {
    await page.goto('/?utm_source=meta&utm_medium=paid_social&utm_campaign=heungdeok-v1&fbclid=test-fbclid')

    await expect(page.locator(`script[src="${GA_SCRIPT}"]`)).toHaveCount(1)
    await expect(page.locator(`script[src="${META_SCRIPT}"]`)).toHaveCount(1)
    await expect(page.getByRole('dialog', { name: '분석 및 마케팅 설정' })).toHaveCount(0)
  })

  test('비직접 유입 정보는 30일간 저장하고 직접 방문에도 유지한다', async ({ page }) => {
    await page.goto('/?utm_source=meta&utm_medium=paid_social&utm_campaign=heungdeok-v1&utm_content=video-a&fbclid=test-fbclid')

    await expect.poll(() => page.evaluate(() => localStorage.getItem('openmath-attribution-v1'))).toContain('heungdeok-v1')

    await page.goto('/')

    const attribution = await page.evaluate(() => localStorage.getItem('openmath-attribution-v1'))
    expect(attribution).toContain('"utmSource":"meta"')
    expect(attribution).toContain('"utmContent":"video-a"')
    expect(attribution).toContain('"fbclid":"test-fbclid"')
  })

  test('추적 이벤트는 개인정보 없이 전송한다', async ({ page }) => {
    await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({ status: 200, body: '' }))
    await page.route('https://connect.facebook.net/**', (route) => route.fulfill({ status: 200, body: '' }))
    await page.goto('/')

    await expect(page.locator(`script[src="${GA_SCRIPT}"]`)).toHaveCount(1)
    await expect(page.locator(`script[src="${META_SCRIPT}"]`)).toHaveCount(1)

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('openmath:track', {
          detail: {
            name: 'lead_form_start',
            guardianName: '테스트 보호자',
            phone: '010-1234-5678',
            childName: '테스트 아이',
          },
        }),
      )
    })

    const trackingState = await page.evaluate(() => {
      const win = window as typeof window & {
        dataLayer?: unknown[]
        fbq?: { queue?: unknown[] }
      }
      return JSON.stringify({ dataLayer: win.dataLayer, fbq: win.fbq?.queue })
    })
    expect(trackingState).toContain('lead_form_start')
    expect(trackingState).not.toContain('테스트 보호자')
    expect(trackingState).not.toContain('010-1234-5678')
    expect(trackingState).not.toContain('테스트 아이')
  })
})

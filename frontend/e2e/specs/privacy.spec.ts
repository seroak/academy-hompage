import { expect, test } from '@playwright/test'

test.describe('개인정보처리방침', () => {
  test('푸터에서 공개 처리방침으로 이동하고 광고 상담 처리 기준을 확인한다', async ({ page }) => {
    await page.goto('/')

    const privacyLink = page.locator('footer').getByRole('link', { name: '개인정보처리방침' })
    await expect(privacyLink).toHaveAttribute('href', '/privacy')
    await privacyLink.click()

    await expect(page).toHaveURL(/\/privacy$/)
    await expect(page.getByRole('heading', { level: 1, name: '개인정보처리방침' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Meta 광고 상담 정보' })).toBeVisible()
    await expect(page.getByText('보호자 이름, 휴대전화, 자녀 만 나이, 연락 가능 시간')).toBeVisible()
    await expect(page.getByText('상담 종료 후 3개월')).toBeVisible()
    await expect(page.getByRole('link', { name: '010-2976-0166' })).toHaveAttribute('href', 'tel:01029760166')
    await expect(page.getByText('시행일: 2026년 7월 15일')).toBeVisible()
    await expect(page.getByText(/익명 세션 ID.*광고 유입 정보.*홈페이지 행동/)).toBeVisible()
  })

  test('개인정보 처리의 주요 항목과 권리 행사 방법을 공개한다', async ({ page }) => {
    await page.goto('/privacy')

    for (const heading of [
      '개인정보의 처리 목적',
      '처리하는 개인정보와 보유기간',
      '개인정보의 제3자 제공 및 국외 이전',
      '개인정보의 파기',
      '정보주체의 권리와 행사 방법',
      '개인정보 보호 문의',
    ]) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }
  })
})

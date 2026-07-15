import { expect, test } from '@playwright/test'

test.describe('공개 수업 일정', () => {
  test('최신 게시 분기와 월별 범례 및 휴일을 표시한다', async ({ page }) => {
    await page.goto('/schedule')

    await expect(page.getByRole('heading', { name: '2026년 3분기 수업 일정' })).toBeVisible()
    await expect(page.getByText('7월분')).toBeVisible()
    await expect(page.getByText('8월분')).toBeVisible()
    await expect(page.getByText('9월분')).toBeVisible()
    await expect(page.getByText('대체공휴일')).toBeVisible()
    await expect(page.getByTestId('month-calendar')).toHaveCount(3)
  })

  test('선택기로 지난 분기를 조회한다', async ({ page }) => {
    await page.goto('/schedule')
    await page.getByLabel('일정 선택').selectOption('2026-2')

    await expect(page.getByRole('heading', { name: '2026년 2분기 수업 일정' })).toBeVisible()
    await expect(page.getByText('4월분')).toBeVisible()
  })

  test('3개 달력의 선행·후행 주에 전월과 다음월 색상을 표시한다', async ({ page }) => {
    await page.goto('/schedule')
    await page.getByLabel('일정 선택').selectOption('2026-2')

    await expect(page.getByTestId('month-calendar')).toHaveCount(3)
    const aprilCalendar = page.getByRole('table', { name: '2026년 4월' })
    const juneCalendar = page.getByRole('table', { name: '2026년 6월' })
    const marchCell = aprilCalendar.getByRole('cell', { name: /^2026-03-29/ })
    const julyCell = juneCalendar.getByRole('cell', { name: /^2026-07-04/ })
    await expect(marchCell).toContainText('3/29')
    await expect(julyCell).toContainText('7/4')
    await expect(marchCell.locator('div')).toHaveClass(/bg-\[#f0e5ff\]/)
    await expect(julyCell.locator('div')).toHaveClass(/bg-\[#ffd5c2\]/)
    await expect(aprilCalendar.getByRole('cell', { name: /^2026-03-28/ })).toHaveCount(0)
    await expect(juneCalendar.getByRole('cell', { name: /^2026-07-05/ })).toHaveCount(0)
  })

  test('모바일에서 월별 달력을 세로 순서로 배치한다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/schedule')
    const calendars = page.getByTestId('month-calendar')
    const boxes = await Promise.all([0, 1, 2].map((index) => calendars.nth(index).boundingBox()))
    expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y)
    expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y)
  })
})

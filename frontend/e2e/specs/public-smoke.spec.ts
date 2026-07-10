import { test, expect } from '@playwright/test'
import { PublicPages } from '../pages/PublicPages'
import noticesFixture from '../fixtures/notices.json' with { type: 'json' }

test.describe('공개 페이지 스모크', () => {
  test('홈 진입', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await expect(page).toHaveTitle(/아이꿈 학원|academy/i)
  })

  test('공지 목록/상세에 목 데이터가 렌더된다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoNotices()

    const pinned = noticesFixture.find((notice) => notice.pinned)!
    await expect(page.getByRole('link', { name: new RegExp(pinned.title) })).toBeVisible()

    await pages.gotoNoticeDetail(pinned.id)
    await expect(page.getByRole('heading', { name: pinned.title, level: 1 })).toBeVisible()
    await expect(page.getByText(pinned.content)).toBeVisible()
  })
})

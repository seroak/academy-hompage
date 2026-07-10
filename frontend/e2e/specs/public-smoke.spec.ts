import { test, expect } from '@playwright/test'
import { PublicPages } from '../pages/PublicPages'
import noticesFixture from '../fixtures/notices.json' with { type: 'json' }

test.describe('공개 페이지 스모크', () => {
  test('홈 진입', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await expect(page).toHaveTitle(/아이꿈 학원|academy/i)
  })

  test('교육과정 설명 페이지에 프로그램이 렌더된다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await expect(page.getByRole('link', { name: '교육과정' }).first()).toHaveAttribute('href', '/courses')

    await pages.gotoCourses()

    await expect(page).toHaveTitle(/수학교육 과정/)
    await expect(page.getByRole('heading', { name: '플레이팩토' })).toBeVisible()
    await expect(page.getByText('놀이로 수학을 좋아하게 만드는 프로그램')).toBeVisible()
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

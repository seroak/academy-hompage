import { test, expect } from '@playwright/test'
import { PublicPages } from '../pages/PublicPages'
import noticesFixture from '../fixtures/notices.json' with { type: 'json' }

test.describe('공개 페이지 스모크', () => {
  test('홈 진입', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await expect(page).toHaveTitle(/아이꿈 학원|academy/i)
  })

  test('홈에서 수업 신청 절차를 순서대로 안내한다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()

    await expect(page.getByRole('heading', { name: '수업 신청, 이렇게 진행돼요' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '아이 정보 입력' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '희망 시간 선택' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '편성 결과 안내' })).toBeVisible()
  })

  test('홈의 수업 신청 버튼이 신청 페이지로 연결된다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()

    await expect(page.getByRole('link', { name: '수업 신청하기' })).toHaveAttribute('href', '/apply')
  })

  test('모바일에서 수업 신청 절차와 신청 버튼을 읽을 수 있다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const pages = new PublicPages(page)
    await pages.gotoHome()

    const firstStep = page.getByRole('heading', { name: '아이 정보 입력' })
    const secondStep = page.getByRole('heading', { name: '희망 시간 선택' })
    const thirdStep = page.getByRole('heading', { name: '편성 결과 안내' })

    await expect(firstStep).toBeVisible()
    await expect(secondStep).toBeVisible()
    await expect(thirdStep).toBeVisible()
    await expect(page.getByRole('link', { name: '수업 신청하기' })).toBeVisible()

    const [firstBox, secondBox, thirdBox] = await Promise.all([
      firstStep.boundingBox(),
      secondStep.boundingBox(),
      thirdStep.boundingBox(),
    ])

    expect(firstBox!.y).toBeLessThan(secondBox!.y)
    expect(secondBox!.y).toBeLessThan(thirdBox!.y)
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

import { test, expect } from '@playwright/test'
import { PublicPages } from '../pages/PublicPages'
import { MOCK_API_BASE_URL } from '../../playwright.config'
import coursesFixture from '../fixtures/courses.json' with { type: 'json' }
import noticesFixture from '../fixtures/notices.json' with { type: 'json' }
import instructorsFixture from '../fixtures/instructors.json' with { type: 'json' }

async function setMockScenario(name: 'default' | 'courses-500' | 'courses-empty') {
  await fetch(`${MOCK_API_BASE_URL}/__scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
}

// Next의 fetch 데이터 캐시(revalidate: 300)는 dev 서버 프로세스 안에서 URL 기준으로 공유된다.
// /courses를 정상 데이터로 한 번이라도 먼저 요청하면 이후 폴백 시나리오 테스트가 캐시된
// 응답을 그대로 받아버릴 수 있으므로, 폴백 테스트를 이 파일의 가장 먼저 실행되는 테스트로 둔다.
// (목 서버의 시나리오는 1회성이 아니라 명시적으로 리셋할 때까지 유지되므로, SSR이 같은
// fetch를 두 번 호출하더라도 두 번째 요청이 기본값으로 새버리지 않는다 — mock-server.ts 참고)
test.describe('공개 페이지 스모크 - 폴백(반드시 최상단에서 실행)', () => {
  test.afterEach(async () => {
    await setMockScenario('default')
  })

  test('강좌 API가 실패하면 빈 상태 문구로 폴백한다', async ({ page }) => {
    await setMockScenario('courses-500')
    const pages = new PublicPages(page)
    await pages.gotoCourseList()

    await expect(page.getByText('등록된 강좌가 없습니다.')).toBeVisible()
  })
})

test.describe('공개 페이지 스모크', () => {
  test('홈 진입', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await expect(page).toHaveTitle(/아이꿈 학원|academy/i)
  })

  test('강좌 목록에 목 데이터가 렌더된다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoCourseList()

    for (const course of coursesFixture) {
      await expect(page.getByRole('heading', { name: course.title, level: 2 })).toBeVisible()
    }
  })

  test('강좌 상세로 이동하면 목 데이터가 렌더된다', async ({ page }) => {
    const pages = new PublicPages(page)
    const course = coursesFixture[0]
    await pages.gotoCourseDetail(course.id)

    await expect(page.getByRole('heading', { name: course.title, level: 1 })).toBeVisible()
    await expect(page.getByText(course.schedule)).toBeVisible()
  })

  test('존재하지 않는 강좌는 404 처리된다', async ({ page }) => {
    const pages = new PublicPages(page)
    const response = await pages.gotoCourseDetail('does-not-exist')
    expect(response?.status()).toBe(404)
  })

  test('강사진 목록에 목 데이터가 렌더된다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoInstructors()

    for (const instructor of instructorsFixture) {
      await expect(page.getByRole('heading', { name: instructor.name, level: 2 })).toBeVisible()
    }
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

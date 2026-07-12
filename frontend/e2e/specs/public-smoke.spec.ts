import { test, expect } from '@playwright/test'
import { PublicPages } from '../pages/PublicPages'
import noticesFixture from '../fixtures/notices.json' with { type: 'json' }

test.describe('공개 페이지 스모크', () => {
  test('홈 진입', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await expect(page).toHaveTitle(/생각을 여는 수학|academy/i)
  })

  test('로그인 모달을 열면 포커스가 모달 안에서 시작한다', async ({ page }) => {
    await page.goto('/?login=1')

    const dialog = page.getByRole('dialog', { name: '로그인' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator(':focus')).toHaveCount(1)
  })

  test('로그인 모달의 소셜 로그인 버튼마다 브랜드 마크를 표시한다', async ({ page }) => {
    await page.goto('/?login=1')

    await expect(page.getByTestId('oauth-provider-icon-google')).toBeVisible()
    await expect(page.getByTestId('oauth-provider-icon-kakao')).toBeVisible()
    await expect(page.getByTestId('oauth-provider-icon-naver')).toBeVisible()
  })

  test('홈에서 수업 신청 절차를 순서대로 안내한다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()

    await expect(page.getByRole('heading', { name: '수업 신청, 이렇게 진행돼요' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '자녀 선택' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '희망 시간 선택' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '편성 결과 안내' })).toBeVisible()
  })

  test('홈의 수업 신청 버튼이 신청 페이지로 연결된다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()

    await expect(page.getByRole('link', { name: '수업 신청하기' })).toHaveAttribute('href', '/apply')
  })

  test('홈에서 신청 방법을 보여주는 세 개의 실시간 미리보기를 제공한다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()

    for (const step of ['child-select', 'time-select', 'application-complete']) {
      const animation = page.getByTestId(`application-guide-animation-${step}`)
      await expect(animation).toBeVisible()
    }
  })

  test('동작 최소화 환경에서도 정적으로 안내를 보여준다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const pages = new PublicPages(page)
    await pages.gotoHome()

    for (const step of ['child-select', 'time-select', 'application-complete']) {
      const animation = page.getByTestId(`application-guide-animation-${step}`)
      await expect(animation).toBeVisible()
    }
  })

  test('모바일에서 수업 신청 절차와 신청 버튼을 읽을 수 있다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const pages = new PublicPages(page)
    await pages.gotoHome()

    const firstStep = page.getByRole('heading', { name: '자녀 선택' })
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

  test('네이버 검색로봇용 사이트맵과 RSS를 제공한다', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    await expect(sitemap).toBeOK()
    const sitemapXml = await sitemap.text()

    for (const path of [
      '/courses/young-children-math',
      '/courses/thinking-math',
      '/courses/elementary-lower-grades',
    ]) {
      expect(sitemapXml).toContain(`http://localhost:3410${path}`)
    }

    const rss = await request.get('/rss.xml')
    await expect(rss).toBeOK()
    expect(rss.headers()['content-type']).toContain('application/rss+xml')

    const rssXml = await rss.text()
    expect(rssXml).toContain('<rss version="2.0">')
    expect(rssXml).toContain('http://localhost:3410/notices/notice-1')
    expect(rssXml).toContain(
      '2026년 상반기 신규 수강생 모집을 시작합니다. 많은 관심 부탁드립니다.',
    )
  })
})

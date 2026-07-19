import { test, expect } from '@playwright/test'
import { PublicPages } from '../pages/PublicPages'
import noticesFixture from '../fixtures/notices.json' with { type: 'json' }

test.describe('공개 페이지 스모크', () => {
  test('홈 진입', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await expect(page).toHaveTitle(/생각을 여는 수학|academy/i)
  })

  test('헤더의 교육과정 링크로 교육과정 페이지를 연다', async ({ page }) => {
    await page.goto('/')

    const courseLink = page.locator('header').getByRole('link', { name: '교육과정' })

    await expect(courseLink).toHaveAttribute('href', '/courses')
    await courseLink.click()
    await expect(page).toHaveURL('/courses')
    await expect(page.getByRole('heading', { level: 1, name: /생각을 여는 수학만의 교육/ })).toBeVisible()
  })

  test('홈 핵심 콘텐츠는 클라이언트 애니메이션 없이 즉시 렌더된다', async ({ page }) => {
    await page.goto('/')

    const heading = page.getByRole('heading', {
      name: '아이의 오늘이 미래의 꿈이 됩니다',
      level: 1,
    })
    await expect(heading).not.toHaveAttribute('style')
    await expect(page.getByRole('link', { name: '상담 신청하기' })).toHaveAttribute('href', '/apply')
  })

  test('홈의 상단 이미지는 우선 요청하고 모바일에서는 숨긴다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const heroImage = page.locator(
      'img[alt="용인 흥덕 유치부·초등 저학년 수학학원에서 책상 앞에 웃고 있는 어린이들"]',
    )
    await expect(heroImage).toHaveAttribute('width', '1536')
    await expect(heroImage).toHaveAttribute('height', '1024')
    await expect(heroImage).toHaveAttribute(
      'sizes',
      '(min-width: 1024px) 520px, (min-width: 640px) 420px, 180px',
    )
    await expect(heroImage).not.toHaveAttribute('loading')
    await expect(heroImage).toHaveAttribute('decoding', 'sync')
    await expect(heroImage).toBeHidden()
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

  test('한글 조합(IME) 중 Shift+Tab을 눌러도 포커스 트랩이 개입하지 않는다', async ({ page }) => {
    await page.goto('/?login=1')
    await page.getByRole('button', { name: '회원가입' }).click()

    const nameInput = page.getByLabel('이름')
    await nameInput.click()
    await expect(nameInput).toBeFocused()

    await page.evaluate(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      )
    })

    await expect(nameInput).toBeFocused()
  })

  test('홈에서 수업 신청 절차를 순서대로 안내한다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await page.getByTestId('deferred-application-guide').scrollIntoViewIfNeeded()

    await expect(page.getByRole('heading', { name: '수업 신청, 이렇게 진행돼요' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '자녀 선택' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '희망 시간 선택' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '편성 결과 안내' })).toBeVisible()
  })

  test('홈의 수업 신청 버튼이 신청 페이지로 연결된다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await page.getByTestId('deferred-application-guide').scrollIntoViewIfNeeded()

    await expect(page.getByRole('link', { name: '수업 신청하기' })).toHaveAttribute('href', '/apply')
  })

  test('홈에서 신청 방법을 보여주는 세 개의 실시간 미리보기를 제공한다', async ({ page }) => {
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await page.getByTestId('deferred-application-guide').scrollIntoViewIfNeeded()

    for (const step of ['child-select', 'time-select', 'application-complete']) {
      const animation = page.getByTestId(`application-guide-animation-${step}`)
      await expect(animation).toBeVisible()
    }
  })

  test('동작 최소화 환경에서도 정적으로 안내를 보여준다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await page.getByTestId('deferred-application-guide').scrollIntoViewIfNeeded()

    for (const step of ['child-select', 'time-select', 'application-complete']) {
      const animation = page.getByTestId(`application-guide-animation-${step}`)
      await expect(animation).toBeVisible()
    }
  })

  test('모바일에서 수업 신청 절차와 신청 버튼을 읽을 수 있다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const pages = new PublicPages(page)
    await pages.gotoHome()
    await page.getByTestId('deferred-application-guide').scrollIntoViewIfNeeded()

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

  test('교육과정 상단 이미지는 우선 요청하고 모바일에서는 숨긴다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/courses')

    const heroImage = page.locator('img[alt="교구로 수학 활동을 하는 어린이들"]')
    await expect(heroImage).toHaveAttribute('width', '1672')
    await expect(heroImage).toHaveAttribute('height', '941')
    await expect(heroImage).toHaveAttribute(
      'sizes',
      '(min-width: 1024px) 560px, (min-width: 640px) 420px, 220px',
    )
    await expect(heroImage).not.toHaveAttribute('loading')
    await expect(heroImage).toHaveAttribute('decoding', 'sync')
    await expect(heroImage).toBeHidden()

    for (const alt of [
      '플레이팩토 수업 활동',
      '요리수 연산 수업 활동',
      '씨투엠(C2M) 수업 활동',
    ]) {
      await expect(page.locator(`img[alt="${alt}"]`)).toBeHidden()
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

  test('네이버 검색로봇용 소유 확인, robots, 사이트맵과 RSS를 제공한다', async ({ request, page }) => {
    await page.goto('/')
    await expect(page.locator('meta[name="naver-site-verification"]')).toHaveAttribute(
      'content',
      'naver-e2e-verification',
    )
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
      'href',
      'http://localhost:3410/rss.xml',
    )

    const robots = await request.get('/robots.txt')
    await expect(robots).toBeOK()
    expect(robots.headers()['content-type']).toContain('text/plain')
    const robotsText = await robots.text()
    expect(robotsText).toContain('User-Agent: *')
    expect(robotsText).toContain('Allow: /')
    expect(robotsText).toContain('Disallow: /admin')
    expect(robotsText).toContain('Sitemap: http://localhost:3410/sitemap.xml')

    const sitemap = await request.get('/sitemap.xml')
    await expect(sitemap).toBeOK()
    const sitemapXml = await sitemap.text()

    for (const path of [
      '/',
      '/courses',
      '/courses/young-children-math',
      '/courses/thinking-math',
      '/courses/elementary-lower-grades',
    ]) {
      expect(sitemapXml).toContain(`http://localhost:3410${path}`)

      const escapedUrl = `http://localhost:3410${path}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const urlEntry = sitemapXml.match(new RegExp(`<url>\\s*<loc>${escapedUrl}</loc>([\\s\\S]*?)</url>`))
      expect(urlEntry?.[1] ?? '').not.toContain('<lastmod>')
    }

    const noticeEntry = sitemapXml.match(
      /<url>\s*<loc>http:\/\/localhost:3410\/notices\/notice-1<\/loc>([\s\S]*?)<\/url>/,
    )
    expect(noticeEntry?.[1] ?? '').toContain('<lastmod>')

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

  test('검색 의도별 지역 수학 페이지가 고유 SEO 정보를 제공한다', async ({ page }) => {
    const seoPages = [
      {
        path: '/courses/young-children-math',
        title: /흥덕 유아 수학/,
        heading: '흥덕 유아 수학, 놀이에서 시작하는 첫 수학',
      },
      {
        path: '/courses/thinking-math',
        title: /흥덕 사고력 수학/,
        heading: '흥덕 사고력 수학, 생각하는 힘을 기르는 수업',
      },
      {
        path: '/courses/elementary-lower-grades',
        title: /초등 저학년 수학/,
        heading: '초등 저학년 수학, 개념과 사고력을 함께',
      },
    ]

    for (const seoPage of seoPages) {
      await page.goto(seoPage.path)

      await expect(page).toHaveTitle(seoPage.title)
      await expect(page.getByRole('heading', { name: seoPage.heading, level: 1 })).toBeVisible()
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `http://localhost:3410${seoPage.path}`,
      )
      await expect(page.getByRole('link', { name: '전체 교육과정 보기' })).toHaveAttribute(
        'href',
        '/courses',
      )
      await expect(page.getByRole('link', { name: '수업 상담 신청하기' })).toHaveAttribute(
        'href',
        '/apply',
      )

      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
      const structuredData = jsonLd.map((value) => JSON.parse(value) as Record<string, unknown>)
      expect(structuredData.some((value) => value['@type'] === 'Course')).toBe(true)
      expect(structuredData.some((value) => value['@type'] === 'BreadcrumbList')).toBe(true)
      expect(jsonLd.join(' ')).toContain('https://map.naver.com/p/entry/place/1536785087')

      const robotsMeta = page.locator('meta[name="robots"]')
      const robotsContent = (await robotsMeta.count()) > 0
        ? await robotsMeta.getAttribute('content')
        : null
      expect(robotsContent ?? '').not.toMatch(/noindex|nofollow/i)
    }
  })

  test('홈과 교육과정의 기존 카드에서 지역 교육 페이지를 표준 링크로 연결한다', async ({ page }) => {
    const homeLinks = [
      ['유치부 과정', '/courses/young-children-math'],
      ['초등 저학년 과정', '/courses/elementary-lower-grades'],
      ['창의 사고 과정', '/courses/thinking-math'],
    ] as const

    await page.goto('/')
    for (const [label, path] of homeLinks) {
      const link = page.getByRole('link', { name: `${label} 자세히 보기` })
      await expect(link).toHaveAttribute('href', path)
      await expect(link).toContainText(label)
    }

    const courseLinks = [
      ['플레이팩토', '/courses/thinking-math'],
      ['요리수 연산', '/courses/young-children-math'],
      ['씨투엠(C2M)', '/courses/elementary-lower-grades'],
    ] as const

    await page.goto('/courses')
    for (const [label, path] of courseLinks) {
      const link = page.getByRole('link', { name: `${label} 과정 자세히 보기` })
      await expect(link).toHaveAttribute('href', path)
      await expect(link).toContainText(label)
    }
  })

  test('초기 렌더링에서 경량 SVG 파비콘을 사용한다', async ({ page, request }) => {
    await page.goto('/')
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')

    const favicon = await request.get('/favicon.svg')
    await expect(favicon).toBeOK()
    expect(favicon.headers()['content-type']).toContain('image/svg+xml')
    expect((await favicon.body()).byteLength).toBeLessThanOrEqual(20 * 1024)
  })

  test('핵심 공개 페이지가 용량 제한을 지킨 고유 소셜 이미지를 제공한다', async ({ page, request }) => {
    const pages = [
      ['/', '/images/og/home.webp'],
      ['/courses', '/images/og/courses.webp'],
      ['/courses/young-children-math', '/images/og/young-children-math.webp'],
      ['/courses/thinking-math', '/images/og/thinking-math.webp'],
      ['/courses/elementary-lower-grades', '/images/og/elementary-lower-grades.webp'],
    ] as const

    for (const [path, imagePath] of pages) {
      await page.goto(path)
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        `http://localhost:3410${imagePath}`,
      )
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
        'content',
        `http://localhost:3410${imagePath}`,
      )

      const image = await request.get(imagePath)
      await expect(image).toBeOK()
      expect(image.headers()['content-type']).toContain('image/webp')
      expect((await image.body()).byteLength).toBeLessThanOrEqual(300 * 1024)
    }
  })
})

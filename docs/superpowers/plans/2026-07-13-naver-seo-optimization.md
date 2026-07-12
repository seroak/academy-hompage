# Naver SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 네이버 검색로봇이 학원의 공개 콘텐츠를 표준 링크, 사이트맵, RSS와 고유 메타 정보로 발견하고 이해할 수 있게 한다.

**Architecture:** Next.js App Router의 서버 렌더링과 Metadata API를 유지한다. 검색 의도별 데이터는 순수 데이터 모듈에 두고 공통 서버 컴포넌트가 렌더링하며, 사이트맵과 RSS는 같은 공개 URL 및 공지 API를 사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Playwright 1.61

## Global Constraints

- 공개 페이지 SEO는 App Router metadata와 서버 렌더링을 기준으로 관리한다.
- 페이지 `openGraph`는 `baseOpenGraph()`를 스프레드해 공통 속성을 유지한다.
- 검색 순위를 보장하거나 키워드를 기계적으로 반복하지 않는다.
- 공개 콘텐츠 링크는 `next/link`가 생성하는 표준 `<a href>`를 사용한다.
- `frontend/src/screens/ApplyPage.tsx`와 `frontend/e2e/specs/apply.spec.ts`의 기존 사용자 변경을 수정하거나 커밋하지 않는다.
- 프로덕션 코드는 반드시 실패하는 Playwright 테스트를 먼저 확인한 뒤 작성한다.

---

### Task 1: 네이버 검색 피드 계약

**Files:**
- Modify: `frontend/e2e/specs/public-smoke.spec.ts`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/sitemap.ts`
- Create: `frontend/src/app/rss.xml/route.ts`

**Interfaces:**
- Consumes: `fetchPublicNotices(): Promise<Notice[]>`, `siteUrl(path?: string): string`, `SITE_NAME`, `SITE_DESCRIPTION`
- Produces: `GET(): Promise<Response>` for `/rss.xml`

- [ ] **Step 1: Write the failing feed tests**

```ts
test('네이버 검색로봇용 사이트맵과 RSS를 제공한다', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml')
  await expect(sitemap).toBeOK()
  const sitemapXml = await sitemap.text()
  for (const path of ['/courses/young-children-math', '/courses/thinking-math', '/courses/elementary-lower-grades']) {
    expect(sitemapXml).toContain(`http://localhost:3410${path}`)
  }

  const rss = await request.get('/rss.xml')
  await expect(rss).toBeOK()
  expect(rss.headers()['content-type']).toContain('application/rss+xml')
  const rssXml = await rss.text()
  expect(rssXml).toContain('<rss version="2.0">')
  expect(rssXml).toContain('http://localhost:3410/notices/notice-1')
  expect(rssXml).toContain('2026년 상반기 신규 수강생 모집을 시작합니다. 많은 관심 부탁드립니다.')
})
```

- [ ] **Step 2: Run RED**

Run: `cd frontend && npx playwright test e2e/specs/public-smoke.spec.ts --grep "사이트맵과 RSS"`

Expected: FAIL because the sitemap lacks the three paths and `/rss.xml` returns 404.

- [ ] **Step 3: Implement the RSS route and sitemap entries**

`rss.xml/route.ts`는 XML 특수문자 `& < > " '`를 이스케이프하고, 공지를 `pubDate`, 절대 `link`, 절대 `guid`, 본문 전체 `description`을 가진 RSS item으로 변환한다. API 실패 시 빈 배열을 사용한다. 응답 헤더는 `Content-Type: application/rss+xml; charset=utf-8`와 5분 캐시 정책을 사용한다.

`sitemap.ts`의 정적 경로를 다음처럼 확장한다.

```ts
const staticPaths = [
  '/',
  '/notices',
  '/courses',
  '/courses/young-children-math',
  '/courses/thinking-math',
  '/courses/elementary-lower-grades',
]
```

`layout.tsx` metadata에는 RSS 자동 발견 링크를 추가한다.

```ts
alternates: {
  types: { 'application/rss+xml': siteUrl('/rss.xml') },
},
```

- [ ] **Step 4: Run GREEN**

Run: `cd frontend && npx playwright test e2e/specs/public-smoke.spec.ts --grep "사이트맵과 RSS"`

Expected: `1 passed`.

- [ ] **Step 5: Commit task files**

```bash
git add frontend/e2e/specs/public-smoke.spec.ts frontend/src/app/layout.tsx frontend/src/app/sitemap.ts frontend/src/app/rss.xml/route.ts
git commit -m "feat(frontend): 네이버 검색 피드 제공"
```

### Task 2: 검색 의도별 SEO 데이터와 구조화 데이터

**Files:**
- Create: `frontend/src/components/seo-landing/data.ts`
- Modify: `frontend/src/lib/seo.ts`
- Modify: `frontend/e2e/specs/public-smoke.spec.ts`

**Interfaces:**
- Produces: `SeoLandingContent`, `seoLandingPages`, `buildCourseLandingJsonLd(content)`, `buildBreadcrumbJsonLd(items)`
- Consumes: `siteUrl()`, `SITE_NAME`, 학원 주소·전화·네이버 플레이스 상수

- [ ] **Step 1: Write failing structured-data assertions**

세 URL을 순회해 고유 `<title>`, H1과 `application/ld+json` 스크립트에서 `Course`, `BreadcrumbList` 타입 및 네이버 플레이스 `sameAs`를 검증하는 테스트를 추가한다.

```ts
const seoPages = [
  ['/courses/young-children-math', '흥덕 유아 수학'],
  ['/courses/thinking-math', '흥덕 사고력 수학'],
  ['/courses/elementary-lower-grades', '초등 저학년 수학'],
] as const
```

- [ ] **Step 2: Run RED**

Run: `cd frontend && npx playwright test e2e/specs/public-smoke.spec.ts --grep "검색 의도별"`

Expected: FAIL with 404 or missing heading.

- [ ] **Step 3: Implement content and JSON-LD builders**

`SeoLandingContent`에는 `slug`, `title`, `metaTitle`, `description`, `keywords`, `eyebrow`, `intro`, `features`, `recommendedFor`, `programs`를 정의한다. 세 데이터 항목은 기존 플레이팩토·요리수·씨투엠 설명 안에서만 작성한다.

`buildCourseLandingJsonLd`는 `Course`에 provider `EducationalOrganization`, 지역, URL과 `sameAs`를 포함한다. `buildBreadcrumbJsonLd`는 절대 URL을 가진 `ListItem` 배열을 반환한다.

- [ ] **Step 4: Run TypeScript for the new interfaces**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 5: Commit task files**

```bash
git add frontend/src/components/seo-landing/data.ts frontend/src/lib/seo.ts frontend/e2e/specs/public-smoke.spec.ts
git commit -m "feat(frontend): 지역 SEO 콘텐츠 모델 추가"
```

### Task 3: 서버 렌더링 랜딩 페이지와 표준 내부 링크

**Files:**
- Create: `frontend/src/components/seo-landing/SeoLandingPage.tsx`
- Create: `frontend/src/app/courses/young-children-math/page.tsx`
- Create: `frontend/src/app/courses/thinking-math/page.tsx`
- Create: `frontend/src/app/courses/elementary-lower-grades/page.tsx`
- Create: `frontend/src/components/seo-landing/SeoLandingLinks.tsx`
- Modify: `frontend/src/screens/MathCurriculumPage.tsx`
- Modify: `frontend/src/components/CourseSection.tsx`
- Modify: `frontend/e2e/specs/public-smoke.spec.ts`

**Interfaces:**
- Consumes: `SeoLandingContent`, `seoLandingPages`, `baseOpenGraph()`, JSON-LD builders
- Produces: three indexable server-rendered pages and six standard internal links across home/courses

- [ ] **Step 1: Add failing page and internal-link tests**

각 URL의 고유 title/H1, `/courses`와 `/apply` CTA, 홈과 교육과정 페이지의 세 표준 href를 검증한다. 공개 페이지의 `meta[name=robots]`가 `noindex` 또는 `nofollow`를 포함하지 않는지도 검증한다.

- [ ] **Step 2: Run RED**

Run: `cd frontend && npx playwright test e2e/specs/public-smoke.spec.ts --grep "검색 의도별|지역 교육 링크"`

Expected: FAIL because routes and links do not exist.

- [ ] **Step 3: Implement the shared page**

공통 서버 컴포넌트는 의미 있는 `<main>`, 단일 H1, 특징 `<section>`, 추천 대상 목록, 프로그램 목록과 `Link` CTA를 렌더링한다. 기존 색상·둥근 카드·반응형 간격을 재사용하고 새 애니메이션은 추가하지 않는다.

- [ ] **Step 4: Implement route metadata and JSON-LD**

각 `page.tsx`는 정적 content를 선택하고 고유 metadata와 canonical/Open Graph를 내보낸다. `Course`와 `BreadcrumbList`는 별도 JSON-LD script로 출력한다.

- [ ] **Step 5: Add standard internal links**

`SeoLandingLinks`를 교육과정 페이지에 추가하고, 홈 `CourseSection` 카드에 검색 의도별 `Link`를 배치한다. 링크 문구는 대상과 내용을 설명하고 동일한 문구를 과도하게 반복하지 않는다.

- [ ] **Step 6: Run GREEN**

Run: `cd frontend && npx playwright test e2e/specs/public-smoke.spec.ts --grep "검색 의도별|지역 교육 링크"`

Expected: all selected tests pass.

- [ ] **Step 7: Commit task files**

```bash
git add frontend/src/app/courses frontend/src/components/seo-landing frontend/src/screens/MathCurriculumPage.tsx frontend/src/components/CourseSection.tsx frontend/e2e/specs/public-smoke.spec.ts
git commit -m "feat(frontend): 지역 검색 랜딩 페이지 추가"
```

### Task 4: 전체 검증과 운영 제출 준비

**Files:**
- Inspect: `frontend/src/app/robots.ts`
- Inspect: `frontend/src/app/layout.tsx`
- Inspect: `.env.example` and deployment environment documentation if present

**Interfaces:**
- Verifies: Yeti/public crawler access, metadata, sitemap, RSS, rendered links

- [ ] **Step 1: Run static verification**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 2: Run public SEO E2E**

Run: `cd frontend && npx playwright test e2e/specs/public-smoke.spec.ts`

Expected: all tests in the file pass with an exact count reported from output.

- [ ] **Step 3: Run the full frontend E2E suite**

Run: `cd frontend && npx playwright test`

Expected: all tests pass; any pre-existing failure is separated with exact test name and output.

- [ ] **Step 4: Verify generated responses**

E2E 서버에서 `/robots.txt`, `/sitemap.xml`, `/rss.xml`을 요청해 status, content-type and key absolute URLs를 기록한다. 홈 HTML에서 `naver-site-verification`은 환경변수가 있을 때만, RSS alternate는 항상 렌더링되는지 확인한다.

- [ ] **Step 5: Inspect worktree**

Run: `git status --short && git diff --check && git diff --stat`

Expected: no generated-file drift; user changes in `ApplyPage.tsx` and `apply.spec.ts` remain untouched.

- [ ] **Step 6: Run update-agents skill**

프로젝트 전반에 재사용 가능한 새 규칙이 있을 때만 `AGENTS.md`와 `CLAUDE.md`를 같은 의도로 갱신한다.

- [ ] **Step 7: Hand off external Naver steps**

운영 배포 후 네이버 서치어드바이저에서 호스트를 등록·소유 확인하고 `/sitemap.xml`, 공개 item이 존재하는 `/rss.xml`을 제출한다. URL 검사로 `/`, `/courses`와 세 랜딩 URL을 확인하고 robots.txt 수집 요청을 실행한다.

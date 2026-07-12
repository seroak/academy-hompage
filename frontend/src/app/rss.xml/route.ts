import { fetchPublicNotices } from '../../api/public.api'
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from '../../lib/seo'

// 빌드 시 백엔드가 일시적으로 닿지 않아도 빈 피드가 정적 산출물로 고정되지 않도록
// 첫 실제 요청에서 공지를 조회한다. 응답 캐시는 아래 Cache-Control로 제어한다.
export const dynamic = 'force-dynamic'

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export async function GET(): Promise<Response> {
  const notices = await fetchPublicNotices().catch(() => [])
  const items = notices
    .map((notice) => {
      const url = siteUrl(`/notices/${notice.id}`)
      return `    <item>
      <title>${escapeXml(notice.title)}</title>
      <link>${escapeXml(url)}</link>
      <description>${escapeXml(notice.content)}</description>
      <pubDate>${new Date(notice.createdAt).toUTCString()}</pubDate>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(siteUrl('/'))}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

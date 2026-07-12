import type { Metadata } from 'next'
import SeoLandingPage from '../../../components/seo-landing/SeoLandingPage'
import { getSeoLandingContent } from '../../../components/seo-landing/data'
import { baseOpenGraph, buildBreadcrumbJsonLd, buildCourseLandingJsonLd, rssAlternate, siteUrl } from '../../../lib/seo'

const content = getSeoLandingContent('thinking-math')

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.description,
  keywords: content.keywords,
  alternates: { canonical: siteUrl(`/courses/${content.slug}`), ...rssAlternate() },
  openGraph: { ...baseOpenGraph(), title: content.metaTitle, description: content.description, url: siteUrl(`/courses/${content.slug}`) },
}

export default function ThinkingMathPage() {
  const courseJsonLd = buildCourseLandingJsonLd(content)
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: '홈', path: '/' },
    { name: '교육과정', path: '/courses' },
    { name: '흥덕 사고력 수학', path: `/courses/${content.slug}` },
  ])
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} /><SeoLandingPage content={content} /></>
}

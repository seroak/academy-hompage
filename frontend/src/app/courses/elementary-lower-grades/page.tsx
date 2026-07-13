import type { Metadata } from 'next'
import SeoLandingPage from '../../../components/seo-landing/SeoLandingPage'
import { getSeoLandingContent } from '../../../components/seo-landing/data'
import { baseOpenGraph, buildBreadcrumbJsonLd, buildCourseLandingJsonLd, pageTwitter, rssAlternate, siteUrl } from '../../../lib/seo'

const content = getSeoLandingContent('elementary-lower-grades')

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.description,
  keywords: content.keywords,
  alternates: { canonical: siteUrl(`/courses/${content.slug}`), ...rssAlternate() },
  openGraph: { ...baseOpenGraph(content.ogImage), title: content.metaTitle, description: content.description, url: siteUrl(`/courses/${content.slug}`) },
  twitter: pageTwitter(content.metaTitle, content.description, content.ogImage),
}

export default function ElementaryLowerGradesPage() {
  const courseJsonLd = buildCourseLandingJsonLd(content)
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: '홈', path: '/' },
    { name: '교육과정', path: '/courses' },
    { name: '초등 저학년 수학', path: `/courses/${content.slug}` },
  ])
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} /><SeoLandingPage content={content} /></>
}

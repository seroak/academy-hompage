import type { Metadata } from 'next'
import Layout from '../components/Layout'
import HomePage from '../screens/HomePage'
import { SITE_DESCRIPTION, SITE_NAME, baseOpenGraph, buildOrganizationJsonLd, rssAlternate, siteUrl } from '../lib/seo'

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: { canonical: siteUrl('/'), ...rssAlternate() },
  openGraph: {
    ...baseOpenGraph(),
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl('/'),
  },
}

export default function Page() {
  const organizationJsonLd = buildOrganizationJsonLd()

  return (
    <Layout variant="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomePage />
    </Layout>
  )
}

import type { Metadata } from 'next'
import Layout from '../components/Layout'
import HomePage from '../screens/HomePage'
import { SITE_DESCRIPTION, SITE_NAME, baseOpenGraph, buildOrganizationJsonLd, pageTwitter, rssAlternate, siteUrl } from '../lib/seo'

const socialImage = '/images/og/home.webp'

export const metadata: Metadata = {
  title: `${SITE_NAME} | 용인 흥덕 유치부·초등 저학년 수학학원`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: siteUrl('/'), ...rssAlternate() },
  openGraph: {
    ...baseOpenGraph(socialImage),
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl('/'),
  },
  twitter: pageTwitter(SITE_NAME, SITE_DESCRIPTION, socialImage),
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

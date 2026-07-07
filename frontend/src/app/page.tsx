import type { Metadata } from 'next'
import Layout from '../components/Layout'
import HomePage from '../screens/HomePage'
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from '../lib/seo'

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: { canonical: siteUrl('/') },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl('/'),
  },
}

export default function Page() {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: siteUrl('/'),
    description: SITE_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressLocality: '경기도',
      streetAddress: '어딘가 123',
    },
    telephone: '02-000-0000',
  }

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomePage />
    </Layout>
  )
}

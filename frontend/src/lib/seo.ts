export const SITE_NAME = '생각을 여는 수학'
export const SITE_DESCRIPTION =
  '경기도 용인 흥덕의 유치부·초등 저학년 수학학원. 플레이팩토, 요리수 수학, 씨투엠(C2M)으로 놀이에서 사고력, 교과까지 이어지는 배움을 제공합니다.'

export const BUSINESS_REGION = '경기도'
export const BUSINESS_LOCALITY = '용인시 기흥구'
export const BUSINESS_ADDRESS = '경기도 용인시 기흥구 흥덕2로65번길 12-15'
export const BUSINESS_PHONE = '010-2976-0166'

export const NAVER_PLACE_URL: string | undefined = 'https://map.naver.com/p/entry/place/1536785087'

// 정규 수업 운영 시간 기준(상담 문의는 시간 제한 없이 별도 대응).
// dayOfWeek는 schema.org DayOfWeek 열거값(영문)을 그대로 사용해야 구조화 데이터로 유효하다.
export const BUSINESS_HOURS = [
  {
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '13:00',
    closes: '20:00',
  },
]

export const SITE_KEYWORDS = [
  '용인 수학학원',
  '흥덕 수학학원',
  '기흥 수학학원',
  '유치부 수학학원',
  '저학년 수학학원',
  '초등 수학학원',
  '유아 수학',
  '사고력 수학',
  '플레이팩토',
  '요리수 수학',
  '씨투엠',
  'C2M',
]

export function siteUrl(path = '/'): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
  return new URL(path, baseUrl).toString()
}

export function rssAlternate() {
  return {
    types: { 'application/rss+xml': siteUrl('/rss.xml') },
  }
}

// Next.js는 openGraph를 layout과 page 사이에서 딥머지하지 않고 통째로 덮어쓴다.
// 자체 openGraph를 정의하는 모든 페이지는 이 헬퍼로 공통 필드(type/locale/siteName/images)를
// 함께 스프레드해야 layout에서 설정한 값이 페이지에서 사라지지 않는다.
export function siteOgImage(path = '/images/og/home.webp'): string {
  return siteUrl(path)
}

export function baseOpenGraph(imagePath = '/images/og/home.webp') {
  return {
    type: 'website' as const,
    locale: 'ko_KR' as const,
    siteName: SITE_NAME,
    images: [{ url: siteOgImage(imagePath), width: 1200, height: 630 }],
  }
}

export function pageTwitter(title: string, description: string, imagePath: string) {
  return {
    card: 'summary_large_image' as const,
    title,
    description,
    images: [siteOgImage(imagePath)],
  }
}

export function truncateDescription(value: string, maxLength = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}…`
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    name: SITE_NAME,
    url: siteUrl('/'),
    description: SITE_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressRegion: BUSINESS_REGION,
      addressLocality: BUSINESS_LOCALITY,
      streetAddress: BUSINESS_ADDRESS,
    },
    telephone: BUSINESS_PHONE,
    areaServed: '경기도 용인시',
    knowsAbout: ['플레이팩토', '요리수 수학', '씨투엠(C2M)'],
    openingHoursSpecification: BUSINESS_HOURS.map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      ...hours,
    })),
    ...(NAVER_PLACE_URL ? { sameAs: [NAVER_PLACE_URL] } : {}),
  }
}

interface CourseProgramLike {
  name: string
  summary: string
  age: string
}

export function buildCoursesJsonLd(programs: CourseProgramLike[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: programs.map((program, index) => ({
      '@type': 'Course',
      position: index + 1,
      name: program.name,
      description: program.summary,
      provider: {
        '@type': 'EducationalOrganization',
        name: SITE_NAME,
        sameAs: siteUrl('/'),
      },
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: program.age,
      },
    })),
  }
}

interface CourseLandingLike {
  title: string
  description: string
  slug: string
  programs: string[]
}

export function buildCourseLandingJsonLd(content: CourseLandingLike) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: content.title,
    description: content.description,
    url: siteUrl(`/courses/${content.slug}`),
    provider: {
      '@type': 'EducationalOrganization',
      name: SITE_NAME,
      url: siteUrl('/'),
      telephone: BUSINESS_PHONE,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'KR',
        addressRegion: BUSINESS_REGION,
        addressLocality: BUSINESS_LOCALITY,
        streetAddress: BUSINESS_ADDRESS,
      },
      ...(NAVER_PLACE_URL ? { sameAs: [NAVER_PLACE_URL] } : {}),
    },
    about: content.programs,
  }
}

interface BreadcrumbItem {
  name: string
  path: string
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  }
}

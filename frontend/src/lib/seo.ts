export const SITE_NAME = '아이꿈 학원'
export const SITE_DESCRIPTION =
  '유치부부터 초등 저학년까지, 아이의 속도에 맞춘 따뜻한 배움을 제공합니다.'

export function siteUrl(path = '/'): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
  return new URL(path, baseUrl).toString()
}

export function truncateDescription(value: string, maxLength = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}…`
}

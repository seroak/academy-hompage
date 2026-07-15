export const ATTRIBUTION_STORAGE_KEY = 'openmath-attribution-v1'
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export type Attribution = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  fbclid?: string
  landingPath: string
  referrer: string
  capturedAt: string
  expiresAt: string
}

export function captureAttribution(location: Location, referrer: string): Attribution | null {
  const params = new URLSearchParams(location.search)
  const values = {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    utmTerm: params.get('utm_term') ?? undefined,
    fbclid: params.get('fbclid') ?? undefined,
  }
  const hasNonDirectSource = Object.values(values).some(Boolean)

  if (hasNonDirectSource) {
    const now = new Date()
    const attribution: Attribution = {
      ...values,
      landingPath: `${location.pathname}${location.search}`,
      referrer,
      capturedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ATTRIBUTION_TTL_MS).toISOString(),
    }
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution))
    return attribution
  }

  return readAttribution()
}

export function readAttribution(): Attribution | null {
  const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Attribution
    if (!parsed.expiresAt || new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY)
    return null
  }
}

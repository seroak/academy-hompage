'use client'

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

export const TRACKING_EVENTS = [
  'view_ad_landing',
  'course_view',
  'consultation_cta_click',
  'phone_click',
  'lead_form_start',
  'generate_lead',
] as const

export type TrackingEventName = (typeof TRACKING_EVENTS)[number]

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

function appendScript(src: string, marker: string) {
  if (document.querySelector(`script[data-openmath-tracker="${marker}"]`)) return
  const script = document.createElement('script')
  script.async = true
  script.src = src
  script.dataset.openmathTracker = marker
  document.head.appendChild(script)
}

type TrackingWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean }
}

export function loadAnalyticsTracking(measurementId: string | undefined) {
  if (!measurementId) return
  const trackingWindow = window as TrackingWindow
  trackingWindow.dataLayer ??= []
  trackingWindow.gtag ??= (...args: unknown[]) => trackingWindow.dataLayer?.push(args)
  trackingWindow.gtag('js', new Date())
  trackingWindow.gtag('config', measurementId)
  appendScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, 'ga4')
}

export function loadMarketingTracking(pixelId: string | undefined) {
  if (!pixelId) return
  const trackingWindow = window as TrackingWindow
  if (!trackingWindow.fbq) {
    const queue: unknown[][] = []
    const fbq = Object.assign((...args: unknown[]) => queue.push(args), { queue })
    trackingWindow.fbq = fbq
  }
  trackingWindow.fbq('init', pixelId)
  trackingWindow.fbq('track', 'PageView')
  appendScript('https://connect.facebook.net/en_US/fbevents.js', 'meta-pixel')
}

export function isTrackingEventName(value: unknown): value is TrackingEventName {
  return typeof value === 'string' && TRACKING_EVENTS.includes(value as TrackingEventName)
}

export function sendTrackingEvent(name: TrackingEventName) {
  const trackingWindow = window as TrackingWindow
  trackingWindow.gtag?.('event', name)
  const metaEvent = name === 'generate_lead' ? 'Lead' : name === 'phone_click' ? 'Contact' : 'ViewContent'
  trackingWindow.fbq?.('track', metaEvent)
}

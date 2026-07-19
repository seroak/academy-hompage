import { sendAnalyticsEvent } from './analytics'
import { sendMetaEvent } from './metaPixel'
import { sendFirstPartyEvent } from './firstParty'

export const TRACKING_EVENTS = [
  'view_ad_landing',
  'course_view',
  'consultation_cta_click',
  'phone_click',
  'lead_form_start',
  'lead_submit_attempt',
  'lead_submit_blocked',
  'lead_submit_error',
  'generate_lead',
] as const

export type TrackingEventName = (typeof TRACKING_EVENTS)[number]

const FIRST_PARTY_ONLY_EVENTS = new Set<TrackingEventName>([
  'lead_submit_attempt',
  'lead_submit_blocked',
  'lead_submit_error',
])

export function isTrackingEventName(value: unknown): value is TrackingEventName {
  return typeof value === 'string' && TRACKING_EVENTS.some((name) => name === value)
}

export function toMetaEventName(name: TrackingEventName): 'Lead' | 'Contact' | 'ViewContent' {
  if (name === 'generate_lead') return 'Lead'
  if (name === 'phone_click') return 'Contact'
  return 'ViewContent'
}

export function sendTrackingEvent(name: TrackingEventName) {
  if (FIRST_PARTY_ONLY_EVENTS.has(name)) {
    sendFirstPartyEvent(name)
    return
  }
  sendAnalyticsEvent(name)
  sendMetaEvent(toMetaEventName(name))
  sendFirstPartyEvent(name)
}

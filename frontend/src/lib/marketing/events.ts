import { sendAnalyticsEvent } from './analytics'
import { sendMetaEvent } from './metaPixel'
import { sendFirstPartyEvent } from './firstParty'

export const TRACKING_EVENTS = [
  'view_ad_landing',
  'course_view',
  'consultation_cta_click',
  'phone_click',
  'lead_form_start',
  'generate_lead',
] as const

export type TrackingEventName = (typeof TRACKING_EVENTS)[number]

export function isTrackingEventName(value: unknown): value is TrackingEventName {
  return typeof value === 'string' && TRACKING_EVENTS.includes(value as TrackingEventName)
}

export function toMetaEventName(name: TrackingEventName): 'Lead' | 'Contact' | 'ViewContent' {
  if (name === 'generate_lead') return 'Lead'
  if (name === 'phone_click') return 'Contact'
  return 'ViewContent'
}

export function sendTrackingEvent(name: TrackingEventName) {
  sendAnalyticsEvent(name)
  sendMetaEvent(toMetaEventName(name))
  sendFirstPartyEvent(name)
}

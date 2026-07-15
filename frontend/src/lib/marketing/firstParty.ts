import { apiFetch } from '../apiClient'
import { captureAttribution } from './attribution'
import { getMarketingSessionId } from './session'
import type { TrackingEventName } from './events'

export function sendFirstPartyEvent(name: TrackingEventName) {
  if (name === 'generate_lead') return
  const attribution = captureAttribution(window.location, document.referrer)
  void apiFetch('/marketing/events', {
    method: 'POST',
    keepalive: true,
    body: JSON.stringify({
      eventId: crypto.randomUUID(),
      sessionId: getMarketingSessionId(),
      name,
      utmSource: attribution?.utmSource,
      utmMedium: attribution?.utmMedium,
      utmCampaign: attribution?.utmCampaign,
      utmContent: attribution?.utmContent,
      utmTerm: attribution?.utmTerm,
      fbclid: attribution?.fbclid,
      landingPath: `${window.location.pathname}${window.location.search}`,
      occurredAt: new Date().toISOString(),
    }),
  }).catch(() => undefined)
}

'use client'

import { useEffect } from 'react'
import { loadAnalyticsTracking } from '../lib/marketing/analytics'
import { captureAttribution } from '../lib/marketing/attribution'
import { isTrackingEventName, sendTrackingEvent } from '../lib/marketing/events'
import { initializeMetaPixel, trackInitialMetaPageView } from '../lib/marketing/metaPixel'

export default function MarketingTracking() {
  useEffect(() => {
    captureAttribution(window.location, document.referrer)
    loadAnalyticsTracking(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
    initializeMetaPixel(process.env.NEXT_PUBLIC_META_PIXEL_ID)
    trackInitialMetaPageView()
  }, [])

  useEffect(() => {
    const handleTrackingEvent = (event: Event) => {
      if (!('detail' in event)) return
      const detail = (event as CustomEvent<{ name?: unknown }>).detail
      if (isTrackingEventName(detail?.name)) sendTrackingEvent(detail.name)
    }
    window.addEventListener('openmath:track', handleTrackingEvent)
    return () => window.removeEventListener('openmath:track', handleTrackingEvent)
  }, [])

  return null
}

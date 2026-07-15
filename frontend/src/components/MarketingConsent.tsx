'use client'

import { useEffect } from 'react'
import {
  captureAttribution,
  isTrackingEventName,
  loadAnalyticsTracking,
  loadMarketingTracking,
  sendTrackingEvent,
} from '../lib/marketing'

export default function MarketingTracking() {
  useEffect(() => {
    captureAttribution(window.location, document.referrer)
    loadAnalyticsTracking(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
    loadMarketingTracking(process.env.NEXT_PUBLIC_META_PIXEL_ID)
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

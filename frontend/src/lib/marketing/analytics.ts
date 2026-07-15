import { appendTrackingScript, getTrackingWindow } from './trackingWindow'

export function loadAnalyticsTracking(measurementId: string | undefined) {
  if (!measurementId) return
  const trackingWindow = getTrackingWindow()
  trackingWindow.dataLayer ??= []
  trackingWindow.gtag ??= (...args: unknown[]) => trackingWindow.dataLayer?.push(args)
  trackingWindow.gtag('js', new Date())
  trackingWindow.gtag('config', measurementId)
  appendTrackingScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, 'ga4')
}

export function sendAnalyticsEvent(name: string) {
  getTrackingWindow().gtag?.('event', name)
}

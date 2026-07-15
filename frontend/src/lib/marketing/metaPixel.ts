import { appendTrackingScript, getTrackingWindow } from './trackingWindow'

export function initializeMetaPixel(pixelId: string | undefined) {
  if (!pixelId) return
  const trackingWindow = getTrackingWindow()
  trackingWindow.openmathInitializedMetaPixelIds ??= new Set<string>()
  if (trackingWindow.openmathInitializedMetaPixelIds.has(pixelId)) return

  if (!trackingWindow.fbq) {
    const queue: unknown[][] = []
    const fbq = Object.assign((...args: unknown[]) => queue.push(args), { queue })
    trackingWindow.fbq = fbq
  }
  trackingWindow.openmathInitializedMetaPixelIds.add(pixelId)
  trackingWindow.fbq('init', pixelId)
  appendTrackingScript('https://connect.facebook.net/en_US/fbevents.js', 'meta-pixel')
}

export function trackInitialMetaPageView() {
  const trackingWindow = getTrackingWindow()
  if (!trackingWindow.fbq || trackingWindow.openmathInitialMetaPageViewTracked) return

  trackingWindow.openmathInitialMetaPageViewTracked = true
  trackingWindow.fbq('track', 'PageView')
}

export function sendMetaEvent(name: string) {
  getTrackingWindow().fbq?.('track', name)
}

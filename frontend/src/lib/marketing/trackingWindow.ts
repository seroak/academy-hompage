export type TrackingWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean }
  openmathInitializedMetaPixelIds?: Set<string>
  openmathInitialMetaPageViewTracked?: boolean
}

export function getTrackingWindow(): TrackingWindow {
  return window as TrackingWindow
}

export function appendTrackingScript(src: string, marker: string) {
  if (document.querySelector(`script[data-openmath-tracker="${marker}"]`)) return
  const script = document.createElement('script')
  script.async = true
  script.src = src
  script.dataset.openmathTracker = marker
  document.head.appendChild(script)
}

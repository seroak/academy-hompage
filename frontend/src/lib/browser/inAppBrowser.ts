const IN_APP_BROWSER_PATTERN = /Instagram|FBAN|FBAV|FB_IAB|Messenger/i

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return IN_APP_BROWSER_PATTERN.test(navigator.userAgent)
}

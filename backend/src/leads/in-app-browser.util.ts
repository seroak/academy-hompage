const IN_APP_BROWSER_PATTERN = /Instagram|FBAN|FBAV|FB_IAB|Messenger/i;

export function isInAppBrowserUserAgent(userAgent?: string): boolean {
  if (!userAgent) return false;
  return IN_APP_BROWSER_PATTERN.test(userAgent);
}

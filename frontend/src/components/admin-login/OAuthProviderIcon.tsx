import type { OAuthProvider } from '../../api/schemas/auth.schema'

export function OAuthProviderIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === 'google') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        data-testid="oauth-provider-icon-google"
        className="size-5"
      >
        <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z" />
        <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.2 13.7a6 6 0 0 1 0-3.8V7.3H2.9a10 10 0 0 0 0 9l3.3-2.6Z" />
        <path fill="#EA4335" d="M12 6c1.6 0 3 .5 4.1 1.6l3-3A10 10 0 0 0 2.9 7.3l3.3 2.6C7 7.8 9.3 6 12 6Z" />
      </svg>
    )
  }

  if (provider === 'kakao') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        data-testid="oauth-provider-icon-kakao"
        className="size-5"
      >
        <path fill="currentColor" d="M12 3.5c-4.7 0-8.5 3-8.5 6.6 0 2.3 1.5 4.4 3.8 5.6L6.5 20l4.2-2.7c.4 0 .8.1 1.3.1 4.7 0 8.5-3 8.5-6.6s-3.8-6.6-8.5-6.6Z" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-testid="oauth-provider-icon-naver"
      className="size-5"
    >
      <path fill="currentColor" d="M5 4h4.3l5.4 8.1V4H19v16h-4.3L9.3 11.9V20H5V4Z" />
    </svg>
  )
}

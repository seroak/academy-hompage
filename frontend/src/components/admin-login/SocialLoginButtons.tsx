'use client'

import { socialLoginStartUrl } from '../../api/auth.api'
import { socialProviders } from './socialProviders'
import { OAuthProviderIcon } from './OAuthProviderIcon'

interface SocialLoginButtonsProps {
  redirectTo?: string | null
  pathname: string | null
}

export function SocialLoginButtons({ redirectTo, pathname }: SocialLoginButtonsProps) {
  return (
    <div className="grid gap-3">
      {socialProviders.map((item) => (
        <button
          key={item.provider}
          type="button"
          onClick={() => {
            window.location.href = socialLoginStartUrl(item.provider, redirectTo ?? pathname ?? '/')
          }}
          className={`relative flex h-12 items-center justify-center rounded-full border px-5 text-sm font-black transition ${item.className}`}
        >
          <span className="absolute left-5 flex size-5 items-center justify-center">
            <OAuthProviderIcon provider={item.provider} />
          </span>
          {item.label}
        </button>
      ))}
    </div>
  )
}

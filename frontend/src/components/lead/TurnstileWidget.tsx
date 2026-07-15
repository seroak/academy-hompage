'use client'

import { useEffect, useId, useRef } from 'react'

type TurnstileApi = {
  render: (target: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }) => string
  reset: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export default function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const rawId = useId()
  const elementId = `turnstile-${rawId.replaceAll(':', '')}`
  const widgetId = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return

    const render = () => {
      if (!window.turnstile || widgetId.current) return
      widgetId.current = window.turnstile.render(`#${elementId}`, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      })
    }

    if (window.turnstile) {
      render()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-openmath-turnstile]')
    if (existing) {
      existing.addEventListener('load', render, { once: true })
      return () => existing.removeEventListener('load', render)
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.openmathTurnstile = 'true'
    script.addEventListener('load', render, { once: true })
    document.head.appendChild(script)
    return () => script.removeEventListener('load', render)
  }, [elementId, onToken, siteKey])

  if (!siteKey) return <p role="alert" className="text-sm font-bold text-[#a43b2b]">상담 보안 설정이 준비되지 않았습니다.</p>
  return <div id={elementId} aria-label="자동 입력 방지 확인" className="min-h-[65px]" />
}

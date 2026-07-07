'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { exchangeSocialLogin } from '../api/auth.api'
import { useParentAuthStore } from '../stores/parentAuthStore'

export default function SocialCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const setSession = useParentAuthStore((state) => state.setSession)
  const [error, setError] = useState<string | null>(null)
  const exchangedRef = useRef(false)

  useEffect(() => {
    const code = searchParams?.get('code')

    if (!code) {
      setError('로그인 정보를 확인할 수 없습니다.')
      return
    }

    if (exchangedRef.current) return
    exchangedRef.current = true
    const sessionCode = code

    async function exchange() {
      try {
        const result = await exchangeSocialLogin(sessionCode)
        setSession(result.accessToken, result.parent)
        router.replace('/apply')
      } catch {
        setError('소셜 로그인 처리에 실패했습니다. 다시 시도해 주세요.')
      }
    }

    void exchange()
  }, [router, searchParams, setSession])

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-xl font-bold text-slate-900">
        {error ? '로그인 실패' : '로그인 확인 중'}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        {error ?? '소셜 계정 정보를 확인하고 신청서로 이동합니다.'}
      </p>
      {error && (
        <button
          type="button"
          onClick={() => router.replace('/apply')}
          className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          신청 페이지로 돌아가기
        </button>
      )}
    </div>
  )
}

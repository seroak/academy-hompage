'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyParentEmail } from '../api/auth.api'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const verifiedRef = useRef(false)

  useEffect(() => {
    const token = searchParams?.get('token')

    if (!token) {
      setError('인증 링크 정보를 확인할 수 없습니다.')
      return
    }

    if (verifiedRef.current) return
    verifiedRef.current = true

    async function verify() {
      try {
        await verifyParentEmail(token as string)
        router.refresh()
        router.replace('/apply')
      } catch (err) {
        console.error('[verify-email] verification failed', err)
        setError('인증 링크가 만료되었거나 유효하지 않습니다. 다시 회원가입해 주세요.')
      }
    }

    void verify()
  }, [router, searchParams])

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-xl font-bold text-slate-900">
        {error ? '이메일 인증 실패' : '이메일 인증 확인 중'}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        {error ?? '인증 링크를 확인하고 가입을 완료합니다.'}
      </p>
      {error && (
        <button
          type="button"
          onClick={() => router.replace('/')}
          className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          홈으로 돌아가기
        </button>
      )}
    </div>
  )
}

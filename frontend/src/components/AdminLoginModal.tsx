'use client'

import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, LockKeyhole, X } from 'lucide-react'
import { loginParentWithPassword, signupParent, socialLoginStartUrl } from '../api/auth.api'
import type { OAuthProvider } from '../api/schemas/auth.schema'
import { useLoginMutation } from '../screens/admin/hooks/useLoginMutation'
import { ApiError } from '../lib/apiClient'

interface AdminLoginModalProps {
  isOpen: boolean
  redirectTo?: string | null
  onClose: () => void
  onSuccess: () => void
  onParentSuccess: () => void
}

const socialProviders: Array<{ provider: OAuthProvider; label: string; className: string }> = [
  {
    provider: 'google',
    label: 'Google로 계속하기',
    className: 'border-[#ead7ad] bg-white text-[#2b2418] hover:border-[#ffd66b]',
  },
  {
    provider: 'kakao',
    label: '카카오로 계속하기',
    className: 'border-[#f6df36] bg-[#f6df36] text-[#2b2418] hover:bg-[#f1d900]',
  },
  {
    provider: 'naver',
    label: '네이버로 계속하기',
    className: 'border-[#03c75a] bg-[#03c75a] text-white hover:bg-[#02b351]',
  },
]

type ParentAuthMode = 'login' | 'signup'

export default function AdminLoginModal({
  isOpen,
  redirectTo,
  onClose,
  onSuccess,
  onParentSuccess,
}: AdminLoginModalProps) {
  const [parentAuthMode, setParentAuthMode] = useState<ParentAuthMode>('login')
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPassword, setParentPassword] = useState('')
  const [parentAuthError, setParentAuthError] = useState<string | null>(null)
  const [isParentSubmitting, setIsParentSubmitting] = useState(false)
  const [signupSentEmail, setSignupSentEmail] = useState<string | null>(null)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const { login, isLoggingIn, loginError } = useLoginMutation()
  const pathname = usePathname()

  useEffect(() => {
    if (!isOpen) {
      setIsAdminLoginOpen(false)
      setAdminPassword('')
      setParentPassword('')
      setParentAuthError(null)
      setSignupSentEmail(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  async function handleAdminSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await login(adminUsername, adminPassword)
      setAdminPassword('')
      onSuccess()
    } catch {
      // loginError already reflects the failure via useMutation state
    }
  }

  async function handleParentSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setParentAuthError(null)

    if (parentAuthMode === 'signup' && !parentName.trim()) {
      setParentAuthError('이름을 입력해 주세요.')
      return
    }

    if (parentPassword.length < 8) {
      setParentAuthError('비밀번호는 8자 이상 입력해 주세요.')
      return
    }

    setIsParentSubmitting(true)
    try {
      if (parentAuthMode === 'signup') {
        const trimmedEmail = parentEmail.trim()
        await signupParent({
          name: parentName.trim(),
          email: trimmedEmail,
          password: parentPassword,
        })
        setParentPassword('')
        setSignupSentEmail(trimmedEmail)
      } else {
        await loginParentWithPassword({
          email: parentEmail.trim(),
          password: parentPassword,
        })
        setParentPassword('')
        onParentSuccess()
      }
    } catch (error) {
      setParentAuthError(
        error instanceof ApiError ? error.message : '로그인 처리에 실패했습니다.',
      )
    } finally {
      setIsParentSubmitting(false)
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] grid place-items-center bg-[#2b2418]/45 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <dialog
        open
        aria-modal="true"
        aria-labelledby="login-title"
        className="static max-h-[calc(100vh-48px)] w-full max-w-[440px] overflow-y-auto rounded-[28px] border border-[#f2dfb9] bg-[#fff9ec] p-6 shadow-[0_24px_70px_rgba(48,33,10,0.24)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-[#ffd66b] text-[#2b2418]">
              <LockKeyhole size={22} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-black text-[#e86f00]">생각을 여는 수학</p>
              <h1 id="login-title" className="text-xl font-black text-[#222222]">
                로그인
              </h1>
            </div>
          </div>
          <button
            type="button"
            aria-label="로그인 창 닫기"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#3f3a31] shadow-[0_8px_20px_rgba(48,33,10,0.08)] transition hover:text-[#d6452f]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-5 text-sm font-semibold leading-6 text-[#6a6256]">
          상담 신청은 소셜 계정으로, 학원 관리는 아이디와 비밀번호로 로그인할 수 있습니다.
        </p>

        <form onSubmit={handleParentSubmit} className="mt-6 grid gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-[#fff0cf] p-1">
            <button
              type="button"
              onClick={() => {
                setParentAuthMode('login')
                setParentAuthError(null)
                setSignupSentEmail(null)
              }}
              className={`h-10 rounded-full text-sm font-black transition ${
                parentAuthMode === 'login'
                  ? 'bg-white text-[#e86f00] shadow-[0_8px_18px_rgba(48,33,10,0.08)]'
                  : 'text-[#6a6256]'
              }`}
            >
              일반 로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setParentAuthMode('signup')
                setParentAuthError(null)
                setSignupSentEmail(null)
              }}
              className={`h-10 rounded-full text-sm font-black transition ${
                parentAuthMode === 'signup'
                  ? 'bg-white text-[#e86f00] shadow-[0_8px_18px_rgba(48,33,10,0.08)]'
                  : 'text-[#6a6256]'
              }`}
            >
              회원가입
            </button>
          </div>

          {parentAuthMode === 'signup' && signupSentEmail ? (
            <p className="rounded-2xl bg-[#fff0cf] px-4 py-4 text-sm font-bold leading-6 text-[#6a6256]">
              <span className="text-[#e86f00]">{signupSentEmail}</span>로 인증 메일을
              보냈습니다. 메일함의 링크를 눌러 가입을 완료해 주세요.
            </p>
          ) : (
            <>
              {parentAuthMode === 'signup' && (
                <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
                  이름
                  <input
                    type="text"
                    value={parentName}
                    onChange={(event) => setParentName(event.target.value)}
                    className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
                    required
                  />
                </label>
              )}

              <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
                이메일
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(event) => setParentEmail(event.target.value)}
                  className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
                비밀번호
                <input
                  type="password"
                  value={parentPassword}
                  onChange={(event) => setParentPassword(event.target.value)}
                  className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
                  required
                  minLength={8}
                />
              </label>

              {parentAuthError && (
                <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">
                  {parentAuthError}
                </p>
              )}

              <button
                type="submit"
                disabled={isParentSubmitting}
                className="h-12 rounded-full bg-[#ffd66b] text-sm font-black text-[#2b2418] shadow-[0_14px_28px_rgba(255,214,107,0.34)] transition hover:bg-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isParentSubmitting
                  ? '처리 중...'
                  : parentAuthMode === 'signup'
                    ? '회원가입'
                    : '로그인'}
              </button>
            </>
          )}
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#ead7ad]" />
          <span className="text-xs font-black text-[#8a7a61]">소셜 로그인</span>
          <span className="h-px flex-1 bg-[#ead7ad]" />
        </div>

        <div className="grid gap-3">
          {socialProviders.map((item) => (
            <button
              key={item.provider}
              type="button"
              onClick={() => {
                window.location.href = socialLoginStartUrl(item.provider, redirectTo ?? pathname ?? '/')
              }}
              className={`h-12 rounded-full border px-5 text-sm font-black transition ${item.className}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#ead7ad]" />
          <span className="text-xs font-black text-[#8a7a61]">관리자</span>
          <span className="h-px flex-1 bg-[#ead7ad]" />
        </div>

        <button
          type="button"
          aria-expanded={isAdminLoginOpen}
          onClick={() => setIsAdminLoginOpen((current) => !current)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#ead7ad] bg-white px-5 text-sm font-black text-[#3f3a31] transition hover:border-[#ffd66b] hover:text-[#e86f00]"
        >
          관리자 아이디로 로그인
          <ChevronDown
            size={18}
            strokeWidth={2.5}
            className={`transition ${isAdminLoginOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isAdminLoginOpen && (
          <form onSubmit={handleAdminSubmit} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
              아이디
              <input
                type="text"
                value={adminUsername}
                onChange={(event) => setAdminUsername(event.target.value)}
                className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
                required={isAdminLoginOpen}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
              비밀번호
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
                required={isAdminLoginOpen}
              />
            </label>

            {loginError && (
              <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">
                {loginError instanceof ApiError ? loginError.message : '로그인에 실패했습니다.'}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="h-12 w-full rounded-full bg-[#ffd66b] text-sm font-black text-[#2b2418] shadow-[0_14px_28px_rgba(255,214,107,0.34)] transition hover:bg-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn ? '로그인 중...' : '로그인'}
            </button>
          </form>
        )}
      </dialog>
    </div>
  )
}

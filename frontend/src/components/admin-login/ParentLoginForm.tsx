'use client'

import type { useParentLoginForm } from './useParentLoginForm'

interface ParentLoginFormProps {
  form: ReturnType<typeof useParentLoginForm>
}

export function ParentLoginForm({ form }: ParentLoginFormProps) {
  const {
    mode,
    name,
    email,
    password,
    error,
    isSubmitting,
    signupSentEmail,
    setName,
    setEmail,
    setPassword,
    switchMode,
    handleSubmit,
  } = form

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-full bg-[#fff0cf] p-1">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`h-10 rounded-full text-sm font-black transition ${
            mode === 'login'
              ? 'bg-white text-[#e86f00] shadow-[0_8px_18px_rgba(48,33,10,0.08)]'
              : 'text-[#6a6256]'
          }`}
        >
          일반 로그인
        </button>
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`h-10 rounded-full text-sm font-black transition ${
            mode === 'signup'
              ? 'bg-white text-[#e86f00] shadow-[0_8px_18px_rgba(48,33,10,0.08)]'
              : 'text-[#6a6256]'
          }`}
        >
          회원가입
        </button>
      </div>

      {mode === 'signup' && signupSentEmail ? (
        <p className="rounded-2xl bg-[#fff0cf] px-4 py-4 text-sm font-bold leading-6 text-[#6a6256]">
          <span className="text-[#e86f00]">{signupSentEmail}</span>로 인증 메일을
          보냈습니다. 메일함의 링크를 눌러 가입을 완료해 주세요.
        </p>
      ) : (
        <>
          {mode === 'signup' && (
            <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
              이름
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
                required
              />
            </label>
          )}

          <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
              required
              minLength={8}
            />
          </label>

          {error && (
            <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-full bg-[#ffd66b] text-sm font-black text-[#2b2418] shadow-[0_14px_28px_rgba(255,214,107,0.34)] transition hover:bg-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? '처리 중...'
              : mode === 'signup'
                ? '회원가입'
                : '로그인'}
          </button>
        </>
      )}
    </form>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoginMutation } from './hooks/useLoginMutation'
import { ApiError } from '../../lib/apiClient'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoggingIn, loginError } = useLoginMutation()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await login(username, password)
      navigate('/admin')
    } catch {
      // loginError already reflects the failure via useMutation state
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold text-slate-900">관리자 로그인</h1>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            아이디
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </label>
        </div>

        {loginError && (
          <p className="mt-4 text-sm text-red-600">
            {loginError instanceof ApiError
              ? loginError.message
              : '로그인에 실패했습니다.'}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoggingIn}
          className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoggingIn ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  )
}

import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { loginParentWithPassword, signupParent } from '../../api/auth.api'
import { ApiError } from '../../lib/apiClient'

export type ParentAuthMode = 'login' | 'signup'

export function useParentLoginForm(onSuccess: () => void) {
  const [mode, setMode] = useState<ParentAuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signupSentEmail, setSignupSentEmail] = useState<string | null>(null)

  function switchMode(next: ParentAuthMode) {
    setMode(next)
    setError(null)
    setSignupSentEmail(null)
  }

  function reset() {
    setPassword('')
    setError(null)
    setSignupSentEmail(null)
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (mode === 'signup' && !name.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }

    if (password.length < 8) {
      setError('비밀번호는 8자 이상 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'signup') {
        const trimmedEmail = email.trim()
        await signupParent({
          name: name.trim(),
          email: trimmedEmail,
          password,
        })
        setPassword('')
        setSignupSentEmail(trimmedEmail)
      } else {
        await loginParentWithPassword({
          email: email.trim(),
          password,
        })
        setPassword('')
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인 처리에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
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
    reset,
  }
}

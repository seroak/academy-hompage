import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useLoginMutation } from '../../screens/admin/hooks/useLoginMutation'

export function useAdminLoginForm(onSuccess: () => void) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const { login, isLoggingIn, loginError } = useLoginMutation()

  function toggleExpanded() {
    setIsExpanded((current) => !current)
  }

  function reset() {
    setIsExpanded(false)
    setPassword('')
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await login(username, password)
      setPassword('')
      onSuccess()
    } catch {
      // loginError already reflects the failure via useMutation state
    }
  }

  return {
    username,
    password,
    isExpanded,
    isLoggingIn,
    loginError,
    setUsername,
    setPassword,
    toggleExpanded,
    handleSubmit,
    reset,
  }
}

import { useMutation } from '@tanstack/react-query'
import { login } from '../../../api/auth.api'
import { useAuthStore } from '../../../stores/authStore'

export function useLoginMutation() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken)

  const mutation = useMutation({
    mutationKey: ['admin-login'],
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
    onSuccess: (data) => {
      setAccessToken(data.accessToken, data.admin)
    },
  })

  return {
    login: (username: string, password: string) => mutation.mutateAsync({ username, password }),
    isLoggingIn: mutation.isPending,
    loginError: mutation.error,
  }
}
